# `/data` — the mock backend (JSON "database")

This folder is the prototype's **backend**: one JSON file per table, plus a `manifest.json` index.
At runtime the app fetches these like a REST API (`GET /data/<table>.json`) through the data-access
layer in [`js/api.js`](../js/api.js), with simulated latency and request logging in the browser console
(`[mock-api] GET /data/contacts.json → 200 (64 rows, 12ms)`).

## How loading works
1. `js/app.js` boot → `App.store.load()` checks `sessionStorage` for a working copy.
2. If none, `App.api.loadState()` reads `manifest.json`, then fetches every table and assembles the
   in-memory state object the screens read from.
3. Mutations (approve, merge, call, meter usage, …) update the in-memory store + `sessionStorage`
   (a per-session "working database"). **Reset demo data** re-pulls the canonical tables from `/data`.
4. **Fallback:** if `fetch` is unavailable (e.g. opening `index.html` via `file://`), the app falls back
   to the deterministic in-memory generator in [`js/seed.js`](../js/seed.js) — so it still runs offline.

> Run it via a static server so fetch works: `python -m http.server 8765` (the `seva-prototype` launch
> config), then open `http://localhost:8765`.

## Regenerating the data
`js/seed.js` is the **generator** (deterministic, fixed PRNG seed). The JSON files here are its output.
If you change `seed.js` (fields, volumes, new tables), regenerate the backend:

```bash
node tools/gen-data.js
```

This re-runs the seed in a Node sandbox and rewrites every `data/*.json` + `manifest.json`.
(Editing a JSON file by hand is also fine — it's just data.)

## Tables (47)
Reference: `orgs, centers, departments, roles, users, sources`.
WF-006: `contacts, donors, yatris, leads, suppression, segments, relationships, merges, imports, syncJobs, apiRegistry`.
WF-002: `scripts, calls, tasks, escalations, waTemplates, whatsapp, agentStatus`.
WF-003: `campaigns, content, landingPages, remarketing, triggers, propensity, learnings`.
Platform: `approvals, audit, alerts, notifications, targets, aiAgents, kcke, continuity, golive (in code)`.
Billing: `usage, ledger, budgets, rateCard`.
Working sets (empty at seed): `reworks, savedViews, campaignDrafts`.

Each `manifest.json` entry records `{ key, file, type (array|object), count }`.

## Toward a real backend
`js/api.js` is the single seam to swap in a live API: replace the `fetch('data/<table>.json')` calls
with real endpoints (`GET /api/<table>`), and route store mutations through `POST/PATCH` — the screens,
which only talk to `App.store`, need no changes.
