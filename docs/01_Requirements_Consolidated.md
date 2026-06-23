# 01 · Consolidated Requirement Set — HKHT AI for Seva (Phase 1)

**Derived from:** `Design/Phase1_Feature_and_Automation_Inventory_WF006_WF002_WF003.md` (authoritative
Phase-1 inventory) + `Design/00_MASTER_Consolidated_Blueprint_HKHT_AI_For_Seva.docx` (platform blueprint).
**Scope:** WF-006 (CRM/Data Governance), WF-002 (Voice Agent + Follow-up), WF-003 (Digital Marketing) — the
acquisition-to-conversion core.
**Status of this doc:** planning artifact that precedes/accompanies the prototype. Companion files:
`02_Feature_List.md`, `03_Screen_Map_IA.md`, `04_Data_Model.md`, `05_Personas_Roles.md`. Build status is
confirmed in `/FEATURES.md`.

> **Prototype rule (non-negotiable).** This repo is a *demonstration prototype* for dev handoff. All AI,
> voice, WhatsApp, ad, CRM and payment calls are **mocked** with realistic data + simulated latency. The
> heavy automation is presented as running in a mocked backend; a **human keeps full visibility and control**
> (review, approve, correct, override, re-run) at every step.

---

## R0 · The one-line product

> **WF-003 creates demand → WF-006 holds the clean identity → WF-002 converts it → all three write back to
> one record → leadership sees the whole loop.**

Build order is deliberate: **WF-006 first** (the data gate), then WF-002 (conversion engine), then WF-003
(demand factory). Do not scale calling or campaigns on dirty, un-deduplicated, non-consented data.

---

## R1 · Platform-wide requirements (apply to all three workflows)

### R1.1 Shared identity & ERP-ready fields (captured from Day 1)
Every record carries: `Contact_ID`, `Lead_ID`, `Campaign_ID`, `Donor_ID`, `Yatri_ID`, `Event_ID`, `Call_ID`,
`Task_ID`, `Owner_ID`, `Donation_ID`, `Payment_Status`, `Source`, `Created_Date`, `Last_Follow-up_Date`,
`Next_Action`, `Approval_Status`, `Consent/DND_Status`.

**Identity rules (owned by WF-006):** phone is the primary (not only) match signal · no donor/lead/yatri
record without a resolved `Contact_ID` · **high-value donors are never auto-merged** · every merge keeps full
history + audit note (date, rule, approver) · every record keeps **origin source** and **last meaningful
source**.

### R1.2 Automation taxonomy (classifies every feature)
- **Deterministic** — validation, routing, tagging, reminders, status changes, dashboard refresh (no runtime human).
- **AI-assisted** — classification, summarization, drafting, recommendation, anomaly detection (human reviews/approves).
- **Agentic** — multi-step autonomous execution under bounded rules (human governs rules + exceptions).
- **Human-approved** — the decision stays with a person; AI only prepares context.
- **Platform rule:** agentic flows switch on **only after** data quality, approval routing and fallback are validated.

### R1.3 Human-in-the-loop gates (humans decide on)
Donor-sensitive communication · financial/payment corrections & commitments · public communication (ads,
templates, announcements) · devotional/philosophical content (KCKE-grounded + human review) · deity/media
representation · HR/procurement/legal-sensitive decisions. All approvals traceable via `Task_ID` + review
status + decision-log.

### R1.4 Knowledge & media boundaries (KCKE / Media AI)
KCKE = source-grounded Krishna-conscious content, Prabhupada citations, festival/philosophical explanations,
donor narratives — **never** operational status. Media AI = approved visual storytelling only, always
human-approved — **never** the CRM/call-status system. Operational data **never** lives in the KCKE engine.

### R1.5 Service continuity / fallback
Every workflow degrades to a **defined manual path** (priority call sheet, CSV import, manual approval/messaging
queue) with daily reconciliation. **No manually-captured record bypasses reconciliation into CRM.** Fallback
status is shown on dashboards; donor-facing continuity (payment, receipt, sensitive messages) has priority.

### R1.6 Multi-tenant, RBAC & central billing (from the blueprint)
Used by multiple stakeholders, departments and (later) centers. **Role-based access**, **per-center /
per-department usage & cost tracking**, **approval hierarchies** are first-class. Generation / voice / WhatsApp
/ ad APIs are **billed centrally** with transparent chargeback.

