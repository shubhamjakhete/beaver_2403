-- Add Total Water Flow + Process Run Hours to fpl_2403
-- Run once in phpMyAdmin (or mysql CLI) against kumarb_2403.
-- Safe to re-run: uses IF NOT EXISTS pattern via information_schema check is manual —
-- if columns already exist, MySQL will error; that's OK.

ALTER TABLE fpl_2403
  ADD COLUMN system_running_hours DOUBLE NULL
    COMMENT 'Process Run Hours (PLC: System_Running_Hours_L)'
    AFTER tank_level_1,
  ADD COLUMN total_flow DOUBLE NULL
    COMMENT 'Total Water Flow (PLC: Total_Flow)'
    AFTER system_running_hours;
