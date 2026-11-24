/* ==========================================================================
   ឯកសារ៖ js/components.js
   តួនាទី៖ កំណត់និមិត្តសញ្ញា SVG ជើងភ្ជាប់ និងលក្ខណៈឧបករណ៍ស្តង់ដារ IEC ទាំងអស់
   ========================================================================== */
import { state, esc } from './state.js';
import { applyIcons } from './symbols.js';

export const G = 20; // ទំហំ 1 ក្រឡាចត្រង្គ = 20px

// ពណ៌ស្តង់ដារ IEC សម្រាប់ហ្វាសនីមួយៗ
export const COL = {
  L1: '#d97706', L2: '#dc2626', L3: '#7c3aed',
  N:  '#0284c7', PE: '#16a34a', P:  '#e11d48', M:  '#2563eb'
};

// ប្រភេទក្រុមឧបករណ៍ក្នុងបណ្ណាល័យ
export const CAT = {
  S: ['ប្រភពភ្លើង (Sources)', '#10b981'],
  P: ['ការពារ (Protection & Breakers)', '#ef4444'],
  W: ['ប៊ូតុង & កុងតាក់ (Buttons/Switches)', '#8b5cf6'],
  C: ['បូប៊ីន & កំណត់ពេល (Coils/Timers)', '#f59e0b'],
  A: ['កុងតាក់ជំនួយ (Aux Contacts)', '#3b82f6'],
  T: ['កុងតាក់ទ័រ (Power Contactors)', '#06b6d4'],
  L: ['ចង្កៀង & សំឡេង (Indicators)', '#eab308'],
  M: ['ម៉ូទ័រ (Motors)', '#14b8a6'],
  X: ['អក្សរ & ចំណាំ (Text & Labels)', '#64748b']
};

// អនុគមន៍ជំនួយសម្រាប់គូររូបភាព SVG
const P = d => `<path d="${d}"/>`;
const tx = (e, s, x, y, z = 10, cls = '') =>
  `<text x="${x}" y="${y}" text-anchor="middle" class="${cls}" style="font-size:${z}px" transform="rotate(${-e.r * 90} ${x} ${y - 3})">${s}</text>`;
const leadH = 'M0 0H10M30 0H40';
const swH = (s, extra = '') => P(leadH) + P(s.cl ? 'M10 0H30' : 'M10 0L28 -11') + extra;
const ncBar = P('M30 -7V7M26 0H30');
const btnAct = s => {
  const d = s.pr ? 6 : 0;
  return P(`M13 ${-24 + d}H27M20 ${-24 + d}V${-12 + d}`) + `<path stroke-dasharray="2 2" d="M20 ${-12 + d}V-5"/>`;
};
const pole3 = (s, extra = '') =>
  [0, 20, 40].map(a => P(`M${a} 0V10M${a} 30V40`) + P(s.cl ? `M${a} 10V30` : `M${a} 10L${a - 8} 28`)).join('') + extra;
const spin = (x, y, a, dir = 1) =>
  `<g transform="rotate(${a * dir} ${x} ${y})"><path d="M${x} ${y - 9}A9 9 0 0 1 ${x + 9} ${y}" style="stroke:var(--on);stroke-width:2.2"/><path d="M${x + 6} ${y - 3}L${x + 9} ${y}L${x + 12} ${y - 3}" style="stroke:var(--on);stroke-width:1.8"/></g>`;
const coilBox = (x, w, l) => (e, s) =>
  P(leadH) + `<rect x="${x}" y="-10" width="${w}" height="20" rx="2" class="body ${s.on ? 'on' : ''}"/>` + tx(e, l, 20, 4, l.length > 2 ? 8 : 11);

// និយមន័យឧបករណ៍ទាំងអស់ (D)
export const D = {};

