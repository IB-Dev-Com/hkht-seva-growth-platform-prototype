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
      { id: 'tenants', label: 'Centers & departments', icon: '🏛️' },
      { id: 'audit', label: 'Audit trail', icon: '🔒', count: s.audit.length }
    ], tab, function (t) { tab = t; store.emit(); });

    var body = tab === 'roles' ? rolesTab(s) : tab === 'tenants' ? tenantsTab(s) : auditTab(s);

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

  function tenantsTab(s) {
    return el('div.grid', { style: { gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' } }, [
      ui.card({ title: 'Centers', icon: '🏛️', body: s.centers.map(function (c) {
        var users = s.users.filter(function (u) { return u.center === c.id; }).length;
        var camps = s.campaigns.filter(function (x) { return x.centerId === c.id; }).length;
        return el('div.row-between', { style: { padding: '12px 0', borderBottom: '1px solid var(--border)' } }, [
          el('div', {}, [el('div.row.gap-8', {}, [el('b', { text: c.name }), c.primary ? ui.badge('Primary', 'saffron') : null]), el('div.t-xs.t-mut.mt-2', { text: c.city + ' · ' + users + ' users · ' + camps + ' campaigns' })]),
          ui.idChip(c.id)
        ]);
      }) }),
      ui.card({ title: 'Departments', icon: '🗂️', body: s.departments.map(function (d) {
        var users = s.users.filter(function (u) { return u.dept === d.id; }).length;
        return el('div.row-between', { style: { padding: '12px 0', borderBottom: '1px solid var(--border)' } }, [
          el('div.row.gap-8', {}, [el('span', { text: d.icon }), el('b', { text: d.name })]),
          el('span.t-xs.t-mut', { text: users + ' users' })
        ]);
      }) }),
      el('div', { style: { gridColumn: '1 / -1' } }, ui.note('violet', 'Centers are billed centrally but tracked separately — the platform is built to add new centers (later phase) without re-architecting. Switch center/department scope from the top bar to see data filter live.', '🏛️'))
    ]);
  }

  function auditTab(s) {
    var audit = U.sortBy(s.audit, function (a) { return new Date(a.timestamp).getTime(); }, 'desc');
    return ui.card({ pad: false, body: [ui.table({ columns: [
      { label: 'When', render: function (a) { return el('span.t-sm', { text: U.fmtDateTime(a.timestamp) }); } },
      { label: 'Actor', render: function (a) { return (store.user(a.actorId) || { name: a.actorId }).name; } },
      { label: 'Action', render: function (a) { return el('b.t-sm', { text: a.action }); } },
      { label: 'Type', render: function (a) { return ui.badge(a.type, a.type === 'export' ? 'amber' : a.type === 'access' ? 'violet' : a.type === 'approval' ? 'green' : a.type === 'merge' ? 'indigo' : 'neutral'); } },
      { label: 'Entity', render: function (a) { return ui.idChip(a.entityId); } },
      { label: 'Detail', render: function (a) { return el('span.t-sm.t-mut', { text: a.detail }); } }
    ], rows: audit })] });
  }

  return { render: render, title: 'Roles & Tenants' };
})();
