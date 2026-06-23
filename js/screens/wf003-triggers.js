/* ============================================================
   Screen: WF-003 Behavior-Triggered Micro-Campaigns (3.11)
   ============================================================ */
App.screens['wf003-triggers'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;

  function render() {
    var s = store.get();
    var T = s.triggers;
    var armed = T.filter(function (t) { return t.status === 'armed'; });

    return el('div', {}, [
      ui.pageHead('Behavior-Triggered Micro-Campaigns', 'Fires timely, personalised micro-campaigns from live signals — stalled payments, website revisits, repeated Yatra interest, annual giving patterns, event follow-up. <b>Donor-sensitive / high-volume sends need human approval.</b>', null),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '⚡', label: 'Trigger types', value: T.length, accent: 'indigo' }),
        ui.kpi({ icon: '🟢', label: 'Armed', value: armed.length, accent: 'green' }),
        ui.kpi({ icon: '🛡️', label: 'Need approval', value: T.filter(function (t) { return t.status === 'needs_approval'; }).length, accent: 'amber' }),
        ui.kpi({ icon: '👥', label: 'Contacts in scope', value: U.num(U.sum(T, function (t) { return t.count; })), accent: 'violet' })
      ]),
      el('div.col.gap-12', {}, T.map(card))
    ]);
  }

  function card(t) {
    return ui.card({ body: [
      el('div.row-between', { style: { flexWrap: 'wrap', gap: '8px' } }, [
        el('div.row.gap-10', {}, [
          el('div.kpi-ico', { text: icon(t.type), style: { background: 'var(--accent-soft)' } }),
          el('div', {}, [el('div.row.gap-8', {}, [el('b', { text: t.type }), t.sensitive ? ui.badge('Sensitive', 'amber', true) : null, ui.badge(t.count + ' contacts', 'neutral')]), el('div.t-xs.t-mut.mt-2', { text: 'Signal: ' + t.signal })])
        ]),
        ui.statusBadge(t.status === 'armed' ? 'live' : t.status === 'paused' ? 'paused' : 'needs_approval', true)
      ]),
      el('div.grid.cols-2.mt-12', { style: { gap: '12px' } }, [
        ui.statline('Recommended action', t.recommendedAction),
        ui.statline('Channel', ui.badge(t.channel, 'indigo')),
        ui.statline('Example contact', el('a', { href: '#/wf006/contact/' + t.contactId }, t.contactName)),
        ui.statline('Consent/DND guard', ui.badge('Enforced pre-send', 'green'))
      ]),
      el('div.row.gap-8.mt-12', {}, [
        t.status === 'needs_approval' ? el('button.btn.btn-sm.btn-success', { onclick: function () { t.status = 'armed'; store.actions.audit('Approved trigger', 'approval', t.id, t.type); ui.toast({ kind: 'success', msg: 'Trigger approved & armed.' }); } }, '✓ Approve & arm') :
          el('button.btn.btn-sm', { onclick: function () { store.actions.toggleTrigger(t.id); ui.toast({ kind: 'info', msg: 'Trigger ' + (t.status === 'armed' ? 'paused' : 'armed') }); } }, t.status === 'armed' ? '⏸ Pause' : '▶ Arm'),
        el('button.btn.btn-sm.btn-ghost', { onclick: function () { ui.toast({ kind: 'info', msg: 'Preview: ' + t.recommendedAction + ' via ' + t.channel }); } }, 'Preview action')
      ])
    ] });
  }
  function icon(t) { return { 'Stalled payment': '💳', 'Website revisit': '🌐', 'Repeat Yatra interest': '🛕', 'Annual donation pattern': '📅', 'Event follow-up': '🎪', 'HNI re-engagement': '💎' }[t] || '⚡'; }

  return { render: render, title: 'Behavior Triggers' };
})();
