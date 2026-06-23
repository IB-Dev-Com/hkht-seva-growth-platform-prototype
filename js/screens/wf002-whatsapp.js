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
      ui.pageHead('WhatsApp Follow-up', 'Send approved follow-up content and log delivery/replies back to the relationship record. <b>Only approved templates</b> ship in production; opt-outs update CRM consent instantly.', [
        el('button.btn.btn-primary', { onclick: newTemplate }, [el('span.ico', { text: '＋' }), 'New template'])
      ]),
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
    return ui.card({ pad: false, body: [ui.table({ onRow: function (m) { thread(m); }, columns: [
      { label: 'Contact', render: function (m) { return ui.personCell(m.contactName, m.contactId, m.contactId); } },
      { label: 'Template', render: function (m) { return el('span.t-sm', { text: (store.get().waTemplates.find(function (t) { return t.id === m.templateId; }) || {}).name || m.templateId }); } },
      { label: 'Status', render: function (m) { return ui.statusBadge(m.status, true); } },
      { label: 'Link click', render: function (m) { return m.linkClick ? ui.badge('Clicked', 'green') : el('span.t-mut', { text: '—' }); } },
      { label: 'Reply', render: function (m) { return m.reply ? el('span.t-sm', { text: '“' + m.reply + '”' }) : '—'; } },
      { label: 'When', render: function (m) { return U.ago(m.createdAt); } }
    ], rows: msgs, empty: { icon: '📨', title: 'No messages yet', sub: 'Approved follow-ups will appear here.' } })] });
  }

  function thread(m) {
    var tmpl = store.get().waTemplates.find(function (t) { return t.id === m.templateId; }) || {};
    var body = tmpl.body ? tmpl.body.replace('{{name}}', m.contactName).replace('{{amount}}', '11,000').replace('{{link}}', 'hkmhyderabad.org/pay/xyz') : '(template)';
    var bubbles = [{ out: true, text: body, t: m.createdAt }];
    if (m.reply) bubbles.push({ out: false, text: m.reply, t: m.createdAt });
    var reply = 'WA-PAYLINK';
    ui.drawer({ title: m.contactName, subtitle: 'WhatsApp conversation',
      body: [
        el('div.col.gap-8', {}, bubbles.map(function (b) {
          return el('div', { style: { alignSelf: b.out ? 'flex-end' : 'flex-start', maxWidth: '80%', background: b.out ? '#dcf8c6' : 'var(--surface-2)', padding: '8px 11px', borderRadius: '10px', fontSize: '13px' } }, [el('div', { text: b.text }), el('div.t-xs.t-mut3', { style: { textAlign: 'right' }, text: U.fmtTime(b.t) + (b.out ? ' · ' + m.status : '') })]);
        })),
        el('div.mt-16', {}, [el('div.t-up.mb-6', { text: 'Quick reply (approved template)' }), el('div.row.gap-6', {}, [
          el('select.select', { onchange: function (e) { reply = e.target.value; } }, store.get().waTemplates.filter(function (t) { return t.status === 'approved'; }).map(function (t) { return el('option', { value: t.id, text: t.name }); })),
          el('button.btn.btn-primary', { onclick: function () { store.actions.sendWhatsApp(m.contactId, reply); ui.toast({ kind: 'success', msg: 'Reply sent (simulated).' }); } }, 'Send')
        ])])
      ] });
  }

  function newTemplate() {
    var d = { name: '', category: 'Service', body: '' };
    ui.modal({ title: 'New WhatsApp template', subtitle: 'Submitted for approval before production use',
      body: el('div', {}, [
        el('div.field', {}, [el('label', { text: 'Template name' }), el('input.input', { oninput: function (e) { d.name = e.target.value; } })]),
        el('div.field', {}, [el('label', { text: 'Category' }), el('select.select', { onchange: function (e) { d.category = e.target.value; } }, ['Utility', 'Transactional', 'Service', 'Nurture', 'Reminder'].map(function (c) { return el('option', { text: c }); }))]),
        el('div.field', {}, [el('label', { text: 'Body (use {{name}}, {{amount}}, {{link}})' }), el('textarea.textarea', { oninput: function (e) { d.body = e.target.value; } })]),
        ui.note('amber', 'Donor-sensitive / custom templates require approval (content or donor approver) + DLT registration before production.', '🛡️')
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Submit for approval', variant: 'primary', onClick: function () {
        if (!d.name || !d.body) { ui.toast({ kind: 'error', msg: 'Name and body required.' }); return false; }
        var id = U.uid('WA'); store.get().waTemplates.push({ id: id, name: d.name, category: d.category, status: 'pending', body: d.body });
        store.get().approvals.unshift({ id: U.uid('APR'), type: 'WhatsApp template', title: d.name + ' — new template', entity: 'wa_template', entityId: id, requestedBy: store.getSession().userId, approverRole: 'content_reviewer', status: 'pending', priority: 'Medium', createdAt: U.now().toISOString(), slaDue: U.hoursFromNow(24).toISOString(), context: d.category + ' template pending approval + DLT.' });
        store.commit(); ui.toast({ kind: 'success', msg: 'Template submitted for approval.' });
      } }] });
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
