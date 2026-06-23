/* ============================================================
   Screen: WF-006 Master Contacts
   ============================================================ */
App.screens['wf006-contacts'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;
  var f = { q: '', segment: 'all', consent: 'all' };

  function render() {
    var s = store.get();
    var all = store.scoped(s.contacts);

    var rows = all.filter(function (c) {
      if (f.q) { var q = f.q.toLowerCase(); if (!((c.name + c.mobile + c.id + (c.email || '') + c.city).toLowerCase().indexOf(q) > -1)) return false; }
      if (f.segment !== 'all' && c.segment !== f.segment) return false;
      if (f.consent === 'consented' && (c.consent.dnd || c.consent.optOut)) return false;
      if (f.consent === 'suppressed' && !(c.consent.dnd || c.consent.optOut)) return false;
      if (f.consent === 'nosource' && c.source) return false;
      return true;
    });
    rows = U.sortBy(rows, function (c) { return c.dqScore; }, 'desc');

    var segments = ['all'].concat(Array.from(new Set(all.map(function (c) { return c.segment; }))));

    var head = el('div.filterbar', {}, [
      searchBox(),
      el('select.select', { style: { maxWidth: '180px' }, onchange: function (e) { f.segment = e.target.value; rerender(); } }, segments.map(function (sg) { var o = el('option', { value: sg, text: sg === 'all' ? 'All segments' : sg }); if (sg === f.segment) o.selected = true; return o; })),
      el('div.chips', {}, [
        chip('all', 'All'), chip('consented', 'Consented'), chip('suppressed', 'Suppressed (DND/opt-out)'), chip('nosource', 'Missing source')
      ]),
      el('div.grow'),
      el('button.btn', { onclick: exportContacts }, [el('span.ico', { text: '⬇' }), 'Export']),
      el('a.btn.btn-primary', { href: '#/wf006/intake' }, [el('span.ico', { text: '📥' }), 'Import'])
    ]);

    var table = ui.table({
      onRow: function (c) { router.go('/wf006/contact/' + c.id); },
      columns: [
        { label: 'Contact', render: function (c) { return ui.personCell(c.name, c.id, c.id); } },
        { label: 'Mobile', render: function (c) { return el('span.t-mono.t-sm', { text: c.mobile }); } },
        { label: 'City', key: 'city' },
        { label: 'Segment', render: function (c) { return ui.badge(c.segment, segColor(c.segment)); } },
        { label: 'Source', render: function (c) { var sr = store.source(c.source); return c.source ? el('span.t-sm', { text: sr.icon + ' ' + sr.label }) : ui.badge('missing', 'red', true); } },
        { label: 'Consent', render: function (c) { return ui.consentBadges(c.consent); } },
        { label: 'DQ', num: true, render: function (c) { return el('span.t-semi', { text: c.dqScore, style: { color: c.dqScore >= 85 ? 'var(--green-600)' : c.dqScore >= 65 ? 'var(--amber-600)' : 'var(--red-600)' } }); } },
        { label: 'IDs', render: function (c) { return el('div.row.gap-4', {}, [c.donorId ? ui.badge('Donor', 'saffron') : null, c.yatriId ? ui.badge('Yatri', 'teal') : null].filter(Boolean)); } }
      ],
      rows: rows
    });

    return el('div', {}, [
      ui.pageHead('Master Contacts', 'The single deduplicated, source-tagged, consent-aware identity spine (WF-006). Every record carries a <b>Contact_ID</b> — nothing downstream is created without one.', [
        ui.badge(all.length + ' contacts', 'neutral'),
        ui.badge(store.scoped(s.donors).length + ' donors', 'saffron')
      ]),
      head,
      ui.card({ pad: false, body: [table] }),
      el('div.t-xs.t-mut3.mt-8', { text: 'Showing ' + rows.length + ' of ' + all.length + ' · click a row for the Contact 360 view.' })
    ]);
  }

  function searchBox() {
    var inp = el('input.input', { type: 'search', placeholder: 'Search name, mobile, ID, city…', value: f.q });
    inp.addEventListener('input', U.debounce(function (e) { f.q = e.target.value; rerender(); }, 200));
    return el('div.search-box', { style: { flex: 1, maxWidth: '320px' } }, [el('span.ico', { text: '🔍' }), inp]);
  }
  function chip(v, label) { return el('div.fchip' + (f.consent === v ? '.active' : ''), { onclick: function () { f.consent = v; rerender(); } }, label); }
  function segColor(seg) { return /HNI|Patron/.test(seg) ? 'saffron' : /Donor/.test(seg) ? 'green' : /Yatra/.test(seg) ? 'teal' : /CSR/.test(seg) ? 'violet' : /Lapsed/.test(seg) ? 'amber' : 'blue'; }
  function rerender() { App.store.emit(); }
  function exportContacts() {
    App.store.actions && App.store.get().audit.unshift({ id: U.uid('AUD'), actorId: store.getSession().userId, action: 'Exported contacts CSV', type: 'export', entityId: 'bulk', detail: 'Export logged for audit', timestamp: U.now().toISOString() });
    store.commit();
    ui.toast({ kind: 'success', title: 'Export queued', msg: 'CSV export logged in audit trail (Privacy & Access control).' });
  }

  return { render: render, title: 'Master Contacts' };
})();