// ១. ប្រភពភ្លើង (Sources)
[['L1', 'L1'], ['L2', 'L2'], ['L3', 'L3'], ['N', 'N'], ['PE', 'PE'], ['P', '+'], ['M', '−']].forEach(([n, lb]) => {
  D['src' + n] = {
    k: 'S', nm: 'ប្រភព ' + lb, t: [[0, 0]], n, bb: [-12, -4, 12, 32],
    d: (e) => P('M0 0V10') + `<circle cy="20" r="10" style="stroke:${COL[n]};fill:${COL[n]}22"/>` + tx(e, lb, 0, 24, 11)
  };
});
D.src3ph = {
  k: 'S', nm: 'ប្រភព 3 ហ្វាស (L1-L2-L3)', t: [[0, 0], [1, 0], [2, 0]], multiSrc: ['L1', 'L2', 'L3'], bb: [-6, -24, 46, 4],
  d: (e) => [0, 20, 40].map((x, i) => {
    const n = ['L1', 'L2', 'L3'][i];
    return P(`M${x} 0V-8`) + `<circle cx="${x}" cy="-15" r="7" style="stroke:${COL[n]};fill:${COL[n]}22"/>` + tx(e, n, x, -12, 8);
  }).join('')
};

// ២. ឧបករណ៍ការពារ (Protection & Breakers)
D.fuse = { k: 'P', nm: 'ហ្វុយស៊ីប (Fuse 1P)', t: [[0, 0], [2, 0]], p: [[0, 1]], pre: 'F', pins: ['1', '2'], bb: [0, -9, 40, 9], c: () => true, d: () => P(leadH) + '<rect x="10" y="-6" width="20" height="12" rx="1"/>' + P('M10 0H30') };
D.brk1 = { k: 'P', nm: 'ប្រេកគ័រ 1P', t: [[0, 0], [2, 0]], p: [[0, 1]], pre: 'Q', pins: ['1', '2'], bb: [0, -14, 40, 10], c: e => state.tog.has(e.id), d: (e, s) => swH(s, P('M17 -4L23 4M23 -4L17 4')) };
D.brk2 = { k: 'P', nm: 'ប្រេកគ័រ 2P', t: [[0, 0], [0, 2], [1, 0], [1, 2]], p: [[0, 1], [2, 3]], pre: 'Q', pins: ['1', '2', '3', '4'], bb: [-10, -4, 26, 44], c: e => state.tog.has(e.id), d: (e, s) => [0, 20].map(a => P(`M${a} 0V10M${a} 30V40`) + P(s.cl ? `M${a} 10V30` : `M${a} 10L${a - 8} 28`) + P(`M${a - 3} 7L${a + 3} 13M${a + 3} 7L${a - 3} 13`)).join('') + '<path stroke-dasharray="3 2" d="M-4 20H20"/>' };
D.brk3 = { k: 'P', nm: 'ប្រេកគ័រ 3P', t: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]], p: [[0, 1], [2, 3], [4, 5]], pre: 'Q', pins: ['1', '2', '3', '4', '5', '6'], bb: [-10, -4, 46, 44], c: e => state.tog.has(e.id), d: (e, s) => pole3(s, '<path stroke-dasharray="3 2" d="M-4 20H40"/>' + [0, 20, 40].map(a => P(`M${a - 3} 7L${a + 3} 13M${a + 3} 7L${a - 3} 13`)).join('')) };
D.mbrk3 = { k: 'P', nm: 'ប្រេកគ័រម៉ូទ័រ', t: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]], p: [[0, 1], [2, 3], [4, 5]], pre: 'QM', pins: ['1', '2', '3', '4', '5', '6'], bb: [-12, -4, 46, 44], c: e => state.tog.has(e.id) && !state.tripped.has(e.tag), d: (e, s) => pole3(s, '<path stroke-dasharray="3 2" d="M-8 20H40"/><rect x="-11" y="15" width="6" height="10"/>' + [0, 20, 40].map(a => P(`M${a - 3} 7L${a + 3} 13M${a + 3} 7L${a - 3} 13`)).join('')) };
D.ol3 = { k: 'P', nm: 'រ៉េឡេកម្ដៅ 3P', t: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]], p: [[0, 1], [2, 3], [4, 5]], pre: 'F', pins: ['1', '2', '3', '4', '5', '6'], bb: [-10, -4, 46, 44], c: e => !state.tripped.has(e.tag), d: (e, s) => [0, 20, 40].map(a => P(`M${a} 0V12H${a + 5}V20H${a - 5}V28H${a}V40`)).join('') + `<rect x="-6" y="10" width="52" height="20" rx="2" class="body ${s.tr ? 'trip' : ''}"/>` };
D.olNC = { k: 'P', nm: 'ជំនួយកម្ដៅ NC (95-96)', t: [[0, 0], [2, 0]], p: [[0, 1]], pre: 'F', pins: ['95', '96'], bb: [0, -14, 40, 10], c: e => !state.tripped.has(e.tag), d: (e, s) => swH(s, ncBar) };
D.olNO = { k: 'P', nm: 'ជំនួយកម្ដៅ NO (97-98)', t: [[0, 0], [2, 0]], p: [[0, 1]], pre: 'F', pins: ['97', '98'], bb: [0, -14, 40, 10], c: e => state.tripped.has(e.tag), d: (e, s) => swH(s) };

