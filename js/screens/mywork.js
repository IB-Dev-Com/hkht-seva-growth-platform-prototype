/* ============================================================
   Screen: My Work — personalised pending inbox (MI-03)
   ============================================================ */
App.screens['mywork'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;

  function render() {
    var s = store.get(); var me = store.getSession().userId; var role = store.getSession().role;
    var approvals = s.approvals.filter(function (a) { return a.status === 'pending' && a.approverRole === role; });
    var tasks = s.tasks.filter(function (t) { return t.ownerId === me && t.status !== 'Completed'; });
    var escs = s.escalations.filter(function (e) { return e.assigneeId === me && e.status !== 'Resolved'; });
    var reworks = (s.reworks || []).filter(function (r) { return r.ownerId === me && r.status === 'open'; });
    var notifs = store.notifsFor().filter(function (n) { return !n.read; });
    var u = store.currentUser();

    function group(title, icon, items, emptyMsg, renderItem) {
      return ui.card({ title: title, icon: icon, right: [ui.badge(items.length, items.length ? 'amber' : 'neutral')], body: items.length ? items.map(renderItem) : [el('div.t-sm.t-mut3', { text: emptyMsg })] });
    }

    return el('div', {}, [
      ui.pageHead('My Work · ' + u.name, 'Everything that needs you right now, in one queue — approvals for your role, your tasks, escalations, rework and unread alerts. SLA state shown live.', [
        ui.badge(store.roleLabel(role), 'indigo')
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '✅', label: 'Approvals (your role)', value: approvals.length, accent: 'amber' }),
        ui.kpi({ icon: '📋', label: 'Open tasks', value: tasks.length, accent: 'blue' }),
        ui.kpi({ icon: '🚨', label: 'Escalations', value: escs.length, accent: 'red' }),
        ui.kpi({ icon: '🔁', label: 'Rework', value: reworks.length, accent: 'violet' })
      ]),
      el('div.grid', { style: { gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' } }, [
        el('div.col.gap-16', {}, [
          group('Approvals awaiting you', '✅', approvals, 'No approvals for your role.', function (a) {
            var sla = store.slaState('approval', a);
            return el('a', { href: '#/approvals?focus=' + a.id, style: { display: 'block', textDecoration: 'none' } }, el('div.row-between', { style: { padding: '9px 0', borderBottom: '1px solid var(--border)' } }, [
              el('div', {}, [el('div.t-semi.t-sm', { text: a.title }), el('div.t-xs.t-mut', { text: a.type })]),
              sla ? ui.slaBadge('approval', a) : null
            ]));
          }),
          group('Your tasks', '📋', U.sortBy(tasks, function (t) { return new Date(t.dueDate).getTime(); }), 'No open tasks.', function (t) {
            return el('a', { href: t.contactId ? '#/wf006/contact/' + t.contactId : '#/wf002/tasks', style: { display: 'block', textDecoration: 'none' } }, el('div.row-between', { style: { padding: '9px 0', borderBottom: '1px solid var(--border)' } }, [
              el('div', {}, [el('div.t-semi.t-sm', { text: t.kind + ' — ' + (t.contactName || '') }), el('div.t-xs.t-mut', { text: t.note || '' })]),
              ui.slaBadge('task', t)
            ]));
          })
        ]),
        el('div.col.gap-16', {}, [
          group('Escalations assigned to you', '🚨', escs, 'No escalations.', function (e) {
            return el('a', { href: '#/wf002/escalations', style: { display: 'block', textDecoration: 'none' } }, el('div.row-between', { style: { padding: '9px 0', borderBottom: '1px solid var(--border)' } }, [
              el('div', {}, [el('div.t-semi.t-sm', { text: e.contactName }), el('div.t-xs.t-mut', { text: e.reason })]),
              ui.slaBadge('escalation', e)
            ]));
          }),
          group('Rework requested', '🔁', reworks, 'No rework items.', function (r) {
            return el('div.row-between', { style: { padding: '9px 0', borderBottom: '1px solid var(--border)' } }, [
              el('div', {}, [el('div.t-semi.t-sm', { text: r.entityType + ' ' + r.entityId }), el('div.t-xs.t-mut', { text: r.reason })]),
              el('button.btn.btn-sm', { onclick: function () { store.actions.resolveRework(r.id); ui.toast({ kind: 'success', msg: 'Rework resolved.' }); } }, 'Resolve')
            ]);
          }),
          group('Unread alerts & notifications', '🔔', notifs, 'All caught up.', function (n) {
            return el('div.row.gap-8', { style: { padding: '8px 0', borderBottom: '1px solid var(--border)' } }, [el('span', { text: '•', style: { color: 'var(--primary)' } }), el('span.t-sm', { text: n.title })]);
          })
        ])
      ])
    ]);
  }
  return { render: render, title: 'My Work' };
})();
