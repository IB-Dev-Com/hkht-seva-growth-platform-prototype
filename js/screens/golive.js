/* ============================================================
   Screen: Production Readiness & Golden-Journey QA (go/no-go gates)
   Maps to the briefs' sequencing gates, production-readiness
   checklist, golden-journey QA and 30/60/75-day roadmap.
   ============================================================ */
App.screens['golive'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;

  function render() {
    var s = store.get();
    var m = store.metrics();

    // sequencing gates (dynamic where possible)
    var pendingMerges = s.merges.filter(function (x) { return x.status === 'pending'; }).length;
    var prodScripts = s.scripts.filter(function (x) { return x.status === 'production'; }).length;
    var gates = [
      { wf: 'WF-006', name: 'Data backbone gate', pass: m.dqScore >= 80 && m.sourceCoverage >= 85, items: [
        ['Contact_ID rules approved', true], ['Duplicate policy live', true], ['Source fields enforced', m.sourceCoverage >= 85], ['Consent/DND model approved', true], ['DQ score ≥ 80', m.dqScore >= 80]
      ] },
      { wf: 'WF-002', name: 'Calling gate', pass: prodScripts >= 2, items: [
        ['DND/TRAI audit Green', true], ['Approved production scripts', prodScripts >= 2], ['Outcome codes mapped to CRM', true], ['Escalation path defined', true], ['Manual fallback tested', true]
      ] },
      { wf: 'WF-003', name: 'Campaign gate', pass: true, items: [
        ['Campaign_ID/source governance live', true], ['Landing/payment/CRM links QA\'d', true], ['Budget-approval gate working', true], ['Lead-to-CRM handoff validated', true], ['Fallback tested', true]
      ] }
    ];

    // golden-journey QA test cases
    var qa = [
      { id: 'QA-01', name: 'Campaign lead carries Source + Campaign_ID into CRM', wf: 'WF-003→006', status: 'pass' },
      { id: 'QA-02', name: 'Identity resolved & consent-checked before calling', wf: 'WF-006', status: 'pass' },
      { id: 'QA-03', name: 'Voice outcome + intent written back to Contact_ID', wf: 'WF-002→006', status: 'pass' },
      { id: 'QA-04', name: 'Low-confidence outcome routes to human review', wf: 'WF-002', status: 'pass' },
      { id: 'QA-05', name: 'Callback creates Task_ID with SLA', wf: 'WF-002', status: 'pass' },
      { id: 'QA-06', name: 'Conversion links Donation_ID + Payment_Status', wf: 'WF-002→003', status: 'pass' },
      { id: 'QA-07', name: 'DCC payment reconciliation (webhook delay)', wf: 'WF-009', status: 'warn' },
      { id: 'QA-08', name: 'Whole journey visible on command center', wf: 'All', status: 'pass' }
    ];

    // readiness checklist
    var checklist = [
      'Live operational use by selected users with safe data',
      'Validated data path with error logging (intake → ID → CRM → owner → dashboard)',
      'Dashboards: management, operational, revenue, data-quality, AI-performance',
      'Approval routing with named approver, backup & SLA',
      'Exception handling routes to a human owner',
      'Role ownership validated (owner/performer/approver/backup/escalation)',
      'Data-quality checks surface duplicates, invalid phones, missing source/consent',
      'Cross-workflow shared IDs & source tags present',
      'Manual fallback defined and tested',
      'Golden journey passes end-to-end with controlled data'
    ];

    var roadmap = [
      { k: '30-Day Production Base', d: 'Controlled go-live: validated data path, dashboards, approval routing, fallback.', state: 'active' },
      { k: '60-Day Stabilization', d: 'Adoption, API hardening, data-quality discipline, KPI review, support cadence.', state: 'next' },
      { k: '75-Day Enterprise Scale', d: 'Cross-workflow maturity, command-center intelligence, multi-center replication packaging.', state: 'next' }
    ];

    return el('div', {}, [
      ui.pageHead('Production Readiness & Golden-Journey QA', 'The go / no-go control room — sequencing gates (WF-006 → WF-002 → WF-003), the production-readiness checklist, golden-journey QA test cases, and the 30 / 60 / 75-day roadmap. Acceptance is the whole journey passing, not isolated screens.', null),
      el('div.grid.cols-3.mb-16', {}, [
        ui.kpi({ icon: '🚦', label: 'Gates passing', value: gates.filter(function (g) { return g.pass; }).length + '/' + gates.length, accent: 'green' }),
        ui.kpi({ icon: '🧪', label: 'Golden-journey QA', value: qa.filter(function (q) { return q.status === 'pass'; }).length + '/' + qa.length, accent: qa.every(function (q) { return q.status === 'pass'; }) ? 'green' : 'amber' }),
        ui.kpi({ icon: '✅', label: 'Readiness criteria', value: '10/10', accent: 'green', sub: 'per workflow' })
      ]),
      ui.card({ title: 'Sequencing gates (must pass in order)', icon: '🚦', cls: 'mb-16', body: [
        el('div.grid.cols-3', {}, gates.map(function (g) {
          return el('div', { style: { border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', background: g.pass ? 'var(--green-50)' : 'var(--amber-50)' } }, [
            el('div.row-between.mb-8', {}, [el('b', { text: g.wf }), ui.riskGate(g.pass ? 'green' : 'amber', g.pass ? 'Open' : 'Hold')]),
            el('div.t-sm.t-semi.mb-8', { text: g.name }),
            el('div.col.gap-4', {}, g.items.map(function (it) { return el('div.row.gap-6.t-xs', {}, [el('span', { text: it[1] ? '✓' : '○', style: { color: it[1] ? 'var(--green-600)' : 'var(--amber-600)', fontWeight: 700 } }), el('span' + (it[1] ? '' : '.t-mut'), { text: it[0] })]); }))
          ]);
        }))
      ] }),
      el('div.grid', { style: { gridTemplateColumns: '1.3fr 1fr', gap: '16px', alignItems: 'start' } }, [
        ui.card({ title: 'Golden-journey QA test cases', icon: '🧪', pad: false, body: [ui.table({ compact: true, columns: [
          { label: 'Test', render: function (q) { return el('div', {}, [el('b.t-sm', { text: q.name }), el('div.t-xs.t-mut', { text: q.id + ' · ' + q.wf })]); } },
          { label: 'Result', render: function (q) { return q.status === 'pass' ? ui.badge('✓ Pass', 'green') : q.status === 'warn' ? ui.badge('⚠ Watch', 'amber') : ui.badge('✕ Fail', 'red'); } }
        ], rows: qa })] }),
        el('div.col.gap-16', {}, [
          ui.card({ title: 'Production-readiness checklist', icon: '✅', body: [el('div.col.gap-4', {}, checklist.map(function (c) { return el('div.row.gap-8', { style: { padding: '5px 0' } }, [el('span', { text: '✓', style: { color: 'var(--green-600)', fontWeight: 700 } }), el('span.t-sm', { text: c })]); }))] }),
          ui.card({ title: '30 / 60 / 75-day roadmap', icon: '🗺️', body: roadmap.map(function (r) {
            return el('div', { style: { padding: '9px 0', borderBottom: '1px solid var(--border)' } }, [el('div.row.gap-8', {}, [ui.badge(r.state === 'active' ? 'Now' : 'Next', r.state === 'active' ? 'green' : 'neutral'), el('b.t-sm', { text: r.k })]), el('div.t-xs.t-mut.mt-2', { text: r.d })]);
          }) })
        ])
      ]),
      ui.note('green', '<b>Acceptance reviews:</b> Day 7 · Day 14 · Day 21 · Day 30 — each validates functionality, data correctness, human-approval gates, dashboard accuracy and production readiness with demo evidence and an unresolved-assumption log.', '🗓️')
    ]);
  }

  return { render: render, title: 'Production Readiness' };
})();
