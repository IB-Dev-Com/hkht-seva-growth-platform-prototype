# 04 · Mock Data Model — entities, fields & sample seed records

The shared mock-data store lives in `js/store.js`; the deterministic seed is in `js/seed.js`. All records use the
**shared IDs** from R1.1 so the same identity flows across WF-003 → WF-006 → WF-002 → conversion. This document
is the contract; the seed implements it. State persists in `sessionStorage`; **Reset demo data** rebuilds it.

## Entity relationship (overview)
```
Campaign (Campaign_ID) ──< Lead (Lead_ID) ──┐
                                            ▼
Source ──────────────────────────► Contact (Contact_ID)  ◄── the spine; nothing created without it
                                       │  │  │  │
        ┌──────────────────────────────┘  │  │  └────────────► Consent/Suppression
        ▼                                  │  └─────► Yatri Profile (Yatri_ID)
   Donor Profile (Donor_ID) ──< Donation (Donation_ID, Payment_Status)
        │
Contact ──< Call (Call_ID) ──< Follow-up Task (Task_ID)
        ──< WhatsApp Msg (Message_ID, Template_ID)
        ──< Escalation (Esc_ID)
Merge Candidate (cluster of Contact_IDs)   ApiRegistry   Approval   AuditLog   Usage   Center/Dept/User/Role
```

---

## Core entities & fields

### Contact (Master Contact) — owned by WF-006
`id (Contact_ID)`, `name`, `mobile`, `email`, `city`, `language`, `source`, `lastSource`, `campaignId`,
`segment`, `ownerId (Owner_ID)`, `centerId`, `consent {dnd, optOut, channels{call,whatsapp,sms,email}}`,
`createdDate`, `lastTouch`, `dqScore`, `dupRisk`, `donorId?`, `yatriId?`, `tags[]`.

```json
{ "id":"CON-100245","name":"Ravi Teja Gupta","mobile":"+91 98480 21455","email":"ravi.teja12@gmail.com",
  "city":"Gachibowli","language":"Telugu","source":"meta_ads","lastSource":"meta_ads","campaignId":"CMP-J26",
  "segment":"HNI Donor","ownerId":"U-GOPAL","centerId":"HYD",
  "consent":{"dnd":false,"optOut":false,"channels":{"call":true,"whatsapp":true,"sms":true,"email":true}},
  "createdDate":"2026-05-…","dqScore":96,"dupRisk":8,"donorId":"DNR-100245","yatriId":null }
```

### Donor Profile — `Donor_ID`
`id`, `contactId`, `name`, `tier (HNI|CSR|Regular|New|Life Patron)`, `totalGiven`, `gifts[]`,
`relationshipOwner`, `sevaInterests[]`, `lastGift`. Each gift: `{id (Donation_ID), amount, date, seva,
campaignId, status (Receipted|Pending receipt)}`.

```json
{ "id":"DNR-100245","contactId":"CON-100245","tier":"HNI","totalGiven":284000,
  "gifts":[{"id":"DON-100245-0","amount":11000,"date":"2026-06-22","seva":"Festival Seva","campaignId":"CMP-J26","status":"Receipted"}],
  "relationshipOwner":"U-GOPAL","sevaInterests":["Annadaan","Yatra"] }
```

### Yatri Profile — `Yatri_ID`
`id`, `contactId`, `name`, `yatra`, `registration (Interested|Registered|Paid|Waitlist)`,
`paymentStatus (Not started|Partial|Paid)`, `referrals`.

### Lead — `Lead_ID`
`id`, `contactId`, `campaignId`, `source`, `status (New|Contacted|Qualified|Converted|Lost)`, `createdDate`,
`ownerId`.

### Campaign — `Campaign_ID` (WF-003)
`id`, `name`, `type (Festival|Yatra|Donation|Seva)`, `objective`, `channels[]`, `budget`, `spend`,
`status (active|pending_approval|draft)`, `approvalStatus`, `ownerId`, `approverId`, `deptId`, `centerId`,
`startDate`, `leads`, `calls`, `conversions`, `revenue`, `cpl`, `cpa`, `roas`, `utm`, `landingPageId`,
`daily[] {date,spend,leads,conversions,revenue}`, `risk`.

```json
{ "id":"CMP-J26","name":"Janmashtami Maha Abhishekam 2026","type":"Festival","channels":["google_ads","meta_ads","whatsapp"],
  "budget":850000,"spend":612400,"status":"active","approvalStatus":"approved","ownerId":"U-ROHIT","approverId":"U-MUKUND",
  "deptId":"MKT","centerId":"HYD","leads":…,"conversions":…,"revenue":…,"roas":…,"utm":"hkht_j26","landingPageId":"LP-J26" }
```

### Call — `Call_ID` (WF-002)
`id`, `contactId`, `contactName`, `campaignId`, `scriptId`, `ownerId (agent)`, `attempt`,
`status (Connected|No answer|Busy|Switched off)`, `duration`, `language`, `recordingRef`,
`transcript[] {who,text}`, `intent`, `outcome`, `objection`, `leadScore`, `confidence`, `lowConfidence`,
`escalated`, `approvalNeeded`, `reviewed`, `createdAt`.

