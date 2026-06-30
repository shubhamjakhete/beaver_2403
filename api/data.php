<?php
require_once __DIR__ . '/credentials.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->query(
        'SELECT id, event_timestamp,
                ph, orp, tds, do_oxy,
                air_tank_pt1_psi, air_tank_pt2_psi, air_tank_pt3_psi,
                tank_level_1, tank_level_2,
                flow_level, vfd_output_display
         FROM fpl_2403
         ORDER BY event_timestamp DESC
         LIMIT 1'
    );

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'No data']);
        exit;
    }

    // Cast numeric strings to float (or null)
    $numeric = ['ph','orp','tds','do_oxy',
                'air_tank_pt1_psi','air_tank_pt2_psi','air_tank_pt3_psi',
                'tank_level_1','tank_level_2','flow_level','vfd_output_display'];
    foreach ($numeric as $col) {
        $row[$col] = $row[$col] !== null ? (float) $row[$col] : null;
    }
    $row['id'] = (int) $row['id'];

    // Normalise timestamp to ISO 8601 with T separator so new Date() works
    // in all browsers (Safari rejects the space-separated MySQL format).
    if (!empty($row['event_timestamp'])) {
        $row['event_timestamp'] = str_replace(' ', 'T', $row['event_timestamp']);
    }

    // is_live computed entirely in MySQL — no browser clock involved.
    // True when the most recent reading arrived within the last 10 minutes.
    $liveStmt = $pdo->query(
        "SELECT TIMESTAMPDIFF(SECOND, MAX(event_timestamp), NOW()) <= 600 AS is_live
         FROM fpl_2403"
    );
    $liveRow  = $liveStmt->fetch(PDO::FETCH_ASSOC);
    $is_live  = (bool) $liveRow['is_live'];

    echo json_encode([
        'latest'     => $row,
        'updated_at' => $row['event_timestamp'],
        'is_live'    => $is_live,
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
