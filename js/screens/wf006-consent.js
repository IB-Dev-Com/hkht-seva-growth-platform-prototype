/* ============================================================
   Screen: WF-006 Consent / DND & Suppression Governance
   ============================================================ */
App.screens['wf006-consent'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;

  function render() {
    var s = store.get();
    var sup = s.suppression;
    var byType = U.group(sup, 'type');

    return el('div', {}, [
      ui.pageHead('Consent & DND Suppression Governance', 'Prevents wrong, non-consented or opted-out outreach <b>before any call or send</b>. Suppression-list enforcement is the gate every campaign and call queue passes through.', [
        el('button.btn', { onclick: simulateScrub }, [el('span.ico', { text: '🔄' }), 'Run DND scrub']),
        el('button.btn.btn-primary', { onclick: addSuppression }, [el('span.ico', { text: '＋' }), 'Add suppression'])
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '🛡️', label: 'Total suppressed', value: sup.length, accent: 'red' }),
        ui.kpi({ icon: '📵', label: 'DND registered', value: (byType['DND'] || []).length, accent: 'red' }),
        ui.kpi({ icon: '🚫', label: 'Opt-outs', value: (byType['Opt-out'] || []).length, accent: 'amber' }),
        ui.kpi({ icon: '✓', label: 'Suppression accuracy', value: '99.4%', accent: 'green', sub: '0 wrong-contact incidents' })
      ]),
      el('div.grid', { style: { gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' } }, [
        ui.card({ title: 'Suppression list', icon: '🛡️', right: [ui.badge(sup.length + ' entries', 'neutral')], body: [
          ui.table({ columns: [
            { label: 'Contact', render: function (r) { return ui.personCell(r.name, r.contactId, r.contactId); } },
            { label: 'Mobile', render: function (r) { return el('span.t-mono.t-sm', { text: r.mobile }); } },
            { label: 'Type', render: function (r) { return ui.badge(r.type, r.type === 'DND' ? 'red' : 'amber', true); } },
            { label: 'Channel', key: 'channel' },
            { label: 'Reason', render: function (r) { return el('span.t-sm.t-mut', { text: r.reason }); } },
            { label: 'Added', render: function (r) { return U.ago(r.date); } }
          ], rows: U.sortBy(sup, function (r) { return r.date; }, 'desc'), empty: { icon: '🛡️', title: 'No suppressions' } })
        ] }),
        el('div.col.gap-16', {}, [
          ui.card({ title: 'Pre-send eligibility gate', icon: '🚦', body: [
            ui.note('info', 'Every call queue and campaign send is scrubbed against this list. Suppressed contacts are <b>never</b> contacted.', '🚦'),
            el('div.mt-8', {}, [
              ui.statline('DND scrub', ui.badge('Auto · pre-batch', 'green')),
              ui.statline('Opt-out (STOP) capture', ui.badge('Real-time', 'green')),
              ui.statline('Channel-permission check', ui.badge('Per channel', 'green')),
              ui.statline('TRAI / DLT readiness', ui.badge('Pending DLT', 'amber'))
            ])
          ] }),
          ui.card({ title: 'Consent basis & freshness', icon: '🧾', body: [
            ui.note('info', 'Every consent records its <b>basis</b> (how captured), evidence reference and an expiry for re-consent — provable lineage if challenged.', '🧾'),
            el('div.mt-8', {}, [
              ui.statline('Form / web opt-in', ui.badge(Math.round(s.contacts.length * 0.42) + ' contacts', 'green')),
              ui.statline('Verbal (call-recorded)', ui.badge(Math.round(s.contacts.length * 0.28) + ' contacts', 'green')),
              ui.statline('Event / Sankalpa card', ui.badge(Math.round(s.contacts.length * 0.18) + ' contacts', 'blue')),
              ui.statline('Basis unknown (review)', ui.badge(Math.round(s.contacts.length * 0.12) + ' contacts', 'amber')),
              ui.statline('Expiring in 30 days', ui.badge(Math.round(s.contacts.length * 0.06) + ' — re-consent', 'amber'))
            ])
          ] }),
          ui.card({ title: 'Policy changes', icon: '📝', body: [
            ui.note('amber', 'Changes to suppression policy require <b>consent custodian approval</b> and are logged.', '🛡️'),
            el('div.t-xs.t-mut3.mt-8', { text: 'Custodian: ' + (store.user('U-VENKAT') || {}).name })
          ] })
        ])
      ])
    ]);
  }

  function simulateScrub() {
    ui.toast({ kind: 'info', title: 'Scrubbing…', msg: 'Checking against national DND + internal suppression.' });
    setTimeout(function () { ui.toast({ kind: 'success', title: 'Scrub complete', msg: store.get().suppression.length + ' contacts blocked from next batch. 0 ambiguous.' }); }, 1100);
  }
  function addSuppression() {
    var s = store.get();
    var sel = s.contacts.find(function (c) { return !c.consent.dnd; });
    var cid = sel ? sel.id : s.contacts[0].id;
    var type = 'DND', reason = 'Requested no contact';
    ui.modal({
      title: 'Add suppression', subtitle: 'Block a contact from outreach',
      body: el('div', {}, [
        field('Contact', el('select.select', { onchange: function (e) { cid = e.target.value; } }, s.contacts.slice(0, 40).map(function (c) { var o = el('option', { value: c.id, text: c.name + ' · ' + c.mobile }); if (c.id === cid) o.selected = true; return o; }))),
        field('Type', el('select.select', { onchange: function (e) { type = e.target.value; } }, ['DND', 'Opt-out', 'Not interested', 'Unsubscribed'].map(function (t) { return el('option', { value: t, text: t }); }))),
        field('Reason', el('input.input', { value: reason, oninput: function (e) { reason = e.target.value; } }))
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Add & enforce', variant: 'primary', onClick: function () { store.actions.addSuppression(cid, type, reason); ui.toast({ kind: 'success', msg: 'Suppression added — enforced on next batch.' }); } }]
    });
  }
  function field(label, input) { return el('div.field', {}, [el('label', { text: label }), input]); }

  return { render: render, title: 'Consent & DND' };
})();
