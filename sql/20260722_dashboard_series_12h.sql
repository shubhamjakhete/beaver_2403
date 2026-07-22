-- Overview bundled series: 24h → 12h (48 × 15-min buckets).
-- Run in Supabase SQL Editor.

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
  v_points   int := 48; -- 12h × 15-min buckets
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
    WHERE ts >= now() - interval '12 hours'
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

GRANT EXECUTE ON FUNCTION public.get_dashboard_data() TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
