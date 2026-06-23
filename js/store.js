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

  function load() {
    try {
      var raw = sessionStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : App.seed.build();
    } catch (e) { state = App.seed.build(); }
    try {
      var s = sessionStorage.getItem(SKEY);
      session = s ? JSON.parse(s) : defaultSession();
    } catch (e) { session = defaultSession(); }
  }
  function persist() {
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    try { sessionStorage.setItem(SKEY, JSON.stringify(session)); } catch (e) {}
  }
  function reset() {
    state = App.seed.build();
    persist(); emit();
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

  /* ---- tenant scope filter ---- */
  function inScope(rec) {
    if (!rec) return true;
    if (session.centerId !== 'ALL' && rec.centerId && rec.centerId !== session.centerId) return false;
    if (session.deptId !== 'ALL' && rec.deptId && rec.deptId !== session.deptId) return false;
    return true;
  }
  function scoped(arr) { return (arr || []).filter(inScope); }

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
  function addAudit(action, type, entityId, detail) {
    state.audit.unshift({ id: U.uid('AUD'), actorId: session.userId, action: action, type: type, entityId: entityId, detail: detail, timestamp: U.now().toISOString() });
  }

  var actions = {
    login: function (userId) {
      var u = user(userId);
      if (!u) return;
      session.userId = u.id; session.role = u.role; session.authed = true;
      session.centerId = u.role === 'leadership' || u.role === 'workflow_manager' ? 'ALL' : u.center;
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

    reset: reset
  };

  function ROLE_LABEL(role) { return (state.roles[role] || {}).label || role; }

  return {
    load: load, get: get, getSession: getSession, setSession: setSession,
    subscribe: subscribe, emit: emit, commit: commit, reset: reset,
    user: user, currentUser: currentUser, center: center, dept: dept, source: source,
    campaign: campaign, contact: contact, donorByContact: donorByContact, yatriByContact: yatriByContact,
    callsForContact: callsForContact, tasksForContact: tasksForContact, waForContact: waForContact,
    inScope: inScope, scoped: scoped, metrics: metrics, actions: actions, roleLabel: ROLE_LABEL
  };
})();
