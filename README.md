# BEW-2403 — Water Treatment Monitoring Dashboard

A dark SCADA/HMI-styled water treatment monitoring dashboard built for **Beaver EcoWorks** and the **Village of Indiantown**. Built with Next.js 14, deployed as a static export to a cPanel server via GitHub Actions.

**Live URL:** [https://2403.beaverecoworks.com](https://2403.beaverecoworks.com)

---

## Screenshots

> Overview — Air Tank Pressure, Water Quality, Process Readouts, Tank Levels, Trend Strip

> Trends — 6 chart cards, 4 time ranges (24H / 7D / 30D / 1Y)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, static export) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Data fetching | TanStack React Query v5 |
| Icons | Lucide React |
| Animation | Framer Motion |
| Fonts | Space Grotesk · IBM Plex Mono · Inter (via `next/font`) |
| Backend | PHP 8 + MySQL (uploaded manually to cPanel) |
| CI/CD | GitHub Actions → FTPS to cPanel |

---

## Pages

| Route | Description |
|---|---|
| `/` | **Overview** — live sensor readouts: Air Tank Pressure (3 radial gauges), Water Quality (pH / ORP / TDS / DO), Process Readouts (Flow / VFD / Tank Level / Efficiency), Tank Levels (capsule gauges), Trend Strip preview |
| `/trends` | **Trends** — 6 chart cards (pH, TDS, DO, Tank Level, Flow Rate, VFD Output) across 24H / 7D / 30D / 1Y time ranges |
| `/controls` | **Controls** — placeholder (not built yet) |
| `/alarms` | **Alarms** — placeholder (not built yet) |

---

## Design System

Dark navy SCADA theme. All values are CSS custom properties defined in `app/globals.css`.

```css
--bg-deep:   #050d1a;   /* page background */
--bg-panel:  #0d1a2e;   /* card panels */
--bg-lcd:    #071a12;   /* LCD readout background */
--accent:    #35c5f0;   /* primary cyan — water quality, chart lines */
--good:      #2fe2a0;   /* green — process readouts, live status */
--warn:      #ffb648;   /* amber — warnings */
--alarm:     #ff5468;   /* red — alarms */
```

**Fonts:**
- **Space Grotesk** — panel titles, headers, nav labels
- **IBM Plex Mono** — every numeric sensor value (signature visual detail)
- **Inter** — body text, labels, units

---

## Project Structure

```
beaver_2403/
├── app/
│   ├── layout.tsx              # Root layout: fonts, QueryProvider, TitleBar, BottomNav
│   ├── page.tsx                # Overview page
│   ├── trends/page.tsx         # Trends page
│   ├── controls/page.tsx       # Placeholder
│   └── alarms/page.tsx         # Placeholder
├── components/
│   ├── TitleBar.tsx            # Device tag, live clock, LIVE chip, logos
│   ├── StatusStrip.tsx         # Mode/State/Health/Comms pills (isLive-driven)
│   ├── BottomNav.tsx           # usePathname() active-tab routing
│   ├── PanelShell.tsx          # Reusable dark panel wrapper
│   ├── RadialGauge.tsx         # 270° SVG arc gauge — independently scaled per PT
│   ├── LcdCard.tsx             # LCD readout card (green or cyan variant)
│   ├── TankCapsule.tsx         # Capsule fill gauge with floating % badge
│   ├── TrendStripPreview.tsx   # Sparkline strip linking to /trends
│   ├── ChartCard.tsx           # Recharts ComposedChart (line / area+line)
│   └── QueryProvider.tsx       # TanStack React Query client provider
├── lib/
│   ├── types.ts                # SensorRow, DashboardData, Period, HistoryPoint
│   ├── thresholds.ts           # Alert threshold config (permissive defaults)
│   ├── api.ts                  # fetchDashboard, fetchSensorHistory
│   ├── hooks.ts                # useDashboard, useSensorHistory, useIsLive
│   └── utils.ts                # cn, fmt, fmtSigned helpers
├── api/                        # PHP backend — upload to cPanel manually, never by CI
│   ├── credentials.php         # gitignored — fill in on server only
│   ├── data.php                # Returns latest sensor row
│   └── sensor_history.php      # Returns time-series for a sensor + period
├── public/
│   ├── village-logo.png        # Village of Indiantown seal
│   └── beaver-logo.png         # Beaver EcoWorks logo
├── .github/workflows/
│   └── deploy.yml              # Build → FTPS deploy (skips api/)
├── next.config.mjs             # output: 'export', trailingSlash, images.unoptimized
└── .env.local                  # NEXT_PUBLIC_API_URL (local dev only)
```

---

## Database

- **Host:** `localhost`
- **Table:** `fpl_2403`
- **Credentials:** defined in `api/credentials.php` on the server — never committed

### Column Mapping

| MySQL column | TypeScript key | UI panel |
|---|---|---|
| `event_timestamp` | `event_timestamp` | Time axis everywhere |
| `ph` | `ph` | Water Quality |
| `orp` | `orp` | Water Quality |
| `tds` | `tds` | Water Quality |
| `do_oxy` | `do_oxy` | Water Quality |
| `air_tank_pt1_psi` | `air_tank_pt1_psi` | Air Tank Pressure — PT-1 (0–50 psi) |
| `air_tank_pt2_psi` | `air_tank_pt2_psi` | Air Tank Pressure — PT-2 (0–150 psi) |
| `air_tank_pt3_psi` | `air_tank_pt3_psi` | Air Tank Pressure — PT-3 (0–10 psi) |
| `tank_level_1` | `tank_level_1` | Tank Levels + Process Readouts |
| `tank_level_2` | `tank_level_2` | Tank Levels |
| `flow_level` | `flow_level` | Process Readouts |
| `vfd_output_display` | `vfd_output_display` | Process Readouts |
| `log_date` | — | Not used |
| `log_date_time` | — | Not used |

