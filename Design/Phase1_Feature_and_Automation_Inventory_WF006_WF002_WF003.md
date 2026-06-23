# Phase 1 Build — Feature & Automation Inventory
## WF-006 · WF-002 · WF-003 — the Acquisition-to-Conversion Core

**Document type:** Build-ready feature & automation specification (Phase 1)
**Workflows covered:** WF-006 CRM / DBMS / Data Governance · WF-002 Voice Agent + CRM Follow-up · WF-003 Digital Marketing Campaigns
**Platform:** HKHT AI for Seva — Hyderabad AI Revenue & Seva Growth Platform
**Stack:** Google-first — Gemini Enterprise · Vertex AI / Agent Builder · Apps Script / AppSheet / Sheets · Cloud Run / Workflows · BigQuery / Looker Studio, plus essential external vendors (WhatsApp BSP, Twilio voice, payment gateways)
**Operating model:** 30-Day Production Base → 60-Day Stabilization → 75-Day Enterprise Scale
**Status:** Phase-1 implementation inventory v1.0

---

## 0. How to read this document

This is the master feature-and-automation checklist for the first three workflows HKHT is building. For each workflow it lists:

- **Agents** — every specialist agent, what it does, and the exact automations inside it (inputs, outputs, data, tools, human-approval points, escalation, success metrics).
- **Feature classification** — every capability tagged by *automation type*: **Deterministic** (rules), **AI-assisted** (drafting/classification), **Agentic** (autonomous multi-step under guardrails), or **Human-approved** (decision stays with a person).
- **Data model** — the entities and fields each workflow owns or writes.
- **Dashboards** — the views each workflow publishes (and what rolls up to leadership).
- **Integrations** — the connectors needed, with fallback for each.
- **Governance** — approval gates, consent/DND, audit.
- **KPIs** — how success is measured.
- **Build phasing** — what ships in Day 1–7 / 8–14 / 15–30.

Each capability is also marked with a **build tag** the implementation partner should confirm:
`[Buildable now]` `[Needs HKHT data]` `[Needs CRM/API]` `[Needs vendor]` `[Needs Google Cloud]` `[Human-approval design]` `[Later phase]`.

---

## 1. Phase 1 at a glance

### 1.1 Why these three first

These three workflows are not independent — they are a single revenue loop:

> **WF-003 creates demand → WF-006 holds the clean identity → WF-002 converts it → all three write back to one record.**

| WF | Name | Build sequence | Role in Phase 1 |
|----|------|:---:|------|
| **WF-006** | CRM / DBMS / Data Governance | **#1 (foundation)** | The clean, deduplicated, source-tagged, consent-aware identity spine every other workflow reads & writes. |
| **WF-002** | Voice Agent + CRM Follow-up | **#2** | Converts leads/lists into qualified, called, followed-up, escalated opportunities. |
| **WF-003** | Digital Marketing Campaigns | **#4** | Generates attributed leads and traces every rupee of spend to revenue. |

> **Recommended build order: WF-006 → WF-002 → WF-003.** WF-006 is the gate: do not scale calling (WF-002) or campaigns (WF-003) on dirty, un-deduplicated, non-consented data. Stand up the data backbone first, then switch on the conversion engines against it.

### 1.2 The Phase-1 golden journey (acceptance backbone)

```
WF-003 campaign  →  Campaign_ID + source tag  →  Lead captured
        ↓
WF-006 identity resolution (dedupe, consent/DND, source attribution, Contact_ID)
        ↓
WF-002 voice call → transcript → intent/outcome → callback / WhatsApp follow-up → human escalation
        ↓
Registration / donation / handoff  →  CRM updated  →  Leadership dashboard
```

Acceptance is not "each screen works." It is: **the same person is recognised at every step (Contact_ID), the source is preserved end-to-end, nothing is dropped between modules, sensitive actions show approval state, and the whole journey is visible on the command center — with a manual fallback at every stage.**

### 1.3 Phase-1 scale of automation

| Workflow | Specialist agents | Primary automation outcome |
|----------|:---:|------|
| WF-006 | 12 | Clean, unified, compliant, attributed identity & relationship data |
| WF-002 | 8 | High-volume calling, structured outcomes, zero follow-up leakage |
| WF-003 | 12 | Attributed demand, daily ROI optimisation, clean lead handoff |
| **Total** | **32 agents** | One acquisition-to-conversion revenue loop |

---

## 2. Shared foundations (apply to all three workflows)

### 2.1 Shared identity & ERP-ready fields (capture from Day 1)

Every Phase-1 record must carry these IDs/fields even before ERP exists:

`Contact_ID` · `Lead_ID` · `Campaign_ID` · `Donor_ID` · `Yatri_ID` · `Event_ID` · `Call_ID` · `Task_ID` · `Owner_ID` · `Donation_ID` · `Payment_Status` · `Source` · `Created_Date` · `Last_Follow-up_Date` · `Next_Action` · `Approval_Status` · `Consent/DND_Status`

**Identity rules (owned by WF-006):**
- Phone number is the **primary** match signal — but not the only one.
- **No donor/lead/yatri record is created without a resolved `Contact_ID`.**
- High-value donor records are **never auto-merged** — human review required.
- Every merge keeps full history + an audit note (date, rule, approver).
- Every record retains **origin source** and **last meaningful source**.

### 2.2 Automation taxonomy (used to classify every feature)

| Type | Definition | Human involvement |
|------|------------|-------------------|
| **Deterministic** | Fixed rules: validation, routing, tagging, reminders, status changes, dashboard refresh. | None at runtime |
| **AI-assisted** | Classification, summarization, drafting, recommendation, anomaly detection. | Human reviews/approves output |
| **Agentic** | Multi-step autonomous execution under bounded rules (call, schedule, escalate, sync). | Human governs rules + exceptions |
| **Human-approved** | The decision itself stays with a person; AI only prepares context. | Human decides |

> **Platform rule:** Agentic workflows are switched on **only after** data quality, approval routing and fallback paths are validated.

### 2.3 Human-in-the-loop gates (platform-wide; all three workflows obey)

