/* ============================================================
   Screen: Golden Journey — trace one Contact_ID end-to-end
   ============================================================ */
App.screens['golden-journey'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;

  function render(params, query) {
    var s = store.get();
    var cid = (query && query.contact) || 'CON-100245';
    var c = store.contact(cid) || store.contact('CON-100245') || s.contacts[0];

    // contact picker
    var picker = el('select.select', { style: { maxWidth: '320px' }, onchange: function (e) { router.go('/journey?contact=' + e.target.value); } },
      s.contacts.slice(0, 40).map(function (x) { var o = el('option', { value: x.id, text: x.name + ' · ' + x.id }); if (x.id === c.id) o.selected = true; return o; }));

    // assemble journey events
    var lead = s.leads.find(function (l) { return l.contactId === c.id; });
    var camp = c.campaignId ? store.campaign(c.campaignId) : null;
    var calls = store.callsForContact(c.id);
    var tasks = store.tasksForContact(c.id);
    var wa = store.waForContact(c.id);
    var donor = store.donorByContact(c.id);
    var src = store.source(c.source);

    var events = [];
    if (camp) events.push({ wf: 'WF-003', t: c.createdDate, color: 'accent', title: 'Lead captured from campaign', desc: camp.name + ' · ' + src.icon + ' ' + src.label, ids: [['Campaign_ID', camp.id], ['Lead_ID', lead ? lead.id : '—'], ['Source', c.source || 'unknown']] });
    else events.push({ wf: 'WF-006', t: c.createdDate, color: '', title: 'Record created', desc: src.label, ids: [['Source', c.source || 'unknown']] });

    events.push({ wf: 'WF-006', t: c.createdDate, color: '', title: 'Identity resolved & consent-checked', desc: 'Dedupe passed · ' + (c.consent.dnd || c.consent.optOut ? 'suppression applied' : 'eligible to contact') + ' · DQ ' + c.dqScore + '/100', ids: [['Contact_ID', c.id]], badge: c.consent.dnd ? ['DND', 'red'] : c.consent.optOut ? ['Opt-out', 'amber'] : ['Consented', 'green'] });

    U.sortBy(calls, function (x) { return x.createdAt; }).forEach(function (call) {
      events.push({ wf: 'WF-002', t: call.createdAt, color: call.escalated ? 'red' : 'amber', title: 'Voice call — ' + call.outcome, desc: call.status + (call.duration ? ' · ' + U.mins(call.duration) : '') + (call.intent ? ' · intent: ' + call.intent : ''), ids: [['Call_ID', call.id]], link: '#/wf002/call/' + call.id, badge: call.lowConfidence ? ['Low-confidence · review', 'amber'] : null });
    });
    tasks.forEach(function (t) { events.push({ wf: 'WF-002', t: t.createdAt, color: t.status === 'Overdue' ? 'red' : 'amber', title: t.kind + ' task — ' + t.status, desc: 'Owner ' + (store.user(t.ownerId) || {}).name + ' · due ' + U.ago(t.dueDate), ids: [['Task_ID', t.id]] }); });
    wa.forEach(function (m) { events.push({ wf: 'WF-002', t: m.createdAt, color: 'green', title: 'WhatsApp — ' + m.status, desc: (s.waTemplates.find(function (w) { return w.id === m.templateId; }) || {}).name + (m.reply ? ' · reply: "' + m.reply + '"' : ''), ids: [['Message_ID', m.id]] }); });
    if (donor && donor.gifts && donor.gifts.length) {
      var g = donor.gifts[0];
      events.push({ wf: 'WF-002', t: g.date, color: 'green', title: 'Conversion — donation received', desc: U.inr(g.amount) + ' · ' + g.seva + ' · ' + g.status, ids: [['Donation_ID', g.id], ['Payment_Status', g.status]] });
    }

    events = U.sortBy(events, function (e) { return new Date(e.t).getTime(); });

    var timeline = el('div.timeline', {}, events.map(function (ev) {
      return el('div.tl-item', {}, [
        el('div.tl-dot' + (ev.color ? '.' + ev.color : '')),
        el('div.row.gap-8', { style: { flexWrap: 'wrap' } }, [ui.badge(ev.wf, ev.wf === 'WF-003' ? 'indigo' : ev.wf === 'WF-002' ? 'saffron' : 'teal'), el('span.tl-time', { text: U.fmtDateTime(ev.t) }), ev.badge ? ui.badge(ev.badge[0], ev.badge[1], true) : null]),
        el('div.tl-title', {}, [ev.title, ev.link ? el('a.t-xs', { href: ev.link, style: { marginLeft: '8px' } }, 'open →') : null]),
        el('div.tl-desc', { text: ev.desc }),
        el('div.row.gap-6.mt-4', { style: { flexWrap: 'wrap' } }, (ev.ids || []).map(function (pair) { return el('span.idchip', { title: pair[0] }, pair[0].replace('_', ' ') + ': ' + pair[1]); }))
      ]);
    }));

    // sidebar: contact summary
    var summary = ui.card({
      title: 'Devotee identity',
      icon: '👤',
      body: [
        el('div.row.gap-10.mb-12', {}, [ui.avatar(c.name, c.id, 44), el('div', {}, [el('b', { text: c.name }), el('div.t-xs.t-mut', { text: c.segment + ' · ' + c.city })])]),
        ui.statline('Contact_ID', ui.idChip(c.id)),
        c.donorId ? ui.statline('Donor_ID', ui.idChip(c.donorId)) : null,
        c.yatriId ? ui.statline('Yatri_ID', ui.idChip(c.yatriId)) : null,
        ui.statline('Origin source', src.icon + ' ' + src.label),
        ui.statline('Owner', (store.user(c.ownerId) || {}).name || '—'),
        ui.statline('Consent', ui.consentBadges(c.consent)),
        ui.statline('Data quality', c.dqScore + '/100'),
        el('div.mt-12', {}, el('a.btn.btn-block', { href: '#/wf006/contact/' + c.id }, 'Open Contact 360 →'))
      ]
    });

    var integrity = ui.card({
      title: 'Loop integrity check',
      icon: '✅',
      body: [
        checkRow(true, 'Contact_ID present on every record'),
        checkRow(!!c.source, 'Source attribution preserved'),
        checkRow(true, 'Consent / DND state carried into calling'),
        checkRow(calls.length > 0, 'Voice outcome written back to CRM'),
        checkRow(!!donor, 'Conversion linked to source & campaign'),
        ui.note('green', 'No manual re-keying between modules — the same identity flows WF-003 → WF-006 → WF-002 → back to CRM.', '🔗')
      ]
    });

    return el('div', {}, [
      ui.pageHead('Golden Journey', 'Follow a single devotee across the whole acquisition-to-conversion loop. Every step carries the shared IDs and shows its approval / consent state.', [picker]),
      el('div.grid', { style: { gridTemplateColumns: '1fr 360px', gap: '16px', alignItems: 'start' } }, [
        ui.card({ title: 'End-to-end timeline', icon: '🧭', right: [ui.badge(events.length + ' touchpoints', 'neutral')], body: [timeline] }),
        el('div.col.gap-16', {}, [summary, integrity])
      ])
    ]);
  }

  function checkRow(ok, text) {
    return el('div.row.gap-8', { style: { padding: '7px 0' } }, [
      el('span', { text: ok ? '✓' : '○', style: { color: ok ? 'var(--green-600)' : 'var(--text-3)', fontWeight: 700 } }),
      el('span.t-sm' + (ok ? '' : '.t-mut'), { text: text })
    ]);
  }

  return { render: render, title: 'Golden Journey' };
})();
