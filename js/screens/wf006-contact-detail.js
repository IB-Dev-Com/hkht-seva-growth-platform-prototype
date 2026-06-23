/* ============================================================
   Screen: WF-006 Contact 360 detail
   ============================================================ */
App.screens['wf006-contact-detail'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;
  var tab = 'timeline';

  function render(params) {
    var c = store.contact(params.id);
    if (!c) return ui.emptyState({ icon: '🔍', title: 'Contact not found', sub: params.id });
    var s = store.get();
    var donor = store.donorByContact(c.id);
    var yatri = store.yatriByContact(c.id);
    var calls = U.sortBy(store.callsForContact(c.id), function (x) { return x.createdAt; }, 'desc');
    var tasks = store.tasksForContact(c.id);
    var wa = store.waForContact(c.id);
    var camp = c.campaignId ? store.campaign(c.campaignId) : null;
    var src = store.source(c.source);

    /* header card */
    var header = ui.card({
      body: [
        el('div.row.gap-16', { style: { flexWrap: 'wrap' } }, [
          ui.avatar(c.name, c.id, 58),
          el('div', { style: { minWidth: 0 } }, [
            el('div.row.gap-8', { style: { flexWrap: 'wrap' } }, [el('h2', { text: c.name }), ui.badge(c.segment, 'saffron'), c.consent.dnd ? ui.badge('DND', 'red', true) : null, c.consent.optOut ? ui.badge('Opt-out', 'amber', true) : null]),
            el('div.row.gap-12.mt-4.t-sm.t-mut', { style: { flexWrap: 'wrap' } }, [el('span', { text: '📱 ' + c.mobile }), c.email ? el('span', { text: '✉ ' + c.email }) : null, el('span', { text: '📍 ' + c.city }), el('span', { text: '🗣 ' + c.language })]),
            el('div.row.gap-6.mt-8', { style: { flexWrap: 'wrap' } }, [ui.idChip(c.id), c.donorId ? ui.idChip(c.donorId) : null, c.yatriId ? ui.idChip(c.yatriId) : null, camp ? ui.idChip(camp.id, function () { router.go('/wf003/campaign/' + camp.id); }) : null].filter(Boolean))
          ]),
          el('div.col.gap-8', { style: { marginLeft: 'auto', alignItems: 'flex-end' } }, [
            el('div.ring-stat', { style: { '--p': c.dqScore } }, el('div.rv', { text: c.dqScore })),
            el('div.t-xs.t-mut', { text: 'Data quality' })
          ])
        ]),
        el('div.row.gap-8.mt-16', { style: { flexWrap: 'wrap' } }, [
          el('a.btn.btn-primary', { href: '#/journey?contact=' + c.id }, [el('span.ico', { text: '🧭' }), 'Golden Journey']),
          el('button.btn', { onclick: function () { startCall(c); } }, [el('span.ico', { text: '📞' }), 'Queue call']),
          el('button.btn', { onclick: function () { sendWA(c); } }, [el('span.ico', { text: '💬' }), 'WhatsApp']),
          el('button.btn', { onclick: function () { consentModal(c); } }, [el('span.ico', { text: '🛡️' }), 'Consent']),
          el('div.grow'),
          el('div.t-xs.t-mut3', { text: 'Owner: ' + ((store.user(c.ownerId) || {}).name || '—') })
        ])
      ]
    });

    /* tabs */
    var tabsBar = ui.tabs([
      { id: 'timeline', label: 'Relationship timeline', icon: '🕐', count: calls.length + tasks.length + wa.length },
      { id: 'donor', label: 'Donor profile', icon: '🪔', count: donor ? donor.gifts.length : 0 },
      { id: 'yatra', label: 'Yatra', icon: '🛕' },
      { id: 'data', label: 'Record & governance', icon: '🗂️' }
    ], tab, function (t) { tab = t; store.emit(); });

    var body;
    if (tab === 'timeline') body = timelineTab(c, calls, tasks, wa, camp, src);
    else if (tab === 'donor') body = donorTab(donor);
    else if (tab === 'yatra') body = yatraTab(yatri);
    else body = dataTab(c, src, camp);

    return el('div', {}, [
      el('a.btn.btn-sm.btn-ghost.mb-12', { href: '#/wf006/contacts' }, '← Contacts'),
      header,
      el('div.mt-16', {}, tabsBar),
      body
    ]);
  }

  function timelineTab(c, calls, tasks, wa, camp, src) {
    var events = [];
    events.push({ t: c.createdDate, color: 'accent', icon: '✨', title: 'Record created', desc: 'Source: ' + src.label + (camp ? ' · ' + camp.name : '') });
    calls.forEach(function (call) { events.push({ t: call.createdAt, color: call.escalated ? 'red' : 'amber', icon: '📞', title: 'Call — ' + call.outcome, desc: call.status + (call.intent ? ' · ' + call.intent : ''), link: '#/wf002/call/' + call.id }); });
    wa.forEach(function (m) { events.push({ t: m.createdAt, color: 'green', icon: '💬', title: 'WhatsApp — ' + m.status, desc: m.reply ? 'Reply: ' + m.reply : (App.store.get().waTemplates.find(function (w) { return w.id === m.templateId; }) || {}).name }); });
    tasks.forEach(function (t) { events.push({ t: t.createdAt, color: t.status === 'Overdue' ? 'red' : 'amber', icon: '📋', title: t.kind + ' — ' + t.status, desc: 'Due ' + U.fmtDateTime(t.dueDate) + ' · ' + (store.user(t.ownerId) || {}).name }); });
    events = U.sortBy(events, function (e) { return new Date(e.t).getTime(); }, 'desc');

    return el('div.grid', { style: { gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' } }, [
      ui.card({ title: 'Touchpoint timeline', icon: '🕐', body: [el('div.timeline', {}, events.map(function (ev) {
        return el('div.tl-item', {}, [
          el('div.tl-dot' + (ev.color ? '.' + ev.color : ''), { style: { fontSize: '8px' } }, ev.icon),
          el('div.tl-time', { text: U.fmtDateTime(ev.t) + ' · ' + U.ago(ev.t) }),
          el('div.tl-title', {}, [ev.title, ev.link ? el('a.t-xs', { href: ev.link, style: { marginLeft: '6px' } }, 'open →') : null]),
          el('div.tl-desc', { text: ev.desc })
        ]);
      }))] }),
      ui.card({ title: 'Next best action', icon: '✨', body: [
        ui.aiBlock('AI recommendation', [
          el('div.t-sm', { html: nbaFor(c) }),
          el('div.row.gap-6.mt-12', {}, [el('button.btn.btn-sm.btn-primary', { onclick: function () { startCall(c); } }, 'Act on this'), el('button.btn.btn-sm', { onclick: function () { ui.toast('Snoozed 3 days'); } }, 'Snooze')])
        ]),
        el('div.mt-12', {}, ui.statline('Last touch', U.ago(c.lastTouch))),
        ui.statline('Lifetime touches', calls.length + wa.length + tasks.length),
        ui.statline('Engagement', ui.badge(calls.length > 1 ? 'Warm' : 'New', calls.length > 1 ? 'green' : 'blue'))
      ] })
    ]);
  }
  function nbaFor(c) {
    var d = store.donorByContact(c.id);
    if (d && d.tier === 'HNI') return 'High-value donor (' + U.inr(d.totalGiven, { compact: true }) + ' lifetime). Recommend a <b>personal call from the donor relationship owner</b> — not an automated touch. Suggested ask: Yatra sponsorship.';
    if (c.campaignId && store.callsForContact(c.id).length === 0) return 'Fresh campaign lead with no contact yet. Recommend <b>first voice call within SLA</b> using the approved script, then WhatsApp the brochure.';
    return 'Recommend a <b>follow-up WhatsApp</b> with the festival invitation and a soft callback in 3 days.';
  }

  function donorTab(donor) {
    if (!donor) return ui.card({ body: [ui.emptyState({ icon: '🪔', title: 'Not a donor yet', sub: 'No donation history on this contact.' })] });
    var max = Math.max.apply(null, donor.gifts.map(function (g) { return g.amount; }).concat([1]));
    return el('div.grid', { style: { gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' } }, [
      ui.card({ title: 'Donation history', icon: '🪔', right: [ui.badge(donor.tier, donor.tier === 'HNI' ? 'saffron' : donor.tier === 'CSR' ? 'violet' : 'green')], body: [
        el('div.row-between.mb-12', {}, [el('div', {}, [el('div.t-xs.t-mut', { text: 'Lifetime giving' }), el('div.t-2xl.t-bold', { text: U.inr(donor.totalGiven, { compact: true }) })]), el('div.t-right', {}, [el('div.t-xs.t-mut', { text: 'Gifts' }), el('div.t-2xl.t-bold', { text: donor.gifts.length })])]),
        ui.table({ compact: true, columns: [
          { label: 'Date', render: function (g) { return U.fmtDate(g.date); } },
          { label: 'Seva', key: 'seva' },
          { label: 'Amount', num: true, render: function (g) { return el('b', { text: U.inr(g.amount) }); } },
          { label: 'Receipt', render: function (g) { return ui.badge(g.status, g.status === 'Receipted' ? 'green' : 'amber'); } }
        ], rows: U.sortBy(donor.gifts, function (g) { return g.date; }, 'desc') })
      ] }),
      ui.card({ title: 'Donor intelligence', icon: '🤝', body: [
        ui.statline('Tier', ui.badge(donor.tier, 'saffron')),
        ui.statline('Relationship owner', (store.user(donor.relationshipOwner) || {}).name || '—'),
        ui.statline('Seva interests', donor.sevaInterests.join(', ')),
        ui.statline('Last gift', U.fmtDate(donor.lastGift)),
        donor.tier === 'HNI' || donor.tier === 'CSR' ? ui.note('amber', '<b>High-value donor.</b> All merges, sensitive messages and financial actions require human approval (donor approver).', '🛡️') : null
      ] })
    ]);
  }

  function yatraTab(yatri) {
    if (!yatri) return ui.card({ body: [ui.emptyState({ icon: '🛕', title: 'No Yatra interest recorded' })] });
    return ui.card({ title: 'Yatra profile', icon: '🛕', body: [
      ui.statline('Yatra interest', yatri.yatra),
      ui.statline('Registration', ui.badge(yatri.registration, yatri.registration === 'Paid' ? 'green' : yatri.registration === 'Registered' ? 'blue' : 'amber')),
      ui.statline('Payment status', ui.badge(yatri.paymentStatus, yatri.paymentStatus === 'Paid' ? 'green' : 'amber')),
      ui.statline('Referrals brought', yatri.referrals)
    ] });
  }

  function dataTab(c, src, camp) {
    var s = store.get();
    var audits = s.audit.filter(function (a) { return a.entityId === c.id || a.entityId === c.donorId; });
    return el('div.grid', { style: { gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' } }, [
      ui.card({ title: 'Record fields (ERP-ready)', icon: '🗂️', body: [
        ui.statline('Contact_ID', ui.idChip(c.id)),
        ui.statline('Source / Source date', (src.label) + ' · ' + U.fmtDate(c.createdDate)),
        ui.statline('Last meaningful source', store.source(c.lastSource).label),
        ui.statline('Campaign_ID', camp ? ui.idChip(camp.id) : '—'),
        ui.statline('Owner_ID', (store.user(c.ownerId) || {}).name),
        ui.statline('Center', (store.center(c.centerId) || {}).name),
        ui.statline('Created date', U.fmtDate(c.createdDate)),
        ui.statline('Duplicate risk', ui.badge(c.dupRisk + '%', c.dupRisk > 50 ? 'red' : 'green')),
        ui.statline('Consent / DND', ui.consentBadges(c.consent))
      ] }),
      ui.card({ title: 'Audit & access log', icon: '🔒', body: audits.length ? audits.map(function (a) {
        return el('div', { style: { padding: '8px 0', borderBottom: '1px solid var(--border)' } }, [
          el('div.row.gap-8', {}, [ui.badge(a.type, a.type === 'export' ? 'amber' : a.type === 'access' ? 'violet' : 'neutral'), el('span.t-xs.t-mut', { text: U.ago(a.timestamp) })]),
          el('div.t-sm.mt-4', { text: a.action + ' — ' + a.detail }),
          el('div.t-xs.t-mut3', { text: 'by ' + (store.user(a.actorId) || {}).name })
        ]);
      }) : [ui.emptyState({ icon: '🔒', title: 'No access events', sub: 'PII access and exports for this record will appear here.' })] })
    ]);
  }

  /* actions */
  function startCall(c) {
    if (c.consent.dnd) { ui.toast({ kind: 'error', title: 'Blocked by DND', msg: 'This contact is on DND. Calling is suppressed (consent gate).' }); return; }
    ui.toast({ kind: 'info', title: 'Added to call queue', msg: c.name + ' queued for the approved campaign script.' });
    router.go('/wf002/console');
  }
  function sendWA(c) {
    if (c.consent.optOut) { ui.toast({ kind: 'error', title: 'Blocked', msg: 'Contact opted out of WhatsApp.' }); return; }
    var s = store.get();
    var sel = 'WA-PAYLINK';
    ui.modal({
      title: 'Send WhatsApp follow-up', subtitle: c.name + ' · approved templates only',
      body: el('div', {}, [
        ui.note('info', 'Only <b>approved templates</b> can be sent in production. Donor-sensitive custom messages require approval.'),
        el('div.mt-12', {}, s.waTemplates.filter(function (t) { return t.status === 'approved'; }).map(function (t) {
          var r = el('label.row.gap-8', { style: { padding: '10px', border: '1px solid var(--border)', borderRadius: '9px', marginBottom: '8px', cursor: 'pointer' } }, [
            el('input', { type: 'radio', name: 'watmpl', value: t.id, checked: t.id === sel ? true : null, onchange: function () { sel = t.id; } }),
            el('div', {}, [el('b.t-sm', { text: t.name }), el('div.t-xs.t-mut', { text: t.body })])
          ]);
          return r;
        }))
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Send', variant: 'primary', onClick: function () { store.actions.sendWhatsApp(c.id, sel); ui.toast({ kind: 'success', title: 'WhatsApp sent (simulated)', msg: 'Logged to relationship timeline.' }); } }]
    });
  }
  function consentModal(c) {
    var draft = U.clone(c.consent);
    ui.modal({
      title: 'Consent & channel permissions', subtitle: c.name,
      body: el('div', {}, [
        toggleRow('DND (no voice calls)', draft.dnd, function (v) { draft.dnd = v; }),
        toggleRow('Opted out of WhatsApp', draft.optOut, function (v) { draft.optOut = v; }),
        el('div.t-up.mt-12.mb-8', { text: 'Channel permissions' }),
        toggleRow('📞 Voice', draft.channels.call, function (v) { draft.channels.call = v; }),
        toggleRow('💬 WhatsApp', draft.channels.whatsapp, function (v) { draft.channels.whatsapp = v; }),
        toggleRow('📩 SMS', draft.channels.sms, function (v) { draft.channels.sms = v; }),
        toggleRow('✉ Email', draft.channels.email, function (v) { draft.channels.email = v; })
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Save consent', variant: 'primary', onClick: function () {
        c.consent = draft; store.actions.toggleConsent(c.id, 'dnd', draft.dnd); store.commit();
        ui.toast({ kind: 'success', msg: 'Consent updated & logged to audit trail.' });
      } }]
    });
  }
  function toggleRow(label, on, cb) {
    return el('div.row-between', { style: { padding: '8px 0' } }, [el('span.t-sm', { text: label }), ui.switchToggle(on, cb)]);
  }

  return { render: render, title: function (p) { var c = store.contact(p.id); return c ? c.name : 'Contact'; } };
})();