> `event_timestamp` is the sole time axis — it carries full datetime + millisecond precision and reflects actual sensor reading time. `log_date` and `log_date_time` are excluded from all dashboard logic.

> `ph` and `orp` are trusted exactly as named — the import pipeline corrects any historical column swap upstream of this table.

---

## API Endpoints

Both files live in `api/` and must be **uploaded to cPanel manually**. GitHub Actions never touches the `api/` directory.

### `GET /api/data.php`

Returns the most recent row from `fpl_2403`.

```json
{
  "latest": {
    "id": 12345,
    "event_timestamp": "2026-06-29T22:30:00.000Z",
    "ph": 7.21,
    "orp": 318.4,
    "tds": 124,
    "do_oxy": 8.6,
    "air_tank_pt1_psi": 38.2,
    "air_tank_pt2_psi": 112.5,
    "air_tank_pt3_psi": 7.1,
    "tank_level_1": 64,
    "tank_level_2": 61,
    "flow_level": 184,
    "vfd_output_display": 47
  },
  "updated_at": "2026-06-29T22:30:00.000Z"
}
```

### `GET /api/sensor_history.php?sensor=ph&period=24h`

**`sensor`** — any column key from the table above  
**`period`** — `24h` | `7d` | `30d` | `1y`

- `24h` / `7d` → raw rows, ordered by `event_timestamp`
- `30d` / `1y` → daily/monthly aggregation (`avg`, `min`, `max`)

```json
{
  "sensor": "ph",
  "period": "24h",
  "data": [
    { "event_timestamp": "2026-06-29T00:00:00Z", "value": 7.18 },
    { "event_timestamp": "2026-06-29T01:00:00Z", "value": 7.21 }
  ]
}
```

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/shubhamjakhete/beaver_2403.git
cd beaver_2403

# 2. Install
npm install

# 3. Set API URL (points to live server by default)
cp .env.local.example .env.local   # or edit .env.local directly

# 4. Dev server
npm run dev
# → http://localhost:3000
```

> Without a live API, all sensor values will show `—`. The dashboard degrades gracefully — no crashes.

---

## Deployment

Deployment is fully automated via GitHub Actions on every push to `main`.

### Flow

```
git push → GitHub Actions → npm run build → out/ → FTPS → cPanel
```

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://2403.beaverecoworks.com/api` |
| `FTPS_HOST` | cPanel FTP hostname |
| `FTPS_USER` | FTP username |
| `FTPS_PASS` | FTP password |

### Server Directory Layout

```
2403.beaverecoworks.com/
├── index.html              ← Overview (generated by Next.js export)
├── trends/index.html
├── controls/index.html
├── alarms/index.html
├── _next/...               ← JS/CSS build assets
└── api/                    ← PHP files — uploaded manually, never by CI
    ├── data.php
    ├── sensor_history.php
    └── credentials.php     ← gitignored, filled in on cPanel only
```

> The `api/` directory is excluded from all CI deploys — PHP files and credentials are managed directly on the server.

---

## Configuration

### Alert Thresholds

Edit `lib/thresholds.ts` to set warn/alarm boundaries post-deployment. All values are `null` (inactive) by default — no code changes needed to the dashboard once values are filled in:

```ts
export const thresholds = {
  ph: { warnLow: 6.5, alarmLow: 6.0, warnHigh: 8.0, alarmHigh: 8.5 },
  // ...
};
```

### Efficiency Formula

The **Efficiency** readout in Process Readouts is a static `—` placeholder. When the formula is defined, swap in the value in `app/page.tsx`:

```tsx
// Before (placeholder):
<LcdCard label="Efficiency" value={null} unit="%" variant="good" />

// After (real formula):
<LcdCard label="Efficiency" value={computedEfficiency} unit="%" variant="good" />
```

---

## Status Strip Logic

The status strip derives all state from a single freshness check:

```
isLive = (now − MAX(event_timestamp)) ≤ 10 minutes
```

| Pill | isLive = true | isLive = false |
|---|---|---|
| MODE | AUTO (always) | AUTO (always) |
| STATE | RUNNING | STALE |
| HEALTH | NORMAL | WARNING |
| COMMS | ACTIVE | LOST |

> There are no per-equipment tags in the schema. The system health indicators are **pipeline freshness proxies only** — they do not reflect the actual state of individual valves, pumps, or sensors.

---

## Notes

- **Tank level scale** is illustrative — confirmed tank capacity has not been provided. All capsule gauges display the caveat *"Illustrative scale, pending confirmed tank capacity."*
- **30D / 1Y rollup** queries raw rows directly (daily/monthly `GROUP BY`). A pre-aggregated table pipeline is not yet built. The dashboard shows a prominent warning banner when these ranges are active.
- **Controls** and **Alarms** pages are placeholders — out of scope for this build.
