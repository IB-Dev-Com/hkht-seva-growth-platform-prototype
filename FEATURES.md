# Features — HKHT AI for Seva (Phase 1 Prototype)

Feature → Screen → Status. Status legend: ✅ Built (interactive mock) · 🟡 Partial · ⬜ Not in prototype (later phase).

> **Prototype scope.** The heavy work (dedupe, calling, transcription, intent classification, campaign
> optimisation, content drafting) is presented as **automated in a mocked backend**, with a **human in
> full control** — review, approve, correct, override, re-run. No live APIs.

## Plan confirmation (read first)

The upfront analysis & planning artifacts live in **`docs/`** and are the source of truth for scope:

1. **`docs/01_Requirements_Consolidated.md`** — full requirement set derived from the Phase-1 inventory + master blueprint.
2. **`docs/02_Feature_List.md`** — every agent, automation, dashboard, data entity, integration, governance gate & KPI (grouped by WF-006 / WF-002 / WF-003 / shared) with coverage.
3. **`docs/03_Screen_Map_IA.md`** — every screen, the navigation between them, and which features live on each.
4. **`docs/04_Data_Model.md`** — mock entities + fields + sample seed records using the shared IDs.
5. **`docs/05_Personas_Roles.md`** — persona/role list + access & approval matrix.

**Scaffold status — ✅ in place** (foundation, not deprecated, refined as planning surfaced gaps):
- Routing: `js/router.js` (hash router) + route table & RBAC gate in `js/app.js`.
- Shared mock-data store: `js/store.js` (state, session, pub/sub, sessionStorage persistence, mutations) + deterministic seed `js/seed.js`.
- Layout shell: sidebar (RBAC-filtered nav) + topbar (center/department scope + persona switcher) + content, in `js/app.js`.
- Design system: `css/tokens.css` · `base.css` · `layout.css` · `components.css`; component library `js/components.js`.
- **Refinement from this planning pass:** added the **Org / Center Admin** (`org_admin`) role/persona (Gauranga Das) to complete the requested persona set — additive, nothing removed.

The table below confirms which planned features are already built vs. partial vs. later-phase.

## Platform foundations

| Feature | Screen | Status |
|---|---|:--:|
| Shared IDs on every record (Contact/Lead/Campaign/Call/Task/Donation/Owner/Source/Consent/Approval) | All | ✅ |
| Client-side routing + session-persistent state + reset | (shell) | ✅ |
| Role-based access control (nav + screen gating) | (shell) / Roles & Tenants | ✅ |
| Multi-tenant: per-center & per-department scope filter | Topbar / all dashboards | ✅ |
| Persona switcher (12 personas across roles) | Topbar / Login | ✅ |
| Approval hierarchy (donor/finance/content/leadership + backup + SLA) | Approvals / Roles | ✅ |
| Central billing & per-center/department cost tracking | Usage & Cost | ✅ |
| Responsive, accessible UI; warm seva design system | All | ✅ |

## Leadership & cross-workflow

| Feature | Screen | Status |
|---|---|:--:|
| Cross-workflow KPI rollup (revenue, spend, ROAS, DQ, consent) | Command Center | ✅ |
| Golden-journey funnel + loop integrity | Command Center / Golden Journey | ✅ |
| Trace one Contact_ID end-to-end with shared IDs | Golden Journey | ✅ |
| Decisions-required & attention/risk panels | Command Center | ✅ |
| Per-center performance comparison | Command Center | ✅ |
| Unified human-in-the-loop approvals queue + audit | Approvals | ✅ |
| AI-agent performance dashboard (suggestions, approval/rejection, accuracy, hallucination flags, overrides, human-review queue, SLA) | AI Agent Performance | ✅ |
| Source → revenue attribution (spend→lead→call→donation→payment/receipt→repeat; join keys) | Source → Revenue | ✅ |
| Production readiness & golden-journey QA (sequencing gates, checklist, QA test cases, 30/60/75 roadmap) | Production Readiness | ✅ |

## WF-006 — CRM / DBMS / Data Governance

