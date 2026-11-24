/* ==========================================================================
   ឯកសារ៖ js/symbols.js
   តួនាទី៖ ជំនួសនិមិត្តសញ្ញាចាស់ និងទាញយកនិមិត្តសញ្ញា SVG ទាំងអស់ (>100 icons) ពី js/icons.js
   ចូលក្នុងបណ្ណាល័យឧបករណ៍ដោយស្វ័យប្រវត្តិ (Auto-Register All IEC Symbols)
   ========================================================================== */
import { state } from './state.js';
import { ICONS } from './icons.js';

export const ICON_OF = {
  srcL1: 'sourceL1', srcL2: 'sourceL2', srcL3: 'sourceL3', srcN: 'sourceN', srcPE: 'sourcePE', srcP: 'sourcePlus', srcM: 'sourceNegative', src3ph: 'sourceL1L2L3',
  fuse: 'fuse1p', brk1: 'breaker1p', brk2: 'breaker2p', brk3: 'breaker3p', mbrk3: 'motorBreaker3p', ol3: 'overload3p', olNC: 'contactNC', olNO: 'contactNO',
  btnNO: 'buttonNO', btnNC: 'buttonNC', estop: 'emergencyNC', swNO: 'switchNO',
  coil: 'coil', timerOn: 'coilDelayOn', timerOff: 'coilDelayOff', conNO: 'contactNO', conNC: 'contactNC', tmNO: 'contactNODelayOn', tmNC: 'contactNCDelayOn',
  ct3: 'contactor3p', lamp: 'lamp', lampRun: 'lamp', lampStop: 'lamp', lampTrip: 'lamp', buzz: 'buzzer', mot1: 'motor1ph', mot3: 'motor3ph'
};
const ADOPT = new Set(['mbrk3', 'mot1']);
const SKIP_ICONS = new Set(['motor']);
const SIM = { lamp: 'var(--lamp)', lampRun: '#10b981', lampStop: '#ef4444', lampTrip: '#f59e0b', buzz: 'var(--lamp)' };
const ROT = { 0: (x, y) => [x, y], 90: (x, y) => [-y, x], 180: (x, y) => [-x, -y], 270: (x, y) => [y, -x] };

