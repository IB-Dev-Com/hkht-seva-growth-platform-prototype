/* ============================================================
   Screen: Roles & Tenants admin (multi-tenant, RBAC, audit)
   ============================================================ */
App.screens['admin'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;
  var tab = 'roles';

  function render() {
    var s = store.get();
    var tabsBar = ui.tabs([
      { id: 'hierarchy', label: 'Hierarchy', icon: '🌳', count: (s.orgs || []).length + 'org' },
      { id: 'roles', label: 'Users & roles', icon: '👥', count: s.users.length },
      { id: 'permissions', label: 'Permissions', icon: '🔑' },
      { id: 'policies', label: 'Approval policies', icon: '🧭', count: Object.keys(s.approvalPolicies || {}).length },
      { id: 'tenants', label: 'Centers · entitlements', icon: '🏛️' },
      { id: 'workload', label: 'Workload', icon: '⚖️' },
      { id: 'audit', label: 'Audit trail', icon: '🔒', count: s.audit.length }
    ], tab, function (t) { tab = t; store.emit(); });

    var body = tab === 'hierarchy' ? hierarchyTab(s) : tab === 'roles' ? rolesTab(s) : tab === 'permissions' ? permsTab(s)
      : tab === 'policies' ? policiesTab(s) : tab === 'tenants' ? tenantsTab(s) : tab === 'workload' ? workloadTab(s) : auditTab(s);

    return el('div', {}, [
      ui.pageHead('Governance & Tenants', 'The multi-tenant & governance layer — Org → Center → Department → Team → User hierarchy, role-based <b>permissions</b>, approval hierarchies with backup + SLA, delegation, entitlements, workload and a full audit trail.', null),
      tabsBar, body
    ]);
  }

  /* ---- Hierarchy tree: Org → Center → Dept → Team → User ---- */
  function hierarchyTab(s) {
    var tree = el('div.col.gap-10');
    (s.orgs || []).forEach(function (o) {
      var centers = s.centers.filter(function (c) { return c.orgId === o.id; });
      var orgUsers = s.users.filter(function (u) { var c = store.center(u.center); return c && c.orgId === o.id; }).length;
      tree.appendChild(ui.card({ body: [
        el('div.row.gap-8.mb-8', {}, [el('span', { text: '🏢', style: { fontSize: '18px' } }), el('b', { text: o.name }), ui.badge(o.plan, 'indigo'), el('span.t-xs.t-mut', { text: centers.length + ' centers · ' + orgUsers + ' users' })]),
        el('div', { style: { paddingLeft: '14px', borderLeft: '2px solid var(--border)' } }, centers.map(function (c) {
          var depts = {};
          s.users.filter(function (u) { return u.center === c.id; }).forEach(function (u) { (depts[u.dept] = depts[u.dept] || []).push(u); });
          return el('div', { style: { marginBottom: '10px' } }, [
            el('div.row.gap-8', {}, [el('span', { text: '🏛️' }), el('b.t-sm', { text: c.name }), el('div.row.gap-4', {}, c.entitlements.filter(function (e) { return e !== 'platform'; }).map(function (e) { return ui.badge(e.toUpperCase(), 'neutral'); }))]),
            el('div', { style: { paddingLeft: '16px' } }, Object.keys(depts).map(function (dId) {
              var teams = store.teamsFor(c.id, dId);
              return el('div', { style: { marginTop: '6px' } }, [
                el('div.row.gap-6.t-sm', {}, [el('span', { text: (store.dept(dId) || {}).icon }), el('b', { text: (store.dept(dId) || {}).name })]),
                el('div', { style: { paddingLeft: '18px' } }, (teams.length ? teams : [{ name: '(no team)', id: null }]).map(function (tm) {
                  var members = depts[dId].filter(function (u) { return !tm.id || u.teamId === tm.id; });
                  if (!members.length && tm.id) return null;
                  return el('div.mt-4', {}, [
                    tm.id ? el('div.row.gap-6.t-xs.t-mut', {}, [el('span', { text: '👥' }), el('span', { text: tm.name + ' · lead ' + ((store.user(tm.lead) || {}).name || '—') })]) : null,
                    el('div.row.gap-6', { style: { flexWrap: 'wrap', paddingLeft: '14px', marginTop: '3px' } }, members.map(function (u) {
                      return el('span.idchip.clickable', { onclick: function () { store.actions.login(u.id); ui.toast({ kind: 'info', title: 'Viewing as ' + u.name }); App.router.go('/'); } }, U.initials(u.name) + ' · ' + store.roleLabel(u.role));
                    }))
                  ]);
                }).filter(Boolean))
              ]);
            }))
          ]);
        }))
      ] }));
    });
    return el('div', {}, [
      ui.note('violet', 'Full tenancy tree. Center entitlements gate licensed modules; teams group users under a department with a team lead. Click any user chip to view the app as them (RBAC + scope apply live).', '🌳'),
      el('div.mt-12', {}, tree)
    ]);
  }

  /* ---- Permissions matrix (role × capability) ---- */
  function permsTab(s) {
    var caps = store.CAPS;
    var groups = {}; caps.forEach(function (c) { (groups[c.group] = groups[c.group] || []).push(c); });
    var roles = Object.keys(s.roles);
    var editable = store.can('admin.roles');
    var wrap = el('div');
    function draw() {
      U.clear(wrap);
      var head = el('tr', {}, [el('th', { text: 'Capability', style: { position: 'sticky', left: 0 } })].concat(roles.map(function (r) { return el('th', { class: 'col-num', style: { writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '90px', fontSize: '10px' }, text: store.roleLabel(r) }); })));
      var body = [];
      Object.keys(groups).forEach(function (g) {
        body.push(el('tr', {}, [el('td', { colspan: roles.length + 1, style: { background: 'var(--surface-2)', fontWeight: 700, fontSize: '11px' }, text: g })]));
        groups[g].forEach(function (cap) {
          body.push(el('tr', {}, [el('td', { text: cap.label, style: { fontSize: '12px' } })].concat(roles.map(function (r) {
            var has = store.can(cap.id, r); var su = ((s.rolePermissions[r] || []).indexOf('*') > -1);
            var cell = el('td', { class: 'col-num' });
            var box = el('span', { text: su ? '★' : has ? '✓' : '·', style: { cursor: (editable && !su) ? 'pointer' : 'default', color: su ? 'var(--saffron-600)' : has ? 'var(--green-600)' : 'var(--n-300)', fontWeight: 700, fontSize: '14px' }, title: su ? 'Superuser (all caps)' : '' });
            if (editable && !su) box.addEventListener('click', function () { store.actions.toggleRolePermission(r, cap.id, !has); });
            cell.appendChild(box); return cell;
          }))));
        });
      });
      wrap.appendChild(el('div.tbl-wrap', { style: { overflowX: 'auto' } }, el('table.tbl.tbl-compact', {}, [el('thead', {}, head), el('tbody', {}, body)])));
    }
    draw();
    return el('div', {}, [
      ui.note('info', editable ? 'Click a cell to grant/revoke a capability for a role. ★ = superuser (all capabilities). Changes apply live and are audited. Buttons/actions across the app check <code>store.can(cap)</code>.' : 'Read-only — your role cannot edit role permissions (needs <b>admin.roles</b>).', '🔑'),
      el('div.mt-12', {}, wrap)
    ]);
  }

  /* ---- Approval policies & delegation ---- */
  function policiesTab(s) {
    var u = store.currentUser();
    return el('div', {}, [
      ui.card({ cls: 'mb-16', title: 'My delegation / out-of-office', icon: '🏖️', body: [
        el('div.row.gap-12', { style: { alignItems: 'center', flexWrap: 'wrap' } }, [
          ui.switchToggle(!!u.ooo, function (on) {
            if (on) { var backup = s.users.find(function (x) { return x.id !== u.id && x.role === u.role; }) || s.users.find(function (x) { return x.role === 'workflow_manager'; }); store.actions.setOutOfOffice(true, backup ? backup.id : null); ui.toast({ kind: 'success', msg: 'Out-of-office on — approvals route to your backup.' }); }
            else { store.actions.setOutOfOffice(false); ui.toast({ kind: 'info', msg: 'Out-of-office off.' }); }
          }),
          el('div', {}, [el('b.t-sm', { text: u.ooo ? 'Out of office — delegating approvals' : 'Available' }), el('div.t-xs.t-mut', { text: u.ooo && u.delegateTo ? 'Backup: ' + (store.user(u.delegateTo) || {}).name : 'Toggle to delegate your pending approvals to a backup' })])
        ])
      ] }),
      ui.note('info', 'Each sensitive action type routes to a named approver with a <b>backup</b> and an <b>SLA</b>. If the primary approver is out-of-office or breaches SLA, the backup can act and leadership is alerted.', '🧭'),
      el('div.mt-12', {}, ui.card({ pad: false, body: [ui.table({ columns: [
        { label: 'Action type', render: function (r) { return el('b.t-sm', { text: r.type }); } },
        { label: 'Category', render: function (r) { return ui.badge(r.p.category || '—', 'neutral'); } },
        { label: 'Primary approver', render: function (r) { return roleSelect(r.type, 'approverRole', r.p.approverRole); } },
        { label: 'Backup approver', render: function (r) { return roleSelect(r.type, 'backupRole', r.p.backupRole); } },
        { label: 'SLA', render: function (r) { return el('span.t-sm', { text: r.p.slaMins >= 1440 ? (r.p.slaMins / 1440) + 'd' : (r.p.slaMins / 60) + 'h' }); } },
        { label: 'Threshold', render: function (r) { return r.p.thresholdInr ? el('span.t-xs', { text: '> ' + U.inr(r.p.thresholdInr) + ' → leadership' }) : el('span.t-mut', { text: '—' }); } }
      ], rows: Object.keys(s.approvalPolicies).map(function (t) { return { type: t, p: s.approvalPolicies[t] }; }) })] }))
    ]);
  }
  function roleSelect(type, field, val) {
    var s = store.get();
    var sel = el('select.select', { style: { maxWidth: '180px', fontSize: '12px' }, onchange: function (e) { var patch = {}; patch[field] = e.target.value; store.actions.setApprovalPolicy(type, patch); App.ui.toast({ kind: 'success', msg: 'Policy updated.' }); } },
      Object.keys(s.roles).map(function (r) { var o = el('option', { value: r, text: store.roleLabel(r) }); if (r === val) o.selected = true; return o; }));
    return sel;
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
      el('div.grid.cols-2', { style: { alignItems: 'start' } }, [
        ui.card({ title: 'Departments', icon: '🗂️', body: s.departments.map(function (d) {
          return el('div.row-between', { style: { padding: '10px 0', borderBottom: '1px solid var(--border)' } }, [el('div.row.gap-8', {}, [el('span', { text: d.icon }), el('b', { text: d.name })]), el('span.t-xs.t-mut', { text: s.users.filter(function (u) { return u.dept === d.id; }).length + ' users' })]);
        }) }),
        ui.card({ title: 'Teams', icon: '👥', body: (s.teams || []).map(function (t) {
          var members = s.users.filter(function (u) { return u.teamId === t.id; }).length;
          return el('div.row-between', { style: { padding: '10px 0', borderBottom: '1px solid var(--border)' } }, [el('div', {}, [el('b.t-sm', { text: t.name }), el('div.t-xs.t-mut', { text: (store.center(t.centerId) || {}).short + ' · ' + (store.dept(t.deptId) || {}).name + ' · lead ' + ((store.user(t.lead) || {}).name || '—') })]), el('span.t-xs.t-mut', { text: members + ' members' })]);
        }) })
      ])
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

  return { render: render, title: 'Governance & Tenants' };
})();
