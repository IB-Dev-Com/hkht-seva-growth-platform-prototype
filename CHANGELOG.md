# Changelog — HKHT AI for Seva (Phase 1 Prototype)

All notable changes to this prototype are recorded here. This is a **demonstration prototype**
for developer handoff: all AI / voice / WhatsApp / ad / CRM / payment calls are **mocked** with
realistic data and simulated latency. No live backend.

## [0.4.1] — 2026-06-23 — Cross-screen wiring (one continuous loop)

Closed every cross-screen dead-end so the three workflows behave as ONE clickable loop and the Phase-1 golden
journey is fully traversable by clicking shared IDs. Added cache-busting `?v=` to all script tags.

- **Golden-journey hops now clickable both ways:** Call detail → Campaign_ID, its callback Task, WhatsApp
  follow-up and full Journey; Tasks → originating Call; Call Console queue name → Contact 360.
- **WF-003 ↔ WF-002 loop closed:** Campaign detail now shows a **Voice activity** card linking to the
  campaign-filtered Voice Dashboard (`?campaign=`) and Calling Readiness; Voice Dashboard honours the filter.
- **WF-006 spine links:** Dedupe record Contact_IDs, Consent/suppression rows, and attribution per-source rows
  all navigate to Contact 360 / filtered Master Contacts (`?source=`, `?campaign=`, `?f=`).
- **ID chips made clickable** across Scripts, Content, Creative, KCKE media → Campaign detail; Billing ledger
  `refId` → its Call/Campaign.
- **Approvals drawer** gained an "Open in its screen →" deep-link per artifact type; Intake pending imports link
  into the Approvals queue and imported batches link to contacts.
- Added `source` filter param to Master Contacts; verified the chain campaign → contacts → 360 → call → detail →
  campaign and the universal-ID Golden-Journey search resolve end to end.

## [0.4.0] — 2026-06-23 — Gap-analysis remediation (all 75 gaps implemented)

Implemented every gap from `gap-analysis.html` across the five personas, multi-tenant central billing, and
micro-level tracking. Foundation-first: shared store/UI primitives, then applied across screens. The prototype
grew from 39 → **46 screens**; zero console errors; all screens verified.

### New platform primitives (store / components / shell)
- **SLA engine** — `slaPolicies` + `store.slaState()` + live countdown `ui.slaBadge`; auto-escalation on breach.
- **Status lifecycles** — `LIFECYCLES` map + guarded `store.actions.transition()` (illegal jumps blocked).
- **Comments / @mentions** — `ui.commentThread()` + `addComment` (mentions raise notifications).
- **Notifications** + **Alerts** — per-user notification bell + threshold alert inbox in the topbar.
- **Command palette** — ⌘/Ctrl-K global search across screens, contacts, campaigns, calls, IDs.
- **Sortable + paginated tables**, **CSV export** (`util.toCSV`/`download`), field-level audit (before→after).
- **Org tier** (Org → Center → Department) + **entitlements** gating + **platform-admin / center-admin** roles.

### New screens (7)
- **My Work** (`/mywork`) — personalised pending inbox (approvals for your role, tasks, escalations, rework, alerts).
- **Rework Queue** (`/rework`) — done-vs-needs-improvement loop.
- **SLA Board** (`/sla`) — on-track / at-risk / breached across tasks, escalations, approvals.
- **Billing & Statements** (`/billing`) — per-center/dept chargeback statements, budgets & caps with enforcement, event-level usage **ledger**, editable **rate card**.

### Per-persona remediation (highlights)
- **Steward (WF-006):** inline record editing + field-level history/revert; field-level **merge resolver**; bulk select/actions; exception drill-through + assign-queue; segment **rule builder w/ live count**; CRM-sync field diff; API test-connection + uptime sparkline; consent basis/expiry; comments + dup banner on Contact 360.
- **Voice ops (WF-002):** manual **disposition form**, manual dial / skip / bump / pause; QA scorecard + coaching; live SLA countdowns + my/team + snooze; escalation SLA + reassign + priority + comments; WhatsApp conversation thread + template editor; script editor + version diff; dashboard date-range; readiness per-item remediation + re-run.
- **Campaign manager (WF-003):** pause/resume/clone; builder draft persistence + editable AI output + audience step + playbook prefill; apply-and-track optimization; creative-level metrics; content inline edit + versioning; remarketing detail drawer (member preview, message plan, schedule).
- **Approver:** artifact preview by type; approve-with-changes / request-info; comments; role filter + bulk approve; delegation/OOO; my-decisions; SLA.
- **Leadership:** clickable KPI drill-through; targets (target-vs-achieved); alerts feed; data-freshness stamp; universal-ID Golden-Journey search.

