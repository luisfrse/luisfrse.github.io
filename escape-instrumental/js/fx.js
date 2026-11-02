/* Efectes: so (Web Audio, sense fitxers), confeti i vapor. */
(function () {
  'use strict';
  const reduce = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  let ctx = null, on = false, sirenNodes = null;

  function ac() {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctx = new AC(); }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, when, type, vol, slideTo) {
    if (!on) return;
    const c = ac(); if (!c) return;
    const t0 = c.currentTime + (when || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(dur, vol, when, hp) {
    if (!on) return;
    const c = ac(); if (!c) return;
    const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; f.type = 'highpass'; f.frequency.value = hp || 1800;
    const t0 = c.currentTime + (when || 0);
    g.gain.setValueAtTime(vol || 0.08, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(t0);
  }

  const FX = {
    get on() { return on; },
    set(v) {
      on = !!v;
      if (on) ac(); else FX.siren(false);
    },
    click() { tone(520, 0.05, 0, 'square', 0.04); },
    tick() { tone(880, 0.04, 0, 'square', 0.03); },
    buzz() { tone(150, 0.28, 0, 'sawtooth', 0.12); tone(120, 0.28, 0.12, 'sawtooth', 0.1); },
    ok() { tone(660, 0.12, 0, 'triangle', 0.14); tone(990, 0.2, 0.11, 'triangle', 0.14); },
    unlock() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, i * 0.09, 'triangle', 0.14)); noise(0.35, 0.05, 0.25, 4000); },
    finale() {
      noise(1.6, 0.12, 0, 1200);
      [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 0.2 + i * 0.16, 'triangle', 0.15));
    },
    siren(start) {
      if (!start) {
        if (sirenNodes) { try { sirenNodes.o.stop(); sirenNodes.l.stop(); } catch (e) { /* ya parado */ } sirenNodes = null; }
        return;
      }
      if (!on || sirenNodes) return;
      const c = ac(); if (!c) return;
      const o = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
      o.type = 'sawtooth'; o.frequency.value = 620;
      l.type = 'sine'; l.frequency.value = 0.55; lg.gain.value = 190;
      l.connect(lg); lg.connect(o.frequency);
      g.gain.value = 0.025;
      o.connect(g); g.connect(c.destination);
      o.start(); l.start();
      sirenNodes = { o: o, l: l };
    }
  };

  /* Confeti verd i blanc que cau per sobre d'un contenidor */
  FX.confetti = function (host, n) {
    if (reduce() || !host) return;
    const colors = ['#3fe0d0', '#b9fff4', '#ffffff', '#ff4fa0', '#7aa7ff'];
    for (let i = 0; i < (n || 70); i++) {
      const s = document.createElement('span');
      s.className = 'confetti';
      s.style.left = (Math.random() * 100) + '%';
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = (Math.random() * 0.9) + 's';
      s.style.setProperty('--dx', ((Math.random() - 0.5) * 160) + 'px');
      host.appendChild(s);
      setTimeout(() => s.remove(), 4200);
    }
  };

  /* Màquina d'escriure. Retorna una funció per saltar-se l'animació. */
  FX.type = function (el, text, speed, done) {
    if (reduce()) { el.textContent = text; if (done) done(); return function () {}; }
    let i = 0, stop = false, t;
    el.textContent = '';
    (function step() {
      if (stop) return;
      i++;
      el.textContent = text.slice(0, i);
      if (i < text.length) t = setTimeout(step, speed || 16);
      else if (done) done();
    })();
    return function () { stop = true; clearTimeout(t); el.textContent = text; if (done) done(); };
  };

  window.ESC_FX = FX;
})();