// ៣. ប៊ូតុង និងកុងតាក់ (Buttons & Switches)
D.btnNO = { k: 'W', nm: 'ប៊ូតុងចុច NO', t: [[0, 0], [2, 0]], p: [[0, 1]], pre: 'S', pins: ['13', '14'], bb: [0, -28, 40, 10], c: e => state.pressed.has(e.id), d: (e, s) => swH(s, btnAct(s)) };
D.btnNC = { k: 'W', nm: 'ប៊ូតុងចុច NC', t: [[0, 0], [2, 0]], p: [[0, 1]], pre: 'S', pins: ['21', '22'], bb: [0, -28, 40, 10], c: e => !state.pressed.has(e.id), d: (e, s) => swH(s, btnAct(s) + ncBar) };
D.estop = { k: 'W', nm: 'ប៊ូតុងសង្គ្រោះបន្ទាន់', t: [[0, 0], [2, 0]], p: [[0, 1]], pre: 'S', pins: ['21', '22'], bb: [0, -28, 40, 10], c: e => !state.tog.has(e.id), d: (e, s) => { const d = s.cl ? 0 : 5; return swH(s, ncBar + `<path d="M12 ${-18 + d}A8 8 0 0 1 28 ${-18 + d}Z" style="fill:var(--danger);stroke:var(--danger)"/><path d="M20 ${-18 + d}V${-6 + d}"/>`); } };
D.swNO = { k: 'W', nm: 'កុងតាក់បិទ/បើក', t: [[0, 0], [2, 0]], p: [[0, 1]], pre: 'S', pins: ['13', '14'], bb: [0, -22, 40, 10], c: e => state.tog.has(e.id), d: (e, s) => swH(s, P('M20 -6V-18M15 -18L25 -14')) };

// ៤. បូប៊ីន និងកំណត់ពេល (Coils & Timers)
D.coil = { k: 'C', nm: 'បូប៊ីនរ៉េឡេ / កុងតាក់ទ័រ', t: [[0, 0], [2, 0]], pre: 'K', pins: ['A1', 'A2'], ld: 1, bb: [0, -12, 40, 12], d: coilBox(9, 22, 'K') };
D.timerOn = { k: 'C', nm: 'កំណត់ពេល ON-Delay', t: [[0, 0], [2, 0]], pre: 'KT', pins: ['A1', 'A2'], ld: 1, tm: 1, bb: [0, -12, 40, 12], d: (e, s) => P(leadH) + `<rect x="6" y="-10" width="28" height="20" rx="2" class="body ${s.on ? 'on' : ''}"/>` + P('M6 -10L13 0L6 10') + tx(e, 'TON', 23, 4, 8) };
D.timerOff = { k: 'C', nm: 'កំណត់ពេល OFF-Delay', t: [[0, 0], [2, 0]], pre: 'KT', pins: ['A1', 'A2'], ld: 1, tm: 2, bb: [0, -12, 40, 12], d: (e, s) => P(leadH) + `<rect x="6" y="-10" width="28" height="20" rx="2" class="body ${s.on ? 'on' : ''}"/>` + `<rect x="6" y="-10" width="6" height="20" style="fill:var(--ink)"/>` + tx(e, 'TOF', 23, 4, 8) };

