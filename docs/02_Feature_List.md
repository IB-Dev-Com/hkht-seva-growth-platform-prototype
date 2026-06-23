# 02 · Consolidated Feature List — grouped by WF-006 / WF-002 / WF-003 / Shared

Every agent, automation, dashboard, data entity, integration, governance gate and KPI from the inventory,
consolidated and tagged with **prototype coverage**. Coverage legend: ✅ built · 🟡 partial/representative ·
⬜ later-phase (intentionally out of Phase-1 prototype). Screen names map to `03_Screen_Map_IA.md`.

---

## A · Shared / platform features

| # | Feature | Type | Lives on screen | Coverage |
|---|---|---|---|:--:|
| S1 | Shared IDs on every record (Contact/Lead/Campaign/Donor/Yatri/Call/Task/Donation/Owner/Source/Consent/Approval) | Deterministic | all | ✅ |
| S2 | Golden-journey trace (one Contact_ID end-to-end) + loop-integrity checks | Agentic+human | Golden Journey | ✅ |
| S3 | Leadership command center (cross-WF KPI rollup, decisions, risk, per-center) | AI-assisted | Command Center | ✅ |
| S4 | Unified human-in-the-loop approvals queue (SLA, context pack, audit) | Human-approved | Approvals | ✅ |
| S5 | Multi-tenant scope (per-center / per-department filter) | Deterministic | topbar + all dashboards | ✅ |
| S6 | RBAC (nav filtering + screen access gate) | Deterministic | shell + Roles & Tenants | ✅ |
| S7 | Approval hierarchy (donor/finance/content/leadership + backup + SLA) | Human-approved | Approvals / Roles | ✅ |
| S8 | Central billing & per-center/department usage+cost chargeback | Deterministic | Usage & Cost | ✅ |
| S9 | Full audit trail (access/export/merge/approval/consent) | Deterministic | Roles & Tenants / Contact 360 | ✅ |
| S10 | Service-continuity fallback indicators (manual paths) | Deterministic | Intake / API Registry / notes | 🟡 |
| S11 | KCKE / Media AI boundary (operational data never in knowledge engine) | Governance | design note + content gates | 🟡 |

---

## B · WF-006 — CRM / DBMS / Data Governance

### Agents → automations
| Agent | Key automations | Type | Screen | Coverage |
|---|---|---|---|:--:|
| 6.1 Master Contact Governance | field validation/standardization, mandatory-field enforce, source & source-date tagging, DQ scoring, error/missing-field queue | Deterministic+AI | Intake & Import; Master Contacts | ✅ |
| 6.2 Deduplication & Identity Resolution | fuzzy match (phone/email/name/address), cluster detection, confidence scoring, merge candidates, no-merge flags | AI-assisted + **human merge** | Dedupe & Identity | ✅ |
| 6.3 DND & Suppression Governance | DND/opt-out/unsubscribe checks, suppression enforcement, channel-permission, pre-send eligibility gate | Deterministic | Consent & DND | ✅ |
| 6.4 Source Attribution & ROI | source/campaign/UTM normalization, source-coverage scoring, source→lead→revenue linkage | Deterministic+AI | Contact 360; dashboards | ✅ |
| 6.5 Segment & Campaign-Fit | segmentation (source/lifecycle/tier/geo/lang), exclusion lists, over-contact suppression, retargeting seeds | AI-assisted | Campaigns/Builder (audience) | 🟡 |
| 6.6 Touchpoint Intelligence | touchpoint capture/ordering, last-touch/next-action, engagement history | AI-assisted | Contact 360 timeline | ✅ |
| 6.7 Preacher Relationship Capture | relationship-edge capture, referrer linking, family/community association | AI-assisted | Contact 360 (donor/relationships) | 🟡 |
| 6.8 CRM Sync & API Orchestration | create/update/read sync, retry & error-queue, conflict detection, sync logging | Agentic | API Registry; Intake | 🟡 |
| 6.9 Data Quality & Governance Dashboard | completeness scoring, duplicate/invalid-phone detection, stale detection, owner coverage | Deterministic | Data Quality | ✅ |
| 6.10 Privacy & Access Control | RBAC enforcement, export/download logging, consent enforcement, audit capture | Deterministic + human | Roles & Tenants; Contact 360 | ✅ |
| 6.11 Relationship Intelligence Graph & Journey Timeline | contact↔donor↔yatri↔family↔community graph, journey assembly, NBA seeding | Agentic | — | ⬜ later |
| 6.12 API Registry & Dependency Watch | API status (confirmed/pending/blocked/fallback), dependency monitoring, blocker alerts | Deterministic | API Registry | ✅ |

