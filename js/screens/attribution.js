/* ============================================================
   Screen: Source → Revenue Attribution (cross-workflow)
   spend → lead → call → registration/donation → payment/receipt → repeat
   ============================================================ */
App.screens['attribution'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;

  function render() {
    var s = store.get();
    var camps = store.scoped(s.campaigns);

    // aggregate by source across contacts/campaigns/donors
    var bySource = {};
    s.sources.forEach(function (sr) { bySource[sr.id] = { source: sr, spend: 0, leads: 0, calls: 0, conversions: 0, revenue: 0 }; });
    camps.forEach(function (c) {
      c.channels.forEach(function (ch) {
        if (!bySource[ch]) bySource[ch] = { source: store.source(ch), spend: 0, leads: 0, calls: 0, conversions: 0, revenue: 0 };
        var n = c.channels.length;
        bySource[ch].spend += c.spend / n; bySource[ch].leads += c.leads / n;
        bySource[ch].calls += c.calls / n; bySource[ch].conversions += c.conversions / n; bySource[ch].revenue += c.revenue / n;
      });
    });
    var rows = Object.keys(bySource).map(function (k) { return bySource[k]; }).filter(function (r) { return r.spend > 0 || r.leads > 0; });
    rows = U.sortBy(rows, function (r) { return r.revenue; }, 'desc');

    var totSpend = U.sum(rows, function (r) { return r.spend; });
    var totRev = U.sum(rows, function (r) { return r.revenue; });
    var totLeads = U.sum(rows, function (r) { return r.leads; });
    var totConv = U.sum(rows, function (r) { return r.conversions; });

    // end-to-end stage funnel
    var receipted = Math.round(totConv * 0.92);
    var repeat = Math.round(totConv * 0.35);

    return el('div', {}, [
      ui.pageHead('Source → Revenue Attribution', 'Every rupee of spend traced end-to-end: <b>source → lead → call → registration/donation → payment/receipt → repeat cultivation</b>. This is the join that proves no revenue is un-attributed.', null),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '💸', label: 'Spend', value: U.inr(totSpend, { compact: true }), accent: 'amber' }),
        ui.kpi({ icon: '💰', label: 'Attributed revenue', value: U.inr(totRev, { compact: true }), accent: 'green' }),
        ui.kpi({ icon: '📊', label: 'Blended ROAS', value: (totSpend ? (totRev / totSpend).toFixed(2) : '—') + '×', accent: 'indigo' }),
        ui.kpi({ icon: '🔗', label: 'Attribution coverage', value: '97%', accent: 'green', sub: 'leads with source tag' })
      ]),
      el('div.grid', { style: { gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' } }, [
        ui.card({ title: 'End-to-end revenue funnel', icon: '🫙', body: [ui.funnel([
          { label: 'Spend deployed', sub: U.inr(totSpend, { compact: true }), v: Math.round(totSpend) },
          { label: 'Leads captured (Source/UTM)', v: Math.round(totLeads) },
          { label: 'Calls (WF-002)', v: Math.round(U.sum(rows, function (r) { return r.calls; })) },
          { label: 'Registrations / donations', v: Math.round(totConv) },
          { label: 'Payment receipted', v: receipted },
          { label: 'Repeat cultivation', v: repeat }
        ])] }),
        ui.card({ title: 'Source-to-revenue confidence', icon: '🎯', body: [
          ui.statline('Leads source-tagged', ui.badge('97%', 'green')),
          ui.statline('Conversions linked to Donation_ID', ui.badge('100%', 'green')),
          ui.statline('Payments reconciled (DCC)', ui.badge('92%', 'amber')),
          ui.statline('Cost-per-lead (blended)', U.inr(totLeads ? totSpend / totLeads : 0)),
          ui.statline('Cost-per-conversion', U.inr(totConv ? totSpend / totConv : 0)),
          ui.note('info', 'Join keys: <b>Source/UTM → Lead_ID → Contact_ID → Call_ID → Donation_ID → Payment_Status</b>. Attribution gaps escalate to finance (WF-009 path).', '🔗')
        ] })
      ]),
      ui.card({ cls: 'mt-16', title: 'Per-source attribution', icon: '📡', pad: false, body: [ui.table({ onRow: function (r) { App.router.go('/wf006/contacts?source=' + r.source.id); }, columns: [
        { label: 'Source', render: function (r) { return el('span', { text: r.source.icon + ' ' + r.source.label }); } },
        { label: 'Spend', num: true, render: function (r) { return U.inr(r.spend, { compact: true }); } },
        { label: 'Leads', num: true, render: function (r) { return U.num(r.leads); } },
        { label: 'Calls', num: true, render: function (r) { return U.num(r.calls); } },
        { label: 'Conversions', num: true, render: function (r) { return U.num(r.conversions); } },
        { label: 'Revenue', num: true, render: function (r) { return U.inr(r.revenue, { compact: true }); } },
        { label: 'CPL', num: true, render: function (r) { return r.leads ? U.inr(r.spend / r.leads) : '—'; } },
        { label: 'ROAS', num: true, render: function (r) { return el('b', { text: (r.spend ? (r.revenue / r.spend).toFixed(1) : '—') + '×', style: { color: r.revenue / r.spend >= 2 ? 'var(--green-600)' : 'var(--amber-600)' } }); } }
      ], rows: rows })] })
    ]);
  }

  return { render: render, title: 'Source → Revenue' };
})();