const COMPONENT_META = {
  // ១. ប្រភពភ្លើង (Sources - S)
  sourceL1:         { k: 'S', nm: 'ប្រភព L1 (Phase L1)' },
  sourceL2:         { k: 'S', nm: 'ប្រភព L2 (Phase L2)' },
  sourceL3:         { k: 'S', nm: 'ប្រភព L3 (Phase L3)' },
  sourceN:          { k: 'S', nm: 'ប្រភព N (Neutral)' },
  sourceGnd:        { k: 'S', nm: 'ខ្សែដី PE (Grounding)' },
  sourcePlus:       { k: 'S', nm: 'ប្រភពវិជ្ជមាន (+ DC)' },
  sourceNegative:   { k: 'S', nm: 'ប្រភពអវិជ្ជមាន (− DC)' },
  sourceL1L2L3:     { k: 'S', nm: 'ប្រភព 3 ហ្វាស (L1-L2-L3)' },
  sourceL1L2L3N:    { k: 'S', nm: 'ប្រភព 3 ហ្វាស+N (L1-L2-L3-N)' },
  battery:          { k: 'S', nm: 'អាគុយ (Battery DC)' },
  generator3ph:     { k: 'S', nm: 'ម៉ាស៊ីនភ្លើង 3 ហ្វាស (Generator)' },
  powerSupply:      { k: 'S', nm: 'ប្រភពបំប្លែងភ្លើង (Power Supply 8P)' },
  powerSupply2:     { k: 'S', nm: 'ប្រភពបំប្លែងភ្លើង (Power Supply 4P)' },

  // ២. ឧបករណ៍ការពារ (Protection & Breakers - P)
  breaker:          { k: 'P', nm: 'ប្រេកគ័រកម្ដៅ 3P (Thermal Breaker)' },
  breaker1p:        { k: 'P', nm: 'ប្រេកគ័រ 1P (Breaker 1P)' },
  breaker2p:        { k: 'P', nm: 'ប្រេកគ័រ 2P (Breaker 2P)' },
  breaker3p:        { k: 'P', nm: 'ប្រេកគ័រ 3P (Breaker 3P)' },
  breaker4p:        { k: 'P', nm: 'ប្រេកគ័រ 4P (Breaker 4P)' },
  tmBreaker1p:      { k: 'P', nm: 'ប្រេកគ័រម៉ាញេទិកកម្ដៅ 1P (TM 1P)' },
  tmBreaker2p:      { k: 'P', nm: 'ប្រេកគ័រម៉ាញេទិកកម្ដៅ 2P (TM 2P)' },
  tmBreaker3p:      { k: 'P', nm: 'ប្រេកគ័រម៉ាញេទិកកម្ដៅ 3P (TM 3P)' },
  tmBreaker4p:      { k: 'P', nm: 'ប្រេកគ័រម៉ាញេទិកកម្ដៅ 4P (TM 4P)' },
  motorBreaker1p:   { k: 'P', nm: 'ប្រេកគ័រម៉ូទ័រ 1P (Motor Breaker)' },
  motorBreaker2p:   { k: 'P', nm: 'ប្រេកគ័រម៉ូទ័រ 2P (Motor Breaker)' },
  motorBreaker3p:   { k: 'P', nm: 'ប្រេកគ័រម៉ូទ័រ 3P (Motor Breaker)' },
  motorBreaker4p:   { k: 'P', nm: 'ប្រេកគ័រម៉ូទ័រ 4P (Motor Breaker)' },
  rcboBreaker2p:    { k: 'P', nm: 'ប្រេកគ័រការពារឆក់ RCBO 2P' },
  rcboBreaker4p:    { k: 'P', nm: 'ប្រេកគ័រការពារឆក់ RCBO 4P' },
  rccbBreaker2p:    { k: 'P', nm: 'ឌីសង់ទ័រការពារឆក់ RCCB 2P' },
  rccbBreaker4p:    { k: 'P', nm: 'ឌីសង់ទ័រការពារឆក់ RCCB 4P' },
  isolator1p:       { k: 'P', nm: 'កុងតាក់ផ្តាច់ចរន្ត Isolator 1P' },
  isolator2p:       { k: 'P', nm: 'កុងតាក់ផ្តាច់ចរន្ត Isolator 2P' },
  isolator3p:       { k: 'P', nm: 'កុងតាក់ផ្តាច់ចរន្ត Isolator 3P' },
  isolator4p:       { k: 'P', nm: 'កុងតាក់ផ្តាច់ចរន្ត Isolator 4P' },
  fuse1p:           { k: 'P', nm: 'ហ្វុយស៊ីប 1P (Fuse 1P)' },
  fuse2p:           { k: 'P', nm: 'ហ្វុយស៊ីប 2P (Fuse 2P)' },
  fuse3p:           { k: 'P', nm: 'ហ្វុយស៊ីប 3P (Fuse 3P)' },
  fuse4p:           { k: 'P', nm: 'ហ្វុយស៊ីប 4P (Fuse 4P)' },
  fuseSwitch1p:     { k: 'P', nm: 'កុងតាក់ហ្វុយស៊ីប 1P (Fuse Switch)' },
  fuseSwitch1pn:    { k: 'P', nm: 'កុងតាក់ហ្វុយស៊ីប 1P+N' },
  fuseSwitch2p:     { k: 'P', nm: 'កុងតាក់ហ្វុយស៊ីប 2P' },
  fuseSwitch3p:     { k: 'P', nm: 'កុងតាក់ហ្វុយស៊ីប 3P' },
  fuseSwitch3pn:    { k: 'P', nm: 'កុងតាក់ហ្វុយស៊ីប 3P+N' },
  fuseSwitch4p:     { k: 'P', nm: 'កុងតាក់ហ្វុយស៊ីប 4P' },
  overload1p:       { k: 'P', nm: 'រ៉េឡេកម្ដៅ 1P (Overload 1P)' },
  overload2p:       { k: 'P', nm: 'រ៉េឡេកម្ដៅ 2P (Overload 2P)' },
  overload3p:       { k: 'P', nm: 'រ៉េឡេកម្ដៅ 3P (Overload 3P)' },
  phaseFailure:     { k: 'P', nm: 'រ៉េឡេការពារបាត់ហ្វាស (Phase Failure)' },

  // ៣. ប៊ូតុង និងកុងតាក់ (Buttons & Switches - W)
  buttonNO:         { k: 'W', nm: 'ប៊ូតុងចុច NO (Push Button NO)' },
  buttonNC:         { k: 'W', nm: 'ប៊ូតុងចុច NC (Push Button NC)' },
  buttonNONC:       { k: 'W', nm: 'ប៊ូតុងចុច NC+NO (Push Button)' },
  buttonCON:        { k: 'W', nm: 'ប៊ូតុងចុចប្តូរទិស CON (11-12/14)' },
  buttonCrossover:  { k: 'W', nm: 'ប៊ូតុងខ្វែង (Push Crossover)' },
  switchNO:         { k: 'W', nm: 'កុងតាក់បិទ/បើក NO (Switch NO)' },
  switchNC:         { k: 'W', nm: 'កុងតាក់បិទ/បើក NC (Switch NC)' },
  switchNONC:       { k: 'W', nm: 'កុងតាក់ NC+NO (Switch NCNO)' },
  switchCON:        { k: 'W', nm: 'កុងតាក់ប្តូរទិស CON (Switch CON)' },
  switchCrossover:  { k: 'W', nm: 'កុងតាក់ខ្វែង (Switch Crossover)' },
  switch3p0:        { k: 'W', nm: 'កុងតាក់ 3 ទីតាំង I-0-II' },
  switch3p:         { k: 'W', nm: 'កុងតាក់ 3 ទីតាំង I-II-III' },
  emergencyNO:      { k: 'W', nm: 'ប៊ូតុងសង្គ្រោះបន្ទាន់ NO' },
  emergencyNC:      { k: 'W', nm: 'ប៊ូតុងសង្គ្រោះបន្ទាន់ NC' },
  emergencyNONC:    { k: 'W', nm: 'ប៊ូតុងសង្គ្រោះបន្ទាន់ NC+NO' },
  emergencyCON:     { k: 'W', nm: 'ប៊ូតុងសង្គ្រោះបន្ទាន់ CON' },
  rollerNO:         { k: 'W', nm: 'កុងតាក់កង់រមៀល Limit NO' },
  rollerNC:         { k: 'W', nm: 'កុងតាក់កង់រមៀល Limit NC' },
  rollerNONC:       { k: 'W', nm: 'កុងតាក់កង់រមៀល Limit NC+NO' },
  rollerCON:        { k: 'W', nm: 'កុងតាក់កង់រមៀល Limit CON' },

  // ៤. បូប៊ីន និងកំណត់ពេល (Coils & Timers - C)
  coil:             { k: 'C', nm: 'បូប៊ីនកុងតាក់ទ័រ/រ៉េឡេ (Coil)' },
  coilDelayOn:      { k: 'C', nm: 'បូប៊ីនកំណត់ពេល On-Delay (TON)' },
  coilDelayOff:     { k: 'C', nm: 'បូប៊ីនកំណត់ពេល Off-Delay (TOF)' },
  coilDelayOnOff:   { k: 'C', nm: 'បូប៊ីនកំណត់ពេល On-Off Delay' },
  coilFlasher:      { k: 'C', nm: 'បូប៊ីនភ្លឹបភ្លែត (Flasher Relay)' },
  coilLatch:        { k: 'C', nm: 'បូប៊ីនចាក់សោរ (Impulse Latch)' },
  coilSolenoid:     { k: 'C', nm: 'បូប៊ីនសូលេណូអ៊ីត (Solenoid)' },

  // ៥. កុងតាក់ជំនួយ (Aux Contacts - A)
  contactNO:        { k: 'A', nm: 'កុងតាក់ជំនួយ NO (13-14)' },
  contactNC:        { k: 'A', nm: 'កុងតាក់ជំនួយ NC (11-12)' },
  contactNONC:      { k: 'A', nm: 'កុងតាក់ជំនួយ NC+NO' },
  contactCON:       { k: 'A', nm: 'កុងតាក់ជំនួយប្តូរទិស CON' },
  contactNODelayOn:   { k: 'A', nm: 'កុងតាក់ Timer On-Delay NO' },
  contactNCDelayOn:   { k: 'A', nm: 'កុងតាក់ Timer On-Delay NC' },
  contactNONCDelayOn: { k: 'A', nm: 'កុងតាក់ Timer On-Delay NC+NO' },
  contactCONDelayOn:  { k: 'A', nm: 'កុងតាក់ Timer On-Delay CON' },
  contactNODelayOff:  { k: 'A', nm: 'កុងតាក់ Timer Off-Delay NO' },
  contactNCDelayOff:  { k: 'A', nm: 'កុងតាក់ Timer Off-Delay NC' },
  contactNONCDelayOff:{ k: 'A', nm: 'កុងតាក់ Timer Off-Delay NC+NO' },
  contactCONDelayOff: { k: 'A', nm: 'កុងតាក់ Timer Off-Delay CON' },

  // ៦. កុងតាក់ទ័រកម្លាំង (Power Contactors - T)
  contactor1p:      { k: 'T', nm: 'កុងតាក់ទ័រ NO 1P' },
  contactor2p:      { k: 'T', nm: 'កុងតាក់ទ័រ NO 2P' },
  contactor3p:      { k: 'T', nm: 'កុងតាក់ទ័រ NO 3P' },
  contactor4p:      { k: 'T', nm: 'កុងតាក់ទ័រ NO 4P' },
  contactorNC1p:    { k: 'T', nm: 'កុងតាក់ទ័រ NC 1P' },
  contactorNC2p:    { k: 'T', nm: 'កុងតាក់ទ័រ NC 2P' },
  contactorNC3p:    { k: 'T', nm: 'កុងតាក់ទ័រ NC 3P' },
  contactorNC4p:    { k: 'T', nm: 'កុងតាក់ទ័រ NC 4P' },

  // ៧. ចង្កៀង និងសំឡេងរោទិ៍ (Indicators - L)
  lamp:             { k: 'L', nm: 'ចង្កៀងសញ្ញា (Pilot Light)' },
  lampBlink:        { k: 'L', nm: 'ចង្កៀងភ្លឹបភ្លែត (Blinking Light)' },
  buzzer:           { k: 'L', nm: 'សំឡេងរោទិ៍ Buzzer' },
  siren:            { k: 'L', nm: 'ស៊ីរ៉ែនប្រកាសអាសន្ន Siren' },
  ring:             { k: 'L', nm: 'កណ្តឹងរោទិ៍ Bell Ring' },

  // ៨. ម៉ូទ័រ (Motors - M)
  motor1ph:         { k: 'M', nm: 'ម៉ូទ័រ 1 ហ្វាស (1-Phase Motor)' },
  motor3ph:         { k: 'M', nm: 'ម៉ូទ័រ 3 ហ្វាស (3-Phase Motor)' },
  motorStarDelta:   { k: 'M', nm: 'ម៉ូទ័រផ្កាយ-ត្រីកោណ (Star/Delta)' },
  motorDhalander:   { k: 'M', nm: 'ម៉ូទ័រ 2 ល្បឿន Dahlander' },
  motorTwoSpeeds:   { k: 'M', nm: 'ម៉ូទ័រ 2 ល្បឿន Two Speeds' },
  motorDC:          { k: 'M', nm: 'ម៉ូទ័រចរន្តជាប់ (DC Motor)' },

  // ៩. តំណភ្ជាប់ ព្រួញ និងឌីយ៉ូត (Junctions, Arrows & Diode - X)
  diode:            { k: 'X', nm: 'ឌីយ៉ូត (Diode)' },
  junction2p:       { k: 'X', nm: 'តំណខ្សែត្រង់ (Connection 2P)' },
  junction2p90:     { k: 'X', nm: 'តំណខ្សែកែង 90° (Connection 90°)' },
  junction3p:       { k: 'X', nm: 'តំណខ្សែប្រសព្វ 3 ផ្លូវ (T-Junction)' },
  junction4p:       { k: 'X', nm: 'តំណខ្សែប្រសព្វ 4 ផ្លូវ (4-Way)' },
  junctionPE:       { k: 'S', nm: 'ខ្សែដី PE (Ground Terminal)' },
  arrowSource:      { k: 'X', nm: 'ព្រួញបញ្ជូនចរន្តចេញ (Source Arrow)' },
  arrowDestination: { k: 'X', nm: 'ព្រួញទទួលចរន្តចូល (Dest Arrow)' }
};

