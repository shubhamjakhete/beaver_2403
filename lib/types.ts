export interface SensorRow {
  id: number;
  event_timestamp: string; // ISO datetime
  ph: number | null;
  orp: number | null;
  tds: number | null;
  do_oxy: number | null;
  air_tank_pt1_psi: number | null;
  air_tank_pt2_psi: number | null;
  air_tank_pt3_psi: number | null;
  tank_level_1: number | null;
  tank_level_2: number | null;
  flow_level: number | null;
  vfd_output_display: number | null;
}

export interface DashboardData {
  latest: SensorRow;
  updated_at: string; // ISO — same as latest.event_timestamp for convenience
  is_live: boolean;   // computed by MySQL: TIMESTAMPDIFF(SECOND, MAX(event_timestamp), NOW()) <= 600
}

export type SensorKey =
  | "ph"
  | "orp"
  | "tds"
  | "do_oxy"
  | "air_tank_pt1_psi"
  | "air_tank_pt2_psi"
  | "air_tank_pt3_psi"
  | "tank_level_1"
  | "tank_level_2"
  | "flow_level"
  | "vfd_output_display";

export type Period = "24h" | "7d" | "30d" | "1y";

export interface HistoryPoint {
  event_timestamp: string;
  value: number | null;
  // present on 30d/1y rollup responses
  min?: number | null;
  max?: number | null;
  avg?: number | null;
}

export interface SensorHistoryResponse {
  sensor: SensorKey;
  period: Period;
  data: HistoryPoint[];
}
