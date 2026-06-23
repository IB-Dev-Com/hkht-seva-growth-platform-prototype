/* ============================================================
   Screen: Usage & Cost — central billing per center / department
   ============================================================ */
App.screens['usage-cost'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;
  var groupBy = 'center';

  function render() {
    var s = store.get();
    var usage = s.usage;
    var rows = usage.rows;
    var totalCost = U.sum(rows, function (r) { return r.cost; });

    // by service
    var svc = {};
    rows.forEach(function (r) { svc[r.service] = (svc[r.service] || 0) + r.cost; });

    // grouped
    var key = groupBy === 'center' ? 'centerId' : 'deptId';
    var grouped = {};
    rows.forEach(function (r) { var k = r[key]; grouped[k] = grouped[k] || { cost: 0, byService: {} }; grouped[k].cost += r.cost; grouped[k].byService[r.service] = (grouped[k].byService[r.service] || 0) + r.cost; });
    var groupRows = U.sortBy(Object.keys(grouped).map(function (k) { return { k: k, cost: grouped[k].cost, byService: grouped[k].byService }; }), function (x) { return x.cost; }, 'desc');

    return el('div', {}, [
      ui.pageHead('Usage & Cost', 'Generation, voice, WhatsApp and ad APIs are <b>billed centrally</b>. Track per-center and per-department usage & cost for chargeback and budget control.', [
        el('button.btn', { onclick: function () { ui.toast({ kind: 'success', msg: 'Cost report exported (simulated).' }); } }, '⬇ Export report')
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '💳', label: 'Total this month', value: U.inr(totalCost, { compact: true }), accent: totalCost > usage.budgetMonthly ? 'red' : 'green', sub: 'budget ' + U.inr(usage.budgetMonthly, { compact: true }) }),
        ui.kpi({ icon: '📣', label: 'Ad spend', value: U.inr(svc.ads || 0, { compact: true }), accent: 'amber' }),
        ui.kpi({ icon: '📞', label: 'Voice + WhatsApp', value: U.inr((svc.voice || 0) + (svc.whatsapp || 0), { compact: true }), accent: 'indigo' }),
        ui.kpi({ icon: '✨', label: 'AI generation', value: U.inr(svc.ai || 0, { compact: true }), accent: 'violet' })
      ]),
      el('div.grid', { style: { gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' } }, [
        el('div.col.gap-16', {}, [
          ui.card({ title: 'Monthly cost trend', icon: '📈', body: [ui.barChart(usage.trend.map(function (t) { return { label: t.month, v: t.cost }; }))] }),
          ui.card({ title: 'Cost by service (central)', icon: '🧾', body: usage.services.map(function (sv) {
            var c = svc[sv.id] || 0;
            return el('div', { style: { marginBottom: '12px' } }, [el('div.row-between.mb-4', {}, [el('span.t-sm', { text: sv.icon + ' ' + sv.name + ' ' }), el('b.t-sm', { text: U.inr(c, { compact: true }) })]), ui.bar(c / totalCost * 100, 'indigo'), el('div.t-xs.t-mut3.mt-2', { text: sv.wf })]);
          }) })
        ]),
        el('div.col.gap-16', {}, [
          ui.card({ title: 'Allocation', icon: '🏛️', right: [el('div.seg', {}, [segBtn('center', 'By center'), segBtn('dept', 'By department')])], body: [
            ui.table({ compact: true, columns: [
              { label: groupBy === 'center' ? 'Center' : 'Department', render: function (r) { return el('b.t-sm', { text: groupBy === 'center' ? (store.center(r.k) || {}).name : (store.dept(r.k) || {}).name }); } },
              { label: 'Cost', num: true, render: function (r) { return U.inr(r.cost, { compact: true }); } },
              { label: 'Share', render: function (r) { return el('div.row.gap-8', {}, [ui.bar(r.cost / totalCost * 100, 'indigo'), el('span.t-xs.t-mut', { text: Math.round(r.cost / totalCost * 100) + '%' })]); } }
            ], rows: groupRows })
          ] }),
          ui.card({ title: 'Budgets & caps', icon: '🎚️', right: [el('a.btn.btn-sm', { href: '#/billing' }, 'Manage →')], body: [
            (function () {
              var buds = store.scoped(s.budgets || []);
              var nearCap = buds.filter(function (b) { return b.spent / b.cap >= 0.8; });
              return el('div', {}, [
                ui.statline('Active caps', buds.length),
                ui.statline('Near / over cap', ui.badge(nearCap.length, nearCap.length ? 'amber' : 'green')),
                el('div.mt-8', {}, U.sortBy(buds, function (b) { return b.spent / b.cap; }, 'desc').slice(0, 4).map(function (b) {
                  var p = Math.round(b.spent / b.cap * 100);
                  return el('div', { style: { marginBottom: '8px' } }, [el('div.row-between.t-xs.mb-2', {}, [el('span', { text: (store.center(b.centerId) || {}).short + ' · ' + b.service }), el('b', { text: p + '%' })]), ui.bar(p, p >= 100 ? 'red' : p >= 80 ? 'amber' : 'green')]);
                }))
              ]);
            })()
          ] }),
          ui.card({ title: 'Governance', icon: '🛡️', body: [
            ui.note('info', 'Central billing means generation/voice/WhatsApp/ad APIs run on shared platform credentials — each center & department gets transparent chargeback. Full statements, ledger and rate card in <a href="#/billing">Billing</a>.', '💳'),
            el('div.mt-8', {}, [
              ui.statline('Budget alerts', ui.badge('At 80% & 100%', 'amber')),
              ui.statline('Per-department caps', ui.badge('Enforced', 'green')),
              ui.statline('Approval for overspend', ui.badge('Leadership', 'indigo'))
            ])
          ] })
        ])
      ])
    ]);
  }
  function segBtn(v, label) { return el('button' + (groupBy === v ? '.active' : ''), { onclick: function () { groupBy = v; store.emit(); } }, label); }

  return { render: render, title: 'Usage & Cost' };
})();