function resolveCategory(name, ic) {
  if (COMPONENT_META[name]?.k) return COMPONENT_META[name].k;
  const n = name.toLowerCase();
  if (n.startsWith('source') || n === 'battery' || n.startsWith('generator') || n.startsWith('powersupply') || ic.cat === 'sources') return 'S';
  if (n.startsWith('motor') && !n.startsWith('motorbreaker')) return 'M';
  if (n.startsWith('breaker') || n.startsWith('tmbreaker') || n.startsWith('rcbo') || n.startsWith('rccb') || n.startsWith('motorbreaker') || n.startsWith('fuse') || n.startsWith('isolator') || n.startsWith('overload') || n.startsWith('phasefailure') || ic.cat === 'protections') return 'P';
  if (n.startsWith('button') || n.startsWith('switch') || n.startsWith('emergency') || n.startsWith('roller') || ic.cat === 'switches') return 'W';
  if (n.startsWith('coil') || ic.cat === 'coils') return 'C';
  if (n.startsWith('contact') || ic.cat === 'auxiliaries') return 'A';
  if (n.startsWith('contactor') || ic.cat === 'contactors') return 'T';
  if (n.startsWith('lamp') || n.startsWith('buzzer') || n.startsWith('siren') || n.startsWith('ring') || ic.cat === 'loads') return 'L';
  return 'X';
}

