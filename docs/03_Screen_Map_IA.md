# 03 · Screen Map & Information Architecture

How the prototype is organised, how screens connect, and which features live on each. Routes are hash-based
(`#/path`). The shell = persistent **left sidebar** (RBAC-filtered nav, grouped by workflow) + **top bar**
(breadcrumb, center & department scope switchers, persona/role switcher) + **content area**. Global overlays:
toasts, modals, right-side drawers.

```
Login (persona picker)
└── App shell ─ sidebar (RBAC) ─ topbar (center/dept scope · role switcher)
    ├─ PLATFORM
    │   ├─ #/                     Command Center        (cross-WF rollup, golden funnel, decisions, risk, per-center, usage)
    │   ├─ #/journey              Golden Journey        (trace one Contact_ID end-to-end)
    │   ├─ #/approvals            Approvals             (unified HITL queue; ?focus=APR-id deep-link)
    │   ├─ #/usage                Usage & Cost          (central billing, per-center/dept chargeback)
    │   └─ #/admin                Roles & Tenants       (RBAC, centers/depts, audit)            [leadership/manager only]
    ├─ WF-006 · CRM & DATA GOVERNANCE
    │   ├─ #/wf006/contacts       Master Contacts ───────────► #/wf006/contact/:id  Contact 360
    │   ├─ #/wf006/dedupe         Dedupe & Identity     (merge review + human approval)
    │   ├─ #/wf006/quality        Data Quality          (DQ, exceptions, gate status)
    │   ├─ #/wf006/consent        Consent & DND         (suppression list, eligibility gate)
    │   ├─ #/wf006/intake         Intake & Import       (validate, DQ score, approve import)
    │   └─ #/wf006/api            API Registry          (status/owner/blocker/fallback)
    ├─ WF-002 · VOICE & FOLLOW-UP
    │   ├─ #/wf002/readiness      Calling Readiness     (TRAI/DND Green/Amber/Red gate)
    │   ├─ #/wf002/console        Call Console ──────────► #/wf002/call/:id  Call review
    │   ├─ #/wf002/tasks          Follow-up Tasks       (callbacks, SLA, overdue)
    │   ├─ #/wf002/whatsapp       WhatsApp Follow-up    (delivery log + template inventory)
    │   ├─ #/wf002/escalations    Escalations           (context pack + human handoff)
    │   ├─ #/wf002/scripts        Voice Scripts         (approval lifecycle)
    │   └─ #/wf002/dashboard      Voice Dashboard       (funnel, QA, Voice of the Devotee)
    └─ WF-003 · DIGITAL MARKETING
        ├─ #/wf003/campaigns      Campaigns ─────────────► #/wf003/campaign/:id  Campaign detail (ROI/P&L/optimization/QA/handoff)
        ├─ #/wf003/builder        New Campaign           (wizard: objective → AI brief → variants → approval gate)
        ├─ #/wf003/content        Content & Creative     (approval queue)
        └─ #/wf003/dashboard      Marketing Dashboard    (revenue, channels, funnel, top campaigns)
```

## Navigation principles
- **RBAC-filtered nav.** Each nav item is tagged `platform | admin | wf006 | wf002 | wf003`. A role only sees
  groups it can access (e.g. a telecaller sees Platform + WF-002 only; `/admin` is leadership/manager only and
  direct access is gated to an "Access restricted" screen).
- **Tenant scope.** Center & department switchers in the top bar filter every scoped dataset live (leadership/
  manager can pick *All Centers*; specialised roles are pinned to their center).
- **Cross-links are the connective tissue.** Shared-ID chips (`Contact_ID`, `Call_ID`, `Campaign_ID`…) are
  clickable and jump between workflows — e.g. Campaign detail → its contacts; Call review → the contact; Golden
  Journey → call/contact/campaign. This is how the prototype demonstrates "no record is dropped between modules."
- **Detail screens** open on full pages (Contact 360, Call review, Campaign detail); transient actions use
  **drawers** (approval review, API detail) and **modals** (consent, send WhatsApp, override, reassign).

## Screen → primary features (condensed)

| Screen | Primary features (feature IDs from `02_Feature_List.md`) |
|---|---|
| Command Center | S3, golden funnel (S2), decisions (S4), risk panel, per-center perf, central usage (S8) |
| Golden Journey | S2 trace, loop-integrity checks, identity summary, cross-links |
| Approvals | S4, S7 — approve/reject with context pack, SLA, audit |
| Usage & Cost | S8 — service cost, monthly trend, by-center/by-dept allocation, governance |
| Roles & Tenants | S6, S9 — users/roles/access matrix, centers/departments, audit trail |
| Master Contacts | 6.1, 6.3, 6.4 — list/filter, consent badges, DQ, source; export (audited) |
| Contact 360 | 6.6 timeline, 6.4 source, Donor/Yatra profiles, 6.10 audit, NBA, consent modal, queue-call/WhatsApp |
| Dedupe & Identity | 6.2 — clusters, confidence, **human merge approval**, no-merge, HNI guard |
| Data Quality | 6.9 — DQ distribution, owner coverage, exception queues, WF-006 gate status |
| Consent & DND | 6.3 — suppression list, eligibility gate, DND scrub, add suppression |
| Intake & Import | 6.1 — upload→validate→DQ score→error queue→import approval |
| API Registry | 6.12 — status/owner/blocker/cost/fallback; activate fallback |
| Calling Readiness | 2.1 — per-list TRAI/DND audit, Green/Amber/Red, activate queue / pilot |
| Call Console | 2.1 queue, 2.2 live simulated call, 2.3 classification, writeback (2.7), side-effects |
| Call review | 2.3 — transcript/recording, AI classification, **confirm/override** |
| Follow-up Tasks | 2.4 — callbacks, SLA, overdue, complete/reassign |
| WhatsApp Follow-up | 2.5 — delivery log, template inventory, opt-out |
| Escalations | 2.6 — context pack, talking points, resolve (human owns decision) |
| Voice Scripts | script lifecycle + category approvers |
| Voice Dashboard | 2.8 — funnel, outcome mix, QA, Voice of the Devotee |
| Campaigns | list/pipeline, spend/leads/ROAS, approval state |
| Campaign detail | 3.5 QA, 3.6 launch, 3.7 optimization, 3.8 handoff, 3.13 P&L, 14-day trend |
| New Campaign builder | 3.1 brief, 3.3 variants, 3.6 UTM/source, **approval gate** |
| Content & Creative | 3.3/3.4 approval queue |
| Marketing Dashboard | revenue trend, channel perf, funnel, top campaigns |

## Built in v2.0 (previously later-phase) ✅
All of the following are now live screens (see nav additions below):
- WF-006 → **Segment Studio** (`#/wf006/segments`), **Relationship Graph** (`#/wf006/relationships`), **CRM Sync** (`#/wf006/sync`).
- WF-003 → **Creative & Media** (`#/wf003/creative`), **Remarketing** (`#/wf003/remarketing`), **Behavior
  Triggers** (`#/wf003/triggers`), **Donor Propensity** (`#/wf003/propensity`), **Campaign Learning** (`#/wf003/learning`).
- Platform → **Service Continuity** (`#/continuity`), **KCKE & Media Boundary** (`#/kcke`).

The prototype now spans **36 screens**. The foundation (router, store, components, RBAC, tenancy) absorbed these
additions without rework — exactly as the IA anticipated.
