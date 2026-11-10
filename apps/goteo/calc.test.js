/* Pruebas numéricas de calc.js con casos conocidos.  Uso:  node apps/goteo/calc.test.js */
const C = require('./calc.js');
let ok = 0, fail = 0;
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
function eq(name, got, want, tol) {
  const pass = near(got, want, tol);
  pass ? ok++ : (fail++, console.log('FALLA', name, 'obtenido', got, 'esperado', want));
}
function is(name, got, want) { got === want ? ok++ : (fail++, console.log('FALLA', name, 'obtenido', got, 'esperado', want)); }

/* 1. infusión */
let r = C.infusion(500, 4, 20);
eq('500 mL/4 h → mL/h', r.mlh, 125); eq('gotas/min 20', r.gpm, 41.6667, 1e-4); is('gotas redondeadas', r.gpmR, 42); eq('seg/gota', r.spd, 1.44);
r = C.infusion(1000, 8, 15); eq('1000/8h mL/h', r.mlh, 125); eq('1000 mL 8 h f15', r.gpm, 31.25); is('redondeo 31', r.gpmR, 31);
r = C.infusion(100, 1, 60); eq('micro 100 mL/h = 100 gotas/min', r.gpm, 100);
r = C.infusion(250, 0.5, 20); eq('250 mL en 30 min', r.mlh, 500); eq('gotas', r.gpm, 166.6667, 1e-4);
is('divisor f20', C.dropsDivisor(20), 3); is('divisor f15', C.dropsDivisor(15), 4); is('divisor f60', C.dropsDivisor(60), 1);
is('error volumen 0', C.infusion(0, 4, 20).error, 'positive'); is('error tiempo 0', C.infusion(500, 0, 20).error, 'positive'); is('NaN', C.infusion(NaN, 4, 20).error, 'positive');
r = C.timeFromDrops(500, 42, 20); eq('tiempo con 42 gotas/min', r.min, 238.095, 1e-4);
r = C.timeFromDrops(1000, 30, 15); eq('1000 mL a 30 gotas/min f15', r.hours, 8.3333, 1e-4);
r = C.volFromDrops(21, 60, 20); eq('21 gotas/min 1 h f20', r.ml, 63); eq('mL/h', r.mlh, 63);

/* 2. dosis → volumen */
eq('250 mg a 50 mg/mL', C.mlFromDose(250, 'mg', 50, 'mg/mL').ml, 5);
eq('0,5 g a 250 mg/mL', C.mlFromDose(0.5, 'g', 250, 'mg/mL').ml, 2);
eq('500 mcg a 0,25 mg/mL', C.mlFromDose(500, 'mcg', 0.25, 'mg/mL').ml, 2);
eq('100 mg con solución al 2 %', C.mlFromDose(100, 'mg', 2, 'pct').ml, 5);
eq('5000 UI a 25000 UI/mL', C.mlFromDose(5000, 'ui', 25000, 'ui/mL').ml, 0.2);
eq('1 mg a 1:1000 (1 mg/mL)', C.mlFromDose(1, 'mg', 1, 'mg/mL').ml, 1);
eq('mcg/mL', C.mlFromDose(1, 'mg', 100, 'mcg/mL').ml, 10);
eq('g/L equivale a mg/mL', C.mlFromDose(300, 'mg', 30, 'g/L').ml, 10);
is('UI frente a masa', C.mlFromDose(5000, 'ui', 50, 'mg/mL').error, 'units');
is('conc 0', C.mlFromDose(5, 'mg', 0, 'mg/mL').error, 'positive');
eq('ampolla 100 mg en 2 mL', C.concFromVial(100, 'mg', 2).mgMl, 50);
eq('ampolla 1 g en 10 mL', C.concFromVial(1, 'g', 10).mgMl, 100);
r = C.unitsFromDose(750, 'mg', 250, 'mg'); eq('3 comprimidos', r.n, 3); is('entero', r.nearWhole, true);
r = C.unitsFromDose(375, 'mg', 250, 'mg'); eq('1,5 comprimidos', r.n, 1.5); is('mitad', r.nearHalf, true); is('no entero', r.nearWhole, false);
r = C.unitsFromDose(0.5, 'g', 250, 'mg'); eq('0,5 g con comp. 250 mg', r.n, 2);
r = C.unitsFromDose(100, 'mg', 30, 'mg'); is('3,33 no es mitad', r.nearHalf, false);

