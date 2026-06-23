/* ============================================================
   Screen: WF-006 Segment & Campaign-Fit Studio (6.5 / 3.2)
   ============================================================ */
App.screens['wf006-segments'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;

  function render() {
    var s = store.get();
    var segs = s.segments;
    var ready = segs.filter(function (x) { return x.status === 'ready'; }).length;

    return el('div', {}, [
      ui.pageHead('Segment & Campaign-Fit Studio', 'Builds eligible, well-formed audiences for campaigns and calling — by source, lifecycle, donor-tier, geography and language. Over-contacted contacts are suppressed; sensitive audiences need approval.', [
        el('button.btn.btn-primary', { onclick: buildSegment }, [el('span.ico', { text: '✨' }), 'Build segment'])
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '🎯', label: 'Segments', value: segs.length, accent: 'indigo' }),
        ui.kpi({ icon: '✓', label: 'Campaign-ready', value: ready, accent: 'green' }),
        ui.kpi({ icon: '🛡️', label: 'Sensitive (need approval)', value: segs.filter(function (x) { return x.sensitive; }).length, accent: 'amber' }),
        ui.kpi({ icon: '♻️', label: 'Retargeting seeds', value: U.sum(segs, function (x) { return x.retargetSeed; }), accent: 'violet' })
      ]),
      el('div.grid.cols-2', {}, segs.map(segCard))
    ]);
  }

  function segCard(sg) {
    return ui.card({ body: [
      el('div.row-between.mb-8', { style: { flexWrap: 'wrap', gap: '8px' } }, [
        el('div', {}, [el('div.row.gap-8', {}, [el('b', { text: sg.name }), sg.sensitive ? ui.badge('Sensitive', 'amber', true) : null]), el('div.t-xs.t-mut.mt-2.t-mono', { text: sg.rule })]),
        ui.badge('Fit ' + sg.fit, sg.fit >= 85 ? 'green' : 'amber')
      ]),
      el('div.grid.cols-3', { style: { gap: '8px' } }, [
        miniStat('Total', sg.size, ''), miniStat('Eligible', sg.eligible, 'green'), miniStat('Suppressed', sg.suppressed + sg.overContact, 'amber')
      ]),
      el('div.row.gap-6.mt-8', {}, sg.channels.map(function (c) { return ui.badge(channelIcon(c) + ' ' + c, 'neutral'); })),
      el('div.row.gap-8.mt-12', { style: { alignItems: 'center' } }, [
        ui.statusBadge(sg.status),
        el('div.grow'),
        sg.status === 'needs_approval' ? el('button.btn.btn-sm.btn-success', { onclick: function () { store.actions.approveSegment(sg.id); ui.toast({ kind: 'success', msg: 'Segment approved & campaign-ready.' }); } }, '✓ Approve') :
          el('button.btn.btn-sm', { onclick: function () { useInCampaign(sg); } }, 'Use in campaign →'),
        el('button.btn.btn-sm.btn-ghost', { onclick: function () { ui.toast({ kind: 'info', msg: 'Exclusion list (' + (sg.suppressed + sg.overContact) + ') exported.' }); } }, 'Exclusions')
      ])
    ] });
  }
  function miniStat(label, val, color) { return el('div', { style: { background: 'var(--surface-2)', borderRadius: '8px', padding: '8px 10px' } }, [el('div.t-xs.t-mut', { text: label }), el('div.t-lg.t-bold', { text: U.num(val), style: color ? { color: 'var(--' + color + '-600)' } : null })]); }
  function channelIcon(c) { return { call: '📞', whatsapp: '💬', sms: '📩', email: '✉' }[c] || '•'; }

  function useInCampaign(sg) { ui.toast({ kind: 'success', title: 'Audience attached', msg: sg.eligible + ' eligible contacts ready for a campaign or call queue.' }); App.router.go('/wf003/builder'); }

  function buildSegment() {
    ui.modal({ title: 'Build a segment', subtitle: 'AI suggests campaign-ready audiences',
      body: el('div', {}, [
        ui.aiBlock('Segment & Campaign-Fit Agent', [el('div.t-sm', { html: 'Choose dimensions and the agent assembles an eligible, deduped, consent-checked audience with an exclusion list and retargeting seed.' })]),
        el('div.field.mt-12', {}, [el('label', { text: 'Segment by' }), el('div.chips', {}, ['Source', 'Lifecycle', 'Donor tier', 'Geography', 'Language', 'Engagement'].map(function (d) { return el('div.fchip', { onclick: function (e) { e.currentTarget.classList.toggle('active'); } }, d); }))])
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Generate segment', variant: 'primary', onClick: function () { ui.toast({ kind: 'success', title: 'Segment generated', msg: 'New campaign-ready audience added (awaiting approval if sensitive).' }); } }]
    });
  }

  return { render: render, title: 'Segment Studio' };
})();
