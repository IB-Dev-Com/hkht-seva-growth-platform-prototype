/* ============================================================
   Screen: WF-003 Campaign Learning / Institutional Memory (3.10)
   ============================================================ */
App.screens['wf003-learning'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;

  function render() {
    var s = store.get();
    var L = s.learnings;

    return el('div', {}, [
      ui.pageHead('Campaign Learning & Institutional Memory', 'Preserves what worked and what failed as a reusable, season-by-season playbook — so the next campaign starts from accumulated judgment, not a blank page. Reduces dependency on any one person.', [
        el('button.btn.btn-primary', { onclick: closeout }, [el('span.ico', { text: '📘' }), 'Run campaign closeout'])
      ]),
      el('div.grid.cols-3.mb-16', {}, [
        ui.kpi({ icon: '📘', label: 'Playbooks', value: L.length, accent: 'indigo' }),
        ui.kpi({ icon: '♻️', label: 'Total reuse', value: U.sum(L, function (x) { return x.reuseCount; }), accent: 'green', sub: 'times applied' }),
        ui.kpi({ icon: '🧠', label: 'Knowledge coverage', value: '3 seasons', accent: 'violet' })
      ]),
      el('div.col.gap-12', {}, L.map(card))
    ]);
  }

  function card(l) {
    return ui.card({ body: [
      el('div.row-between.mb-8', { style: { flexWrap: 'wrap', gap: '8px' } }, [
        el('div', {}, [el('div.row.gap-8', {}, [el('b', { text: l.campaign }), ui.badge(l.season, 'saffron')]), el('div.t-xs.t-mut.mt-2', { text: 'Reused ' + l.reuseCount + '× · approved by ' + (store.user(l.approvedBy) || {}).name })]),
        el('a.btn.btn-sm', { href: '#/wf003/campaign/' + l.campaignId }, 'Current campaign →')
      ]),
      el('div.grid.cols-2', { style: { gap: '12px' } }, [
        el('div', {}, [el('div.t-up.mb-4', { text: '✓ What worked', style: { color: 'var(--green-600)' } }), el('ul', {}, l.whatWorked.map(function (w) { return el('li.row.gap-6.t-sm', { style: { padding: '3px 0' } }, [el('span', { text: '•', style: { color: 'var(--green-500)' } }), w]); }))]),
        el('div', {}, [el('div.t-up.mb-4', { text: '✕ What failed', style: { color: 'var(--red-600)' } }), el('ul', {}, l.whatFailed.map(function (w) { return el('li.row.gap-6.t-sm', { style: { padding: '3px 0' } }, [el('span', { text: '•', style: { color: 'var(--red-500)' } }), w]); }))])
      ]),
      ui.aiBlock('Next-season recommendation', [el('div.t-sm', { text: l.recommendation })]),
      el('div.row.gap-8.mt-8', {}, [el('button.btn.btn-sm.btn-primary', { onclick: function () { ui.toast({ kind: 'success', title: 'Applied to new campaign', msg: 'Playbook pre-fills the next campaign brief.' }); App.router.go('/wf003/builder'); } }, '♻️ Reuse in new campaign'), el('span.t-xs.t-mut3', { style: { alignSelf: 'center' } }, 'Final learning approved before archive')])
    ] });
  }

  function closeout() {
    ui.modal({ title: 'Campaign closeout intelligence', subtitle: 'AI compiles the post-campaign playbook',
      body: el('div', {}, [
        ui.aiBlock('Campaign Learning Agent', [el('div.t-sm', { html: 'Analyses spend, creative, channel and conversion data to summarise what worked vs failed, and drafts the next-season recommendation. <b>Final learning is human-approved before archive.</b>' })]),
        el('div.field.mt-12', {}, [el('label', { text: 'Campaign to close out' }), el('select.select', {}, store.get().campaigns.map(function (c) { return el('option', { text: c.name }); }))])
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Generate playbook', variant: 'primary', onClick: function () { ui.toast({ kind: 'success', title: 'Playbook drafted', msg: 'Closeout summary created — awaiting approval to archive.' }); } }]
    });
  }

  return { render: render, title: 'Campaign Learning' };
})();
