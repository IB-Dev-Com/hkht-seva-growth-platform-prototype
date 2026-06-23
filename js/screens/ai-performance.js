/* ============================================================
   Screen: AI Agent Performance (cross-workflow dashboard)
   Maps to the "AI-agent performance dashboard" in all 3 briefs.
   ============================================================ */
App.screens['ai-performance'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;
  var wf = 'all';

  function render() {
    var s = store.get();
    var agents = wf === 'all' ? s.aiAgents : s.aiAgents.filter(function (a) { return a.workflow === wf; });
    var totSug = U.sum(s.aiAgents, function (a) { return a.suggestions; });
    var totAppr = U.sum(s.aiAgents, function (a) { return a.approved; });
    var totRej = U.sum(s.aiAgents, function (a) { return a.rejected; });
    var totQueue = U.sum(s.aiAgents, function (a) { return a.humanReviewQueue; });
    var totInc = U.sum(s.aiAgents, function (a) { return a.incidents; });
    var avgAcc = Math.round(U.sum(s.aiAgents, function (a) { return a.accuracy; }) / s.aiAgents.length);

    return el('div', {}, [
      ui.pageHead('AI Agent Performance', 'How every AI agent is performing across WF-006, WF-002 and WF-003 — suggestions, approval/rejection rate, accuracy, hallucination flags, human-review queue, overrides and SLA improvement. The control panel for trustworthy automation.', null),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '✨', label: 'Agent suggestions', value: U.num(totSug), accent: 'indigo', sub: 'this period' }),
        ui.kpi({ icon: '✓', label: 'Approval rate', value: Math.round(totAppr / totSug * 100) + '%', accent: 'green', sub: U.num(totRej) + ' rejected' }),
        ui.kpi({ icon: '🎯', label: 'Avg accuracy', value: avgAcc + '%', accent: avgAcc >= 88 ? 'green' : 'amber' }),
        ui.kpi({ icon: '👤', label: 'Human-review queue', value: U.num(totQueue), accent: 'amber', sub: totInc + ' open incidents' })
      ]),
      el('div.chips.mb-12', {}, [chip('all', 'All workflows'), chip('WF-006', 'WF-006'), chip('WF-002', 'WF-002'), chip('WF-003', 'WF-003')]),
      el('div.grid', { style: { gridTemplateColumns: '1.5fr 1fr', gap: '16px', alignItems: 'start' } }, [
        ui.card({ title: 'Per-agent performance', icon: '🤖', pad: false, body: [ui.table({ compact: true, columns: [
          { label: 'Agent', render: function (a) { return el('div', {}, [el('b.t-sm', { text: a.name }), el('div.t-xs.t-mut', { text: a.id + ' · ' + a.type })]); } },
          { label: 'WF', render: function (a) { return ui.badge(a.workflow, a.workflow === 'WF-006' ? 'teal' : a.workflow === 'WF-002' ? 'saffron' : 'indigo'); } },
          { label: 'Suggestions', num: true, render: function (a) { return U.num(a.suggestions); } },
          { label: 'Approval', num: true, render: function (a) { return el('span', { text: a.approvalRate + '%', style: { fontWeight: 600, color: a.approvalRate >= 90 ? 'var(--green-600)' : 'var(--amber-600)' } }); } },
          { label: 'Accuracy', render: function (a) { return el('div.row.gap-6', { style: { minWidth: '90px' } }, [ui.bar(a.accuracy, a.accuracy >= 88 ? 'green' : 'amber'), el('span.t-xs', { text: a.accuracy + '%' })]); } },
          { label: 'Halluc.', num: true, render: function (a) { return a.hallucinationFlags ? el('span', { text: a.hallucinationFlags, style: { color: 'var(--red-600)', fontWeight: 600 } }) : '0'; } },
          { label: 'Overrides', num: true, key: 'overrides' },
          { label: 'Queue', num: true, render: function (a) { return a.humanReviewQueue; } }
        ], rows: agents })] }),
        el('div.col.gap-16', {}, [
          ui.card({ title: 'Approval vs rejection', icon: '⚖️', body: [
            ui.barChart(s.aiAgents.slice(0, 6).map(function (a) { return { label: a.id.replace('AGT-', ''), v: a.approvalRate }; })),
            el('div.t-xs.t-mut3.mt-4', { text: 'Approval rate by agent (top 6)' })
          ] }),
          ui.card({ title: 'Trust & governance', icon: '🛡️', body: [
            ui.statline('Recommendations adopted', Math.round(totAppr / totSug * 100) + '%'),
            ui.statline('Human overrides', U.num(U.sum(s.aiAgents, function (a) { return a.overrides; }))),
            ui.statline('Hallucination / error flags', U.sum(s.aiAgents, function (a) { return a.hallucinationFlags; })),
            ui.statline('Avg SLA improvement', Math.round(U.sum(s.aiAgents, function (a) { return a.slaImprovement; }) / s.aiAgents.length) + '%'),
            ui.note('violet', 'Every AI output carries source, confidence and approval status; low-confidence and sensitive outputs route to a human before any CRM write or send.', '✨')
          ] })
        ])
      ])
    ]);
  }
  function chip(v, label) { return el('div.fchip' + (wf === v ? '.active' : ''), { onclick: function () { wf = v; store.emit(); } }, label); }

  return { render: render, title: 'AI Agent Performance' };
})();
