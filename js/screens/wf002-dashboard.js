/* ============================================================
   Screen: WF-002 Voice Dashboard + Voice of the Devotee
   ============================================================ */
App.screens['wf002-dashboard'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;
  var range = 30;

  function render(params, query) {
    var s = store.get();
    var campFilter = query && query.campaign;
    var cutoff = U.daysAgo(range);
    var calls = store.scoped(s.calls).filter(function (c) { return new Date(c.createdAt) >= cutoff && (!campFilter || c.campaignId === campFilter); });
    var connected = calls.filter(function (c) { return c.status === 'Connected'; });
    var byOutcome = U.group(connected, 'outcome');
    var donated = (byOutcome['Donated'] || []).length;
    var interested = (byOutcome['Interested'] || []).length;
    var callback = (byOutcome['Callback'] || []).length;
    var lowConf = calls.filter(function (c) { return c.lowConfidence; }).length;

    // objection aggregation (Voice of the Devotee)
    var objections = {};
    calls.forEach(function (c) { if (c.objection) objections[c.objection] = (objections[c.objection] || 0) + 1; });
    var objRows = U.sortBy(Object.keys(objections).map(function (k) { return { obj: k, n: objections[k] }; }), function (x) { return x.n; }, 'desc');

    // funnel
    var leads = U.sum(store.scoped(s.campaigns), function (c) { return c.leads; });

    return el('div', {}, [
      ui.pageHead('Voice Dashboard', 'Calls into management control: funnel, quality, and the <b>Voice of the Devotee</b> — aggregated objections & FAQs that drive script improvement.', [
        campFilter ? el('a.fchip.active', { href: '#/wf002/dashboard' }, 'Campaign: ' + campFilter + ' ✕') : null,
        el('div.seg', {}, [rangeBtn(7, '7d'), rangeBtn(30, '30d'), rangeBtn(90, '90d'), rangeBtn(3650, 'All')]),
        el('a.btn.btn-sm', { href: '#/wf002/console' }, 'Open calls →')
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '📞', label: 'Total calls', value: calls.length, accent: 'indigo' }),
        ui.kpi({ icon: '📡', label: 'Connect rate', value: calls.length ? Math.round(connected.length / calls.length * 100) + '%' : '—', accent: 'green' }),
        ui.kpi({ icon: '🎯', label: 'Intent-capture accuracy', value: '93%', accent: 'green', sub: lowConf + ' low-confidence' }),
        ui.kpi({ icon: '🚨', label: 'Escalation precision', value: '96%', accent: 'teal' })
      ]),
      el('div.grid', { style: { gridTemplateColumns: '1.3fr 1fr', gap: '16px', alignItems: 'start' } }, [
        el('div.col.gap-16', {}, [
          ui.card({ title: 'Conversion funnel', icon: '📈', body: [ui.funnel([
            { label: 'Contacts attempted', sub: 'queue', v: calls.length },
            { label: 'Connected', sub: Math.round(connected.length / calls.length * 100) + '%', v: connected.length },
            { label: 'Interested + callback', v: interested + callback },
            { label: 'Donated / converted', sub: 'via voice', v: donated }
          ])] }),
          ui.card({ title: 'Outcome breakdown', icon: '🥧', body: [ui.barChart(['Donated', 'Interested', 'Callback', 'Not interested', 'No answer'].map(function (o) {
            return { label: o.split(' ')[0], v: o === 'No answer' ? calls.filter(function (c) { return c.status !== 'Connected'; }).length : (byOutcome[o] || []).length };
          }))] })
        ]),
        el('div.col.gap-16', {}, [
          ui.card({ title: 'Voice of the Devotee', icon: '🗣️', right: [ui.badge('AI aggregated', 'violet')], body: [
            ui.note('violet', 'Top objections & FAQs from transcripts — fed back monthly into script improvement.', '✨'),
            el('div.mt-8', {}, objRows.length ? objRows.map(function (o) { return ui.statline(o.obj, ui.badge(o.n + '×', 'neutral')); }) : [el('div.t-sm.t-mut', { text: 'No objections captured yet.' })])
          ] }),
          ui.card({ title: 'QA & quality', icon: '✅', body: [
            ui.statline('Calls sampled', Math.round(connected.length * 0.2)),
            ui.statline('Avg AI quality', ui.badge('91/100', 'green')),
            ui.statline('Low-confidence rate', ui.badge(calls.length ? Math.round(lowConf / calls.length * 100) + '%' : '0%', 'amber')),
            ui.statline('Opt-out / complaint rate', ui.badge('1.2%', 'green')),
            ui.statline('Human time saved', ui.badge('~62%', 'teal'))
          ] })
        ])
      ])
    ]);
  }

  function rangeBtn(d, label) { return el('button' + (range === d ? '.active' : ''), { onclick: function () { range = d; store.emit(); } }, label); }

  return { render: render, title: 'Voice Dashboard' };
})();
