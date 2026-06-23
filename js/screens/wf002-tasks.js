/* ============================================================
   Screen: WF-002 Callback & Follow-up Tasks (SLA, no leakage)
   ============================================================ */
App.screens['wf002-tasks'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;
  var view = 'open';

  function render() {
    var s = store.get();
    var tasks = s.tasks;
    var overdue = tasks.filter(function (t) { return t.status === 'Overdue'; });
    var open = tasks.filter(function (t) { return t.status === 'Open'; });
    var done = tasks.filter(function (t) { return t.status === 'Completed'; });

    var shown = view === 'overdue' ? overdue : view === 'completed' ? done : view === 'all' ? tasks : open.concat(overdue);
    shown = U.sortBy(shown, function (t) { return new Date(t.dueDate).getTime(); });

    var slaMet = tasks.length ? Math.round((tasks.length - overdue.length) / tasks.length * 100) : 100;

    return el('div', {}, [
      ui.pageHead('Callback & Follow-up Tasks', 'Prevents follow-up leakage — every callback and follow-up is a tracked task with an owner, due date and SLA. Overdue high-priority tasks escalate automatically.', [
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
          { label: 'Due', render: function (t) { var late = new Date(t.dueDate) < U.now() && t.status !== 'Completed'; return el('span', { text: U.ago(t.dueDate), style: late ? { color: 'var(--red-600)', fontWeight: 600 } : null }); } },
          { label: 'SLA', render: function (t) { return ui.statusBadge(t.slaStatus); } },
          { label: 'Status', render: function (t) { return ui.statusBadge(t.status); } },
          { label: '', render: function (t) { return t.status !== 'Completed' ? el('div.row.gap-4', {}, [el('button.btn.btn-sm', { onclick: function (e) { e.stopPropagation(); store.actions.completeTask(t.id); ui.toast({ kind: 'success', msg: 'Task completed.' }); } }, '✓ Done'), el('button.btn.btn-sm.btn-ghost', { onclick: function (e) { e.stopPropagation(); reassign(t); } }, '↪') ]) : el('span.t-xs.t-mut', { text: 'closed' }); } }
        ], rows: shown, onRow: function (t) { router.go('/wf006/contact/' + t.contactId); }, empty: { icon: '✓', title: 'No tasks here', sub: 'Nothing in this view.' } })
      ] })
    ]);
  }

  function chip(v, label, count) { return el('div.fchip' + (view === v ? '.active' : ''), { onclick: function () { view = v; store.emit(); } }, label + (count != null ? ' · ' + count : '')); }

  function reassign(t) {
    var callers = store.get().users.filter(function (u) { return ['telecaller', 'supervisor', 'voice_ops'].indexOf(u.role) > -1; });
    var sel = t.ownerId;
    ui.modal({ title: 'Reassign task', subtitle: t.contactName + ' · ' + t.kind, body: el('div.field', {}, [el('label', { text: 'New owner' }), el('select.select', { onchange: function (e) { sel = e.target.value; } }, callers.map(function (u) { var o = el('option', { value: u.id, text: u.name + ' · ' + store.roleLabel(u.role) }); if (u.id === t.ownerId) o.selected = true; return o; }))]),
      actions: [{ label: 'Cancel' }, { label: 'Reassign', variant: 'primary', onClick: function () { store.actions.reassignTask(t.id, sel); ui.toast({ kind: 'success', msg: 'Reassigned to ' + (store.user(sel) || {}).name }); } }] });
  }

  return { render: render, title: 'Follow-up Tasks' };
})();
