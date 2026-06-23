/* ============================================================
   Screen: Login / persona selector (mock auth)
   ============================================================ */
App.screens['login'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;

  function render() {
    var s = store.get();
    var personas = s.users;

    var grid = el('div.grid.cols-3', { style: { gap: '12px' } }, personas.map(function (u) {
      var r = s.roles[u.role];
      return el('button.card.card-hover', { style: { textAlign: 'left', padding: '16px', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)' }, onclick: function () { store.actions.login(u.id); App.router.go('/'); } }, [
        el('div.row.gap-10', {}, [
          ui.avatar(u.name, u.id, 40),
          el('div', {}, [
            el('b', { text: u.name, style: { display: 'block', fontSize: '14px' } }),
            el('div.t-xs.t-mut', { text: (r ? r.icon + ' ' : '') + store.roleLabel(u.role) })
          ])
        ]),
        el('div.t-xs.t-mut3.mt-8', { text: (store.dept(u.dept) || {}).name + ' · ' + (store.center(u.center) || {}).short })
      ]);
    }));

    return el('div', { style: { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: 'radial-gradient(1200px 500px at 50% -10%, var(--saffron-50), var(--bg))' } }, [
      el('div', { style: { width: 'min(880px,100%)' } }, [
        el('div.row.gap-12.mb-20', { style: { justifyContent: 'center' } }, [
          el('div.sb-logo', { text: 'ॐ', style: { width: '52px', height: '52px', fontSize: '28px' } }),
          el('div', {}, [
            el('h1', { text: 'HKHT · AI for Seva', style: { fontSize: '28px' } }),
            el('div.t-mut', { text: 'Hyderabad AI Revenue & Seva Growth Platform' })
          ])
        ]),
        ui.card({
          title: 'Choose a persona to sign in',
          icon: '🔐',
          right: [ui.badge('Prototype', 'saffron')],
          body: [
            ui.note('info', 'This is a <b>demonstration prototype</b> with mock data and simulated automation (AI, voice, WhatsApp, ads). Pick any persona — the platform applies that role\'s access, tenant scope and approval rights. You can switch personas any time from the top-right.'),
            el('div.mt-16', {}, grid)
          ]
        }),
        el('div.t-center.t-xs.t-mut3.mt-16', { text: 'WF-006 CRM & Data Governance · WF-002 Voice Agent & Follow-up · WF-003 Digital Marketing — one acquisition-to-conversion loop.' })
      ])
    ]);
  }
  return { render: render, title: 'Sign in' };
})();