// ៥. កុងតាក់ជំនួយ និងកុងតាក់ទ័រ (Aux Contacts & Power Contactors)
D.conNO = { k: 'A', nm: 'កុងតាក់ជំនួយ NO', t: [[0, 0], [2, 0]], p: [[0, 1]], pre: 'K', pins: ['13', '14'], bb: [0, -14, 40, 10], c: e => !!state.out[e.tag], d: (e, s) => swH(s) };
D.conNC = { k: 'A', nm: 'កុងតាក់ជំនួយ NC', t: [[0, 0], [2, 0]], p: [[0, 1]], pre: 'K', pins: ['21', '22'], bb: [0, -14, 40, 10], c: e => !state.out[e.tag], d: (e, s) => swH(s, ncBar) };
D.tmNO = { k: 'A', nm: 'កុងតាក់ Timer NO', t: [[0, 0], [2, 0]], p: [[0, 1]], pre: 'KT', pins: ['17', '18'], bb: [0, -16, 40, 10], c: e => !!state.out[e.tag], d: (e, s) => swH(s, '<path d="M16 -6C16 -12 24 -12 24 -6"/>') };
D.tmNC = { k: 'A', nm: 'កុងតាក់ Timer NC', t: [[0, 0], [2, 0]], p: [[0, 1]], pre: 'KT', pins: ['15', '16'], bb: [0, -16, 40, 10], c: e => !state.out[e.tag], d: (e, s) => swH(s, ncBar + '<path d="M16 -6C16 -12 24 -12 24 -6"/>') };
D.ct3 = { k: 'T', nm: 'កុងតាក់ទ័រ 3P', t: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]], p: [[0, 1], [2, 3], [4, 5]], pre: 'K', pins: ['1', '2', '3', '4', '5', '6'], bb: [-10, -4, 46, 44], c: e => !!state.out[e.tag], d: (e, s) => pole3(s, '<path stroke-dasharray="3 2" d="M-4 20H40"/>') };

// ៦. ចង្កៀងសញ្ញា Run, Stop, Trip និងសំឡេងរោទិ៍ (Indicators)
D.lamp = { k: 'L', nm: 'ចង្កៀងសញ្ញា (លឿង)', t: [[0, 0], [2, 0]], pre: 'H', pins: ['X1', 'X2'], ld: 1, bb: [0, -12, 40, 12], d: (e, s) => P(leadH) + `<circle cx="20" r="10" class="body ${s.on ? 'lamp' : ''}"/>` + P('M13 -7L27 7M27 -7L13 7') };
D.lampRun = { k: 'L', nm: 'ចង្កៀង Run (បៃតង)', t: [[0, 0], [2, 0]], pre: 'H', pins: ['X1', 'X2'], ld: 1, bb: [0, -12, 40, 12], d: (e, s) => P(leadH) + `<circle cx="20" r="10" class="body ${s.on ? 'lamp-run' : ''}"/>` + P('M13 -7L27 7M27 -7L13 7') };
D.lampStop = { k: 'L', nm: 'ចង្កៀង Stop (ក្រហម)', t: [[0, 0], [2, 0]], pre: 'H', pins: ['X1', 'X2'], ld: 1, bb: [0, -12, 40, 12], d: (e, s) => P(leadH) + `<circle cx="20" r="10" class="body ${s.on ? 'lamp-stop' : ''}"/>` + P('M13 -7L27 7M27 -7L13 7') };
D.lampTrip = { k: 'L', nm: 'ចង្កៀង Trip (ទឹកក្រូច)', t: [[0, 0], [2, 0]], pre: 'H', pins: ['X1', 'X2'], ld: 1, bb: [0, -12, 40, 12], d: (e, s) => P(leadH) + `<circle cx="20" r="10" class="body ${s.on ? 'lamp-trip' : ''}"/>` + P('M13 -7L27 7M27 -7L13 7') };
D.buzz = { k: 'L', nm: 'សំឡេងរោទិ៍', t: [[0, 0], [2, 0]], pre: 'HA', pins: ['X1', 'X2'], ld: 1, bb: [0, -14, 40, 14], d: (e, s) => P('M0 0H12M28 0H40') + `<path d="M12 -10H22L28 -15V15L22 10H12Z" class="body ${s.on ? 'lamp' : ''}"/>` };

