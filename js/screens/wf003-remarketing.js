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
      ui.card({ pad: false, body: [ui.table({ onRow: function (a) { detail(a); }, columns: [
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
      ui.note('amber', 'Over-contacted contacts and recently-messaged donors are automatically suppressed before any remarketing send (consent/over-contact guard from WF-006). Click an audience for member preview, message plan and scheduling.', '🛡️')
    ]);
  }

  function detail(a) {
    var s = store.get();
    var members = s.contacts.filter(function (c) { return !c.consent.dnd; }).slice(0, 8);
    var msg = a.channel.indexOf('WhatsApp') > -1 ? 'Hare Krishna {{name}} 🙏 We miss your seva. Renew your monthly giving here: {{link}}' : 'Re-engage offer';
    var sched = 'Tomorrow 10:00 AM', cap = 'Max 1 / 7 days';
    ui.drawer({ title: a.name, subtitle: a.basis + ' · ' + U.num(a.size) + ' members', wide: true,
      body: [
        el('div.row.gap-6.mb-12', {}, [a.vip ? ui.badge('VIP/HNI — approval required', 'saffron') : null, ui.statusBadge(a.status, true), ui.badge('Est. CPL ' + U.inr(a.estCpl), 'neutral')].filter(Boolean)),
        ui.card({ cls: 'mb-12', title: 'Message plan (editable)', icon: '✍️', body: [
          el('div.field', {}, [el('label', { text: 'Channel' }), el('input.input', { value: a.channel, oninput: function (e) { a.channel = e.target.value; } })]),
          el('div.field', {}, [el('label', { text: 'Message' }), el('textarea.textarea', { text: msg, oninput: function (e) { msg = e.target.value; } })]),
          el('div.grid.cols-2', { style: { gap: '0 12px' } }, [el('div.field', {}, [el('label', { text: 'Schedule' }), el('input.input', { value: sched, oninput: function (e) { sched = e.target.value; } })]), el('div.field', {}, [el('label', { text: 'Frequency cap' }), el('input.input', { value: cap, oninput: function (e) { cap = e.target.value; } })])])
        ] }),
        ui.card({ title: 'Member preview (sample)', icon: '👥', body: [ui.table({ compact: true, columns: [
          { label: 'Contact', render: function (c) { return ui.personCell(c.name, c.id, c.id); } },
          { label: 'Segment', render: function (c) { return ui.badge(c.segment, 'neutral'); } },
          { label: 'Last touch', render: function (c) { return U.ago(c.lastTouch); } }
        ], rows: members })] })
      ],
      footer: [
        a.vip ? el('button.btn.btn-success.grow', { onclick: function () { a.status = 'active'; store.actions.audit('Approved + scheduled remarketing', 'approval', a.id, a.name); App.ui.toast({ kind: 'success', msg: 'Approved & scheduled.' }); closeDrawer(); } }, '✓ Approve & schedule') :
          el('button.btn.btn-primary.grow', { onclick: function () { a.status = 'active'; store.commit(); App.ui.toast({ kind: 'success', msg: 'Scheduled for ' + sched + '.' }); closeDrawer(); } }, '📅 Schedule send')
      ]
    });
  }
  function closeDrawer() { var r = U.$('#drawer-region'); r.classList.remove('show'); U.clear(r); }

  return { render: render, title: 'Remarketing' };
})();