### R1.7 Governance & audit
Field-level access control, export/PII logging, consent enforcement, full audit trail (access, export, merge,
approval, consent). Approval routing names an approver + backup + SLA to prevent a single-person (Mukund Prabhu)
bottleneck.

---

## R2 · WF-006 — CRM / DBMS / Data Governance (the data backbone, build #1)
**Platform role:** the single clean, deduplicated, source-tracked, consent-aware identity & relationship layer.
WF-006 *issues* `Contact_ID` to the whole platform. **Trigger:** new data source, campaign import, donor/yatri
update, DND refresh.

12 specialist agents (6.1–6.12): Master Contact Governance · Deduplication & Identity Resolution · DND &
Suppression Governance · Source Attribution & ROI · Segment & Campaign-Fit · Touchpoint Intelligence · Preacher
Relationship Capture · CRM Sync & API Orchestration · Data Quality & Governance Dashboard · Privacy & Access
Control · Relationship Intelligence Graph *(later phase)* · API Registry & Dependency Watch. (Full detail →
`02_Feature_List.md`.)

**Gate (must pass before WF-002/003 scale):** Contact_ID rules, duplicate policy, source fields and consent/DND
model approved.

## R3 · WF-002 — Voice Agent + CRM Follow-up (the conversion engine, build #2)
**Platform role:** converts approved lists into qualified Yatra/donation/cultivation/callback/handoff
opportunities with structured, CRM-ready data. *Must not be reduced to a generic bot.* **Scaled-calling
guardrail:** large/cold lists must pass DND/source-age/suppression/phone-validity/consent/TRAI readiness
(Green/Amber/Red) before calling.

8 specialist agents (2.1–2.8): Campaign Intake & Segmentation · Voice Calling · Intent/Objection/Next-Action
Classifier · Callback & Follow-up Scheduler · WhatsApp Follow-up · Human Escalation & Relationship Handoff ·
CRM Sync & Data Quality · Management Dashboard & QA.

**Gate:** DND/TRAI audit Green, approved scripts, outcome codes mapped to CRM, escalation path defined,
dashboard live, manual fallback tested.

## R4 · WF-003 — Digital Marketing Campaigns (the demand factory, build #4)
**Platform role:** digital acquisition, campaign intelligence and conversion-attribution. *Every rupee of
spend is traceable to lead → call → donation → registration.*

13 specialist agents (3.1–3.13): Campaign Strategy · Audience Intelligence · Content Variant · Creative/Media
Brief · Landing Page QA · Campaign Launch · Daily ROI Optimization · Lead-to-CRM Handoff · Remarketing ·
Campaign Learning · Behavior-Triggered Micro-Campaign *(later)* · Donor Propensity *(later)* · Campaign P&L
Intelligence.

**Gate:** Campaign_ID/source governance live, landing/payment/CRM links QA'd, budget-approval gate working,
lead-to-CRM handoff validated, fallback tested.

---

## R5 · Cross-workflow data handoffs (no manual re-keying)

| From → To | Handed over | Carried IDs |
|---|---|---|
| WF-003 → WF-006 | New campaign lead with source/UTM | `Lead_ID`, `Campaign_ID`, `Source` |
| WF-006 → WF-002 | Clean, deduped, consent-checked, segmented call queue | `Contact_ID`, `Campaign_ID`, segment, consent |
| WF-002 → WF-006 | Call outcome, intent, objection, callback, WhatsApp status | `Contact_ID`, `Call_ID`, `Task_ID`, outcome |
| WF-002 → WF-003 | Conversion outcome for attribution | `Contact_ID`, `Campaign_ID`, `Donation_ID`/registration |
| All → Leadership | KPIs roll up to one command center | all IDs |

**Golden-journey acceptance:** the same person is recognised at every step (Contact_ID), source preserved
end-to-end, nothing dropped between modules, sensitive actions show approval state, the whole journey visible on
the command center — with a manual fallback at every stage.

---

## R6 · Outreach governance (WF-002 & WF-003)
- **Voice/calling readiness — TRAI & DND audit** per list: database source · count validation · freshness ·
  DND/suppression status · phone validity · duplicate status · source tagging · campaign eligibility →
  🟢 proceed / 🟡 pilot only / 🔴 do not launch.
