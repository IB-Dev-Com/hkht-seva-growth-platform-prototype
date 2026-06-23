/* ============================================================
   Screen: WF-003 Campaigns list / pipeline
   ============================================================ */
App.screens['wf003-campaigns'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;
  var view = 'all';

  function render() {
    var s = store.get();
    var camps = store.scoped(s.campaigns);
    var shown = view === 'all' ? camps : camps.filter(function (c) { return c.status === view || (view === 'approval' && c.approvalStatus === 'pending'); });

    var totalSpend = U.sum(camps, function (c) { return c.spend; });
    var totalRev = U.sum(camps, function (c) { return c.revenue; });

    return el('div', {}, [
      ui.pageHead('Campaigns', 'Digital acquisition with conversion attribution — every rupee of spend is traceable to lead → call → donation. Each campaign carries a <b>Campaign_ID</b> and source tags.', [
        el('a.btn.btn-primary', { href: '#/wf003/builder' }, [el('span.ico', { text: '✨' }), 'New campaign'])
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '📣', label: 'Active campaigns', value: camps.filter(function (c) { return c.status === 'active'; }).length, accent: 'indigo' }),
        ui.kpi({ icon: '💸', label: 'Total spend', value: U.inr(totalSpend, { compact: true }), accent: 'amber' }),
        ui.kpi({ icon: '💰', label: 'Attributed revenue', value: U.inr(totalRev, { compact: true }), accent: 'green', sub: 'ROAS ' + (totalSpend ? (totalRev / totalSpend).toFixed(1) : '—') + '×' }),
        ui.kpi({ icon: '⏳', label: 'Pending approval', value: camps.filter(function (c) { return c.approvalStatus === 'pending'; }).length, accent: 'red' })
      ]),
      el('div.chips.mb-12', {}, [chip('all', 'All'), chip('active', 'Active'), chip('pending_approval', 'Pending'), chip('draft', 'Draft')]),
      ui.card({ pad: false, body: [ui.table({ onRow: function (c) { router.go('/wf003/campaign/' + c.id); }, columns: [
        { label: 'Campaign', render: function (c) { return el('div', {}, [el('b.t-sm', { text: c.name }), el('div.t-xs.t-mut', { text: c.id + ' · ' + (store.dept(c.deptId) || {}).name + ' · ' + (store.center(c.centerId) || {}).short })]); } },
        { label: 'Type', render: function (c) { return ui.badge(c.type, c.type === 'Yatra' ? 'teal' : c.type === 'Festival' ? 'saffron' : 'violet'); } },
        { label: 'Channels', render: function (c) { return el('div.row.gap-4', {}, c.channels.map(function (ch) { return el('span', { text: store.source(ch).icon, title: store.source(ch).label }); })); } },
        { label: 'Spend / Budget', num: true, render: function (c) { return el('div', {}, [el('b', { text: U.inr(c.spend, { compact: true }) }), el('div.t-xs.t-mut', { text: '/ ' + U.inr(c.budget, { compact: true }) })]); } },
        { label: 'Leads', num: true, render: function (c) { return U.num(c.leads); } },
        { label: 'ROAS', num: true, render: function (c) { return c.roas ? el('b', { text: c.roas + '×', style: { color: c.roas >= 2 ? 'var(--green-600)' : 'var(--amber-600)' } }) : '—'; } },
        { label: 'Status', render: function (c) { return el('div.row.gap-4', {}, [ui.statusBadge(c.status), c.approvalStatus === 'pending' ? ui.badge('approval', 'amber', true) : null].filter(Boolean)); } },
        { label: '', render: function (c) { return el('div.row.gap-4', {}, [
          c.status === 'active' ? el('button.btn.btn-sm.btn-ghost', { title: 'Pause', onclick: function (e) { e.stopPropagation(); store.actions.setCampaignStatus(c.id, 'paused'); ui.toast({ kind: 'info', msg: 'Campaign paused.' }); } }, '⏸') : null,
          c.status === 'paused' ? el('button.btn.btn-sm.btn-ghost', { title: 'Resume', onclick: function (e) { e.stopPropagation(); store.actions.setCampaignStatus(c.id, 'active'); ui.toast({ kind: 'success', msg: 'Campaign resumed.' }); } }, '▶') : null,
          el('button.btn.btn-sm.btn-ghost', { title: 'Clone', onclick: function (e) { e.stopPropagation(); var id = store.actions.cloneCampaign(c.id); ui.toast({ kind: 'success', msg: 'Cloned as draft.' }); router.go('/wf003/campaign/' + id); } }, '⧉')
        ].filter(Boolean)); } }
      ], rows: shown, sortable: true, empty: { icon: '📣', title: 'No campaigns', sub: 'Create one to get started.' } })] })
    ]);
  }
  function chip(v, label) { return el('div.fchip' + (view === v ? '.active' : ''), { onclick: function () { view = v; store.emit(); } }, label); }

  return { render: render, title: 'Campaigns' };
})();
