/**
 * Alert threshold config.
 * null = no threshold active for that direction.
 *
 * Sources (confirmed with site engineer, Jul 2026):
 *   pH        : 7.0–8.5 normal; <6.5 or >9.0 alarm
 *   ORP       : good ~+200 mV; warn <150 mV; alarm ≤0 mV (negative = reducing)
 *   TDS       : warn >800 ppm; alarm >900 ppm
 *   DO        : warn <10 ppm; alarm <8 ppm
 *   flow      : LO warn 900 GPM; LOLO alarm 875 GPM (operational range 900-1007 GPM)
 *   tank_level_2 (Product Tank, 0-200 inH₂O): warn <110 or >180; alarm <80 or ≥199 (overflow)
 */
export const thresholds = {
  ph:               { warnLow: 7.0,  alarmLow: 6.5,  warnHigh: 8.5,  alarmHigh: 9.0  },
  orp:              { warnLow: 150,  alarmLow: 0,    warnHigh: null, alarmHigh: null  },
  tds:              { warnLow: null, alarmLow: null, warnHigh: 800,  alarmHigh: 900   },
  do_oxy:           { warnLow: 10,   alarmLow: 8,    warnHigh: null, alarmHigh: null  },
  air_tank_pt1_psi: { warnLow: null, alarmLow: null, warnHigh: null, alarmHigh: null  },
  air_tank_pt2_psi: { warnLow: null, alarmLow: null, warnHigh: null, alarmHigh: null  },
  air_tank_pt3_psi: { warnLow: null, alarmLow: null, warnHigh: null, alarmHigh: null  },
  tank_level_1:     { warnLow: null, alarmLow: null, warnHigh: null, alarmHigh: null  },
  tank_level_2:     { warnLow: 110,  alarmLow: 80,   warnHigh: 180,  alarmHigh: 199  },
  flow_level:       { warnLow: 900,  alarmLow: 875,  warnHigh: null, alarmHigh: null  },
  vfd_output_display: { warnLow: null, alarmLow: null, warnHigh: null, alarmHigh: null },
};
