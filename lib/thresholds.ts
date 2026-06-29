/**
 * Alert threshold config — intentionally left permissive for now.
 * Set warn/alarm values post-deployment without code changes.
 * null = no threshold active for that direction.
 */
export const thresholds = {
  ph:               { warnLow: null, alarmLow: null, warnHigh: null, alarmHigh: null },
  orp:              { warnLow: null, alarmLow: null, warnHigh: null, alarmHigh: null },
  tds:              { warnLow: null, alarmLow: null, warnHigh: null, alarmHigh: null },
  do_oxy:           { warnLow: null, alarmLow: null, warnHigh: null, alarmHigh: null },
  air_tank_pt1_psi: { warnLow: null, alarmLow: null, warnHigh: null, alarmHigh: null },
  air_tank_pt2_psi: { warnLow: null, alarmLow: null, warnHigh: null, alarmHigh: null },
  air_tank_pt3_psi: { warnLow: null, alarmLow: null, warnHigh: null, alarmHigh: null },
  tank_level_1:     { warnLow: null, alarmLow: null, warnHigh: null, alarmHigh: null },
  tank_level_2:     { warnLow: null, alarmLow: null, warnHigh: null, alarmHigh: null },
  flow_level:       { warnLow: null, alarmLow: null, warnHigh: null, alarmHigh: null },
  vfd_output_display: { warnLow: null, alarmLow: null, warnHigh: null, alarmHigh: null },
} as const;
