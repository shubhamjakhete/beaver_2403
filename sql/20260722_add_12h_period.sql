-- Add 12h period to get_sensor_history (15-min buckets × 48 points).
-- Run in Supabase SQL Editor after the base dashboard RPC migration.

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
