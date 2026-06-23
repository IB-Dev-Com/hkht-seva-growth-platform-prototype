/* ============================================================
   Screen: Billing & Statements — central billing (MT-04/05/06/08)
   ============================================================ */
App.screens['billing'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;
  var tab = 'statements';
  var stmtCenter = null;

  function render() {
    var s = store.get();
    var isPlatform = ['platform_admin', 'leadership', 'org_admin'].indexOf(store.getSession().role) > -1;
    var tabs = [
      { id: 'statements', label: 'Statements', icon: '🧾' },
      { id: 'campaigns', label: 'Per-campaign cost', icon: '📣' },
      { id: 'budgets', label: 'Budgets & Caps', icon: '🎚️' },
      { id: 'ledger', label: 'Usage Ledger', icon: '📜' }
    ];
    if (isPlatform) tabs.push({ id: 'rates', label: 'Rate Card', icon: '🏷️' });
    var tabsBar = ui.tabs(tabs, tab, function (t) { tab = t; store.emit(); });
    var body = tab === 'statements' ? statements(s) : tab === 'campaigns' ? campaignCost(s) : tab === 'budgets' ? budgets(s) : tab === 'ledger' ? ledger(s) : rates(s);
    return el('div', {}, [
      ui.pageHead('Billing & Statements', 'Generation / voice / WhatsApp / ad APIs are billed <b>centrally</b>; this is the chargeback layer — per-center/department statements from the event-level usage ledger, budget caps with enforcement, and the rate card.', null),
      tabsBar, body
    ]);
  }

  /* ---- Statements (MT-04) ---- */
  function statements(s) {
    var centers = store.scoped(s.centers);
    if (!stmtCenter) stmtCenter = centers[0] ? centers[0].id : 'HYD';
    var ledger = s.ledger.filter(function (l) { return l.centerId === stmtCenter; });
    var byDeptSvc = {};
    ledger.forEach(function (l) { var k = l.deptId + '|' + l.service; byDeptSvc[k] = byDeptSvc[k] || { deptId: l.deptId, service: l.service, qty: 0, cost: 0, rate: l.unitRate }; byDeptSvc[k].qty += l.qty; byDeptSvc[k].cost += l.cost; });
    var rows = Object.keys(byDeptSvc).map(function (k) { return byDeptSvc[k]; });
    var subtotal = U.sum(rows, function (r) { return r.cost; });
    var gst = Math.round(subtotal * 0.18);
    var c = store.center(stmtCenter);

    var picker = el('select.select', { style: { maxWidth: '220px' }, onchange: function (e) { stmtCenter = e.target.value; store.emit(); } }, centers.map(function (x) { var o = el('option', { value: x.id, text: x.name }); if (x.id === stmtCenter) o.selected = true; return o; }));

    return el('div', {}, [
      el('div.row.gap-10.mb-12', {}, [picker, el('span.badge.badge-neutral', {}, 'Period: June 2026'), el('div.grow'), el('button.btn', { onclick: function () { exportStatement(rows, c); } }, '⬇ Export CSV'), el('button.btn.btn-primary', { onclick: function () { store.actions.markStatementBilled(stmtCenter, '2026-06'); ui.toast({ kind: 'success', msg: 'Statement marked billed & logged.' }); } }, 'Mark billed')]),
      ui.card({ body: [
        el('div.row-between.mb-12', {}, [el('div', {}, [el('div.t-mut.t-xs', { text: 'Statement for' }), el('h3', { text: c ? c.name : stmtCenter }), el('div.t-xs.t-mut', { text: (store.org(c ? c.orgId : '') || {}).name + ' · GL: SEVA-' + stmtCenter })]), el('div.t-right', {}, [el('div.t-mut.t-xs', { text: 'Total payable (incl. 18% GST)' }), el('div.t-2xl.t-bold', { text: U.inr(subtotal + gst) })])]),
        ui.table({ sortable: true, columns: [
          { label: 'Department', render: function (r) { return (store.dept(r.deptId) || {}).name; } },
          { label: 'Service', render: function (r) { return (s.usage.services.find(function (x) { return x.id === r.service; }) || { name: r.service }).name; } },
          { label: 'Qty', num: true, key: 'qty', render: function (r) { return U.num(r.qty); } },
          { label: 'Rate', num: true, render: function (r) { return '₹' + r.rate; } },
          { label: 'Amount', num: true, key: 'cost', render: function (r) { return U.inr(r.cost); } }
        ], rows: U.sortBy(rows, function (r) { return r.cost; }, 'desc') }),
        el('div.col.gap-4.mt-12', { style: { maxWidth: '320px', marginLeft: 'auto' } }, [
          ui.statline('Subtotal', U.inr(subtotal)), ui.statline('GST (18%)', U.inr(gst)),
          el('div.statline', { style: { borderTop: '2px solid var(--border)' } }, [el('b', { text: 'Total' }), el('b', { text: U.inr(subtotal + gst) })])
        ])
      ] })
    ]);
  }
  function exportStatement(rows, c) {
    var csv = U.toCSV(rows.map(function (r) { return { center: c ? c.name : '', dept: r.deptId, service: r.service, qty: r.qty, rate: r.rate, amount: r.cost }; }));
    var ok = U.download('statement_' + (c ? c.id : 'center') + '_2026-06.csv', csv);
    store.actions.audit('Exported statement', 'export', c ? c.id : 'center', '2026-06');
    ui.toast({ kind: ok ? 'success' : 'info', msg: ok ? 'Statement CSV downloaded.' : 'Export logged (download blocked in sandbox).' });
  }

  /* ---- Per-campaign cost attribution (joins ledger → Call/Message → campaign) ---- */
  function campaignCost(s) {
    var callCamp = {}; s.calls.forEach(function (c) { callCamp[c.id] = c.campaignId; });
    var msgCamp = {}; s.whatsapp.forEach(function (m) { msgCamp[m.id] = m.campaignId; });
    var byCamp = {};
    function add(cid, svc, cost) { if (!cid) return; var b = byCamp[cid] = byCamp[cid] || { ads: 0, ai: 0, voice: 0, whatsapp: 0, sms: 0, total: 0 }; b[svc] = (b[svc] || 0) + cost; b.total += cost; }
    s.ledger.forEach(function (l) {
      var cid = l.refType === 'Campaign' ? l.refId : l.refType === 'Call' ? callCamp[l.refId] : l.refType === 'Message' ? msgCamp[l.refId] : null;
      add(cid, l.service, l.cost);
    });
    var rows = Object.keys(byCamp).map(function (cid) { var c = store.campaign(cid); return { id: cid, name: c ? c.name : cid, revenue: c ? c.revenue : 0, b: byCamp[cid] }; });
    rows = U.sortBy(rows, function (r) { return r.b.total; }, 'desc');
    return el('div', {}, [
      ui.note('info', 'Central API cost attributed to each campaign by joining the usage ledger to its calls, messages and ad spend — so cost-per-conversion and true campaign P&L include platform API cost, not just media spend.', '📣'),
      el('div.mt-12', {}, ui.card({ pad: false, body: [ui.table({ sortable: true, onRow: function (r) { if (store.campaign(r.id)) App.router.go('/wf003/campaign/' + r.id); }, columns: [
        { label: 'Campaign', render: function (r) { return el('b.t-sm', { text: r.name }); } },
        { label: 'Ad spend', num: true, render: function (r) { return U.inr(r.b.ads, { compact: true }); } },
        { label: 'Voice', num: true, render: function (r) { return U.inr(r.b.voice); } },
        { label: 'WhatsApp', num: true, render: function (r) { return U.inr(r.b.whatsapp); } },
        { label: 'AI', num: true, render: function (r) { return U.inr(r.b.ai); } },
        { label: 'Total API cost', num: true, sortVal: function (r) { return r.b.total; }, render: function (r) { return el('b', { text: U.inr(r.b.total, { compact: true }) }); } },
        { label: 'Revenue', num: true, render: function (r) { return U.inr(r.revenue, { compact: true }); } },
        { label: 'Cost ratio', num: true, render: function (r) { return r.revenue ? el('span', { text: Math.round(r.b.total / r.revenue * 100) + '%', style: { color: (r.b.total / r.revenue) < 0.25 ? 'var(--green-600)' : 'var(--amber-600)', fontWeight: 600 } }) : '—'; } }
      ], rows: rows })] }))
    ]);
  }

  /* ---- Budgets & caps (MT-03/06/08) ---- */
  function budgets(s) {
    var buds = store.scoped(s.budgets);
    return el('div', {}, [
      ui.note('amber', 'Per center+department+service caps. Hard-stop services <b>block</b> the action at 100% and raise a budget-increase approval. Forecast projects month-end from run-rate.', '🎚️'),
      el('div.mt-12', {}, ui.card({ pad: false, body: [ui.table({ sortable: true, pageSize: 12, columns: [
        { label: 'Center', render: function (b) { return (store.center(b.centerId) || {}).short; } },
        { label: 'Dept', render: function (b) { return (store.dept(b.deptId) || {}).name; } },
        { label: 'Service', key: 'service' },
        { label: 'Spent / Cap', num: true, render: function (b) { return U.inr(b.spent, { compact: true }) + ' / ' + U.inr(b.cap, { compact: true }); } },
        { label: 'Used', sortVal: function (b) { return b.spent / b.cap; }, render: function (b) { var p = Math.round(b.spent / b.cap * 100); return el('div.row.gap-8', { style: { minWidth: '120px' } }, [ui.bar(p, p >= 100 ? 'red' : p >= 80 ? 'amber' : 'green'), el('span.t-xs', { text: p + '%' })]); } },
        { label: 'Forecast', num: true, render: function (b) { var proj = Math.round(b.spent * 1.35); return el('span', { text: U.inr(proj, { compact: true }), style: { color: proj > b.cap ? 'var(--red-600)' : 'var(--text-2)', fontWeight: 600 } }); } },
        { label: 'Hard stop', render: function (b) { return b.hardStop ? ui.badge('Enforced', 'red') : ui.badge('Soft', 'neutral'); } },
        { label: '', render: function (b) { return el('button.btn.btn-sm', { onclick: function () { store.actions.bumpBudget(b.id, 0.2); ui.toast({ kind: 'success', msg: 'Cap raised +20%.' }); } }, '+20% cap'); } }
      ], rows: buds })] }))
    ]);
  }

  /* ---- Ledger (MT-02) ---- */
  function ledger(s) {
    var rows = store.scoped(s.ledger).slice(0, 200);
    return el('div', {}, [
      el('div.row.gap-8.mb-12', {}, [ui.badge(s.ledger.length + ' total events', 'neutral'), el('div.grow'), el('button.btn', { onclick: function () { var csv = U.toCSV(rows); var ok = U.download('usage_ledger.csv', csv); ui.toast({ kind: ok ? 'success' : 'info', msg: ok ? 'Ledger exported.' : 'Export logged.' }); } }, '⬇ Export ledger')]),
      ui.card({ pad: false, body: [ui.table({ sortable: true, pageSize: 15, columns: [
        { label: 'When', sortVal: function (l) { return new Date(l.ts).getTime(); }, render: function (l) { return U.fmtDateTime(l.ts); } },
        { label: 'Service', key: 'service' },
        { label: 'Center', render: function (l) { return (store.center(l.centerId) || {}).short; } },
        { label: 'Dept', render: function (l) { return l.deptId; } },
        { label: 'Qty', num: true, key: 'qty' },
        { label: 'Cost', num: true, key: 'cost', render: function (l) { return U.inr(l.cost); } },
        { label: 'By', render: function (l) { return (store.user(l.userId) || { name: l.userId }).name; } },
        { label: 'Ref', render: function (l) { if (!l.refId) return '—'; var go = l.refType === 'Call' ? '/wf002/call/' + l.refId : l.refType === 'Campaign' ? '/wf003/campaign/' + l.refId : null; return go ? ui.idChip(l.refId, function () { App.router.go(go); }) : ui.idChip(l.refId); } }
      ], rows: rows })] }),
      ui.note('info', 'Each metered event ties cost to who consumed it and the triggering Call / Campaign / Message ID — the audit basis for any chargeback dispute.', '📜')
    ]);
  }

  /* ---- Rate card (MT-05) ---- */
  function rates(s) {
    return el('div', {}, [
      ui.note('violet', 'Central rate card — unit pricing per service, with per-org negotiated overrides. The ledger snapshots the rate at event time, so historical statements stay correct after a rate change.', '🏷️'),
      el('div.mt-12', {}, ui.card({ pad: false, body: [ui.table({ columns: [
        { label: 'Service', render: function (r) { return el('b.t-sm', { text: r.name }); } },
        { label: 'Unit', key: 'unit' },
        { label: 'Base rate', num: true, render: function (r) { return '₹' + r.rate; } },
        { label: 'Org overrides', render: function (r) { var k = Object.keys(r.orgRates || {}); return k.length ? k.map(function (o) { return ui.badge((store.org(o) || {}).short + ': ₹' + r.orgRates[o], 'neutral'); }) : el('span.t-mut', { text: '—' }); } },
        { label: '', render: function (r) { return el('button.btn.btn-sm', { onclick: function () { editRate(r); } }, 'Edit'); } }
      ], rows: s.rateCard })] }))
    ]);
  }
  function editRate(r) {
    var v = r.rate;
    ui.modal({ title: 'Edit rate — ' + r.name, body: el('div.field', {}, [el('label', { text: 'Base rate (₹ per ' + r.unit + ')' }), el('input.input', { type: 'number', step: '0.01', value: r.rate, oninput: function (e) { v = +e.target.value; } })]),
      actions: [{ label: 'Cancel' }, { label: 'Save rate', variant: 'primary', onClick: function () { store.actions.setRate(r.service, v); ui.toast({ kind: 'success', msg: 'Rate updated. Future events use the new rate.' }); } }] });
  }

  return { render: render, title: 'Billing & Statements' };
})();