AI prepares decision-quality context; **humans decide** on:

- Donor-sensitive communication
- Financial / payment corrections & commitments
- Public communication (ads, templates, announcements)
- Devotional / philosophical content (KCKE-grounded + human review)
- Deity / media representation
- HR / procurement / legal-sensitive decisions

All approvals are traceable via `Task_ID`, review status and decision-log entries.

### 2.4 Knowledge & media boundaries (KCKE / Media AI)

- **KCKE** is used only for source-grounded Krishna-conscious content, Srila Prabhupada citations, festival/philosophical explanations and donor narratives — **never** for operational status (contact, call, payment, task, inventory).
- **Media AI** is used only for approved visual storytelling (reels, storyboards, Yatra/festival/donor media) — **never** as the CRM or call-status system; all public output is human-approved.

### 2.5 Service continuity (all three)

If automation, an API, a dashboard or a vendor fails, each workflow **degrades to a defined manual path** (priority call sheet, CSV import, manual approval queue) with daily reconciliation. **No manually-captured record bypasses later reconciliation into CRM.** Fallback status is shown on dashboards; donor-facing continuity (payment, receipt, sensitive messages) has priority.

---

# WF-006 — CRM / DBMS / Data Governance
### The data backbone (build sequence #1 — the gate before everything else)

**Platform role:** The single clean, deduplicated, source-tracked, consent-aware identity and relationship layer that every other workflow reads and writes through. WF-006 *issues* `Contact_ID` to the whole platform.
**Trigger:** New data source, campaign import, donor/yatri update, or DND refresh.
**Owner / backup / approver:** Sachi Pr + Hemchand / Venkat / CRM-DBMS owner *(all owners Needs Validation via RACI pack)*.
**Source of truth:** Contacts, donors, yatris, source attribution, suppression status, relationship timelines.

### WF-006 · Agents & their automations

Each agent below lists **Purpose · Automations · Inputs · Outputs · Human approval · Escalation · Success metric**.

#### 6.1 Master Contact Governance Agent  `[Buildable now]` `[Needs HKHT data]`
- **Purpose:** Validate, standardize and prepare incoming contact data before it enters CRM, campaign, calling or dashboards.
- **Automations:** field validation & standardization (phone/email/name/city/language), mandatory-field enforcement, source & source-date tagging, data-quality scoring, error/missing-field queue generation.
- **Inputs:** CSV/Sheet/CRM export/form data; source list; consent/suppression list.
- **Outputs:** clean import file, error log, missing-field queue, data-quality score.
- **Data:** Name, mobile, email, city, source, source date, consent, segment, owner, Created_Date.
- **Tools:** Sheets/AppSheet/Apps Script (MVP); BigQuery/Cloud Run/CRM API (later).
- **Human approval:** before production import or bulk update.
- **Escalation:** missing source, missing consent, high duplicate risk, high-value donor conflict.
- **Metric:** % valid records, raw→campaign-ready time, rejected-record rate.

#### 6.2 Deduplication & Identity Resolution Agent  `[Needs CRM/API]` `[Human-approval design]`
- **Purpose:** Identify duplicate contacts across Hello Leads, internal CRM, Sheets, Yatra/donor lists and calling systems.
- **Automations:** fuzzy matching (phone/email/name/address), duplicate-cluster detection, confidence scoring, merge-candidate generation, no-merge exception flags.
- **Inputs:** contact exports, phone/email/name/address, donation/Yatra IDs.
- **Outputs:** merge candidates, confidence score, duplicate clusters, no-merge exceptions.
- **Tools:** Python/Cloud Run matching; BigQuery at scale; CRM API for updates.
- **Human approval:** **mandatory** for merges — especially donor/Yatra/payment-linked records.
- **Escalation:** conflicting donation history, conflicting consent, HNI/CSR donor duplicates.
- **Metric:** duplicate reduction, merge accuracy, false-merge rate.

#### 6.3 DND & Suppression Governance Agent  `[Needs HKHT data]` `[Human-approval design]`
- **Purpose:** Prevent wrong, duplicate, non-consented or opt-out outreach before any campaign/calling batch.
- **Automations:** DND/opt-out/unsubscribe checking, suppression-list enforcement, not-interested flagging, channel-permission checks, eligibility gating before any send/call.
- **Inputs:** campaign list, DND list/API, unsubscribe list, not-interested list.
- **Outputs:** eligible-to-contact list, suppression blocks, suppression reasons.
- **Human approval:** suppression-policy changes.
- **Escalation:** ambiguous consent, unknown source lists.
- **Metric:** suppression accuracy, blocked-contact count, compliance rate.

#### 6.4 Source Attribution & ROI Agent  `[Needs CRM/API]`
- **Purpose:** Guarantee every record keeps origin and last meaningful source, enabling source→revenue linkage.
- **Automations:** source/campaign/event/referral/website tagging, UTM/source normalization, source-coverage scoring, source→lead→revenue linkage.
- **Outputs:** source attribution per record, source-coverage report, cost/revenue linkage seed.
- **Metric:** source coverage %, attribution completeness.

#### 6.5 Segment & Campaign-Fit Agent  `[AI-assisted]`
- **Purpose:** Build eligible, well-formed segments for campaigns and calling.
- **Automations:** segmentation by source/lifecycle/donor-tier/geography/language, exclusion-list generation, over-contact suppression, retargeting-seed creation.
- **Outputs:** segment plans, exclusion lists, campaign-ready audiences.
- **Human approval:** sensitive-audience rules.
- **Metric:** segment conversion uplift, reduced waste.

#### 6.6 Touchpoint Intelligence Agent  `[Needs CRM/API]`
- **Purpose:** Log every call, message, event, donation and content interaction chronologically.
- **Automations:** touchpoint capture & ordering, last-touch/next-action computation, engagement-history assembly.
- **Outputs:** chronological relationship timeline per contact.
- **Metric:** touchpoint completeness, timeline accuracy.

#### 6.7 Preacher Relationship Capture Agent  `[Needs HKHT data]`
- **Purpose:** Capture relationship, referrer and family/community network links.
- **Automations:** relationship-edge capture, referrer linking, family/community association.
- **Outputs:** relationship links, referrer graph seed.
- **Metric:** relationship-link coverage.

