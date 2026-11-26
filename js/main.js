/* ==========================================================================
   ឯកសារ៖ js/main.js
   តួនាទី៖ ចំណុចចាប់ផ្តើមកម្មវិធី ភ្ជាប់ Event ចុច/អូស Undo/Redo និងការរក្សាទុក
   ========================================================================== */
import { state, Q, esc } from './state.js';
import { G, D, tp, hitE, dseg, pinOf, IEC_KIND, iecPins } from './components.js';
import { LIBRARY_CATEGORIES, LIBRARY_ITEMS, applyLibraryConfig } from './library.js';
import { tick, stat } from './solver.js';
import { draw, addWire, addPolyline, fitScreen, follow, fixWires } from './renderer.js';
import { EXAMPLES } from './examples.js';
import { rerouteMoved, dragSegment, netSig, cleanWires, occupied, startMove, planMove, freeSpot, guidesFor, chainOf, mergeLeg } from './wiring.js';
import { initShell, setRunUi, toggleLang, toggleTheme, keysHelp } from './shell.js';
import { load as loadSettings, apply as applySettings, settingsUI, bindSettings, capture } from './settings.js';

const vib = (ms = 12) => { if (state.opt.vibrate && navigator.vibrate) navigator.vibrate(ms); };

// មុខងារប្រវត្តិ Undo / Redo និងការរក្សាទុក LocalStorage
const ser = () => JSON.stringify({ els: state.els, wires: state.wires, nid: state.nid, texts: state.texts });
function tbar() {
  const u = Q('#undo'), r = Q('#redo');
  if (u) u.disabled = !state.hist.length;
  if (r) r.disabled = !state.fut.length;
}
function push() {
  state.hist.push(ser());
  if (state.hist.length > 80) state.hist.shift();
  state.fut = [];
  tbar();
}
function restore(s) {
  const d = JSON.parse(s);
  state.els = d.els; state.wires = d.wires; state.nid = d.nid; state.texts = d.texts || [];
  state.sel = null; state.selW = -1; state.selT = null;
  sheet(); draw(); tbar();
}
const undo = () => { if (state.hist.length) { state.fut.push(ser()); restore(state.hist.pop()); } };
const redo = () => { if (state.fut.length) { state.hist.push(ser()); restore(state.fut.pop()); } };

const LS = {
  get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } },
  set: (k, x) => { try { localStorage.setItem(k, x); } catch (_) {} },
  del: k => { try { localStorage.removeItem(k); } catch (_) {} },
  keys: () => { try { return Object.keys(localStorage).filter(k => k.startsWith('rly:')); } catch (_) { return []; } }
};

function flash(m) { stat(m); setTimeout(() => stat(), 2000); }

// របៀបគូរខ្សែ (ប៊ូតុង «ខ្សែ»)
function wmHint() { stat(state.wp ? 'ចុចកន្លែងទំនេរ = បន្ថែមកែង · ចុចជើង = បញ្ចប់ខ្សែ · ចុចចំណុចចុងក្រោយម្តងទៀត = ថយក្រោយ' : 'របៀបគូរខ្សែ៖ ចុចជើងឧបករណ៍ ដើម្បីចាប់ផ្តើម'); }
function setWireMode(on) {
  state.wireMode = on; state.wp = null; state.wcur = null; state.mode = null;
  const b = Q('#wm'); if (b) b.classList.toggle('on', on);
  if (on) { state.sel = null; state.selW = -1; sheet(); wmHint(); } else stat();
  draw();
}

// ចាប់ផ្តើម ឬបញ្ឈប់ Simulation
function run() {
  if (state.wireMode) setWireMode(false);
  state.sim = !state.sim;
  if (state.sim) {
    state.out = {}; state.acc = {}; state.dact = {}; state.pressed.clear(); state.sel = null; state.selW = -1; state.last = 0;
    tick();
    state.tm = setInterval(tick, 50);
  } else {
    clearInterval(state.tm);
    state.live = null;
    state.pressed.clear();
    state.tog.clear();
    state.tripped.clear();
  }
  setRunUi(state.sim);
  sheet(); draw(); stat();
}

// បន្ថែមឧបករណ៍ថ្មីទៅលើផ្ទាំងគូរប្លង់
function place(t, customTag = '', posGrid = null, keepLibOpen = false) {
  push(); vib();
  const svg = Q('#cv'), d = D[t], r = svg.getBoundingClientRect();
  const x = posGrid ? posGrid[0] : Math.round((state.v.x + (r.width || 800) / state.v.k / 2) / G);
  const y = posGrid ? posGrid[1] : Math.round((state.v.y + (r.height || 600) / state.v.k / 2) / G);
  const spot = freeSpot({ type: t, x, y, r: 0 }, state.els, state.wires, tp);
  let n = 1;
  if (d.pre !== undefined) while (state.els.some(e => D[e.type].pre == d.pre && e.tag == d.pre + n)) n++;
  state.els.push({
    id: state.nid, type: t, x: spot[0], y: spot[1], r: 0,
    tag: customTag || (d.pre === undefined ? '' : (d.k == 'A' || d.k == 'T' ? d.pre + '1' : d.pre + n)),
    sec: 3
  });
  state.sel = state.nid++; state.selW = -1;
  if (!keepLibOpen) panel();
  sheet(); draw();
}

