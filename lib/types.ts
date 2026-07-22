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
  /** Process run accumulator in seconds (PLC System_Running_Hours_L); UI formats as D.HH:MM:SS */
  system_running_hours: number | null;
  /** Total Water Flow — PLC Total_Flow */
  total_flow: number | null;
}

export interface SeriesData {
  labels: string[];
  ph: (number | null)[];
  orp: (number | null)[];
  tds: (number | null)[];
  do_oxy: (number | null)[];
  air_tank_pt1_psi: (number | null)[];
  air_tank_pt2_psi: (number | null)[];
  air_tank_pt3_psi: (number | null)[];
  tank_level_1: (number | null)[];
  tank_level_2: (number | null)[];
  flow_level: (number | null)[];
  vfd_output_display: (number | null)[];
  system_running_hours: (number | null)[];
  total_flow: (number | null)[];
}

export interface DashboardData {
  latest: SensorRow;
  updated_at: string; // ISO — same as latest.event_timestamp for convenience
  is_live: boolean;   // computed by MySQL: TIMESTAMPDIFF(SECOND, MAX(event_timestamp), NOW()) <= 600
  series: SeriesData; // 24h history in 15-min buckets, bundled with the snapshot
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
  | "vfd_output_display"
  | "system_running_hours"
  | "total_flow";

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
