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

/** Liveness is determined by MySQL (TIMESTAMPDIFF on the server), not the browser clock. */
export function useIsLive(isLiveFromApi: boolean | undefined): boolean {
  return isLiveFromApi ?? false;
}