#### 6.8 CRM Sync & API Orchestration Agent  `[Needs Google Cloud]` `[Needs CRM/API]`
- **Purpose:** Keep all systems consistent via governed APIs.
- **Automations:** create/update/read sync, retry & error-queue handling, conflict detection, sync logging.
- **Tools:** Hello Leads API, CRM API, Cloud Run/Workflows, Sheets fallback.
- **Human approval:** data-custodian reviews failed sync/identity conflicts.
- **Escalation:** API failure, duplicate identity, payment mismatch.
- **Metric:** sync success %, data-error rate.

#### 6.9 Data Quality & Governance Dashboard Agent  `[Needs Google Cloud]`
- **Purpose:** Surface duplicates, gaps and ID completion to owners.
- **Automations:** completeness scoring, duplicate/invalid-phone detection, stale-record detection, owner-coverage tracking, dashboard refresh.
- **Outputs:** data-quality score, exception lists.
- **Metric:** data-quality score trend, ID-completion %.

#### 6.10 Privacy & Access Control Agent  `[Human-approval design]`
- **Purpose:** Control field-level access, consent and export audit.
- **Automations:** role-based access enforcement, export/download logging, consent-status enforcement, audit-trail capture.
- **Outputs:** access logs, audit records.
- **Human approval:** access/role changes, bulk exports.
- **Metric:** untracked-export incidents (→0), access compliance.

#### 6.11 Relationship Intelligence Graph & Journey Timeline Agent  `[Later phase]` `[Needs Google Cloud]`
- **Purpose:** Build the "Follow-the-Devotee" relationship graph and journey timeline.
- **Automations:** contact↔donor↔yatri↔family↔community linking, journey-timeline assembly, next-best-action seeding.
- **Outputs:** relationship graph, journey timeline, NBA signals.
- **Metric:** graph coverage, cross-journey conversion.

#### 6.12 API Registry & Dependency Watch Agent  `[Buildable now]`
- **Purpose:** Track integration health, status and fallbacks.
- **Automations:** API status tracking (confirmed/pending/blocked/fallback), dependency monitoring, blocker alerts.
- **Outputs:** live API registry, dependency log.
- **Metric:** dependencies with confirmed status %, blocker aging.

### WF-006 · Feature classification

| Automation type | WF-006 features |
|------|------|
| **Deterministic** | Standard intake forms; mandatory-field enforcement; source & source-date tagging; duplicate flags; suppression/DND checks; import/export QA; dashboard refresh; access logging. |
| **AI-assisted** | Fuzzy dedupe matching & confidence scoring; segmentation & exclusion suggestions; data-quality scoring; touchpoint summarization; next-best-action seeds. |
| **Agentic** | End-to-end clean→dedupe→consent-check→segment→sync pipeline with retries, error queues and exception routing. |
| **Human-approved** | All merges (esp. donor/payment-linked); sensitive relationship notes; HNI/CSR updates; access/role changes; bulk exports; suppression-policy changes. |

### WF-006 · Data entities owned (the master model)

| Entity | Key fields | Source now → future |
|--------|-----------|---------------------|
| **Master Contact** | Contact_ID, name, mobile, email, city, language, address, source, consent, owner | Hello Leads/CRM/Sheets/event lists → CRM → ERP/DWH |
| **Donor Profile** | Donor_ID, Contact_ID, donation history, seva, HNI/CSR flag, relationship owner | DCC/payment/CRM → CRM+DCC → ERP |
| **Yatri Profile** | Yatri_ID, Contact_ID, Yatra interest, registration, payment status, attendance, referrals | Yatra sheets/CRM → Yatra app/CRM → ERP |
| **Community / Family** | Community_ID, Family_ID, gated community, profession, children, interests, referrals | Sankalpa cards/events/preacher notes → CRM → graph |
| **Source Attribution** | campaign/event/referral/call/website source, created date | Ads/forms/event capture → CRM/DWH |
| **Follow-up Task** | Task_ID, next action, owner, priority, due date, status, outcome, escalation | Telecalling/WhatsApp/CRM/ClickUp → workflow app |
| **Payment / Revenue Link** | Donation_ID, payment status, receipt status, Campaign_ID, Event_ID, seva, trust | DCC/gateway/finance → ERP/DCC + CRM |
| **Consent / Suppression** | DND, opt-out, channel permission, not-interested, suppression reason/date | DND tools/Sheets/CRM → CRM/ERP governance |
| **Data Quality Score** | completeness, duplicate risk, source confidence, consent status, stale age | generated → BigQuery/Looker + CRM |
| **Access / Audit** | User_ID, role, export/download, permission, timestamp, approval | CRM/admin logs → security/audit system |

### WF-006 · Dashboards

- **Management:** data-quality score, campaign-ready contacts, revenue-source confidence, escalations, high-value exceptions, owner bottlenecks.
- **Operational:** raw received, cleaned, rejected, duplicate clusters, suppression blocks, import/export status, failed sync jobs.
- **Revenue/conversion:** source → lead → call → registration/donation/payment/receipt → repeat cultivation.
- **Data quality:** completeness, duplicates, invalid phones, source coverage, consent status, stale records, owner coverage.
- **AI-agent performance:** agent suggestions, approval/rejection rate, accuracy issues, human-review queue, incidents, SLA.

### WF-006 · Integrations & fallbacks

| Integration | Use | Fallback |
|-------------|-----|----------|
| CRM / DBMS (Hello Leads / internal) | Master read/write | CSV import + manual review |
| BigQuery | Warehouse, dedupe at scale, scoring | Sheets staging |
| Cloud Run / Workflows | Sync jobs, retries, error queues | Manual batch sync |
| DND / suppression tools | Consent enforcement | Manual suppression list |
| ERP-ready layer | Future finance/inventory/HR records | ERP-ready interim fields |

### WF-006 · KPIs
Duplicate rate ↓ · ID-completion % ↑ · source coverage % ↑ · suppression accuracy ↑ · stale-record % ↓ · sync success % ↑ · % workflows running on shared data ↑.