### Multi-tenant & central billing
Org→Center→Dept hierarchy & scope; event-level usage ledger keyed to user + Call/Campaign/Message ID; per-center/dept budget **caps with hard-stop enforcement** (blocks + raises a budget-increase approval); chargeback **statements** (GL, GST, export); editable **rate card** w/ per-org overrides; budget forecast/burn-down; alert thresholds; **module entitlements** per center; platform-admin vs center-admin; full tenant scoping.

### Micro-level tracking
Status lifecycles; rework loop; My Work inbox; SLA engine + board; field-level/filterable/exportable audit; comments/@mentions; content/script versioning + diff; workload view; approval evidence.

## [0.3.0] — 2026-06-23 — Google Partner Brief alignment (WF-002/003/006)

Read the six Google Partner Briefs (Document-B 30-day production briefs + scope-alignment notes for WF-002,
WF-003, WF-006) and implemented the items they emphasise that weren't yet dedicated screens. Briefs extracted to
`Design/_extracted/` for reference. Most brief content already matched the prototype; the net-new build:

### New platform screens (3)
- **AI Agent Performance** (`/ai-performance`) — the "AI-agent performance dashboard" named in all three briefs:
  per-agent suggestions, approval/rejection rate, accuracy, hallucination/error flags, human-review queue,
  overrides adopted, SLA improvement, incidents — across all 12 agents, filterable by workflow.
- **Source → Revenue Attribution** (`/attribution`) — spend → lead → call → registration/donation →
  payment/receipt → repeat-cultivation funnel with per-source ROAS and the explicit join-key chain
  (Source/UTM → Lead_ID → Contact_ID → Call_ID → Donation_ID → Payment_Status).
- **Production Readiness & Golden-Journey QA** (`/golive`) — go/no-go sequencing gates (WF-006 → WF-002 →
  WF-003, dynamically evaluated), production-readiness checklist, golden-journey QA test cases, and the
  30 / 60 / 75-day roadmap with Day 7/14/21/30 acceptance reviews.

### Refinements to existing screens (kept the better version, deepened it)
- **Relationship Graph** — added the Preacher Relationship Capture voice-note flow (record → Gemini transcribe →
  structured fields → human approval before save), per the brief's explicit "no secret recording" guidance.
- **WhatsApp Follow-up** — added a Governance Register tab (provider/BSP, DLT registration, category, opt-out
  handling, template-rejection fallback, delivery monitoring, report cadence).
- **Contact 360** — added a Community & Family section (Community_ID, Family_ID, gated community, relationship
  links) on the governance tab.
- Seed: added `aiAgents` performance dataset (12 agents). Nav + routes registered; all RBAC/tenant-scoped.

## [0.2.0] — 2026-06-23 — Full feature build-out (every agent in the inventory)

Implemented **all remaining features** across WF-006, WF-002 and WF-003 — every agent, automation, dashboard,
data entity, governance gate and KPI now has an interactive mock. Items previously 🟡 partial or ⬜ later-phase
are now built. Added planning docs under `docs/` (requirements, feature list, screen map, data model, personas).

### New screens (10) + data
- **WF-006 Segment Studio** (`6.5`) — audiences by source/lifecycle/tier/geo/language, exclusion lists,
  over-contact suppression, retargeting seeds, sensitive-audience approval.
- **WF-006 Relationship Intelligence** (`6.7` + `6.11`) — "Follow-the-Devotee" SVG graph, referrer/family/
  community edges, relationship capture, next-best-action seeds.
