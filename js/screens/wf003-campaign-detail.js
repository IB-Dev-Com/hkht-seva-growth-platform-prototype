/* ============================================================
   Screen: WF-003 Campaign detail — ROI, P&L, daily optimization
   ============================================================ */
App.screens['wf003-campaign-detail'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;

  function render(params) {
    var c = store.campaign(params.id);
    if (!c) return ui.emptyState({ icon: '🔍', title: 'Campaign not found', sub: params.id });
    var s = store.get();
    var lp = s.landingPages.find(function (l) { return l.campaignId === c.id; });
    var content = s.content.filter(function (x) { return x.campaignId === c.id; });
    var leadsFromCamp = s.contacts.filter(function (x) { return x.campaignId === c.id; });

    /* daily ROI recommendations (agentic, human-approved) */
    var recs = buildRecs(c);

    var header = ui.card({ body: [
      el('div.row-between', { style: { flexWrap: 'wrap', gap: '10px' } }, [
        el('div', {}, [
          el('div.row.gap-8', { style: { flexWrap: 'wrap' } }, [el('h2', { text: c.name }), ui.statusBadge(c.status), ui.badge(c.type, 'saffron')]),
          el('div.t-sm.t-mut.mt-4', { text: c.objective }),
          el('div.row.gap-6.mt-8', {}, [ui.idChip(c.id), ui.badge('UTM: ' + c.utm, 'neutral'), el('span.t-xs.t-mut', { text: 'Owner ' + (store.user(c.ownerId) || {}).name })])
        ]),
        el('div.col', { style: { alignItems: 'flex-end' } }, [el('div.t-xs.t-mut', { text: 'ROAS' }), el('div.t-2xl.t-bold', { text: (c.roas || '—') + '×', style: { color: c.roas >= 2 ? 'var(--green-600)' : 'var(--amber-600)' } })])
      ])
    ] });

    var kpis = el('div.grid.cols-4', {}, [
      ui.kpi({ icon: '💸', label: 'Spend', value: U.inr(c.spend, { compact: true }), accent: 'amber', sub: 'of ' + U.inr(c.budget, { compact: true }) }),
      ui.kpi({ icon: '🎯', label: 'Leads', value: U.num(c.leads), accent: 'indigo', sub: 'CPL ' + U.inr(c.cpl) }),
      ui.kpi({ icon: '🪔', label: 'Conversions', value: U.num(c.conversions), accent: 'teal', sub: 'CPA ' + U.inr(c.cpa) }),
      ui.kpi({ icon: '💰', label: 'Revenue', value: U.inr(c.revenue, { compact: true }), accent: 'green' })
    ]);

    /* P&L */
    var pnl = ui.card({ title: 'Live campaign P&L', icon: '🧾', right: [ui.badge('Finance-reviewed', 'green')], body: [
      ui.statline('Gross revenue (attributed)', U.inr(c.revenue)),
      ui.statline('Ad spend', '− ' + U.inr(c.spend)),
      ui.statline('Est. fulfilment / fees (8%)', '− ' + U.inr(Math.round(c.revenue * 0.08))),
      el('div.statline', { style: { borderTop: '2px solid var(--border)', marginTop: '4px' } }, [el('b', { text: 'Net contribution' }), el('b', { text: U.inr(c.revenue - c.spend - Math.round(c.revenue * 0.08)), style: { color: 'var(--green-600)' } })]),
      ui.note('info', 'Attribution chain: spend → lead (Source/UTM) → call → donation (Donation_ID). Gaps escalate to finance.', '🔗')
    ] });

    /* daily series chart */
    var chart = ui.card({ title: '14-day performance', icon: '📈', body: [
      ui.barChart(c.daily.slice(-14).map(function (d, i) { return { label: i % 2 === 0 ? new Date(d.date).getDate() + '' : '', v: d.revenue }; })),
      el('div.row.gap-16.mt-8.t-xs.t-mut', {}, [el('span', { text: '● Revenue/day' }), el('span', { text: 'Spend ' + U.inr(U.sum(c.daily, function (d) { return d.spend; }), { compact: true }) }), el('span', { text: 'Leads ' + U.num(U.sum(c.daily, function (d) { return d.leads; })) })])
    ] });

    /* AI optimization recommendations */
    var optCard = ui.card({ title: 'Daily ROI optimization', icon: '🤖', right: [ui.badge('Agentic · human-approved', 'violet')], body: [
      ui.note('violet', 'The optimization agent monitors spend, leads & conversions daily and <b>recommends</b> pause/scale moves. Budget changes require human approval — no auto-spend changes.', '✨'),
      el('div.col.gap-8.mt-8', {}, recs.map(function (r) {
        var applied = (c.optApplied || []).some(function (x) { return x.rec === r.title; });
        return el('div.row-between', { style: { padding: '10px', border: '1px solid var(--border)', borderRadius: '10px' } }, [
          el('div', {}, [el('div.row.gap-6', {}, [el('span', { text: r.icon }), el('b.t-sm', { text: r.title }), applied ? ui.badge('Applied', 'green') : null]), el('div.t-xs.t-mut.mt-2', { text: r.detail })]),
          applied ? ui.badge('✓ tracking', 'green') : r.action ? el('div.row.gap-4', {}, [el('button.btn.btn-sm.btn-primary', { onclick: function () { store.actions.applyOptimization(c.id, r.title); ui.toast({ kind: 'success', title: 'Sent for approval & tracked', msg: r.title }); } }, 'Accept'), el('button.btn.btn-sm.btn-ghost', { onclick: function () { ui.toast({ kind: 'info', msg: 'Dismissed.' }); } }, 'Dismiss')]) : ui.badge('Monitoring', 'neutral')
        ]);
      }))
    ] });

    /* CM-04: creative-level performance */
    var content = store.get().content.filter(function (x) { return x.campaignId === c.id; });
    var creativeRows = []; content.forEach(function (ct) { ct.variants.forEach(function (v, i) { if (v.metrics) creativeRows.push({ name: ct.channel + ' · Variant ' + String.fromCharCode(65 + i), m: v.metrics, headline: v.headline }); }); });
    var creativeCard = creativeRows.length ? ui.card({ title: 'Creative performance', icon: '🎨', body: [ui.table({ compact: true, sortable: true, columns: [
      { label: 'Creative', render: function (r) { return el('div', {}, [el('b.t-sm', { text: r.name }), el('div.t-xs.t-mut.truncate', { text: r.headline, style: { maxWidth: '200px' } })]); } },
      { label: 'Impr.', num: true, sortVal: function (r) { return r.m.impressions; }, render: function (r) { return U.num(r.m.impressions); } },
      { label: 'CTR', num: true, sortVal: function (r) { return r.m.ctr; }, render: function (r) { return r.m.ctr + '%'; } },
      { label: 'Conv.', num: true, render: function (r) { return r.m.conversions; } },
      { label: 'CVR', num: true, sortVal: function (r) { return r.m.cvr; }, render: function (r) { return r.m.cvr + '%'; } },
      { label: '', render: function (r) { return r.m.status === 'winner' ? ui.badge('Winner', 'green') : el('button.btn.btn-sm.btn-ghost', { onclick: function () { ui.toast({ kind: 'info', msg: 'Budget shifted to winner (simulated).' }); } }, 'Promote'); } }
    ], rows: creativeRows })] }) : null;

    /* landing + content + leads */
    var side = el('div.col.gap-16', {}, [
      lp ? ui.card({ title: 'Landing page QA', icon: '🌐', body: [
        ui.statline('URL', el('span.t-xs.t-mono', { text: lp.url })),
        ui.statline('QA score', ui.badge(lp.qaScore + '/100', lp.qaScore >= 90 ? 'green' : 'amber')),
        ui.statline('Status', ui.statusBadge(lp.status)),
        lp.issues.length ? el('div.mt-8', {}, lp.issues.map(function (i) { return el('div.row.gap-6.t-xs', { style: { padding: '4px 0' } }, [ui.badge(i.sev, i.sev === 'high' ? 'red' : i.sev === 'med' ? 'amber' : 'neutral'), el('span', { text: i.text })]); })) : ui.note('green', 'No QA issues — launch-ready.', '✓'),
        lp.issues.some(function (i) { return i.sev === 'high'; }) ? el('button.btn.btn-sm.btn-block.mt-8', { onclick: function () { store.actions.updateLandingQA(lp.id); ui.toast({ kind: 'success', msg: 'Critical QA issue fixed (simulated).' }); } }, 'Fix critical issues') : null
      ] }) : null,
      ui.card({ title: 'Lead handoff to CRM', icon: '🔗', body: [
        ui.statline('Leads captured', U.num(c.leads)),
        ui.statline('Synced to CRM', ui.badge('100%', 'green')),
        ui.statline('Source-tagged', ui.badge('Every lead', 'green')),
        ui.statline('First-follow-up SLA', ui.badge('2.1h avg', 'green')),
        el('a.btn.btn-block.mt-8', { href: '#/wf006/contacts?campaign=' + c.id }, 'View ' + leadsFromCamp.length + ' contacts →')
      ] }),
      (function () {
        var calls = store.get().calls.filter(function (x) { return x.campaignId === c.id; });
        var donated = calls.filter(function (x) { return x.outcome === 'Donated'; }).length;
        return ui.card({ title: 'Voice activity (WF-002)', icon: '📞', body: [
          ui.statline('Calls made', calls.length),
          ui.statline('Connected', calls.filter(function (x) { return x.status === 'Connected'; }).length),
          ui.statline('Converted on call', ui.badge(donated, donated ? 'green' : 'neutral')),
          ui.statline('Script', (store.get().scripts.find(function (sc) { return sc.campaignId === c.id; }) || {}).name || 'none'),
          el('div.row.gap-6.mt-8', {}, [el('a.btn.btn-sm.grow', { href: '#/wf002/dashboard?campaign=' + c.id }, 'Voice dashboard →'), el('a.btn.btn-sm.grow', { href: '#/wf002/readiness' }, 'Calling readiness →')])
        ] });
      })()
    ]);

    return el('div', {}, [
      el('a.btn.btn-sm.btn-ghost.mb-12', { href: '#/wf003/campaigns' }, '← Campaigns'),
      header,
      el('div.mt-16', {}, kpis),
      el('div.grid.mt-16', { style: { gridTemplateColumns: '1.4fr 1fr', gap: '16px', alignItems: 'start' } }, [
        el('div.col.gap-16', {}, [chart, optCard, creativeCard].filter(Boolean)),
        el('div.col.gap-16', {}, [pnl, side])
      ])
    ]);
  }

  function buildRecs(c) {
    var recs = [];
    var bestCh = c.channels[0];
    recs.push({ icon: '📈', title: 'Scale ' + store.source(bestCh).label + ' by +20%', detail: 'Lowest CPL channel (' + U.inr(c.cpl) + ') with headroom in budget.', action: 'Request scale' });
    if (c.roas < 2) recs.push({ icon: '⏸️', title: 'Pause YouTube placement', detail: 'ROAS below 2× on this placement — recommend pausing to protect efficiency.', action: 'Request pause' });
    recs.push({ icon: '🧪', title: 'Promote winning creative variant', detail: 'Variant B CTR 2.3% vs 1.1% — shift budget to top performer.', action: 'Request shift' });
    recs.push({ icon: '🔔', title: 'CPL within target', detail: 'Current CPL ' + U.inr(c.cpl) + ' is under the ' + U.inr(Math.round(c.cpl * 1.3)) + ' threshold. No action needed.' });
    return recs;
  }

  return { render: render, title: function (p) { var c = store.campaign(p.id); return c ? c.name : 'Campaign'; } };
})();
