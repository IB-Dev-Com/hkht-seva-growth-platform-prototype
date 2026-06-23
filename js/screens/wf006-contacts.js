/* ============================================================
   Screen: WF-006 Master Contacts (bulk, sortable, drill-through)
   ============================================================ */
App.screens['wf006-contacts'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;
  var f = { q: '', segment: 'all', consent: 'all', campaign: null, source: null };
  var sel = {};

  function render(params, query) {
    var s = store.get();
    if (query && query.f) f.consent = query.f;            // ST-04 drill-through
    if (query && query.campaign) f.campaign = query.campaign;
    if (query && query.source) f.source = query.source;   // attribution drill
    var all = store.scoped(s.contacts);

    var rows = all.filter(function (c) {
      if (f.campaign && c.campaignId !== f.campaign) return false;
      if (f.source && c.source !== f.source) return false;
      if (f.q) { var q = f.q.toLowerCase(); if (!((c.name + c.mobile + c.id + (c.email || '') + c.city).toLowerCase().indexOf(q) > -1)) return false; }
      if (f.segment !== 'all' && c.segment !== f.segment) return false;
      if (f.consent === 'consented' && (c.consent.dnd || c.consent.optOut)) return false;
      if (f.consent === 'suppressed' && !(c.consent.dnd || c.consent.optOut)) return false;
      if (f.consent === 'nosource' && c.source) return false;
      if (f.consent === 'stale' && (U.now() - new Date(c.lastTouch)) / 86400000 <= 30) return false;
      if (f.consent === 'dup' && c.dupRisk <= 50) return false;
      return true;
    });

    var segments = ['all'].concat(Array.from(new Set(all.map(function (c) { return c.segment; }))));
    var selIds = Object.keys(sel).filter(function (k) { return sel[k] && rows.some(function (r) { return r.id === k; }); });

    var head = el('div.filterbar', {}, [
      searchBox(),
      el('select.select', { style: { maxWidth: '180px' }, onchange: function (e) { f.segment = e.target.value; rerender(); } }, segments.map(function (sg) { var o = el('option', { value: sg, text: sg === 'all' ? 'All segments' : sg }); if (sg === f.segment) o.selected = true; return o; })),
      el('div.chips', {}, [chip('all', 'All'), chip('consented', 'Consented'), chip('suppressed', 'Suppressed'), chip('nosource', 'Missing source'), chip('stale', 'Stale'), chip('dup', 'Dup-risk')]),
      f.campaign ? el('div.fchip.active', { onclick: function () { f.campaign = null; router.go('/wf006/contacts'); } }, 'Campaign: ' + f.campaign + ' ✕') : null,
      f.source ? el('div.fchip.active', { onclick: function () { f.source = null; router.go('/wf006/contacts'); } }, 'Source: ' + store.source(f.source).label + ' ✕') : null,
      el('div.grow'),
      el('button.btn', { onclick: function () { exportContacts(rows); } }, [el('span.ico', { text: '⬇' }), 'Export CSV']),
      el('a.btn.btn-primary', { href: '#/wf006/intake' }, [el('span.ico', { text: '📥' }), 'Import'])
    ]);

    var bulkBar = selIds.length ? el('div.note.note-info.mb-12', {}, [el('span.ni', { text: '☑' }), el('div.row-between', { style: { flex: 1, alignItems: 'center', flexWrap: 'wrap', gap: '8px' } }, [
      el('b', { text: selIds.length + ' selected' }),
      el('div.row.gap-6', {}, [
        el('button.btn.btn-sm', { onclick: function () { bulkAssign(selIds); } }, 'Assign owner'),
        el('button.btn.btn-sm', { onclick: function () { bulkSuppress(selIds); } }, 'Suppress'),
        el('button.btn.btn-sm', { onclick: function () { bulkSegment(selIds); } }, 'Set segment'),
        el('button.btn.btn-sm', { onclick: function () { exportContacts(rows.filter(function (r) { return sel[r.id]; })); } }, 'Export selected'),
        el('button.btn.btn-sm.btn-ghost', { onclick: function () { sel = {}; rerender(); } }, 'Clear')
      ])
    ])]) : null;

    var allChecked = rows.length && rows.every(function (r) { return sel[r.id]; });
    var headChk = ui.checkbox(allChecked, function (v) { rows.forEach(function (r) { sel[r.id] = v; }); rerender(); });

    var table = ui.table({
      sortable: true, pageSize: 25,
      onRow: function (c) { router.go('/wf006/contact/' + c.id); },
      columns: [
        { label: '', render: function (c) { return ui.checkbox(!!sel[c.id], function (v) { sel[c.id] = v; }); } },
        { label: 'Contact', key: 'name', sortVal: function (c) { return c.name; }, render: function (c) { return ui.personCell(c.name, c.id, c.id); } },
        { label: 'Mobile', render: function (c) { return el('span.t-mono.t-sm', { text: c.mobile }); } },
        { label: 'City', key: 'city' },
        { label: 'Segment', sortVal: function (c) { return c.segment; }, render: function (c) { return ui.badge(c.segment, segColor(c.segment)); } },
        { label: 'Source', sortVal: function (c) { return c.source || 'zzz'; }, render: function (c) { var sr = store.source(c.source); return c.source ? el('span.t-sm', { text: sr.icon + ' ' + sr.label }) : ui.badge('missing', 'red', true); } },
        { label: 'Consent', render: function (c) { return ui.consentBadges(c.consent); } },
        { label: 'DQ', num: true, sortVal: function (c) { return c.dqScore; }, render: function (c) { return el('span.t-semi', { text: c.dqScore, style: { color: c.dqScore >= 85 ? 'var(--green-600)' : c.dqScore >= 65 ? 'var(--amber-600)' : 'var(--red-600)' } }); } },
        { label: 'IDs', render: function (c) { return el('div.row.gap-4', {}, [c.donorId ? ui.badge('Donor', 'saffron') : null, c.yatriId ? ui.badge('Yatri', 'teal') : null].filter(Boolean)); } }
      ],
      rows: rows
    });
    // replace header checkbox cell label
    var th0 = table.querySelector('thead th'); if (th0) { U.clear(th0); th0.appendChild(headChk); }

    return el('div', {}, [
      ui.pageHead('Master Contacts', 'The single deduplicated, source-tagged, consent-aware identity spine (WF-006). Every record carries a <b>Contact_ID</b>. Select rows for bulk actions; click a column header to sort.', [
        ui.badge(all.length + ' contacts', 'neutral'),
        ui.badge(store.scoped(s.donors).length + ' donors', 'saffron')
      ]),
      head,
      bulkBar,
      ui.card({ pad: false, body: [table] }),
      el('div.t-xs.t-mut3.mt-8', { text: 'Showing ' + rows.length + ' of ' + all.length + '.' })
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

  function bulkAssign(ids) {
    var ownerId = store.get().users[0].id;
    ui.modal({ title: 'Assign owner', subtitle: ids.length + ' contacts',
      body: el('div.field', {}, [el('label', { text: 'Owner' }), el('select.select', { onchange: function (e) { ownerId = e.target.value; } }, store.get().users.map(function (u) { return el('option', { value: u.id, text: u.name + ' · ' + store.roleLabel(u.role) }); }))]),
      actions: [{ label: 'Cancel' }, { label: 'Assign', variant: 'primary', onClick: function () { store.actions.bulkUpdateContacts(ids, { ownerId: ownerId }); sel = {}; ui.toast({ kind: 'success', msg: ids.length + ' contacts reassigned.' }); } }] });
  }
  function bulkSuppress(ids) {
    ui.confirm({ title: 'Suppress ' + ids.length + ' contacts?', message: 'Sets DND and removes them from outreach. Logged for compliance.', variant: 'danger', confirmLabel: 'Suppress', onConfirm: function () { ids.forEach(function (id) { store.actions.toggleConsent(id, 'dnd', true); }); sel = {}; ui.toast({ kind: 'success', msg: ids.length + ' suppressed.' }); } });
  }
  function bulkSegment(ids) {
    var seg = 'Active Donor';
    ui.modal({ title: 'Set segment', subtitle: ids.length + ' contacts',
      body: el('div.field', {}, [el('label', { text: 'Segment' }), el('select.select', { onchange: function (e) { seg = e.target.value; } }, ['Yatra Prospect', 'Active Donor', 'HNI Donor', 'CSR / Corporate', 'Festival Attendee', 'Lapsed Donor', 'New Lead', 'Life Patron'].map(function (o) { return el('option', { text: o }); }))]),
      actions: [{ label: 'Cancel' }, { label: 'Apply', variant: 'primary', onClick: function () { store.actions.bulkUpdateContacts(ids, { segment: seg }); sel = {}; ui.toast({ kind: 'success', msg: 'Segment applied to ' + ids.length + '.' }); } }] });
  }
  function exportContacts(rows) {
    var hasDonor = rows.some(function (c) { return c.donorId; });
    // governance gate: donor-sensitive or large bulk export needs privacy approval
    var gate = store.actions.requestExport('Contacts export', rows.length, hasDonor);
    if (!gate.approved) {
      ui.toast({ kind: 'warn', title: 'Export sent for approval', msg: rows.length + ' records' + (hasDonor ? ' (donor-sensitive)' : '') + ' — privacy custodian must approve before download.' });
      return;
    }
    var csv = U.toCSV(rows.map(function (c) { return { Contact_ID: c.id, name: c.name, mobile: c.mobile, email: c.email, city: c.city, segment: c.segment, source: c.source || '', dnd: c.consent.dnd, dqScore: c.dqScore }; }));
    var ok = U.download('contacts_export.csv', csv);
    ui.toast({ kind: ok ? 'success' : 'info', title: ok ? 'Exported' : 'Export logged', msg: rows.length + ' records · logged in audit trail.' });
  }

  return { render: render, title: 'Master Contacts' };
})();