### WF-006 · Build phasing
- **Day 1–7:** validate sources/owners/fields/IDs; intake + standardization + data-quality score in Sheets/AppSheet; first data-quality dashboard; API registry started.
- **Day 8–14:** dedupe with human-approved merges on a real sample; suppression/DND enforcement; source attribution; CRM sync via API or CSV fallback.
- **Day 15–30:** hardened pipeline, role-based access + audit, full data-quality dashboard, golden-journey data spine validated, fallback tested. **Gate: Contact_ID rules, duplicate policy and source fields approved before WF-002/003 scale.**

---

# WF-002 — Voice Agent + CRM Follow-up
### The conversion engine (build sequence #2)

**Platform role:** Converts approved lead/contact lists into qualified Yatra, donation, donor-cultivation, callback and relationship-handoff opportunities — with structured, CRM/ERP-ready data. It is the bridge from leads to seva outcomes. *It must not be reduced to a generic bot.*
**Trigger:** Approved calling campaign, segmented list, inbound interest or callback due.
**Owner / backup / approver:** Hemchand / Deepak / calling-campaign approver *(Needs Validation)*.
**What it does:** calls approved contacts → captures outcome → schedules follow-up → triggers approved WhatsApp → escalates sensitive/high-value cases → updates CRM/dashboard.

> **Scaled-calling guardrail:** large/cold database use must NOT proceed until DND, source age, suppression, phone validity, consent basis and TRAI-related calling readiness are validated (see §VOICE governance). Risk-gate Green/Amber/Red.

### WF-002 · Agents & their automations

#### 2.1 Campaign Intake & Segmentation Agent  `[Buildable now]` `[Needs HKHT data]`
- **Purpose:** Convert approved campaign/lead lists into a clean, prioritized, compliant call queue.
- **Automations:** list validation, source tagging, duplicate/DND checks, segment tagging, owner assignment, call-queue generation, priority ranking.
- **Inputs:** Campaign_ID, lead source, contact list, language, DND/opt-out status, Yatra/seva offer, priority rules.
- **Outputs:** validated call queue, duplicate/suppression exceptions, segment tags, owner assignment.
- **Tools:** CRM/Hello Leads API if available; Sheets/AppSheet fallback; Apps Script; BigQuery later.
- **Human approval:** required **before a campaign list is activated** for calling.
- **Escalation:** invalid data, missing source, DND conflict, duplicates → CRM/data custodian.
- **Metric:** callable-records %, duplicate rate, suppression compliance, activation time.

#### 2.2 Voice Calling Agent  `[Needs vendor]` `[Human-approval design]`
- **Purpose:** Make approved first-touch / routine follow-up calls and capture structured outcomes.
- **Automations:** automated dialling, approved-script delivery, multi-language handling, retry rules, recording/transcript capture, outcome capture (interested / not interested / callback / payment / donation / Yatra intent), objection tagging.
- **Inputs:** call queue, approved script, FAQ, offer details, language preference, retry rules.
- **Outputs:** call status, recording/transcript, summary, intent/outcome, objection tags.
- **Data:** Contact_ID, Call_ID, Campaign_ID, Yatra_ID/Seva, attempt count, status, duration, language, outcome.
- **Tools:** Twilio voice/dialer (replaces Hello Leads dialer), number management, transcription, LLM classifier, CRM/Sheets sync.
- **Human approval:** script approved before production; AI must not finalize sensitive donor/finance/philosophical responses.
- **Escalation:** unknown question, high-value donor, payment issue, complaint, low-confidence classification → human.
- **Metric:** pickup rate, completed calls, intent-capture accuracy, escalation accuracy, cost per qualified lead.

#### 2.3 Intent, Objection & Next-Action Classifier  `[Needs Google Cloud]` `[AI-assisted]`
- **Purpose:** Turn transcripts into standardized CRM fields and next actions.
- **Automations:** outcome-code classification, objection-reason extraction, lead scoring, callback-need detection, escalation flagging, next-action recommendation, confidence scoring.
- **Inputs:** transcript, recording metadata, script version, campaign context.
- **Outputs:** outcome code, objection reason, lead score, callback need, escalation flag, recommended next action.
- **Tools:** Gemini / Vertex AI or partner classifier; CRM API/Sheets; BigQuery later.
- **Human approval:** low-confidence classifications require human review.
- **Escalation:** contradictory transcript or sensitive issue → supervisor.
- **Metric:** classification accuracy, low-confidence rate, missed-escalation rate.

#### 2.4 Callback & Follow-up Scheduler Agent  `[Buildable now]`
- **Purpose:** Prevent follow-up leakage by creating tasks and reminders automatically.
- **Automations:** callback-task creation, reminder scheduling, overdue-queue generation, SLA tracking, priority-based escalation alerts.
- **Inputs:** callback request, next-action date/time, priority, owner rules, lead score.
- **Outputs:** task, reminder, escalation alert, overdue queue, follow-up SLA dashboard.
- **Data:** Task_ID, next-action date, Owner_ID, status, priority, last-follow-up date, escalation person.
- **Tools:** CRM task module, Google Calendar, ClickUp (if selected), Apps Script/Workflows.
- **Human approval:** human owns the callback; agent creates/reminds/escalates.
- **Escalation:** overdue high-priority callback → supervisor + dashboard reviewer.
- **Metric:** callback-SLA %, overdue tasks, hot-lead leakage, conversion after callback.

#### 2.5 WhatsApp Follow-up Agent  `[Needs vendor]` `[Human-approval design]`
- **Purpose:** Send approved follow-up content and log delivery/reply back to the relationship record.
- **Automations:** approved-template send/queue, link insertion (brochure/payment/registration), delivery-status logging, reply capture, opt-out handling, follow-up-task creation on reply.
- **Inputs:** approved templates, lead outcome, language, brochure/payment/registration links.
- **Outputs:** queued/sent WhatsApp, delivery status, reply captured, follow-up task.
- **Data:** Template_ID, Message_ID, delivery status, reply status, link click, opt-out flag.
- **Tools:** WhatsApp BSP (Interakt/Karix) API, CRM/Sheets, Apps Script.
- **Human approval:** only approved templates in production; donor-sensitive custom messages need approval.
- **Escalation:** opt-out, complaint, wrong recipient, HNI reply → human.
- **Metric:** delivery rate, reply rate, click rate, opt-out rate, post-message conversion.

