<?php
require_once __DIR__ . '/credentials.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

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

    echo json_encode([
        'latest'     => $row,
        'updated_at' => $row['event_timestamp'],
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
