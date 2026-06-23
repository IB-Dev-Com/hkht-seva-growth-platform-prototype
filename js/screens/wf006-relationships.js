/* ============================================================
   Screen: WF-006 Relationship Intelligence (6.7 capture + 6.11 graph)
   "Follow-the-Devotee" relationship graph + journey timeline + NBA
   ============================================================ */
App.screens['wf006-relationships'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;

  function render() {
    var s = store.get();
    var edges = s.relationships;
    var byType = U.group(edges, 'type');

    return el('div', {}, [
      ui.pageHead('Relationship Intelligence', 'The "Follow-the-Devotee" graph — referrer, family and community links that turn isolated contacts into a network. Feeds next-best-action and cross-journey conversion.', [
        el('button.btn.btn-primary', { onclick: captureEdge }, [el('span.ico', { text: '＋' }), 'Capture relationship'])
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '🕸️', label: 'Relationship edges', value: edges.length, accent: 'indigo' }),
        ui.kpi({ icon: '🤝', label: 'Referrer links', value: (byType['Referrer'] || []).length, accent: 'green' }),
        ui.kpi({ icon: '👪', label: 'Family / community', value: (byType['Family'] || []).length + (byType['Community'] || []).length, accent: 'teal' }),
        ui.kpi({ icon: '📈', label: 'Graph coverage', value: '64%', accent: 'violet', sub: 'contacts with ≥1 link' })
      ]),
      el('div.grid', { style: { gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'start' } }, [
        ui.card({ title: 'Relationship network (sample)', icon: '🕸️', body: [graph(edges.slice(0, 9))] }),
        ui.card({ title: 'Next-best-action signals', icon: '✨', body: [
          ui.note('violet', 'Relationship edges seed NBA: a strong referrer who just gave is a prompt to thank + ask for the next introduction.', '✨'),
          el('div.mt-8', {}, edges.slice(0, 5).map(function (e) {
            return el('div', { style: { padding: '9px 0', borderBottom: '1px solid var(--border)' } }, [
              el('div.row.gap-6', {}, [ui.badge(e.type, relColor(e.type)), el('span.t-xs.t-mut', { text: '↔ strength ' + e.strength + '/5' })]),
              el('div.t-sm.mt-2', {}, [el('a', { href: '#/wf006/contact/' + e.from }, e.fromName), ' → ', el('a', { href: '#/wf006/contact/' + e.to }, e.toName)]),
              el('div.t-xs.t-mut', { text: e.note })
            ]);
          }))
        ] })
      ]),
      ui.card({ cls: 'mt-16', title: 'Relationship edges', icon: '🔗', body: [ui.table({ compact: true, columns: [
        { label: 'From', render: function (e) { return el('a', { href: '#/wf006/contact/' + e.from }, e.fromName); } },
        { label: 'Type', render: function (e) { return ui.badge(e.type, relColor(e.type)); } },
        { label: 'To', render: function (e) { return el('a', { href: '#/wf006/contact/' + e.to }, e.toName); } },
        { label: 'Strength', num: true, render: function (e) { return '★'.repeat(e.strength); } },
        { label: 'Note', render: function (e) { return el('span.t-sm.t-mut', { text: e.note }); } }
      ], rows: edges })] })
    ]);
  }

  function relColor(t) { return t === 'Referrer' ? 'green' : t === 'Family' ? 'teal' : t === 'Community' ? 'violet' : 'blue'; }

  // simple radial SVG graph
  function graph(edges) {
    var nodes = {};
    edges.forEach(function (e) { nodes[e.from] = e.fromName; nodes[e.to] = e.toName; });
    var ids = Object.keys(nodes).slice(0, 12);
    var cx = 230, cy = 150, r = 110;
    var pos = {};
    ids.forEach(function (id, i) { var a = (i / ids.length) * Math.PI * 2; pos[id] = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }; });
    var svgns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgns, 'svg');
    svg.setAttribute('viewBox', '0 0 460 300'); svg.setAttribute('width', '100%'); svg.style.maxHeight = '300px';
    edges.forEach(function (e) {
      if (!pos[e.from] || !pos[e.to]) return;
      var line = document.createElementNS(svgns, 'line');
      line.setAttribute('x1', pos[e.from].x); line.setAttribute('y1', pos[e.from].y);
      line.setAttribute('x2', pos[e.to].x); line.setAttribute('y2', pos[e.to].y);
      line.setAttribute('stroke', '#cbd5e1'); line.setAttribute('stroke-width', Math.max(1, e.strength / 2));
      svg.appendChild(line);
    });
    ids.forEach(function (id) {
      var g = document.createElementNS(svgns, 'g');
      var circle = document.createElementNS(svgns, 'circle');
      circle.setAttribute('cx', pos[id].x); circle.setAttribute('cy', pos[id].y); circle.setAttribute('r', 16);
      circle.setAttribute('fill', U.colorFor(id)); circle.style.cursor = 'pointer';
      g.appendChild(circle);
      var t = document.createElementNS(svgns, 'text');
      t.setAttribute('x', pos[id].x); t.setAttribute('y', pos[id].y + 4); t.setAttribute('text-anchor', 'middle');
      t.setAttribute('fill', '#fff'); t.setAttribute('font-size', '9'); t.setAttribute('font-weight', '700');
      t.textContent = U.initials(nodes[id]);
      g.appendChild(t);
      g.addEventListener('click', function () { router.go('/wf006/contact/' + id); });
      svg.appendChild(g);
    });
    return svg;
  }

  function captureEdge() {
    var s = store.get(); var from = s.contacts[0].id, to = s.contacts[1].id, type = 'Referrer', note = '';
    ui.modal({ title: 'Capture relationship', subtitle: 'Link two contacts',
      body: el('div', {}, [
        field('From', sel(s.contacts, function (v) { from = v; }, from)),
        field('Relationship', el('select.select', { onchange: function (e) { type = e.target.value; } }, ['Referrer', 'Family', 'Community', 'Colleague'].map(function (t) { return el('option', { value: t, text: t }); }))),
        field('To', sel(s.contacts, function (v) { to = v; }, to)),
        field('Note', el('input.input', { oninput: function (e) { note = e.target.value; }, placeholder: 'e.g. Introduced at Janmashtami' }))
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Capture', variant: 'primary', onClick: function () {
        var a = store.contact(from), b = store.contact(to);
        store.actions.addRelationship({ id: U.uid('REL'), from: from, fromName: a.name, to: to, toName: b.name, type: type, note: note || '—', strength: 3 });
        ui.toast({ kind: 'success', msg: 'Relationship captured into the graph.' });
      } }]
    });
  }
  function field(label, input) { return el('div.field', {}, [el('label', { text: label }), input]); }
  function sel(contacts, cb, val) { return el('select.select', { onchange: function (e) { cb(e.target.value); } }, contacts.slice(0, 30).map(function (c) { var o = el('option', { value: c.id, text: c.name }); if (c.id === val) o.selected = true; return o; })); }

  return { render: render, title: 'Relationship Intelligence' };
})();