function guessPrefix(name, k) {
  const n = name.toLowerCase();
  if (n.startsWith('generator')) return 'GS';
  if (n === 'battery' || n.startsWith('powersupply')) return 'V';
  if (k === 'S' || k === 'X') return undefined;
  if (k === 'M') return 'M';
  if (k === 'L') return (n.includes('buzzer') || n.includes('siren') || n.includes('ring')) ? 'HA' : 'H';
  if (k === 'C') return (n.includes('delay') || n.includes('flasher')) ? 'KT' : 'K';
  if (k === 'T') return 'K';
  if (k === 'A') return n.includes('delay') ? 'KT' : 'K';
  if (k === 'W') return 'S';
  if (k === 'P') {
    if (n.startsWith('fuse') || n.startsWith('overload') || n.startsWith('phase')) return 'F';
    if (n.startsWith('motorbreaker')) return 'QM';
    return 'Q';
  }
  return 'K';
}

export function applyIcons(D, G, COL) {
  const report = [];

  // ១. កំណត់និមិត្តសញ្ញាប្រភពភ្លើង (L1, L2, L3, N, PE, +, −)
  const SRC_LABELS = { srcL1: 'L1', srcL2: 'L2', srcL3: 'L3', srcN: 'N', srcPE: 'PE', srcP: '+', srcM: '−' };
  Object.entries(SRC_LABELS).forEach(([type, lb]) => {
    const d = D[type];
    if (!d) return;
    d.bb = [-7, -4, 7, 42];
    d.d = (e) => {
      const c = brightSrcCol(d.n, COL[d.n]);
      return `<path d="M0 0V28" style="stroke:${c};stroke-width:1.8"/>` +
             `<circle cx="0" cy="34" r="6" style="stroke:${c};stroke-width:1.6;fill:${c}28"/>` +
             uprightText(e, lb, 0, 34, lb.length > 1 ? 7.5 : 9.5, c);
    };
  });

  if (D.src3ph) {
    D.src3ph.bb = [-7, -42, 47, 4];
    D.src3ph.d = (e) => ['L1', 'L2', 'L3'].map((ph, i) => {
      const x = i * 20, c = brightSrcCol(ph, COL[ph]);
      return `<path d="M${x} 0V-28" style="stroke:${c};stroke-width:1.8"/>` +
             `<circle cx="${x}" cy="-34" r="6" style="stroke:${c};stroke-width:1.6;fill:${c}28"/>` +
             uprightText(e, ph, x, -34, 7.5, c);
    }).join('');
  }

  // ២. អនុវត្តរូប IEC សម្រាប់ឧបករណ៍ដែលមានស្រាប់ក្នុង ICON_OF
  const usedIcons = new Set(Object.values(ICON_OF));
  Object.entries(ICON_OF).forEach(([type, name]) => {
    if (type.startsWith('src')) return;
    const d = D[type], ic = ICONS[name];
    if (!d || !ic) { report.push(type + ': ណាមួយបាត់'); return; }
    let fit = fitIcon(ic, d.t, G);
    if (!fit && ADOPT.has(type)) {
      const S = G / 60, n = uniq(ic.t), cx = ic.w / 2, cy = ic.h / 2;
      d.t = n.map(p => [Math.round((p[0] - n[0][0]) / 60), Math.round((p[1] - n[0][1]) / 60)]);
      fit = { rot: 0, ox: -(n[0][0] - cx) * S, oy: -(n[0][1] - cy) * S, S };
    }
    if (!fit) { report.push(type + ': ជើងមិនត្រូវ → ប្រើរូបចាស់'); return; }
    const tf = `translate(${+fit.ox.toFixed(2)} ${+fit.oy.toFixed(2)}) scale(${+fit.S.toFixed(5)}) rotate(${fit.rot}) translate(${-ic.w / 2} ${-ic.h / 2})`;
    const sim = SIM[type] || 'color-mix(in srgb, var(--on) 30%, transparent)';
    d.icon = name;
    d.bb = bbFor(type, d.t, G, ic);
    d.d = (e, s) => {
      let f = 0;
      if (ic.ef && d.c) f = ic.ef[s.cl ? 1 : 0];
      else if (d.ld) f = s.on ? ((type == 'mot3' && (s.dir || 1) < 0 && ic.fr[2]) ? 2 : 1) : 0;
      const body = cleanTextPaths(ic.fr[f] || ic.fr[0], type === 'mot3' || type === 'mot1');
      let spinOverlay = '';
      if (s.on && (type === 'mot3' || type === 'mot1')) {
        const xs = d.t.map(p => p[0] * G);
        const ys = d.t.map(p => p[1] * G);
        const mcX = (Math.min(...xs) + Math.max(...xs)) / 2;
        const mcY = 30;
        const spinR = type === 'mot3' ? 25 : 22;
        spinOverlay = motorSpin360(mcX, mcY, spinR, s.a || 0, s.dir || 1);
      }
      return `<g transform="${tf}" style="--simfill:${sim}">${body}</g>${spinOverlay}`;
    };
  });

  // ៣. ទាញយកនិមិត្តសញ្ញា SVG ដែលនៅសល់ទាំងអស់ពី js/icons.js ចូលក្នុងបណ្ណាល័យ D ដោយស្វ័យប្រវត្តិ!
  Object.entries(ICONS).forEach(([name, ic]) => {
    if (usedIcons.has(name) || SKIP_ICONS.has(name)) return;
    const key = 'ic_' + name;
    if (D[key]) return;

    const S = G / 60;
    const cx = ic.w / 2;
    const cy = ic.h / 2;
    const rawPts = Array.isArray(ic.t) ? ic.t : [];
    const basePt = rawPts[0] || [cx, cy];
    const t = name === 'generator3ph'
      ? [[0, 0], [1, 0], [2, 0], [3, 0], [0.5, 3], [1.5, 3]]
      : rawPts.map(p => [
          Math.round(((p[0] - basePt[0]) / 60) * 2) / 2,
          Math.round(((p[1] - basePt[1]) / 60) * 2) / 2
        ]);

    const ox = -(basePt[0] - cx) * S;
    const oy = -(basePt[1] - cy) * S;
    const tf = `translate(${+ox.toFixed(2)} ${+oy.toFixed(2)}) scale(${+S.toFixed(5)}) translate(${-cx} ${-cy})`;

    const k = resolveCategory(name, ic);
    const pre = guessPrefix(name, k);
    const isMotor = k === 'M';
    const isCoilOrLoad = k === 'C' || k === 'L' || isMotor;
    const isTimer = name.includes('Delay') || name.includes('Flasher');
    const isAuxOrContactor = k === 'A' || k === 'T';
    const isMomentaryBtn = name.startsWith('button');
    const isToggleSw = (k === 'W' && !isMomentaryBtn) || (k === 'P' && !name.startsWith('overload') && !name.startsWith('phaseFailure'));
    const isSource = k === 'S';
    const is3Pos = name === 'switch3p' || name === 'switch3p0';

    const rawContacts = Array.isArray(ic.cp) ? ic.cp : [];
    const pPairs = rawContacts.length
      ? rawContacts.map(c => [c[0], c[1]])
      : (t.length === 2 && !isCoilOrLoad && !isSource ? [[0, 1]] : []);

    const isActuated = e => {
      if (name.startsWith('overload')) return state.tripped.has(e.tag);
      if (isAuxOrContactor) return !!state.out[e.tag];
      if (isMomentaryBtn) return state.pressed.has(e.id);
      if (isToggleSw) return state.tog.has(e.id);
      return false;
    };

    let condFn = null;
    if (name === 'diode') {
      condFn = () => true;
    } else if (is3Pos) {
      condFn = (e, pairIdx = 0) => {
        const pos = state.multiPos?.[e.id] || 0;
        return pos === pairIdx;
      };
    } else if (rawContacts.length > 0) {
      condFn = (e, pairIdx = 0) => {
        const active = isActuated(e);
        const cType = (rawContacts[pairIdx]?.[2] || '').toLowerCase();
        if (name.startsWith('overload')) return !active;
        if (name.startsWith('fuse') && !name.startsWith('fuseSwitch')) return !active;
        if (cType === 'nc') return !active;
        return active;
      };
    } else if (pPairs.length > 0) {
      const defaultClosed = name.startsWith('overload') || (name.startsWith('fuse') && !name.startsWith('fuseSwitch'));
      condFn = e => defaultClosed ? !isActuated(e) : isActuated(e);
    }

    const x0 = ox - cx * S, y0 = oy - cy * S;
    const x1 = x0 + ic.w * S, y1 = y0 + ic.h * S;
    const bb = [Math.min(x0, -12), Math.min(y0, -12), Math.max(x1, 12), Math.max(y1, 12)];

    let srcN = undefined;
    let multiSrc = undefined;
    if (isSource) {
      if (name === 'sourceL1') srcN = 'L1';
      else if (name === 'sourceL2') srcN = 'L2';
      else if (name === 'sourceL3') srcN = 'L3';
      else if (name === 'sourceN') srcN = 'N';
      else if (name === 'sourceGnd' || name === 'junctionPE') srcN = 'PE';
      else if (name === 'sourcePlus') srcN = 'P';
      else if (name === 'sourceNegative') srcN = 'M';
      else if (name === 'battery') multiSrc = ['P', 'M'];
      else if (name === 'sourceL1L2L3') multiSrc = ['L3', 'L2', 'L1'];
      else if (name === 'sourceL1L2L3N') multiSrc = ['N', 'L1', 'L2', 'L3'];
      else if (name === 'generator3ph') multiSrc = ['L1', 'L2', 'L3', 'N', null, null];
      else if (name === 'powerSupply2') multiSrc = [null, 'P', null, 'M'];
      else if (name === 'powerSupply') multiSrc = [null, 'P', null, 'P', null, 'M', 'PE', 'M'];
    }

    const simFill = (k === 'L') ? 'var(--lamp)' : 'color-mix(in srgb, var(--on) 30%, transparent)';

    D[key] = {
      k,
      nm: COMPONENT_META[name]?.nm || ic.nm || name,
      t,
      p: pPairs,
      pre,
      pins: ic.tags || [],
      bb,
      ...(srcN ? { n: srcN } : {}),
      ...(multiSrc ? { multiSrc } : {}),
      ...(isCoilOrLoad ? { ld: isMotor && t.length >= 3 ? 3 : 1 } : {}),
      ...(isTimer ? { tm: name.includes('Off') ? 2 : 1 } : {}),
      ...(condFn ? { c: condFn } : {}),
      d: (e, s) => {
        let f = 0;
        if (is3Pos) {
          f = (state.multiPos?.[e.id] || 0) % (ic.fr.length || 1);
        } else if (name === 'generator3ph') {
          f = s.on ? 1 : 0;
        } else if (ic.ef && condFn) {
          const active = isActuated(e);
          f = ic.ef[active ? 1 : 0] || 0;
        } else if (isCoilOrLoad) {
          f = s.on ? ((isMotor && (s.dir || 1) < 0 && ic.fr[2]) ? 2 : 1) : 0;
        }
        const body = cleanTextPaths(ic.fr[f] || ic.fr[0] || '', isMotor);
        let genFill = '';
        if (name === 'generator3ph' && s.on) {
          genFill = `<circle cx="90" cy="89.82" r="67" style="fill:#fbbf24;stroke:none"/>`;
        }
        let spinOverlay = '';
        if (s.on && isMotor) {
          const mcX = ox;
          const mcY = oy;
          const spinR = Math.min(ic.w, ic.h) * S * 0.42;
          spinOverlay = motorSpin360(mcX, mcY, spinR, s.a || 0, s.dir || 1);
        }
        return `<g transform="${tf}" style="--simfill:${simFill}">${genFill}${body}</g>${spinOverlay}`;
      }
    };
  });

  return report;
}