### Data entities owned
Master Contact · Donor Profile · Yatri Profile · Community/Family · Source Attribution · Follow-up Task ·
Payment/Revenue Link · Consent/Suppression · Data Quality Score · Access/Audit. (Fields → `04_Data_Model.md`.)

### Dashboards
Management · Operational · Revenue/conversion · Data-quality · AI-agent performance → built as **Data Quality**
screen + rollups on Command Center. ✅/🟡

### Integrations & fallbacks
CRM/DBMS (CSV fallback) · BigQuery (Sheets) · Cloud Run/Workflows (manual batch) · DND tools (manual list) ·
ERP-ready layer (interim fields). → API Registry. ✅

### Governance gates
Production import approval · **mandatory human merge** (HNI never auto-merged) · suppression-policy change
approval · access/role change + bulk-export approval. ✅

### KPIs
Duplicate rate ↓ · ID-completion ↑ · source coverage ↑ · suppression accuracy ↑ · stale-record ↓ · sync
success ↑ · % on shared data ↑. → Data Quality + Command Center. ✅

---

## C · WF-002 — Voice Agent + CRM Follow-up

### Agents → automations
| Agent | Key automations | Type | Screen | Coverage |
|---|---|---|---|:--:|
| 2.1 Campaign Intake & Segmentation | list validation, source tagging, dup/DND checks, segment tagging, owner assignment, **call-queue generation + priority** | Deterministic + **list-activation approval** | Calling Readiness; Call Console | ✅ |
| 2.2 Voice Calling | auto-dialling, approved-script delivery, multi-language, retry rules, recording/transcript, outcome capture, objection tagging | Agentic + **script approval** | Call Console | ✅ (simulated) |
| 2.3 Intent / Objection / Next-Action Classifier | outcome-code classification, objection extraction, lead scoring, callback detection, escalation flag, next-action, **confidence scoring** | AI-assisted | Call Console; Call detail | ✅ |
| 2.4 Callback & Follow-up Scheduler | callback-task creation, reminders, overdue queue, SLA tracking, priority escalation | Deterministic | Follow-up Tasks | ✅ |
| 2.5 WhatsApp Follow-up | approved-template send, link insertion, delivery logging, reply capture, opt-out handling | Agentic + **template approval** | WhatsApp Follow-up; Contact 360 | ✅ |
| 2.6 Human Escalation & Relationship Handoff | escalation-task, context/summary pack, talking points, priority-SLA, fundraiser-copilot handoff | **Human-approved** | Escalations | ✅ |
| 2.7 CRM Sync & Data Quality | writeback of call/WhatsApp/task/conversion, sync logging, error queue, dup/suppression alerts | Agentic | (writeback across screens) | ✅ |
| 2.8 Management Dashboard & QA | funnel dashboard, KPI alerts, call-quality sampling, script-issue detection, **Voice of the Devotee** objection/FAQ aggregation | AI-assisted | Voice Dashboard | ✅ |

### Data written
Call (Call_ID, attempt, status, duration, transcript/recording ref) · Follow-up Task · Revenue/Payment ref ·
Governance (owner/approver/backup/escalation) · Relationship-graph edges · **Calling readiness/suppression**
(DND, source age, consent basis, retry limit, calling hours, invalid number, spam flag, TRAI readiness). ✅

### Dashboards
Management · Operational · Revenue/conversion · Data-quality · AI-performance · **Voice of the Devotee** ·
Leadership command-center contribution. → Voice Dashboard + Command Center. ✅

### Integrations & fallbacks
Twilio voice (manual call sheet) · WhatsApp BSP (manual queue) · CRM/Hello Leads (CSV) · Gemini/Vertex (human
draft-only) · Cloud Run (manual sync) · BigQuery/Looker (Sheets) · Payment/DCC (manual upload) · ClickUp (CRM
tasks). → API Registry. ✅

### Governance gates
**Calling readiness Green/Amber/Red** before scaled calling · script approval lifecycle by category ·
low-confidence outcome → human review · sensitive/high-value → escalation · WhatsApp approved-templates-only. ✅

### KPIs
Calls/day ↑ · pickup/connect ↑ · intent accuracy ↑ · callback-SLA ↑ · hot-lead leakage ↓ · conversion-after-
callback ↑ · cost-per-qualified-lead ↓ · opt-out/complaint ↓ · human time saved ↑. → Voice Dashboard. ✅

---

## D · WF-003 — Digital Marketing Campaigns