// ប្តូរលំដាប់គូរ (ស្រទាប់ ខាងមុខ/ខាងក្រោយ)
const termKeys = () => new Set(state.els.flatMap(tp).map(p => p[0] + ',' + p[1]));
function reorder(front) {
  const i = state.els.findIndex(e => e.id == state.sel);
  if (i >= 0) { push(); const [e] = state.els.splice(i, 1); front ? state.els.push(e) : state.els.unshift(e); }
  else if (state.selW >= 0 && state.wires[state.selW]) {
    push();
    const set = new Set(chainOf(state.wires, termKeys(), state.selW));
    const moved = state.wires.filter((_, j) => set.has(j)), rest = state.wires.filter((_, j) => !set.has(j)), k = moved.indexOf(state.wires[state.selW]);
    state.wires = front ? rest.concat(moved) : moved.concat(rest);
    state.selW = (front ? rest.length : 0) + k;
  }
  else return;
  sheet(); draw();
}
const layerBtns = '<button class="b" data-a="front">ខាងមុខ</button><button class="b" data-a="back">ខាងក្រោយ</button>';

// ផ្ទាំងកែប្រែឧបករណ៍នៅខាងក្រោម (Bottom Sheet)
function sheet() {
  const e = state.els.find(a => a.id == state.sel), sh = Q('#sheet'), tx = state.texts.find(a => a.id == state.selT);
  sh.hidden = !(e || state.selW >= 0 || tx) || state.sim;
  if (sh.hidden) return;
  if (tx && !e) {
    sh.innerHTML = `<b>អត្ថបទ</b><label>អក្សរ <input id="tt" value="${esc(tx.t)}" size="14" maxlength="80"></label><label>ទំហំ <input id="ts" type="number" min="8" max="48" value="${tx.sz}" style="width:60px"></label><button class="b del" data-a="del">លុប</button>`;
    const a = Q('#tt'), b = Q('#ts');
    a.onfocus = b.onfocus = push; a.oninput = () => { tx.t = a.value; draw(); }; b.oninput = () => { tx.sz = Math.min(48, Math.max(8, +b.value || 14)); draw(); };
    return;
  }
  if (!e) { sh.innerHTML = '<b>ខ្សែភ្លើង</b>' + layerBtns + '<button class="b del" data-a="delw">លុប</button>'; return; }
  const d = D[e.type];
  sh.innerHTML = `<b>${d.nm}</b>` +
    (d.pre !== undefined ? `<label>ស្លាក <input id="tg" value="${esc(e.tag)}" size="5"></label>` : '') +
    ((d.tm || d.dly) ? `<label>វិនាទី <input id="sc" type="number" min="0" step="0.5" value="${e.sec}" style="width:65px"></label>` : '') +
    pinUI(e, d) +
    layerBtns +
    '<button class="b" data-a="rot">បង្វិល</button>' +
    '<button class="b" data-a="dup">ចម្លង</button>' +
    '<button class="b del" data-a="del">លុប</button>';
  const tg = Q('#tg'); if (tg) { tg.onfocus = push; tg.oninput = () => { e.tag = tg.value.slice(0, 8); draw(); }; }
  const sc = Q('#sc'); if (sc) { sc.onfocus = push; sc.oninput = () => { e.sec = Math.max(0, +sc.value || 0); draw(); }; }
  bindPins(e, d);
}

function pinUI(e, d) {
  if (!d.pins) return '';
  const kind = IEC_KIND[e.type];
  const pick = kind ? `<label>IEC <select id="iec"><option value="">…</option>${[1, 2, 3, 4].map(n => `<option value="${n}">${iecPins(kind, n).join('/')}</option>`).join('')}</select></label>` : '';
  return pick + d.t.map((_, i) => `<label>ជើង${i + 1} <input class="pin" data-i="${i}" value="${esc(pinOf(e, i))}" size="3" maxlength="4"></label>`).join('');
}
function bindPins(e, d) {
  document.querySelectorAll('#sheet .pin').forEach(inp => {
    inp.onfocus = push;
    inp.oninput = () => { e.pins = e.pins || [...(d.pins || [])]; e.pins[+inp.dataset.i] = inp.value.slice(0, 4); draw(); };
  });
  const ie = Q('#iec');
  if (ie) ie.onchange = () => { const n = +ie.value; if (!n) return; push(); e.pins = iecPins(IEC_KIND[e.type], n); sheet(); draw(); };
}

