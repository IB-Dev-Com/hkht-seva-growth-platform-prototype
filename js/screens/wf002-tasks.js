/* ============================================================
   Screen: WF-002 Callback & Follow-up Tasks (SLA, no leakage)
   ============================================================ */
App.screens['wf002-tasks'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;
  var view = 'open', scope = 'team';

  function render() {
    var s = store.get();
    var me = store.getSession().userId;
    var tasks = store.scoped(s.tasks).filter(function (t) { return scope === 'mine' ? t.ownerId === me : true; });
    var overdue = tasks.filter(function (t) { return store.slaState('task', t).state === 'breached' && t.status !== 'Completed'; });
    var open = tasks.filter(function (t) { return t.status !== 'Completed'; });
    var done = tasks.filter(function (t) { return t.status === 'Completed'; });

    var shown = view === 'overdue' ? overdue : view === 'completed' ? done : view === 'all' ? tasks : open;
    shown = U.sortBy(shown, function (t) { return new Date(t.dueDate).getTime(); });

    var slaMet = open.length ? Math.round((open.length - overdue.length) / open.length * 100) : 100;

    return el('div', {}, [
      ui.pageHead('Callback & Follow-up Tasks', 'Prevents follow-up leakage — every callback is a tracked task with an owner, live SLA countdown and auto-escalation on breach.', [
        el('div.seg', {}, [segBtn('team', 'Team'), segBtn('mine', 'My tasks')]),
        el('a.btn', { href: '#/wf002/console' }, '🎙️ Call Console')
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '📋', label: 'Open tasks', value: open.length, accent: 'blue' }),
        ui.kpi({ icon: '🔴', label: 'Overdue', value: overdue.length, accent: 'red' }),
        ui.kpi({ icon: '⏱️', label: 'Callback SLA met', value: slaMet + '%', accent: slaMet >= 85 ? 'green' : 'amber' }),
        ui.kpi({ icon: '💧', label: 'Hot-lead leakage', value: overdue.filter(function (t) { return t.priority === 'High'; }).length, accent: 'amber', sub: 'high-priority overdue' })
      ]),
      el('div.chips.mb-12', {}, [chip('open', 'Open & overdue', open.length + overdue.length), chip('overdue', 'Overdue', overdue.length), chip('completed', 'Completed', done.length), chip('all', 'All', tasks.length)]),
      ui.card({ pad: false, body: [
        ui.table({ columns: [
          { label: 'Contact', render: function (t) { return ui.personCell(t.contactName, t.contactId, t.contactId); } },
          { label: 'Type', render: function (t) { return ui.badge(t.kind, t.kind === 'Callback' ? 'amber' : 'blue'); } },
          { label: 'Priority', render: function (t) { return ui.badge(t.priority, t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'amber' : 'neutral'); } },
          { label: 'Owner', render: function (t) { return (store.user(t.ownerId) || {}).name; } },
          { label: 'SLA / due', render: function (t) { return t.status === 'Completed' ? el('span.t-xs.t-mut', { text: 'done ' + U.ago(t.completedAt) }) : ui.slaBadge('task', t); } },
          { label: 'Status', render: function (t) { return ui.statusBadge(t.status === 'Completed' ? 'Completed' : store.slaState('task', t).state === 'breached' ? 'Overdue' : 'Open'); } },
          { label: '', render: function (t) { return t.status !== 'Completed' ? el('div.row.gap-4', {}, [el('button.btn.btn-sm', { onclick: function (e) { e.stopPropagation(); store.actions.completeTask(t.id); ui.toast({ kind: 'success', msg: 'Task completed.' }); } }, '✓'), el('button.btn.btn-sm.btn-ghost', { title: 'Snooze', onclick: function (e) { e.stopPropagation(); store.actions.snoozeTask(t.id, 24); ui.toast({ kind: 'info', msg: 'Snoozed 24h.' }); } }, '💤'), el('button.btn.btn-sm.btn-ghost', { title: 'Reassign', onclick: function (e) { e.stopPropagation(); reassign(t); } }, '↪') ]) : el('span.t-xs.t-mut', { text: 'closed' }); } }
        ], rows: shown, onRow: function (t) { if (t.contactId) router.go('/wf006/contact/' + t.contactId); }, empty: { icon: '✓', title: 'No tasks here', sub: 'Nothing in this view.' } })
      ] })
    ]);
  }

  function chip(v, label, count) { return el('div.fchip' + (view === v ? '.active' : ''), { onclick: function () { view = v; store.emit(); } }, label + (count != null ? ' · ' + count : '')); }
  function segBtn(v, label) { return el('button' + (scope === v ? '.active' : ''), { onclick: function () { scope = v; store.emit(); } }, label); }

  function reassign(t) {
    var callers = store.get().users.filter(function (u) { return ['telecaller', 'supervisor', 'voice_ops'].indexOf(u.role) > -1; });
    var sel = t.ownerId;
    ui.modal({ title: 'Reassign task', subtitle: t.contactName + ' · ' + t.kind, body: el('div.field', {}, [el('label', { text: 'New owner' }), el('select.select', { onchange: function (e) { sel = e.target.value; } }, callers.map(function (u) { var o = el('option', { value: u.id, text: u.name + ' · ' + store.roleLabel(u.role) }); if (u.id === t.ownerId) o.selected = true; return o; }))]),
      actions: [{ label: 'Cancel' }, { label: 'Reassign', variant: 'primary', onClick: function () { store.actions.reassignTask(t.id, sel); ui.toast({ kind: 'success', msg: 'Reassigned to ' + (store.user(sel) || {}).name }); } }] });
  }

  return { render: render, title: 'Follow-up Tasks' };
})();
