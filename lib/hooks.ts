"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboard, fetchSensorHistory } from "./api";
import type { SensorKey, Period } from "./types";

/** Live dashboard — refetches every 30 s. */
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  });
}

/** Sensor history for Trends page. */
export function useSensorHistory(sensor: SensorKey, period: Period) {
  return useQuery({
    queryKey: ["history", sensor, period],
    queryFn: () => fetchSensorHistory(sensor, period),
    placeholderData: (prev) => prev,
  });
}

/** Staleness check: data is "live" if most recent reading is within 10 minutes. */
export function useIsLive(eventTimestamp: string | undefined): boolean {
  if (!eventTimestamp) return false;
  const diff = Date.now() - new Date(eventTimestamp).getTime();
  return diff <= 10 * 60 * 1000;
}
