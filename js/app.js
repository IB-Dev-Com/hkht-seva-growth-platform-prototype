/* ============================================================
   AI for Seva — App bootstrap: shell, nav (RBAC), tenant switch
   ============================================================ */
(function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;

  /* ---------- Navigation model ---------- */
  var NAV = [
    { group: 'Platform', tag: null, items: [
      { path: '/mywork', screen: 'mywork', label: 'My Work', icon: '🎯', wf: 'platform', badge: 'mywork' },
      { path: '/', screen: 'command-center', label: 'Command Center', icon: '🛰️', wf: 'platform' },
      { path: '/journey', screen: 'golden-journey', label: 'Golden Journey', icon: '🧭', wf: 'platform' },
      { path: '/attribution', screen: 'attribution', label: 'Source → Revenue', icon: '🔗', wf: 'platform' },
      { path: '/ai-performance', screen: 'ai-performance', label: 'AI Agent Performance', icon: '🤖', wf: 'platform' },
      { path: '/approvals', screen: 'approvals', label: 'Approvals', icon: '✅', wf: 'platform', badge: 'approvals' },
      { path: '/golive', screen: 'golive', label: 'Production Readiness', icon: '🚦', wf: 'platform' },
      { path: '/sla', screen: 'sla-board', label: 'SLA Board', icon: '⏱️', wf: 'platform' },
      { path: '/rework', screen: 'rework', label: 'Rework Queue', icon: '🔁', wf: 'platform', badge: 'rework' },
      { path: '/usage', screen: 'usage-cost', label: 'Usage & Cost', icon: '💳', wf: 'platform' },
      { path: '/billing', screen: 'billing', label: 'Billing & Statements', icon: '🧾', wf: 'platform' },
      { path: '/continuity', screen: 'continuity', label: 'Service Continuity', icon: '🛟', wf: 'platform' },
      { path: '/kcke', screen: 'kcke', label: 'KCKE & Media Boundary', icon: '📖', wf: 'platform' },
      { path: '/admin', screen: 'admin', label: 'Roles & Tenants', icon: '⚙️', wf: 'admin' }
    ]},
    { group: 'WF-006 · CRM & Data Governance', tag: 'WF-006', items: [
      { path: '/wf006/contacts', screen: 'wf006-contacts', label: 'Master Contacts', icon: '👤', wf: 'wf006' },
      { path: '/wf006/dedupe', screen: 'wf006-dedupe', label: 'Dedupe & Identity', icon: '🔗', wf: 'wf006', badge: 'merges' },
      { path: '/wf006/quality', screen: 'wf006-quality', label: 'Data Quality', icon: '📊', wf: 'wf006' },
      { path: '/wf006/consent', screen: 'wf006-consent', label: 'Consent & DND', icon: '🛡️', wf: 'wf006' },
      { path: '/wf006/intake', screen: 'wf006-intake', label: 'Intake & Import', icon: '📥', wf: 'wf006' },
      { path: '/wf006/segments', screen: 'wf006-segments', label: 'Segment Studio', icon: '🎯', wf: 'wf006' },
      { path: '/wf006/relationships', screen: 'wf006-relationships', label: 'Relationship Graph', icon: '🕸️', wf: 'wf006' },
      { path: '/wf006/sync', screen: 'wf006-sync', label: 'CRM Sync', icon: '🔄', wf: 'wf006' },
      { path: '/wf006/api', screen: 'wf006-api-registry', label: 'API Registry', icon: '🔌', wf: 'wf006' }
    ]},
    { group: 'WF-002 · Voice Agent & Follow-up', tag: 'WF-002', items: [
      { path: '/wf002/readiness', screen: 'wf002-readiness', label: 'Calling Readiness', icon: '🚦', wf: 'wf002' },
      { path: '/wf002/console', screen: 'wf002-call-console', label: 'Call Console', icon: '🎙️', wf: 'wf002' },
      { path: '/wf002/tasks', screen: 'wf002-tasks', label: 'Follow-up Tasks', icon: '📋', wf: 'wf002', badge: 'overdue' },
      { path: '/wf002/whatsapp', screen: 'wf002-whatsapp', label: 'WhatsApp Follow-up', icon: '💬', wf: 'wf002' },
      { path: '/wf002/escalations', screen: 'wf002-escalations', label: 'Escalations', icon: '🚨', wf: 'wf002', badge: 'escalations' },
      { path: '/wf002/scripts', screen: 'wf002-scripts', label: 'Voice Scripts', icon: '📜', wf: 'wf002' },
      { path: '/wf002/dashboard', screen: 'wf002-dashboard', label: 'Voice Dashboard', icon: '📈', wf: 'wf002' }
    ]},
    { group: 'WF-003 · Digital Marketing', tag: 'WF-003', items: [
      { path: '/wf003/campaigns', screen: 'wf003-campaigns', label: 'Campaigns', icon: '📣', wf: 'wf003' },
      { path: '/wf003/builder', screen: 'wf003-builder', label: 'New Campaign', icon: '✨', wf: 'wf003' },
      { path: '/wf003/content', screen: 'wf003-content', label: 'Content & Copy', icon: '✍️', wf: 'wf003' },
      { path: '/wf003/creative', screen: 'wf003-creative', label: 'Creative & Media', icon: '🎨', wf: 'wf003' },
      { path: '/wf003/remarketing', screen: 'wf003-remarketing', label: 'Remarketing', icon: '♻️', wf: 'wf003' },
      { path: '/wf003/triggers', screen: 'wf003-triggers', label: 'Behavior Triggers', icon: '⚡', wf: 'wf003' },
      { path: '/wf003/propensity', screen: 'wf003-propensity', label: 'Donor Propensity', icon: '🎯', wf: 'wf003' },
      { path: '/wf003/learning', screen: 'wf003-learning', label: 'Campaign Learning', icon: '📘', wf: 'wf003' },
      { path: '/wf003/dashboard', screen: 'wf003-dashboard', label: 'Marketing Dashboard', icon: '📈', wf: 'wf003' }
    ]}
  ];

  // detail routes (not in nav)
  var DETAIL_ROUTES = [
    ['/wf006/contact/:id', 'wf006-contact-detail'],
    ['/wf002/call/:id', 'wf002-call-detail'],
    ['/wf003/campaign/:id', 'wf003-campaign-detail']
  ];

  /* ---------- RBAC: which workflows a role can access ---------- */
  var ROLE_WF = {
    leadership: ['platform', 'admin', 'wf006', 'wf002', 'wf003'],
    workflow_manager: ['platform', 'admin', 'wf006', 'wf002', 'wf003'],
    org_admin: ['platform', 'admin', 'wf006', 'wf002', 'wf003'],
    center_admin: ['platform', 'admin', 'wf006', 'wf002', 'wf003'],
    platform_admin: ['platform', 'admin', 'wf006', 'wf002', 'wf003'],
    data_custodian: ['platform', 'wf006'],
    consent_custodian: ['platform', 'wf006'],
    voice_ops: ['platform', 'wf002'],
    supervisor: ['platform', 'wf002'],
    telecaller: ['platform', 'wf002'],
    marketer: ['platform', 'wf003'],
    content_reviewer: ['platform', 'wf003'],
    finance_reviewer: ['platform', 'wf003'],
    donor_approver: ['platform', 'wf002', 'wf003']
  };
  function canSee(item) {
    var sess = store.getSession();
    var allowed = ROLE_WF[sess.role] || ['platform'];
    if (item.wf === 'admin') { if (allowed.indexOf('admin') === -1) return false; }
    else if (allowed.indexOf(item.wf) === -1) return false;
    // entitlement gating (MT-09): when scoped to a single center, hide modules it isn't licensed for
    if (sess.centerId && sess.centerId !== 'ALL' && (item.wf === 'wf006' || item.wf === 'wf002' || item.wf === 'wf003')) {
      var ent = store.entitlementsFor(sess.centerId) || [];
      if (ent.indexOf(item.wf) === -1) return false;
    }
    return true;
  }
  function screenAllowed(screenName) {
    // find nav item
    var found = null;
    NAV.forEach(function (g) { g.items.forEach(function (it) { if (it.screen === screenName) found = it; }); });
    if (!found) return true; // detail screens inherit
    return canSee(found);
  }

  /* ---------- register routes ---------- */
  NAV.forEach(function (g) { g.items.forEach(function (it) { router.define(it.path, it.screen); }); });
  DETAIL_ROUTES.forEach(function (r) { router.define(r[0], r[1]); });

  /* ---------- badge counts ---------- */
  function badgeCount(key) {
    var s = store.get(); var sess = store.getSession();
    if (key === 'approvals') return s.approvals.filter(function (a) { return a.status === 'pending'; }).length;
    if (key === 'overdue') return s.tasks.filter(function (t) { return t.status === 'Overdue'; }).length;
    if (key === 'escalations') return s.escalations.filter(function (e) { return e.status !== 'Resolved'; }).length;
    if (key === 'merges') return s.merges.filter(function (m) { return m.status === 'pending'; }).length;
    if (key === 'rework') return (s.reworks || []).filter(function (r) { return r.status === 'open'; }).length;
    if (key === 'mywork') return myWorkCount();
    return 0;
  }
  function myWorkCount() {
    var s = store.get(); var me = store.getSession().userId; var role = store.getSession().role;
    var ap = s.approvals.filter(function (a) { return a.status === 'pending' && a.approverRole === role; }).length;
    var tk = s.tasks.filter(function (t) { return t.ownerId === me && t.status !== 'Completed'; }).length;
    var es = s.escalations.filter(function (e) { return e.assigneeId === me && e.status !== 'Resolved'; }).length;
    var rw = (s.reworks || []).filter(function (r) { return r.ownerId === me && r.status === 'open'; }).length;
    return ap + tk + es + rw;
  }

  /* ---------- Sidebar ---------- */
  function buildSidebar(activeScreen) {
    var sess = store.getSession();
    var nav = el('nav.sb-nav', {});
    NAV.forEach(function (g) {
      var items = g.items.filter(canSee);
      if (!items.length) return;
      nav.appendChild(el('div.sb-group', {}, [
        el('div.sb-group-label', {}, [g.group.split('·')[0].trim(), g.tag ? el('span.wf-tag', { text: g.tag }) : null]),
        el('div', {}, items.map(function (it) {
          var bc = it.badge ? badgeCount(it.badge) : 0;
          return el('a.sb-link' + (it.screen === activeScreen ? '.active' : ''), { href: '#' + it.path }, [
            el('span.ico', { text: it.icon }),
            el('span', { text: it.label }),
            bc > 0 ? el('span.badge-count', { text: bc }) : null
          ]);
        }))
      ]));
    });
    return el('aside.sidebar#sidebar', {}, [
      el('div.sb-brand', {}, [
        el('div.sb-logo', { text: 'ॐ' }),
        el('div.sb-brand-txt', {}, [el('b', { text: 'AI for Seva' }), el('span', { text: 'HKHT · Hyderabad' })])
      ]),
      nav,
      el('div.sb-foot', {}, [
        el('div.demo-pill', {}, ['● ', 'Prototype · mock data']),
        el('div', { html: 'All AI / voice / WhatsApp / ad calls are <b>simulated</b>. No live backend.' })
      ])
    ]);
  }

  /* ---------- Topbar (tenant + role switcher) ---------- */
  function buildTopbar(crumbTitle) {
    var sess = store.getSession();
    var s = store.get();
    var u = store.currentUser();
    var canSwitchCenter = ['leadership', 'workflow_manager', 'org_admin', 'center_admin', 'platform_admin'].indexOf(sess.role) > -1;
    var canSwitchOrg = sess.role === 'platform_admin';

    // org switcher (platform admin only)
    var orgSel = el('select', { onchange: function (e) { store.setSession({ orgId: e.target.value, centerId: 'ALL' }); } });
    orgSel.appendChild(el('option', { value: 'ALL', text: 'All Orgs' }));
    (s.orgs || []).forEach(function (o) { var op = el('option', { value: o.id, text: o.short }); if (o.id === sess.orgId) op.selected = true; orgSel.appendChild(op); });

    // center switcher (scoped to current org)
    var centerSel = el('select', { onchange: function (e) { store.setSession({ centerId: e.target.value }); } });
    centerSel.appendChild(el('option', { value: 'ALL', text: 'All Centers' }));
    s.centers.filter(function (c) { return sess.orgId === 'ALL' || !sess.orgId || c.orgId === sess.orgId; }).forEach(function (c) { var o = el('option', { value: c.id, text: c.short }); if (c.id === sess.centerId) o.selected = true; centerSel.appendChild(o); });
    if (sess.centerId === 'ALL') centerSel.value = 'ALL';

    var deptSel = el('select', { onchange: function (e) { store.setSession({ deptId: e.target.value }); } });
    deptSel.appendChild(el('option', { value: 'ALL', text: 'All Departments' }));
    s.departments.forEach(function (d) { var o = el('option', { value: d.id, text: d.name }); if (d.id === sess.deptId) o.selected = true; deptSel.appendChild(o); });

    var roleBadge = el('button.role-badge', { onclick: openRoleMenu }, [
      ui.avatar(u.name, u.id),
      el('div.who', {}, [el('b', { text: u.name }), el('span', { text: store.roleLabel(u.role) })]),
      el('span.ico', { text: '▾', style: { color: 'var(--text-3)', fontSize: '11px' } })
    ]);

    // alerts + notifications
    var unreadAlerts = (s.alerts || []).filter(function (a) { return !a.read && store.inScope({ centerId: a.centerId }); }).length;
    var unreadNotifs = store.unreadNotifCount();
    var bellAlerts = topIcon('🔔', unreadAlerts, function (e) { openAlertsPanel(e); }, 'Alerts');
    var bellNotif = topIcon('✉️', unreadNotifs, function (e) { openNotifPanel(e); }, 'Notifications');
    var search = topIcon('🔍', 0, function () { openPalette(); }, 'Search (Ctrl/⌘ K)');

    return el('header.topbar', {}, [
      el('button.menu-btn', { onclick: function () { U.$('#sidebar').classList.toggle('open'); }, 'aria-label': 'Menu' }, '☰'),
      el('div.crumbs', {}, [el('span', { text: 'AI for Seva' }), el('span', { text: '/' }), el('b', { text: crumbTitle || '' })]),
      el('div.topbar-spacer'),
      search, bellAlerts, bellNotif,
      canSwitchOrg ? el('div.tenant-chip', {}, [el('span.ico', { text: '🏢' }), orgSel]) : null,
      canSwitchCenter ? el('div.tenant-chip', {}, [el('span.dot'), el('span.ico', { text: '🏛️' }), centerSel]) : el('div.tenant-chip', {}, [el('span.ico', { text: '🏛️' }), el('span', { text: store.center(sess.centerId) ? store.center(sess.centerId).short : 'Center' })]),
      el('div.tenant-chip', {}, [el('span.ico', { text: '🗂️' }), deptSel]),
      roleBadge
    ]);
  }

  function topIcon(icon, count, onclick, title) {
    return el('button.btn.btn-icon.btn-ghost', { onclick: onclick, title: title, style: { position: 'relative' } }, [
      el('span', { text: icon }),
      count > 0 ? el('span', { text: count > 9 ? '9+' : count, style: { position: 'absolute', top: '0', right: '0', background: 'var(--red-500)', color: '#fff', fontSize: '9px', fontWeight: '700', minWidth: '15px', height: '15px', borderRadius: '99px', display: 'grid', placeContent: 'center', padding: '0 3px' } }) : null
    ]);
  }
  function openAlertsPanel(e) {
    e.stopPropagation(); closeMenus();
    var s = store.get(); var rect = e.currentTarget.getBoundingClientRect();
    var alerts = (s.alerts || []).filter(function (a) { return store.inScope({ centerId: a.centerId }); });
    var pop = el('div.menu-pop', { style: { top: (rect.bottom + 6) + 'px', right: '120px', minWidth: '340px', maxHeight: '70vh', overflowY: 'auto' } }, [
      el('div.row-between', { style: { padding: '6px 11px' } }, [el('div.mh', { text: 'Alerts', style: { padding: 0 } }), el('a.t-xs', { onclick: function () { store.actions.ackAllAlerts(); closeMenus(); }, style: { cursor: 'pointer' } }, 'Mark all read')])
    ].concat(alerts.length ? alerts.slice(0, 10).map(function (a) {
      return el('div.mi', { onclick: function () { store.actions.ackAlert(a.id); closeMenus(); } }, [
        el('span.ico', { text: a.sev === 'high' ? '🔴' : a.sev === 'med' ? '🟡' : '⚪' }),
        el('div', {}, [el('div', { text: a.title, style: { fontWeight: a.read ? 400 : 700, fontSize: '12.5px' } }), el('div.t-xs.t-mut3', { text: U.ago(a.ts) + (a.centerId ? ' · ' + (store.center(a.centerId) || {}).short : '') })])
      ]);
    }) : [el('div.mi', {}, 'No alerts')]));
    document.body.appendChild(pop); setTimeout(function () { document.addEventListener('click', closeMenus); }, 0);
  }
  function openNotifPanel(e) {
    e.stopPropagation(); closeMenus();
    var rect = e.currentTarget.getBoundingClientRect();
    var notifs = store.notifsFor();
    var pop = el('div.menu-pop', { style: { top: (rect.bottom + 6) + 'px', right: '70px', minWidth: '340px', maxHeight: '70vh', overflowY: 'auto' } }, [
      el('div.row-between', { style: { padding: '6px 11px' } }, [el('div.mh', { text: 'Notifications', style: { padding: 0 } }), el('a.t-xs', { onclick: function () { store.actions.markAllNotifsRead(); closeMenus(); }, style: { cursor: 'pointer' } }, 'Mark all read')])
    ].concat(notifs.length ? notifs.slice(0, 12).map(function (n) {
      return el('div.mi', { onclick: function () { store.actions.markNotifRead(n.id); closeMenus(); if (n.ref && n.ref.indexOf('#') === 0) router.go(n.ref.slice(1)); } }, [
        el('span.ico', { text: n.kind === 'approval' ? '✅' : n.kind === 'task' ? '📋' : n.kind === 'escalation' ? '🚨' : n.kind === 'mention' ? '💬' : '🔁' }),
        el('div', {}, [el('div', { text: n.title, style: { fontWeight: n.read ? 400 : 700, fontSize: '12.5px' } }), el('div.t-xs.t-mut3', { text: U.ago(n.ts) })])
      ]);
    }) : [el('div.mi', {}, 'No notifications')]));
    document.body.appendChild(pop); setTimeout(function () { document.addEventListener('click', closeMenus); }, 0);
  }

  /* ---------- Command palette (XC-01) ---------- */
  function openPalette() {
    var s = store.get();
    var idx = [];
    NAV.forEach(function (g) { g.items.filter(canSee).forEach(function (it) { idx.push({ t: it.icon + ' ' + it.label, sub: 'Screen', go: it.path }); }); });
    s.contacts.slice(0, 60).forEach(function (c) { idx.push({ t: c.name, sub: c.id + ' · contact', go: '/wf006/contact/' + c.id }); });
    s.campaigns.forEach(function (c) { idx.push({ t: c.name, sub: c.id + ' · campaign', go: '/wf003/campaign/' + c.id }); });
    s.calls.slice(0, 40).forEach(function (c) { idx.push({ t: c.contactName + ' — call', sub: c.id + ' · call', go: '/wf002/call/' + c.id }); });
    var input = el('input.input', { placeholder: 'Search screens, contacts, campaigns, IDs…', style: { fontSize: '15px', padding: '12px' } });
    var listBox = el('div', { style: { maxHeight: '50vh', overflowY: 'auto', marginTop: '10px' } });
    function renderList() {
      var q = input.value.trim().toLowerCase(); U.clear(listBox);
      var res = (q ? idx.filter(function (x) { return (x.t + ' ' + x.sub).toLowerCase().indexOf(q) > -1; }) : idx.slice(0, 8)).slice(0, 30);
      res.forEach(function (r) { listBox.appendChild(el('div.mi', { onclick: function () { m.close(); router.go(r.go); } }, [el('div', {}, [el('div', { text: r.t, style: { fontWeight: 600, fontSize: '13px' } }), el('div.t-xs.t-mut3', { text: r.sub })])])); });
      if (!res.length) listBox.appendChild(el('div.empty', {}, 'No matches'));
    }
    input.addEventListener('input', renderList);
    var m = ui.modal({ title: 'Quick search', body: el('div', {}, [input, listBox]) });
    setTimeout(function () { input.focus(); renderList(); }, 30);
  }

  function openRoleMenu(e) {
    e.stopPropagation();
    var s = store.get();
    var rect = e.currentTarget.getBoundingClientRect();
    closeMenus();
    var pop = el('div.menu-pop', { style: { top: (rect.bottom + 6) + 'px', right: '22px', minWidth: '260px', maxHeight: '70vh', overflowY: 'auto' } }, [
      el('div.mh', { text: 'Switch role / persona (demo)' })
    ].concat(s.users.map(function (u) {
      return el('div.mi' + (u.id === store.getSession().userId ? '.active' : ''), { onclick: function () { store.actions.login(u.id); closeMenus(); ui.toast({ kind: 'info', title: 'Viewing as ' + u.name, msg: store.roleLabel(u.role) }); router.go('/'); } }, [
        ui.avatar(u.name, u.id, 26),
        el('div', {}, [el('div', { text: u.name, style: { fontWeight: 600 } }), el('div.t-xs.t-mut', { text: store.roleLabel(u.role) + ' · ' + (store.dept(u.dept) || {}).name })])
      ]);
    })).concat([
      el('div.sep'),
      el('div.mi', { onclick: function () { closeMenus(); store.reset(); ui.toast({ kind: 'success', msg: 'Demo data reset' }); } }, [el('span.ico', { text: '↺' }), 'Reset demo data']),
      el('div.mi', { onclick: function () { closeMenus(); store.actions.logout(); render(); } }, [el('span.ico', { text: '⎋' }), 'Sign out'])
    ]));
    document.body.appendChild(pop);
    setTimeout(function () { document.addEventListener('click', closeMenus); }, 0);
  }
  function closeMenus() { U.$$('.menu-pop').forEach(function (m) { m.remove(); }); document.removeEventListener('click', closeMenus); }

  /* ---------- Render ---------- */
  function render() {
    var sess = store.getSession();
    var root = U.$('#app-root');
    var splash = U.$('#boot-splash'); if (splash) splash.remove();

    // not authed → login
    if (!sess.authed) {
      U.clear(root);
      root.appendChild(App.screens['login'].render());
      return;
    }

    var cur = router.getCurrent() || { screen: 'command-center', params: {}, query: {} };
    var screenName = cur.screen;
    var screen = App.screens[screenName];

    // 404 / unknown
    if (!screen || screenName === '404') {
      screen = { render: function () { return notFound(cur.path); }, title: 'Not found' };
    }
    // RBAC block
    if (!screenAllowed(screenName)) {
      screen = { render: function () { return accessDenied(); }, title: 'Access denied' };
    }

    var contentNode;
    try { contentNode = screen.render(cur.params, cur.query); }
    catch (err) { console.error(err); contentNode = errorBlock(err); }

    var title = (typeof screen.title === 'function' ? screen.title(cur.params) : screen.title) || '';

    U.clear(root);
    var main = el('div.main-wrap', {}, [
      buildTopbar(title),
      el('main.content.anim-in', {}, contentNode)
    ]);
    root.appendChild(el('div.app-shell', {}, [buildSidebar(screenName), main]));
    window.scrollTo(0, 0);
  }

  function notFound(path) {
    return el('div', {}, [ui.emptyState({ icon: '🧭', title: 'Page not found', sub: path, action: el('a.btn.btn-primary', { href: '#/' }, 'Back to Command Center') })]);
  }
  function accessDenied() {
    return el('div', {}, [ui.emptyState({ icon: '🔒', title: 'Access restricted', sub: 'Your current role does not have access to this workflow. Switch persona from the top-right to explore role-based access.', action: el('a.btn', { href: '#/' }, 'Back to Command Center') })]);
  }
  function errorBlock(err) {
    return el('div.card.card-pad', {}, [el('h3', { text: 'Screen error' }), el('pre.t-sm.t-mut', { text: String(err && err.stack || err), style: { whiteSpace: 'pre-wrap', marginTop: '10px' } })]);
  }

  /* ---------- boot ---------- */
  var hasCache = store.load();
  store.subscribe(function () { render(); });

  function startApp() { router.start(function () { render(); }); }

  if (hasCache) {
    // resume this session's working dataset instantly
    startApp();
  } else {
    // hydrate from the mock backend (JSON tables under /data), then start
    App.api.loadState().then(function (state) {
      store.hydrate(state);
      startApp();
    }).catch(function (err) {
      console.error('Boot hydrate failed', err);
      store.hydrate(App.seed.build());
      startApp();
    });
  }

  // ⌘K / Ctrl-K command palette
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (store.getSession().authed) openPalette(); }
  });
  // expose for screens that want to trigger it
  App.openPalette = openPalette;
})();
