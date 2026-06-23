/* ============================================================
   Screen: SLA Board — on-track / at-risk / breached (MI-05)
   ============================================================ */
App.screens['sla-board'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;

  function render() {
    var s = store.get();
    var items = [];
    store.scoped(s.tasks).filter(function (t) { return t.status !== 'Completed'; }).forEach(function (t) { items.push({ kind: 'task', label: t.kind + ' — ' + (t.contactName || ''), priority: t.priority, item: t, link: t.contactId ? '#/wf006/contact/' + t.contactId : '#/wf002/tasks', owner: t.ownerId }); });
    store.scoped(s.escalations).filter(function (e) { return e.status !== 'Resolved'; }).forEach(function (e) { items.push({ kind: 'escalation', label: 'Escalation — ' + e.contactName, priority: e.priority, item: e, link: '#/wf002/escalations', owner: e.assigneeId }); });
    s.approvals.filter(function (a) { return a.status === 'pending'; }).forEach(function (a) { items.push({ kind: 'approval', label: a.type + ' — ' + a.title, priority: a.priority, item: a, link: '#/approvals?focus=' + a.id, owner: a.requestedBy }); });

    items.forEach(function (x) { x.sla = store.slaState(x.kind, x.item); });
    var breached = items.filter(function (x) { return x.sla.state === 'breached'; });
    var atRisk = items.filter(function (x) { return x.sla.state === 'at_risk'; });
    var onTrack = items.filter(function (x) { return x.sla.state === 'on_track'; });

    function col(title, list, color) {
      return ui.card({ title: title + ' (' + list.length + ')', cls: 'sla-col', body: list.length ? U.sortBy(list, function (x) { return x.sla.mins; }).map(function (x) {
        return el('a', { href: x.link, style: { display: 'block', textDecoration: 'none' } }, el('div', { style: { padding: '9px 0', borderBottom: '1px solid var(--border)' } }, [
          el('div.row.gap-6', {}, [ui.badge(x.kind, x.kind === 'approval' ? 'indigo' : x.kind === 'escalation' ? 'red' : 'blue'), x.priority === 'High' ? ui.badge('High', 'red') : null]),
          el('div.t-sm.mt-2', { text: x.label }),
          el('div.t-xs', { text: x.sla.label + ' · ' + (store.user(x.owner) || {}).name, style: { color: 'var(--' + color + '-600)', fontWeight: 600 } })
        ]));
      }) : [el('div.t-sm.t-mut3', { text: 'None' })] });
    }

    return el('div', {}, [
      ui.pageHead('SLA Board', 'Every time-bound work item (tasks, escalations, approvals) against its SLA policy — live. Breached items auto-escalate; this is the single place to see what is slipping.', [
        el('button.btn', { onclick: function () { autoEscalate(breached); } }, [el('span.ico', { text: '⚡' }), 'Auto-escalate breached'])
      ]),
      el('div.grid.cols-3.mb-16', {}, [
        ui.kpi({ icon: '🔴', label: 'Breached', value: breached.length, accent: 'red' }),
        ui.kpi({ icon: '🟡', label: 'At risk', value: atRisk.length, accent: 'amber' }),
        ui.kpi({ icon: '🟢', label: 'On track', value: onTrack.length, accent: 'green' })
      ]),
      el('div.grid.cols-3', { style: { alignItems: 'start' } }, [col('🔴 Breached', breached, 'red'), col('🟡 At risk', atRisk, 'amber'), col('🟢 On track', onTrack, 'green')]),
      ui.note('info', 'SLA policies (mins): callback High 240 · escalation High 60 · approval High 1440. Configure per item type + priority in the SLA engine. Breached sensitive items auto-create an escalation to the backup owner + a leadership alert.', '⏱️')
    ]);
  }

  function autoEscalate(breached) {
    if (!breached.length) { ui.toast({ kind: 'info', msg: 'Nothing breached.' }); return; }
    breached.forEach(function (x) { store.actions.audit('SLA breach auto-escalated', 'data', x.item.id, x.kind); });
    ui.toast({ kind: 'warn', title: 'Escalated ' + breached.length + ' breached items', msg: 'Backup owners + leadership notified.' });
  }
  return { render: render, title: 'SLA Board' };
})();
