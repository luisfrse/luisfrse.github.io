/* Tarjetas de estudio · enrutado y arranque */
(function () {
  'use strict';
  const TJ = window.TJ, U = TJ.ui, K = U.K, S = U.S, t = U.t;
  const TABS = ['study', 'cards', 'stats', 'settings'];

  U.route = () => {
    const h = location.hash.replace(/^#\/?/, '').split('/');
    if (h[0] === 'd' && S.decks.has(h[1])) {
      if (h[2] === 'session') return { view: 'session', id: h[1] };
      return { view: 'deck', id: h[1], tab: TABS.includes(h[2]) ? h[2] : 'study' };
    }
    return { view: 'library' };
  };

  let lastKey = '';
  U.render = () => {
    const r = U.route(), key = r.view + (r.id || '') + (r.tab || '');
    if (r.view !== 'session' && S.session) { S.session = null; if (window.speechSynthesis) speechSynthesis.cancel(); }
    const d = r.id && S.decks.get(r.id);
    document.title = (d ? d.name + ' · ' : '') + t('app.title') + ' · Luis Franco Serrano';
    if (r.view === 'library') U.renderLibrary(); else if (r.view === 'deck') U.renderDeck(r); else U.renderSession(r);
    if (key !== lastKey) { window.scrollTo(0, 0); lastKey = key; }
  };

  K.mount({ titleKey: 'app.title' });
  U.load();
  window.addEventListener('hashchange', U.render);
  K.onLang(() => U.render());
  window.addEventListener('beforeunload', () => { if (window.speechSynthesis) speechSynthesis.cancel(); });
  U.render();
})();
