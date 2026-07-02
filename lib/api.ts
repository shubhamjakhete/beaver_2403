import type { DashboardData, SensorHistoryResponse, SensorKey, Period } from "./types";

// || (not ??) so an empty-string secret also falls back to the default
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://bew-p2304.com/projects/2403/api";

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/data.php`, { cache: "no-store" });
  if (!res.ok) throw new Error(`data.php ${res.status}`);
  return res.json();
}

export async function fetchSensorHistory(
  sensor: SensorKey,
  period: Period
): Promise<SensorHistoryResponse> {
  const res = await fetch(
    `${API_BASE}/sensor_history.php?sensor=${sensor}&period=${period}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`sensor_history.php ${res.status}`);
  return res.json();
}