#### 2.6 Human Escalation & Relationship Handoff Agent  `[Human-approval design]`
- **Purpose:** Route warm, sensitive or high-value opportunities to the right human with full context.
- **Automations:** escalation-task creation, context/summary packaging, suggested talking points, priority-SLA assignment, AI-Fundraiser-Copilot handoff pack (summary, history, recommended seva, likely objection, approved talking points).
- **Inputs:** lead score, sensitive tags, unknown questions, HNI/CSR/LLP interest, payment issue, complaint.
- **Outputs:** escalation task, call summary, suggested talking points, priority SLA.
- **Tools:** CRM/task system, ClickUp/Google Chat/Calendar, dashboard.
- **Human approval:** final response/commitment stays with the human owner.
- **Escalation:** unresolved escalation → supervisor/Mukund Prabhu dashboard alert.
- **Metric:** escalation response time, high-value conversion, unresolved escalations.

#### 2.7 CRM Sync & Data Quality Agent  `[Needs CRM/API]`
- **Purpose:** Keep CRM the source of truth and flag integration/data errors.
- **Automations:** writeback of call/WhatsApp/task/conversion data, sync logging, error-queue handling, duplicate/suppression alerts, identity-conflict detection.
- **Inputs:** voice output, WhatsApp output, task status, conversion updates.
- **Outputs:** CRM updates, sync logs, error queue, duplicate/suppression alerts.
- **Tools:** Hello Leads API, Tata Tele/Twilio export/API, Sheets fallback, Cloud Run/Workflows later.
- **Human approval:** data custodian reviews failed sync and identity conflicts.
- **Escalation:** API failure, duplicate identity, payment mismatch → data custodian/finance.
- **Metric:** sync success %, data-error rate, duplicate rate, field completeness.

#### 2.8 Management Dashboard & QA Agent  `[Needs Google Cloud]`
- **Purpose:** Convert call activity into management control, quality review and script improvement.
- **Automations:** funnel-dashboard compilation, KPI-alert generation, call-quality sampling/scoring, script-issue detection, exception-list generation, "Voice of the Devotee" objection/FAQ aggregation.
- **Inputs:** call logs, outcomes, revenue/donation/registration references, QA flags.
- **Outputs:** funnel dashboard, KPI alerts, script issues, bot-performance reports, exception lists.
- **Tools:** Looker Studio, BigQuery, CRM, Sheets fallback, Gemini/Vertex QA.
- **Human approval:** human approves script changes and KPI definitions.
- **Escalation:** low bot quality, opt-out spike, missed hot leads, low conversion → leadership.
- **Metric:** conversion rate, missed-follow-up rate, AI-quality score, human time saved.

### WF-002 · Feature classification

| Automation type | WF-002 features |
|------|------|
| **Deterministic** | Lead validation; source tagging; duplicate/DND checks; call-queue generation; reminders; CRM/Sheet sync; dashboard refresh. |
| **AI-assisted** | Script localization; transcript summaries; intent/objection classification; next-action recommendation; QA scoring; script-improvement suggestions. |
| **Agentic** | Voice agent calls; captures intent; schedules callback; sends/queues approved WhatsApp; updates CRM/Sheet; escalates exceptions — all under human-governed rules. |
| **Human-approved** | Scripts; donor-sensitive communication; financial commitments; HNI/CSR/LLP; complaints; public/devotional/philosophical responses; low-confidence outcomes. |

### WF-002 · Dashboards

- **Management:** total leads, calls, interested, registrations, donations, revenue, overdue hot leads, escalations, campaign comparison.
- **Operational:** call queue, attempts, connected/unconnected, callbacks due/overdue, owner workload, SLA compliance.
- **Revenue/conversion:** lead source → call → interest → registration/donation → payment/receipt; cost per conversion.
- **Data quality:** duplicate contacts, missing source, missing consent, invalid numbers, sync failures, unmapped payments.
- **AI-agent performance:** connect rate, classification accuracy, transcript availability, low-confidence outcomes, escalation precision, opt-out/complaint rate.
- **Voice of the Devotee intelligence:** aggregated objections, FAQs, complaints, language mismatch, pricing concerns, Yatra/donor interest patterns → monthly improvement actions.
- **Leadership command-center contribution:** hot opportunities, Yatra/donation pipeline, overdue callbacks, escalation bottlenecks, voice-agent quality, contactability, revenue influence, Mukund-Prabhu-decision-required items.

### WF-002 · Data entities written
Contact · Donor/Yatri/Family · Campaign/Source · **Call** (Call_ID, attempt, status, duration, transcript/recording ref) · Follow-up Task · Revenue/Payment ref · Governance (owner/approver/backup/escalation) · Relationship-graph edges · **Calling readiness/suppression** (DND, source age, consent basis, retry limit, calling hours, invalid number, spam flag, TRAI readiness).

### WF-002 · Integrations & fallbacks

| Integration | Use | Fallback |
|-------------|-----|----------|
| **Twilio voice** *(replaces Hello Leads dialer)* | Dialing, number procurement/rotation, recording/transcript | Manual priority call sheet |
| WhatsApp BSP (Interakt/Karix) | Template send, delivery, reply logging | Manual messaging queue |
| CRM / Hello Leads API | Contact create/update/read, callback writeback | CSV export/import |
| Gemini / Vertex AI | Transcript summary, intent classification, QA | Human draft-only |
| Cloud Run / Workflows | Sync, retries, webhooks, error queues | Manual batch sync |
| BigQuery / Looker Studio | Funnel & QA dashboards | Sheets dashboard |
| Payment gateway / DCC | Payment/donation status for revenue dashboard | Manual status upload |
| ClickUp / task layer | Callback/escalation tasks (if selected) | CRM tasks / manual sheet |