// ៧. ម៉ូទ័រ (Motors)
D.mot1 = { k: 'M', nm: 'ម៉ូទ័រ 1 ហ្វាស', t: [[0, 0], [2, 0]], ld: 1, pre: 'M', pins: ['U1', 'U2'], bb: [0, -16, 40, 16], d: (e, s) => P('M0 0H6M34 0H40') + `<circle cx="20" r="14" class="body ${s.on ? 'on' : ''}"/>` + tx(e, 'M 1~', 20, 4, 9) + (s.on ? spin(20, 0, s.a, 1) : '') };
D.mot3 = { k: 'M', nm: 'ម៉ូទ័រ 3 ហ្វាស', t: [[0, 0], [1, 0], [2, 0]], ld: 3, pre: 'M', pins: ['U', 'V', 'W'], bb: [-4, -4, 44, 64], d: (e, s) => P('M0 0V24M20 0V18M40 0V24') + `<circle cx="20" cy="40" r="22" class="body ${s.on ? 'on' : ''}"/>` + tx(e, 'M 3~', 20, 44, 11) + (s.on ? spin(20, 40, s.a, s.dir || 1) : '') };

// ៨. អក្សរ & ចំណាំ (Text & Labels)
D.txt = {
  k: 'X', nm: 'អក្សរចំណាំ (Text Label)', t: [], isText: true, bb: [-45, -18, 45, 14],
  d: (e) => {
    const label = esc(e.text || 'អក្សរ / Text');
    const fs = Math.min(120, Math.max(0, Number(e.fontSize ?? 14)));
    const ff = esc(e.fontFamily || "'Noto Sans Khmer', sans-serif");
    const fc = esc(e.fontColor || 'var(--ink)');
    const estW = Math.max(40, label.length * (fs * 0.65) + 12);
    const estH = Math.max(16, fs + 8);
    D.txt.bb = [-estW / 2, -estH / 2, estW / 2, estH / 2];
    if (fs <= 0) return '';
    return `<text x="0" y="0" text-anchor="middle" dominant-baseline="central" ` +
           `style="font-size:${fs}px;font-family:${ff};font-weight:700;fill:${fc};stroke:none;background:transparent">${label}</text>`;
  }
};

// អនុគមន៍គណនាធរណីមាត្រ (បង្វិល, ទីតាំងជើង, ការចុចចំឧបករណ៍)
export const rot = (a, b, r) => { for (let i = 0; i < r; i++) [a, b] = [-b, a]; return [a, b]; };
export const tp = e => D[e.type].t.map(([a, b]) => { const [c, d] = rot(a, b, e.r); return [e.x + c, e.y + d]; });
export const hitE = (e, px, py) => {
  if (D[e.type]?.isText) {
    const label = String(e.text || 'អក្សរ / Text');
    const fs = Math.min(120, Math.max(8, Number(e.fontSize ?? 14)));
    const w = Math.max(40, label.length * (fs * 0.65) + 12);
    const h = Math.max(20, fs + 10);
    let a = px - e.x * G, b = py - e.y * G;
    for (let i = 0; i < e.r; i++) [a, b] = [b, -a];
    return Math.abs(a) <= w / 2 + 6 && Math.abs(b) <= h / 2 + 6;
  }
  const [b0, b1, b2, b3] = D[e.type].bb;
  let a = px - e.x * G, b = py - e.y * G;
  for (let i = 0; i < e.r; i++) [a, b] = [b, -a];
  return a > b0 - 5 && a < b2 + 5 && b > b1 - 5 && b < b3 + 5;
};
export const dseg = (px, py, w) => {
  const [a, b, c, d] = w.map(x => x * G), l = (c - a) ** 2 + (d - b) ** 2;
  const t = l ? Math.max(0, Math.min(1, ((px - a) * (c - a) + (py - b) * (d - b)) / l)) : 0;
  return Math.hypot(px - (a + t * (c - a)), py - (b + t * (d - b)));
};
export const cond = e => { const d = D[e.type]; return d.c ? d.c(e) : 0; };
export const pinOf = (e, i) => (e.pins && e.pins[i] !== undefined) ? e.pins[i] : ((D[e.type].pins || [])[i] || '');
export const IEC_KIND = { conNO: 'NO', btnNO: 'NO', swNO: 'NO', tmNO: 'NO', conNC: 'NC', btnNC: 'NC', estop: 'NC', tmNC: 'NC' };
export const iecPins = (kind, n) => kind === 'NO' ? [n + '3', n + '4'] : [(n + 1) + '1', (n + 1) + '2'];

// ជំនួសនិមិត្តសញ្ញាចាស់ដោយរូប SVG តាមស្តង់ដារ IEC
export const ICON_REPORT = applyIcons(D, G, COL);