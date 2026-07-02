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

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // ── Latest single row ────────────────────────────────────────────────────
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

    // Cast numerics to float (or null)
    $numeric = ['ph','orp','tds','do_oxy',
                'air_tank_pt1_psi','air_tank_pt2_psi','air_tank_pt3_psi',
                'tank_level_1','tank_level_2','flow_level','vfd_output_display'];
    foreach ($numeric as $col) {
        $row[$col] = $row[$col] !== null ? (float) $row[$col] : null;
    }
    $row['id'] = (int) $row['id'];

    // Normalise to ISO 8601 (Safari rejects the space-separated MySQL format)
    if (!empty($row['event_timestamp'])) {
        $row['event_timestamp'] = str_replace(' ', 'T', $row['event_timestamp']);
    }

    // ── is_live: computed entirely in MySQL, no browser clock ───────────────
    $liveRow = $pdo->query(
        "SELECT TIMESTAMPDIFF(SECOND, MAX(event_timestamp), NOW()) <= 600 AS is_live
         FROM fpl_2403"
    )->fetch(PDO::FETCH_ASSOC);
    $is_live = (bool) $liveRow['is_live'];

    // ── 24h series in 15-minute buckets (96 points) ──────────────────────────
    // Mirrors the 2304 pattern: one bundled response instead of separate calls.
    $seriesStmt = $pdo->query("
        SELECT
            FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(event_timestamp)/900)*900) AS bucket,
            AVG(ph)                 AS ph,
            AVG(orp)                AS orp,
            AVG(tds)                AS tds,
            AVG(do_oxy)             AS do_oxy,
            AVG(air_tank_pt1_psi)   AS air_tank_pt1_psi,
            AVG(air_tank_pt2_psi)   AS air_tank_pt2_psi,
            AVG(air_tank_pt3_psi)   AS air_tank_pt3_psi,
            AVG(tank_level_1)       AS tank_level_1,
            AVG(tank_level_2)       AS tank_level_2,
            AVG(flow_level)         AS flow_level,
            AVG(vfd_output_display) AS vfd_output_display
        FROM fpl_2403
        WHERE event_timestamp >= NOW() - INTERVAL 24 HOUR
        GROUP BY bucket
        ORDER BY bucket ASC
    ");
    $seriesRows = $seriesStmt->fetchAll(PDO::FETCH_ASSOC);

    // Build index keyed by unix timestamp for gap-filling
    $byTs = [];
    foreach ($seriesRows as $r) {
        $byTs[(int) strtotime($r['bucket'])] = $r;
    }

    // Produce exactly 96 evenly-spaced points, null-filling any missing buckets
    $POINTS = 96;
    $STEP   = 900; // 15 minutes in seconds
    $endTs  = (int) floor(time() / $STEP) * $STEP;

    $keys   = $numeric; // same column list
    $S      = array_fill_keys($keys, []);
    $labels = [];

    for ($i = $POINTS - 1; $i >= 0; $i--) {
        $t        = $endTs - $i * $STEP;
        $labels[] = gmdate('H:i', $t);
        $r        = $byTs[$t] ?? null;
        foreach ($keys as $k) {
            $S[$k][] = ($r && $r[$k] !== null) ? (float) $r[$k] : null;
        }
    }

    echo json_encode([
        'latest'     => $row,
        'updated_at' => $row['event_timestamp'],
        'is_live'    => $is_live,
        'series'     => array_merge(['labels' => $labels], $S),
    ], JSON_UNESCAPED_SLASHES);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