### Agents → automations
| Agent | Purpose | Type | Screen | Coverage |
|---|---|---|---|:--:|
| 3.1 Campaign Strategy | objective → brief, channel plan, timing, metrics | AI-assisted + **strategy/high-budget approval** | New Campaign builder | ✅ |
| 3.2 Audience Intelligence | recommend segments, suppress low-value/over-contacted, retargeting seed | AI-assisted | Builder (audience step) | 🟡 |
| 3.3 Content Variant | ad/WhatsApp/SMS/RCS/landing copy variants | AI-assisted + **content approval** | Builder; Content & Creative | ✅ |
| 3.4 Creative / Media Brief | poster/reel/storyboard inputs | AI-assisted + **media/deity approval** | Content & Creative | 🟡 |
| 3.5 Landing Page QA | readiness score, issues, launch checklist | Deterministic + **launch approval** | Campaign detail | ✅ |
| 3.6 Campaign Launch | setup checklist, source tags, UTM list | Deterministic + **launch/spend approval** | Builder; Campaign detail | ✅ |
| 3.7 Daily ROI Optimization | monitor spend/leads/donations, pause/scale/shift recommendations | **Agentic (recommend only)** + budget approval | Campaign detail | ✅ |
| 3.8 Lead-to-CRM Handoff | every lead source-tagged & assigned, task/callback | Deterministic | Campaign detail; Master Contacts | ✅ |
| 3.9 Remarketing | low-cost high-ROI donor/yatri audiences, message plan | AI-assisted + **VIP/HNI approval** | — | ⬜ later |
| 3.10 Campaign Learning | preserve what worked/failed → next-season playbook | AI-assisted | — | ⬜ later |
| 3.11 Behavior-Triggered Micro-Campaign | triggers from visits/stalled payments/repeat interest | Agentic | — | ⬜ later |
| 3.12 Donor Propensity & Relationship Intelligence | rank prospects, recommended ask/seva/Yatra | AI-assisted | — | ⬜ later |
| 3.13 Campaign P&L Intelligence | spend → lead → donation → revenue, live per-campaign P&L | AI-assisted + **finance approval** | Campaign detail; Marketing Dashboard | ✅ |

### Data captured/written
`Campaign_ID`, objective, source, audience, channel, owner, approver, budget ceiling, landing page, CRM mapping,
follow-up path, UTM; `Contact_ID`/`Lead_ID` on every lead; `Donation_ID`/`Payment_Status` on conversion. ✅

### Dashboards
Management · Operational · Revenue/conversion · Data-quality · AI-performance. → Marketing Dashboard + Campaign
detail + Command Center. ✅

### Integrations & fallbacks
Google Ads/Meta/YouTube/GA4 (manual export) · website/landing/CMS (form+sheet) · Razorpay/PayU/Cashfree/DCC
(manual upload) · CRM/Hello Leads (CSV) · WhatsApp/SMS/RCS (manual queue) · BigQuery/Looker (Sheets) ·
Gemini/Vertex (human draft) · KCKE/Media AI (curated index / manual creative). → API Registry. ✅/🟡

### Governance gates
Budget changes/thresholds/refunds · donor-sensitive & HNI/CSR/LLP messaging · public copy & templates ·
devotional/philosophical claims · deity/media assets · ROI/P&L reports → all human-approved. ✅

### KPIs
Revenue per ₹ ↑ · CPL ↓ · ROAS ↑ · time-to-launch ↓ · variants tested ↑ · lead-sync ↑ · first-follow-up SLA ↓
· remarketing conversion ↑ · rework ↓ · leadership-chasing ↓. → Marketing Dashboard. ✅

---

## E · Coverage summary (updated — v2.0 full build-out)
- **Built ✅ — everything.** Every agent, automation, dashboard, data entity, governance gate and KPI in the
  inventory now has an interactive mock across **36 screens**. The items previously listed 🟡/⬜ are implemented:
  - 6.5 Segment & Campaign-Fit → **Segment Studio**
  - 6.7 Preacher Relationship Capture + 6.11 Relationship Graph → **Relationship Intelligence**
  - 6.8 CRM Sync & API Orchestration → **CRM Sync**
  - 3.2 Audience Intelligence → **Segment Studio** (consumed in the campaign builder)
  - 3.4 Creative/Media Brief → **Creative & Media**
  - 3.9 Remarketing → **Remarketing** · 3.10 Campaign Learning → **Campaign Learning**
  - 3.11 Behavior-Triggered Micro-Campaigns → **Behavior Triggers** · 3.12 Donor Propensity → **Donor Propensity**
  - S10 Service continuity → **Service Continuity** · S11 KCKE/Media boundary → **KCKE & Media Boundary**
- The inventory's `[Later phase]` tags refer to **production rollout sequencing**, not prototype coverage — in
  this prototype they are fully demonstrable mocks.
