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
    var diff = [['Name', 'Ravi Teja Gupta', 'Ravi T Gupta', 'A'], ['Mobile', '+91 98480 21455', '+91 98480 21455', '='], ['Email', 'ravi.teja@gmail.com', 'rtgupta@yahoo.in', 'A'], ['City', 'Gachibowli', 'Hyderabad', 'A'], ['Source', 'meta_ads', 'helloleads', 'A']];
    var pick = {}; diff.forEach(function (d, i) { pick[i] = d[3] === '=' ? 'CRM' : 'CRM'; });
    ui.modal({ title: 'Resolve identity conflict — field diff', subtitle: j.system + ' · ' + j.id, size: 'lg',
      body: el('div', {}, [
        ui.note('red', 'Same phone resolves to two Contact_IDs. Pick the surviving value per field; platform rule: humans decide identity conflicts (never auto).', '⚠'),
        ui.table({ compact: true, columns: [
          { label: 'Field', render: function (d) { return el('b.t-sm', { text: d[0] }); } },
          { label: 'CRM record', render: function (d, i) { return el('label.row.gap-6', { style: { cursor: d[3] === '=' ? 'default' : 'pointer' } }, [d[3] !== '=' ? el('input', { type: 'radio', name: 'cf' + i, checked: pick[i] === 'CRM' ? true : null, onchange: function () { pick[i] = 'CRM'; } }) : null, el('span.t-sm', { text: d[1] })]); } },
          { label: 'Incoming', render: function (d, i) { return d[3] === '=' ? el('span.t-xs.t-mut', { text: 'same' }) : el('label.row.gap-6', { style: { cursor: 'pointer' } }, [el('input', { type: 'radio', name: 'cf' + i, onchange: function () { pick[i] = 'IN'; } }), el('span.t-sm', { text: d[2] })]); } },
          { label: '', render: function (d) { return d[3] === '=' ? ui.badge('match', 'green') : ui.badge('differs', 'amber'); } }
        ], rows: diff }),
        el('div.mt-12', {}, [el('div.t-up.mb-4', { text: 'Retry / sync policy' }), el('div.row.gap-16.t-sm.t-mut', {}, [el('span', { text: 'Retries: 3' }), el('span', { text: 'Backoff: exponential' }), el('span', { text: 'Alert-on-fail: data custodian' })])])
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Send to Dedupe', onClick: function () { App.router.go('/wf006/dedupe'); } }, { label: 'Resolve & merge ID', variant: 'primary', onClick: function () { store.actions.resolveConflict(j.id); ui.toast({ kind: 'success', msg: 'Conflict resolved with field choices — identity reconciled & logged.' }); } }]
    });
  }

  return { render: render, title: 'CRM Sync' };
})();
