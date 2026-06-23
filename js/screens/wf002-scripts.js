/* ============================================================
   Screen: WF-002 Voice Script Approval Lifecycle
   ============================================================ */
App.screens['wf002-scripts'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;

  var LIFECYCLE = ['Brief', 'AI + writer draft', 'Reviewer', 'Approver', 'Test call (QA)', 'Production'];

  function render() {
    var s = store.get();
    var scripts = s.scripts;

    return el('div', {}, [
      ui.pageHead('Voice Script Approval', 'Every production script passes a controlled lifecycle. Sensitive categories (donor, financial, devotional) need the right approver. <b>AI drafts; humans approve.</b>', null),
      ui.card({ title: 'Approval lifecycle', icon: '🔄', cls: 'mb-16', body: [
        el('div.steps', {}, LIFECYCLE.map(function (st, i) {
          return el('div.step.done', {}, [el('div.sc', { text: i + 1 }), el('span.sl', { text: st }), i < LIFECYCLE.length - 1 ? el('span.line') : null]);
        }))
      ] }),
      el('div.col.gap-12', {}, scripts.map(scriptCard))
    ]);
  }

  function stageIndex(status) { return status === 'production' ? 5 : status === 'review' ? 2 : status === 'draft' ? 1 : 0; }

  function scriptCard(sc) {
    var stage = stageIndex(sc.status);
    return ui.card({ body: [
      el('div.row-between', { style: { flexWrap: 'wrap', gap: '8px' } }, [
        el('div', {}, [
          el('div.row.gap-8', {}, [el('b', { text: sc.name }), ui.idChip(sc.id), ui.badge(sc.version, 'neutral'), sc.campaignId && store.campaign(sc.campaignId) ? ui.idChip(sc.campaignId, function () { App.router.go('/wf003/campaign/' + sc.campaignId); }) : null].filter(Boolean)),
          el('div.t-xs.t-mut.mt-4', { text: sc.category + ' · ' + sc.language + (sc.campaignId ? ' · ' + sc.campaignId : '') })
        ]),
        el('div.row.gap-8', {}, [sc.qa != null ? ui.badge('QA ' + sc.qa, sc.qa >= 90 ? 'green' : 'amber') : null, ui.statusBadge(sc.status)].filter(Boolean))
      ]),
      el('div.steps.mt-12', {}, ['Brief', 'Draft', 'Review', 'Approve', 'QA', 'Live'].map(function (st, i) {
        return el('div.step' + (i < stage ? '.done' : i === stage ? '.active' : ''), {}, [el('div.sc', { text: i <= stage ? '✓' : i + 1 }), el('span.sl', { text: st }), i < 5 ? el('span.line') : null]);
      })),
      el('div', { style: { background: 'var(--surface-2)', borderRadius: '10px', padding: '12px', marginTop: '12px', fontSize: '12.5px', fontStyle: 'italic', color: 'var(--text-2)' } }, '“' + sc.opening + '”'),
      el('div.row.gap-6.mt-8', { style: { flexWrap: 'wrap' } }, sc.outcomeCodes.map(function (o) { return ui.badge(o, 'neutral'); })),
      el('div.row.gap-8.mt-12', { style: { alignItems: 'center', flexWrap: 'wrap' } }, [
        el('span.t-xs.t-mut', { text: sc.approvalDate ? '✓ Approved by ' + (store.user(sc.approverId) || {}).name + ' · ' + U.fmtDate(sc.approvalDate) : 'Approver: ' + (store.user(sc.approverId) || {}).name + ' (pending)' }),
        el('div.grow'),
        el('button.btn.btn-sm.btn-ghost', { onclick: function () { editScript(sc); } }, '✎ Edit / new version'),
        (sc.versions && sc.versions.length) ? el('button.btn.btn-sm.btn-ghost', { onclick: function () { diffScript(sc); } }, '⇄ Diff (' + sc.versions.length + ')') : null,
        sc.status === 'review' ? el('button.btn.btn-sm.btn-success', { onclick: function () { approve(sc); } }, '✓ Approve for production') : null,
        sc.status === 'draft' ? el('button.btn.btn-sm', { onclick: function () { sc.status = 'review'; store.commit(); ui.toast('Sent to reviewer'); } }, 'Send to review') : null,
        sc.status === 'production' ? el('button.btn.btn-sm.btn-ghost', { onclick: function () { ui.toast('▶ QA test call (simulated)'); } }, '▶ Test call') : null
      ])
    ] });
  }

  function editScript(sc) {
    var v = sc.opening, ver = sc.version;
    ui.modal({ title: 'Edit script — ' + sc.name, subtitle: 'Saving creates a new version → review lifecycle', size: 'lg',
      body: el('div', {}, [
        el('div.field', {}, [el('label', { text: 'Version label' }), el('input.input', { value: bump(sc.version), oninput: function (e) { ver = e.target.value; }, style: { maxWidth: '120px' } })]),
        el('div.field', {}, [el('label', { text: 'Opening / script body' }), el('textarea.textarea', { style: { minHeight: '140px' }, oninput: function (e) { v = e.target.value; }, text: sc.opening })])
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Save new version', variant: 'primary', onClick: function () { store.actions.addScriptVersion(sc.id, ver || bump(sc.version), v); ui.toast({ kind: 'success', msg: 'New version saved → in review.' }); } }] });
  }
  function bump(ver) { var m = /v(\d+)\.(\d+)/.exec(ver || 'v1.0'); return m ? 'v' + m[1] + '.' + (+m[2] + 1) : 'v1.1'; }
  function diffScript(sc) {
    var prev = sc.versions[0];
    ui.modal({ title: 'Version diff — ' + sc.name, subtitle: prev.version + ' → ' + sc.version, size: 'lg',
      body: el('div.grid.cols-2', { style: { gap: '12px' } }, [
        el('div', {}, [el('div.t-up.mb-4', { text: prev.version + ' (previous)' }), el('div', { style: { background: 'var(--red-50)', padding: '12px', borderRadius: '8px', fontSize: '12.5px', fontStyle: 'italic' } }, '“' + prev.opening + '”')]),
        el('div', {}, [el('div.t-up.mb-4', { text: sc.version + ' (current)' }), el('div', { style: { background: 'var(--green-50)', padding: '12px', borderRadius: '8px', fontSize: '12.5px', fontStyle: 'italic' } }, '“' + sc.opening + '”')])
      ]) });
  }

  function approve(sc) {
    ui.confirm({ title: 'Approve script for production?', message: '<b>' + sc.name + '</b> (' + sc.category + ') will go live for calling. This decision is logged with your name and role.', confirmLabel: 'Approve', variant: 'success', onConfirm: function () {
      sc.status = 'production'; sc.approvalDate = U.now().toISOString(); sc.qa = sc.qa || 90; store.commit();
      var appr = store.get().approvals.find(function (a) { return a.entityId === sc.id && a.status === 'pending'; });
      if (appr) store.actions.decideApproval(appr.id, 'approved', 'Approved from scripts screen');
      ui.toast({ kind: 'success', msg: 'Script approved for production.' });
    } });
  }

  return { render: render, title: 'Voice Scripts' };
})();
