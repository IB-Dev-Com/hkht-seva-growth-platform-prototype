/* ============================================================
   Screen: WF-006 CRM Sync & API Orchestration (6.8)
   ============================================================ */
App.screens['wf006-sync'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;
  var view = 'all';

  function render() {
    var s = store.get();
    var jobs = s.syncJobs;
    var failed = jobs.filter(function (j) { return j.status === 'failed'; });
    var conflict = jobs.filter(function (j) { return j.status === 'conflict'; });
    var retrying = jobs.filter(function (j) { return j.status === 'retrying'; });
    var success = jobs.filter(function (j) { return j.status === 'success'; });
    var shown = view === 'all' ? jobs : view === 'errors' ? failed.concat(conflict) : jobs.filter(function (j) { return j.status === view; });

    return el('div', {}, [
      ui.pageHead('CRM Sync & API Orchestration', 'Keeps every system consistent via governed APIs — create/update/read sync with retries, an error queue, conflict detection and full sync logging. Falls back to manual batch sync when an API is down.', [
        el('button.btn', { onclick: function () { ui.toast({ kind: 'info', title: 'Sync triggered', msg: 'Manual sync cycle started across systems (simulated).' }); } }, [el('span.ico', { text: '🔄' }), 'Run sync now'])
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '✓', label: 'Sync success rate', value: jobs.length ? Math.round(success.length / jobs.length * 100) + '%' : '—', accent: 'green' }),
        ui.kpi({ icon: '🔁', label: 'Retrying', value: retrying.length, accent: 'amber' }),
        ui.kpi({ icon: '⛔', label: 'Error queue', value: failed.length, accent: 'red' }),
        ui.kpi({ icon: '⚠️', label: 'Identity conflicts', value: conflict.length, accent: 'violet', sub: 'need data custodian' })
      ]),
      el('div.chips.mb-12', {}, [chip('all', 'All'), chip('errors', 'Error queue', failed.length + conflict.length), chip('conflict', 'Conflicts', conflict.length), chip('success', 'Success', success.length)]),
      ui.card({ pad: false, body: [ui.table({ columns: [
        { label: 'Job', render: function (j) { return ui.idChip(j.id); } },
        { label: 'System', key: 'system' },
        { label: 'Direction', render: function (j) { return ui.badge(j.direction, 'neutral'); } },
        { label: 'Records', num: true, render: function (j) { return U.num(j.records); } },
        { label: 'Errors', num: true, render: function (j) { return j.errors ? el('b', { text: j.errors, style: { color: 'var(--red-600)' } }) : '0'; } },
        { label: 'Status', render: function (j) { return ui.statusBadge(j.status === 'success' ? 'success' : j.status === 'conflict' ? 'review' : j.status === 'retrying' ? 'pending' : 'rejected', true); } },
        { label: 'Detail', render: function (j) { return el('span.t-xs.t-mut', { text: j.detail }); } },
        { label: 'When', render: function (j) { return U.ago(j.timestamp); } },
        { label: '', render: function (j) { return j.status === 'failed' ? el('button.btn.btn-sm', { onclick: function () { store.actions.retrySync(j.id); ui.toast({ kind: 'success', msg: 'Retried — sync succeeded.' }); } }, '🔁 Retry') : j.status === 'conflict' ? el('button.btn.btn-sm.btn-danger', { onclick: function () { resolveConflict(j); } }, 'Resolve') : el('span.t-xs.t-mut', { text: '—' }); } }
      ], rows: shown })] }),
      ui.note('amber', 'Failed jobs sit in the <b>error queue</b> with exponential-backoff retries. Identity conflicts (same phone, different Contact_ID) are <b>never auto-resolved</b> — they route to the data custodian. API failures, duplicate identities and payment mismatches escalate.', '🔌')
    ]);
  }

  function chip(v, label, count) { return el('div.fchip' + (view === v ? '.active' : ''), { onclick: function () { view = v; store.emit(); } }, label + (count != null ? ' · ' + count : '')); }

  function resolveConflict(j) {
    ui.modal({ title: 'Resolve identity conflict', subtitle: j.system + ' · ' + j.id,
      body: el('div', {}, [
        ui.note('red', 'Same phone resolves to two Contact_IDs. Platform rule: humans decide identity conflicts.', '⚠'),
        el('div.mt-8', {}, [ui.statline('Records affected', j.records), ui.statline('System', j.system), ui.statline('Routed to', 'Data custodian')])
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Send to Dedupe', onClick: function () { App.router.go('/wf006/dedupe'); } }, { label: 'Resolve & merge ID', variant: 'primary', onClick: function () { store.actions.resolveConflict(j.id); ui.toast({ kind: 'success', msg: 'Conflict resolved — identity reconciled & logged.' }); } }]
    });
  }

  return { render: render, title: 'CRM Sync' };
})();
