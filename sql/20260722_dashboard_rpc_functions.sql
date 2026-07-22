-- Dashboard RPCs for beaver_2403 frontend (Supabase Postgres).
-- Mirrors the JSON shapes of the retired api/data.php + api/sensor_history.php.
-- Run in the Supabase SQL Editor. Does not modify table data.

-- ═══════════════════════════════════════════════════════════════════════════
-- Display mapping (THE one place for future ph/orp / do_oxy/tds swaps)
-- ═══════════════════════════════════════════════════════════════════════════

-- TODO: ph/orp and do_oxy/tds swaps under investigation (legacy PLC tag
-- mislabeling, unconfirmed for this pipeline). Currently passed through
-- unswapped. When confirmed, swap here only — e.g. alias orp as ph and
-- ph as orp, and/or tds as do_oxy and do_oxy as tds.
CREATE OR REPLACE VIEW public.fpl_2403_dashboard AS
SELECT
  id,
  ts,
  ph            AS ph,
  orp           AS orp,
  do_oxy        AS do_oxy,
  tds           AS tds,
  pt1_psi       AS air_tank_pt1_psi,
  pt2_psi       AS air_tank_pt2_psi,
  pt3_psi       AS air_tank_pt3_psi,
  tank_level    AS tank_level_1,
  tank_level_2  AS tank_level_2,
  flow_level    AS flow_level,
  vfd_output    AS vfd_output_display,
  running_hours AS system_running_hours,
  total_flow    AS total_flow
FROM fpl_2403;

-- ═══════════════════════════════════════════════════════════════════════════
-- get_dashboard_data()  →  DashboardData
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_dashboard_data()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_latest   json;
  v_updated  text;
  v_is_live  boolean;
  v_series   json;
  v_end      timestamptz;
  v_step     interval := interval '15 minutes';
  v_points   int := 96;
