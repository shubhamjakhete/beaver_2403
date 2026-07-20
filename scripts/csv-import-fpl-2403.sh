#!/bin/bash
# CSV → MySQL importer for fpl_2403
#
# Deploy this file to the mini-computer / hosting cron host.
# Credentials: copy csv-import.credentials.sh.example → csv-import.credentials.sh
# (same directory) and fill in host/user/password/db — never commit the real file.
#
# Cron example (every 5 min):
#   */5 * * * * /home/kumarb/bew-p2403-data/csv-import-fpl-2403.sh >> /home/kumarb/bew-p2403-data/csv-import.log 2>&1

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Prefer credentials next to this script; fall back to data-dir credentials if present.
if [ -f "$SCRIPT_DIR/csv-import.credentials.sh" ]; then
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/csv-import.credentials.sh"
elif [ -f "/home/kumarb/bew-p2403-data/csv-import.credentials.sh" ]; then
  # shellcheck source=/dev/null
  source "/home/kumarb/bew-p2403-data/csv-import.credentials.sh"
else
  echo "$(date '+%Y-%m-%d %H:%M:%S') Missing csv-import.credentials.sh — aborting."
  exit 1
fi

: "${MYSQL_HOST:?}"
: "${MYSQL_USER:?}"
: "${MYSQL_PASSWORD:?}"
: "${MYSQL_DB:?}"
: "${TABLE_NAME:=fpl_2403}"
: "${SOURCE_DIR:?}"
: "${ARCHIVE_DIR:?}"
: "${LOCKDIR:?}"

# mkdir is atomic even on NFS-backed shared hosting. If the lock dir already
# exists, a previous run is still going — skip this cycle entirely.
if ! mkdir "$LOCKDIR" 2>/dev/null; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') Previous run still in progress — skipping this cycle."
  exit 1
fi
trap 'rmdir "$LOCKDIR"' EXIT

mkdir -p "$ARCHIVE_DIR"

shopt -s nullglob
for file in "$SOURCE_DIR"/*.csv; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")

    # OPTIONALLY ENCLOSED BY '"' strips the surrounding quotes this CSV
    # wraps every field in — without it, values like "15.084" import as
    # the literal text "15.084" (quotes included), which fails to parse
    # as a number/date and silently falls back to 0 / zero-date.
    #
    # Column order must match the CSV header after IGNORE 1 LINES.
    # New fields (after tank_level_1):
    #   system_running_hours  ← PLC System_Running_Hours_L (Process Run Hours)
    #   total_flow            ← PLC Total_Flow (Total Water Flow)
    if mysql --local-infile=1 -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DB" \
      -e "LOAD DATA LOCAL INFILE '$file' REPLACE INTO TABLE $TABLE_NAME \
          FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 LINES \
          (event_timestamp, ph, orp, do_oxy, tds, air_tank_pt1_psi, air_tank_pt2_psi, \
           air_tank_pt3_psi, tank_level_2, flow_level, vfd_output_display, \
           tank_level_1, system_running_hours, total_flow, \
           log_date, log_date_time);"
    then
      echo "$(date '+%Y-%m-%d %H:%M:%S') Imported $filename into $TABLE_NAME successfully."
      mv "$file" "$ARCHIVE_DIR/"
    else
      echo "$(date '+%Y-%m-%d %H:%M:%S') Failed to import $filename into $TABLE_NAME — left in place for retry."
    fi
  fi
done
