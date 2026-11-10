/* ============================================================
   Motor del simulador de epidemias (sin dependencias).
   - Modelo de agentes: población en un recinto cuadrado de lado 1; cada persona se
     mueve al azar y puede contagiar a las personas susceptibles que estén dentro de
     un radio de contacto. Estados: S, E, I, R, V (protegido por vacuna), D.
   - Modelo determinista SEIR con etapas de Erlang (misma distribución de duraciones).
   - Teoría: R efectivo, umbral de inmunidad de grupo y tamaño final de la epidemia.
   Se puede usar en el navegador (window.EpiSim) o en Node (module.exports).
   ============================================================ */
(function (root) {
  'use strict';

  const DT = 0.1;            // días por paso de simulación
  const ERL = 3;             // etapas de Erlang (forma de las duraciones)
  const K = 8;               // vecinos medios dentro del radio de contacto
  const SAMPLE = 5;          // pasos entre muestras del historial (0,5 días)
  const SPEED = 0.35;        // lados del recinto recorridos por día
  const MASK_I = 0.35;       // reducción del contagio si el infeccioso lleva mascarilla
  const MASK_S = 0.20;       // reducción si el susceptible lleva mascarilla
  const ISO_LEAK = 0.05;     // contagio residual de un caso aislado
  const ISO_DELAY = 1;       // días hasta aislar a un caso (si se aísla)
  const S = 0, E = 1, I = 2, R = 3, V = 4, D = 5;

  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  /* duración Erlang-k con media dada */
  function erlang(rnd, mean) {
    if (!(mean > 0)) return 0;
    let p = 1;
    for (let i = 0; i < ERL; i++) p *= 1 - rnd();
    return -mean / ERL * Math.log(p);
  }

  /* ---------- magnitudes derivadas / teoría ---------- */
  function derive(P) {
    const Dd = Math.max(0.1, P.infect), L = Math.max(0, P.latent);
    const m = P.mask / 100, q = P.quar / 100, dist = P.dist / 100, vac = P.vacc / 100, eff = P.eff / 100;
    const maskMult = (1 - MASK_I * m) * (1 - MASK_S * m);
    const delay = Math.min(ISO_DELAY, Dd);
    const isoFactor = (1 - q) + q * (delay + ISO_LEAK * (Dd - delay)) / Dd;
    const distMult = 1 - dist;
    const R0eff = P.R0 * distMult * maskMult * isoFactor;     // con medidas, población sin inmunidad
    const prot = vac * eff;                                    // fracción protegida por la vacuna
    const s0 = 1 - prot;
    return {
      D: Dd, L, m, q, dist, vac, eff, maskMult, isoFactor, distMult, R0eff, prot, s0,
      hit: P.R0 > 1 ? 1 - 1 / P.R0 : 0,                       // umbral de inmunidad de grupo (R0 base)
      hitEff: R0eff > 1 ? 1 - 1 / R0eff : 0,                   // umbral con las medidas actuales
      cover: eff > 0 ? (P.R0 > 1 ? Math.min(Infinity, (1 - 1 / P.R0) / eff) : 0) : Infinity,   // cobertura necesaria
      coverEff: eff > 0 ? (R0eff > 1 ? (1 - 1 / R0eff) / eff : 0) : Infinity,
      cfr: P.cfr / 100
    };
  }

  /* tamaño final: z = s0 (1 − exp(−R0eff z)), fracción de la población infectada durante el brote */
  function finalSize(R0eff, s0) {
    if (R0eff * s0 <= 1) return 0;
    let z = s0;
    for (let i = 0; i < 500; i++) z = s0 * (1 - Math.exp(-R0eff * z));
    return z;
  }

  /* ---------- modelo determinista SEIR (etapas de Erlang) ---------- */
  function seir(P, N, horizon) {
    horizon = horizon || 365;
    const d = derive(P);
    const beta = d.R0eff / d.D, gam = ERL / d.D, sig = d.L > 0 ? ERL / d.L : 0;
    const seeds = Math.min(P.seeds, N) / N;
    const y = new Float64Array(10);
    y[0] = Math.max(0, d.s0 - seeds); y[4] = seeds; y[9] = seeds;
    const f = (yy, out) => {
      const sumI = yy[4] + yy[5] + yy[6], inf = beta * sumI * yy[0];
      out[0] = -inf;
      let into;
      if (d.L > 0) { out[1] = inf - sig * yy[1]; out[2] = sig * (yy[1] - yy[2]); out[3] = sig * (yy[2] - yy[3]); into = sig * yy[3]; }
      else { out[1] = out[2] = out[3] = 0; into = inf; }
      out[4] = into - gam * yy[4]; out[5] = gam * (yy[4] - yy[5]); out[6] = gam * (yy[5] - yy[6]);
      out[7] = gam * yy[6] * (1 - d.cfr); out[8] = gam * yy[6] * d.cfr; out[9] = inf;
    };
    const h = 0.05, k1 = new Float64Array(10), k2 = new Float64Array(10), k3 = new Float64Array(10), k4 = new Float64Array(10), tmp = new Float64Array(10);
    const out = { t: [], S: [], E: [], I: [], R: [], D: [], cum: [], peak: 0, peakDay: 0, final: 0 };
    const rec = (t) => {
      out.t.push(t); out.S.push(y[0]); out.E.push(y[1] + y[2] + y[3]); const iv = y[4] + y[5] + y[6]; out.I.push(iv);
      out.R.push(y[7]); out.D.push(y[8]); out.cum.push(y[9]);
      if (iv > out.peak) { out.peak = iv; out.peakDay = t; }
    };
    rec(0);
    const steps = Math.round(horizon / h);
    for (let s = 1; s <= steps; s++) {
      f(y, k1); for (let i = 0; i < 10; i++) tmp[i] = y[i] + h / 2 * k1[i];
      f(tmp, k2); for (let i = 0; i < 10; i++) tmp[i] = y[i] + h / 2 * k2[i];
      f(tmp, k3); for (let i = 0; i < 10; i++) tmp[i] = y[i] + h * k3[i];
      f(tmp, k4); for (let i = 0; i < 10; i++) y[i] += h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
      if (s % Math.round(0.5 / h) === 0) rec(s * h);
    }
    out.final = y[9];
    return out;
  }

  /* ---------- modelo de agentes ---------- */
  class Sim {
    constructor(P) { this.P = Object.assign({}, P); this.reset(); }

    setParams(patch) {            // cambios en caliente (las medidas y la enfermedad)
      Object.assign(this.P, patch);
      this.d = derive(this.P);
      this.beta = this.P.R0 * this.d.distMult / (this.d.D * K * this.edge);
      this.mv = 1 - 0.85 * this.d.dist;
    }

    reset() {
      const P = this.P, N = Math.max(10, Math.round(P.N));
      this.N = N; this.rnd = mulberry(P.seed);
      const rnd = this.rnd;
      this.x = new Float32Array(N); this.y = new Float32Array(N); this.ang = new Float32Array(N);
      this.st = new Uint8Array(N); this.timer = new Float32Array(N); this.tI = new Float32Array(N); this.isoAt = new Float32Array(N);
      this.iso = new Uint8Array(N); this.mask = new Uint8Array(N); this.vf = new Uint8Array(N);
      this.r = Math.sqrt(K / (Math.PI * N));
      this.edge = 1 - 8 * this.r / (3 * Math.PI) + this.r * this.r / (2 * Math.PI);
      this.gn = Math.max(1, Math.floor(1 / this.r)); this.cs = 1 / this.gn;
      this.head = new Int32Array(this.gn * this.gn + 1); this.items = new Int32Array(N);
      this.cell = new Int32Array(N);
      this.d = derive(P);
      this.beta = P.R0 * this.d.distMult / (this.d.D * K * this.edge);
      this.mv = 1 - 0.85 * this.d.dist;
      this.t = 0; this.ticks = 0; this.cnt = [N, 0, 0, 0, 0, 0];
      this.cum = 0; this.newInf = 0; this.finishedAt = null;
      for (let i = 0; i < N; i++) { this.x[i] = rnd(); this.y[i] = rnd(); this.ang[i] = rnd() * 6.2832; }
      // vacunación con recuentos exactos: nVac vacunados, de ellos nProt protegidos
      const order = Array.from({ length: N }, (_, i) => i);
      for (let i = N - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
      const nVac = Math.round(this.d.vac * N), nProt = Math.round(nVac * this.d.eff);
      for (let k = 0; k < nVac; k++) { const i = order[k]; this.vf[i] = 1; if (k < nProt) { this.st[i] = V; this.cnt[S]--; this.cnt[V]++; } }
      for (let i = 0; i < N; i++) this.mask[i] = rnd() < this.d.m ? 1 : 0;
      // casos iniciales (infecciosos) entre los susceptibles
      const cand = []; for (let i = 0; i < N; i++) if (this.st[i] === S) cand.push(i);
      const ns = Math.min(Math.round(P.seeds), cand.length);
      for (let k = 0; k < ns; k++) { const j = k + Math.floor(rnd() * (cand.length - k)); const tmp = cand[k]; cand[k] = cand[j]; cand[j] = tmp; this._toInfectious(cand[k]); this.cum++; }
      this.h = { t: [], S: [], E: [], I: [], R: [], V: [], D: [], inc: [], cum: [] };
      this.peak = 0; this.peakDay = 0;
      this._sample();
    }

    _toInfectious(i) {
      this.cnt[this.st[i]]--; this.st[i] = I; this.cnt[I]++;
      this.timer[i] = erlang(this.rnd, this.d.D); this.tI[i] = 0;
      this.isoAt[i] = this.rnd() < this.d.q ? Math.min(ISO_DELAY, this.d.D) : Infinity; this.iso[i] = 0;
    }
    _infect(j) {
      this.cnt[S]--; this.cum++; this.newInf++;
      if (this.d.L > 0) { this.st[j] = E; this.cnt[E]++; this.timer[j] = erlang(this.rnd, this.d.L); }
      else { this.cnt[S]++; this._toInfectious(j); }
    }

    /* introduce un caso en el susceptible más cercano al punto (x,y); devuelve su índice o -1 */
    introduce(px, py) {
      let best = -1, bd = Infinity;
      for (let i = 0; i < this.N; i++) if (this.st[i] === S) { const dx = this.x[i] - px, dy = this.y[i] - py, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = i; } }
      if (best >= 0) { this._infect(best); this._sample(true); this.finishedAt = null; }
      return best;
    }
    reassignMasks(prob) { for (let i = 0; i < this.N; i++) this.mask[i] = Math.random() < prob ? 1 : 0; }

    _sample(replaceLast) {
      const h = this.h, c = this.cnt;
      if (replaceLast && h.t.length && Math.abs(h.t[h.t.length - 1] - this.t) < 1e-9) {
        const k = h.t.length - 1;
        h.S[k] = c[S]; h.E[k] = c[E]; h.I[k] = c[I]; h.R[k] = c[R]; h.V[k] = c[V]; h.D[k] = c[D]; h.inc[k] += this.newInf; h.cum[k] = this.cum;
      } else {
        h.t.push(this.t); h.S.push(c[S]); h.E.push(c[E]); h.I.push(c[I]); h.R.push(c[R]); h.V.push(c[V]); h.D.push(c[D]); h.inc.push(this.newInf); h.cum.push(this.cum);
      }
      this.newInf = 0;
      if (c[I] > this.peak) { this.peak = c[I]; this.peakDay = this.t; }
    }

    get finished() { return this.t > 0 && this.cnt[E] + this.cnt[I] === 0; }

    tick() {
      const N = this.N, rnd = this.rnd, st = this.st, x = this.x, y = this.y, ang = this.ang, dt = DT;
      // movimiento
      const stepLen = SPEED * this.mv * dt;
      for (let i = 0; i < N; i++) {
        const s = st[i];
        if (s === D || this.iso[i]) continue;
        let a = ang[i] + (rnd() - 0.5) * 0.9; ang[i] = a;
        let nx = x[i] + Math.cos(a) * stepLen, ny = y[i] + Math.sin(a) * stepLen;
        if (nx < 0) { nx = -nx; ang[i] = Math.PI - a; } else if (nx > 1) { nx = 2 - nx; ang[i] = Math.PI - a; }
        if (ny < 0) { ny = -ny; ang[i] = -ang[i]; } else if (ny > 1) { ny = 2 - ny; ang[i] = -ang[i]; }
        x[i] = nx; y[i] = ny;
      }
      // contagio: rejilla con los susceptibles y recorrido de los infecciosos
      if (this.cnt[I] > 0 && this.cnt[S] > 0) {
        const gn = this.gn, cs = this.cs, head = this.head, items = this.items, cell = this.cell;
        head.fill(0);
        for (let i = 0; i < N; i++) if (st[i] === S) { const c = Math.min(gn - 1, (y[i] / cs) | 0) * gn + Math.min(gn - 1, (x[i] / cs) | 0); cell[i] = c; head[c + 1]++; }
        for (let c = 0; c < gn * gn; c++) head[c + 1] += head[c];
        const fill = this._fill || (this._fill = new Int32Array(gn * gn));
        fill.fill(0);
        for (let i = 0; i < N; i++) if (st[i] === S) { const c = cell[i]; items[head[c] + fill[c]++] = i; }
        const r2 = this.r * this.r, base = this.beta * dt, mask = this.mask, iso = this.iso;
        const infList = []; for (let i = 0; i < N; i++) if (st[i] === I) infList.push(i);
        for (let n = 0; n < infList.length; n++) {
          const i = infList[n];
          const fi = (iso[i] ? ISO_LEAK : 1) * (mask[i] ? 1 - MASK_I : 1) * base;
          const cx = Math.min(gn - 1, (x[i] / cs) | 0), cy = Math.min(gn - 1, (y[i] / cs) | 0);
          for (let gy = Math.max(0, cy - 1); gy <= Math.min(gn - 1, cy + 1); gy++) {
            for (let gx = Math.max(0, cx - 1); gx <= Math.min(gn - 1, cx + 1); gx++) {
              const c = gy * gn + gx;
              for (let k = head[c], end = head[c + 1]; k < end; k++) {
                const j = items[k];
                if (st[j] !== S) continue;
                const dx = x[j] - x[i], dy = y[j] - y[i];
                if (dx * dx + dy * dy < r2) {
                  const p = 1 - Math.exp(-fi * (mask[j] ? 1 - MASK_S : 1));
                  if (rnd() < p) this._infect(j);
                }
              }
            }
          }
        }
      }
      // evolución de E e I
      for (let i = 0; i < N; i++) {
        const s = st[i];
        if (s === E) {
          this.timer[i] -= dt;
          if (this.timer[i] <= 0) this._toInfectious(i);
        } else if (s === I) {
          this.tI[i] += dt; this.timer[i] -= dt;
          if (!this.iso[i] && this.tI[i] >= this.isoAt[i]) this.iso[i] = 1;
          if (this.timer[i] <= 0) {
            this.cnt[I]--; this.iso[i] = 0;
            if (rnd() < this.d.cfr) { st[i] = D; this.cnt[D]++; } else { st[i] = R; this.cnt[R]++; }
          }
        }
      }
      this.ticks++; this.t = this.ticks * dt;
      if (this.ticks % SAMPLE === 0) this._sample();
      if (this.finished && this.finishedAt === null) { this.finishedAt = this.t; this._sample(true); }
    }

    step(n) { for (let k = 0; k < n; k++) { this.tick(); if (this.finished) break; } }
    advanceDays(days) { this.step(Math.round(days / DT)); }

    /* resumen de resultados */
    summary() {
      const c = this.cnt, N = this.N;
      return { t: this.t, S: c[S], E: c[E], I: c[I], R: c[R], V: c[V], D: c[D], infected: this.cum, attack: this.cum / N, peak: this.peak / N, peakDay: this.peakDay, finished: this.finished };
    }
  }

  const api = { Sim, derive, finalSize, seir, DT, K, ERL, SAMPLE, MASK_I, MASK_S, ISO_LEAK, ISO_DELAY, S, E, I, R, V, D, mulberry };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.EpiSim = api;
})(typeof window !== 'undefined' ? window : globalThis);
