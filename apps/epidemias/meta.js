/* ============================================================
   Motor metapoblacional del simulador de epidemias (sin dependencias).
   - Un modelo SEIR(S) estocástico (saltos tau-leap con semilla) por territorio, con las
     mismas etapas de Erlang, medidas de control, vacunas y estacionalidad que el modelo
     de agentes (EpiCore).
   - Acoplamiento por movilidad: una fracción `mob` de los contactos de cada territorio
     ocurre con residentes de otros territorios, repartida según un modelo gravitatorio
     (población del destino / distancia^γ), y una fracción `air` de contactos de largo
     alcance proporcional a la población de destino (viajes en avión).
   - Misma interfaz básica que EpiSim.Sim (cnt, h, t, step, summary...), para reutilizar gráficos.
   Se usa en el navegador (window.EpiMeta) o en Node (module.exports).
   ============================================================ */
(function (root) {
  'use strict';
  const Core = root.EpiCore || (typeof require !== 'undefined' ? require('./core.js') : null);
  const DT = 0.25, ERL = 3;

  function mulberry(seed) {
    let a = seed >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function gauss(rnd) { let u = 0, v = 0; while (u === 0) u = rnd(); v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2831853 * v); }
  /* binomial aproximada: Poisson si la media es pequeña, normal si es grande */
  function bin(rnd, n, p) {
    if (!(n > 0) || !(p > 0)) return 0;
    if (p >= 1) return n;
    const mu = n * p;
    if (mu < 25) { const L = Math.exp(-mu); let k = 0, pr = 1; do { k++; pr *= rnd(); } while (pr > L && k < 400); return Math.min(n, k - 1); }
    const v = mu * (1 - p), x = Math.round(mu + Math.sqrt(v) * gauss(rnd));
    return x < 0 ? 0 : x > n ? n : x;
  }

  /* territories: [{id, pop, c:[x,y]}], kmPerUnit; opts: {mob, air, gamma, d0} */
  class Meta {
    constructor(P, geo) { this.P = Object.assign({}, P); this.geo = geo; this.n = geo.features.length; this._matrices(); this.reset(); }

    _matrices() {
      const f = this.geo.features, n = this.n, km = this.geo.kmPerUnit || 1, gamma = this.P.gamma || 1.6, d0 = this.P.d0 || 60;
      this.pop = Float64Array.from(f.map(x => Math.max(1, x.pop)));
      this.G = new Float32Array(n * n); this.H = new Float32Array(n * n);
      let tot = 0; for (let i = 0; i < n; i++) tot += this.pop[i];
      for (let i = 0; i < n; i++) {
        let sg = 0, sh = 0;
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const dx = f[i].c[0] - f[j].c[0], dy = f[i].c[1] - f[j].c[1], d = Math.sqrt(dx * dx + dy * dy) * km;
          const w = this.pop[j] / (1 + Math.pow(d / d0, gamma));
          this.G[i * n + j] = w; sg += w; this.H[i * n + j] = this.pop[j]; sh += this.pop[j];
        }
        if (n === 1) continue;
        for (let j = 0; j < n; j++) { this.G[i * n + j] /= sg; this.H[i * n + j] /= sh; }
      }
    }

    setParams(patch) { Object.assign(this.P, patch); this._refresh(); }

    _refresh() {
      const P = this.P;
      const Pe = this.r0m !== 1 ? Object.assign({}, P, { R0: P.R0 * this.r0m }) : P;
      this.d = Core.derive(Pe, this.t);
      this.ctl = Core.controlAt(P, this.t, d => d.id !== 'cordon');
      let cord = 0;
      for (const m of (P.sel || [])) if (m.id === 'cordon' && this.t >= (+m.start || 0) && (!(+m.dur > 0) || this.t < (+m.start || 0) + (+m.dur))) cord = Math.max(cord, m.adh / 100 * 0.85);
      this.cordon = cord;
      this.sea = Core.season(P, this.t);
      this.beta = Pe.R0 * this.ctl.mult * this.sea / this.d.D;
      this.path = P.path || Core.pathOf(null);
      this.cfr0 = P.cfr / 100;
    }

    reset() {
      const P = this.P, n = this.n, rnd = (this.rnd = mulberry(P.seed)); this.r0m = 1; this.escV = 0; this.variantAt = null;
      const A = () => new Float64Array(n);
      this.Su = A(); this.Sv = A(); this.E1 = A(); this.E2 = A(); this.E3 = A(); this.I1 = A(); this.I2 = A(); this.I3 = A();
      this.R = A(); this.Dd = A(); this.cumI = A(); this.vacc = A(); this.first = new Float64Array(n).fill(-1); this.vdone = false;
      this.cumV = A();
      this.N = 0; for (let i = 0; i < n; i++) this.N += this.pop[i];
      const prior = (P.prior || 0) / 100;
      this.vl = Core.vaxList(P);
      for (let i = 0; i < n; i++) { const r0 = Math.round(this.pop[i] * prior); this.R[i] = r0; this.Su[i] = this.pop[i] - r0; }
      this.origin = Math.max(0, this.geo.features.findIndex(x => x.id === P.origin));
      const o = this.origin, sd = Math.min(Math.max(1, Math.round(P.mseeds || 10)), this.Su[o]);
      this.Su[o] -= sd; if (this.d === undefined) { this.t = 0; }
      this.I1[o] = sd; this.cumI[o] = sd; this.first[o] = 0;
      this.t = 0; this.tick = 0; this.acc = 0; this.deaths = 0; this.cum = sd; this.newInf = 0; this.finishedAt = null; this.peak = 0; this.peakDay = 0;
      this._refresh();
      this.cnt = [0, 0, 0, 0, 0, 0]; this._totals();
      this.h = { t: [], S: [], E: [], I: [], R: [], V: [], D: [], inc: [], cum: [], Re: [] };
      this._sample();
    }

    _totals() {
      let s = 0, e = 0, i = 0, r = 0, v = 0, d = 0;
      for (let k = 0; k < this.n; k++) { s += this.Su[k]; v += this.Sv[k]; e += this.E1[k] + this.E2[k] + this.E3[k]; i += this.I1[k] + this.I2[k] + this.I3[k]; r += this.R[k]; d += this.Dd[k]; }
      this.cnt[0] = s; this.cnt[1] = e; this.cnt[2] = i; this.cnt[3] = r; this.cnt[4] = v; this.cnt[5] = d;
    }

    /* cambia el territorio y añade casos (clic en el mapa durante la simulación) */
    introduce(idx, count) {
      if (idx < 0 || idx >= this.n) return -1;
      const k = Math.min(Math.max(1, count || 10), this.Su[idx]); if (!(k > 0)) return -1;
      this.Su[idx] -= k; this.I1[idx] += k; this.cumI[idx] += k; this.cum += k; this.newInf += k; if (this.first[idx] < 0) this.first[idx] = this.t;
      this._totals(); this._sample(true); this.finishedAt = null; return idx;
    }

    /* llega una variante: una fracción esc de la inmunidad (natural y vacunal) se pierde y R0 se multiplica por mult */
    applyVariant(esc, mult, cases) {
      esc = Math.max(0, Math.min(1, esc)); this.r0m *= mult || 1; this.variantAt = this.t;
      for (let i = 0; i < this.n; i++) { const a = Math.round(this.R[i] * esc), b = Math.round(this.Sv[i] * esc); this.R[i] -= a; this.Sv[i] -= b; this.Su[i] += a + b; }
      this._refresh(); this._totals(); if (cases > 0) this.introduce(this.origin, cases); this._sample(true); this.finishedAt = null;
    }

    reNow() {
      let sm = 0; const N = this.N;
      let sg = 0; for (const o of this.vl) sg += o.share * (1 - Core.veAt(o, this.t - (this.tvm || 0)));
      for (let k = 0; k < this.n; k++) sm += this.Su[k] + sg * this.Sv[k];
      return this.P.R0 * this.r0m * this.ctl.mult * this.sea * sm / N;
    }

    _sample(replaceLast) {
      const h = this.h, c = this.cnt, re = this.reNow();
      if (replaceLast && h.t.length && Math.abs(h.t[h.t.length - 1] - this.t) < 1e-9) {
        const k = h.t.length - 1; h.S[k] = c[0]; h.E[k] = c[1]; h.I[k] = c[2]; h.R[k] = c[3]; h.V[k] = c[4]; h.D[k] = c[5]; h.inc[k] += this.newInf; h.cum[k] = this.cum; h.Re[k] = re;
      } else {
        h.t.push(this.t); h.S.push(c[0]); h.E.push(c[1]); h.I.push(c[2]); h.R.push(c[3]); h.V.push(c[4]); h.D.push(c[5]); h.inc.push(this.newInf); h.cum.push(this.cum); h.Re.push(re);
      }
      this.newInf = 0;
      if (c[2] > this.peak) { this.peak = c[2]; this.peakDay = this.t; }
    }

    get limit() { return this.P.days > 0 ? this.P.days : 1095; }
    get finished() {
      if (this.t <= 0) return false;
      if (this.t >= this.limit - 1e-9) return true;
      return this.cnt[1] + this.cnt[2] === 0 && !(this.P.imp > 0) && !(this.P.varOn && this.variantAt === null && this.t < this.P.varDay);
    }

    /* un paso de DT días */
    _tick() {
      const n = this.n, rnd = this.rnd, P = this.P, dt = DT, pop = this.pop;
      if (this.tick % 2 === 0) this._refresh();
      const gam = ERL / this.d.D, L = this.d.L, sig = L > 0 ? ERL / L : 0, pg = 1 - Math.exp(-gam * dt), ps = L > 0 ? 1 - Math.exp(-sig * dt) : 1;
      const wane = this.path.wane > 0 ? 1 - Math.exp(-dt / this.path.wane) : 0;
      const vl = this.vl, vstart = +P.vstart || 0, vperday = (+P.vrate || 0) / 100 / 7, vcov = (P.vacc || 0) / 100 * (1 - (P.prior || 0) / 100);
      const instant = !(vperday > 0);
      if (vl.length && !this.tvmSet) { this.tvm = instant ? vstart : vstart + vcov / vperday / 2; this.tvmSet = true; }
      let sg = 0, sc = 0; if (vl.length) for (const o of vl) { sg += o.share * (1 - Core.veAt(o, this.t - this.tvm)); sc += o.share * o.sevCond; } else sg = 1;
      // prevalencia y mezcla
      const prev = this._prev || (this._prev = new Float64Array(n)), q = this._q || (this._q = new Float64Array(n));
      for (let i = 0; i < n; i++) prev[i] = (this.I1[i] + this.I2[i] + this.I3[i]) / pop[i];
      if (this.cordon > 0) prev[this.origin] *= (1 - this.cordon);
      const m = Math.min(0.6, (P.mob || 0) * (1 - this.ctl.mv)), a = Math.min(0.3, (P.air || 0) * (1 - this.ctl.travel));
      const G = this.G, H = this.H;
      let airMix = 0; if (a > 0) { for (let j = 0; j < n; j++) airMix += prev[j] * pop[j]; }
      for (let i = 0; i < n; i++) {
        let g = 0, hh = 0;
        if (n > 1) {
          if (m > 0) { const row = i * n; for (let j = 0; j < n; j++) g += G[row + j] * prev[j]; }
          if (a > 0) { const row = i * n; for (let j = 0; j < n; j++) hh += H[row + j] * prev[j]; }
        }
        q[i] = (1 - (n > 1 ? m + a : 0)) * prev[i] + m * g + a * hh;
      }
      const sevMix = this.ctl.sev;
      let ninf = 0;
      for (let i = 0; i < n; i++) {
        const lam = this.beta * q[i];
        const pI = 1 - Math.exp(-lam * dt);
        const infU = bin(rnd, this.Su[i], pI), infV = vl.length ? bin(rnd, this.Sv[i], 1 - Math.exp(-lam * sg * dt)) : 0;
        let imp = 0; if (P.imp > 0) imp = bin(rnd, this.Su[i], P.imp / 7 / 1e4 * pop[i] / Math.max(1, this.Su[i] + 1) * (1 - this.ctl.travel) * dt);
        const inf = infU + infV + imp;
        this.Su[i] -= infU + imp; this.Sv[i] -= infV;
        // E y I
        const e3o = bin(rnd, this.E3[i], ps), e2o = bin(rnd, this.E2[i], ps), e1o = bin(rnd, this.E1[i], ps);
        const i3o = bin(rnd, this.I3[i], pg), i2o = bin(rnd, this.I2[i], pg), i1o = bin(rnd, this.I1[i], pg);
        if (L > 0) { this.E1[i] += inf - e1o; this.E2[i] += e1o - e2o; this.E3[i] += e2o - e3o; this.I1[i] += e3o - i1o; }
        else this.I1[i] += inf - i1o;
        this.I2[i] += i1o - i2o; this.I3[i] += i2o - i3o;
        // desenlace: mortalidad con la protección vacunal frente a la muerte (condicionada a la infección) y el antiviral
        const vfrac = (this.cumV[i] > 0 && this.cumI[i] > 0) ? this.cumV[i] / this.cumI[i] : 0;
        const pdeath = Math.min(1, this.cfr0 * sevMix * (1 - vfrac * sc));
        const dth = bin(rnd, i3o, pdeath);
        this.Dd[i] += dth; this.deaths += dth; this.R[i] += i3o - dth;
        const wl = wane > 0 ? bin(rnd, this.R[i], wane) : 0; this.R[i] -= wl; this.Su[i] += wl;
        this.cumI[i] += inf; this.cumV[i] += infV; ninf += inf;
        if (inf > 0 && this.first[i] < 0) this.first[i] = this.t;
      }
      // vacunación
      if (vl.length && this.t >= vstart) {
        if (instant) { if (!this.vdone) { for (let i = 0; i < n; i++) { const mv = Math.round(Math.min(this.Su[i], pop[i] * vcov)); this.Su[i] -= mv; this.Sv[i] += mv; } this.vdone = true; } }
        else { for (let i = 0; i < n; i++) { const want = Math.max(0, pop[i] * vcov - (this.vacc[i])); const mv = Math.min(this.Su[i], want, pop[i] * vperday * dt); this.Su[i] -= mv; this.Sv[i] += mv; this.vacc[i] += mv; } }
      }
      this.cum += ninf; this.newInf += ninf;
      this.tick++; this.t = this.tick * dt;
    }

    step(nTicks) {
      this.acc += nTicks * 0.1;
      while (this.acc >= DT - 1e-9) {
        this.acc -= DT; this._tick(); this._totals();
        if (this.tick % 2 === 0) this._sample();
        if (this.finished) { if (this.finishedAt === null) { this.finishedAt = this.t; this._sample(true); } break; }
      }
    }
    advanceDays(days) { this.step(Math.round(days / 0.1)); }

    summary() {
      const c = this.cnt, N = this.N;
      return { t: this.t, S: c[0], E: c[1], I: c[2], R: c[3], V: c[4], D: c[5], infected: this.cum, attack: this.cum / N, peak: this.peak / N, peakDay: this.peakDay, finished: this.finished, deaths: this.deaths, N };
    }
    /* por territorio: [{i, id, pop, S,E,I,R,V,D, cum, first}] */
    territory(i) {
      return { i, id: this.geo.features[i].id, pop: this.pop[i], S: this.Su[i], V: this.Sv[i], E: this.E1[i] + this.E2[i] + this.E3[i], I: this.I1[i] + this.I2[i] + this.I3[i], R: this.R[i], D: this.Dd[i], cum: this.cumI[i], first: this.first[i] };
    }
    reached() { let c = 0; for (let i = 0; i < this.n; i++) if (this.first[i] >= 0) c++; return c; }
  }
  const api = { Meta, DT, bin };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.EpiMeta = api;
})(typeof window !== 'undefined' ? window : globalThis);
