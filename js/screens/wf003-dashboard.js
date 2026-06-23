/* ============================================================
   Screen: WF-003 Marketing Dashboard (revenue / ROI / attribution)
   ============================================================ */
App.screens['wf003-dashboard'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;

  function render() {
    var s = store.get();
    var camps = store.scoped(s.campaigns).filter(function (c) { return c.spend > 0; });
    var spend = U.sum(camps, function (c) { return c.spend; });
    var revenue = U.sum(camps, function (c) { return c.revenue; });
    var leads = U.sum(camps, function (c) { return c.leads; });
    var conversions = U.sum(camps, function (c) { return c.conversions; });

    // by channel
    var byChannel = {};
    camps.forEach(function (c) { c.channels.forEach(function (ch) { byChannel[ch] = byChannel[ch] || { spend: 0, leads: 0, rev: 0 }; byChannel[ch].spend += c.spend / c.channels.length; byChannel[ch].leads += c.leads / c.channels.length; byChannel[ch].rev += c.revenue / c.channels.length; }); });
    var chRows = U.sortBy(Object.keys(byChannel).map(function (k) { var x = byChannel[k]; return { ch: k, spend: x.spend, leads: x.leads, rev: x.rev, roas: x.spend ? x.rev / x.spend : 0 }; }), function (r) { return r.rev; }, 'desc');

    // aggregate daily across campaigns
    var dayMap = {};
    camps.forEach(function (c) { c.daily.forEach(function (d) { var k = new Date(d.date).getDate(); dayMap[k] = (dayMap[k] || 0) + d.revenue; }); });
    var days = Object.keys(dayMap).sort(function (a, b) { return a - b; });

    return el('div', {}, [
      ui.pageHead('Marketing Dashboard', 'Spend → lead → call → donation, with ROI and per-campaign P&L. Every conversion traces back to a Campaign_ID and source tag.', [
        el('a.btn', { href: '#/wf003/content' }, '🎨 Content'),
        el('a.btn.btn-primary', { href: '#/wf003/builder' }, '✨ New campaign')
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '💰', label: 'Gross revenue', value: U.inr(revenue, { compact: true }), accent: 'green', trend: 14 }),
        ui.kpi({ icon: '💸', label: 'Spend', value: U.inr(spend, { compact: true }), accent: 'amber' }),
        ui.kpi({ icon: '📊', label: 'ROAS', value: (spend ? (revenue / spend).toFixed(2) : '—') + '×', accent: 'indigo' }),
        ui.kpi({ icon: '🎯', label: 'CPL / CPA', value: U.inr(leads ? spend / leads : 0) + ' / ' + U.inr(conversions ? spend / conversions : 0), accent: 'teal' })
      ]),
      el('div.grid', { style: { gridTemplateColumns: '1.3fr 1fr', gap: '16px', alignItems: 'start' } }, [
        el('div.col.gap-16', {}, [
          ui.card({ title: 'Revenue trend (14d, all campaigns)', icon: '📈', body: [ui.barChart(days.map(function (d, i) { return { label: i % 2 === 0 ? d : '', v: dayMap[d] }; }))] }),
          ui.card({ title: 'Channel performance', icon: '📡', body: [ui.table({ compact: true, columns: [
            { label: 'Channel', render: function (r) { return el('span', { text: store.source(r.ch).icon + ' ' + store.source(r.ch).label }); } },
            { label: 'Spend', num: true, render: function (r) { return U.inr(r.spend, { compact: true }); } },
            { label: 'Leads', num: true, render: function (r) { return U.num(r.leads); } },
            { label: 'Revenue', num: true, render: function (r) { return U.inr(r.rev, { compact: true }); } },
            { label: 'ROAS', num: true, render: function (r) { return el('b', { text: r.roas.toFixed(1) + '×', style: { color: r.roas >= 2 ? 'var(--green-600)' : 'var(--amber-600)' } }); } }
          ], rows: chRows })] })
        ]),
        el('div.col.gap-16', {}, [
          ui.card({ title: 'Conversion funnel', icon: '🫙', body: [ui.funnel([
            { label: 'Impressions', sub: 'est.', v: Math.round(spend / 0.6) },
            { label: 'Clicks', v: Math.round(leads * 6) },
            { label: 'Leads', v: leads },
            { label: 'Calls (WF-002)', v: U.sum(camps, function (c) { return c.calls; }) },
            { label: 'Conversions', v: conversions }
          ])] }),
          ui.card({ title: 'Top campaigns', icon: '🏆', body: U.sortBy(camps, function (c) { return c.revenue; }, 'desc').slice(0, 4).map(function (c) {
            return el('a', { href: '#/wf003/campaign/' + c.id, style: { textDecoration: 'none', display: 'block' } }, el('div.row-between', { style: { padding: '9px 0', borderBottom: '1px solid var(--border)' } }, [el('div', {}, [el('b.t-sm', { text: c.name }), el('div.t-xs.t-mut', { text: c.type })]), el('div.t-right', {}, [el('b.t-sm', { text: U.inr(c.revenue, { compact: true }) }), el('div.t-xs', { text: c.roas + '×', style: { color: 'var(--green-600)' } })])]));
          }) })
        ])
      ])
    ]);
  }

  return { render: render, title: 'Marketing Dashboard' };
})();
