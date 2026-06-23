/* ============================================================
   Screen: Leadership Command Center (cross-workflow rollup)
   ============================================================ */
App.screens['command-center'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;

  function render() {
    var s = store.get();
    var m = store.metrics();
    var sess = store.getSession();
    var scopeLabel = (sess.centerId === 'ALL' ? 'All centers' : store.center(sess.centerId).short) + (sess.deptId === 'ALL' ? '' : ' · ' + store.dept(sess.deptId).name);

    /* target vs achieved (LD-01) */
    var tgts = (s.targets || []).filter(function (t) { return sess.centerId === 'ALL' || t.centerId === sess.centerId; });
    var revTarget = U.sum(tgts, function (t) { return t.revenue; });
    var revPct = revTarget ? Math.round(m.revenue / revTarget * 100) : 0;

    /* KPI row — clickable drill-through (LD-02) */
    function link(href, node) { return el('a', { href: href, style: { textDecoration: 'none', display: 'block' } }, node); }
    var kpis = el('div.grid.cols-4', {}, [
      link('#/attribution', ui.kpi({ icon: '💰', label: 'Attributed Revenue', value: U.inr(m.revenue, { compact: true }), accent: 'green', trend: 12.4, sub: revTarget ? revPct + '% of ' + U.inr(revTarget, { compact: true }) + ' target' : 'this period' })),
      link('#/wf003/dashboard', ui.kpi({ icon: '📣', label: 'Ad Spend', value: U.inr(m.spend, { compact: true }), accent: 'amber', sub: 'ROAS ' + m.roas + '×' })),
      link('#/attribution', ui.kpi({ icon: '🎯', label: 'Leads → Conversions', value: U.num(m.leads) + ' → ' + U.num(m.conversions), accent: 'indigo', sub: 'CPL ' + U.inr(m.cpl) })),
      link('#/wf006/quality', ui.kpi({ icon: '🧹', label: 'Data Quality', value: m.dqScore + '/100', accent: m.dqScore >= 85 ? 'green' : 'amber', sub: m.consentRate + '% consented · ' + m.sourceCoverage + '% sourced' }))
    ]);

    /* Golden journey funnel */
    var funnelCard = ui.card({
      title: 'The Golden Journey — acquisition to conversion',
      icon: '🧭',
      right: [el('a.btn.btn-sm', { href: '#/journey' }, 'Trace a devotee →')],
      body: [
        el('div.grid', { style: { gridTemplateColumns: '1.4fr 1fr', gap: '20px' } }, [
          el('div', {}, [
            ui.funnel([
              { label: 'Campaign demand (WF-003)', sub: U.num(m.leads) + ' leads captured', v: m.leads },
              { label: 'Clean identity (WF-006)', sub: m.consentRate + '% consent-checked', v: Math.round(m.leads * m.consentRate / 100) },
              { label: 'Voice calls (WF-002)', sub: Math.round(m.connectRate) + '% connect rate', v: m.calls },
              { label: 'Interested / callback', sub: 'follow-up active', v: Math.round(m.calls * 0.42) },
              { label: 'Conversions', sub: U.inr(m.revenue, { compact: true }) + ' revenue', v: m.conversions }
            ])
          ]),
          el('div', {}, [
            el('div.t-up.mb-8', { text: 'Loop integrity' }),
            ui.statline('Same Contact_ID end-to-end', ui.badge('Enforced', 'green', true)),
            ui.statline('Source attribution preserved', ui.badge(m.sourceCoverage + '%', m.sourceCoverage >= 90 ? 'green' : 'amber', true)),
            ui.statline('Consent / DND enforced', ui.badge('Pre-call gate', 'green', true)),
            ui.statline('Manual fallback ready', ui.badge('All stages', 'green', true)),
            ui.note('violet', 'Acceptance is not "each screen works" — it is the <b>same person recognised at every step</b>, source preserved, nothing dropped, sensitive actions showing approval state.', '🧭')
          ])
        ])
      ]
    });

    /* Decisions required (leadership) */
    var pending = s.approvals.filter(function (a) { return a.status === 'pending'; });
    var decisionsCard = ui.card({
      title: 'Decisions required',
      icon: '⏳',
      right: [ui.badge(pending.length + ' pending', 'amber'), el('a.btn.btn-sm', { href: '#/approvals' }, 'Open queue')],
      body: pending.length ? pending.slice(0, 5).map(function (a) {
        var overdue = new Date(a.slaDue) < U.now();
        return el('div.row.gap-12', { style: { padding: '10px 0', borderBottom: '1px solid var(--border)' } }, [
          el('div', { style: { flex: 1, minWidth: 0 } }, [
            el('div.row.gap-8', {}, [ui.badge(a.type, 'indigo'), a.priority === 'High' ? ui.badge('High', 'red') : null, overdue ? ui.badge('SLA breached', 'red', true) : null]),
            el('div.t-semi.mt-4', { text: a.title }),
            el('div.t-xs.t-mut', { text: 'by ' + (store.user(a.requestedBy) || {}).name + ' · ' + U.ago(a.createdAt) + ' · SLA ' + U.ago(a.slaDue) })
          ]),
          el('a.btn.btn-sm.btn-primary', { href: '#/approvals?focus=' + a.id }, 'Review')
        ]);
      }) : [ui.emptyState({ icon: '✅', title: 'All clear', sub: 'No pending decisions.' })]
    });

    /* Risk / attention */
    var attentionCard = ui.card({
      title: 'Needs attention',
      icon: '🚨',
      body: [
        el('div.grid.cols-2', { style: { gap: '10px' } }, [
          miniStat('🚨', 'Open escalations', m.openEscalations, 'red', '#/wf002/escalations'),
          miniStat('📋', 'Overdue callbacks', m.overdueCallbacks, 'amber', '#/wf002/tasks'),
          miniStat('🔗', 'Merge reviews', s.merges.filter(function (x) { return x.status === 'pending'; }).length, 'indigo', '#/wf006/dedupe'),
          miniStat('🔌', 'Blocked / pending APIs', s.apiRegistry.filter(function (x) { return x.status !== 'confirmed'; }).length, 'amber', '#/wf006/api')
        ])
      ]
    });

    /* Per-center performance */
    var byCenter = s.centers.map(function (c) {
      var camps = s.campaigns.filter(function (x) { return x.centerId === c.id; });
      return { center: c, revenue: U.sum(camps, function (x) { return x.revenue; }), spend: U.sum(camps, function (x) { return x.spend; }), leads: U.sum(camps, function (x) { return x.leads; }) };
    });
    var maxRev = Math.max.apply(null, byCenter.map(function (x) { return x.revenue; }).concat([1]));
    var centerCard = ui.card({
      title: 'Performance by center',
      icon: '🏛️',
      body: byCenter.map(function (x) {
        return el('div', { style: { marginBottom: '14px' } }, [
          el('div.row-between.mb-4', {}, [el('b.t-sm', { text: x.center.name }), el('span.t-sm.t-mut', { text: U.inr(x.revenue, { compact: true }) + ' · ROAS ' + (x.spend ? (x.revenue / x.spend).toFixed(1) : '—') + '×' })]),
          ui.bar(x.revenue / maxRev * 100, 'green')
        ]);
      })
    });

    /* Usage / central billing snapshot */
    var usage = s.usage;
    var totalCost = U.sum(usage.rows, function (r) { return r.cost; });
    var byService = {};
    usage.rows.forEach(function (r) { byService[r.service] = (byService[r.service] || 0) + r.cost; });
    var usageCard = ui.card({
      title: 'Central platform spend (usage)',
      icon: '💳',
      right: [el('a.btn.btn-sm', { href: '#/usage' }, 'Details')],
      body: [
        el('div.row-between.mb-12', {}, [
          el('div', {}, [el('div.t-mut.t-xs', { text: 'This month · centrally billed' }), el('div.t-2xl.t-bold', { text: U.inr(totalCost, { compact: true }) })]),
          el('div.t-right', {}, [el('div.t-mut.t-xs', { text: 'Budget' }), el('div.t-semi', { text: U.inr(usage.budgetMonthly, { compact: true }) })])
        ]),
        ui.bar(totalCost / usage.budgetMonthly * 100, totalCost > usage.budgetMonthly ? 'red' : 'indigo'),
        el('div.mt-12', {}, usage.services.map(function (sv) {
          return ui.statline(sv.icon + ' ' + sv.name, U.inr(byService[sv.id] || 0, { compact: true }));
        }))
      ]
    });

    return el('div', {}, [
      ui.pageHead('Leadership Command Center', 'One view across WF-006, WF-002 and WF-003 — revenue, the conversion loop, decisions and risk. <b>' + scopeLabel + '</b>. <span class="t-xs t-mut3">· as of ' + U.fmtTime(U.now()) + ' · sources live except CRM/voice on fallback</span>', [
        el('a.btn', { href: '#/sla' }, [el('span.ico', { text: '⏱️' }), 'SLA Board']),
        el('a.btn', { href: '#/journey' }, [el('span.ico', { text: '🧭' }), 'Golden Journey']),
        el('a.btn.btn-primary', { href: '#/approvals' }, [el('span.ico', { text: '✅' }), 'Approvals (' + pending.length + ')'])
      ]),
      kpis,
      el('div.grid.mt-16', { style: { gridTemplateColumns: '2fr 1fr', gap: '16px', alignItems: 'start' } }, [
        el('div.col.gap-16', {}, [funnelCard, decisionsCard]),
        el('div.col.gap-16', {}, [attentionCard, centerCard, usageCard])
      ])
    ]);
  }

  function miniStat(icon, label, val, color, href) {
    return el('a', { href: href, style: { textDecoration: 'none', display: 'block' } }, [
      el('div.card.card-hover', { style: { padding: '12px' } }, [
        el('div.row.gap-8', {}, [
          el('div.kpi-ico', { text: icon, style: { background: 'var(--' + (color === 'red' ? 'red' : color === 'amber' ? 'amber' : 'indigo') + '-50)', width: '30px', height: '30px' } }),
          el('div', {}, [el('div.t-2xl.t-bold', { text: val, style: { lineHeight: 1 } }), el('div.t-xs.t-mut', { text: label })])
        ])
      ])
    ]);
  }

  return { render: render, title: 'Command Center' };
})();