BEGIN
  SELECT json_build_object(
           'id',                   id::int,
           'event_timestamp',      to_char(ts AT TIME ZONE 'America/New_York', 'YYYY-MM-DD"T"HH24:MI:SS'),
           'ph',                   ph::float8,
           'orp',                  orp::float8,
           'tds',                  tds::float8,
           'do_oxy',               do_oxy::float8,
           'air_tank_pt1_psi',     air_tank_pt1_psi::float8,
           'air_tank_pt2_psi',     air_tank_pt2_psi::float8,
           'air_tank_pt3_psi',     air_tank_pt3_psi::float8,
           'tank_level_1',         tank_level_1::float8,
           'tank_level_2',         tank_level_2::float8,
           'flow_level',           flow_level::float8,
           'vfd_output_display',   vfd_output_display::float8,
           'system_running_hours', system_running_hours::float8,
           'total_flow',           total_flow::float8
         ),
         to_char(ts AT TIME ZONE 'America/New_York', 'YYYY-MM-DD"T"HH24:MI:SS')
  INTO v_latest, v_updated
  FROM fpl_2403_dashboard
  ORDER BY ts DESC
  LIMIT 1;

  IF v_latest IS NULL THEN
    RETURN json_build_object('error', 'No data');
  END IF;

  SELECT (now() - max(ts)) < interval '600 seconds'
  INTO v_is_live
  FROM fpl_2403;

  v_end := to_timestamp(floor(extract(epoch FROM now()) / 900) * 900);

  WITH grid AS (
    SELECT generate_series(
             v_end - (v_points - 1) * v_step,
             v_end,
             v_step
           ) AS bucket
  ),
  agg AS (
    SELECT
      to_timestamp(floor(extract(epoch FROM ts) / 900) * 900) AS bucket,
      avg(ph)::float8                     AS ph,
      avg(orp)::float8                    AS orp,
      avg(tds)::float8                    AS tds,
      avg(do_oxy)::float8                 AS do_oxy,
      avg(air_tank_pt1_psi)::float8       AS air_tank_pt1_psi,
      avg(air_tank_pt2_psi)::float8       AS air_tank_pt2_psi,
      avg(air_tank_pt3_psi)::float8       AS air_tank_pt3_psi,
      avg(tank_level_1)::float8           AS tank_level_1,
      avg(tank_level_2)::float8           AS tank_level_2,
      avg(flow_level)::float8             AS flow_level,
      avg(vfd_output_display)::float8     AS vfd_output_display,
      avg(system_running_hours)::float8   AS system_running_hours,
      avg(total_flow)::float8             AS total_flow
    FROM fpl_2403_dashboard
    WHERE ts >= now() - interval '24 hours'
    GROUP BY 1
  ),
  filled AS (
    SELECT
      g.bucket,
      a.ph, a.orp, a.tds, a.do_oxy,
      a.air_tank_pt1_psi, a.air_tank_pt2_psi, a.air_tank_pt3_psi,
      a.tank_level_1, a.tank_level_2,
      a.flow_level, a.vfd_output_display,
      a.system_running_hours, a.total_flow
    FROM grid g
    LEFT JOIN agg a ON a.bucket = g.bucket
    ORDER BY g.bucket
  )
  SELECT json_build_object(
    'labels',               coalesce(json_agg(to_char(bucket AT TIME ZONE 'America/New_York', 'HH24:MI') ORDER BY bucket), '[]'::json),
    'ph',                   coalesce(json_agg(ph ORDER BY bucket), '[]'::json),
    'orp',                  coalesce(json_agg(orp ORDER BY bucket), '[]'::json),
    'tds',                  coalesce(json_agg(tds ORDER BY bucket), '[]'::json),
    'do_oxy',               coalesce(json_agg(do_oxy ORDER BY bucket), '[]'::json),
    'air_tank_pt1_psi',     coalesce(json_agg(air_tank_pt1_psi ORDER BY bucket), '[]'::json),
    'air_tank_pt2_psi',     coalesce(json_agg(air_tank_pt2_psi ORDER BY bucket), '[]'::json),
    'air_tank_pt3_psi',     coalesce(json_agg(air_tank_pt3_psi ORDER BY bucket), '[]'::json),
    'tank_level_1',         coalesce(json_agg(tank_level_1 ORDER BY bucket), '[]'::json),
    'tank_level_2',         coalesce(json_agg(tank_level_2 ORDER BY bucket), '[]'::json),
    'flow_level',           coalesce(json_agg(flow_level ORDER BY bucket), '[]'::json),
    'vfd_output_display',   coalesce(json_agg(vfd_output_display ORDER BY bucket), '[]'::json),
    'system_running_hours', coalesce(json_agg(system_running_hours ORDER BY bucket), '[]'::json),
    'total_flow',           coalesce(json_agg(total_flow ORDER BY bucket), '[]'::json)
  )
  INTO v_series
  FROM filled;

  RETURN json_build_object(
    'latest',     v_latest,
    'updated_at', v_updated,
    'is_live',    coalesce(v_is_live, false),
    'series',     v_series
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- get_sensor_history(sensor, period)  →  SensorHistoryResponse
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_sensor_history(sensor text, period text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed text[] := ARRAY[
    'ph', 'orp', 'tds', 'do_oxy',
    'air_tank_pt1_psi', 'air_tank_pt2_psi', 'air_tank_pt3_psi',
    'tank_level_1', 'tank_level_2',
    'flow_level', 'vfd_output_display',
    'system_running_hours', 'total_flow'
  ];
  v_periods text[] := ARRAY['12h', '24h', '7d', '30d', '1y'];
  v_step_secs int;
  v_points    int;
  v_lookback  interval;
  v_end       timestamptz;
  v_data      json;
BEGIN
  IF sensor IS NULL OR NOT (sensor = ANY (v_allowed)) THEN
    RETURN json_build_object('error', 'Invalid sensor', 'allowed', to_json(v_allowed));
  END IF;

  IF period IS NULL OR NOT (period = ANY (v_periods)) THEN
    RETURN json_build_object('error', 'Invalid period', 'allowed', to_json(v_periods));
  END IF;

  IF period IN ('12h', '24h', '7d') THEN
    IF period = '12h' THEN
      v_step_secs := 900;
      v_points    := 48;
      v_lookback  := interval '12 hours';
    ELSIF period = '24h' THEN
      v_step_secs := 900;
      v_points    := 96;
      v_lookback  := interval '24 hours';
    ELSE
      v_step_secs := 3600;
      v_points    := 168;
      v_lookback  := interval '7 days';
    END IF;

    v_end := to_timestamp(floor(extract(epoch FROM now()) / v_step_secs) * v_step_secs);

    WITH valued AS (
      SELECT
        ts,
        CASE sensor
          WHEN 'ph'                   THEN ph
          WHEN 'orp'                  THEN orp
          WHEN 'tds'                  THEN tds
          WHEN 'do_oxy'               THEN do_oxy
          WHEN 'air_tank_pt1_psi'     THEN air_tank_pt1_psi
          WHEN 'air_tank_pt2_psi'     THEN air_tank_pt2_psi
          WHEN 'air_tank_pt3_psi'     THEN air_tank_pt3_psi
          WHEN 'tank_level_1'         THEN tank_level_1
          WHEN 'tank_level_2'         THEN tank_level_2
          WHEN 'flow_level'           THEN flow_level
          WHEN 'vfd_output_display'   THEN vfd_output_display
          WHEN 'system_running_hours' THEN system_running_hours
          WHEN 'total_flow'           THEN total_flow
        END AS val
      FROM fpl_2403_dashboard
    ),
    grid AS (
      SELECT generate_series(
               v_end - (v_points - 1) * make_interval(secs => v_step_secs),
               v_end,
               make_interval(secs => v_step_secs)
             ) AS bucket
    ),
    agg AS (
      SELECT
        to_timestamp(floor(extract(epoch FROM ts) / v_step_secs) * v_step_secs) AS bucket,
        avg(val)::float8 AS value
      FROM valued
      WHERE ts >= now() - v_lookback
        AND val IS NOT NULL
      GROUP BY 1
    )
    SELECT coalesce(
      json_agg(
        json_build_object(
          'event_timestamp', to_char(g.bucket AT TIME ZONE 'America/New_York', 'YYYY-MM-DD"T"HH24:MI:SS'),
          'value', CASE WHEN a.value IS NULL THEN NULL ELSE round(a.value::numeric, 4)::float8 END
        )
        ORDER BY g.bucket
      ),
      '[]'::json
    )
    INTO v_data
    FROM grid g
    LEFT JOIN agg a ON a.bucket = g.bucket;

  ELSE
    IF period = '30d' THEN
      v_lookback := interval '30 days';
    ELSE
      v_lookback := interval '1 year';
    END IF;

    WITH valued AS (
      SELECT
        ts,
        CASE sensor
          WHEN 'ph'                   THEN ph
          WHEN 'orp'                  THEN orp
          WHEN 'tds'                  THEN tds
          WHEN 'do_oxy'               THEN do_oxy
          WHEN 'air_tank_pt1_psi'     THEN air_tank_pt1_psi
          WHEN 'air_tank_pt2_psi'     THEN air_tank_pt2_psi
          WHEN 'air_tank_pt3_psi'     THEN air_tank_pt3_psi
          WHEN 'tank_level_1'         THEN tank_level_1
          WHEN 'tank_level_2'         THEN tank_level_2
          WHEN 'flow_level'           THEN flow_level
          WHEN 'vfd_output_display'   THEN vfd_output_display
          WHEN 'system_running_hours' THEN system_running_hours
          WHEN 'total_flow'           THEN total_flow
        END AS val
      FROM fpl_2403_dashboard
    ),
    agg AS (
      SELECT
        CASE
          WHEN period = '1y' THEN to_char(ts AT TIME ZONE 'America/New_York', 'YYYY-MM')
          ELSE to_char(ts AT TIME ZONE 'America/New_York', 'YYYY-MM-DD')
        END AS event_timestamp,
        avg(val)::float8 AS avg_val,
        min(val)::float8 AS min_val,
        max(val)::float8 AS max_val
      FROM valued
      WHERE ts >= now() - v_lookback
        AND val IS NOT NULL
      GROUP BY 1
      ORDER BY 1
    )
    SELECT coalesce(
      json_agg(
        json_build_object(
          'event_timestamp', event_timestamp,
          'value', avg_val,
          'avg', avg_val,
          'min', min_val,
          'max', max_val
        )
        ORDER BY event_timestamp
      ),
      '[]'::json
    )
    INTO v_data
    FROM agg;
  END IF;

  RETURN json_build_object(
    'sensor', sensor,
    'period', period,
    'data',   coalesce(v_data, '[]'::json)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_data() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_sensor_history(text, text) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
