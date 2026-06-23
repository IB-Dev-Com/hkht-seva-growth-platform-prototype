/* ============================================================
   Screen: WF-003 Donor Propensity & Relationship Intelligence (3.12)
   ============================================================ */
App.screens['wf003-propensity'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;

  function render() {
    var s = store.get();
    var ranked = s.propensity;

    return el('div', {}, [
      ui.pageHead('Donor Propensity & Relationship Intelligence', 'Ranks the contacts most likely to donate or register from campaign + CRM + GA4 + engagement signals, with a recommended ask, seva and intro context. <b>HNI / CSR / major-donor outreach needs reviewer approval.</b>', [
        el('button.btn', { onclick: function () { ui.toast({ kind: 'info', title: 'Model refreshed', msg: 'Propensity scores recomputed (simulated Vertex AI).' }); } }, [el('span.ico', { text: '✨' }), 'Refresh scores'])
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '🎯', label: 'Ranked prospects', value: ranked.length, accent: 'indigo' }),
        ui.kpi({ icon: '🔥', label: 'High propensity (≥85)', value: ranked.filter(function (r) { return r.score >= 85; }).length, accent: 'green' }),
        ui.kpi({ icon: '💎', label: 'HNI / CSR (approval)', value: ranked.filter(function (r) { return r.sensitive; }).length, accent: 'saffron' }),
        ui.kpi({ icon: '💰', label: 'Est. pipeline', value: U.inr(U.sum(ranked, function (r) { return r.totalGiven; }) * 0.3, { compact: true }), accent: 'teal' })
      ]),
      ui.card({ pad: false, body: [ui.table({ onRow: function (r) { router.go('/wf006/contact/' + r.contactId); }, columns: [
        { label: '#', render: function (r, i) { return el('span.t-mut3', { text: i + 1 }); } },
        { label: 'Prospect', render: function (r) { return ui.personCell(r.name, r.tier + ' · ' + U.inr(r.totalGiven, { compact: true }) + ' lifetime', r.contactId); } },
        { label: 'Propensity', render: function (r) { return el('div.row.gap-8', { style: { minWidth: '120px' } }, [ui.bar(r.score, r.score >= 85 ? 'green' : 'amber'), el('b.t-sm', { text: r.score })]); } },
        { label: 'Confidence', num: true, render: function (r) { return Math.round(r.confidence * 100) + '%'; } },
        { label: 'Recommended ask', render: function (r) { return el('b', { text: r.recommendedAsk }); } },
        { label: 'Seva', render: function (r) { return ui.badge(r.seva, 'violet'); } },
        { label: 'Context', render: function (r) { return el('span.t-xs.t-mut', { text: r.context }); } },
        { label: '', render: function (r) { return r.sensitive ? el('button.btn.btn-sm', { onclick: function (e) { e.stopPropagation(); handoff(r); } }, '🤝 Handoff') : el('button.btn.btn-sm.btn-primary', { onclick: function (e) { e.stopPropagation(); ui.toast({ kind: 'success', msg: 'Added to fundraiser queue.' }); } }, 'Queue'); } }
      ], rows: ranked })] }),
      ui.note('violet', 'Low-confidence rankings and major-donor asks escalate to a human reviewer; the model only prepares decision context — the fundraiser owns the conversation and commitment.', '✨')
    ]);
  }

  function handoff(r) {
    ui.modal({ title: 'Fundraiser handoff', subtitle: r.name + ' · ' + r.tier,
      body: el('div', {}, [
        ui.aiBlock('AI fundraiser copilot — handoff pack', [
          ui.statline('Propensity', el('b', { text: r.score + '/100' })),
          ui.statline('Recommended ask', r.recommendedAsk),
          ui.statline('Suggested seva', r.seva),
          ui.statline('Context', r.context)
        ]),
        ui.note('amber', 'HNI/CSR handoffs require donor-approver sign-off before outreach. Final ask and commitment stay with the human fundraiser.', '🛡️')
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Send to donor approver', variant: 'primary', onClick: function () { ui.toast({ kind: 'success', msg: 'Handoff routed to donor approver with full context pack.' }); } }]
    });
  }

  return { render: render, title: 'Donor Propensity' };
})();
