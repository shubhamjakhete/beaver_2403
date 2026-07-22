import type { DashboardData, SensorHistoryResponse, SensorKey, Period } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function callRpc<T>(fn: string, body: Record<string, unknown> = {}): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`${fn} ${res.status}`);
  }

  return res.json();
}

export async function fetchDashboard(): Promise<DashboardData> {
  return callRpc<DashboardData>("get_dashboard_data");
}

export async function fetchSensorHistory(
  sensor: SensorKey,
  period: Period
): Promise<SensorHistoryResponse> {
  return callRpc<SensorHistoryResponse>("get_sensor_history", { sensor, period });
}