function brightSrcCol(n, col) {
  return col || '#38bdf8';
}

function uprightText(e, txt, x, y, size, col) {
  const rotDeg = -(e?.r || 0) * 90;
  return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" ` +
         `style="font-size:${size}px;font-weight:700;fill:${col};paint-order:stroke fill;stroke:var(--panel);stroke-width:1.5px;stroke-linejoin:round" ` +
         `transform="rotate(${rotDeg} ${x} ${y})">${txt}</text>`;
}

function motorSpin360(cx, cy, r, angleDeg, dir = 1) {
  const isCW = (dir || 1) >= 0;
  const rotDeg = ((isCW ? angleDeg : -angleDeg) * 1) % 360;
  const sweep = isCW ? 1 : 0;
  const endAng = isCW ? (310 * Math.PI / 180) : (-310 * Math.PI / 180);
  const x0 = +(cx + r).toFixed(2);
  const y0 = +cy.toFixed(2);
  const x1 = +(cx + r * Math.cos(endAng)).toFixed(2);
  const y1 = +(cy + r * Math.sin(endAng)).toFixed(2);
  const tx = isCW ? -Math.sin(endAng) : Math.sin(endAng);
  const ty = isCW ? Math.cos(endAng) : -Math.cos(endAng);
  const headAng = +(Math.atan2(ty, tx) * 180 / Math.PI).toFixed(1);
  return `<g transform="rotate(${rotDeg.toFixed(1)} ${cx} ${cy})" style="pointer-events:none">` +
         `<path d="M${x0} ${y0} A${r} ${r} 0 1 ${sweep} ${x1} ${y1}" style="fill:none;stroke:#ef4444;stroke-width:2.6;stroke-linecap:round"/>` +
         `<polygon points="0,-4.2 8.5,0 0,4.2" transform="translate(${x1} ${y1}) rotate(${headAng})" style="fill:#ef4444;stroke:none"/>` +
         `</g>`;
}

