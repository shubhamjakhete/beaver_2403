# Supabase procedure — beaver_2403 dashboard

This document records how live process data was moved from the legacy **PHP + MySQL** path to **Supabase Postgres RPCs**, and how to apply / verify that setup.

---

## 1. Background

| Before | After |
|---|---|
| OPC/CSV → MySQL `fpl_2403` on cPanel | OPC UA bridge → Supabase Postgres `fpl_2403` |
| Browser → `api/data.php` / `api/sensor_history.php` | Browser → PostgREST `rpc/get_dashboard_data` / `rpc/get_sensor_history` |
| Credentials in `api/credentials.php` | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

The Next.js static export cannot host Next API routes on cPanel, so the browser calls Supabase directly with the **anon** key. Table access is wrapped in **SECURITY DEFINER** RPCs (do not expose a service_role key in the frontend).

Legacy `api/*.php` and `scripts/csv-import*` remain in git for reference only.

---

## 2. Prerequisites

1. Supabase project with table **`public.fpl_2403`** populated by the OPC bridge.
2. Expected raw columns (at minimum):

   | Column | Type (typical) | Notes |
   |---|---|---|
   | `id` | bigint / int | |
   | `ts` | `timestamptz` | UTC event time |
   | `ph`, `orp`, `do_oxy`, `tds` | numeric | pass-through to UI (unswapped) |
   | `pt1_psi`, `pt2_psi`, `pt3_psi` | numeric | |
   | `tank_level`, `tank_level_2` | numeric | `tank_level` → UI `tank_level_1` |
   | `flow_level`, `vfd_output` | numeric | |
   | `running_hours` | numeric | **seconds** accumulator |
   | `total_flow` | numeric | |
   | `flowmeter_read` | numeric | not exposed to UI yet |

3. GitHub Actions secrets + local `.env.local` with project URL and anon key.

---

## 3. SQL apply order

Run these in the **Supabase SQL Editor** (project → SQL). Prefer the canonical full script on a new project; use the incremental files when upgrading an already-deployed function set.

### Fresh install (recommended)

Run the full file:

```text
sql/20260722_dashboard_rpc_functions.sql
```

This creates/replaces:

1. **View** `public.fpl_2403_dashboard` — sole column rename / future-swap site  
2. **Function** `public.get_dashboard_data()` → JSON matching `DashboardData`  
3. **Function** `public.get_sensor_history(sensor text, period text)` → JSON matching `SensorHistoryResponse`  
4. `GRANT EXECUTE … TO anon, authenticated, service_role`  
5. `NOTIFY pgrst, 'reload schema'`

### Incremental upgrades (if base RPCs already exist)

| File | What it does |
|---|---|
| `sql/20260722_add_12h_period.sql` | Adds period `12h` (48 × 15‑min buckets) to `get_sensor_history` |
| `sql/20260722_dashboard_series_12h.sql` | Overview bundled series: 24h → **12h** in `get_dashboard_data` |

After any replace, wait a few seconds for PostgREST schema reload (or re-run `NOTIFY pgrst, 'reload schema';`).

---

## 4. Display mapping (important)

All UI field names are produced by the view:

```sql
-- TODO in SQL: ph/orp and do_oxy/tds swaps under investigation for THIS pipeline.
-- Currently unswapped. Change aliases HERE only when confirmed.
CREATE OR REPLACE VIEW public.fpl_2403_dashboard AS
SELECT
  id, ts,
  ph AS ph, orp AS orp, do_oxy AS do_oxy, tds AS tds,
  pt1_psi AS air_tank_pt1_psi,
  pt2_psi AS air_tank_pt2_psi,
  pt3_psi AS air_tank_pt3_psi,
  tank_level AS tank_level_1,
  tank_level_2 AS tank_level_2,
  flow_level AS flow_level,
  vfd_output AS vfd_output_display,
  running_hours AS system_running_hours,
  total_flow AS total_flow
FROM fpl_2403;
```

**Do not** copy the old MySQL/PHP three-way `do_oxy`/`orp`/`tds` swap into these RPCs unless product confirms it for the OPC pipeline.

### Timezone

- Storage: `ts` as `timestamptz` (UTC).  
- API output: `to_char(ts AT TIME ZONE 'America/New_York', 'YYYY-MM-DD"T"HH24:MI:SS')` — **no `Z` / offset**, so the browser does not double-shift Eastern wall times.

---

## 5. RPC behavior summary

### `get_dashboard_data()`

Returns:

- `latest` — newest mapped row (floats / nulls, `id` int)  
- `updated_at` — same string as `latest.event_timestamp`  
- `is_live` — `(now() - max(ts)) < interval '600 seconds'`  
- `series` — **12h**, 15‑minute buckets, **48** points, null gap-filled; keys match `SeriesData` + `labels` (`HH24:MI`)

Empty table → `{ "error": "No data" }`.

### `get_sensor_history(sensor, period)`

- Validates `sensor` against the 13 UI field names and `period` against `12h|24h|7d|30d|1y`.  
- Invalid input → `{ "error": "…", "allowed": […] }` (HTTP still 200; frontend treats this as failure).  
- `12h` / `24h` / `7d`: fixed grid, avg, null gap-fill.  
- `30d` / `1y`: daily / monthly avg+min+max.

---

## 6. Frontend wiring

`lib/api.ts`:

```http
POST {SUPABASE_URL}/rest/v1/rpc/get_dashboard_data
POST {SUPABASE_URL}/rest/v1/rpc/get_sensor_history
Content-Type: application/json
apikey: {ANON_KEY}
Authorization: Bearer {ANON_KEY}
```

Body for history: `{ "sensor": "ph", "period": "12h" }`.

Build / CI injects:

- `NEXT_PUBLIC_SUPABASE_URL`  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  

---

## 7. Verification checklist

1. **SQL Editor**

   ```sql
   SELECT public.get_dashboard_data();
   SELECT public.get_sensor_history('ph', '12h');
   SELECT public.get_sensor_history('ph', '24h');
   ```

   Confirm JSON has `latest` / `data`, not only `error`.

2. **curl** (replace URL/key):

   ```bash
   curl -sS -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/get_sensor_history" \
     -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"sensor":"ph","period":"12h"}'
   ```

3. **UI**

   - Overview LIVE chip tracks `is_live`.  
   - Overview tank / VFD / flow footers say `15-min avg · 12h`.  
   - Trends **12H** chip draws a line (not blank / not “Invalid period”).  
   - Process Run Hours looks like `86.03:37:55`, not millions of “hours”.

4. **If Trends 12H is blank**

   Usually the `12h` RPC upgrade was not applied — run `sql/20260722_add_12h_period.sql`.

---

## 8. Security notes

- Use **anon** key only in the static frontend / GitHub `NEXT_PUBLIC_*` secrets.  
- Never commit `service_role` or database passwords.  
- Prefer RPCs + `SECURITY DEFINER` over opening broad `SELECT` to `anon` on the raw table (tighten RLS as needed for your org).  
- Rotating the anon key requires updating GitHub secrets and redeploying.

---

## 9. Related repo paths

| Path | Role |
|---|---|
| `sql/20260722_dashboard_rpc_functions.sql` | Canonical view + both RPCs |
| `sql/20260722_add_12h_period.sql` | History `12h` period |
| `sql/20260722_dashboard_series_12h.sql` | Dashboard bundled series → 12h |
| `lib/api.ts` | Browser RPC client |
| `lib/types.ts` | Response TypeScript contracts |
| `api/*.php` | Retired MySQL API (reference only) |