```json
{ "id":"CALL-50231","contactId":"CON-100245","campaignId":"CMP-J26","scriptId":"SCR-J26-TE","ownerId":"U-ANAND",
  "status":"Connected","duration":146,"intent":"Donation intent","outcome":"Donated","leadScore":92,
  "confidence":0.96,"lowConfidence":false,"escalated":false,"transcript":[{"who":"agent","text":"Hare Krishna! …"}] }
```

### Follow-up Task — `Task_ID`
`id`, `kind (Callback|Follow-up|Escalation)`, `contactId`, `callId?`, `campaignId`, `ownerId`,
`priority (High|Medium|Low)`, `dueDate`, `status (Open|Overdue|Completed)`, `slaStatus`, `createdAt`, `note`.

### WhatsApp Message — `Message_ID` + `Template_ID`
`id`, `templateId`, `contactId`, `campaignId`, `status (sent|delivered|read|replied|failed)`, `reply`,
`linkClick`, `approvalStatus`, `ownerId`, `createdAt`, `optOut`. **Templates:** `{id, name, category
(Utility|Transactional|Service|Nurture|Reminder), status, body}`.

### Escalation — `Esc_ID`
`id`, `contactId`, `callId`, `reason`, `priority`, `assigneeId`, `status (Open|In progress|Resolved)`,
`slaDue`, `createdAt`, `context`, `talkingPoints[]`, `resolvedNote?`.

### Merge Candidate (WF-006 dedupe)
`id`, `confidence`, `records[] {contactId,name,mobile,source,created,dq}`, `signals[]`, `highValue`,
`status (pending|merged|no-merge)`, `reviewerId`, `note`.

### Consent / Suppression
On Contact: `consent{dnd,optOut,channels{}}`. Suppression entry: `{contactId, name, mobile, type
(DND|Opt-out|Not interested|Unsubscribed), channel, reason, date, addedBy}`.

### Import Batch
`id`, `fileName`, `source`, `total`, `valid`, `rejected`, `duplicates`, `dqScore`,
`status (validating|needs_approval|imported|rejected)`, `uploadedBy`, `createdAt`, `errors[] {row,field,issue}`.

### Voice Script — `Script_ID`
`id`, `name`, `category (Standard info|Donation/donor-sensitive|Financial/commitment|Devotional|Escalation)`,
`version`, `status (draft|review|production)`, `campaignId`, `approverId`, `approvalDate`, `language`,
`outcomeCodes[]`, `qa`, `opening`.

### Landing Page / Content
LP: `{id, campaignId, url, qaScore, status (live|qa), issues[] {sev,text}}`. Content: `{id, campaignId,
channel, status (draft|pending_approval|approved), reviewerId, variants[] {headline,body,cta}}`.

### Approval (platform HITL)
`id`, `type`, `title`, `entity`, `entityId`, `requestedBy`, `approverRole`, `status (pending|approved|rejected)`,
`priority`, `createdAt`, `slaDue`, `context`, `decisionBy?`, `decisionAt?`, `note?`.

### API Registry
`id`, `name`, `provider`, `status (confirmed|pending|blocked|fallback)`, `workflows[]`, `access`, `owner`,
`blocker`, `cost`, `priority`, `uptime`, `fallbackMode`.

### Usage / Cost (central billing)
Per row: `{service, serviceName, unit, centerId, deptId, qty, cost}`. Services: voice, whatsapp, ai, ads, sms,
cloud. Plus `trend[] {month,cost}` and `budgetMonthly`.

### Audit Log
`id`, `actorId`, `action`, `type (access|export|merge|approval|consent|data|import)`, `entityId`, `detail`,
`timestamp`.

### Tenancy & identity
**Center** `{id (HYD|SEC|GCB), name, city, primary}` · **Department** `{id (DON|YAT|MKT|VOX|CRM|FIN), name, icon}`
· **User** `{id, name, role, dept, center, email}` · **Role** (see `05_Personas_Roles.md`) · **Source**
`{id, label, cat, icon}`.

---

## Seed volumes (deterministic)
~64 contacts (1 "hero" — Ravi Teja Gupta, CON-100245), ~35 donor profiles, ~16 yatri profiles, 7 campaigns
(1 hero — CMP-J26), 5 scripts, ~47 calls (1 hero — CALL-50231), callback/follow-up tasks, WhatsApp messages,
escalations, 7 merge clusters, 4 import batches, 12 API registry rows, 8 approvals (6 pending), ~10 audit
entries, usage rows across 3 centers × 6 departments × 6 services, 4 landing pages, 3 content sets.

**Hero golden-journey chain (for demos):** `CMP-J26` (Meta+Google+WhatsApp) → lead → `CON-100245` Ravi Teja
Gupta (HNI, consented) → `CALL-50231` (Telugu, "Donated", 96% confidence) → WhatsApp pay-link → `DON-100245-0`
₹11,000 Festival Seva (Receipted). Visible end-to-end on **Golden Journey**.