### WF-002 · Human role redesign
Telecallers → warm-lead closing & relationship care; Supervisor → AI-call QA & conversion manager; CRM/data team → data custodianship & identity; Yatra experts → itinerary/payment-sensitive escalations; Donor team → HNI/CSR/LLP/seva conversations; **new** AI Voice Ops Admin (script versions, batches, QA) and Consent/Data Privacy Custodian (DND, opt-out, retention, audit).

### WF-002 · KPIs
Calls/day & contacts reached ↑ · pickup & connect rate ↑ · intent-capture accuracy ↑ · callback-SLA % ↑ · hot-lead leakage ↓ · conversion after callback ↑ · cost per qualified lead ↓ · opt-out/complaint rate ↓ · human time saved ↑.

### WF-002 · Build phasing
- **Day 1–7:** approved call flow on 50–100 sample contacts; voice call → transcript → summary → outcome classification → callback capture → basic dashboard; human-escalation path; mock CRM/API clearly labelled.
- **Day 8–14:** controlled 50–500-contact campaign (CSV/Sheet fallback or CRM API); structured outcomes + callback tasks + escalation queue; basic WhatsApp follow-up; dashboard (attempts/connected/interested/callback/invalid/escalations/pipeline). *Excludes ERP, predictive scoring, full donor-360, autonomous financial closure.*
- **Day 15–30:** production hardening, real usage, cross-workflow integration, escalation & fallback testing, golden-journey QA, leadership command-center contribution, productivity measurement, sign-off.

---

# WF-003 — Digital Marketing Campaigns
### The demand factory (build sequence #4)

**Platform role:** Digital acquisition, campaign intelligence and conversion-attribution module. Plans, launches, monitors and learns from fundraising / Yatra / festival / seva / outreach campaigns across Google, Meta, YouTube, WhatsApp, SMS, RCS, landing pages, CRM, DCC/payment and finance reporting. *Must not become an isolated ad automation — every rupee of spend is traceable to lead → call → donation → registration.*
**Trigger:** Festival / Yatra / donation campaign approved, or always-on remarketing window.
**Owner / backup / approver:** Hemchand / Venkat / digital-marketing owner *(Needs Validation)*.

### WF-003 · Agents & their automations

| # | Agent | Purpose | Core outputs | Approval / escalation | Success metric |
|---|-------|---------|--------------|----------------------|----------------|
| 3.1 | **Campaign Strategy Agent** `[AI-assisted]` | Convert festival/Yatra/seva objective into campaign strategy | Brief, channel plan, timing, success metrics | Final strategy & high-budget approval; unclear objective/high budget escalates | Brief turnaround, strategy reuse |
| 3.2 | **Audience Intelligence Agent** `[Needs CRM/API]` | Recommend segments; suppress low-value/over-contacted | Segment plan, exclusion list, retargeting seed | Sensitive-audience rules; DND/consent ambiguity | CPL, conversion, reduced waste |
| 3.3 | **Content Variant Agent** `[AI-assisted]` `[Human-approval design]` | Draft ad copy, WhatsApp/SMS/RCS, landing-page copy | Copy variants, CTA variants, creative brief | Public/donor/devotional approval; sensitive claims | Approval pass rate, CTR/CVR |
| 3.4 | **Creative / Media Brief Agent** `[AI-assisted]` | Prepare poster/reel/storyboard inputs | Storyboard, asset request, media brief | Media/deity/brand approval; asset/source uncertainty | Creative cycle time, rework |
| 3.5 | **Landing Page QA Agent** `[Buildable now]` | Check readiness before launch | QA score, issues, launch checklist | Launch-readiness approval; payment/CRM/tracking failure | Launch defects, conversion rate |
| 3.6 | **Campaign Launch Agent** `[Needs CRM/API]` | Prepare setup checklist & source tags | Setup checklist, missing items, UTM list | Final launch/spend approval; policy rejection, overspend | Launch speed, setup-error reduction |
| 3.7 | **Daily ROI Optimization Agent** `[Agentic]` | Monitor spend, leads, donations, registrations | Alerts, recommendations, pause/scale suggestions | Budget changes; ROI drop, tracking break | ROAS, speed of action |
| 3.8 | **Lead-to-CRM Handoff Agent** `[Needs CRM/API]` | Ensure every lead is source-tagged & assigned | CRM lead, task/callback, source attribution | Sensitive-donor escalation; duplicates/missing consent | Lead-sync %, first-follow-up SLA |
| 3.9 | **Remarketing Agent** `[Needs CRM/API]` | Identify low-cost high-ROI donor/yatri audiences | Remarketing lists & message plan | Message & VIP/HNI approval; over-contacted/VIP concerns | Repeat donation/Yatra conversion |
| 3.10 | **Campaign Learning Agent** `[AI-assisted]` | Preserve what worked/failed as institutional memory | Next-season playbook, recommendations | Final learning approval; missing attribution | Reuse rate, reduced dependency |
| 3.11 | **Behavior-Triggered Micro-Campaign Agent** `[Later phase]` `[Agentic]` | Trigger timely micro-campaigns from website visits, stalled payments, repeated Yatra interest, annual donation patterns, event follow-up | Trigger list, personalized next-action plan, channel rec, escalation task | Human approval for donor-sensitive/high-volume sends; consent/DND or VIP/HNI escalation | Conversion lift, stalled-payment recovery, follow-up speed |
| 3.12 | **Donor Propensity & Relationship Intelligence Agent** `[Later phase]` `[Needs Google Cloud]` | Prioritize contacts most likely to donate/register from campaign+CRM+GA4+engagement signals | Ranked prospects, recommended ask/seva/Yatra, intro context | Reviewer approval for HNI/CSR/major-donor; low-confidence escalation | Higher conversion, fundraiser productivity, donor LTV |
| 3.13 | **Campaign P&L Intelligence Agent** `[Needs CRM/API]` | Connect spend → lead → donation/registration → revenue for live per-campaign P&L | Per-campaign/Yatra P&L, ROI, cost-per-conversion | Finance approval; attribution gaps escalate | ROAS, revenue attribution accuracy |

