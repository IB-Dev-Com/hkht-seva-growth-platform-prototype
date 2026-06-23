/* ============================================================
   Screen: WF-003 Creative & Media Brief (3.4) + KCKE/Media link
   ============================================================ */
App.screens['wf003-creative'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;

  function render() {
    var s = store.get();
    var media = s.kcke.media;

    return el('div', {}, [
      ui.pageHead('Creative & Media Brief', 'Prepares poster / reel / storyboard inputs for the media team. <b>All public visual output is human-approved</b>; deity & media representation always require sign-off (KCKE / Media-AI boundary).', [
        el('button.btn.btn-primary', { onclick: newBrief }, [el('span.ico', { text: '🎬' }), 'New media brief'])
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '🎨', label: 'Media assets', value: media.length, accent: 'indigo' }),
        ui.kpi({ icon: '⏳', label: 'Awaiting approval', value: media.filter(function (m) { return m.status === 'needs_approval'; }).length, accent: 'amber' }),
        ui.kpi({ icon: '✓', label: 'Approved', value: media.filter(function (m) { return m.status === 'approved'; }).length, accent: 'green' }),
        ui.kpi({ icon: '⏱️', label: 'Avg creative cycle', value: '2.4d', accent: 'teal', sub: 'brief → approved' })
      ]),
      el('div.grid.cols-2', {}, media.map(mediaCard))
    ]);
  }

  function mediaCard(m) {
    var camp = store.campaign(m.campaignId);
    return ui.card({ body: [
      el('div.row-between.mb-8', {}, [el('div.row.gap-8', {}, [el('span', { text: typeIcon(m.type), style: { fontSize: '20px' } }), el('div', {}, [el('b', { text: m.title }), el('div.t-xs.t-mut', { text: m.type + ' · ' + (camp ? camp.name : m.campaignId) })])]), ui.statusBadge(m.status)]),
      // mock storyboard frames
      el('div.row.gap-6', {}, [1, 2, 3].map(function (i) { return el('div', { style: { flex: 1, height: '54px', borderRadius: '8px', background: 'linear-gradient(135deg,var(--indigo-100),var(--saffron-100))', display: 'grid', placeContent: 'center', fontSize: '11px', color: 'var(--text-3)' } }, 'Frame ' + i); })),
      el('div.note.note-violet.mt-8', {}, [el('span.ni', { text: '🛡️' }), el('div.t-xs', { text: m.note })]),
      el('div.row.gap-8.mt-12', {}, [
        m.status === 'needs_approval' || m.status === 'draft' ? el('button.btn.btn-sm.btn-success', { onclick: function () { store.actions.decideMedia(m.id, 'approved'); ui.toast({ kind: 'success', msg: 'Media asset approved for use.' }); } }, '✓ Approve') : null,
        m.status === 'needs_approval' ? el('button.btn.btn-sm', { onclick: function () { store.actions.decideMedia(m.id, 'rejected'); ui.toast({ kind: 'warn', msg: 'Sent back to creative.' }); } }, '↩ Send back') : null,
        el('div.grow'),
        el('span.t-xs.t-mut3', { text: 'KCKE-grounded · human-approved' })
      ])
    ] });
  }
  function typeIcon(t) { return { Reel: '🎞️', Poster: '🖼️', Video: '📹', Storyboard: '🎬' }[t] || '🎨'; }

  function newBrief() {
    ui.modal({ title: 'New media brief', subtitle: 'AI prepares scene-level inputs',
      body: el('div', {}, [
        ui.aiBlock('Creative / Media Brief Agent', [el('div.t-sm', { html: 'Generates a storyboard, asset request and shot list. <b>Deity / media representation and brand claims are flagged for human approval</b> before any public use.' })]),
        el('div.field.mt-12', {}, [el('label', { text: 'Asset type' }), el('select.select', {}, ['Reel', 'Poster', 'Video', 'Storyboard'].map(function (t) { return el('option', { text: t }); }))]),
        el('div.field', {}, [el('label', { text: 'Campaign' }), el('select.select', {}, store.get().campaigns.map(function (c) { return el('option', { text: c.name }); }))])
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Generate brief', variant: 'primary', onClick: function () { ui.toast({ kind: 'success', title: 'Brief drafted', msg: 'Storyboard + asset request created — routed for media/deity approval.' }); } }]
    });
  }

  return { render: render, title: 'Creative & Media Brief' };
})();
