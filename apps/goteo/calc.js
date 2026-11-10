/* ============================================================
   Cálculos de la calculadora de goteo y dosis (sin interfaz).
   Todas las funciones son puras y devuelven números; si los datos no son
   válidos devuelven { error: 'clave' } para que la interfaz lo explique.
   Se puede probar con:  node apps/goteo/calc.test.js
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GoteoCalc = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- unidades ---------- */
  // Dosis: base = mg (masa) o UI (actividad). No se pueden mezclar.
  const DOSE = { mg: 1, g: 1000, mcg: 0.001, ui: 1 };
  // Concentración: base = mg/mL (masa) o UI/mL. 1 % = 1 g/100 mL = 10 mg/mL.
  const CONC = { 'mg/mL': 1, 'mcg/mL': 0.001, 'g/mL': 1000, 'g/L': 1, pct: 10, 'ui/mL': 1 };
  const famDose = (u) => (u === 'ui' ? 'ui' : 'mass');
  const famConc = (u) => (u === 'ui/mL' ? 'ui' : 'mass');
  const doseBase = (v, u) => v * DOSE[u];
  const concBase = (v, u) => v * CONC[u];
  const compatible = (du, cu) => famDose(du) === famConc(cu);

  const pos = (n) => Number.isFinite(n) && n > 0;
  const fin = (n) => Number.isFinite(n);

  /* ---------- redondeo ---------- */
  const round = (n, d = 0) => { const k = Math.pow(10, d); return Math.round((n + Number.EPSILON) * k) / k; };

  /* ---------- 1. infusión ---------- */
  // V en mL, horas en h, f en gotas/mL
  function infusion(V, hours, f) {
    if (!pos(V) || !pos(hours)) return { error: 'positive' };
    const mlh = V / hours;
    const out = { mlh };
    if (pos(f)) {
      const gpm = (V * f) / (hours * 60);
      out.gpm = gpm; out.gpmR = Math.round(gpm); out.spd = 60 / gpm; out.spdR = out.gpmR > 0 ? 60 / out.gpmR : Infinity;
    }
    return out;
  }
  // Tiempo total (min) a partir de volumen y goteo
  function timeFromDrops(V, gpm, f) {
    if (!pos(V) || !pos(gpm) || !pos(f)) return { error: 'positive' };
    const min = (V * f) / gpm;
    return { min, hours: min / 60, mlh: (gpm * 60) / f };
  }
  // Volumen (mL) infundido en un tiempo (min) con un goteo
  function volFromDrops(gpm, min, f) {
    if (!pos(gpm) || !pos(min) || !pos(f)) return { error: 'positive' };
    return { ml: (gpm * min) / f, mlh: (gpm * 60) / f };
  }
  // Atajo mental: gotas/min = mL/h × f / 60  → divisor = 60 / f
  const dropsDivisor = (f) => (pos(f) ? 60 / f : NaN);

  /* ---------- 2. dosis → volumen / unidades ---------- */
  function mlFromDose(dv, du, cv, cu) {
    if (!pos(dv) || !pos(cv)) return { error: 'positive' };
    if (!compatible(du, cu)) return { error: 'units' };
    const ml = doseBase(dv, du) / concBase(cv, cu);
    return { ml, concMgMl: concBase(cv, cu) };
  }
  // Ampolla/vial: cantidad total (av, au) en volumen (mL)
  function concFromVial(av, au, vol) {
    if (!pos(av) || !pos(vol)) return { error: 'positive' };
    return { mgMl: doseBase(av, au) / vol, fam: famDose(au) };
  }
  function unitsFromDose(dv, du, cv, cu) {
    if (!pos(dv) || !pos(cv)) return { error: 'positive' };
    if (famDose(du) !== famDose(cu)) return { error: 'units' };
    const n = doseBase(dv, du) / doseBase(cv, cu);
    return { n, half: Math.round(n * 2) / 2, nearWhole: Math.abs(n - Math.round(n)) < 1e-9, nearHalf: Math.abs(n * 2 - Math.round(n * 2)) < 1e-9 };
  }

  /* ---------- 3. dosis por peso ---------- */
  const toKg = (v, u) => (u === 'lb' ? v * 0.45359237 : v);
  // perKg en unidades de dosis (mg/kg, mcg/kg, g/kg, UI/kg)
  function weightDose(perKg, du, kg, { perDay = false, doses = 1, maxDose = NaN, maxDoseUnit = du, maxDay = NaN, maxDayUnit = du } = {}) {
    if (!pos(perKg) || !pos(kg)) return { error: 'positive' };
    if (perDay && !(doses >= 1)) return { error: 'positive' };
    const total = doseBase(perKg, du) * kg; // en mg o UI (por toma o por día según perDay)
    const daily = perDay ? total : NaN;
    const perDose = perDay ? total / doses : total;
    const out = { perDose, daily: perDay ? daily : perDose * doses, perDay, doses };
    if (pos(maxDose)) {
      if (famDose(maxDoseUnit) !== famDose(du)) return { error: 'units' };
      out.maxDoseBase = doseBase(maxDose, maxDoseUnit); out.overDose = perDose > out.maxDoseBase + 1e-9;
    }
    if (pos(maxDay)) {
      if (famDose(maxDayUnit) !== famDose(du)) return { error: 'units' };
      out.maxDayBase = doseBase(maxDay, maxDayUnit); out.overDay = out.daily > out.maxDayBase + 1e-9;
    }
    return out;
  }
  // Velocidad por peso: unidades 'mcg/kg/min' | 'mg/kg/h' | 'mcg/kg/h' → mcg/min, mg/h y mg/24h
  const RATE_PERKG = { 'mcg/kg/min': (v, kg) => v * kg * 60 / 1000, 'mg/kg/h': (v, kg) => v * kg, 'mcg/kg/h': (v, kg) => v * kg / 1000, 'ui/kg/h': (v, kg) => v * kg };
  function weightRate(v, unit, kg, { maxDay = NaN, maxDayUnit = 'mg' } = {}) {
    if (!pos(v) || !pos(kg) || !RATE_PERKG[unit]) return { error: 'positive' };
    const base = RATE_PERKG[unit](v, kg); // mg/h (o UI/h)
    const out = { baseH: base, mcgMin: base * 1000 / 60, mgH: base, day: base * 24 };
    if (pos(maxDay)) {
      if (famDose(maxDayUnit) !== (unit.startsWith('ui') ? 'ui' : 'mass')) return { error: 'units' };
      out.maxDayBase = doseBase(maxDay, maxDayUnit); out.overDay = out.day > out.maxDayBase + 1e-9;
    }
    return out;
  }

  /* ---------- 4. bomba y dilución ---------- */
  // Velocidad prescrita → base por hora (mg/h o UI/h)
  const RATE_UNITS = {
    'mg/h': { toBase: (v) => v, fam: 'mass', perKg: false },
    'mcg/min': { toBase: (v) => v * 60 / 1000, fam: 'mass', perKg: false },
    'mcg/kg/min': { toBase: (v, kg) => v * kg * 60 / 1000, fam: 'mass', perKg: true },
    'mg/kg/h': { toBase: (v, kg) => v * kg, fam: 'mass', perKg: true },
    'ui/h': { toBase: (v) => v, fam: 'ui', perKg: false },
    'ui/kg/h': { toBase: (v, kg) => v * kg, fam: 'ui', perKg: true }
  };
  const rateNeedsKg = (u) => !!(RATE_UNITS[u] && RATE_UNITS[u].perKg);
  function pumpRate(rateV, rateU, kg, concMgMl, concFam) {
    const ru = RATE_UNITS[rateU];
    if (!ru || !pos(rateV)) return { error: 'positive' };
    if (ru.perKg && !pos(kg)) return { error: 'weight' };
    if (!pos(concMgMl)) return { error: 'conc' };
    if (concFam && concFam !== ru.fam) return { error: 'units' };
    const baseH = ru.toBase(rateV, kg);
    return { baseH, mlh: baseH / concMgMl };
  }
  // Comprobar la bomba: mL/h → dosis por hora, mcg/min y mcg/kg/min
  function pumpCheck(mlh, concMgMl, concFam, kg) {
    if (!pos(mlh) || !pos(concMgMl)) return { error: 'positive' };
    const baseH = mlh * concMgMl;
    const out = { baseH, fam: concFam || 'mass' };
    if (out.fam === 'mass') { out.mcgMin = baseH * 1000 / 60; if (pos(kg)) out.mcgKgMin = out.mcgMin / kg; }
    else if (pos(kg)) out.uiKgH = baseH / kg;
    return out;
  }
  // Concentración de una dilución: cantidad (au) en volumen final (mL)
  function dilutionConc(amount, au, volMl) {
    if (!pos(amount) || !pos(volMl)) return { error: 'positive' };
    return { mgMl: doseBase(amount, au) / volMl, fam: famDose(au) };
  }
  // Preparar: concentración objetivo en volumen final con ampolla (X en Y mL)
  function dilutionPrep(targetMgMl, targetFam, finalMl, ampAmount, ampUnit, ampMl) {
    if (!pos(targetMgMl) || !pos(finalMl) || !pos(ampAmount) || !pos(ampMl)) return { error: 'positive' };
    if (famDose(ampUnit) !== targetFam) return { error: 'units' };
    const drugNeeded = targetMgMl * finalMl;               // mg (o UI)
    const ampConc = doseBase(ampAmount, ampUnit) / ampMl;  // mg/mL de la ampolla
    const drugMl = drugNeeded / ampConc;
    const ampules = drugNeeded / doseBase(ampAmount, ampUnit);
    const diluent = finalMl - drugMl;
    return { drugNeeded, ampConc, drugMl, ampules, diluent, fits: diluent >= -1e-9 };
  }

  /* ---------- 5. conversión de unidades y regla de tres ---------- */
  const CATS = {
    mass: { base: 'g', units: { kg: 1000, g: 1, mg: 1e-3, mcg: 1e-6, lb: 453.59237, oz: 28.349523125 } },
    volume: { base: 'mL', units: { L: 1000, dL: 100, cL: 10, mL: 1, cc: 1, uL: 0.001 } },
    time: { base: 'min', units: { day: 1440, h: 60, min: 1, s: 1 / 60 } },
    conc: { base: 'mg/mL', units: { 'mg/mL': 1, 'mcg/mL': 0.001, 'g/L': 1, 'g/dL': 10, 'mg/dL': 0.01, pct: 10, ratio: null } },
    temp: { base: '°C', units: { C: null, F: null, K: null } }
  };
  function convert(cat, v, from, to) {
    const c = CATS[cat];
    if (!c || !(from in c.units) || !(to in c.units) || !fin(v)) return { error: 'positive' };
    if (cat === 'temp') {
      const C = from === 'C' ? v : from === 'F' ? (v - 32) * 5 / 9 : v - 273.15;
      const out = to === 'C' ? C : to === 'F' ? C * 9 / 5 + 32 : C + 273.15;
      return { value: out, base: C };
    }
    let base;
    if (cat === 'conc' && from === 'ratio') { if (!pos(v)) return { error: 'positive' }; base = 1000 / v; } // 1:x → 1 g en x mL
    else base = v * c.units[from];
    let out;
    if (cat === 'conc' && to === 'ratio') { if (!pos(base)) return { error: 'positive' }; out = 1000 / base; }
    else out = base / c.units[to];
    return { value: out, base };
  }
  // a es a b como c es a x (inversa: a·b = c·x)
  function ruleOfThree(a, b, c, inverse = false) {
    if (!fin(a) || !fin(b) || !fin(c)) return { error: 'positive' };
    if (inverse) { if (c === 0) return { error: 'zero' }; return { x: (a * b) / c }; }
    if (a === 0) return { error: 'zero' };
    return { x: (b * c) / a };
  }

  /* ---------- utilidades ---------- */
  // Interpreta "12,5" o "12.5" → 12.5; vacío o texto → NaN
  function parseNum(s) {
    if (typeof s === 'number') return s;
    s = String(s ?? '').trim().replace(/\s/g, '').replace(',', '.');
    if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
    return Number(s);
  }
  // Jeringa orientativa para un volumen (mL): [capacidad, graduación]
  function syringe(ml) {
    const list = [[1, 0.01], [2, 0.1], [5, 0.2], [10, 0.5], [20, 1]];
    for (const s of list) if (ml <= s[0] + 1e-9) return { cap: s[0], grad: s[1] };
    return null;
  }

  return {
    DOSE, CONC, CATS, RATE_UNITS, famDose, famConc, doseBase, concBase, compatible, round,
    infusion, timeFromDrops, volFromDrops, dropsDivisor,
    mlFromDose, concFromVial, unitsFromDose,
    toKg, weightDose, weightRate, RATE_PERKG,
    rateNeedsKg, pumpRate, pumpCheck, dilutionConc, dilutionPrep,
    convert, ruleOfThree, parseNum, syringe
  };
});