- **WF-006 CRM Sync** (`6.8`) — sync jobs, retries, error queue, identity-conflict resolution, sync logging, fallback.
- **WF-003 Creative & Media Brief** (`3.4`) — storyboard frames, media assets, deity/media approval gate.
- **WF-003 Remarketing** (`3.9`) — low-cost high-ROI audiences, VIP/HNI approval, over-contact guard.
- **WF-003 Campaign Learning** (`3.10`) — season playbooks (what worked/failed), reuse, closeout intelligence.
- **WF-003 Behavior Triggers** (`3.11`) — micro-campaigns from stalled payments/revisits/annual patterns/events.
- **WF-003 Donor Propensity** (`3.12`) — ranked prospects, recommended ask/seva, AI fundraiser handoff pack.
- **Service Continuity** (shared) — incidents, active fallbacks, 5-step post-incident review, reconciliation.
- **KCKE & Media-AI Boundary** (shared) — knowledge citations, media-asset approval, explicit boundary rules.
- New store actions (approveSegment, retrySync, resolveConflict, addRelationship, activateRemarketing,
  toggleTrigger, decideMedia, resolveIncident) + seed entities (segments, relationships, syncJobs, remarketing,
  learnings, triggers, propensity, continuity, kcke). Nav grouped & RBAC-scoped; routes registered.
- **Roles:** added `org_admin` (Org / Center Admin) persona to complete the requested role set.

## [0.1.0] — 2026-06-23 — Initial prototype build

### Platform foundation
- Self-contained, multi-screen web app (HTML/CSS/JS, no build step, runs from a static server or `file://`).
- Modular architecture: shared mock-data store (`js/store.js`), deterministic seed (`js/seed.js`),
  hash router (`js/router.js`), reusable component library (`js/components.js`), per-screen modules.
- Session-persistent state (`sessionStorage`) with **Reset demo data** action.
- Design system: warm "seva" palette (saffron + indigo), tokens, responsive + accessible UI,
  KPI cards, tables, drawers, modals, toasts, timelines, funnels, charts, risk gates, status badges.
- **Multi-tenant + RBAC from day one**: persona switcher, per-center / per-department scope filter,
  role-based navigation and access gating, approval hierarchies.

### WF-006 — CRM / DBMS / Data Governance (the identity spine)
- Master Contacts list with search/filter, Contact_ID, source tagging, consent state, DQ score.
- Contact 360 (relationship timeline, donor profile, Yatra profile, record & governance, audit log, next-best-action).
- Deduplication & Identity Resolution with confidence scoring and **mandatory human merge approval**
  (high-value donors never auto-merged).
- Data Quality & Governance dashboard (distribution, owner coverage, exception queues, gate status).
- Consent & DND Suppression governance (suppression list, pre-send eligibility gate, DND scrub).
- Intake & Import (CSV validation, DQ scoring, error queue, human approval before production import).
- API Registry & Dependency Watch (status, owner, blocker, cost, fallback per integration).

### WF-002 — Voice Agent + CRM Follow-up (the conversion engine)
- Calling Readiness — TRAI/DND audit with 🟢/🟡/🔴 risk gate per list before any scaled calling.
- Voice Call Console — **live simulated call** with streaming transcript, AI intent/outcome
  classification, confidence scoring, automatic task/WhatsApp/escalation side-effects.
- Call detail / transcript review with human confirm/override of AI classification.
- Callback & Follow-up Tasks with SLA tracking, overdue escalation, reassignment.
- WhatsApp Follow-up (approved-template inventory + delivery/reply log).
- Escalations & Relationship Handoff (AI context pack + talking points; human owns the decision).
- Voice Script Approval lifecycle (brief → draft → review → approve → QA → production).
- Voice Dashboard + **Voice of the Devotee** objection aggregation.

### WF-003 — Digital Marketing Campaigns (the demand factory)
- Campaigns list/pipeline with spend, leads, ROAS, approval state.
- Campaign detail — ROI, live P&L, 14-day trend, **daily ROI optimization recommendations**
  (agentic, human-approved — no auto-spend), landing QA, lead-to-CRM handoff.
- New Campaign builder — 4-step wizard (objective → AI strategy brief → AI content variants → approval gate).
- Content & Creative approval queue (devotional/donor-sensitive content requires human sign-off).
- Marketing Dashboard (revenue trend, channel performance, conversion funnel, top campaigns).

### Cross-workflow & leadership
- **Leadership Command Center** — cross-workflow KPI rollup, golden-journey funnel, decisions
  required, attention/risk, per-center performance, central usage spend.
- **Golden Journey** — trace one Contact_ID end-to-end (WF-003 → WF-006 → WF-002 → conversion)
  with shared IDs, consent state and loop-integrity checks.
- **Approvals** — unified human-in-the-loop queue with SLA, context packs, approve/reject + audit.
- **Usage & Cost** — central billing with per-center / per-department chargeback allocation.
- **Roles & Tenants** admin — users/roles/access, centers/departments, full audit trail.
