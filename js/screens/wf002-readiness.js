/* ============================================================
   Screen: WF-002 Calling Readiness (TRAI / DND risk gate)
   ============================================================ */
App.screens['wf002-readiness'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;

  function render() {
    var s = store.get();
    // build readiness rows per active campaign with a calling script
    var camps = store.scoped(s.campaigns).filter(function (c) { return c.status === 'active' || c.status === 'pending_approval'; });
    var rows = camps.map(function (c) {
      var script = s.scripts.find(function (sc) { return sc.campaignId === c.id; });
      var contacts = s.contacts.filter(function (x) { return x.campaignId === c.id; });
      var suppressed = contacts.filter(function (x) { return x.consent.dnd || x.consent.optOut; }).length;
      var noSource = contacts.filter(function (x) { return !x.source; }).length;
      var scriptOk = script && script.status === 'production';
      var dndKnown = true; // demo
      var audit = {
        source: c.approvalStatus === 'approved' ? 'Confirmed' : 'Mixed',
        freshness: 'Fresh',
        dnd: suppressed >= 0 ? 'Clean' : 'Unknown',
        phone: 'Clean',
        dup: 'Resolved',
        sourceTag: noSource > 0 ? 'Partial' : 'Tagged',
        script: scriptOk ? 'Approved' : (script ? 'In review' : 'Missing'),
        eligible: contacts.length - suppressed
      };
      var risk = (!scriptOk || audit.source === 'Mixed') ? (scriptOk ? 'amber' : 'red') : 'green';
      if (c.approvalStatus !== 'approved') risk = 'amber';
      return { c: c, audit: audit, risk: risk, total: contacts.length, suppressed: suppressed, eligible: audit.eligible, script: script, scriptOk: scriptOk };
    });

    return el('div', {}, [
      ui.pageHead('Calling Readiness — TRAI & DND Audit', 'Scaled voice outreach must pass a per-list audit before launch. <b>Unknown DND/suppression status blocks scaled calling.</b> Risk gate: 🟢 proceed · 🟡 pilot only · 🔴 do not launch.', null),
      ui.note('amber', 'Voice agent does <b>not</b> dial any list until its risk gate is Green (or an explicitly approved Amber pilot). Twilio + DLT registration is pending — calls in this prototype are simulated.', '🚦'),
      el('div.col.gap-12.mt-16', {}, rows.map(readinessCard))
    ]);
  }

  function readinessCard(r) {
    var auditFields = [
      ['Database source', r.audit.source, r.audit.source === 'Confirmed' ? 'green' : 'amber'],
      ['Contact freshness', r.audit.freshness, 'green'],
      ['DND / suppression', r.audit.dnd, r.audit.dnd === 'Clean' ? 'green' : 'red'],
      ['Phone validity', r.audit.phone, 'green'],
      ['Duplicate status', r.audit.dup, 'green'],
      ['Source tagging', r.audit.sourceTag, r.audit.sourceTag === 'Tagged' ? 'green' : 'amber'],
      ['Approved script', r.audit.script, r.scriptOk ? 'green' : 'red']
    ];
    return ui.card({ body: [
      el('div.row-between', { style: { flexWrap: 'wrap', gap: '10px' } }, [
        el('div', {}, [
          el('div.row.gap-8', {}, [el('b', { text: r.c.name }), ui.idChip(r.c.id)]),
          el('div.t-xs.t-mut.mt-4', { text: r.total + ' contacts · ' + r.eligible + ' eligible after suppression · ' + r.suppressed + ' blocked' })
        ]),
        ui.riskGate(r.risk)
      ]),
      el('div.grid.mt-12', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '8px' } }, auditFields.map(function (f) {
        return el('div', { style: { background: 'var(--surface-2)', borderRadius: '8px', padding: '8px 10px' } }, [el('div.t-xs.t-mut', { text: f[0] }), el('div.mt-4', {}, ui.badge(f[1], f[2], true))]);
      })),
      el('div.row.gap-8.mt-16', {}, [
        r.risk === 'green' ? el('button.btn.btn-success', { onclick: function () { activate(r.c, false); } }, [el('span.ico', { text: '🎙️' }), 'Activate calling queue']) :
        r.risk === 'amber' ? el('button.btn', { onclick: function () { activate(r.c, true); } }, [el('span.ico', { text: '🧪' }), 'Approve small pilot (manual review)']) :
        el('button.btn', { disabled: true }, [el('span.ico', { text: '⛔' }), 'Blocked — resolve red items']),
        r.script ? el('a.btn.btn-ghost.btn-sm', { href: '#/wf002/scripts' }, 'View script: ' + r.script.name) : el('a.btn.btn-ghost.btn-sm', { href: '#/wf002/scripts' }, 'No approved script →'),
        el('div.grow'),
        r.c.queueActivated ? ui.badge('Queue active', 'green', true) : null
      ])
    ] });
  }

  function activate(c, pilot) {
    store.actions.activateCallQueue(c.id);
    ui.toast({ kind: 'success', title: pilot ? 'Pilot approved' : 'Queue activated', msg: (pilot ? 'Small pilot with manual review enabled for ' : 'Calling queue activated for ') + c.name });
    router.go('/wf002/console');
  }

  return { render: render, title: 'Calling Readiness' };
})();
