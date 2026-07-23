# BEW-CF15-2403 — Water Treatment Monitoring Dashboard

Dark SCADA/HMI-styled monitoring dashboard for **Beaver EcoWorks** / **Village of Indiantown** (Effluent Treatment Skid **BEW-CF15-2403**).

Built with **Next.js 14** (static export). Live process data is read from **Supabase Postgres** via two RPCs. The UI is deployed to cPanel over FTPS by GitHub Actions.

**Live site:** [https://bew-p2304.com/projects/2403/](https://bew-p2304.com/projects/2403/)  
*(also referenced as [2403.beaverecoworks.com](https://2403.beaverecoworks.com))*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, `output: 'export'`) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Data fetching | TanStack React Query v5 |
| Fonts | Space Grotesk · IBM Plex Mono · Inter (`next/font`) |
| Live data | **Supabase Postgres** + PostgREST RPCs (browser → anon key) |
| Ingest | OPC UA bridge → Supabase `fpl_2403` (outside this repo) |
| CI/CD | GitHub Actions → FTPS → cPanel |

> Legacy PHP + MySQL (`api/*.php`) remains in the repo as unused reference only. The dashboard no longer calls it.

---

## Pages

| Route | Description |
|---|---|
| `/` | **Overview** — pressure gauges, water quality tiles (+ detail modal), process readouts (Total Water Flow, Process Run Hours), tank-level bento (Process Tank / VFD / Flow) with **12h** sparklines |
| `/trends` | **Trends** — chart grid with period chips **12H / 24H / 7D / 30D / 1Y** |
| `/controls` | Placeholder |
| `/alarms` | Placeholder |

---

## Data flow

```
PLC / HMI  →  OPC UA bridge  →  Supabase table fpl_2403 (timestamptz ts, UTC)
                                      ↓
                    RPCs: get_dashboard_data / get_sensor_history
                                      ↓
                    Next.js (lib/api.ts)  →  Overview / Trends UI
```

- Timestamps for the UI are converted in SQL to **naive America/New_York** (`YYYY-MM-DDTHH:MI:SS`, no `Z`).
- `is_live` is computed in Postgres: `(now() - max(ts)) < 600 seconds`.
- **Process Run Hours** is stored as **seconds**; the Overview formats it as PLC-style `D.HH:MM:SS` (e.g. `86.03:37:55`).

Full Supabase setup steps: **[doc/supabase-procedure.md](doc/supabase-procedure.md)**.

---

## Chart periods

| Period | Bucket | Points | Notes |
|---|---|---|---|
| **12h** | 15 min | 48 | Default on Overview charts |
| **24h** | 15 min | 96 | Trends / detail modal |
| **7d** | 1 hour | 168 | |
| **30d** | 1 day | ~30 | avg + min/max band |
| **1y** | 1 month | ~12 | avg + min/max band |

---

## Design System

Dark navy SCADA theme — CSS variables in `app/globals.css`.

```css
--bg-deep:   #050d1a;
--bg-panel:  #0d1a2e;
--accent:    #35c5f0;
--good:      #2fe2a0;
--warn:      #ffb648;
--alarm:     #ff5468;
```

- **Space Grotesk** — titles / nav  
- **IBM Plex Mono** — numeric values  
- **Inter** — body / labels  

---

## Project Structure

```
beaver_2403/
├── app/                      # Overview, Trends, Controls, Alarms
├── components/               # TitleBar, ChartCard, LcdCard, gauges, modal, …
├── lib/
│   ├── api.ts                # Supabase RPC client (get_dashboard_data / get_sensor_history)
│   ├── types.ts              # DashboardData, Period (12h|24h|7d|30d|1y), …
│   ├── hooks.ts
│   ├── thresholds.ts
│   └── utils.ts              # fmt, fmtRunDuration (D.HH:MM:SS), …
├── sql/                      # Run in Supabase SQL Editor (see doc/)
│   ├── 20260722_dashboard_rpc_functions.sql   # view + both RPCs (canonical)
│   ├── 20260722_add_12h_period.sql
│   └── 20260722_dashboard_series_12h.sql
├── doc/
│   └── supabase-procedure.md # How Supabase was wired for this dashboard
├── api/                      # LEGACY PHP (unused) — kept for reference
├── scripts/                  # LEGACY MySQL CSV import (unused)
├── .github/workflows/deploy.yml
└── .env.local                # NEXT_PUBLIC_SUPABASE_URL + ANON_KEY (local)
```

---

## Supabase column → frontend field

Display mapping lives in view `fpl_2403_dashboard` (single place for future swaps).

| Supabase column | Frontend field |
|---|---|
| `ts` | `event_timestamp` (Eastern naive text) |
| `ph` / `orp` / `do_oxy` / `tds` | same names (**unswapped** — see TODO in SQL) |
| `pt1_psi` / `pt2_psi` / `pt3_psi` | `air_tank_pt*_psi` |
| `tank_level` | `tank_level_1` |
| `tank_level_2` | `tank_level_2` |
| `flow_level` | `flow_level` |
| `vfd_output` | `vfd_output_display` |
| `running_hours` | `system_running_hours` (seconds) |
| `total_flow` | `total_flow` |
| `flowmeter_read` | omitted (no UI field yet) |

> Do **not** reuse the old MySQL/PHP `do_oxy`↔`orp`↔`tds` swap for this pipeline unless confirmed and changed in the view only.

---

## Frontend API (Supabase RPCs)

Called from the browser with the **anon** key only (never service_role).

| RPC | Purpose |
|---|---|
| `POST …/rest/v1/rpc/get_dashboard_data` | Latest row + `is_live` + bundled **12h** series |
| `POST …/rest/v1/rpc/get_sensor_history` | Body `{ "sensor", "period" }` → history points |

Shapes match `lib/types.ts` (`DashboardData`, `SensorHistoryResponse`).

---

## Local Development

```bash
git clone https://github.com/shubhamjakhete/beaver_2403.git
cd beaver_2403
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

```bash
npm run dev
# → http://localhost:3000
```

Without env vars, fetches fail and values show `—` (graceful empty state).

---

## Deployment

On every push to `main`:

```
git push → GitHub Actions → npm run build (with Supabase env) → purge remote _next/ → FTPS upload out/
```

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon / publishable key |
| `FTPS_HOST` | cPanel FTP host |
| `FTPS_USER` | FTP user |
| `FTPS_PASS` | FTP password |

### Server notes

- Deploy target: `/bew-p2304.com/projects/2403/`
- Workflow purges `_next/` before upload to avoid disk fill from hashed chunks
- Do **not** enable `dangerous-clean-slate` (it can wipe unrelated server files)
- If FTP sync breaks after a manual delete, remove remote `.ftp-deploy-sync-state.json` and re-run

---

## Alert Thresholds

Edit `lib/thresholds.ts` (warn/alarm bounds). Charts draw selected threshold lines when in range.

---

## Important notes

- **OPC ingest** is outside this repo; this project only reads Supabase.
- **Water-quality tag swaps** for the new pipeline are still under investigation — currently pass-through in `fpl_2403_dashboard`.
- **Controls / Alarms** pages are placeholders.
- Tank capacity scale may still be illustrative pending site confirmation.
- See **[doc/supabase-procedure.md](doc/supabase-procedure.md)** for the full Supabase procedure (SQL order, grants, verification).
