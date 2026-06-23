# 05 · Personas, Roles & Access Matrix

The platform is multi-tenant with role-based access from day one. Below are the persona archetypes the request
calls for, mapped to the concrete roles in the prototype (`js/seed.js` → `roles` + `users`), plus the access &
approval matrix. Switch persona any time from the top-right; the app re-applies that role's nav, tenant scope and
approval rights live.

## Requested archetype → prototype role(s)

| Requested archetype | Prototype role(s) | Persona (seed user) |
|---|---|---|
| CRM-data steward | `data_custodian`, `consent_custodian` | Sachi Prabhu, Venkat Rao |
| Telecaller / voice ops | `telecaller`, `voice_ops`, `supervisor` | Anand Krishna, Priya Nair, Deepak Sharma, Lakshmi Iyer |
| Campaign manager | `marketer`, `workflow_manager` | Rohit Verma, Hemchand Das |
| Content reviewer | `content_reviewer` | Meera Desai |
| Approver | `donor_approver` (+ leadership for high-value) | Gopal Das, Mukund Prabhu |
| Finance / billing admin | `finance_reviewer` | Nanda Kishore |
| Leadership | `leadership` | Mukund Prabhu |
| Center / org admin | `org_admin` *(added per request)* | Gauranga Das |

## Role definitions

| Role | Icon | Scope | What they do |
|---|:--:|---|---|
| `leadership` | 👑 | all + admin | Strategy & high-budget/high-value approvals; reads the whole command center; the buck stops here. |
| `workflow_manager` | 🧭 | all + admin | Orchestration & exception handling across the three workflows. |
| `org_admin` | ⚙️ | all + admin | Multi-center/department administration: users, roles, tenants, audit, central billing. |
| `data_custodian` | 🗂️ | WF-006 | Identity & data integrity; approves merges, imports, sync conflicts. |
| `consent_custodian` | 🛡️ | WF-006 | DND/opt-out/retention; owns suppression policy & consent audit. |
| `voice_ops` | 🎙️ | WF-002 | AI Voice Ops Admin — script versions, calling batches, QA. |
| `supervisor` | 📋 | WF-002 | AI-call QA & conversion management; task oversight. |
| `telecaller` | 🎧 | WF-002 | Warm-lead closing & relationship care; works the call console + tasks. |
| `marketer` | 📣 | WF-003 | Builds & runs campaigns; setup QA & spend governance. |
| `content_reviewer` | ✍️ | WF-003 | Reviews/approves AI-drafted copy & creative (devotional/donor sensitivity). |
| `donor_approver` | 🤝 | WF-002/003 (approve) | Donor-sensitive & HNI/CSR/LLP communication and seva conversations. |
| `finance_reviewer` | 🧾 | WF-003 | P&L & payment-attribution integrity; financial-commitment approvals. |

## Access matrix (workflow / capability by role)

| Capability | leadership | org_admin | wf_manager | data_cust | consent_cust | voice_ops | supervisor | telecaller | marketer | content_rev | donor_appr | finance_rev |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Platform (Command Center, Journey, Approvals, Usage) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Roles & Tenants (admin) | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | — |
| WF-006 CRM & Data | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — |
| WF-002 Voice | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | ✅ | — | — | ✅ | — |
| WF-003 Marketing | ✅ | ✅ | ✅ | — | — | — | — | — | ✅ | ✅ | ✅ | ✅ |
| Switch center scope | ✅ | ✅ | ✅ | pinned | pinned | pinned | pinned | pinned | pinned | pinned | pinned | pinned |

(✅ = full access; pinned = scoped to the user's own center. Nav hides inaccessible groups; direct URL access to a
blocked screen returns an "Access restricted" page.)

## Approval hierarchy (who approves what)

| Sensitive action | Routes to | Backup / escalation |
|---|---|---|
| Contact merge (esp. HNI/payment-linked) | `data_custodian` | leadership |
| Bulk import to production | `data_custodian` | workflow_manager |
| Suppression-policy change | `consent_custodian` | leadership |
| Access / role change, bulk export | `org_admin` / leadership | leadership |
| Voice script — standard | `workflow_manager` | voice_ops |
| Voice script — donation/donor-sensitive | `donor_approver` | leadership |
| Voice script — financial/commitment | `finance_reviewer` + workflow_manager | leadership |
| Voice script — devotional/philosophical | `content_reviewer` | leadership |
| WhatsApp custom (donor-sensitive) template | `donor_approver` | leadership |
| Campaign budget / launch | `workflow_manager`; high budget → `leadership` | leadership |
| Content / creative (public, devotional, deity) | `content_reviewer`; deity/media → leadership | leadership |
| Campaign P&L / refund | `finance_reviewer` | leadership |

Every decision is logged (approver, role, timestamp, note) in the audit trail. Backup approver + SLA exist to
prevent a single-person (Mukund Prabhu) bottleneck while preserving sensitive review — per the blueprint's
institutional-memory and RACI guidance.

> **Note:** all owner/approver assignments mirror the inventory's RACI placeholders ("Needs Validation"). Persona
> names are realistic stand-ins for demonstration; real owners/SLAs are confirmed during build.