### WF-003 · Feature classification

| Automation type | WF-003 features |
|------|------|
| **Deterministic** | Campaign intake; mandatory fields (Campaign_ID, objective, source, audience, channel, owner, approver, budget ceiling, landing page, CRM mapping); UTM/source-tag generation; approval-status routing; reminders; lead sync; dashboard refresh; closeout-summary compilation. |
| **AI-assisted** | Strategy briefs; audience options; ad/WhatsApp/SMS/RCS/landing copy variants; creative/media briefs; landing-page recommendations; campaign-learning summaries; dashboard interpretation. |
| **Agentic** | Daily performance monitoring; anomaly detection; pause/scale/shift recommendations; CRM follow-up task creation; campaign-closeout intelligence; behavior-triggered micro-campaigns. |
| **Human-approved** | Budget changes/thresholds/refunds; donor-sensitive & HNI/CSR/LLP messaging; public copy & templates; devotional/philosophical claims; deity/media assets; ROI/P&L reports. |

### WF-003 · Dashboards

- **Management:** gross revenue, expenditure, net revenue, target vs achieved, MoM/YoY/YTD, campaign/channel/source performance.
- **Operational:** campaign pipeline, pending approvals, launch readiness, content status, landing-page QA, daily alerts, escalation list.
- **Revenue/conversion:** spend, impressions, clicks, leads, calls, donations, Yatra registrations, CPL, cost-per-donation, cost-per-registration, ROAS.
- **Data quality:** missing IDs, missing source tags, duplicate leads, missing consent/DND, failed lead sync, failed payment attribution, stale follow-up.
- **AI-agent performance:** generated drafts, approval rate, rejected outputs, hallucination/error flags, recommendations adopted, human overrides, SLA improvements.

### WF-003 · Data expectations
Captures/writes: `Campaign_ID`, objective, source, audience, channel, owner, approver, budget ceiling, landing page, CRM mapping, follow-up path, UTM, `Contact_ID`/`Lead_ID` on every lead, `Donation_ID`/`Payment_Status` on conversion. Operational data lives in CRM/DBMS/analytics/ERP path — **never** in the KCKE knowledge engine.

### WF-003 · Integrations & fallbacks

| Integration | Use | Fallback |
|-------------|-----|----------|
| Google Ads · Meta Ads · YouTube · GA4 | Spend, leads, creative performance, conversions | Manual report export |
| Website / landing / CMS | Forms, pages, payment links, UTM | Controlled form + sheet capture |
| Payment gateway (Razorpay/PayU/Cashfree) / DCC | Payment/donation attribution | Manual status upload |
| CRM / Hello Leads | Lead handoff with source/Campaign_ID | CSV export/import |
| WhatsApp BSP / SMS / RCS | Campaign nurture & remarketing | Manual messaging queue |
| BigQuery / Looker Studio | ROI, funnel, P&L dashboards | Sheets dashboard |
| Gemini / Vertex AI | Briefs, variants, learning summaries | Human draft-only |
| KCKE / Media AI interface | Source-grounded copy & approved assets | Curated content index / manual creative |

### WF-003 · Human role redesign
Mukund Prabhu → strategy & high-budget approval only; workflow manager → orchestration & exception handling; PPC expert → setup QA & spend governance; content/creative → review of AI drafts; CRM/data custodian → lead-sync & attribution integrity; finance/DCC reviewer → P&L & payment attribution.

### WF-003 · KPIs
Revenue per ₹ of spend ↑ · CPL ↓ · ROAS ↑ · time-to-launch ↓ · variants tested ↑ · lead-sync % ↑ · first-follow-up SLA ↓ · remarketing conversion ↑ · launch-prep time ↓ · rework ↓ · Mukund-Prabhu chasing ↓.

### WF-003 · Build phasing
- **Day 1–7:** campaign intake app/sheet with platform-compatible fields; AI campaign brief + channel-specific copy variants; mock/sample dashboard (spend/leads/CPL/donations/registrations/revenue/ROI); source-tagging map + lead-to-CRM handoff design; budget/content approval gate + audit trail.
- **Day 8–14:** integrated MVP used by selected users — create campaign, generate variants, route approval, tag sources, review dashboard; CSV/export fallback where APIs not ready; daily performance summary drafts recommendations (no auto budget changes); CRM handoff testable via export/import or sandbox. *Excludes ERP migration, predictive ROAS, full historical attribution, unrestricted WhatsApp/SMS automation, auto-spend changes.*
- **Day 15–30:** production hardening, adoption, exception handling, cross-workflow testing, golden-journey QA, productivity measurement, sign-off; begin API validation for Ads/GA4/CRM/DCC/payment/WhatsApp.

---

# Cross-Workflow — How the Three Connect

### The Phase-1 data handoffs (no manual re-keying)

| From → To | What is handed over | Carried IDs |
|-----------|--------------------|-------------|
| WF-003 → WF-006 | New campaign lead with source/UTM | `Lead_ID`, `Campaign_ID`, `Source` |
| WF-006 → WF-002 | Clean, deduped, consent-checked, segmented call queue | `Contact_ID`, `Campaign_ID`, segment, consent |
| WF-002 → WF-006 | Call outcome, intent, objection, callback, WhatsApp status | `Contact_ID`, `Call_ID`, `Task_ID`, outcome |
| WF-002 → WF-003 | Conversion outcome for attribution | `Contact_ID`, `Campaign_ID`, `Donation_ID`/registration |
| All → Leadership | KPIs roll up to one Looker command center | all IDs |

### Consolidated Phase-1 integration registry