function panel(m) {
  ['#lib', '#menu'].forEach(s => Q(s).hidden = s != '#' + m);
  Q('#bd').hidden = !m;
  if (m == 'menu') Q('#pn').textContent = state.proj;
}

function modal(t, h, f) {
  Q('#mt').textContent = t; Q('#mb').innerHTML = h; Q('#md').hidden = false; if (f) f();
}

function load(d) {
  if (!d || !Array.isArray(d.els) || !Array.isArray(d.wires)) throw new Error('bad json');
  const els = d.els.map(e => ({
    id: +e.id || 0, type: e.type in D ? e.type : 'lamp',
    x: +e.x | 0, y: +e.y | 0, r: ((+e.r | 0) % 4 + 4) % 4,
    tag: String(e.tag ?? '').slice(0, 8), sec: +e.sec || 0,
    ...(e.locked ? { locked: true } : {}),
    ...(Array.isArray(e.pins) ? { pins: e.pins.slice(0, 6).map(x => String(x).slice(0, 4)) } : {})
  }));
  const texts = (Array.isArray(d.texts) ? d.texts : []).map((t, i) => ({ id: +t.id || i + 1, x: +t.x || 0, y: +t.y || 0, t: String(t.t ?? '').slice(0, 80), sz: Math.min(48, Math.max(8, +t.sz || 14)) }));
  const wires = d.wires.map(w => w.map(x => +x | 0)).filter(w => w.length == 4);
  if (state.sim) run();
  push();
  state.els = els; state.wires = wires; state.texts = texts;
  state.nid = Math.max(0, ...els.map(e => e.id)) + 1;
  state.sel = null; state.selW = -1; state.selT = null; sheet(); fitScreen();
}

function loadExample(key) {
  if (state.sim) run();
  push();
  EXAMPLES[key].build();
  state.texts = [];
  state.proj = EXAMPLES[key].name;
  state.sel = null; state.selW = -1; state.selT = null; sheet(); fitScreen();
}

