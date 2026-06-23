/* ============================================================
   AI for Seva — Central store (state + session + actions)
   Single shared mock-data store. Pub/sub. Session persistence.
   ============================================================ */
window.App = window.App || {};

App.store = (function () {
  var U = App.util;
  var KEY = 'hkht_seva_state_v1';
  var SKEY = 'hkht_seva_session_v1';

  var state = null;
  var session = null;
  var subs = [];

  /* ---- session defaults ---- */
  function defaultSession() {
    return { userId: 'U-MUKUND', role: 'leadership', centerId: 'ALL', deptId: 'ALL', authed: false };
  }

  // Restore session + any cached state from this browser session.
  // Returns true if a cached dataset exists (skip backend fetch), false if we must hydrate from the backend.
  function load() {
    state = null;
    try {
      var raw = sessionStorage.getItem(KEY);
      if (raw) state = JSON.parse(raw);
    } catch (e) { state = null; }
    try {
      var s = sessionStorage.getItem(SKEY);
      session = s ? JSON.parse(s) : defaultSession();
    } catch (e) { session = defaultSession(); }
    return !!state;
  }
  // Install a freshly-loaded dataset (from the JSON backend or seed fallback).
  function hydrate(obj) { state = obj; persist(); }
  function persist() {
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    try { sessionStorage.setItem(SKEY, JSON.stringify(session)); } catch (e) {}
  }
  // Reset re-pulls the canonical dataset from the backend (JSON), not an ad-hoc regen.
  function reset() {
    var p = (App.api && App.api.loadState) ? App.api.loadState() : Promise.resolve(App.seed.build());
    return p.then(function (obj) { state = obj; persist(); emit(); return obj; });
  }

  /* ---- pub/sub ---- */
  function subscribe(fn) { subs.push(fn); return function () { subs = subs.filter(function (s) { return s !== fn; }); }; }
  function emit() { subs.forEach(function (fn) { try { fn(state, session); } catch (e) { console.error(e); } }); }
  function commit() { persist(); emit(); }

  /* ---- getters ---- */
  function get() { return state; }
  function getSession() { return session; }
  function setSession(patch) { Object.assign(session, patch); persist(); emit(); }

  function user(id) { return state.users.find(function (u) { return u.id === (id || session.userId); }); }
  function currentUser() { return user(session.userId); }
  function center(id) { return state.centers.find(function (c) { return c.id === id; }); }
  function dept(id) { return state.departments.find(function (d) { return d.id === id; }); }
  function source(id) { return state.sources.find(function (s) { return s.id === id; }) || { label: id || 'Unknown', icon: '•' }; }
  function campaign(id) { return state.campaigns.find(function (c) { return c.id === id; }); }
  function contact(id) { return state.contacts.find(function (c) { return c.id === id; }); }
  function donorByContact(cid) { return state.donors.find(function (d) { return d.contactId === cid; }); }
  function yatriByContact(cid) { return state.yatris.find(function (y) { return y.contactId === cid; }); }
  function callsForContact(cid) { return state.calls.filter(function (c) { return c.contactId === cid; }); }
  function tasksForContact(cid) { return state.tasks.filter(function (t) { return t.contactId === cid; }); }
  function waForContact(cid) { return state.whatsapp.filter(function (m) { return m.contactId === cid; }); }

  /* ---- tenant scope filter (org → center → dept) ---- */
  function org(id) { return (state.orgs || []).find(function (o) { return o.id === (id || session.orgId); }); }
  function inScope(rec) {
    if (!rec) return true;
    if (session.orgId && session.orgId !== 'ALL' && rec.orgId && rec.orgId !== session.orgId) return false;
    if (session.centerId !== 'ALL' && rec.centerId && rec.centerId !== session.centerId) return false;
    if (session.deptId !== 'ALL' && rec.deptId && rec.deptId !== session.deptId) return false;
    return true;
  }
  function scoped(arr) { return (arr || []).filter(inScope); }

  /* ---- SLA engine (MI-05) ---- */
  var SLA_POLICIES = {
    'task:High': 240, 'task:Medium': 1440, 'task:Low': 2880,
    'escalation:High': 60, 'escalation:Medium': 240, 'escalation:Low': 480,
    'approval:High': 1440, 'approval:Medium': 2880, 'approval:Low': 4320
  };
  function slaState(kind, item) {
    var due = item.slaDue || item.dueDate;
    if (!due) return { state: 'none' };
    var ms = new Date(due) - U.now();
    var mins = ms / 60000;
    var policy = SLA_POLICIES[kind + ':' + (item.priority || 'Medium')] || 1440;
    var st = mins < 0 ? 'breached' : mins < policy * 0.25 ? 'at_risk' : 'on_track';
    return { state: st, mins: Math.round(mins), due: due, label: mins < 0 ? 'Breached ' + U.ago(due) : 'Due ' + U.ago(due) };
  }

  /* ---- status lifecycles (MI-01) ---- */
  var LIFECYCLES = {
    campaign: { draft: ['pending_approval'], pending_approval: ['active', 'draft'], active: ['paused', 'closed'], paused: ['active', 'closed'], closed: [] },
    script: { draft: ['review'], review: ['production', 'draft'], production: ['review'] },
    content: { draft: ['pending_approval'], pending_approval: ['approved', 'draft'], approved: ['draft'] }
  };

  /* ---- per-user helpers ---- */
  function notifsFor(uid) { return (state.notifications || []).filter(function (n) { return n.userId === (uid || session.userId); }); }
  function unreadNotifCount() { return notifsFor().filter(function (n) { return !n.read; }).length; }
  function entitlementsFor(centerId) { var c = center(centerId || session.centerId); return c ? c.entitlements : ['platform', 'wf006', 'wf002', 'wf003']; }

  /* ---- derived metrics for command center ---- */
  function metrics() {
    var camps = scoped(state.campaigns);
    var spend = U.sum(camps, function (c) { return c.spend; });
    var revenue = U.sum(camps, function (c) { return c.revenue; });
    var leads = U.sum(camps, function (c) { return c.leads; });
    var conversions = U.sum(camps, function (c) { return c.conversions; });
    var calls = state.calls;
    var connected = calls.filter(function (c) { return c.status === 'Connected'; });
    var overdue = state.tasks.filter(function (t) { return t.status === 'Overdue'; });
    var openEsc = state.escalations.filter(function (e) { return e.status !== 'Resolved'; });
    var pendingApprovals = state.approvals.filter(function (a) { return a.status === 'pending'; });
    var dq = state.contacts.length ? U.sum(state.contacts, function (c) { return c.dqScore; }) / state.contacts.length : 0;
    var consented = state.contacts.filter(function (c) { return !c.consent.dnd && !c.consent.optOut; }).length;
    var withSource = state.contacts.filter(function (c) { return !!c.source; }).length;
    return {
      spend: spend, revenue: revenue, leads: leads, conversions: conversions,
      roas: spend ? +(revenue / spend).toFixed(2) : 0,
      netRevenue: revenue - spend,
      contacts: state.contacts.length,
      donors: state.donors.length,
      calls: calls.length,
      connectRate: calls.length ? (connected.length / calls.length * 100) : 0,
      overdueCallbacks: overdue.length,
      openEscalations: openEsc.length,
      pendingApprovals: pendingApprovals.length,
      dqScore: Math.round(dq),
      consentRate: state.contacts.length ? Math.round(consented / state.contacts.length * 100) : 0,
      sourceCoverage: state.contacts.length ? Math.round(withSource / state.contacts.length * 100) : 0,
      cpl: leads ? Math.round(spend / leads) : 0,
      activeCampaigns: camps.filter(function (c) { return c.status === 'active'; }).length
    };
  }

  /* ---- actions (mutations) ---- */
  function addAudit(action, type, entityId, detail, extra) {
    var e = { id: U.uid('AUD'), actorId: session.userId, action: action, type: type, entityId: entityId, detail: detail, timestamp: U.now().toISOString() };
    if (extra) { e.before = extra.before; e.after = extra.after; e.field = extra.field; }
    state.audit.unshift(e);
  }
  function notify(userId, kind, title, ref) {
    if (!userId || userId === session.userId) return;
    state.notifications.unshift({ id: U.uid('NTF'), userId: userId, kind: kind, title: title, ref: ref, ts: U.now().toISOString(), read: false });
  }
  function genAlertInternal(kind, sev, title, ref, centerId) {
    state.alerts = state.alerts || [];
    if (state.alerts.some(function (a) { return a.ref === ref && a.kind === kind && !a.read; })) return;
    state.alerts.unshift({ id: U.uid('ALT'), sev: sev, kind: kind, title: title, detail: '', ts: U.now().toISOString(), centerId: centerId, read: false, ref: ref });
  }
  function findEntity(type, id) {
    var map = { contact: state.contacts, campaign: state.campaigns, escalation: state.escalations, approval: state.approvals, call: state.calls, script: state.scripts, content: state.content, task: state.tasks, segment: state.segments, donor: state.donors };
    return (map[type] || []).find(function (x) { return x.id === id; });
  }

  var actions = {
    login: function (userId) {
      var u = user(userId);
      if (!u) return;
      session.userId = u.id; session.role = u.role; session.authed = true;
      var c = center(u.center);
      var wide = ['leadership', 'workflow_manager', 'platform_admin'].indexOf(u.role) > -1;
      session.orgId = (u.role === 'platform_admin') ? 'ALL' : (c ? c.orgId : 'ORG-HKHT');
      session.centerId = wide ? 'ALL' : u.center;
      session.deptId = 'ALL';
      addAudit('Signed in', 'access', u.id, ROLE_LABEL(u.role));
      commit();
    },
    logout: function () { session = defaultSession(); persist(); emit(); },

    decideApproval: function (id, decision, note) {
      var a = state.approvals.find(function (x) { return x.id === id; });
      if (!a) return;
      a.status = decision; a.decisionBy = session.userId; a.decisionAt = U.now().toISOString(); a.note = note || '';
      // side-effects
      if (a.entity === 'campaign') { var c = campaign(a.entityId); if (c) { c.approvalStatus = decision; if (decision === 'approved' && c.status === 'pending_approval') c.status = 'active'; } }
      if (a.entity === 'script') { var s = state.scripts.find(function (x) { return x.id === a.entityId; }); if (s) { s.status = decision === 'approved' ? 'production' : 'draft'; if (decision === 'approved') s.approvalDate = U.now().toISOString(); } }
      if (a.entity === 'import') { var im = state.imports.find(function (x) { return x.id === a.entityId; }); if (im) im.status = decision === 'approved' ? 'imported' : 'rejected'; }
      if (a.entity === 'content') { var ct = state.content.find(function (x) { return x.id === a.entityId; }); if (ct) ct.status = decision === 'approved' ? 'approved' : 'draft'; }
      if (a.entity === 'wa_template') { var wt = state.waTemplates.find(function (x) { return x.id === a.entityId; }); if (wt) wt.status = decision === 'approved' ? 'approved' : 'rejected'; }
      addAudit((decision === 'approved' ? 'Approved' : 'Rejected') + ' ' + a.type, 'approval', a.entityId, a.title);
      commit();
    },

    mergeDecision: function (id, decision) {
      var m = state.merges.find(function (x) { return x.id === id; });
      if (!m) return;
      m.status = decision; m.reviewerId = session.userId; m.decidedAt = U.now().toISOString();
      addAudit(decision === 'merged' ? 'Merged contacts' : 'Flagged no-merge', 'merge', m.id, m.records.map(function (r) { return r.contactId; }).join(' + '));
      commit();
    },

    toggleConsent: function (contactId, field, val) {
      var c = contact(contactId);
      if (!c) return;
      if (field === 'dnd') { c.consent.dnd = val; c.consent.channels.call = !val; }
      else if (field === 'optOut') { c.consent.optOut = val; c.consent.channels.whatsapp = !val; }
      else c.consent.channels[field] = val;
      addAudit('Updated consent', 'consent', contactId, field + '=' + val);
      commit();
    },
    addSuppression: function (contactId, type, reason) {
      var c = contact(contactId); if (!c) return;
      state.suppression.unshift({ contactId: contactId, name: c.name, mobile: c.mobile, type: type, channel: type === 'DND' ? 'Voice' : 'WhatsApp', reason: reason, date: U.now().toISOString(), addedBy: session.userId });
      if (type === 'DND') c.consent.dnd = true; if (type === 'Opt-out') c.consent.optOut = true;
      addAudit('Added suppression', 'consent', contactId, type + ' — ' + reason);
      commit();
    },

    reviewCall: function (callId, patch) {
      var c = state.calls.find(function (x) { return x.id === callId; });
      if (!c) return;
      Object.assign(c, patch); c.reviewed = true; c.lowConfidence = false;
      addAudit('Reviewed call outcome', 'data', callId, 'Human override applied');
      commit();
    },
    logCallOutcome: function (call) {
      state.calls.unshift(call);
      addAudit('Logged call outcome', 'data', call.id, call.outcome);
      commit();
    },
    completeTask: function (taskId) {
      var t = state.tasks.find(function (x) { return x.id === taskId; });
      if (!t) return; t.status = 'Completed'; t.slaStatus = 'Met'; t.completedAt = U.now().toISOString();
      commit();
    },
    reassignTask: function (taskId, ownerId) {
      var t = state.tasks.find(function (x) { return x.id === taskId; });
      if (!t) return; t.ownerId = ownerId; commit();
    },
    resolveEscalation: function (id, note) {
      var e = state.escalations.find(function (x) { return x.id === id; });
      if (!e) return; e.status = 'Resolved'; e.resolvedNote = note; e.resolvedAt = U.now().toISOString();
      addAudit('Resolved escalation', 'data', id, note || '');
      commit();
    },
    sendWhatsApp: function (contactId, templateId) {
      var c = contact(contactId); if (!c) return;
      state.whatsapp.unshift({ type: 'wa', id: U.uid('MSG'), templateId: templateId, contactId: contactId, contactName: c.name, campaignId: c.campaignId, status: 'sent', reply: null, linkClick: false, approvalStatus: 'approved', ownerId: session.userId, createdAt: U.now().toISOString() });
      addAudit('Sent WhatsApp', 'data', contactId, templateId);
      commit();
    },

    createCampaign: function (camp) {
      state.campaigns.unshift(camp);
      addAudit('Created campaign', 'data', camp.id, camp.name);
      // create matching approval if submitted
      if (camp.approvalStatus === 'pending') {
        state.approvals.unshift({ id: U.uid('APR'), type: 'Campaign budget', title: camp.name + ' — ' + U.inr(camp.budget, { compact: true }) + ' budget', entity: 'campaign', entityId: camp.id, requestedBy: session.userId, approverRole: 'leadership', status: 'pending', priority: 'High', createdAt: U.now().toISOString(), slaDue: U.hoursFromNow(24).toISOString(), context: camp.objective });
      }
      commit();
    },
    updateLandingQA: function (lpId) {
      var lp = state.landingPages.find(function (x) { return x.id === lpId; });
      if (!lp) return; lp.issues = lp.issues.filter(function (i) { return i.sev !== 'high'; }); lp.qaScore = Math.min(99, lp.qaScore + 6); if (!lp.issues.length) lp.status = 'live';
      commit();
    },

    activateCallQueue: function (campaignId) {
      var c = campaign(campaignId); if (!c) return;
      c.queueActivated = true;
      addAudit('Activated call queue', 'data', campaignId, 'Queue approved for calling');
      commit();
    },

    /* ---- WF-006 6.5 segments ---- */
    approveSegment: function (id) {
      var s = state.segments.find(function (x) { return x.id === id; });
      if (!s) return; s.status = 'ready';
      addAudit('Approved segment', 'approval', id, s.name);
      commit();
    },
    /* ---- WF-006 6.8 sync ---- */
    retrySync: function (id) {
      var j = state.syncJobs.find(function (x) { return x.id === id; });
      if (!j) return; j.status = 'success'; j.errors = 0; j.retries = (j.retries || 0) + 1; j.detail = 'Resolved on manual retry';
      addAudit('Retried sync job', 'data', id, j.system);
      commit();
    },
    resolveConflict: function (id) {
      var j = state.syncJobs.find(function (x) { return x.id === id; });
      if (!j) return; j.status = 'success'; j.errors = 0; j.detail = 'Identity conflict resolved by data custodian';
      addAudit('Resolved sync conflict', 'merge', id, j.system);
      commit();
    },
    /* ---- WF-006 6.7 relationships ---- */
    addRelationship: function (edge) { state.relationships.unshift(edge); addAudit('Captured relationship', 'data', edge.id, edge.fromName + ' → ' + edge.toName); commit(); },

    /* ---- WF-003 3.9 remarketing ---- */
    activateRemarketing: function (id) {
      var r = state.remarketing.find(function (x) { return x.id === id; });
      if (!r) return; r.status = r.status === 'active' ? 'paused' : 'active';
      addAudit('Updated remarketing audience', 'data', id, r.name + ' → ' + r.status);
      commit();
    },
    /* ---- WF-003 3.11 triggers ---- */
    toggleTrigger: function (id) {
      var t = state.triggers.find(function (x) { return x.id === id; });
      if (!t) return; t.status = t.status === 'armed' ? 'paused' : 'armed';
      addAudit('Toggled micro-campaign trigger', 'data', id, t.type + ' → ' + t.status);
      commit();
    },
    /* ---- shared: media (KCKE/Media) ---- */
    decideMedia: function (id, decision) {
      var m = state.kcke.media.find(function (x) { return x.id === id; });
      if (!m) return; m.status = decision === 'approved' ? 'approved' : 'draft';
      addAudit((decision === 'approved' ? 'Approved' : 'Rejected') + ' media asset', 'approval', id, m.title);
      commit();
    },
    /* ---- shared: continuity ---- */
    resolveIncident: function (id) {
      var i = state.continuity.incidents.find(function (x) { return x.id === id; });
      if (!i) return; i.status = 'resolved'; i.reconciliation = 'Reconciled · all records back-loaded';
      addAudit('Closed continuity incident', 'data', id, i.system);
      commit();
    },
    /* ---- generic audit hook for screens ---- */
    audit: function (action, type, entityId, detail) { addAudit(action, type, entityId, detail); commit(); },

    /* ====== GAP REMEDIATION ACTIONS ====== */

    /* ST-01/ST-11: edit contact fields with field-level history + audit */
    updateContact: function (id, patch) {
      var c = contact(id); if (!c) return;
      Object.keys(patch).forEach(function (k) {
        var from = c[k], to = patch[k];
        if (String(from) === String(to)) return;
        c.history = c.history || [];
        c.history.unshift({ field: k, from: from, to: to, by: session.userId, ts: U.now().toISOString() });
        c[k] = to;
        addAudit('Edited ' + k, 'data', id, from + ' → ' + to, { field: k, before: from, after: to });
      });
      c.lastEditedBy = session.userId; c.lastEditedAt = U.now().toISOString();
      commit();
    },
    revertField: function (id, histIndex) {
      var c = contact(id); if (!c || !c.history || !c.history[histIndex]) return;
      var h = c.history[histIndex]; var cur = c[h.field];
      c[h.field] = h.from;
      c.history.unshift({ field: h.field, from: cur, to: h.from, by: session.userId, ts: U.now().toISOString(), revert: true });
      addAudit('Reverted ' + h.field, 'data', id, cur + ' → ' + h.from); commit();
    },
    bulkUpdateContacts: function (ids, patch) {
      ids.forEach(function (id) { var c = contact(id); if (!c) return; Object.assign(c, patch); });
      addAudit('Bulk update', 'data', ids.length + ' contacts', JSON.stringify(patch)); commit();
    },

    /* ST-02: field-level merge resolution */
    mergeResolve: function (id, resolution) {
      var m = state.merges.find(function (x) { return x.id === id; }); if (!m) return;
      m.status = 'merged'; m.reviewerId = session.userId; m.decidedAt = U.now().toISOString(); m.resolution = resolution;
      addAudit('Merged (field-level)', 'merge', m.id, m.records.map(function (r) { return r.contactId; }).join(' ← '), { after: JSON.stringify(resolution) });
      commit();
    },

    /* ST-04: assign an exception queue as owned tasks */
    assignQueue: function (label, ownerId, count) {
      state.tasks.unshift({ type: 'task', id: U.uid('TASK'), kind: 'Data fix', contactName: label, ownerId: ownerId, priority: 'Medium',
        dueDate: U.hoursFromNow(48).toISOString(), status: 'Open', slaStatus: 'On track', createdAt: U.now().toISOString(),
        note: label + ' (' + count + ' records)', queueTotal: count, queueWorked: 0, centerId: 'HYD', deptId: 'CRM' });
      notify(ownerId, 'task', 'Data-quality queue assigned: ' + label, 'tasks');
      addAudit('Assigned exception queue', 'data', label, count + ' records → ' + (user(ownerId) || {}).name); commit();
    },

    /* ST-10: test API connection */
    testApi: function (id) {
      var a = state.apiRegistry.find(function (x) { return x.id === id; }); if (!a) return;
      a.lastChecked = U.now().toISOString(); a.lastTest = a.status === 'blocked' ? 'fail' : (Math.random() < 0.85 ? 'ok' : 'slow');
      addAudit('Tested connection', 'data', id, a.lastTest); commit();
    },
    setSyncPolicy: function (system, policy) { state._syncPolicies = state._syncPolicies || {}; state._syncPolicies[system] = policy; addAudit('Updated sync policy', 'data', system, JSON.stringify(policy)); commit(); },

    /* MI-07: comments / @mentions on any entity */
    addComment: function (entityType, id, text) {
      var e = findEntity(entityType, id); if (!e) return;
      e.comments = e.comments || [];
      var mentions = (text.match(/@([A-Za-z]+)/g) || []).map(function (m) { return m.slice(1); });
      e.comments.push({ by: session.userId, ts: U.now().toISOString(), text: text, mentions: mentions });
      // notify mentioned users (match by first name)
      mentions.forEach(function (nm) { var u = state.users.find(function (x) { return x.name.split(' ')[0].toLowerCase() === nm.toLowerCase(); }); if (u) notify(u.id, 'mention', (user() || {}).name + ' mentioned you on ' + id, '#'); });
      addAudit('Commented', 'data', id, text.slice(0, 60)); commit();
    },

    /* MI-01: guarded status transition */
    transition: function (entityType, id, toState) {
      var e = findEntity(entityType, id); if (!e) return false;
      var lc = LIFECYCLES[entityType]; var from = e.status;
      if (lc && lc[from] && lc[from].indexOf(toState) === -1) { App.ui && App.ui.toast({ kind: 'error', msg: 'Illegal transition ' + from + ' → ' + toState }); return false; }
      e.status = toState; addAudit('Status → ' + toState, 'data', id, from + ' → ' + toState); commit(); return true;
    },

    /* MI-02: review status + rework loop */
    setReview: function (entityType, id, status, note) {
      var e = findEntity(entityType, id); if (!e) return;
      e.reviewStatus = status; e.improvementNotes = note || '';
      if (status === 'needs_improvement') {
        state.reworks.unshift({ id: U.uid('RWK'), entityType: entityType, entityId: id, reason: note || 'Needs improvement', by: session.userId, ownerId: e.ownerId || e.reviewerId || session.userId, ts: U.now().toISOString(), status: 'open', centerId: e.centerId, deptId: e.deptId });
        notify(e.ownerId, 'rework', 'Rework requested on ' + id, '#/rework');
      }
      addAudit(status === 'good' ? 'Marked done' : 'Flagged for improvement', 'data', id, note || ''); commit();
    },
    resolveRework: function (id) { var r = state.reworks.find(function (x) { return x.id === id; }); if (r) { r.status = 'resolved'; r.resolvedAt = U.now().toISOString(); addAudit('Resolved rework', 'data', r.entityId, ''); commit(); } },

    /* ---- MT: central billing ---- */
    meter: function (service, qty, ctx) {
      ctx = ctx || {};
      var centerId = ctx.centerId || (session.centerId !== 'ALL' ? session.centerId : 'HYD');
      var deptId = ctx.deptId || (session.deptId !== 'ALL' ? session.deptId : 'VOX');
      var rc = (state.rateCard || []).find(function (r) { return r.service === service; });
      var c = center(centerId); var orgId = c ? c.orgId : 'ORG-HKHT';
      var rate = rc ? ((rc.orgRates && rc.orgRates[orgId]) || rc.rate) : 1;
      // budget check
      var bud = (state.budgets || []).find(function (b) { return b.centerId === centerId && b.deptId === deptId && b.service === service && b.period === '2026-06'; });
      var cost = Math.round(qty * rate);
      if (bud && bud.hardStop && (bud.spent + cost) > bud.cap) {
        // raise budget-increase approval
        state.approvals.unshift({ id: U.uid('APR'), type: 'Budget increase', title: service + ' cap reached — ' + (c ? c.short : centerId) + ' · ' + (dept(deptId) || {}).name, entity: 'budget', entityId: bud.id, requestedBy: session.userId, approverRole: 'leadership', status: 'pending', priority: 'High', createdAt: U.now().toISOString(), slaDue: U.hoursFromNow(8).toISOString(), context: 'Hard cap of ' + bud.cap + ' reached on ' + service + '. Action blocked pending budget increase.' });
        commit();
        return { ok: false, blocked: true, budget: bud };
      }
      state.ledger.unshift({ id: U.uid('LG'), ts: U.now().toISOString(), service: service, qty: qty, unitRate: rate, cost: cost, orgId: orgId, centerId: centerId, deptId: deptId, userId: session.userId, refType: ctx.refType || 'Manual', refId: ctx.refId || '' });
      if (bud) { bud.spent += cost; var pct = bud.spent / bud.cap * 100; if (pct >= 80) genAlertInternal('budget', pct >= 100 ? 'high' : 'med', service + ' budget ' + Math.round(pct) + '% — ' + (c ? c.short : centerId), bud.id, centerId); }
      return { ok: true, blocked: false };
    },
    bumpBudget: function (id, addPct) { var b = (state.budgets || []).find(function (x) { return x.id === id; }); if (b) { b.cap = Math.round(b.cap * (1 + (addPct || 0.2))); addAudit('Increased budget', 'approval', id, '+' + Math.round((addPct || 0.2) * 100) + '%'); commit(); } },
    setRate: function (service, rate) { var r = (state.rateCard || []).find(function (x) { return x.service === service; }); if (r) { r.rate = rate; addAudit('Updated rate card', 'data', service, '₹' + rate); commit(); } },
    setEntitlements: function (centerId, list) { var c = center(centerId); if (c) { c.entitlements = list; addAudit('Updated entitlements', 'access', centerId, list.join(',')); commit(); } },
    markStatementBilled: function (centerId, period) { addAudit('Marked statement billed', 'export', centerId, period); commit(); },

    /* ---- alerts (LD-03) ---- */
    ackAlert: function (id) { var a = state.alerts.find(function (x) { return x.id === id; }); if (a) { a.read = true; commit(); } },
    ackAllAlerts: function () { state.alerts.forEach(function (a) { a.read = true; }); commit(); },

    /* ---- notifications (XC-02) ---- */
    markNotifRead: function (id) { var n = state.notifications.find(function (x) { return x.id === id; }); if (n) { n.read = true; commit(); } },
    markAllNotifsRead: function () { notifsFor().forEach(function (n) { n.read = true; }); commit(); },

    /* ---- AP: approver enhancements ---- */
    approveWithChanges: function (id, note) { this.decideApproval(id, 'approved', '[approved with changes] ' + (note || '')); },
    requestInfo: function (id, note) { var a = state.approvals.find(function (x) { return x.id === id; }); if (a) { a.status = 'info_requested'; a.note = note; notify(a.requestedBy, 'approval', 'Info requested on: ' + a.title, '#/approvals'); addAudit('Requested info', 'approval', a.entityId, note || ''); commit(); } },
    delegateApprovals: function (toUserId) { session.delegateTo = toUserId; addAudit('Delegated approvals', 'access', toUserId, ''); commit(); },

    /* ---- CM: campaign lifecycle ---- */
    setCampaignStatus: function (id, status) { return this.transition('campaign', id, status); },
    cloneCampaign: function (id) {
      var c = campaign(id); if (!c) return null;
      var copy = U.clone(c); copy.id = U.uid('CMP'); copy.name = c.name + ' (copy)'; copy.status = 'draft'; copy.approvalStatus = 'draft'; copy.spend = 0; copy.revenue = 0; copy.leads = 0; copy.conversions = 0; copy.daily = []; copy.comments = [];
      state.campaigns.unshift(copy); addAudit('Cloned campaign', 'data', copy.id, 'from ' + id); commit(); return copy.id;
    },
    applyOptimization: function (campaignId, rec) {
      var c = campaign(campaignId); if (!c) return;
      c.optApplied = c.optApplied || []; c.optApplied.push({ rec: rec, by: session.userId, ts: U.now().toISOString() });
      addAudit('Applied optimization', 'data', campaignId, rec); commit();
    },
    saveDraft: function (draft) { var i = state.campaignDrafts.findIndex(function (d) { return d.id === draft.id; }); if (i > -1) state.campaignDrafts[i] = draft; else state.campaignDrafts.unshift(draft); persist(); },
    runLandingQA: function (lpId) { var lp = state.landingPages.find(function (x) { return x.id === lpId; }); if (lp) { lp.issues = lp.issues.filter(function (i) { return i.sev !== 'high'; }); lp.qaScore = Math.min(99, lp.qaScore + 5); lp.lastQA = U.now().toISOString(); if (!lp.issues.length) lp.status = 'live'; addAudit('Ran landing QA', 'data', lpId, lp.qaScore + '/100'); commit(); } },

    /* ---- VO: voice ops ---- */
    snoozeTask: function (id, hours) { var t = state.tasks.find(function (x) { return x.id === id; }); if (t) { t.dueDate = U.hoursFromNow(hours || 24).toISOString(); t.status = 'Open'; t.slaStatus = 'On track'; addAudit('Snoozed task', 'data', id, '+' + (hours || 24) + 'h'); commit(); } },
    reassignEscalation: function (id, ownerId) { var e = state.escalations.find(function (x) { return x.id === id; }); if (e) { e.assigneeId = ownerId; notify(ownerId, 'escalation', 'Escalation assigned: ' + (e.contactName || ''), '#/wf002/escalations'); addAudit('Reassigned escalation', 'data', id, (user(ownerId) || {}).name); commit(); } },
    setEscalationPriority: function (id, p) { var e = state.escalations.find(function (x) { return x.id === id; }); if (e) { e.priority = p; addAudit('Changed priority', 'data', id, p); commit(); } },
    saveQAScore: function (callId, score, notes) { var c = state.calls.find(function (x) { return x.id === callId; }); if (c) { c.qa = { score: score, notes: notes, by: session.userId, ts: U.now().toISOString() }; addAudit('QA scored call', 'data', callId, score + '/100'); commit(); } },
    addScriptVersion: function (scriptId, version, content) { var s = state.scripts.find(function (x) { return x.id === scriptId; }); if (s) { s.versions = s.versions || []; s.versions.unshift({ version: s.version, opening: s.opening, ts: U.now().toISOString(), by: session.userId }); s.version = version; if (content) s.opening = content; s.status = 'review'; addAudit('New script version', 'data', scriptId, version); commit(); } },

    /* ---- XC: saved views, seen-state, undo ---- */
    saveView: function (screen, name, filter) { state.savedViews.unshift({ id: U.uid('VW'), screen: screen, name: name, filter: filter, by: session.userId }); commit(); },
    markSeen: function (key) { session.seen = session.seen || {}; session.seen[key] = U.now().toISOString(); persist(); },

    reset: reset
  };

  function ROLE_LABEL(role) { return (state.roles[role] || {}).label || role; }

  return {
    load: load, hydrate: hydrate, get: get, getSession: getSession, setSession: setSession,
    subscribe: subscribe, emit: emit, commit: commit, reset: reset,
    user: user, currentUser: currentUser, center: center, dept: dept, source: source, org: org,
    campaign: campaign, contact: contact, donorByContact: donorByContact, yatriByContact: yatriByContact,
    callsForContact: callsForContact, tasksForContact: tasksForContact, waForContact: waForContact,
    inScope: inScope, scoped: scoped, metrics: metrics, actions: actions, roleLabel: ROLE_LABEL,
    slaState: slaState, lifecycles: LIFECYCLES, notifsFor: notifsFor, unreadNotifCount: unreadNotifCount,
    entitlementsFor: entitlementsFor, findEntity: findEntity
  };
})();
