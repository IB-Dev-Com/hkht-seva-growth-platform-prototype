/* ============================================================
   Screen: WF-003 New Campaign builder (wizard + AI brief + gate)
   ============================================================ */
App.screens['wf003-builder'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;
  var step = 0;
  var draft = null;

  function reset() {
    draft = { name: '', type: 'Festival', objective: '', channels: ['meta_ads'], budget: 250000, deptId: 'MKT', centerId: store.getSession().centerId === 'ALL' ? 'HYD' : store.getSession().centerId, brief: null, variants: null };
  }

  function render() {
    if (!draft) reset();
    var STEPS = ['Objective', 'AI strategy brief', 'Content variants', 'Approval gate'];

    var stepsBar = el('div.steps.mb-20', {}, STEPS.map(function (st, i) {
      return el('div.step' + (i < step ? '.done' : i === step ? '.active' : ''), {}, [el('div.sc', { text: i < step ? '✓' : i + 1 }), el('span.sl', { text: st }), i < STEPS.length - 1 ? el('span.line') : null]);
    }));

    var body;
    if (step === 0) body = stepObjective();
    else if (step === 1) body = stepBrief();
    else if (step === 2) body = stepVariants();
    else body = stepApproval();

    return el('div', { style: { maxWidth: '860px', margin: '0 auto' } }, [
      ui.pageHead('New Campaign', 'AI converts an objective into a strategy brief and channel-specific copy — then a human approves budget and content before launch.', [el('a.btn.btn-ghost', { href: '#/wf003/campaigns' }, 'Cancel')]),
      stepsBar,
      ui.card({ body: [body] })
    ]);
  }

  function field(label, input, hint) { return el('div.field', {}, [el('label', {}, [label]), input, hint ? el('div.hint', { text: hint }) : null]); }

  function stepObjective() {
    return el('div', {}, [
      field('Campaign name *', el('input.input', { value: draft.name, placeholder: 'e.g. Govardhan Puja 2026', oninput: function (e) { draft.name = e.target.value; } })),
      el('div.grid.cols-2', {}, [
        field('Type', el('select.select', { onchange: function (e) { draft.type = e.target.value; } }, ['Festival', 'Yatra', 'Donation', 'Seva'].map(function (t) { var o = el('option', { value: t, text: t }); if (t === draft.type) o.selected = true; return o; }))),
        field('Budget ceiling (₹)', el('input.input', { type: 'number', value: draft.budget, oninput: function (e) { draft.budget = +e.target.value; } }))
      ]),
      el('div.grid.cols-2', {}, [
        field('Center', el('select.select', { onchange: function (e) { draft.centerId = e.target.value; } }, store.get().centers.map(function (c) { var o = el('option', { value: c.id, text: c.name }); if (c.id === draft.centerId) o.selected = true; return o; }))),
        field('Department', el('select.select', { onchange: function (e) { draft.deptId = e.target.value; } }, store.get().departments.map(function (d) { var o = el('option', { value: d.id, text: d.name }); if (d.id === draft.deptId) o.selected = true; return o; })))
      ]),
      field('Objective', el('textarea.textarea', { placeholder: 'What should this campaign achieve?', oninput: function (e) { draft.objective = e.target.value; }, text: draft.objective })),
      field('Channels', el('div.chips', {}, ['google_ads', 'meta_ads', 'youtube', 'whatsapp', 'website'].map(function (ch) {
        return el('div.fchip' + (draft.channels.indexOf(ch) > -1 ? '.active' : ''), { onclick: function () { var i = draft.channels.indexOf(ch); if (i > -1) draft.channels.splice(i, 1); else draft.channels.push(ch); store.emit(); } }, store.source(ch).icon + ' ' + store.source(ch).label);
      }))),
      navRow(null, function () { if (!draft.name) { ui.toast({ kind: 'error', msg: 'Enter a campaign name.' }); return; } step = 1; generateBrief(); store.emit(); }, 'Generate strategy brief →')
    ]);
  }

  function generateBrief() {
    draft.brief = {
      summary: 'A ' + draft.type.toLowerCase() + ' campaign targeting Hyderabad devotees and well-wishers, optimised for ' + (draft.type === 'Yatra' ? 'high-intent pilgrimage registrations' : 'donation conversions') + ' with 80G appeal.',
      audience: draft.type === 'Yatra' ? 'Past yatris, active donors, festival attendees (25–60, Telugu/Hindi)' : 'Active + lapsed donors, festival attendees, lookalikes of HNI donors',
      timing: 'Launch 3 weeks pre-event; peak push final 10 days; remarketing window after.',
      metrics: ['CPL < ' + U.inr(Math.round(draft.budget / 1200)), 'ROAS > 2.5×', 'Lead-sync 100%', 'First-follow-up < 4h'],
      channelPlan: draft.channels.map(function (ch) { return { ch: ch, split: Math.round(100 / draft.channels.length) }; })
    };
  }

  function stepBrief() {
    var b = draft.brief;
    return el('div', {}, [
      ui.aiBlock('Gemini strategy brief — review & edit', [
        el('div.t-sm', { text: b.summary }),
        el('div.mt-12', {}, [
          ui.statline('Audience', b.audience),
          ui.statline('Timing', b.timing)
        ]),
        el('div.t-up.mt-12.mb-4', { text: 'Channel plan' }),
        el('div.col.gap-6', {}, b.channelPlan.map(function (cp) { return el('div.row.gap-8', {}, [el('span.t-sm', { text: store.source(cp.ch).icon + ' ' + store.source(cp.ch).label, style: { width: '160px' } }), ui.bar(cp.split, 'indigo'), el('span.t-xs.t-mut', { text: cp.split + '%' })]); })),
        el('div.t-up.mt-12.mb-4', { text: 'Success metrics' }),
        el('div.chips', {}, b.metrics.map(function (m) { return ui.badge(m, 'green'); }))
      ]),
      ui.note('info', 'This brief is AI-drafted. A human owns the final strategy — edit anything before continuing. High-budget campaigns escalate to leadership.', '✨'),
      navRow(function () { step = 0; store.emit(); }, function () { step = 2; generateVariants(); store.emit(); }, 'Generate content variants →')
    ]);
  }

  function generateVariants() {
    draft.variants = [
      { headline: 'Offer seva this ' + draft.type + ' 🙏', body: 'Join thousands of devotees. Your contribution from ₹2,100 with 80G benefits.', cta: 'Offer Seva' },
      { headline: 'Be part of something sacred', body: 'Sponsor ' + draft.type.toLowerCase() + ' seva and receive prasadam & a certificate.', cta: 'Donate Now' },
      { headline: 'A rare opportunity to serve Krishna', body: 'Limited seva sponsorships available this season. Reserve yours today.', cta: 'Sponsor Now' }
    ];
  }

  function stepVariants() {
    return el('div', {}, [
      ui.aiBlock('AI-drafted ad copy — needs content review', [
        el('div.col.gap-10', {}, draft.variants.map(function (v, i) {
          return el('div', { style: { border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', background: 'var(--surface)' } }, [
            el('div.row-between', {}, [ui.badge('Variant ' + String.fromCharCode(65 + i), 'indigo'), el('span.t-xs.t-mut', { text: store.source(draft.channels[0]).label })]),
            el('b.mt-8', { text: v.headline, style: { display: 'block' } }),
            el('div.t-sm.t-mut.mt-4', { text: v.body }),
            el('div.mt-8', {}, el('span.btn.btn-sm.btn-primary', {}, v.cta))
          ]);
        }))
      ]),
      ui.note('amber', 'Public + devotional copy requires <b>content reviewer approval</b> before publishing. Deity/media representation needs media approval.', '✍️'),
      navRow(function () { step = 1; store.emit(); }, function () { step = 3; store.emit(); }, 'Continue to approval →')
    ]);
  }

  function stepApproval() {
    var highBudget = draft.budget > 300000;
    return el('div', {}, [
      el('h3.mb-12', { text: 'Review & submit for approval' }),
      el('div.grid.cols-2', { style: { gap: '12px' } }, [
        ui.statline('Campaign', draft.name),
        ui.statline('Type', draft.type),
        ui.statline('Budget ceiling', U.inr(draft.budget)),
        ui.statline('Channels', draft.channels.map(function (c) { return store.source(c).label; }).join(', ')),
        ui.statline('Center / Dept', (store.center(draft.centerId) || {}).short + ' · ' + (store.dept(draft.deptId) || {}).name),
        ui.statline('Content', '3 variants (pending review)')
      ]),
      el('div.approval-gate mt-16', { class: 'mt-16' }, [
        el('span.ag-ico', { text: '🔐' }),
        el('div', {}, [el('b', { text: highBudget ? 'Requires leadership approval (high budget)' : 'Requires manager approval' }), el('div.t-sm.t-mut', { text: 'Budget, content and creative gates apply. Nothing launches until approved — with full audit trail.' })])
      ]),
      navRow(function () { step = 2; store.emit(); }, submit, 'Submit for approval', 'btn-primary')
    ]);
  }

  function submit() {
    var id = U.uid('CMP');
    var camp = {
      id: id, name: draft.name, type: draft.type, objective: draft.objective || draft.brief.summary, channels: draft.channels,
      budget: draft.budget, spend: 0, status: 'pending_approval', approvalStatus: 'pending',
      ownerId: store.getSession().userId, approverId: 'U-MUKUND', deptId: draft.deptId, centerId: draft.centerId,
      startDate: null, leads: 0, calls: 0, conversions: 0, revenue: 0, cpl: 0, cpa: 0, roas: 0,
      utm: id.toLowerCase().replace('cmp-', 'hkht_'), landingPageId: null, daily: [], risk: 'amber'
    };
    store.actions.createCampaign(camp);
    ui.toast({ kind: 'success', title: 'Submitted for approval', msg: draft.name + ' is now in the approvals queue.' });
    reset(); step = 0;
    router.go('/wf003/campaign/' + id);
  }

  function navRow(back, next, nextLabel, variant) {
    return el('div.row.mt-20', { style: { justifyContent: 'space-between' } }, [
      back ? el('button.btn', { onclick: back }, '← Back') : el('span'),
      el('button.btn.' + (variant || 'btn-accent'), { onclick: next }, nextLabel)
    ]);
  }

  return { render: function () { return render(); }, title: 'New Campaign' };
})();