/* 3. dosis por peso */
r = C.weightDose(15, 'mg', 20); eq('15 mg/kg × 20 kg', r.perDose, 300);
r = C.weightDose(40, 'mg', 15, { perDay: true, doses: 3 }); eq('40 mg/kg/día × 15 kg', r.daily, 600); eq('/3 tomas', r.perDose, 200);
r = C.weightDose(15, 'mg', 20, { maxDose: 250, maxDoseUnit: 'mg' }); is('excede máx. toma', r.overDose, true);
r = C.weightDose(15, 'mg', 20, { maxDose: 0.5, maxDoseUnit: 'g' }); is('máx. 0,5 g no excede', r.overDose, false);
r = C.weightDose(10, 'mg', 20, { perDay: true, doses: 4, maxDay: 1, maxDayUnit: 'g' }); eq('diaria 200', r.daily, 200); is('no excede 1 g', r.overDay, false);
r = C.weightDose(60, 'mg', 20, { perDay: true, doses: 3, maxDay: 1, maxDayUnit: 'g' }); is('1200 > 1000', r.overDay, true);
r = C.weightDose(100, 'mcg', 10); eq('100 mcg/kg × 10 kg → 1 mg', r.perDose, 1);
r = C.weightDose(50, 'ui', 10); eq('50 UI/kg × 10', r.perDose, 500);
is('UI vs mg máx.', C.weightDose(50, 'ui', 10, { maxDose: 100, maxDoseUnit: 'mg' }).error, 'units');
r = C.weightRate(5, 'mcg/kg/min', 70); eq('5 mcg/kg/min × 70 → mcg/min', r.mcgMin, 350); eq('mg/h', r.mgH, 21); eq('mg/24 h', r.day, 504);
r = C.weightRate(0.1, 'mg/kg/h', 80); eq('0,1 mg/kg/h × 80', r.mgH, 8);
r = C.weightRate(5, 'mcg/kg/min', 70, { maxDay: 0.5, maxDayUnit: 'g' }); is('504 mg > 0,5 g', r.overDay, true);
eq('lb → kg', C.toKg(150, 'lb'), 68.0389, 1e-5); eq('kg', C.toKg(70, 'kg'), 70);

/* 4. bomba y dilución */
const conc = C.dilutionConc(400, 'mg', 250); eq('400 mg en 250 mL', conc.mgMl, 1.6);
r = C.pumpRate(5, 'mcg/kg/min', 70, conc.mgMl, conc.fam); eq('dopamina-like mg/h', r.baseH, 21); eq('mL/h', r.mlh, 13.125); eq('redondeo a 1 decimal', C.round(r.mlh, 1), 13.1);
r = C.pumpRate(20, 'mg/h', NaN, 2, 'mass'); eq('20 mg/h a 2 mg/mL', r.mlh, 10);
r = C.pumpRate(100, 'mcg/min', NaN, 0.2, 'mass'); eq('100 mcg/min a 0,2 mg/mL', r.mlh, 30);
r = C.pumpRate(1000, 'ui/h', NaN, 100, 'ui'); eq('1000 UI/h a 100 UI/mL', r.mlh, 10);
is('falta el peso', C.pumpRate(5, 'mcg/kg/min', NaN, 1, 'mass').error, 'weight');
is('UI vs masa en bomba', C.pumpRate(5, 'ui/h', NaN, 1, 'mass').error, 'units');
is('conc 0', C.pumpRate(5, 'mg/h', NaN, 0, 'mass').error, 'conc');
r = C.pumpCheck(13.1, 1.6, 'mass', 70); eq('comprobación mg/h', r.baseH, 20.96); eq('mcg/kg/min', r.mcgKgMin, 4.9905, 1e-4);
r = C.dilutionPrep(1, 'mass', 50, 100, 'mg', 2); eq('mg necesarios', r.drugNeeded, 50); eq('mL de ampolla', r.drugMl, 1); eq('suero', r.diluent, 49); eq('ampollas', r.ampules, 0.5); is('cabe', r.fits, true);
r = C.dilutionPrep(100, 'mass', 10, 100, 'mg', 2); is('no cabe', r.fits, false); eq('faltan 10 mL', r.diluent, -10);
r = C.dilutionPrep(0.5, 'mass', 100, 0.5, 'g', 5); eq('0,5 g/5 mL → 50 mg a 100 mL a 0,5 mg/mL', r.drugMl, 0.5, 1e-9);
is('dilución UI vs masa', C.dilutionPrep(1, 'ui', 50, 100, 'mg', 2).error, 'units');

