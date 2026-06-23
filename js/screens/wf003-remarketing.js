/* ============================================================
   Screen: WF-003 Remarketing Agent (3.9)
   ============================================================ */
App.screens['wf003-remarketing'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;

  function render() {
    var s = store.get();
    var aud = s.remarketing;
    var active = aud.filter(function (a) { return a.status === 'active'; });

    return el('div', {}, [
      ui.pageHead('Remarketing', 'Identifies low-cost, high-ROI donor & yatri audiences from CRM + GA4 signals and proposes a message plan. <b>VIP / HNI audiences and over-contact concerns require approval.</b>', null),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '♻️', label: 'Audiences', value: aud.length, accent: 'indigo' }),
        ui.kpi({ icon: '▶️', label: 'Active', value: active.length, accent: 'green' }),
        ui.kpi({ icon: '👥', label: 'Total reach', value: U.num(U.sum(aud, function (a) { return a.size; })), accent: 'teal' }),
        ui.kpi({ icon: '🎯', label: 'Avg est. CPL', value: U.inr(Math.round(U.sum(aud, function (a) { return a.estCpl; }) / aud.length)), accent: 'violet' })
      ]),
      ui.card({ pad: false, body: [ui.table({ columns: [
        { label: 'Audience', render: function (a) { return el('div', {}, [el('div.row.gap-6', {}, [el('b.t-sm', { text: a.name }), a.vip ? ui.badge('VIP/HNI', 'saffron', true) : null]), el('div.t-xs.t-mut', { text: a.basis })]); } },
        { label: 'Size', num: true, render: function (a) { return U.num(a.size); } },
        { label: 'Est. CPL', num: true, render: function (a) { return U.inr(a.estCpl); } },
        { label: 'Est. conv.', num: true, render: function (a) { return a.estConv; } },
        { label: 'Channel', render: function (a) { return el('span.t-sm', { text: a.channel }); } },
        { label: 'Status', render: function (a) { return ui.statusBadge(a.status, true); } },
        { label: '', render: function (a) {
          if (a.status === 'needs_approval') return el('button.btn.btn-sm.btn-success', { onclick: function () { a.status = 'active'; store.actions.audit('Approved remarketing audience', 'approval', a.id, a.name); ui.toast({ kind: 'success', msg: 'VIP audience approved & activated.' }); } }, '✓ Approve');
          if (a.status === 'draft') return el('button.btn.btn-sm', { onclick: function () { a.status = 'active'; store.commit(); ui.toast({ kind: 'success', msg: 'Audience launched.' }); } }, 'Launch');
          return el('button.btn.btn-sm', { onclick: function () { store.actions.activateRemarketing(a.id); ui.toast({ kind: 'info', msg: 'Audience ' + (a.status === 'active' ? 'paused' : 'resumed') }); } }, a.status === 'active' ? '⏸ Pause' : '▶ Resume');
        } }
      ], rows: aud })] }),
      ui.note('amber', 'Over-contacted contacts and recently-messaged donors are automatically suppressed before any remarketing send (consent/over-contact guard from WF-006).', '🛡️')
    ]);
  }

  return { render: render, title: 'Remarketing' };
})();
