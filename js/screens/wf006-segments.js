/* ============================================================
   Screen: WF-006 Segment & Campaign-Fit Studio (6.5 / 3.2)
   ============================================================ */
App.screens['wf006-segments'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;

  function render() {
    var s = store.get();
    var segs = s.segments;
    var ready = segs.filter(function (x) { return x.status === 'ready'; }).length;

    return el('div', {}, [
      ui.pageHead('Segment & Campaign-Fit Studio', 'Builds eligible, well-formed audiences for campaigns and calling — by source, lifecycle, donor-tier, geography and language. Over-contacted contacts are suppressed; sensitive audiences need approval.', [
        el('button.btn.btn-primary', { onclick: buildSegment }, [el('span.ico', { text: '✨' }), 'Build segment'])
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '🎯', label: 'Segments', value: segs.length, accent: 'indigo' }),
        ui.kpi({ icon: '✓', label: 'Campaign-ready', value: ready, accent: 'green' }),
        ui.kpi({ icon: '🛡️', label: 'Sensitive (need approval)', value: segs.filter(function (x) { return x.sensitive; }).length, accent: 'amber' }),
        ui.kpi({ icon: '♻️', label: 'Retargeting seeds', value: U.sum(segs, function (x) { return x.retargetSeed; }), accent: 'violet' })
      ]),
      el('div.grid.cols-2', {}, segs.map(segCard))
    ]);
  }

  function segCard(sg) {
    return ui.card({ body: [
      el('div.row-between.mb-8', { style: { flexWrap: 'wrap', gap: '8px' } }, [
        el('div', {}, [el('div.row.gap-8', {}, [el('b', { text: sg.name }), sg.sensitive ? ui.badge('Sensitive', 'amber', true) : null]), el('div.t-xs.t-mut.mt-2.t-mono', { text: sg.rule })]),
        ui.badge('Fit ' + sg.fit, sg.fit >= 85 ? 'green' : 'amber')
      ]),
      el('div.grid.cols-3', { style: { gap: '8px' } }, [
        miniStat('Total', sg.size, ''), miniStat('Eligible', sg.eligible, 'green'), miniStat('Suppressed', sg.suppressed + sg.overContact, 'amber')
      ]),
      el('div.row.gap-6.mt-8', {}, sg.channels.map(function (c) { return ui.badge(channelIcon(c) + ' ' + c, 'neutral'); })),
      el('div.row.gap-8.mt-12', { style: { alignItems: 'center' } }, [
        ui.statusBadge(sg.status),
        el('div.grow'),
        sg.status === 'needs_approval' ? el('button.btn.btn-sm.btn-success', { onclick: function () { store.actions.approveSegment(sg.id); ui.toast({ kind: 'success', msg: 'Segment approved & campaign-ready.' }); } }, '✓ Approve') :
          el('button.btn.btn-sm', { onclick: function () { useInCampaign(sg); } }, 'Use in campaign →'),
        el('button.btn.btn-sm.btn-ghost', { onclick: function () { ui.toast({ kind: 'info', msg: 'Exclusion list (' + (sg.suppressed + sg.overContact) + ') exported.' }); } }, 'Exclusions')
      ])
    ] });
  }
  function miniStat(label, val, color) { return el('div', { style: { background: 'var(--surface-2)', borderRadius: '8px', padding: '8px 10px' } }, [el('div.t-xs.t-mut', { text: label }), el('div.t-lg.t-bold', { text: U.num(val), style: color ? { color: 'var(--' + color + '-600)' } : null })]); }
  function channelIcon(c) { return { call: '📞', whatsapp: '💬', sms: '📩', email: '✉' }[c] || '•'; }

  function useInCampaign(sg) { ui.toast({ kind: 'success', title: 'Audience attached', msg: sg.eligible + ' eligible contacts ready for a campaign or call queue.' }); App.router.go('/wf003/builder'); }

  function buildSegment() {
    var s = store.get();
    var rules = [{ field: 'segment', op: 'is', value: 'Active Donor' }];
    var FIELDS = { segment: function (c) { return c.segment; }, city: function (c) { return c.city; }, language: function (c) { return c.language; }, source: function (c) { return c.source || ''; }, dqScore: function (c) { return c.dqScore; } };
    var logic = 'AND';
    var countLine = el('div');
    function evalRules() {
      var elig = s.contacts.filter(function (c) {
        if (c.consent.dnd || c.consent.optOut) return false;
        var tests = rules.map(function (r) { var v = FIELDS[r.field] ? FIELDS[r.field](c) : ''; if (r.op === 'is') return String(v).toLowerCase() === String(r.value).toLowerCase(); if (r.op === 'contains') return String(v).toLowerCase().indexOf(String(r.value).toLowerCase()) > -1; if (r.op === '>=') return +v >= +r.value; return false; });
        return logic === 'AND' ? tests.every(Boolean) : tests.some(Boolean);
      });
      return elig.length;
    }
    function drawCount() { U.clear(countLine); var n = evalRules(); countLine.appendChild(el('div.note.note-green', {}, [el('span.ni', { text: '🎯' }), el('div', { html: '<b>' + U.num(n) + '</b> eligible contacts match (consent-checked) · ~' + U.num(Math.round(n * 0.6)) + ' retargeting seed' })])); }
    var rulesBox = el('div');
    function drawRules() {
      U.clear(rulesBox);
      rules.forEach(function (r, i) {
        rulesBox.appendChild(el('div.row.gap-6.mb-6', {}, [
          i > 0 ? el('span.badge.badge-neutral', {}, logic) : el('span', { style: { width: '34px' } }),
          el('select.select', { style: { maxWidth: '130px' }, onchange: function (e) { r.field = e.target.value; drawCount(); } }, Object.keys(FIELDS).map(function (f) { var o = el('option', { value: f, text: f }); if (f === r.field) o.selected = true; return o; })),
          el('select.select', { style: { maxWidth: '90px' }, onchange: function (e) { r.op = e.target.value; drawCount(); } }, ['is', 'contains', '>='].map(function (o) { var op = el('option', { text: o }); if (o === r.op) op.selected = true; return op; })),
          el('input.input', { value: r.value, oninput: function (e) { r.value = e.target.value; drawCount(); } }),
          el('button.btn.btn-sm.btn-ghost', { onclick: function () { rules.splice(i, 1); drawRules(); drawCount(); } }, '✕')
        ]));
      });
    }
    drawRules(); drawCount();
    ui.modal({ title: 'Build a segment', subtitle: 'Compose rules — eligible count updates live', size: 'lg',
      body: el('div', {}, [
        ui.aiBlock('Segment & Campaign-Fit Agent', [el('div.t-sm', { html: 'Compose AND/OR rules; the agent evaluates against the live contact base and deducts suppressed/over-contacted.' })]),
        el('div.row.gap-8.mt-12.mb-8', {}, [el('span.t-sm.t-semi', { text: 'Match' }), el('div.seg', {}, [el('button.active', { onclick: function (e) { logic = 'AND'; e.currentTarget.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); }); e.currentTarget.classList.add('active'); drawCount(); } }, 'ALL (AND)'), el('button', { onclick: function (e) { logic = 'OR'; e.currentTarget.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); }); e.currentTarget.classList.add('active'); drawCount(); } }, 'ANY (OR)')]), el('div.grow'), el('button.btn.btn-sm', { onclick: function () { rules.push({ field: 'city', op: 'is', value: 'Hyderabad' }); drawRules(); drawCount(); } }, '+ Rule')]),
        rulesBox, countLine
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Save segment', variant: 'primary', onClick: function () { var n = evalRules(); s.segments.unshift({ id: U.uid('SEG'), name: 'Custom segment ' + (s.segments.length + 1), basis: 'custom', rule: rules.map(function (r) { return r.field + ' ' + r.op + ' ' + r.value; }).join(' ' + logic + ' '), channels: ['call', 'whatsapp'], sensitive: false, fit: 80, size: n, eligible: Math.round(n * 0.88), suppressed: Math.round(n * 0.12), overContact: 0, status: 'ready', retargetSeed: Math.round(n * 0.6), owner: store.getSession().userId, centerId: 'HYD', deptId: 'CRM' }); store.actions.audit('Created segment', 'data', 'segment', n + ' eligible'); ui.toast({ kind: 'success', msg: 'Segment saved · ' + U.num(n) + ' eligible.' }); } }]
    });
  }

  return { render: render, title: 'Segment Studio' };
})();
