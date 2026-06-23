/* ============================================================
   Screen: Roles & Tenants admin (multi-tenant, RBAC, audit)
   ============================================================ */
App.screens['admin'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;
  var tab = 'roles';

  function render() {
    var s = store.get();
    var tabsBar = ui.tabs([
      { id: 'roles', label: 'Roles & access', icon: '👥', count: s.users.length },
      { id: 'tenants', label: 'Orgs · centers · entitlements', icon: '🏛️', count: (s.orgs || []).length },
      { id: 'workload', label: 'Workload', icon: '⚖️' },
      { id: 'audit', label: 'Audit trail', icon: '🔒', count: s.audit.length }
    ], tab, function (t) { tab = t; store.emit(); });

    var body = tab === 'roles' ? rolesTab(s) : tab === 'tenants' ? tenantsTab(s) : tab === 'workload' ? workloadTab(s) : auditTab(s);

    return el('div', {}, [
      ui.pageHead('Roles & Tenants', 'Multi-tenant from day one — role-based access, per-center/department scope, and approval hierarchies are first-class. Every sensitive action is audited.', null),
      tabsBar, body
    ]);
  }

  var ROLE_WF = {
    leadership: 'All workflows', workflow_manager: 'All workflows', data_custodian: 'WF-006', consent_custodian: 'WF-006',
    voice_ops: 'WF-002', supervisor: 'WF-002', telecaller: 'WF-002', marketer: 'WF-003', content_reviewer: 'WF-003',
    finance_reviewer: 'WF-003', donor_approver: 'WF-002 / WF-003 (approve)', org_admin: 'All workflows + admin'
  };

  function rolesTab(s) {
    return el('div', {}, [
      el('div.grid.cols-3.mb-16', {}, [
        ui.kpi({ icon: '👥', label: 'Users', value: s.users.length, accent: 'indigo' }),
        ui.kpi({ icon: '🎭', label: 'Roles', value: Object.keys(s.roles).length, accent: 'violet' }),
        ui.kpi({ icon: '🏛️', label: 'Centers', value: s.centers.length, accent: 'teal' })
      ]),
      ui.card({ pad: false, body: [ui.table({ columns: [
        { label: 'User', render: function (u) { return ui.personCell(u.name, u.email, u.id); } },
        { label: 'Role', render: function (u) { return ui.badge((s.roles[u.role] || {}).icon + ' ' + store.roleLabel(u.role), 'indigo'); } },
        { label: 'Workflow access', render: function (u) { return el('span.t-sm', { text: ROLE_WF[u.role] || '—' }); } },
        { label: 'Department', render: function (u) { return (store.dept(u.dept) || {}).name; } },
        { label: 'Center', render: function (u) { return (store.center(u.center) || {}).short; } },
        { label: '', render: function (u) { return el('button.btn.btn-sm', { onclick: function () { store.actions.login(u.id); ui.toast({ kind: 'info', title: 'Viewing as ' + u.name, msg: store.roleLabel(u.role) }); App.router.go('/'); } }, 'View as'); } }
      ], rows: s.users })] }),
      ui.note('info', 'Approval hierarchy: sensitive actions route to the right approver (donor → donor approver, financial → finance, content → content reviewer, high budget → leadership), each with a backup approver and SLA to prevent a single-person bottleneck.', '🧭')
    ]);
  }

  var MODS = [['wf006', 'WF-006'], ['wf002', 'WF-002'], ['wf003', 'WF-003']];
  function tenantsTab(s) {
    return el('div', {}, [
      ui.note('violet', 'Org → Center → Department hierarchy. <b>Module entitlements</b> per center gate which workflows that center has licensed (nav hides un-licensed modules). Platform admin manages all orgs; a center admin is scoped to their own.', '🏛️'),
      el('div.mt-12', {}, (s.orgs || []).map(function (o) {
        var centers = s.centers.filter(function (c) { return c.orgId === o.id; });
        return ui.card({ cls: 'mb-12', title: o.name, icon: '🏢', right: [ui.badge(o.plan, 'indigo')], body: [
          ui.table({ columns: [
            { label: 'Center', render: function (c) { return el('div', {}, [el('b.t-sm', { text: c.name }), el('div.t-xs.t-mut', { text: c.city + ' · ' + s.users.filter(function (u) { return u.center === c.id; }).length + ' users' })]); } },
            { label: 'Module entitlements', render: function (c) { return el('div.row.gap-6', {}, MODS.map(function (m) { var on = c.entitlements.indexOf(m[0]) > -1; return el('div.fchip' + (on ? '.active' : ''), { style: { fontSize: '11px' }, onclick: function () { var list = c.entitlements.slice(); var i = list.indexOf(m[0]); if (i > -1) list.splice(i, 1); else list.push(m[0]); store.actions.setEntitlements(c.id, list); ui.toast({ kind: 'success', msg: m[1] + (i > -1 ? ' disabled' : ' enabled') + ' for ' + c.short }); } }, m[1]); })); } }
          ], rows: centers })
        ] });
      })),
      ui.card({ title: 'Departments', icon: '🗂️', body: s.departments.map(function (d) {
        return el('div.row-between', { style: { padding: '10px 0', borderBottom: '1px solid var(--border)' } }, [el('div.row.gap-8', {}, [el('span', { text: d.icon }), el('b', { text: d.name })]), el('span.t-xs.t-mut', { text: s.users.filter(function (u) { return u.dept === d.id; }).length + ' users' })]);
      }) })
    ]);
  }

  /* MI-10: workload + AP-03 backup approver */
  function workloadTab(s) {
    var rows = s.users.map(function (u) {
      var tasks = s.tasks.filter(function (t) { return t.ownerId === u.id && t.status !== 'Completed'; }).length;
      var escs = s.escalations.filter(function (e) { return e.assigneeId === u.id && e.status !== 'Resolved'; }).length;
      var apprs = s.approvals.filter(function (a) { return a.status === 'pending' && a.approverRole === u.role; }).length;
      return { u: u, tasks: tasks, escs: escs, apprs: apprs, total: tasks + escs + apprs };
    }).filter(function (r) { return r.total > 0; });
    return el('div', {}, [
      ui.note('info', 'Open-item load per owner — supervisors balance work; reassignment can target the least-loaded. Backup approvers prevent single-person bottlenecks.', '⚖️'),
      el('div.mt-12', {}, ui.card({ pad: false, body: [ui.table({ sortable: true, columns: [
        { label: 'Owner', sortVal: function (r) { return r.u.name; }, render: function (r) { return ui.personCell(r.u.name, store.roleLabel(r.u.role), r.u.id); } },
        { label: 'Tasks', num: true, key: 'tasks' }, { label: 'Escalations', num: true, key: 'escs' }, { label: 'Approvals', num: true, key: 'apprs' },
        { label: 'Total load', num: true, sortVal: function (r) { return r.total; }, render: function (r) { return el('b', { text: r.total, style: { color: r.total > 6 ? 'var(--red-600)' : r.total > 3 ? 'var(--amber-600)' : 'var(--green-600)' } }); } }
      ], rows: U.sortBy(rows, function (r) { return r.total; }, 'desc') })] }))
    ]);
  }

  function auditTab(s) {
    var fType = 'all', q = '';
    var wrap = el('div');
    function draw() {
      U.clear(wrap);
      var audit = U.sortBy(s.audit, function (a) { return new Date(a.timestamp).getTime(); }, 'desc').filter(function (a) { return (fType === 'all' || a.type === fType) && (!q || (a.action + a.detail + a.entityId + (store.user(a.actorId) || {}).name).toLowerCase().indexOf(q) > -1); });
      var bar = el('div.filterbar', {}, [
        (function () { var i = el('input.input', { placeholder: 'Search audit…', value: q, style: { maxWidth: '260px' } }); i.addEventListener('input', U.debounce(function (e) { q = e.target.value.toLowerCase(); draw(); }, 200)); return el('div.search-box', {}, [el('span.ico', { text: '🔍' }), i]); })(),
        el('div.chips', {}, ['all', 'data', 'approval', 'merge', 'consent', 'export', 'access', 'import'].map(function (t) { return el('div.fchip' + (fType === t ? '.active' : ''), { onclick: function () { fType = t; draw(); } }, t); })),
        el('div.grow'),
        el('button.btn', { onclick: function () { var csv = U.toCSV(audit.map(function (a) { return { when: a.timestamp, actor: (store.user(a.actorId) || {}).name, action: a.action, type: a.type, entity: a.entityId, detail: a.detail }; })); var ok = U.download('audit_log.csv', csv); ui.toast({ kind: ok ? 'success' : 'info', msg: ok ? 'Audit exported.' : 'Export logged.' }); } }, '⬇ Export')
      ]);
      wrap.appendChild(bar);
      wrap.appendChild(ui.card({ pad: false, body: [ui.table({ pageSize: 20, columns: [
        { label: 'When', render: function (a) { return el('span.t-sm', { text: U.fmtDateTime(a.timestamp) }); } },
        { label: 'Actor', render: function (a) { return (store.user(a.actorId) || { name: a.actorId }).name; } },
        { label: 'Action', render: function (a) { return el('b.t-sm', { text: a.action }); } },
        { label: 'Type', render: function (a) { return ui.badge(a.type, a.type === 'export' ? 'amber' : a.type === 'access' ? 'violet' : a.type === 'approval' ? 'green' : a.type === 'merge' ? 'indigo' : 'neutral'); } },
        { label: 'Before → After', render: function (a) { return a.field ? el('span.t-xs.t-mut', { text: a.field + ': ' + (a.before == null ? '∅' : a.before) + ' → ' + (a.after == null ? '∅' : a.after) }) : el('span.t-xs.t-mut', { text: a.detail }); } },
        { label: 'Entity', render: function (a) { return ui.idChip(a.entityId); } }
      ], rows: audit })] }));
    }
    draw();
    return wrap;
  }

  return { render: render, title: 'Roles & Tenants' };
})();
