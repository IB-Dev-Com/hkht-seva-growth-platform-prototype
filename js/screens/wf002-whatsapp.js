/* ============================================================
   Screen: WF-002 WhatsApp Follow-up (templates + delivery log)
   ============================================================ */
App.screens['wf002-whatsapp'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;
  var tab = 'log';

  function render() {
    var s = store.get();
    var msgs = U.sortBy(s.whatsapp, function (m) { return m.createdAt; }, 'desc');
    var delivered = msgs.filter(function (m) { return ['delivered', 'read', 'replied'].indexOf(m.status) > -1; }).length;
    var replied = msgs.filter(function (m) { return m.status === 'replied'; }).length;
    var optOut = msgs.filter(function (m) { return m.optOut; }).length;

    var tabsBar = ui.tabs([{ id: 'log', label: 'Delivery log', icon: '📨', count: msgs.length }, { id: 'templates', label: 'Template inventory', icon: '📝', count: s.waTemplates.length }, { id: 'governance', label: 'Governance register', icon: '🛡️' }], tab, function (t) { tab = t; store.emit(); });

    var body = tab === 'log' ? logView(msgs) : tab === 'templates' ? templatesView(s.waTemplates) : governanceView(s, msgs);

    return el('div', {}, [
      ui.pageHead('WhatsApp Follow-up', 'Send approved follow-up content and log delivery/replies back to the relationship record. <b>Only approved templates</b> ship in production; opt-outs update CRM consent instantly.', null),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '📨', label: 'Messages sent', value: msgs.length, accent: 'indigo' }),
        ui.kpi({ icon: '✓', label: 'Delivery rate', value: msgs.length ? Math.round(delivered / msgs.length * 100) + '%' : '—', accent: 'green' }),
        ui.kpi({ icon: '💬', label: 'Reply rate', value: msgs.length ? Math.round(replied / msgs.length * 100) + '%' : '—', accent: 'teal' }),
        ui.kpi({ icon: '🚫', label: 'Opt-outs', value: optOut, accent: 'amber' })
      ]),
      tabsBar, body
    ]);
  }

  function logView(msgs) {
    return ui.card({ pad: false, body: [ui.table({ columns: [
      { label: 'Contact', render: function (m) { return ui.personCell(m.contactName, m.contactId, m.contactId); } },
      { label: 'Template', render: function (m) { return el('span.t-sm', { text: (store.get().waTemplates.find(function (t) { return t.id === m.templateId; }) || {}).name || m.templateId }); } },
      { label: 'Status', render: function (m) { return ui.statusBadge(m.status, true); } },
      { label: 'Link click', render: function (m) { return m.linkClick ? ui.badge('Clicked', 'green') : el('span.t-mut', { text: '—' }); } },
      { label: 'Reply', render: function (m) { return m.reply ? el('span.t-sm', { text: '“' + m.reply + '”' }) : '—'; } },
      { label: 'When', render: function (m) { return U.ago(m.createdAt); } }
    ], rows: msgs, empty: { icon: '📨', title: 'No messages yet', sub: 'Approved follow-ups will appear here.' } })] });
  }

  function templatesView(templates) {
    return el('div.grid.cols-2', {}, templates.map(function (t) {
      return ui.card({ body: [
        el('div.row-between.mb-8', {}, [el('div.row.gap-8', {}, [el('b', { text: t.name }), ui.badge(t.category, 'neutral')]), ui.statusBadge(t.status)]),
        el('div', { style: { background: '#e7f7ed', borderRadius: '10px', padding: '12px', borderLeft: '3px solid var(--green-500)', fontSize: '12.5px', lineHeight: 1.5 } }, t.body),
        el('div.row.gap-6.mt-8', {}, [ui.idChip(t.id), t.status === 'pending' ? el('span.t-xs.t-mut', { text: '· awaiting donor approver' }) : null])
      ] });
    }));
  }

  function governanceView(s, msgs) {
    var optOuts = msgs.filter(function (m) { return m.optOut; }).length + s.suppression.filter(function (x) { return x.type === 'Opt-out'; }).length;
    return el('div', {}, [
      ui.note('info', 'Single template inventory with one governance register — every message mapped to owner, purpose, category and fallback. Opt-out updates CRM consent; suppressed contacts are never messaged; rejected templates require fallback wording.', '🛡️'),
      el('div.grid.cols-4.mt-12.mb-16', {}, [
        ui.kpi({ icon: '📋', label: 'Provider', value: 'Interakt', accent: 'green', sub: 'BSP · Cloud API' }),
        ui.kpi({ icon: '🆔', label: 'DLT registration', value: 'Pending', accent: 'amber', sub: 'entity in progress' }),
        ui.kpi({ icon: '🚫', label: 'Opt-outs honoured', value: optOuts, accent: 'red' }),
        ui.kpi({ icon: '📶', label: 'Rate-limit headroom', value: '78%', accent: 'green' })
      ]),
      ui.card({ pad: false, body: [ui.table({ columns: [
        { label: 'Template', render: function (t) { return el('b.t-sm', { text: t.name }); } },
        { label: 'Category', render: function (t) { return ui.badge(t.category, 'neutral'); } },
        { label: 'Purpose', render: function (t) { return el('span.t-xs.t-mut', { text: t.body.slice(0, 60) + '…' }); } },
        { label: 'DLT / approval', render: function (t) { return ui.statusBadge(t.status); } },
        { label: 'Fallback', render: function (t) { return el('span.t-xs', { text: t.status === 'approved' ? 'SMS fallback wording' : 'Manual owner review' }); } },
        { label: 'Owner', render: function () { return (store.user('U-DEEPAK') || {}).name; } }
      ], rows: s.waTemplates })] }),
      ui.note('amber', 'High-volume sends require delivery monitoring; a rejected template blocks send until fallback wording is owner-approved. Report cadence: messages sent, delivery/read, reply rate, opt-out count, conversion-from-message.', '📊')
    ]);
  }

  return { render: render, title: 'WhatsApp Follow-up' };
})();
