<?php
require_once __DIR__ . '/credentials.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

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
    echo json_encode(['error' => 'Invalid sensor', 'allowed' => $ALLOWED]);
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
    echo json_encode(['error' => 'Invalid period', 'allowed' => array_keys($periodMap)]);
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

    // Column swap: DB column names don't match their physical measurements.
    //   do_oxy     column → ORP (mV)
    //   orp        column → TDS (ppm)
    //   tds        column → DO  (mg/L)
    //   flow_level column → Flow Level (GPM)
    $colSwap = [
        'orp'    => 'do_oxy',
        'tds'    => 'orp',
        'do_oxy' => 'tds',
        // flow_level maps to itself — no entry needed
    ];
    $col = $colSwap[$sensor] ?? $sensor; // all other sensors map to themselves

    if ($period === '24h' || $period === '7d') {
        // Bucket-average to produce smooth lines instead of raw noisy readings.
        // 24h → 15-min buckets  (STEP = 900s,  ~96 points)
        // 7d  → 1-hour buckets  (STEP = 3600s, ~168 points)
        $step = ($period === '24h') ? 900 : 3600;

        $sql = "
            SELECT
                FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(event_timestamp)/$step)*$step) AS bucket,
                AVG($col) AS value,
                MIN($col) AS min_val,
                MAX($col) AS max_val
            FROM fpl_2403
            WHERE event_timestamp >= NOW() - $interval
              AND $col IS NOT NULL
            GROUP BY bucket
            ORDER BY bucket ASC
        ";
        $stmt = $pdo->query($sql);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Build a complete fixed-length grid, null-filling missing buckets
        $points   = ($period === '24h') ? 96 : 168;
        $endTs    = (int) floor(time() / $step) * $step;
        $byBucket = [];
        foreach ($rows as $r) {
            $byBucket[(int) strtotime($r['bucket'])] = $r;
        }

        $data = [];
        for ($i = $points - 1; $i >= 0; $i--) {
            $t = $endTs - $i * $step;
            $r = $byBucket[$t] ?? null;
            $data[] = [
                'event_timestamp' => gmdate('Y-m-d\TH:i:s\Z', $t),
                'value'           => $r ? round((float) $r['value'], 4) : null,
            ];
        }

    } else {
        // 30d / 1y: daily / monthly averages with min/max band
        $groupFmt = $period === '1y' ? '%Y-%m' : '%Y-%m-%d';
        $sql = "
            SELECT DATE_FORMAT(event_timestamp, '$groupFmt') AS event_timestamp,
                   AVG($col) AS avg,
                   MIN($col) AS min,
                   MAX($col) AS max
            FROM fpl_2403
            WHERE event_timestamp >= NOW() - $interval
              AND $col IS NOT NULL
            GROUP BY DATE_FORMAT(event_timestamp, '$groupFmt')
            ORDER BY event_timestamp ASC
        ";
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
    ], JSON_UNESCAPED_SLASHES);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
