/* ============================================================
   Screen: KCKE & Media AI Boundary (shared S11)
   ============================================================ */
App.screens['kcke'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;
  var tab = 'citations';

  function render() {
    var s = store.get();
    var k = s.kcke;
    var tabsBar = ui.tabs([
      { id: 'citations', label: 'Knowledge (KCKE)', icon: '📖', count: k.citations.length },
      { id: 'media', label: 'Media AI assets', icon: '🎨', count: k.media.length },
      { id: 'boundary', label: 'Boundary rules', icon: '🛡️' }
    ], tab, function (t) { tab = t; store.emit(); });

    var body = tab === 'citations' ? citations(k.citations) : tab === 'media' ? media(k.media) : boundary();

    return el('div', {}, [
      ui.pageHead('KCKE & Media-AI Boundary', 'Spiritual knowledge, media generation, CRM and ERP data are kept <b>separate</b> with defined interfaces. KCKE supplies source-grounded citations & donor narratives; Media AI produces approved visuals. <b>Operational data never lives in the knowledge engine.</b>', null),
      tabsBar, body
    ]);
  }

  function citations(cits) {
    return el('div', {}, [
      ui.note('info', 'KCKE is used <b>only</b> for source-grounded Krishna-conscious content, Śrīla Prabhupāda citations and festival/philosophical explanations — never for contact, call, payment or task status.', '📖'),
      el('div.grid.cols-2.mt-12', {}, cits.map(function (c) {
        return ui.card({ body: [
          el('div.row-between.mb-8', {}, [el('b', { text: c.topic }), ui.statusBadge(c.status)]),
          el('div', { style: { background: 'var(--surface-2)', borderLeft: '3px solid var(--saffron-500)', padding: '10px 12px', borderRadius: '8px', fontStyle: 'italic', fontSize: '12.5px' } }, '“' + c.text + '”'),
          el('div.row-between.mt-8', {}, [el('span.t-xs.t-mut', { text: '📜 ' + c.source }), el('div.row.gap-4', {}, (c.usedIn || []).map(function (u) { return ui.idChip(u); }))])
        ] });
      }))
    ]);
  }

  function media(items) {
    return el('div', {}, [
      ui.note('violet', 'Media AI produces scene-level storyboards & assets that <b>always require human approval</b> before public use. It is never the CRM or call-status system.', '🎨'),
      el('div.mt-12', {}, ui.card({ pad: false, body: [ui.table({ columns: [
        { label: 'Asset', render: function (m) { return el('b.t-sm', { text: m.title }); } },
        { label: 'Type', render: function (m) { return ui.badge(m.type, 'indigo'); } },
        { label: 'Campaign', render: function (m) { return store.campaign(m.campaignId) ? ui.idChip(m.campaignId, function () { App.router.go('/wf003/campaign/' + m.campaignId); }) : ui.idChip(m.campaignId); } },
        { label: 'Note', render: function (m) { return el('span.t-xs.t-mut', { text: m.note }); } },
        { label: 'Status', render: function (m) { return ui.statusBadge(m.status); } },
        { label: '', render: function (m) { return m.status === 'needs_approval' || m.status === 'draft' ? el('button.btn.btn-sm.btn-success', { onclick: function () { store.actions.decideMedia(m.id, 'approved'); ui.toast({ kind: 'success', msg: 'Asset approved.' }); } }, '✓ Approve') : el('span.t-xs.t-mut', { text: 'approved' }); } }
      ], rows: items })] }))
    ]);
  }

  function boundary() {
    return el('div.grid.cols-2', {}, [
      ui.card({ title: 'What KCKE IS used for', icon: '✓', body: [
        line('Source-grounded Krishna-conscious content'), line('Śrīla Prabhupāda citations with source IDs'), line('Festival / philosophical explanations'), line('Donor narratives (with consent)')
      ] }),
      ui.card({ title: 'What KCKE is NEVER used for', icon: '✕', body: [
        line('Contact / call / payment / task status', true), line('Inventory or operational records', true), line('Unreviewed public output', true), line('CRM or call-status system of record', true)
      ] }),
      el('div', { style: { gridColumn: '1 / -1' } }, ui.note('green', 'CRM/ERP store only approved links and metadata to spiritual content — never raw KCKE content. Media output is always human-approved before public use.', '🛡️'))
    ]);
  }
  function line(t, no) { return el('div.row.gap-8', { style: { padding: '7px 0', borderBottom: '1px solid var(--border)' } }, [el('span', { text: no ? '✕' : '✓', style: { color: no ? 'var(--red-500)' : 'var(--green-600)', fontWeight: 700 } }), el('span.t-sm', { text: t })]); }

  return { render: render, title: 'KCKE & Media Boundary' };
})();
