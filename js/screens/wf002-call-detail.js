/* ============================================================
   Screen: WF-002 Call detail / transcript review (human override)
   ============================================================ */
App.screens['wf002-call-detail'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;

  function render(params) {
    var s = store.get();
    var call = s.calls.find(function (c) { return c.id === params.id; });
    if (!call) return ui.emptyState({ icon: '🔍', title: 'Call not found', sub: params.id });
    var contact = store.contact(call.contactId);
    var script = s.scripts.find(function (sc) { return sc.id === call.scriptId; });

    var transcript = call.transcript && call.transcript.length ? el('div', {}, call.transcript.map(function (l) {
      return el('div.transcript-line.' + (l.who === 'agent' ? 'agent' : 'contact'), { style: { color: 'var(--text)' } }, [el('div.who', { text: l.who === 'agent' ? 'AI Agent' : (contact ? contact.name.split(' ')[0] : 'Contact'), style: { color: l.who === 'agent' ? 'var(--saffron-600)' : 'var(--accent)' } }), el('div.txt', { text: l.text })]);
    })) : ui.emptyState({ icon: '🔇', title: 'No transcript', sub: call.status });

    return el('div', {}, [
      el('a.btn.btn-sm.btn-ghost.mb-12', { href: '#/wf002/console' }, '← Call Console'),
      ui.card({ body: [
        el('div.row-between', { style: { flexWrap: 'wrap', gap: '10px' } }, [
          el('div.row.gap-12', {}, [
            ui.avatar(call.contactName, call.contactId, 48),
            el('div', {}, [
              el('div.row.gap-8', {}, [el('h2', { text: call.contactName }), ui.statusBadge(call.outcome)]),
              el('div.row.gap-6.mt-4', { style: { flexWrap: 'wrap' } }, [ui.idChip(call.id), contact ? ui.idChip(contact.id, function () { router.go('/wf006/contact/' + contact.id); }) : null, call.campaignId ? ui.idChip(call.campaignId, function () { router.go('/wf003/campaign/' + call.campaignId); }) : null].filter(Boolean)),
              (function () {
                var task = s.tasks.find(function (t) { return t.callId === call.id; });
                var wa = s.whatsapp.find(function (m) { return m.contactId === call.contactId; });
                var links = [];
                if (task) links.push(el('a.t-xs', { href: '#/wf002/tasks', style: { cursor: 'pointer' } }, '📋 Callback task →'));
                if (wa) links.push(el('a.t-xs', { href: '#/wf002/whatsapp', style: { cursor: 'pointer' } }, '💬 WhatsApp follow-up →'));
                links.push(el('a.t-xs', { href: '#/journey?contact=' + call.contactId }, '🧭 Full journey →'));
                return el('div.row.gap-10.mt-6', { style: { flexWrap: 'wrap' } }, links);
              })()
            ])
          ]),
          el('div.row.gap-8', {}, [call.escalated ? ui.badge('Escalated', 'red', true) : null, call.lowConfidence ? ui.badge('Needs review', 'amber', true) : call.reviewed ? ui.badge('Reviewed', 'green', true) : null].filter(Boolean))
        ])
      ] }),
      el('div.grid.mt-16', { style: { gridTemplateColumns: '1fr 360px', gap: '16px', alignItems: 'start' } }, [
        ui.card({ title: 'Transcript & recording', icon: '🎧', right: [call.recordingRef ? el('button.btn.btn-sm', { onclick: function () { ui.toast('▶ Playing ' + call.recordingRef + ' (simulated)'); } }, '▶ Play recording') : null], body: [
          call.recordingRef ? el('div.row.gap-10.mb-12', { style: { padding: '10px', background: 'var(--surface-2)', borderRadius: '10px' } }, [el('button.btn.btn-icon.btn-sm', { onclick: function () { ui.toast('▶ (simulated)'); } }, '▶'), el('div.bar', { style: { flex: 1 } }, el('span', { style: { width: '32%' } })), el('span.t-xs.t-mut', { text: U.mins(call.duration) }), el('span.t-xs.t-mono.t-mut', { text: call.recordingRef })]) : null,
          transcript
        ] }),
        el('div.col.gap-16', {}, [
          ui.card({ title: 'AI classification', icon: '✨', body: [
            ui.aiBlock('Gemini intent model', [
              ui.statline('Outcome', ui.statusBadge(call.outcome)),
              ui.statline('Intent', call.intent || '—'),
              ui.statline('Objection', call.objection || 'None'),
              ui.statline('Lead score', el('b', { text: (call.leadScore != null ? call.leadScore + '/100' : '—') })),
              ui.statline('Confidence', el('b', { text: call.confidence != null ? Math.round(call.confidence * 100) + '%' : '—', style: { color: call.lowConfidence ? 'var(--amber-600)' : 'var(--green-600)' } }))
            ]),
            call.lowConfidence ? ui.note('amber', 'Confidence below 78% — human review required before this outcome finalizes in CRM.', '⚠') : null,
            el('div.row.gap-8.mt-12', {}, [
              el('button.btn.btn-sm.btn-primary', { onclick: function () { confirmOutcome(call); } }, '✓ Confirm'),
              el('button.btn.btn-sm', { onclick: function () { overrideOutcome(call); } }, '✎ Override')
            ])
          ] }),
          ui.card({ title: 'Call metadata', icon: '📋', body: [
            ui.statline('Status', call.status),
            ui.statline('Duration', call.duration ? U.mins(call.duration) : '—'),
            ui.statline('Attempt', '#' + call.attempt),
            ui.statline('Language', call.language),
            ui.statline('Agent', (store.user(call.ownerId) || {}).name || call.ownerId),
            ui.statline('Script', script ? script.name + ' ' + script.version : '—'),
            ui.statline('When', U.fmtDateTime(call.createdAt))
          ] }),
          ui.card({ title: 'QA scorecard', icon: '✅', body: [
            call.qa ? el('div', {}, [
              el('div.row-between.mb-8', {}, [el('div.t-2xl.t-bold', { text: call.qa.score + '/100' }), ui.badge(call.qa.score >= 85 ? 'Pass' : 'Coach', call.qa.score >= 85 ? 'green' : 'amber')]),
              call.qa.notes ? ui.note('info', '<b>Coaching:</b> ' + call.qa.notes, '🎓') : null,
              el('div.t-xs.t-mut3.mt-4', { text: 'by ' + (store.user(call.qa.by) || {}).name + ' · ' + U.ago(call.qa.ts) })
            ]) : el('div', {}, [el('div.t-sm.t-mut.mb-8', { text: 'Not yet QA-reviewed.' })]),
            el('button.btn.btn-sm.btn-block.mt-8', { onclick: function () { qaModal(call); } }, call.qa ? 'Re-score' : 'Run QA scorecard')
          ] }),
          ui.card({ title: 'Quality flag', icon: '🔁', body: [
            el('div.row.gap-8', {}, [
              el('button.btn.btn-sm.btn-success.grow', { onclick: function () { store.actions.setReview('call', call.id, 'good'); ui.toast({ kind: 'success', msg: 'Marked done.' }); } }, '👍 Done'),
              el('button.btn.btn-sm.grow', { onclick: function () { flagImprove(call); } }, '🔁 Needs improvement')
            ])
          ] }),
          call.escalated ? ui.card({ title: 'Escalation', icon: '🚨', body: [ui.note('red', 'Routed to donor relations with full context pack.', '🚨'), el('a.btn.btn-block.mt-8', { href: '#/wf002/escalations' }, 'Open escalations →')] }) : null
        ])
      ])
    ]);
  }

  function qaModal(call) {
    var dims = ['Greeting & identity', 'Script adherence', 'Objection handling', 'Compliance / consent', 'Tone & warmth'];
    var scores = {}; dims.forEach(function (d) { scores[d] = 4; }); var notes = '';
    function row(d) {
      var val = el('b', { text: '4/5', style: { width: '36px' } });
      var rng = el('input', { type: 'range', min: 1, max: 5, value: 4, style: { flex: 1 }, oninput: function (e) { scores[d] = +e.target.value; val.textContent = e.target.value + '/5'; } });
      return el('div.row.gap-10', { style: { padding: '6px 0' } }, [el('span.t-sm', { style: { width: '160px' }, text: d }), rng, val]);
    }
    ui.modal({ title: 'QA scorecard — ' + call.contactName, size: 'lg',
      body: el('div', {}, dims.map(row).concat([el('div.field.mt-12', {}, [el('label', { text: 'Coaching note' }), el('textarea.textarea', { placeholder: 'Feedback for the caller…', oninput: function (e) { notes = e.target.value; } })])])),
      actions: [{ label: 'Cancel' }, { label: 'Save QA + share', variant: 'primary', onClick: function () {
        var total = Math.round(dims.reduce(function (a, d) { return a + scores[d]; }, 0) / (dims.length * 5) * 100);
        store.actions.saveQAScore(call.id, total, notes);
        store.actions.audit('Shared QA coaching', 'data', call.ownerId, 'Call ' + call.id);
        ui.toast({ kind: 'success', msg: 'QA score ' + total + '/100 saved & shared with caller.' });
      } }] });
  }
  function flagImprove(call) {
    var note = '';
    ui.modal({ title: 'Flag for improvement', subtitle: call.contactName, body: el('div.field', {}, [el('label', { text: 'What needs improvement?' }), el('textarea.textarea', { oninput: function (e) { note = e.target.value; } })]),
      actions: [{ label: 'Cancel' }, { label: 'Flag & create rework', variant: 'primary', onClick: function () { store.actions.setReview('call', call.id, 'needs_improvement', note); ui.toast({ kind: 'warn', msg: 'Flagged → rework queue + caller notified.' }); } }] });
  }

  function confirmOutcome(call) { store.actions.reviewCall(call.id, {}); ui.toast({ kind: 'success', msg: 'Outcome confirmed & finalized in CRM.' }); }
  function overrideOutcome(call) {
    var outcomes = ['Donated', 'Interested', 'Callback', 'Not interested', 'Escalate', 'No answer'];
    var sel = call.outcome;
    ui.modal({
      title: 'Override AI outcome', subtitle: call.contactName,
      body: el('div', {}, [
        ui.note('info', 'Human override is always logged. Use this when the AI misclassified the call.'),
        el('div.field.mt-12', {}, [el('label', { text: 'Corrected outcome' }), el('select.select', { onchange: function (e) { sel = e.target.value; } }, outcomes.map(function (o) { var op = el('option', { value: o, text: o }); if (o === call.outcome) op.selected = true; return op; }))])
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Save override', variant: 'primary', onClick: function () { store.actions.reviewCall(call.id, { outcome: sel, intent: sel, lowConfidence: false }); ui.toast({ kind: 'success', msg: 'Override saved & logged.' }); } }]
    });
  }

  return { render: render, title: 'Call review' };
})();