/* 5. conversión */
eq('0,5 g → mg', C.convert('mass', 0.5, 'g', 'mg').value, 500);
eq('2500 mcg → mg', C.convert('mass', 2500, 'mcg', 'mg').value, 2.5);
eq('150 lb → kg', C.convert('mass', 150, 'lb', 'kg').value, 68.0389, 1e-5);
eq('2 L → mL', C.convert('volume', 2, 'L', 'mL').value, 2000);
eq('1 cc = 1 mL', C.convert('volume', 1, 'cc', 'mL').value, 1);
eq('90 min → h', C.convert('time', 90, 'min', 'h').value, 1.5);
eq('1 día → h', C.convert('time', 1, 'day', 'h').value, 24);
eq('5 % → mg/mL', C.convert('conc', 5, 'pct', 'mg/mL').value, 50);
eq('0,9 % → mg/mL (suero)', C.convert('conc', 0.9, 'pct', 'mg/mL').value, 9);
eq('1:1000 → mg/mL', C.convert('conc', 1000, 'ratio', 'mg/mL').value, 1);
eq('1:10000 → mg/mL', C.convert('conc', 10000, 'ratio', 'mg/mL').value, 0.1);
eq('1 mg/mL → 1:x', C.convert('conc', 1, 'mg/mL', 'ratio').value, 1000);
eq('100 mg/dL → mg/mL', C.convert('conc', 100, 'mg/dL', 'mg/mL').value, 1);
eq('98,6 °F → °C', C.convert('temp', 98.6, 'F', 'C').value, 37, 1e-6);
eq('37 °C → °F', C.convert('temp', 37, 'C', 'F').value, 98.6, 1e-6);
eq('0 °C → K', C.convert('temp', 0, 'C', 'K').value, 273.15);
eq('regla de tres directa', C.ruleOfThree(3, 12, 5).x, 20);
eq('regla de tres inversa', C.ruleOfThree(3, 12, 6, true).x, 6);
is('regla de tres a=0', C.ruleOfThree(0, 12, 5).error, 'zero');

/* utilidades */
eq('parse 12,5', C.parseNum('12,5'), 12.5); eq('parse .5', C.parseNum('.5'), 0.5); eq('parse espacios', C.parseNum(' 1 000 '), 1000);
is('parse vacío', Number.isNaN(C.parseNum('')), true); is('parse texto', Number.isNaN(C.parseNum('abc')), true); is('parse 1e3', C.parseNum('1e3'), 1000);
eq('round', C.round(13.125, 1), 13.1); eq('round2', C.round(1.005, 2), 1.01);
is('jeringa 0,4', C.syringe(0.4).cap, 1); is('jeringa 3', C.syringe(3).cap, 5); is('jeringa 25', C.syringe(25), null);

console.log(`${ok} correctas, ${fail} con fallo`);
process.exit(fail ? 1 : 0);