// បញ្ជីសកម្មភាពប៊ូតុងទាំងអស់ (Actions)
const A = {
  menu: () => panel('menu'),
  lib: () => panel('lib'),
  run, undo, redo,
  zin: () => zoomC(1.25),
  zout: () => zoomC(0.8),
  fit: fitScreen,
  close: () => panel(),
  mclose: () => Q('#md').hidden = true,
  capture() { A.mclose(); capture(); },
  fullscr() { A.mclose(); document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); },
  fit2() { A.mclose(); fitScreen(); },
  rot() {
    const e = state.els.find(a => a.id == state.sel); if (!e) return;
    const mv = startMove(state.wires, e, state.els, tp), r0 = e.r;
    e.r = (r0 + 1) % 4;
    const cand = planMove(mv, e, e.x, e.y, state.els, tp);
    e.r = r0;
    if (!cand) { flash('មិនអាចបង្វិលនៅទីនេះ៖ ជើងនឹងជាន់ចំណុចខ្សែផ្សេង'); return; }
    push(); e.r = (r0 + 1) % 4; state.wires = cand; state.selW = -1; draw();
  },
  dup() {
    const e = state.els.find(a => a.id == state.sel); if (!e) return;
    push();
    const c = { ...e, pins: e.pins && [...e.pins], id: state.nid, x: e.x + 1, y: e.y + 1 };
    [c.x, c.y] = freeSpot(c, state.els, state.wires, tp);
    state.els.push(c); state.sel = state.nid++; sheet(); draw();
  },
  front: () => reorder(true), back: () => reorder(false),
  wiremode() { if (state.sim) return; setWireMode(!state.wireMode); },
  del() {
    if (state.selT != null) { push(); state.texts = state.texts.filter(t => t.id != state.selT); state.selT = null; sheet(); draw(); return; }
    if (state.sel == null) return;
    push(); state.els = state.els.filter(e => e.id != state.sel); state.sel = null; sheet(); draw();
  },
  copy() { const e = state.els.find(a => a.id == state.sel); if (e) { state.clip = JSON.parse(JSON.stringify(e)); flash('✓ បានចម្លង'); } },
  paste() {
    if (!state.clip) return;
    push();
    const c = { ...JSON.parse(JSON.stringify(state.clip)), id: state.nid, x: state.clip.x + 1, y: state.clip.y + 1 };
    delete c.locked;
    [c.x, c.y] = freeSpot(c, state.els, state.wires, tp);
    state.els.push(c); state.sel = state.nid++; state.selW = -1; state.selT = null; sheet(); draw();
  },
  lock() { const e = state.els.find(a => a.id == state.sel); if (!e) return; push(); e.locked = !e.locked; sheet(); draw(); flash(e.locked ? '🔒 បានចាក់សោ' : '🔓 បានដោះសោ'); },
  text() {
    if (state.sim) return;
    push();
    const r = Q('#cv').getBoundingClientRect();
    const t = { id: Date.now() % 1e9, x: Math.round((state.v.x + (r.width || 800) / state.v.k / 2) / G), y: Math.round((state.v.y + (r.height || 600) / state.v.k / 2) / G), t: 'អត្ថបទ', sz: 14 };
    state.texts.push(t); state.selT = t.id; state.sel = null; state.selW = -1; sheet(); draw();
  },
  grid() { const o = state.opt, order = ['lines', 'dots', 'none']; o.grid = order[(order.indexOf(o.grid) + 1) % 3]; applySettings(); },
  snap() { state.opt.snap = state.opt.snap === false; applySettings(); flash(state.opt.snap ? 'ចាប់ជើង៖ បើក' : 'ចាប់ជើង៖ បិទ'); },
  hidetags() { state.opt.hideTags = !state.opt.hideTags; applySettings(); },
  theme: () => toggleTheme(), lang: () => toggleLang(),
  keys() { modal('ផ្លូវកាត់ក្តារចុច', keysHelp()); },
  delw() { push(); const set = new Set(chainOf(state.wires, termKeys(), state.selW)); state.wires = state.wires.filter((_, j) => !set.has(j)); state.selW = -1; sheet(); draw(); },
  exm() {
    panel();
    const html = Object.entries(EXAMPLES).map(([k, ex]) => `
      <div style="border:1px solid var(--grid);border-radius:8px;padding:10px;margin-bottom:8px;background:var(--bg)">
        <div style="font-weight:700;color:var(--accent);margin-bottom:4px">${ex.name}</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px">${ex.desc}</div>
        <button class="b pri" data-ex="${k}">បើកសៀគ្វីនេះ</button>
      </div>
    `).join('');
    modal('★ សៀគ្វីឧទាហរណ៍ (Simurelay)', html);
  },
  newp() { panel(); push(); state.els = []; state.wires = []; state.texts = []; state.nid = 1; state.proj = 'គម្រោងថ្មី'; state.sel = null; sheet(); draw(); },
  save() { LS.set('rly:' + state.proj, ser()); state.savedAt = new Date(); panel(); flash('✓ បានរក្សាទុក'); },
  saveas() { panel(); modal('រក្សាទុកជាឈ្មោះថ្មី', `<div class="row"><input id="nm" style="flex:1" value="${esc(state.proj)}"><button class="b pri" data-a="doas">រក្សាទុក</button></div>`); },
  doas() { const n = Q('#nm').value.trim(); if (n) { state.proj = n; A.save(); A.mclose(); } },
  ws() { panel(); const k = LS.keys(); modal('គម្រោងរក្សាទុក', k.length ? k.map(x => { const n = esc(x.slice(4)); return `<div class="row"><b>${n}</b><button class="b pri" data-o="${n}">បើក</button><button class="b del" data-x="${n}">លុប</button></div>`; }).join('') : 'គ្មានគម្រោងរក្សាទុកទេ'); },
  more() { modal('ផ្សេងៗ / JSON', `<div class="row"><button class="b" data-a="capture">📷 ថតរូប</button><button class="b" data-a="fullscr">⛶ ពេញអេក្រង់</button><button class="b" data-a="fit2">⊡ សមនឹងខ្លឹមសារ</button></div><div class="row"><button class="b del" data-a="newp">លុបសៀគ្វីទាំងអស់</button></div><textarea id="ta">${ser()}</textarea><div class="row"><button class="b pri" data-a="imp">នាំចូល JSON</button></div>`); },
  imp() { try { load(JSON.parse(Q('#ta').value)); A.mclose(); } catch (_) { flash('ទិន្នន័យ JSON មិនត្រឹមត្រូវ'); } },
  about() { panel(); modal('អំពីកម្មវិធី', 'កម្មវិធីក្លែងធ្វើសៀគ្វីរ៉េឡេ និងកុងតាក់ទ័រ ជាភាសាខ្មែរ (Simurelay Web App)។'); },
  set() { panel(); modal('ការកំណត់', settingsUI(), bindSettings); }
};

// គណនាទីតាំង Mouse/Touch និងពង្រីក/ពង្រួម
function zoomAt(cx, cy, f) {
  const svg = Q('#cv'), r = svg.getBoundingClientRect(), k = Math.min(3.5, Math.max(0.35, state.v.k * f));
  const wx = state.v.x + (cx - r.left) / state.v.k, wy = state.v.y + (cy - r.top) / state.v.k;
  state.v.k = k; state.v.x = wx - (cx - r.left) / k; state.v.y = wy - (cy - r.top) / k;
}
function zoomC(f) { const r = Q('#cv').getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, f); draw(); }