function cleanTextPaths(svgStr, isMotor = false) {
  let out = String(svgStr || '');
  out = out.replace(/style="([^"]*fill:var\(--ink\)[^"]*)"/gi, (m, st) =>
    /stroke\s*:/i.test(st) ? m : `style="${st};stroke:none"`
  );
  if (isMotor) {
    out = out.replace(/<path\b[^>]*27\.85[^>]*\/?>/gi, '');
    out = out.replace(/<path\b[^>]*73\.5\s+0\s+0\s+1\s+73\.5[^>]*\/?>/gi, '');
    out = out.replace(/<path\b[^>]*66\.5\s+0\s+0\s+1\s+66\.5[^>]*\/?>/gi, '');
  }
  return out;
}

function uniq(pts) {
  const seen = new Set();
  return (pts || []).filter(p => {
    const k = p[0] + ',' + p[1];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function fitIcon(ic, targetT, G) {
  try {
    const srcPts = uniq(ic?.t);
    const dstPts = uniq(targetT);
    if (!srcPts.length || srcPts.length !== dstPts.length) return null;
    const S = G / 60;
    const cx = ic.w / 2;
    const cy = ic.h / 2;
    const dstSet = new Set(dstPts.map(p => `${Math.round(p[0] * G)},${Math.round(p[1] * G)}`));
    const [dx0, dy0] = dstPts[0];

    for (const r of [0, 90, 270, 180]) {
      const fn = ROT[r];
      const mapped = srcPts.map(([px, py]) => fn((px - cx) * S, (py - cy) * S));
      const ox = dx0 * G - mapped[0][0];
      const oy = dy0 * G - mapped[0][1];
      const ok = mapped.every(([mx, my]) => dstSet.has(`${Math.round(mx + ox)},${Math.round(my + oy)}`));
      if (ok) return { rot: r, ox, oy, S };
    }
  } catch (_) {}
  return null;
}

function bbFor(type, t, G, ic) {
  const S = G / 60;
  const xs = t.map(p => p[0] * G);
  const ys = t.map(p => p[1] * G);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  if (type === 'mot3') return [-10, -4, 50, 56];
  if (type === 'mot1') return [-16, -4, 36, 56];
  if (type.startsWith('btn') || type === 'estop' || type === 'swNO') return [minX - 6, minY - 22, maxX + 6, maxY + 10];
  const pad = Math.max(12, Math.min(ic.w, ic.h) * S * 0.28);
  return [minX - pad, minY - pad, maxX + pad, maxY + pad];
}