- **Voice script approval lifecycle:** brief → AI+writer draft → reviewer → validated approver → test call (QA)
  → production → improvement. Category approvers: standard (workflow) · donation/donor (donor) · financial
  (finance + workflow) · devotional (content) · escalation/complaint (senior escalation). Backup approver + SLA.
- **WhatsApp governance:** single template inventory, each message mapped to owner/purpose/category
  (Utility/Transactional/Service/Nurture/Reminder)/fallback; opt-out updates CRM; suppressed never messaged;
  rejected templates need fallback wording; high-volume sends need delivery monitoring.

---

## R7 · Integrations & fallbacks (consolidated registry)

| Integration | Workflows | Priority | Status | Fallback |
|---|---|:--:|---|---|
| CRM/DBMS (Hello Leads / internal) | 006/002/003 | P0 | Needs Validation | CSV import + manual |
| Twilio Voice *(replaces Hello Leads dialer)* | 002 | P0 | Needs Validation | Manual call sheet |
| WhatsApp BSP (Interakt/Karix) | 002/003 | P0 | Needs Validation | Manual messaging queue |
| Google Ads / Meta / YouTube / GA4 | 003 | P0 | Needs Validation | Manual report export |
| Payment gateway (Razorpay/PayU/Cashfree) / DCC | 003,(002) | P0 | Needs Validation | Manual status upload |
| Website / landing / forms | 003 | P0 | Needs Validation | Form + sheet capture |
| BigQuery / Looker Studio | 006/002/003 | P0/P1 | Needs Validation | Sheets dashboard |
| Gemini / Vertex AI / Agent Builder | 006/002/003 | P1 | Needs Validation | Human draft-only |
| Cloud Run / Workflows | 006/002 | P1 | Needs Validation | Manual batch sync |
| DND / DLT suppression service | 006/002 | P0 | Needs Validation | Manual suppression list |
| ClickUp / task layer | 002 (003 opt) | P1 | Validate access | CRM tasks / manual |
| ERP-ready layer | 006 (002/003) | P1 | Phased | ERP-ready interim fields |

Each integration in the live API registry carries: name, provider, status (confirmed/pending/blocked/fallback),
access method, owner, blocker, cost implication, production-readiness.

---

## R8 · KPIs (by workflow)
- **WF-006:** duplicate rate ↓ · ID-completion % ↑ · source coverage % ↑ · suppression accuracy ↑ · stale-record
  % ↓ · sync success % ↑ · % workflows on shared data ↑.
- **WF-002:** calls/day & contacts reached ↑ · pickup/connect rate ↑ · intent-capture accuracy ↑ · callback-SLA
  % ↑ · hot-lead leakage ↓ · conversion-after-callback ↑ · cost-per-qualified-lead ↓ · opt-out/complaint ↓ ·
  human time saved ↑.
- **WF-003:** revenue per ₹ spend ↑ · CPL ↓ · ROAS ↑ · time-to-launch ↓ · variants tested ↑ · lead-sync % ↑ ·
  first-follow-up SLA ↓ · remarketing conversion ↑ · rework ↓ · leadership-chasing ↓.

---

## R9 · Go / No-Go gates & acceptance
Sequencing gate (in order): **WF-006 gate → WF-002 gate → WF-003 gate** (see R2–R4). Production-readiness per
workflow: live use with safe data, validated data path with error logging, 5 dashboard families (management /
operational / revenue / data-quality / AI-performance), approval routing with named approver+backup+SLA,
exception handling to a human, validated role ownership, data-quality checks, cross-workflow shared IDs, tested
manual fallback, golden journey passes end-to-end. Acceptance reviews: Day 7 / 14 / 21 / 30.

---

## R10 · Open validations (carried as assumptions in the prototype)
CRM platform & APIs (Hello Leads / Twilio vs Tata Tele) · owners & approval SLAs (RACI "Needs Validation") ·
WhatsApp BSP & approved templates · calling-list size/quality/freshness/DND (Green/Amber/Red) · payment/DCC
exports & UTM conventions · Google Cloud licensing (Gemini/Vertex/Agent Builder).
**Prototype stance:** personas/owners use plausible names as RACI placeholders; vendor APIs shown as
`confirmed/pending/blocked/fallback` in the API Registry; cold-list calling is gated behind the readiness audit.
