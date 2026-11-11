/* ============================================================
   Motor de agentes del simulador de epidemias (sin dependencias).
   - Población en un recinto de lado 1 (cuadrado o silueta de un municipio); cada persona
     se mueve al azar y contagia a los susceptibles dentro de un radio de contacto
     (rejilla espacial: coste lineal con el número de agentes).
   - Estados: S, E, I, R, V (vacunado con protección), D.
   - Medidas de control con día de inicio y duración (EpiCore.controlAt), vacunación
     escalonada con fuga y decaimiento, inmunidad natural que decae (SEIRS),
     estacionalidad, inmunidad previa y casos importados.
   Se puede usar en el navegador (window.EpiSim) o en Node (module.exports).
   ============================================================ */
(function (root) {
  'use strict';
  const Core = root.EpiCore || (typeof require !== 'undefined' ? require('./core.js') : null);

  const DT = 0.1;            // días por paso de simulación
  const ERL = 3;             // etapas de Erlang (forma de las duraciones)
  const K = 8;               // vecinos medios dentro del radio de contacto
  const SAMPLE = 5;          // pasos entre muestras del historial (0,5 días)
  const SPEED = 0.35;        // lados del recinto recorridos por día
  const S = 0, E = 1, I = 2, R = 3, V = 4, D = 5;
  const NA = 256, COS = new Float32Array(NA), SIN = new Float32Array(NA);
  for (let i = 0; i < NA; i++) { COS[i] = Math.cos(i / NA * 6.2831853); SIN[i] = Math.sin(i / NA * 6.2831853); }

  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function erlang(rnd, mean) {
    if (!(mean > 0)) return 0;
    let p = 1;
    for (let i = 0; i < ERL; i++) p *= 1 - rnd();
    return -mean / ERL * Math.log(p);
  }

  /* máscara raster de una silueta: { n, data:Uint8Array(n*n), frac } con el polígono ya normalizado a [0,1]² */
  function makeDomain(n, data) { let c = 0; for (let i = 0; i < data.length; i++) c += data[i]; return { n, data, frac: c / data.length }; }

  function gammaMean1(rnd, k) {          // gamma(k, 1/k): media 1 y varianza 1/k (Marsaglia-Tsang)
    const kk = k < 1 ? k + 1 : k, d = kk - 1 / 3, c = 1 / Math.sqrt(9 * d);
    let x;
    for (;;) {
      const u = rnd() || 1e-9, v = rnd(), z = Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2831853 * v);
      let w = 1 + c * z;
      if (w <= 0) continue; w = w * w * w; const uu = rnd() || 1e-9;
      if (Math.log(uu) < 0.5 * z * z + d - d * w + d * Math.log(w)) { x = d * w; break; }
    }
    if (k < 1) x *= Math.pow(rnd() || 1e-9, 1 / k);
    return x / k;
  }

  class Sim {
    constructor(P, opts) { this.P = Object.assign({}, P); this.dom = (opts && opts.domain) || null; this.reset(); }

    setParams(patch) { Object.assign(this.P, patch); this._refresh(true); }

    _refresh(force) {
      const P = this.P, t = this.t;
      const Pe = this.r0m !== 1 ? Object.assign({}, P, { R0: P.R0 * this.r0m }) : P;
      this.d = Core.derive(Pe, t);
      this.ctl = this.d.ctl;
      this.sea = Core.season(P, t);
      this.beta = Pe.R0 * this.ctl.Mroute * this.sea / (this.d.D * this.Kreal);
      this.mv = 1 - 0.85 * this.ctl.mv;
      this.cfr0 = P.cfr / 100;
      this.path = P.path || Core.pathOf(null);
    }

    _inside(x, y) {
      if (!this.dom) return x >= 0 && x <= 1 && y >= 0 && y <= 1;
      if (x < 0 || y < 0 || x >= 1 || y >= 1) return false;
      const n = this.dom.n; return this.dom.data[((y * n) | 0) * n + ((x * n) | 0)] === 1;
    }

    reset() {
      const P = this.P, N = Math.max(10, Math.round(P.N));
      this.N = N; this.rnd = mulberry(P.seed); this.r0m = 1; this.escV = 0; this.variantAt = null;
      const rnd = this.rnd;
      this.x = new Float32Array(N); this.y = new Float32Array(N); this.ai = new Uint8Array(N);
      this.st = new Uint8Array(N); this.timer = new Float32Array(N); this.tI = new Float32Array(N); this.isoAt = new Float32Array(N);
      this.iso = new Uint8Array(N); this.vi = new Uint8Array(N); this.tv = new Float32Array(N).fill(Infinity); this.sus = new Float32Array(N).fill(1);
      this.mult = new Float32Array(N).fill(1); this.dp = new Float32Array(N); this.tw = new Float32Array(N).fill(Infinity); this.vday = new Float32Array(N);
      const area = this.dom ? this.dom.frac : 1;
      this.r = Math.sqrt(K * area / (Math.PI * N));
      this.gn = Math.max(1, Math.floor(1 / this.r)); this.cs = 1 / this.gn;
      this.head = new Int32Array(this.gn * this.gn + 1); this.items = new Int32Array(N); this.cell = new Int32Array(N);
      this.fill = new Int32Array(this.gn * this.gn); this.inf = new Int32Array(N);
      this.t = 0; this.ticks = 0; this.cnt = [N, 0, 0, 0, 0, 0];
      this.cum = 0; this.newInf = 0; this.finishedAt = null; this.deaths = 0;
      for (let i = 0; i < N; i++) {
        let px, py, g = 0;
        do { px = rnd(); py = rnd(); g++; } while (!this._inside(px, py) && g < 400);
        this.x[i] = px; this.y[i] = py; this.ai[i] = (rnd() * NA) | 0;
      }
      // contactos medios reales (la silueta y los bordes reducen K)
      this.Kreal = K; this._calibrate();
      this.vl = Core.vaxList(P); this.vaxed = [];
      const wane = (P.path && P.path.wane) || 0;
      // inmunidad previa (R)
      const order = new Int32Array(N); for (let i = 0; i < N; i++) order[i] = i;
      for (let i = N - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
      const nPrior = Math.round((P.prior || 0) / 100 * N);
      for (let k = 0; k < nPrior; k++) { const i = order[k]; this.st[i] = R; this.cnt[S]--; this.cnt[R]++; if (wane > 0) this.tw[i] = -wane * Math.log(1 - rnd()); }
      // plan de vacunación: nVac personas con día de vacunación escalonado
      if (this.vl.length) {
        const nVac = Math.round((P.vacc || 0) / 100 * (N - nPrior)), vstart = +P.vstart || 0, perDay = (+P.vrate || 0) / 100 / 7 * N;
        for (let k = 0; k < nVac; k++) {
          const i = order[nPrior + k]; let u = rnd(), c = 0, vk = 0;
          for (let q = 0; q < this.vl.length; q++) { c += this.vl[q].share; if (u < c) { vk = q; break; } vk = q; }
          this.vi[i] = vk + 1;
          this.tv[i] = perDay > 0 ? vstart + k / perDay : vstart;
        }
      }
      this.beta = 0; this._refresh();
      this._vaccinate();
      // casos iniciales (infecciosos) entre los susceptibles
      const cand = []; for (let i = 0; i < N; i++) if (this.st[i] === S || this.st[i] === V) cand.push(i);
      const ns = Math.min(Math.round(P.seeds), cand.length);
      for (let k = 0; k < ns; k++) { const j = k + Math.floor(rnd() * (cand.length - k)); const tmp = cand[k]; cand[k] = cand[j]; cand[j] = tmp; this._toInfectious(cand[k]); this.cum++; }
      this.h = { t: [], S: [], E: [], I: [], R: [], V: [], D: [], inc: [], cum: [], Re: [] };
      this.peak = 0; this.peakDay = 0;
      this._sample();
    }

    /* vecinos medios dentro del radio, medidos en una muestra de agentes */
    _calibrate() {
      const N = this.N, x = this.x, y = this.y, r2 = this.r * this.r, gn = this.gn, cs = this.cs;
      const cells = new Map(), key = (cx, cy) => cy * gn + cx;
      for (let i = 0; i < N; i++) { const k = key(Math.min(gn - 1, (x[i] / cs) | 0), Math.min(gn - 1, (y[i] / cs) | 0)); let a = cells.get(k); if (!a) cells.set(k, a = []); a.push(i); }
      const m = Math.min(N, 300), step = Math.max(1, Math.floor(N / m)); let tot = 0, n = 0;
      for (let i = 0; i < N; i += step) {
        const cx = Math.min(gn - 1, (x[i] / cs) | 0), cy = Math.min(gn - 1, (y[i] / cs) | 0);
        for (let gy = Math.max(0, cy - 1); gy <= Math.min(gn - 1, cy + 1); gy++) for (let gx = Math.max(0, cx - 1); gx <= Math.min(gn - 1, cx + 1); gx++) {
          const a = cells.get(key(gx, gy)); if (!a) continue;
          for (const j of a) if (j !== i) { const dx = x[j] - x[i], dy = y[j] - y[i]; if (dx * dx + dy * dy < r2) tot++; }
        }
        n++;
      }
      this.Kreal = Math.max(1, tot / n);
    }

    _toInfectious(i) {
      const st = this.st, d = this.d, k = this.ctl.kinds, rnd = this.rnd, path = this.path, D = d.D;
      this.cnt[st[i]]--; st[i] = I; this.cnt[I]++;
      this.timer[i] = erlang(rnd, D); this.tI[i] = 0; this.iso[i] = 0;
      let at = Infinity;
      const sym = rnd() >= path.asym, onset = path.pre * D;
      if (k.iso > 0 && sym && rnd() < k.iso) at = Math.min(at, onset * (0.6 + 0.8 * rnd()) + 1);
      if (k.quar > 0 && rnd() < k.quar * (Core.QUAR_BASE + (Core.QUAR_FULL - Core.QUAR_BASE) * k.trace)) at = Math.min(at, onset + Core.QUAR_DELAY);
      if (k.test > 0 && rnd() < k.test * Core.TEST_REACH) at = Math.min(at, -Core.TEST_DELAY * Math.log(1 - rnd()));
      this.isoAt[i] = at;
      const kd = +this.P.kdisp; this.mult[i] = kd > 0 ? gammaMean1(rnd, kd) : 1;
      let c = this.cfr0 * this.ctl.sev;
      if (this.vi[i]) c *= 1 - this.vl[this.vi[i] - 1].sevCond;
      this.dp[i] = Math.min(1, c);
    }
    _infect(j) {
      this.cnt[this.st[j]]--; this.cum++; this.newInf++;
      if (this.d.L > 0) { this.st[j] = E; this.cnt[E]++; this.timer[j] = erlang(this.rnd, this.d.L); }
      else { this.cnt[S]++; this.st[j] = S; this._toInfectious(j); }
    }

    /* vacunación pendiente, decaimiento de la protección y actualización de estados S/V */
    _vaccinate() {
      const t = this.t, N = this.N, vl = this.vl;
      if (!vl.length) return;
      for (let i = 0; i < N; i++) {
        const q = this.vi[i]; if (!q) continue;
        if (this.tv[i] <= t) {
          const o = vl[q - 1], ve = Core.veAt(o, t - this.tv[i]) * (1 - this.escV);
          this.sus[i] = 1 - ve;
          const s = this.st[i];
          if (s === S && ve >= 0.3) { this.st[i] = V; this.cnt[S]--; this.cnt[V]++; }
          else if (s === V && ve < 0.3) { this.st[i] = S; this.cnt[V]--; this.cnt[S]++; }
        }
      }
    }

    /* introduce un caso en el susceptible más cercano al punto (x,y); devuelve su índice o -1 */
    introduce(px, py) {
      let best = -1, bd = Infinity;
      for (let i = 0; i < this.N; i++) { const s = this.st[i]; if (s === S || s === V) { const dx = this.x[i] - px, dy = this.y[i] - py, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = i; } } }
      if (best >= 0) { this._infect(best); this._sample(true); this.finishedAt = null; }
      return best;
    }

    /* llega una variante: una fracción esc de los recuperados y de la protección vacunal se pierde y R0 se multiplica por mult */
    applyVariant(esc, mult, cases) {
      esc = Math.max(0, Math.min(1, esc)); this.r0m *= mult || 1; this.escV = 1 - (1 - this.escV) * (1 - esc); this.variantAt = this.t;
      const st = this.st, rnd = this.rnd;
      for (let i = 0; i < this.N; i++) if (st[i] === R && rnd() < esc) { st[i] = S; this.cnt[R]--; this.cnt[S]++; this.tw[i] = Infinity; }
      this._vaccinate(); this._refresh();
      const cand = []; for (let i = 0; i < this.N; i++) if (st[i] === S || st[i] === V) cand.push(i);
      for (let k = 0, m = Math.min(Math.max(0, Math.round(cases || 0)), cand.length); k < m; k++) { const j = k + Math.floor(rnd() * (cand.length - k)); const tmp = cand[k]; cand[k] = cand[j]; cand[j] = tmp; this._infect(cand[k]); }
      this._sample(true); this.finishedAt = null;
    }

    /* factor de susceptibilidad medio (para R efectivo) */
    reNow() {
      let sm = this.cnt[S]; const N = this.N;
      if (this.cnt[V] > 0) { for (let i = 0; i < N; i++) if (this.st[i] === V) sm += this.sus[i]; }
      return this.P.R0 * this.r0m * this.ctl.mult * this.sea * sm / N;
    }

    _sample(replaceLast) {
      const h = this.h, c = this.cnt;
      const re = this.reNow();
      if (replaceLast && h.t.length && Math.abs(h.t[h.t.length - 1] - this.t) < 1e-9) {
        const k = h.t.length - 1;
        h.S[k] = c[S]; h.E[k] = c[E]; h.I[k] = c[I]; h.R[k] = c[R]; h.V[k] = c[V]; h.D[k] = c[D]; h.inc[k] += this.newInf; h.cum[k] = this.cum; h.Re[k] = re;
      } else {
        h.t.push(this.t); h.S.push(c[S]); h.E.push(c[E]); h.I.push(c[I]); h.R.push(c[R]); h.V.push(c[V]); h.D.push(c[D]); h.inc.push(this.newInf); h.cum.push(this.cum); h.Re.push(re);
      }
      this.newInf = 0;
      if (c[I] > this.peak) { this.peak = c[I]; this.peakDay = this.t; }
    }

    get limit() { return this.P.days > 0 ? this.P.days : 1095; }
    get finished() {
      if (this.t <= 0) return false;
      if (this.t >= this.limit - 1e-9) return true;
      return this.cnt[E] + this.cnt[I] === 0 && !(this.P.imp > 0) && !this._pendingVax() && !(this.P.varOn && this.variantAt === null && this.t < this.P.varDay);
    }
    _pendingVax() { return false; }

    tick() {
      const N = this.N, rnd = this.rnd, st = this.st, x = this.x, y = this.y, ai = this.ai, dt = DT;
      const dom = this.dom;
      // control, estacionalidad y vacunación: cada medio día
      if (this.ticks % 5 === 0) {
        this.P.t = this.t; this._refresh();
        if (this.vl.length && this.ticks % 10 === 0) this._vaccinate();
      }
      // movimiento
      const stepLen = SPEED * this.mv * dt, iso = this.iso;
      for (let i = 0; i < N; i++) {
        if (st[i] === D || iso[i]) continue;
        let a = (ai[i] + ((rnd() * 28) | 0) - 14) & 255; ai[i] = a;
        const nx = x[i] + COS[a] * stepLen, ny = y[i] + SIN[a] * stepLen;
        if (dom ? this._inside(nx, ny) : (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1)) { x[i] = nx; y[i] = ny; }
        else ai[i] = (a + 128 + ((rnd() * 60) | 0) - 30) & 255;
      }
      // contagio
      if (this.cnt[I] > 0 && this.cnt[S] + this.cnt[V] > 0) {
        const gn = this.gn, cs = this.cs, head = this.head, items = this.items, cell = this.cell, fill = this.fill;
        head.fill(0);
        for (let i = 0; i < N; i++) { const s = st[i]; if (s === S || s === V) { const c = Math.min(gn - 1, (y[i] / cs) | 0) * gn + Math.min(gn - 1, (x[i] / cs) | 0); cell[i] = c; head[c + 1]++; } }
        for (let c = 0; c < gn * gn; c++) head[c + 1] += head[c];
        fill.fill(0);
        for (let i = 0; i < N; i++) { const s = st[i]; if (s === S || s === V) { const c = cell[i]; items[head[c] + fill[c]++] = i; } }
        const r2 = this.r * this.r, base = this.beta * dt, sus = this.sus, inf = this.inf;
        let ni = 0; for (let i = 0; i < N; i++) if (st[i] === I) inf[ni++] = i;
        for (let n = 0; n < ni; n++) {
          const i = inf[n], fi = (iso[i] ? this.LEAK : 1) * base * this.mult[i];
          const cx = Math.min(gn - 1, (x[i] / cs) | 0), cy = Math.min(gn - 1, (y[i] / cs) | 0);
          for (let gy = Math.max(0, cy - 1); gy <= Math.min(gn - 1, cy + 1); gy++) {
            for (let gx = Math.max(0, cx - 1); gx <= Math.min(gn - 1, cx + 1); gx++) {
              const c = gy * gn + gx;
              for (let k = head[c], end = head[c + 1]; k < end; k++) {
                const j = items[k], sj = st[j];
                if (sj !== S && sj !== V) continue;
                const dx = x[j] - x[i], dy = y[j] - y[i];
                if (dx * dx + dy * dy < r2 && rnd() < 1 - Math.exp(-fi * sus[j])) this._infect(j);
              }
            }
          }
        }
      }
      // casos importados
      if (this.P.imp > 0) {
        const rate = this.P.imp / 7 * N / 1e4 * dt * (1 - this.ctl.travel);
        if (rnd() < rate) { const j = Math.floor(rnd() * N); if (st[j] === S || st[j] === V) this._infect(j); }
      }
      // evolución de E, I y pérdida de la inmunidad natural
      const wane = this.path.wane > 0, tNow = this.t;
      for (let i = 0; i < N; i++) {
        const s = st[i];
        if (s === E) {
          this.timer[i] -= dt;
          if (this.timer[i] <= 0) this._toInfectious(i);
        } else if (s === I) {
          this.tI[i] += dt; this.timer[i] -= dt;
          if (!iso[i] && this.tI[i] >= this.isoAt[i]) iso[i] = 1;
          if (this.timer[i] <= 0) {
            this.cnt[I]--; iso[i] = 0;
            if (rnd() < this.dp[i]) { st[i] = D; this.cnt[D]++; this.deaths++; }
            else {
              st[i] = R; this.cnt[R]++;
              if (wane) this.tw[i] = tNow - this.path.wane * Math.log(1 - rnd());
            }
          }
        } else if (s === R && wane && this.tw[i] <= tNow) {
          st[i] = S; this.cnt[R]--; this.cnt[S]++; this.tw[i] = Infinity;
          if (this.vi[i] && this.tv[i] <= tNow) { const ve = Core.veAt(this.vl[this.vi[i] - 1], tNow - this.tv[i]) * (1 - this.escV); this.sus[i] = 1 - ve; if (ve >= 0.3) { st[i] = V; this.cnt[S]--; this.cnt[V]++; } }
        }
      }
      this.ticks++; this.t = this.ticks * dt;
      if (this.ticks % SAMPLE === 0) this._sample();
      if (this.finished && this.finishedAt === null) { this.finishedAt = this.t; this._sample(true); }
    }

    step(n) { for (let k = 0; k < n; k++) { this.tick(); if (this.finished) break; } }
    advanceDays(days) { this.step(Math.round(days / DT)); }

    summary() {
      const c = this.cnt, N = this.N;
      return { t: this.t, S: c[S], E: c[E], I: c[I], R: c[R], V: c[V], D: c[D], infected: this.cum, attack: this.cum / N, peak: this.peak / N, peakDay: this.peakDay, finished: this.finished, deaths: this.deaths, N };
    }
  }
  Sim.prototype.LEAK = Core ? Core.LEAK : 0.05;

  const api = { Sim, derive: Core.derive, finalSize: Core.finalSize, seir: Core.seir, makeDomain, DT, K, ERL, SAMPLE, S, E, I, R, V, D, mulberry };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.EpiSim = api;
})(typeof window !== 'undefined' ? window : globalThis);
