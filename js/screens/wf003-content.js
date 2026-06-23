/* ============================================================
   Screen: WF-003 Content & Creative approval queue
   ============================================================ */
App.screens['wf003-content'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;

  function render() {
    var s = store.get();
    var content = s.content;

    return el('div', {}, [
      ui.pageHead('Content & Creative', 'AI drafts ad copy, WhatsApp/SMS and landing copy; <b>humans review and approve</b>. Devotional, donor-sensitive and deity/media content always require human sign-off.', null),
      el('div.grid.cols-3.mb-16', {}, [
        ui.kpi({ icon: '✍️', label: 'Drafts', value: content.length, accent: 'indigo' }),
        ui.kpi({ icon: '⏳', label: 'Pending review', value: content.filter(function (c) { return c.status === 'pending_approval'; }).length, accent: 'amber' }),
        ui.kpi({ icon: '✓', label: 'Approved', value: content.filter(function (c) { return c.status === 'approved'; }).length, accent: 'green' })
      ]),
      el('div.col.gap-12', {}, content.map(contentCard))
    ]);
  }

  function contentCard(ct) {
    var camp = store.campaign(ct.campaignId);
    return ui.card({ body: [
      el('div.row-between.mb-12', { style: { flexWrap: 'wrap', gap: '8px' } }, [
        el('div', {}, [el('div.row.gap-8', {}, [el('b', { text: (camp ? camp.name : ct.campaignId) }), ui.badge(ct.channel, 'indigo')]), el('div.t-xs.t-mut.mt-2', { text: ct.id + ' · reviewer ' + (store.user(ct.reviewerId) || {}).name })]),
        ui.statusBadge(ct.status)
      ]),
      el('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '10px' } }, ct.variants.map(function (v, i) {
        return el('div', { style: { border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', background: 'var(--surface-2)' } }, [
          ui.badge('Variant ' + String.fromCharCode(65 + i), 'neutral'),
          el('b.mt-8', { text: v.headline, style: { display: 'block', fontSize: '13px' } }),
          el('div.t-xs.t-mut.mt-4', { text: v.body }),
          el('div.mt-8', {}, ui.badge(v.cta, 'saffron'))
        ]);
      })),
      ct.status === 'pending_approval' || ct.status === 'draft' ? el('div.row.gap-8.mt-12', {}, [
        el('button.btn.btn-sm.btn-success', { onclick: function () { decide(ct, 'approved'); } }, '✓ Approve for publish'),
        el('button.btn.btn-sm', { onclick: function () { decide(ct, 'draft'); } }, '↩ Send back'),
        el('div.grow'),
        el('span.t-xs.t-mut3', { text: 'Devotional/deity claims reviewed for accuracy & sensitivity' })
      ]) : el('div.t-xs.t-mut3.mt-8', { text: '✓ Approved & published' })
    ] });
  }

  function decide(ct, status) {
    ct.status = status; store.commit();
    var appr = store.get().approvals.find(function (a) { return a.entityId === ct.id && a.status === 'pending'; });
    if (appr) { appr.status = status === 'approved' ? 'approved' : 'rejected'; appr.decisionBy = store.getSession().userId; appr.decisionAt = U.now().toISOString(); store.commit(); }
    ui.toast({ kind: status === 'approved' ? 'success' : 'warn', msg: status === 'approved' ? 'Content approved for publish.' : 'Sent back to draft.' });
  }

  return { render: render, title: 'Content & Creative' };
})();