// ភ្ជាប់ Event ទាំងអស់ពេលទំព័រផ្ទុករួចរាល់
window.addEventListener('DOMContentLoaded', () => {
  const svg = Q('#cv');
  const pos = ev => { const r = svg.getBoundingClientRect(); return [state.v.x + (ev.clientX - r.left) / state.v.k, state.v.y + (ev.clientY - r.top) / state.v.k]; };
  const snapAt = (px, py) => {
    if (state.opt.snap === false) return null;
    const R = Math.min(22, Math.max(8, 14 / state.v.k));
    let best = null, bd = R;
    state.els.forEach(e => tp(e).forEach(([a, b]) => { const d = Math.hypot(px - a * G, py - b * G); if (d < bd) { bd = d; best = [a, b]; } }));
    state.wires.forEach(([x1, y1, x2, y2]) => [[x1, y1], [x2, y2]].forEach(([a, b]) => { const d = Math.hypot(px - a * G, py - b * G); if (d < bd) { bd = d; best = [a, b]; } }));
    return best;
  };
  const snap = (px, py) => snapAt(px, py) || [Math.round(px / G), Math.round(py / G)];

  const R0 = () => Math.min(12, Math.max(6, 10 / state.v.k));
  const termHit = (px, py) => { let best = null, bd = R0(); state.els.forEach(e => tp(e).forEach(p => { const d = Math.hypot(px - p[0] * G, py - p[1] * G); if (d < bd) { bd = d; best = { p, e }; } })); return best; };
  const nodeAt = (px, py) => { let best = null, bd = R0(); state.wires.forEach(w => [[w[0], w[1]], [w[2], w[3]]].forEach(p => { const d = Math.hypot(px - p[0] * G, py - p[1] * G); if (d < bd) { bd = d; best = p; } })); return best; };
  const isConn = p => state.wires.some(w => (w[0] == p[0] && w[1] == p[1]) || (w[2] == p[0] && w[3] == p[1]));

  const moveEl = (md, e, nx, ny) => {
    if (!md.mv) md.mv = startMove(state.wires, e, state.els, tp);
    const cand = planMove(md.mv, e, nx, ny, state.els, tp);
    if (cand) state.wires = cand;
  };
  const segMode = (i, px, py) => ({ k: 'seg', i, g0: [Math.round(px / G), Math.round(py / G)], snap: null, pushed: 0 });
  const allTerms = () => state.els.flatMap(tp);

  const pointAt = (px, py) => {
    let best = null, bd = Math.min(26, Math.max(12, 18 / state.v.k));
    state.els.forEach(e => tp(e).forEach(p => { const d = Math.hypot(px - p[0] * G, py - p[1] * G); if (d < bd) { bd = d; best = p; } }));
    state.wires.forEach(w => [[w[0], w[1]], [w[2], w[3]]].forEach(p => { const d = Math.hypot(px - p[0] * G, py - p[1] * G); if (d < bd) { bd = d; best = p; } }));
    if (best) return best;
    const wi = state.wires.findIndex(w => dseg(px, py, w) < 8 / state.v.k + 3);
    if (wi >= 0) {
      const gx = Math.round(px / G), gy = Math.round(py / G), w = state.wires[wi];
      if ((w[1] == w[3] && gy == w[1] && gx > Math.min(w[0], w[2]) && gx < Math.max(w[0], w[2])) || (w[0] == w[2] && gx == w[0] && gy > Math.min(w[1], w[3]) && gy < Math.max(w[1], w[3]))) return [gx, gy];
    }
    return null;
  };
  const wmPoint = (p, isEnd) => {
    const last = state.wp[state.wp.length - 1];
    if (p[0] == last[0] && p[1] == last[1]) { state.wp.length > 1 ? state.wp.pop() : (state.wp = null); wmHint(); return; }
    if (isEnd) { push(); addPolyline([...state.wp, p]); state.wp = null; vib(8); wmHint(); }
    else { state.wp.push(p); wmHint(); }
  };
  const wmMove = (ev, px, py) => {
    const m = state.mode;
    if (!m.down && Math.hypot(ev.clientX - m.x, ev.clientY - m.y) > 8) m.panning = true;
    if (m.panning) { state.v.x = m.ox - (ev.clientX - m.x) / state.v.k; state.v.y = m.oy - (ev.clientY - m.y) / state.v.k; }
    else state.wcur = pointAt(px, py) || [Math.round(px / G), Math.round(py / G)];
  };
  const wmUp = ev => {
    const m = state.mode; if (m.panning) return;
    const [px, py] = pos(ev), hit = pointAt(px, py), up = hit || [Math.round(px / G), Math.round(py / G)];
    const moved = Math.hypot(ev.clientX - m.x, ev.clientY - m.y) > 8;
    state.wcur = null;
    if (!state.wp) {
      if (!m.down) return;
      state.wp = [m.down];
      if (moved && up + '' != m.down + '') wmPoint(up, !!hit); else wmHint();
    } else wmPoint(up, !!hit);
  };

  svg.oncontextmenu = ev => ev.preventDefault();
  svg.addEventListener('pointermove', ev => { state.cursor = pos(ev); });
  svg.onwheel = ev => { ev.preventDefault(); zoomAt(ev.clientX, ev.clientY, ev.deltaY < 0 ? 1.15 : 1 / 1.15); draw(); };

  svg.onpointerdown = ev => {
    svg.setPointerCapture(ev.pointerId);
    state.ptr.set(ev.pointerId, [ev.clientX, ev.clientY]);
    if (state.ptr.size == 2) { state.mode = null; const [a, b] = [...state.ptr.values()]; state.pinch = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; return; }
    const [px, py] = pos(ev);
    const e = [...state.els].reverse().find(a => hitE(a, px, py));
    const pan = () => ({ k: 'pan', x: ev.clientX, y: ev.clientY, ox: state.v.x, oy: state.v.y });
    if (ev.button === 1 || ev.button === 2) { state.mode = pan(); return; }

    if (state.sim) {
      if (e) {
        if (e.type === 'ol3' || e.type === 'olNC' || e.type === 'olNO' || D[e.type].trip) {
          state.tripped.has(e.tag) ? state.tripped.delete(e.tag) : state.tripped.add(e.tag); vib(); tick(); return;
        }
        if (e.type.startsWith('btn') || D[e.type].press) { state.pressed.add(e.id); vib(); tick(); return; }
        if (e.type.startsWith('sw') || e.type.startsWith('brk') || e.type === 'estop' || D[e.type].toggle) {
          state.tog.has(e.id) ? state.tog.delete(e.id) : state.tog.add(e.id); vib(); tick(); return;
        }
      }
      state.mode = pan(); return;
    }

    if (state.wireMode) { state.mode = { k: 'wm', x: ev.clientX, y: ev.clientY, ox: state.v.x, oy: state.v.y, down: pointAt(px, py), panning: false }; return; }
    const th = termHit(px, py), nd = !th && nodeAt(px, py);
    const tx = [...state.texts].reverse().find(t => px >= t.x * G - 3 && px <= t.x * G + Math.max(20, t.t.length * t.sz * 0.62) + 3 && py >= t.y * G - t.sz && py <= t.y * G + 8);
    const hw = state.wires.findIndex(w => dseg(px, py, w) < 9 / state.v.k + 3);
    if (!th && hw >= 0 && state.selW >= 0 && chainOf(state.wires, termKeys(), state.selW).includes(hw)) { state.sel = null; state.mode = segMode(hw, px, py); }
    else if (th && isConn(th.p) && th.e.locked) { state.sel = th.e.id; state.selW = -1; state.selT = null; state.mode = pan(); }
    else if (th && isConn(th.p)) { state.sel = th.e.id; state.selW = -1; state.selT = null; state.mode = { k: 'drag', e: th.e, dx: px - th.e.x * G, dy: py - th.e.y * G, pushed: 0 }; }
    else if (th) { state.selW = -1; state.mode = { k: 'wire', a: th.p, c: th.p, e: th.e }; }
    else if (nd) state.mode = { k: 'wire', a: nd, c: nd };
    else if (tx) { state.selT = tx.id; state.sel = null; state.selW = -1; state.mode = { k: 'tdrag', t: tx, dx: px / G - tx.x, dy: py / G - tx.y, pushed: 0 }; }
    else if (e && e.locked) { state.sel = e.id; state.selW = -1; state.selT = null; state.mode = pan(); }
    else if (e) { state.sel = e.id; state.selW = -1; state.selT = null; state.mode = { k: 'drag', e, dx: px - e.x * G, dy: py - e.y * G, pushed: 0 }; }
    else { state.selW = hw; state.sel = null; state.selT = null; state.mode = hw >= 0 ? segMode(hw, px, py) : pan(); }
    sheet(); draw();
  };

  svg.onpointermove = ev => {
    if (!state.ptr.has(ev.pointerId)) return;
    state.ptr.set(ev.pointerId, [ev.clientX, ev.clientY]);
    if (state.ptr.size == 2) {
      const [a, b] = [...state.ptr.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
      zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, d / state.pinch); state.pinch = d; draw(); return;
    }
    state.cursor = pos(ev);
    if (!state.mode) return;
    if (state.mode.k == 'tdrag') { const t = state.mode.t; if (!state.mode.pushed) { push(); state.mode.pushed = 1; } const [px, py] = pos(ev); t.x = Math.round(px / G - state.mode.dx); t.y = Math.round(py / G - state.mode.dy); draw(); return; }
    const [px, py] = pos(ev);
    if (state.mode.k == 'wm') { wmMove(ev, px, py); draw(); return; }
    if (state.mode.k == 'pan') { state.v.x = state.mode.ox - (ev.clientX - state.mode.x) / state.v.k; state.v.y = state.mode.oy - (ev.clientY - state.mode.y) / state.v.k; }
    else if (state.mode.k == 'drag') { if (!state.mode.pushed) { push(); state.mode.pushed = 1; } const nx = Math.round((px - state.mode.dx) / G), ny = Math.round((py - state.mode.dy) / G), m = state.mode.e; if (nx != m.x || ny != m.y) moveEl(state.mode, m, nx, ny); state.guides = guidesFor(m, state.els, tp); }
    else if (state.mode.k == 'seg') {
      const m = state.mode;
      if (!m.snap) { const w = state.wires[m.i]; if (!w || (w[0] == w[2] && w[1] == w[3])) return; const mg = mergeLeg(state.wires, termKeys(), m.i); m.i = mg.i; state.wires = mg.wires; state.selW = mg.i; m.snap = state.wires.map(x => [...x]); m.sig = netSig(m.snap, allTerms()); }
      const horiz = m.snap[m.i][1] == m.snap[m.i][3];
      const d = horiz ? Math.round(py / G) - m.g0[1] : Math.round(px / G) - m.g0[0];
      const res = d === 0 ? { wires: m.snap.map(x => [...x]), sel: m.i } : dragSegment(m.snap, m.i, d, allTerms());
      if (netSig(res.wires, allTerms()) === m.sig) {
        if (!m.pushed && d !== 0) { push(); m.pushed = 1; }
        state.wires = res.wires; state.selW = res.sel;
      }
    }
    else state.mode.c = snap(px, py);
    draw();
  };

  svg.onpointerup = svg.onpointercancel = ev => {
    state.ptr.delete(ev.pointerId); if (state.ptr.size < 2) state.pinch = null;
    if (state.mode && state.mode.k == 'wm') { wmUp(ev); state.mode = null; draw(); return; }
    const m = state.mode;
    if (m && m.k == 'wire') {
      if (m.a + '' != m.c + '') { push(); addWire(m.a, m.c); vib(8); }
      else if (m.e) { state.sel = m.e.id; state.selW = -1; sheet(); }
      else { state.selW = state.wires.findIndex(w => (w[0] == m.a[0] && w[1] == m.a[1]) || (w[2] == m.a[0] && w[3] == m.a[1])); state.sel = null; sheet(); }
    }
    if (m && m.k == 'drag' && m.pushed) fixWires();
    state.guides = null;
    state.mode = null; if (state.sim && state.pressed.size) { state.pressed.clear(); tick(); }
    draw();
  };

  document.onclick = ev => {
    const t = ev.target.closest('[data-a],[data-add],[data-o],[data-x],[data-ex]');
    if (!t) return;
    const d = t.dataset;
    if (d.add) place(d.add);
    else if (d.ex) { A.mclose(); loadExample(d.ex); }
    else if (d.o) { const s = LS.get('rly:' + d.o); if (s) { try { load(JSON.parse(s)); state.proj = d.o; A.mclose(); } catch (_) {} } }
    else if (d.x) { LS.del('rly:' + d.x); A.ws(); }
    else if (A[d.a]) A[d.a]();
  };

  // បង្កើតបញ្ជីឧបករណ៍ក្នុងបណ្ណាល័យ ២ ភាសា (ខ្មែរ / អង់គ្លេស) និងផ្ទាំង Tooltip
  const gridEl = Q('#grid');
  let libTip = Q('#lib-tip');
  if (!libTip) {
    libTip = document.createElement('div');
    libTip.id = 'lib-tip';
    libTip.hidden = true;
    document.body.appendChild(libTip);
  }
  const showTip = tile => {
    if (!tile || !tile.dataset.nm) { libTip.hidden = true; return; }
    const r = tile.getBoundingClientRect();
    libTip.textContent = tile.dataset.nm;
    libTip.style.left = Math.max(60, Math.min(window.innerWidth - 60, r.left + r.width / 2)) + 'px';
    libTip.style.top = Math.max(36, r.top - 6) + 'px';
    libTip.hidden = false;
  };
  const hideTip = () => { libTip.hidden = true; };

  gridEl.addEventListener('pointerover', ev => {
    if (ev.pointerType === 'mouse') {
      const tile = ev.target.closest('.tile[data-nm]');
      tile ? showTip(tile) : hideTip();
    }
  });
  gridEl.addEventListener('pointerout', ev => {
    if (ev.pointerType === 'mouse' && !gridEl.contains(ev.relatedTarget)) hideTip();
  });
  gridEl.addEventListener('scroll', hideTip, { passive: true });

  const buildLib = () => {
    const lang = state.opt.lang === 'en' ? 'en' : 'km';
    applyLibraryConfig(D, lang);
    const curCat = Q('#cat').value || '*';
    Q('#cat').innerHTML = `<option value="*">${lang === 'en' ? 'All Components' : 'ទាំងអស់'}</option>` +
      LIBRARY_CATEGORIES.map(c => `<option value="${c.id}">${lang === 'en' ? c.en : c.km}</option>`).join('');
    Q('#cat').value = curCat;

    const orderedKeys = [
      ...Object.keys(LIBRARY_ITEMS).filter(k => D[k]),
      ...Object.keys(D).filter(k => !(k in LIBRARY_ITEMS))
    ];
    gridEl.innerHTML = orderedKeys.map(t => {
      const d = D[t];
      const [b0, b1, b2, b3] = d.bb;
      const isHoriz2Pin = d.k !== 'M' && d.t && d.t.length === 2 && d.t[0][1] === d.t[1][1] && d.t[0][0] !== d.t[1][0];
      const libR = isHoriz2Pin ? 1 : 0;
      const e = { type: t, r: libR, x: 0, y: 0, tag: '', id: -1, sec: 3 };
      const vb = libR === 1
        ? `${-b3 - 2} ${b0 - 2} ${b3 - b1 + 4} ${b2 - b0 + 4}`
        : `${b0 - 2} ${b1 - 2} ${b2 - b0 + 4} ${b3 - b1 + 4}`;
      const inner = libR === 1
        ? `<g transform="rotate(90)">${d.d(e, { on: 0, cl: 0, pr: 0, a: 0 })}</g>`
        : d.d(e, { on: 0, cl: 0, pr: 0, a: 0 });
      const hiddenAttr = curCat !== '*' && d.k !== curCat ? ' hidden' : '';
      return `<button class="tile" data-add="${t}" data-k="${d.k}" data-nm="${esc(d.nm)}"${hiddenAttr}><svg viewBox="${vb}">${inner}</svg><small>${esc(d.nm)}</small></button>`;
    }).join('');
  };
  Q('#cat').onchange = e => document.querySelectorAll('.tile').forEach(t => t.hidden = e.target.value != '*' && t.dataset.k != e.target.value);

  // មុខងារ Drag & Drop ពីបណ្ណាល័យ (បើកសម្រាប់តែកុំព្យូទ័រ Mouse ប៉ុណ្ណោះ — បិទលើទូរស័ព្ទដៃ)
  let libDrag = null;
  const clearLibDrag = () => {
    if (!libDrag) return;
    if (libDrag.ghost) libDrag.ghost.remove();
    libDrag = null;
  };
  gridEl.addEventListener('pointerdown', ev => {
    const tile = ev.target.closest('.tile[data-add]');
    if (tile && ev.pointerType !== 'mouse') {
      showTip(tile);
      setTimeout(hideTip, 1200);
    }
    if (state.sim || ev.button !== 0 || ev.pointerType !== 'mouse' || window.innerWidth < 900) return;
    if (tile) libDrag = { type: tile.dataset.add, x0: ev.clientX, y0: ev.clientY, ghost: null, dragging: false };
  });
  window.addEventListener('pointermove', ev => {
    if (!libDrag) return;
    if (!libDrag.dragging && Math.hypot(ev.clientX - libDrag.x0, ev.clientY - libDrag.y0) > 8) {
      libDrag.dragging = true;
      hideTip();
      const g = document.createElement('div');
      g.textContent = D[libDrag.type]?.nm || libDrag.type;
      g.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;padding:6px 12px;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;font-weight:700;box-shadow:0 6px 18px rgba(0,0,0,.3);transform:translate(-50%,-50%)';
      document.body.appendChild(g);
      libDrag.ghost = g;
    }
    if (libDrag.ghost) {
      libDrag.ghost.style.left = ev.clientX + 'px';
      libDrag.ghost.style.top = ev.clientY + 'px';
    }
  });
  window.addEventListener('pointerup', ev => {
    if (!libDrag) return;
    const cur = libDrag;
    clearLibDrag();
    if (cur.dragging) {
      const r = svg.getBoundingClientRect();
      const libRect = Q('#lib')?.getBoundingClientRect();
      const overLib = libRect && !Q('#lib').hidden && ev.clientX >= libRect.left && ev.clientX <= libRect.right && ev.clientY >= libRect.top && ev.clientY <= libRect.bottom;
      if (!overLib && ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
        const [px, py] = pos(ev);
        place(cur.type, '', [Math.round(px / G), Math.round(py / G)], true);
      }
    }
  });
  window.addEventListener('pointercancel', clearLibDrag);

  loadSettings({ rebuild: buildLib });
  applySettings();
  initShell(A, { refreshSheet: sheet, rebuildLib: buildLib });

  // ចាប់ផ្តើមដោយផ្ទុកផ្ទាំងគម្រោងថ្មីទទេស្អាត
  state.els = [];
  state.wires = [];
  state.texts = [];
  state.nid = 1;
  state.proj = 'គម្រោងថ្មី';
  state.sel = null;
  state.selW = -1;
  state.selT = null;
  state.hist = [];
  state.fut = [];
  fitScreen();
  tbar();
  stat();
});