| Feature | Screen | Status |
|---|---|:--:|
| Master contact governance (validation, source tagging, DQ score) | Master Contacts / Intake | ✅ |
| Contact 360 (timeline, donor, Yatra, governance, audit, NBA) | Contact detail | ✅ |
| Deduplication & identity resolution (fuzzy match + confidence) | Dedupe & Identity | ✅ |
| Mandatory human merge approval; no auto-merge of HNI donors | Dedupe & Identity | ✅ |
| DND & suppression governance + pre-send eligibility gate | Consent & DND | ✅ |
| Source attribution & ROI linkage (origin + last source) | Contact detail / dashboards | ✅ |
| Intake/import with validation, DQ score, error queue, approval | Intake & Import | ✅ |
| Data Quality & Governance dashboard + gate status | Data Quality | ✅ |
| Privacy & access control: export/PII audit log | Contact detail / Roles & Tenants | ✅ |
| API Registry & dependency watch (status/owner/blocker/fallback) | API Registry | ✅ |
| Touchpoint intelligence (chronological timeline) | Contact detail | ✅ |
| Segment & campaign-fit studio (source/lifecycle/tier/geo/lang, exclusions, retargeting seed) | Segment Studio | ✅ |
| Preacher relationship capture (referrer/family/community edges + post-meeting voice-note → structured update → approval) | Relationship Graph | ✅ |
| Community / Family profile (Community_ID, Family_ID, gated community, links) | Contact 360 (governance tab) | ✅ |
| Relationship Intelligence graph ("Follow-the-Devotee") + NBA | Relationship Graph | ✅ |
| CRM sync & API orchestration (sync/retry/error queue/conflict) | CRM Sync | ✅ |

## WF-002 — Voice Agent + CRM Follow-up

| Feature | Screen | Status |
|---|---|:--:|
| Campaign intake → validated, prioritized call queue | Call Console | ✅ |
| Calling readiness — TRAI/DND audit with Green/Amber/Red gate | Calling Readiness | ✅ |
| Voice calling agent — live simulated call + script delivery | Call Console | ✅ |
| Transcript capture + recording reference | Call Console / Call detail | ✅ |
| Intent / objection / next-action classification + confidence | Call Console / Call detail | ✅ |
| Low-confidence routing to human review; human override | Call detail | ✅ |
| Callback & follow-up scheduler (SLA, overdue, reassign) | Follow-up Tasks | ✅ |
| WhatsApp follow-up (approved templates + delivery/reply log) | WhatsApp Follow-up | ✅ |
| WhatsApp governance register (provider, DLT, category, opt-out, fallback, delivery monitoring) | WhatsApp Follow-up (governance tab) | ✅ |
| Human escalation & relationship handoff (context pack) | Escalations | ✅ |
| Voice script approval lifecycle (category-based approvers) | Voice Scripts | ✅ |
| Voice dashboard + Voice of the Devotee objection aggregation | Voice Dashboard | ✅ |
| Consent/DND enforced before any call | Call Console / Contact detail | ✅ |

## WF-003 — Digital Marketing Campaigns

| Feature | Screen | Status |
|---|---|:--:|
| Campaign strategy brief (AI-assisted, human-owned) | New Campaign builder | ✅ |
| Audience intelligence / segments | Segment Studio (WF-006) / New Campaign | ✅ |
| Content variant agent (ad/WhatsApp/landing copy) | New Campaign / Content & Copy | ✅ |
| Creative/media brief + approval (storyboard, deity/media gate) | Creative & Media | ✅ |
| Landing page QA (score + issues + fix) | Campaign detail | ✅ |
| Campaign launch (UTM/source tags, approval gate) | New Campaign builder | ✅ |
| Daily ROI optimization (agentic recommendations, human-approved) | Campaign detail | ✅ |
| Lead-to-CRM handoff (source-tagged, SLA) | Campaign detail | ✅ |
| Remarketing agent (low-cost high-ROI audiences, VIP approval) | Remarketing | ✅ |
| Campaign learning / institutional memory (playbooks) | Campaign Learning | ✅ |
| Campaign P&L intelligence (spend→lead→donation) | Campaign detail / Marketing Dashboard | ✅ |
| Behavior-triggered micro-campaigns (stalled pay/revisit/annual/event) | Behavior Triggers | ✅ |
| Donor propensity & relationship intelligence (ranked prospects, handoff pack) | Donor Propensity | ✅ |
| Marketing dashboard (revenue, channels, funnel, P&L) | Marketing Dashboard | ✅ |

## Governance & continuity (cross-cutting)

| Feature | Screen | Status |
|---|---|:--:|
| Human-in-the-loop gates on sensitive actions | Approvals + per-screen | ✅ |
| Consent / DND enforcement end-to-end | Consent & DND / Call Console | ✅ |
| Source attribution preserved end-to-end | Golden Journey / dashboards | ✅ |
| Manual fallback paths (CSV import, manual queues, fallback APIs) | Intake / API Registry / notes | ✅ |
| Full audit trail (access, export, merge, approval, consent) | Roles & Tenants / Contact detail | ✅ |
| Service continuity & fallback (incidents, manual paths, 5-step review, reconciliation) | Service Continuity | ✅ |
| KCKE / Media AI boundary (knowledge citations, media approval, operational data never in engine) | KCKE & Media Boundary | ✅ |

> **Build-out note (v2.0).** Every agent, automation, dashboard, data entity, governance gate and KPI in the
> inventory is now represented as an interactive mock — including items previously marked 🟡/⬜. The ⬜
> "later-phase" tags from the inventory are implemented here as demonstrable mock screens (the platform is a
> prototype, so "later-phase" refers to production rollout sequencing, not prototype coverage).
