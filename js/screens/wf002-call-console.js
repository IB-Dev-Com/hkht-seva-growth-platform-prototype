/* ============================================================
   Screen: WF-002 Voice Call Console (live simulated calling)
   ============================================================ */
App.screens['wf002-call-console'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;
  var running = false, skipped = {}, bumped = {}, paused = false, qfilter = '';

  function render() {
    var s = store.get();
    var queue = store.scoped(s.contacts).filter(function (c) {
      return c.campaignId && c.consent.channels.call && !c.consent.dnd && !skipped[c.id];
    });
    queue = U.sortBy(queue, function (c) { return (bumped[c.id] ? 1000 : 0) + (store.donorByContact(c.id) ? 1 : 0) * 100 + c.dqScore; }, 'desc');

    var recent = U.sortBy(s.calls, function (c) { return c.createdAt; }, 'desc').slice(0, 8);

    return el('div', {}, [
      ui.pageHead('Voice Call Console', 'The conversion engine — automated dialling, approved-script delivery, live transcript and AI capture, <b>or human manual dial + disposition</b>. Sensitive responses escalate to a human.', [
        ui.badge(queue.length + ' in queue', 'indigo'),
        el('button.btn', { onclick: function () { paused = !paused; store.emit(); ui.toast({ kind: 'info', msg: paused ? 'Auto-dialer paused' : 'Auto-dialer resumed' }); } }, [el('span.ico', { text: paused ? '▶' : '⏸' }), paused ? 'Resume' : 'Pause']),
        el('button.btn.btn-primary', { disabled: paused ? true : null, onclick: function () { startBatch(queue); } }, [el('span.ico', { text: '🎙️' }), 'Auto-dial next'])
      ]),
      el('div.grid', { style: { gridTemplateColumns: '1fr 360px', gap: '16px', alignItems: 'start' } }, [
        el('div.col.gap-16', {}, [
          el('div#call-stage', {}, idleStage(queue)),
          ui.card({ title: 'Recent call outcomes', icon: '📞', right: [el('a.btn.btn-sm', { href: '#/wf002/dashboard' }, 'Dashboard')], body: [
            ui.table({ compact: true, onRow: function (c) { router.go('/wf002/call/' + c.id); }, columns: [
              { label: 'Contact', render: function (c) { return ui.personCell(c.contactName, c.id, c.contactId); } },
              { label: 'Outcome', render: function (c) { return ui.statusBadge(c.outcome); } },
              { label: 'Intent', render: function (c) { return c.intent ? el('span.t-sm', { text: c.intent }) : '—'; } },
              { label: 'Conf.', num: true, render: function (c) { return c.confidence != null ? el('span', { text: Math.round(c.confidence * 100) + '%', style: { color: c.lowConfidence ? 'var(--amber-600)' : 'var(--text-2)', fontWeight: 600 } }) : '—'; } },
              { label: 'Flags', render: function (c) { return el('div.row.gap-4', {}, [c.escalated ? ui.badge('Escalated', 'red') : null, c.lowConfidence ? ui.badge('Review', 'amber') : null].filter(Boolean)); } },
              { label: 'When', render: function (c) { return U.ago(c.createdAt); } }
            ], rows: recent })
          ] })
        ]),
        el('div.col.gap-16', {}, [
          ui.card({ title: 'Call queue', icon: '📋', right: [el('button.btn.btn-sm.btn-ghost', { onclick: function () { skipped = {}; bumped = {}; store.emit(); } }, 'Reset'), ui.badge(queue.length, 'neutral')], body: [
            el('div.search-box.mb-8', {}, [el('span.ico', { text: '🔍' }), (function () { var i = el('input.input', { placeholder: 'Search to dial…' }); i.addEventListener('input', U.debounce(function (e) { qfilter = e.target.value.toLowerCase(); store.emit(); }, 200)); i.value = qfilter; return i; })()]),
            el('div.col.gap-6', { style: { maxHeight: '380px', overflowY: 'auto' } }, queue.filter(function (c) { return !qfilter || (c.name + c.mobile).toLowerCase().indexOf(qfilter) > -1; }).slice(0, 16).map(function (c, i) {
              var d = store.donorByContact(c.id);
              return el('div.row.gap-8', { style: { padding: '8px', borderRadius: '8px', background: i === 0 ? 'var(--accent-soft)' : 'transparent' } }, [
                el('span.t-xs.t-mut3', { text: '#' + (i + 1) }),
                ui.avatar(c.name, c.id, 28),
                el('a', { href: '#/wf006/contact/' + c.id, style: { flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' } }, [el('b.t-sm.truncate', { text: c.name }), el('div.t-xs.t-mut', { text: (store.campaign(c.campaignId) || {}).type + ' · ' + c.language })]),
                d ? ui.badge(d.tier, 'saffron') : ui.badge('Lead', 'blue'),
                el('button.btn.btn-sm.btn-icon', { title: 'Call', onclick: function () { if (!paused) runCall(c); } }, '📞'),
                el('button.btn.btn-sm.btn-icon.btn-ghost', { title: 'Bump to top', onclick: function () { bumped[c.id] = true; store.emit(); } }, '⬆'),
                el('button.btn.btn-sm.btn-icon.btn-ghost', { title: 'Skip', onclick: function () { skipped[c.id] = true; store.emit(); } }, '⏭')
              ]);
            }))
          ] }),
          ui.card({ title: 'Voice ops controls', icon: '🎛️', body: [
            ui.statline('Active script', el('span.t-sm', { text: 'Janmashtami · Telugu v3.1' })),
            ui.statline('Calling hours', '9:00 AM – 8:00 PM'),
            ui.statline('Retry rule', 'Max 3 attempts / 24h'),
            ui.statline('Low-confidence routing', ui.badge('→ human review', 'amber')),
            ui.note('info', 'Twilio dialer + transcription are mocked. Outcomes are classified by a simulated Gemini intent model.', '🎙️')
          ] })
        ])
      ])
    ]);
  }

  function idleStage(queue) {
    var next = queue[0];
    return el('div.callstage', {}, [
      el('div.pulse-ring'),
      el('div.row-between', {}, [
        el('div', {}, [el('div.t-up', { text: 'Voice Agent · ready', style: { color: '#9aa0cf' } }), el('div.t-xl.t-bold.mt-4', { text: 'Auto-dialer idle' })]),
        ui.badge('Simulated', 'saffron')
      ]),
      next ? el('div.row.gap-12.mt-16', { style: { padding: '14px', background: 'rgba(255,255,255,.06)', borderRadius: '12px', flexWrap: 'wrap' } }, [
        ui.avatar(next.name, next.id, 40),
        el('div', { style: { flex: 1, minWidth: 0 } }, [el('b', { text: 'Next: ' + next.name, style: { color: '#fff' } }), el('div.t-xs', { text: next.mobile + ' · ' + next.language + ' · ' + (store.campaign(next.campaignId) || {}).name, style: { color: '#9aa0cf' } })]),
        el('button.btn', { onclick: function () { dispositionForm(next, null); } }, [el('span.ico', { text: '✎' }), 'Log manually']),
        el('button.btn.btn-primary', { disabled: paused ? true : null, onclick: function () { runCall(next); } }, [el('span.ico', { text: '📞' }), 'Call now'])
      ]) : el('div.mt-16.t-sm', { text: 'Queue empty.', style: { color: '#9aa0cf' } })
    ]);
  }

  function startBatch(queue) { if (queue[0]) runCall(queue[0]); }

  function runCall(contact) {
    if (running) return;
    running = true;
    var stage = U.$('#call-stage');
    var script = store.get().scripts.find(function (s) { return s.campaignId === contact.campaignId; }) || store.get().scripts[0];
    // choose an outcome deterministically-ish
    var d = store.donorByContact(contact.id);
    var kinds = d ? ['donated', 'callback', 'escalate', 'interested'] : ['interested', 'callback', 'notinterested', 'donated'];
    var kind = kinds[Math.floor(Math.random() * kinds.length)];

    var TR = {
      donated: [['agent', 'Hare Krishna! Calling from HKM Hyderabad about the Janmashtami Maha Abhishekam seva. Is this a good time?'], ['contact', 'Hare Krishna, yes please.'], ['agent', 'Would you like to offer Abhishekam seva this year? It starts from ₹2,100.'], ['contact', 'I will do ₹11,000 Abhishekam seva. Send me the payment link on WhatsApp.'], ['agent', 'Wonderful! Sending the secure link now. Hare Krishna!']],
      interested: [['agent', 'Hare Krishna! Calling about the Janmashtami seva.'], ['contact', 'Tell me more, I am interested.'], ['agent', 'You can sponsor festival seva and receive prasadam. Shall I send details?'], ['contact', 'Yes send on WhatsApp, I will decide this week.'], ['agent', 'Done. Hare Krishna!']],
      callback: [['agent', 'Hare Krishna! Calling about the Vrindavan Yatra.'], ['contact', 'I am driving, call me after 7 PM.'], ['agent', 'Of course, I will arrange a callback after 7 PM. Hare Krishna!']],
      notinterested: [['agent', 'Hare Krishna! Calling about the Janmashtami seva.'], ['contact', 'Not interested, please remove my number.'], ['agent', 'Understood, updating our records. Hare Krishna.']],
      escalate: [['agent', 'Hare Krishna! Calling regarding your donation enquiry.'], ['contact', 'I paid ₹50,000 last week but have no 80G receipt. Second follow-up!'], ['agent', 'I am sorry — escalating to our donor team to resolve today. They will call within the hour.']]
    };
    var lines = TR[kind];

    // dialing
    U.clear(stage);
    stage.appendChild(activeStage(contact, script, 'Dialing…'));
    var transcriptBox = U.$('#tx-box', stage);

    var step = 0;
    function tick() {
      if (step === 0) { U.$('#call-status', stage).textContent = 'Connected · recording'; U.$('#wave', stage).style.display = 'flex'; }
      if (step < lines.length) {
        var l = lines[step];
        transcriptBox.appendChild(el('div.transcript-line.' + (l[0] === 'agent' ? 'agent' : 'contact'), {}, [el('div.who', { text: l[0] === 'agent' ? 'AI Agent' : contact.name.split(' ')[0] }), el('div.txt', { text: l[1] })]));
        transcriptBox.scrollTop = transcriptBox.scrollHeight;
        step++;
        setTimeout(tick, 900 + Math.random() * 500);
      } else {
        finishCall(contact, script, kind, lines, stage);
      }
    }
    setTimeout(tick, 700);
  }

  function activeStage(contact, script, status) {
    return el('div.callstage', {}, [
      el('div.row-between', {}, [
        el('div.row.gap-12', {}, [
          ui.avatar(contact.name, contact.id, 44),
          el('div', {}, [el('b', { text: contact.name, style: { color: '#fff' } }), el('div.t-xs', { text: contact.mobile + ' · ' + contact.language, style: { color: '#9aa0cf' } })])
        ]),
        el('div.col', { style: { alignItems: 'flex-end' } }, [el('div#call-status.t-sm.t-semi', { text: status, style: { color: 'var(--saffron-400)' } }), el('div.waveform#wave', { style: { display: 'none', marginTop: '6px' } }, [1, 2, 3, 4, 5, 6, 7].map(function (i) { return el('span', { style: { animationDelay: (i * 0.1) + 's' } }); }))])
      ]),
      el('div.t-xs.mt-8', { text: '📜 ' + script.name + ' · approved ' + script.version, style: { color: '#9aa0cf' } }),
      el('div#tx-box', { style: { marginTop: '16px', maxHeight: '260px', overflowY: 'auto', paddingRight: '6px' } })
    ]);
  }

  function finishCall(contact, script, kind, lines, stage) {
    var map = {
      donated: { outcome: 'Donated', intent: 'Donation intent', objection: null, score: 92, conf: 0.96 },
      interested: { outcome: 'Interested', intent: 'Positive interest', objection: 'Will decide later', score: 74, conf: 0.86 },
      callback: { outcome: 'Callback', intent: 'Callback requested', objection: 'Busy now', score: 60, conf: 0.93 },
      notinterested: { outcome: 'Not interested', intent: 'Not interested', objection: 'No interest', score: 8, conf: 0.9 },
      escalate: { outcome: 'Escalate', intent: 'Service issue (receipt)', objection: 'Receipt delay', score: 80, conf: 0.7 }
    };
    var m = map[kind];
    var callId = U.uid('CALL');
    var call = {
      type: 'call', id: callId, contactId: contact.id, contactName: contact.name, campaignId: contact.campaignId,
      scriptId: script.id, ownerId: store.getSession().userId, attempt: 1, status: 'Connected',
      duration: 30 + lines.length * 18, language: contact.language, recordingRef: 'rec_' + callId.toLowerCase() + '.mp3',
      transcript: lines.map(function (l) { return { who: l[0], text: l[1] }; }),
      intent: m.intent, outcome: m.outcome, objection: m.objection, leadScore: m.score, confidence: m.conf,
      lowConfidence: m.conf < 0.78, escalated: kind === 'escalate', approvalNeeded: kind === 'escalate',
      reviewed: false, createdAt: U.now().toISOString(), outcomeKind: kind
    };
    // build the result panel BEFORE committing (commit re-renders the whole screen)
    var resultPanel = el('div.callstage', {}, [
      el('div.row-between', {}, [el('div', {}, [el('div.t-up', { text: 'Call complete', style: { color: '#9aa0cf' } }), el('div.t-xl.t-bold.mt-4', { text: contact.name, style: { color: '#fff' } })]), ui.badge('✨ AI classified', 'saffron')]),
      el('div.grid.cols-2.mt-16', { style: { gap: '10px' } }, [
        resultBox('Outcome', m.outcome), resultBox('Intent', m.intent),
        resultBox('Lead score', m.score + '/100'), resultBox('Confidence', Math.round(m.conf * 100) + '%' + (m.conf < 0.78 ? ' ⚠' : ''))
      ]),
      m.conf < 0.78 ? el('div.note.note-amber.mt-12', {}, [el('span.ni', { text: '⚠' }), el('div', { html: '<b>Low confidence.</b> Routed to human review before CRM finalization.' })]) : null,
      kind === 'escalate' ? el('div.note.note-red.mt-12', {}, [el('span.ni', { text: '🚨' }), el('div', { html: '<b>Escalated to donor relations.</b> Context pack created for human handoff.' })]) : null,
      el('div.row.gap-8.mt-16', {}, [
        el('a.btn.btn-primary', { href: '#/wf002/call/' + callId }, 'Review call →'),
        el('button.btn', { onclick: function () { store.emit(); } }, 'Next in queue'),
        el('div.grow'),
        el('span.t-xs', { text: 'Written back: Contact_ID, Call_ID, outcome, intent', style: { color: '#9aa0cf' } })
      ])
    ]);

    // write-back: side effects (task / whatsapp / escalation) + call, then ONE commit
    if (kind === 'callback') store.get().tasks.unshift({ type: 'task', id: U.uid('TASK'), kind: 'Callback', contactId: contact.id, contactName: contact.name, callId: callId, campaignId: contact.campaignId, ownerId: call.ownerId, priority: m.score > 70 ? 'High' : 'Medium', dueDate: U.hoursFromNow(6).toISOString(), status: 'Open', slaStatus: 'On track', createdAt: U.now().toISOString(), note: 'Auto-created from call' });
    if (kind === 'donated' || kind === 'interested') store.get().whatsapp.unshift({ type: 'wa', id: U.uid('MSG'), templateId: contact.campaignId === 'CMP-VRJ' ? 'WA-YATRA-BR' : 'WA-PAYLINK', contactId: contact.id, contactName: contact.name, campaignId: contact.campaignId, status: 'sent', reply: null, linkClick: false, approvalStatus: 'approved', ownerId: call.ownerId, createdAt: U.now().toISOString() });
    if (kind === 'escalate') store.get().escalations.unshift({ type: 'esc', id: U.uid('ESC'), contactId: contact.id, contactName: contact.name, callId: callId, reason: 'Donor receipt delay — sensitive', priority: 'High', assigneeId: 'U-GOPAL', status: 'Open', slaDue: U.hoursFromNow(1).toISOString(), createdAt: U.now().toISOString(), context: 'Donor reports payment with no receipt. Escalated live.', talkingPoints: ['Acknowledge & thank', 'Confirm payment in DCC', 'Issue receipt today'] });
    store.actions.logCallOutcome(call); // unshifts call + audit + commit (re-renders screen)
    running = false;

    // inject the result panel into the freshly rendered stage
    var freshStage = U.$('#call-stage');
    if (freshStage) { U.clear(freshStage); freshStage.appendChild(resultPanel); }
    ui.toast({ kind: kind === 'escalate' ? 'warn' : 'success', title: 'Call logged — ' + m.outcome, msg: kind === 'donated' ? 'WhatsApp payment link queued.' : kind === 'callback' ? 'Callback task created.' : kind === 'escalate' ? 'Escalation raised to human.' : 'Outcome written to CRM.' });
  }

  function resultBox(label, val) { return el('div', { style: { background: 'rgba(255,255,255,.07)', borderRadius: '10px', padding: '10px 12px' } }, [el('div.t-xs', { text: label, style: { color: '#9aa0cf' } }), el('div.t-semi.mt-4', { text: val, style: { color: '#fff' } })]); }

  /* VO-01: human disposition form (default path; AI guess pre-fills) */
  function dispositionForm(contact, aiGuess) {
    var s = store.get();
    var script = s.scripts.find(function (x) { return x.campaignId === contact.campaignId; }) || s.scripts[0];
    var codes = (script && script.outcomeCodes) || ['Interested', 'Donated', 'Callback', 'Not interested', 'Escalate'];
    var d = { outcome: aiGuess || codes[0], objection: '', pledge: '', callbackHrs: 24, notes: '' };
    function f(label, input) { return el('div.field', {}, [el('label', { text: label }), input]); }
    ui.modal({ title: 'Log call — ' + contact.name, subtitle: 'Human disposition · ' + contact.mobile, size: 'lg',
      body: el('div', {}, [
        aiGuess ? ui.aiBlock('AI suggested', [el('div.t-sm', { text: 'Suggested outcome: ' + aiGuess + ' — confirm or correct below.' })]) : null,
        el('div.grid.cols-2', { style: { gap: '0 16px' } }, [
          f('Outcome', el('select.select', { onchange: function (e) { d.outcome = e.target.value; } }, codes.map(function (o) { var op = el('option', { value: o, text: o }); if (o === d.outcome) op.selected = true; return op; }))),
          f('Objection (if any)', el('input.input', { placeholder: 'e.g. price, timing', oninput: function (e) { d.objection = e.target.value; } })),
          f('Pledge amount (₹)', el('input.input', { type: 'number', placeholder: '0', oninput: function (e) { d.pledge = e.target.value; } })),
          f('Callback in (hrs)', el('input.input', { type: 'number', value: 24, oninput: function (e) { d.callbackHrs = +e.target.value; } }))
        ]),
        f('Notes', el('textarea.textarea', { placeholder: 'Conversation notes…', oninput: function (e) { d.notes = e.target.value; } }))
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Save disposition', variant: 'primary', onClick: function () {
        var callId = U.uid('CALL');
        var call = { type: 'call', id: callId, contactId: contact.id, contactName: contact.name, campaignId: contact.campaignId, scriptId: script ? script.id : null, ownerId: store.getSession().userId, attempt: 1, status: 'Connected', duration: 120, language: contact.language, recordingRef: null, transcript: [], intent: d.outcome, outcome: d.outcome, objection: d.objection || null, leadScore: d.outcome === 'Donated' ? 95 : d.outcome === 'Interested' ? 70 : 30, confidence: 1, lowConfidence: false, escalated: d.outcome === 'Escalate', approvalNeeded: false, reviewed: true, createdAt: U.now().toISOString(), manual: true, notes: d.notes, pledge: d.pledge, centerId: contact.centerId, deptId: 'VOX' };
        store.actions.logCallOutcome(call);
        store.actions.meter('voice', 2, { centerId: contact.centerId, refType: 'Call', refId: callId });
        if (d.outcome === 'Callback') store.get().tasks.unshift({ type: 'task', id: U.uid('TASK'), kind: 'Callback', contactId: contact.id, contactName: contact.name, callId: callId, campaignId: contact.campaignId, ownerId: store.getSession().userId, priority: 'High', dueDate: U.hoursFromNow(d.callbackHrs).toISOString(), status: 'Open', slaStatus: 'On track', createdAt: U.now().toISOString(), note: 'Manual callback', centerId: contact.centerId, deptId: 'VOX' });
        store.commit();
        ui.toast({ kind: 'success', title: 'Disposition saved', msg: d.outcome + (d.outcome === 'Callback' ? ' · callback task created' : '') + ' · written to CRM.' });
      } }]
    });
  }

  return { render: render, title: 'Call Console' };
})();
