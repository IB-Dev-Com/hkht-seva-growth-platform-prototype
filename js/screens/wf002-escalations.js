/* ============================================================
   Screen: WF-002 Human Escalation & Relationship Handoff
   ============================================================ */
App.screens['wf002-escalations'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;

  function render() {
    var s = store.get();
    var esc = U.sortBy(s.escalations, function (e) { return e.status === 'Resolved' ? 1 : 0; });
    var open = esc.filter(function (e) { return e.status !== 'Resolved'; });

    return el('div', {}, [
      ui.pageHead('Escalations & Relationship Handoff', 'Routes warm, sensitive or high-value opportunities to the right human with a full context pack. <b>The final response and commitment stay with the human owner.</b>', [
        ui.badge(open.length + ' open', 'red')
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '🚨', label: 'Open escalations', value: open.length, accent: 'red' }),
        ui.kpi({ icon: '⏱️', label: 'Avg response time', value: '38 min', accent: 'green', sub: 'SLA 1h' }),
        ui.kpi({ icon: '💎', label: 'High-value involved', value: open.filter(function (e) { return e.priority === 'High'; }).length, accent: 'saffron' }),
        ui.kpi({ icon: '✓', label: 'Resolved', value: esc.filter(function (e) { return e.status === 'Resolved'; }).length, accent: 'green' })
      ]),
      esc.length ? el('div.col.gap-12', {}, esc.map(escCard)) : ui.card({ body: [ui.emptyState({ icon: '✓', title: 'No escalations', sub: 'Sensitive cases will appear here for human handling.' })] })
    ]);
  }

  function escCard(e) {
    var overdue = new Date(e.slaDue) < U.now() && e.status !== 'Resolved';
    return ui.card({ body: [
      el('div.row-between', { style: { flexWrap: 'wrap', gap: '8px' } }, [
        el('div.row.gap-10', {}, [
          ui.avatar(e.contactName, e.contactId, 40),
          el('div', {}, [
            el('div.row.gap-8', {}, [el('b', { text: e.contactName }), ui.badge(e.priority, e.priority === 'High' ? 'red' : 'amber'), e.status !== 'Resolved' ? ui.slaBadge('escalation', e) : null]),
            el('div.t-sm.t-mut.mt-2', { text: e.reason })
          ])
        ]),
        ui.statusBadge(e.status === 'Resolved' ? 'Resolved' : e.status === 'In progress' ? 'In progress' : 'Open')
      ]),
      el('div.grid.mt-12', { style: { gridTemplateColumns: '1fr 1fr', gap: '12px' } }, [
        el('div', {}, [el('div.t-up.mb-4', { text: 'Context pack (AI-prepared)' }), el('div.note.note-info', {}, [el('span.ni', { text: '📄' }), el('div.t-sm', { text: e.context })])]),
        el('div', {}, [el('div.t-up.mb-4', { text: 'Suggested talking points' }), el('ul', { style: { paddingLeft: '4px' } }, e.talkingPoints.map(function (p) { return el('li.row.gap-6.t-sm', { style: { padding: '3px 0' } }, [el('span', { text: '•', style: { color: 'var(--primary)' } }), p]); }))])
      ]),
      el('details', { style: { marginTop: '10px' } }, [el('summary', { style: { cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--accent)' } }, '💬 Discussion (' + (e.comments || []).length + ')'), el('div.mt-8', {}, ui.commentThread('escalation', e.id))]),
      el('div.row.gap-8.mt-16', { style: { alignItems: 'center', flexWrap: 'wrap' } }, [
        el('span.t-xs.t-mut', { text: 'Assigned: ' + (store.user(e.assigneeId) || {}).name }),
        el('div.grow'),
        e.status !== 'Resolved' ? el('button.btn.btn-sm.btn-ghost', { onclick: function () { changePriority(e); } }, '⚑ Priority') : null,
        e.status !== 'Resolved' ? el('button.btn.btn-sm.btn-ghost', { onclick: function () { reassign(e); } }, '↪ Reassign') : null,
        e.callId ? el('a.btn.btn-sm.btn-ghost', { href: '#/wf002/call/' + e.callId }, 'View call') : null,
        el('a.btn.btn-sm.btn-ghost', { href: '#/wf006/contact/' + e.contactId }, 'Open contact'),
        e.status !== 'Resolved' ? el('button.btn.btn-sm.btn-success', { onclick: function () { resolve(e); } }, '✓ Resolve') : el('span.t-xs.t-mut', { text: 'Resolved ' + U.ago(e.resolvedAt) })
      ])
    ] });
  }

  function reassign(e) {
    var sel = e.assigneeId;
    ui.modal({ title: 'Reassign escalation', subtitle: e.contactName, body: el('div.field', {}, [el('label', { text: 'Assignee' }), el('select.select', { onchange: function (ev) { sel = ev.target.value; } }, store.get().users.map(function (u) { var o = el('option', { value: u.id, text: u.name + ' · ' + store.roleLabel(u.role) }); if (u.id === e.assigneeId) o.selected = true; return o; }))]),
      actions: [{ label: 'Cancel' }, { label: 'Reassign', variant: 'primary', onClick: function () { store.actions.reassignEscalation(e.id, sel); ui.toast({ kind: 'success', msg: 'Reassigned & notified.' }); } }] });
  }
  function changePriority(e) {
    var sel = e.priority;
    ui.modal({ title: 'Change priority', subtitle: e.contactName, body: el('div.field', {}, [el('label', { text: 'Priority' }), el('select.select', { onchange: function (ev) { sel = ev.target.value; } }, ['High', 'Medium', 'Low'].map(function (p) { var o = el('option', { value: p, text: p }); if (p === e.priority) o.selected = true; return o; }))]),
      actions: [{ label: 'Cancel' }, { label: 'Save', variant: 'primary', onClick: function () { store.actions.setEscalationPriority(e.id, sel); ui.toast({ kind: 'success', msg: 'Priority updated → ' + sel }); } }] });
  }

  function resolve(e) {
    var note = 'Receipt issued, donor reassured.';
    ui.modal({ title: 'Resolve escalation', subtitle: e.contactName, body: el('div.field', {}, [el('label', { text: 'Resolution note' }), el('textarea.textarea', { oninput: function (ev) { note = ev.target.value; }, text: note })]),
      actions: [{ label: 'Cancel' }, { label: 'Mark resolved', variant: 'success', onClick: function () { store.actions.resolveEscalation(e.id, note); ui.toast({ kind: 'success', msg: 'Escalation resolved & logged.' }); } }] });
  }

  return { render: render, title: 'Escalations' };
})();
