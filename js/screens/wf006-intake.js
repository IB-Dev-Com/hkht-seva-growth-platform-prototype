/* ============================================================
   Screen: WF-006 Intake & Import (validation + DQ score + approval)
   ============================================================ */
App.screens['wf006-intake'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;

  function render() {
    var s = store.get();
    var imports = U.sortBy(s.imports, function (i) { return i.createdAt; }, 'desc');

    return el('div', {}, [
      ui.pageHead('Intake & Import', 'Validate, standardize and score incoming contact data <b>before</b> it enters CRM, campaigns or calling. Production imports require human approval.', [
        el('button.btn.btn-primary', { onclick: simulateUpload }, [el('span.ico', { text: '⬆' }), 'Upload CSV / Sheet'])
      ]),
      ui.note('info', 'Manual fallback: when the CRM API is unavailable, imports run via CSV + manual review here. <b>No manually-captured record bypasses reconciliation</b> — every row is validated, scored and source-tagged.', '📥'),
      el('div.col.gap-12.mt-16', {}, imports.map(importCard))
    ]);
  }

  function importCard(im) {
    var pendingAppr = im.status === 'needs_approval';
    return ui.card({ body: [
      el('div.row-between', { style: { flexWrap: 'wrap', gap: '8px' } }, [
        el('div.row.gap-10', {}, [
          el('div.kpi-ico', { text: store.source(im.source).icon, style: { background: 'var(--accent-soft)' } }),
          el('div', {}, [el('b', { text: im.fileName }), el('div.t-xs.t-mut', { text: im.id + ' · ' + store.source(im.source).label + ' · ' + (store.user(im.uploadedBy) || {}).name + ' · ' + U.ago(im.createdAt) })])
        ]),
        ui.statusBadge(im.status)
      ]),
      el('div.grid.cols-4.mt-12', { style: { gap: '10px' } }, [
        miniStat('Raw rows', im.total, ''),
        miniStat('Valid', im.valid, 'green'),
        miniStat('Duplicates', im.duplicates, 'amber'),
        miniStat('Rejected', im.rejected, 'red')
      ]),
      el('div.row.gap-16.mt-12', { style: { alignItems: 'center' } }, [
        el('div', { style: { flex: 1 } }, [el('div.row-between.t-xs.t-mut.mb-4', {}, [el('span', { text: 'Data quality score' }), el('b', { text: im.dqScore + '/100' })]), ui.bar(im.dqScore, im.dqScore >= 85 ? 'green' : im.dqScore >= 70 ? 'amber' : 'red')])
      ]),
      im.errors && im.errors.length ? el('div.mt-12', {}, [
        el('div.t-up.mb-4', { text: 'Error / missing-field queue' }),
        el('div.col.gap-4', {}, im.errors.map(function (e) { return el('div.row.gap-8.t-xs', {}, [ui.badge('Row ' + e.row, 'neutral'), el('span', { text: e.field + ': ' }), el('span.t-mut', { text: e.issue })]); }))
      ]) : null,
      pendingAppr ? el('div.row.gap-8.mt-16', {}, [
        el('button.btn.btn-success', { onclick: function () { approve(im, 'imported'); } }, [el('span.ico', { text: '✓' }), 'Approve import (' + im.valid + ' records)']),
        el('button.btn', { onclick: function () { approve(im, 'rejected'); } }, [el('span.ico', { text: '✕' }), 'Reject']),
        el('div.grow'),
        im.errors.length ? el('span.t-xs.t-mut3', { text: '⚠ ' + im.errors.length + ' rows need fixing before approval' }) : null
      ]) : el('div.t-xs.t-mut3.mt-12', { text: im.status === 'imported' ? '✓ Imported & reconciled into CRM' : 'Rejected' })
    ] });
  }
  function miniStat(label, val, color) {
    return el('div', { style: { background: 'var(--surface-2)', borderRadius: '9px', padding: '10px' } }, [el('div.t-xs.t-mut', { text: label }), el('div.t-lg.t-bold', { text: U.num(val), style: color ? { color: 'var(--' + color + '-600)' } : null })]);
  }

  function approve(im, status) {
    im.status = status; store.commit();
    // resolve matching approval
    var appr = store.get().approvals.find(function (a) { return a.entityId === im.id && a.status === 'pending'; });
    if (appr) { appr.status = status === 'imported' ? 'approved' : 'rejected'; appr.decisionBy = store.getSession().userId; appr.decisionAt = U.now().toISOString(); store.commit(); }
    ui.toast({ kind: status === 'imported' ? 'success' : 'warn', title: status === 'imported' ? 'Import approved' : 'Import rejected', msg: status === 'imported' ? im.valid + ' records added with source tags & Contact_IDs.' : 'Batch rejected — sent back to uploader.' });
  }

  function simulateUpload() {
    ui.modal({
      title: 'Upload contact data', subtitle: 'CSV / Google Sheet export',
      body: el('div', {}, [
        el('div', { style: { border: '2px dashed var(--border-strong)', borderRadius: '12px', padding: '32px', textAlign: 'center', background: 'var(--surface-2)' } }, [
          el('div', { text: '📄', style: { fontSize: '34px' } }),
          el('div.t-semi.mt-8', { text: 'Drop a CSV here or click to browse' }),
          el('div.t-xs.t-mut.mt-4', { text: 'Mandatory: name, mobile, source. Optional: email, city, language, consent.' })
        ]),
        ui.note('info', 'On upload, the Master Contact Governance Agent validates fields, standardizes phone/email/name/city, enforces mandatory fields, tags source + source-date, scores quality and builds an error queue.', '✨')
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Simulate validation', variant: 'primary', onClick: function () {
        var total = 250 + Math.floor(Math.random() * 300);
        var rejected = Math.floor(total * 0.04), dup = Math.floor(total * 0.05);
        var im = { id: U.uid('IMP'), fileName: 'new_upload_' + Date.now().toString().slice(-4) + '.csv', source: 'website', total: total, valid: total - rejected - dup, rejected: rejected, duplicates: dup, dqScore: 78 + Math.floor(Math.random() * 18), status: 'needs_approval', uploadedBy: store.getSession().userId, createdAt: U.now().toISOString(), errors: [{ row: 12, field: 'mobile', issue: 'Invalid format' }, { row: 40, field: 'source', issue: 'Missing source tag' }] };
        store.get().imports.unshift(im);
        store.get().approvals.unshift({ id: U.uid('APR'), type: 'Bulk import', title: im.fileName + ' — ' + im.valid + ' records', entity: 'import', entityId: im.id, requestedBy: store.getSession().userId, approverRole: 'data_custodian', status: 'pending', priority: 'Medium', createdAt: U.now().toISOString(), slaDue: U.hoursFromNow(24).toISOString(), context: 'New upload validated, awaiting production approval.' });
        store.commit();
        ui.toast({ kind: 'success', title: 'Validated', msg: im.valid + ' valid · ' + im.dqScore + '/100 DQ. Awaiting approval.' });
      } }]
    });
  }

  return { render: render, title: 'Intake & Import' };
})();
