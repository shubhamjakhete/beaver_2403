<?php
require_once __DIR__ . '/credentials.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Allowed sensors (map to column names — no reserved-word issues)
$ALLOWED = [
    'ph', 'orp', 'tds', 'do_oxy',
    'air_tank_pt1_psi', 'air_tank_pt2_psi', 'air_tank_pt3_psi',
    'tank_level_1', 'tank_level_2',
    'flow_level', 'vfd_output_display',
];

$sensor = $_GET['sensor'] ?? '';
$period = $_GET['period'] ?? '24h';

if (!in_array($sensor, $ALLOWED, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid sensor']);
    exit;
}

$periodMap = [
    '24h' => 'INTERVAL 24 HOUR',
    '7d'  => 'INTERVAL 7 DAY',
    '30d' => 'INTERVAL 30 DAY',
    '1y'  => 'INTERVAL 1 YEAR',
];

if (!isset($periodMap[$period])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid period']);
    exit;
}

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $interval = $periodMap[$period];
    $col = $sensor; // already validated

    // 24h / 7d: raw rows ordered by event_timestamp
    if ($period === '24h' || $period === '7d') {
        $sql = "SELECT event_timestamp, $col AS value
                FROM fpl_2403
                WHERE event_timestamp >= NOW() - $interval
                  AND $col IS NOT NULL
                ORDER BY event_timestamp ASC";
        $stmt = $pdo->query($sql);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $data = array_map(function ($r) {
            return [
                'event_timestamp' => $r['event_timestamp'],
                'value'           => (float) $r['value'],
            ];
        }, $rows);
    } else {
        // 30d / 1y: daily/monthly aggregation
        // NOTE: pre-aggregated tables are not built yet — this queries raw rows directly.
        // Replace with optimised aggregation tables when available.
        $groupFmt = $period === '1y' ? '%Y-%m' : '%Y-%m-%d';
        $sql = "SELECT DATE_FORMAT(event_timestamp, '$groupFmt') AS event_timestamp,
                       AVG($col) AS avg,
                       MIN($col) AS min,
                       MAX($col) AS max
                FROM fpl_2403
                WHERE event_timestamp >= NOW() - $interval
                  AND $col IS NOT NULL
                GROUP BY DATE_FORMAT(event_timestamp, '$groupFmt')
                ORDER BY event_timestamp ASC";
        $stmt = $pdo->query($sql);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $data = array_map(function ($r) {
            return [
                'event_timestamp' => $r['event_timestamp'],
                'value'           => (float) $r['avg'],
                'avg'             => (float) $r['avg'],
                'min'             => (float) $r['min'],
                'max'             => (float) $r['max'],
            ];
        }, $rows);
    }

    echo json_encode([
        'sensor' => $sensor,
        'period' => $period,
        'data'   => $data,
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