| Integration | Workflows | Status | Priority | Fallback |
|-------------|-----------|--------|:---:|----------|
| CRM / DBMS (Hello Leads / internal) | 006, 002, 003 | Needs Validation | P0 | CSV import + manual |
| Twilio voice *(replaces Hello Leads dialer)* | 002 | Needs Validation | P0 | Manual call sheet |
| WhatsApp BSP (Interakt/Karix) | 002, 003 | Needs Validation | P0 | Manual messaging queue |
| Google Ads / Meta / GA4 | 003 | Needs Validation | P0 | Manual report export |
| Payment gateway / DCC | 003, (002 ref) | Needs Validation | P0 | Manual status upload |
| Website / landing / forms | 003 | Needs Validation | P0 | Form + sheet capture |
| BigQuery / Looker Studio | 006, 002, 003 | Needs Validation | P0/P1 | Sheets dashboard |
| Gemini / Vertex AI / Agent Builder | 006, 002, 003 | Needs Validation | P1 | Human draft-only |
| Cloud Run / Workflows | 006, 002 | Needs Validation | P1 | Manual batch sync |
| ClickUp / task layer | 002 (003 opt) | Validate access | P1 | CRM tasks / manual |
| ERP-ready layer | 006 (002/003 ref) | Phased | P1 | ERP-ready interim fields |

> Each integration must have, in the live API registry: name, provider, status (confirmed/pending/blocked/fallback), access method, owner, blocker, cost implication, and production-readiness classification.

---

# Outreach Governance (applies to WF-002 & WF-003)

### Voice / calling readiness — TRAI & DND audit (before any scaled calling)
Scaled voice outreach must pass an audit on each list:

| Audit field | Risk gate |
|-------------|-----------|
| Database source (Confirmed / Unknown / Mixed) | Unknown → review before use |
| Real count validation | Don't plan scale from unverified counts |
| Contact freshness | Old records → reactivation sequence |
| DND / suppression status (Clean / Partial / Unknown) | **Unknown blocks scaled calling** |
| Phone validity | Clean before voice-agent run |
| Duplicate status | Resolve in CRM staging |
| Source tagging | Add source before launch |
| Campaign eligibility | Only eligible lists go to the voice agent |

**Risk classification:** 🟢 Green = source/suppression/script/owner verified → proceed with controlled batch · 🟡 Amber = some fields incomplete → small pilot with manual review only · 🔴 Red = source/suppression unknown, high duplicates, no approved script → do not launch.

### Voice script approval lifecycle (WF-002)
`Campaign brief → AI+writer draft → reviewer (tone/accuracy/sensitivity/outcome codes) → validated approver → test call (QA) → production use → improvement`. Every production script needs: Script_ID, workflow, Campaign_ID, approved version, approver, approval date, applicable audience, outcome-code mapping. Categories & approval level: standard info (workflow approver) · donation/donor-sensitive (donor approver) · financial (finance + workflow approver) · devotional/philosophical (content approver) · escalation/complaint (senior escalation approver). Delegated approval + backup approver + SLA prevent a Mukund-Prabhu bottleneck while preserving sensitive review.

### WhatsApp governance (WF-002 & WF-003)
Single template inventory; every message mapped to owner, purpose, category (Utility/Transactional/Service/Nurture/Reminder) and fallback; opt-out updates CRM status; suppressed contacts never messaged; rejected templates require fallback wording + owner review; high-volume sends require delivery monitoring. Report: messages sent, delivery/read, reply rate, opt-out count, conversion-from-message.

---

# Phase-1 Build Checklist & Go / No-Go Gates

### Sequencing gate (must pass in order)
1. **WF-006 gate (foundation):** Contact_ID rules, duplicate policy, source fields and consent/DND model approved. ✅ before any calling/campaign scale.
2. **WF-002 gate:** DND/TRAI audit Green, approved scripts, outcome codes mapped to CRM, escalation path defined, dashboard live, manual fallback tested.
3. **WF-003 gate:** Campaign_ID/source governance live, landing/payment/CRM links QA'd, budget-approval gate working, lead-to-CRM handoff validated, fallback tested.

### Production-readiness criteria (each workflow)
- [ ] Live operational use by selected users with safe data & documented boundaries
- [ ] Validated data path with error logging (intake → ID → CRM → owner → dashboard)
- [ ] Dashboards: management, operational, revenue, data-quality, AI-performance
- [ ] Approval routing with named approver, backup and SLA on sensitive actions
- [ ] Exception handling routes to a human owner
- [ ] Role ownership validated (owner/performer/approver/backup/escalation/dashboard reviewer/data custodian)
- [ ] Data-quality checks surface duplicates, invalid phones, missing source/consent
- [ ] Cross-workflow shared IDs & source tags present
- [ ] Manual fallback defined and tested
- [ ] Golden journey passes end-to-end with controlled data

### Acceptance reviews
Day 7 · Day 14 · Day 21 · Day 30 — each validates functionality, data correctness, human-approval gates, dashboard accuracy and production readiness, with demo evidence, data samples, user feedback and unresolved-assumption log.

---

# Open Validations (Needs Validation before/within build)

- **CRM platform & APIs:** final CRM/DBMS selection; Hello Leads create/update/read API and timeline; Tata Tele vs Twilio voice/export API.
- **Owners & approval SLAs:** all owner/performer/approver/backup fields are "Needs Validation" in the RACI pack — confirm before routing production tasks.
- **WhatsApp BSP & templates:** confirmed provider, approved template list, opt-out handling, delivery logging, volume limits.
- **Calling lists:** true size, source quality, freshness and DND/suppression status of any cold/large database (Green/Amber/Red).
- **Payment/DCC exports & UTM conventions:** field mapping for attribution; consent/DND schema.
- **Google Cloud licensing:** Gemini Enterprise / Vertex AI / Agent Builder access, connector limits, cost, security, retention.

---

*Source basis: WF-002, WF-003 and WF-006 Document-B 30-Day Production-Ready briefs; the 13 platform-governance documents (Master Entity Model, Programme Sequencing & Go/No-Go Gates, WhatsApp API Governance Register, Consolidated API & Integration Registry, Leadership Command Center, RACI Pack, Cross-Workflow QA & Golden Journey, Service Continuity & Fallback, KCKE/Media AI Interface, Institutional Memory, Voice Script Approval, Calling Database TRAI/DND Audit, Productivity Baseline); the Automation Master Register; and the Platform Architecture Brief. Items marked "Needs Validation" require confirmation by HKHT owners and the implementation partner.*
