/* ==========================================================================
   ឯកសារ៖ js/main.js
   តួនាទី៖ ចំណុចចាប់ផ្តើមកម្មវិធី ភ្ជាប់ Event ចុច/អូស Undo/Redo ការរក្សាទុក និង Shell UI
   ========================================================================== */
import { state, Q, esc } from './state.js';
import { G, CAT, D, tp, hitE, dseg, pinOf, IEC_KIND, iecPins } from './components.js';
import { tick, stat } from './solver.js';
import { draw, addWire, addPolyline, fitScreen, follow, fixWires } from './renderer.js';
import { EXAMPLES } from './examples.js';
import { rerouteMoved, dragSegment, netSig, cleanWires, occupied, startMove, planMove, freeSpot, guidesFor, chainOf, mergeLeg } from './wiring.js';
import { load as loadSettings, apply as applySettings, settingsUI, bindSettings, capture, save as saveSettings } from './settings.js';
import { initShell, setRunUi, toggleLang, toggleTheme, keysHelp, refresh as refreshShell } from './shell.js';
import { LIBRARY_CATEGORIES, LIBRARY_ITEMS, applyLibraryConfig } from './library.js';

const vib = (ms = 12) => { if (state.opt.vibrate && navigator.vibrate) navigator.vibrate(ms); };

// ស្ថានភាពបើក/បិទ និងខ្ទាស់ (Pin) ផ្ទាំង Properties ខាងស្តាំ
let propOpen = false;
let propPinned = false;

const ser = () => JSON.stringify({
  app: 'Simurelay-MCC',
  version: 1,
  name: state.proj,
  els: state.els,
  wires: state.wires,
  nid: state.nid
}, null, 2);

function tbar() {
  refreshShell();
}
function push() {
  state.hist.push(ser());
  if (state.hist.length > 80) state.hist.shift();
  state.fut = [];
  tbar();
}
function restore(s) {
  const d = JSON.parse(s);
  state.els = d.els; state.wires = d.wires; state.nid = d.nid;
  state.sel = null; state.selW = -1;
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

function wmHint() {
  stat(state.wp
    ? 'ចុចកន្លែងទំនេរ = បន្ថែមកែង · ចុចជើង = បញ្ចប់ខ្សែ · ចុចចំណុចចុងក្រោយម្តងទៀត = ថយក្រោយ'
    : 'របៀបគូរខ្សែ៖ ចុចជើងឧបករណ៍ ដើម្បីចាប់ផ្តើម');
}
function setWireMode(on) {
  state.wireMode = on; state.wp = null; state.wcur = null; state.mode = null;
  const b = Q('#wm'); if (b) b.classList.toggle('on', on);
  if (on) { state.sel = null; state.selW = -1; sheet(); wmHint(); } else stat();
  refreshShell();
  draw();
}

// ចាប់ផ្តើម ឬបញ្ឈប់ Simulation
function run() {
  if (state.wireMode) setWireMode(false);
  panel();
  state.sim = !state.sim;
  if (state.sim) {
    state.out = {}; state.acc = {}; state.pressed.clear(); state.sel = null; state.selW = -1; state.last = 0;
    state.genMode = {};
    state.genSel = null;
    tick();
    state.tm = setInterval(tick, 50);
  } else {
    clearInterval(state.tm);
    state.live = null;
    state.pressed.clear();
    state.tog.clear();
    state.tripped.clear();
    state.multiPos = {};
    state.genMode = {};
    state.genSel = null;
  }
  setRunUi(state.sim);
  sheet(); draw(); stat();
}

// បន្ថែមឧបករណ៍ថ្មីទៅកណ្ដាលអេក្រង់ ឬទីតាំងដែលបានទម្លាក់ (Drag & Drop)
function place(t, customText = '', dropGrid = null, keepLibOpen = true) {
  if (state.sim) {
    flash('សូមចុចប៊ូតុង បញ្ឈប់ (Stop) ជាមុនសិន ទើបអាចនាំឧបករណ៍ចូលបាន');
    return;
  }
  push(); vib();
  const svg = Q('#cv'), d = D[t], r = svg.getBoundingClientRect();
  const isHoriz2Pin = d.k !== 'M' && d.t && d.t.length === 2 && d.t[0][1] === d.t[1][1] && d.t[0][0] !== d.t[1][0];
  const defR = isHoriz2Pin ? 1 : 0;

  const x = dropGrid ? dropGrid[0] : Math.round((state.v.x + (r.width || 800) / state.v.k / 2) / G);
  const y = dropGrid ? dropGrid[1] : Math.round((state.v.y + (r.height || 600) / state.v.k / 2) / G);

  let n = 1;
  if (d.pre !== undefined) while (state.els.some(e => D[e.type].pre == d.pre && e.tag == d.pre + n)) n++;
  state.els.push({
    id: state.nid, type: t, x, y, r: defR,
    tag: d.pre === undefined ? '' : (d.k == 'A' || d.k == 'T' ? d.pre + '1' : d.pre + n),
    sec: 3,
    locked: false,
    ...(d.isText ? {
      text: customText || 'កត់សម្គាល់',
      fontFamily: "'Noto Sans Khmer', sans-serif",
      fontColor: '#38bdf8',
      fontSize: 14
    } : {})
  });
  state.sel = state.nid++; state.selW = -1;
  if (!keepLibOpen) panel();
  sheet(); draw();
}

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

// ផ្ទាំង Properties ខាងស្តាំ (បើកលុះត្រាតែចុចប៊ូតុង Properties នៅជ្រុងលើខាងស្តាំ ឬខ្ទាស់ Pin)
function sheet() {
  const sh = Q('#sh') || Q('#sheet');
  const body = Q('#sh-body') || sh;
  const propToggleBtn = Q('#prop-toggle');
  refreshShell();
  if (!sh) return;

  // ពេលកំពុង Simulation៖ បង្ហាញតែផ្ទាំងបញ្ជា Generator (AUTO / ON / OFF) បើចុចលើ Generator
  if (state.sim) {
    if (propToggleBtn) propToggleBtn.classList.remove('has-sel');
    const gen = state.els.find(a => a.id == state.genSel && a.type === 'ic_generator3ph');
    sh.hidden = !gen;
    sh.classList.toggle('gen-float', !!gen);
    if (gen) {
      const m = (state.genMode && state.genMode[gen.id]) || 'OFF';
      const svg = Q('#cv');
      const r = svg ? svg.getBoundingClientRect() : { left: 0, top: 0, width: 800, height: 600 };
      const gx = r.left + (gen.x * G + 65 - state.v.x) * state.v.k;
      const gy = r.top + (gen.y * G + 42 - state.v.y) * state.v.k;
      sh.style.left = Math.min(window.innerWidth - 195, Math.max(10, gx)) + 'px';
      sh.style.top = Math.min(window.innerHeight - 75, Math.max(45, gy)) + 'px';
      sh.style.right = 'auto';
      sh.style.bottom = 'auto';
      sh.style.width = 'auto';
      body.innerHTML = `<div class="gen-bar">` +
        `<button type="button" class="gb ${m === 'AUTO' ? 'act' : ''}" data-gm="AUTO">AUTO</button>` +
        `<button type="button" class="gb ${m === 'ON' ? 'act' : ''}" data-gm="ON">ON</button>` +
        `<button type="button" class="gb ${m === 'OFF' ? 'act' : ''}" data-gm="OFF">OFF</button>` +
        `</div>`;
    } else {
      sh.style.left = '';
      sh.style.top = '';
      sh.style.right = '';
      sh.style.bottom = '';
      sh.style.width = '';
    }
    return;
  }

  sh.classList.remove('gen-float');
  sh.style.left = '';
  sh.style.top = '';
  sh.style.right = '';
  sh.style.bottom = '';
  sh.style.width = '';

  const e = state.els.find(a => a.id == state.sel);
  const hasSelection = !!(e || state.selW >= 0);
  if (propToggleBtn) {
    propToggleBtn.classList.toggle('has-sel', hasSelection);
    propToggleBtn.classList.toggle('act', propOpen);
  }

  // បិទផ្ទាំង Properties ប្រសិនបើអ្នកប្រើមិនទាន់ចុចប៊ូតុង Properties (លើកលែងតែបានខ្ទាស់ Pin)
  if (!propOpen && !propPinned) {
    sh.hidden = true;
    return;
  }
  sh.hidden = false;

  // ករណីមិនទាន់បានជ្រើសរើសឧបករណ៍ ឬខ្សែភ្លើង
  if (!e && state.selW < 0) {
    body.innerHTML =
      `<div class="prop-card" style="text-align:center;padding:24px 12px;color:var(--muted)">
        <div style="font-size:24px;margin-bottom:6px">👆</div>
        <div style="font-size:13px;font-weight:700;color:var(--ink);margin-bottom:4px">មិនទាន់បានជ្រើសរើសឧបករណ៍</div>
        <div style="font-size:12px">សូមចុចលើឧបករណ៍ណាមួយនៅលើផ្ទាំងគូរ ដើម្បីកែប្រែស្លាក លេខជើង និងលក្ខណៈសម្បត្តិ។</div>
      </div>`;
    return;
  }

  // ករណីជ្រើសរើសខ្សែភ្លើង
  if (!e) {
    body.innerHTML =
      `<div class="prop-card">
        <div class="prop-sec-lbl">ខ្សែភ្លើង (Wire Segment #${state.selW + 1})</div>
        <div style="font-size:12px;color:var(--muted)">គ្រប់គ្រងស្រទាប់ និងការលុបខ្សែភ្លើងដែលបានជ្រើសរើស។</div>
        <div class="prop-actions">
          ${layerBtns}
          <button class="b del" data-a="delw" style="grid-column:span 2">🗑 លុបខ្សែភ្លើង</button>
        </div>
      </div>`;
    return;
  }

  const d = D[e.type];

  // ករណីជ្រើសរើសអក្សរចំណាំ (Text Label)
  if (d.isText) {
    const curFont = e.fontFamily || "'Noto Sans Khmer', sans-serif";
    const curCol = e.fontColor || '#38bdf8';
    const curSize = e.fontSize ?? 14;
    const fontOpts = [
      ["'Noto Sans Khmer', sans-serif", "Noto Sans Khmer (លំនាំដើម)"],
      ["'Khmer OS Battambang', sans-serif", "Khmer OS Battambang"],
      ["'Khmer OS Muol Light', serif", "Khmer OS Muol Light"],
      ["'Khmer OS Siemreap', sans-serif", "Khmer OS Siemreap"],
      ["'Kantumruy Pro', sans-serif", "Kantumruy Pro"],
      ["'Moul', serif", "Moul (អក្សរមូល)"],
      ["'Inter', Arial, sans-serif", "Inter / Arial (EN)"],
      ["'JetBrains Mono', monospace", "JetBrains Mono (Code)"]
    ].map(([val, lbl]) => `<option value="${esc(val)}" ${curFont === val ? 'selected' : ''}>${lbl}</option>`).join('');

    body.innerHTML =
      `<div class="prop-card">
        <div style="font-weight:700;font-size:14px;color:var(--accent)">${esc(d.nm)} ${e.locked ? '🔒' : ''}</div>
      </div>` +
      `<div class="prop-card">
        <div class="prop-sec-lbl">កែប្រែអក្សរ (Text Properties)</div>
        <div class="prop-field"><span>ខ្លឹមសារអត្ថបទ</span><input id="txt-val" value="${esc(e.text || '')}"></div>
        <div class="prop-field"><span>ពុម្ពអក្សរ (Font Family)</span><select id="txt-font">${fontOpts}</select></div>
        <div class="prop-grid2">
          <div class="prop-field"><span>ទំហំ (px)</span><input id="txt-size" type="number" min="0" max="120" step="1" value="${curSize}"></div>
          <div class="prop-field"><span>ពណ៌អក្សរ</span><input id="txt-col" type="color" value="${esc(curCol)}" style="height:33px;padding:2px"></div>
        </div>
      </div>` +
      `<div class="prop-card">
        <div class="prop-sec-lbl">សកម្មភាព (Actions)</div>
        <div class="prop-actions">
          ${layerBtns}
          <button class="b" data-a="lock">${e.locked ? '🔓 ដោះសោ' : '🔒 ចាក់សោ'}</button>
          <button class="b" data-a="dup">⧉ ចម្លង</button>
          <button class="b del" data-a="del" style="grid-column:span 2">🗑 លុប</button>
        </div>
      </div>`;

    const tv = Q('#txt-val');
    if (tv) { tv.onfocus = push; tv.oninput = () => { e.text = tv.value.slice(0, 80); draw(); }; }
    const tf = Q('#txt-font');
    if (tf) { tf.onchange = () => { push(); e.fontFamily = tf.value; draw(); }; }
    const tc = Q('#txt-col');
    if (tc) { tc.onfocus = push; tc.oninput = () => { e.fontColor = tc.value; draw(); }; }
    const ts = Q('#txt-size');
    if (ts) {
      ts.onfocus = push;
      ts.oninput = () => {
        const v = Math.min(120, Math.max(0, Number(ts.value) || 0));
        e.fontSize = v;
        draw();
      };
    }
    return;
  }

  // ករណីជ្រើសរើសឧបករណ៍អគ្គិសនីទូទៅ
  let html =
    `<div class="prop-card">
      <div style="font-weight:700;font-size:14px;color:var(--accent)">${esc(d.nm)} ${e.locked ? '🔒' : ''}</div>
      <div style="font-size:11px;color:var(--muted)">ប្រភេទ៖ ${esc(e.type)} • ជើងភ្ជាប់៖ ${(d.t || []).length}</div>
    </div>`;

  if (d.pre !== undefined || d.tm) {
    html += `<div class="prop-card"><div class="prop-sec-lbl">ស្លាកសម្គាល់ & ការកំណត់</div><div class="prop-grid2">`;
    if (d.pre !== undefined) {
      html += `<div class="prop-field"><span>ស្លាក (Tag)</span><input id="tg" value="${esc(e.tag)}" maxlength="8"></div>`;
    }
    if (d.tm) {
      html += `<div class="prop-field"><span>ម៉ោង (វិនាទី)</span><input id="sc" type="number" min="0" step="0.5" value="${e.sec}"></div>`;
    }
    html += `</div></div>`;
  }

  const pinsHtml = pinUI(e, d);
  if (pinsHtml) {
    html += `<div class="prop-card"><div class="prop-sec-lbl">លេខជើងភ្ជាប់ (Terminals)</div>${pinsHtml}</div>`;
  }

  html +=
    `<div class="prop-card">
      <div class="prop-sec-lbl">សកម្មភាព (Actions)</div>
      <div class="prop-actions">
        ${layerBtns}
        <button class="b" data-a="lock">${e.locked ? '🔓 ដោះសោ' : '🔒 ចាក់សោ'}</button>
        <button class="b" data-a="rot" ${e.locked ? 'disabled' : ''}>↻ បង្វិល</button>
        <button class="b" data-a="dup">⧉ ចម្លង</button>
        <button class="b del" data-a="del">🗑 លុប</button>
      </div>
    </div>`;

  body.innerHTML = html;

  const tg = Q('#tg'); if (tg) { tg.onfocus = push; tg.oninput = () => { e.tag = tg.value.slice(0, 8); draw(); }; }
  const sc = Q('#sc'); if (sc) { sc.onfocus = push; sc.oninput = () => { e.sec = Math.max(0, +sc.value || 0); draw(); }; }
  bindPins(e, d);
}

function pinUI(e, d) {
  if (!d.pins || !(d.t || []).length) return '';
  const kind = IEC_KIND[e.type];
  const pick = kind
    ? `<div class="prop-field" style="margin-bottom:6px"><span>ស្តង់ដារ IEC</span><select id="iec"><option value="">ជ្រើសរើសលេខជើង…</option>${[1, 2, 3, 4].map(n => `<option value="${n}">${iecPins(kind, n).join(' / ')}</option>`).join('')}</select></div>`
    : '';
  const grid = `<div class="prop-grid2">` +
    d.t.map((_, i) => `<div class="prop-field"><span>ជើងទី ${i + 1}</span><input class="pin" data-i="${i}" value="${esc(pinOf(e, i))}" maxlength="4"></div>`).join('') +
    `</div>`;
  return pick + grid;
}
function bindPins(e, d) {
  document.querySelectorAll('#sh .pin, #sheet .pin').forEach(inp => {
    inp.onfocus = push;
    inp.oninput = () => { e.pins = e.pins || [...(d.pins || [])]; e.pins[+inp.dataset.i] = inp.value.slice(0, 4); draw(); };
  });
  const ie = Q('#iec');
  if (ie) ie.onchange = () => { const n = +ie.value; if (!n) return; push(); e.pins = iecPins(IEC_KIND[e.type], n); sheet(); draw(); };
}

function panel(m) {
  ['#lib', '#menu'].forEach(s => { const el = Q(s); if (el) el.hidden = s != '#' + m; });
  const bd = Q('#bd'); if (bd) bd.hidden = !m;
  if (m == 'menu' && Q('#pn')) Q('#pn').textContent = state.proj;
}

function modal(t, h, f) {
  Q('#mt').textContent = t; Q('#mb').innerHTML = h; Q('#md').hidden = false; if (f) f();
}

function load(d) {
  if (!d || !Array.isArray(d.els) || !Array.isArray(d.wires)) throw new Error('bad json');
  const els = d.els.map(e => ({
    id: +e.id || 0, type: e.type in D ? e.type : 'lamp',
    x: Number(e.x) || 0, y: Number(e.y) || 0, r: ((+e.r | 0) % 4 + 4) % 4,
    tag: String(e.tag ?? '').slice(0, 8), sec: +e.sec || 0,
    locked: !!e.locked,
    ...(e.text !== undefined ? { text: String(e.text).slice(0, 80) } : {}),
    ...(e.fontFamily ? { fontFamily: String(e.fontFamily).slice(0, 60) } : {}),
    ...(e.fontColor ? { fontColor: String(e.fontColor).slice(0, 20) } : {}),
    ...(e.fontSize !== undefined ? { fontSize: Math.min(120, Math.max(0, Number(e.fontSize))) } : {}),
    ...(Array.isArray(e.pins) ? { pins: e.pins.slice(0, 6).map(x => String(x).slice(0, 4)) } : {})
  }));
  const wires = d.wires
    .map(w => w.map(x => Number(x) || 0))
    .filter(w => w.length === 4 && (w[0] !== w[2] || w[1] !== w[3]));
  if (state.sim) run();
  push();
  state.els = els; state.wires = wires;
  state.nid = Math.max(0, ...els.map(e => e.id)) + 1;
  state.sel = null; state.selW = -1; sheet(); fitScreen();
}

function loadExample(key) {
  if (state.sim) run();
  push();
  EXAMPLES[key].build();
  state.proj = EXAMPLES[key].name;
  state.fileHandle = null;
  state.sel = null; state.selW = -1; sheet(); fitScreen();
}

const MCC_PICKER_OPTS = {
  types: [{
    description: 'Motor Control Center Circuit (*.mcc)',
    accept: { 'application/x-mcc': ['.mcc'], 'application/json': ['.mcc'] }
  }],
  excludeAcceptAllOption: false
};

function sanitizeFileName(name) {
  const clean = (name || 'project').replace(/[\\/:*?"<>|]/g, '_').trim();
  return clean.toLowerCase().endsWith('.mcc') ? clean : clean + '.mcc';
}

async function saveMccToDisk(forceSaveAs = false) {
  panel();
  const data = ser();

  if (window.showSaveFilePicker) {
    try {
      let handle = !forceSaveAs ? state.fileHandle : null;
      if (!handle) {
        handle = await window.showSaveFilePicker({
          ...MCC_PICKER_OPTS,
          suggestedName: sanitizeFileName(state.proj)
        });
        state.fileHandle = handle;
      }
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
      state.proj = handle.name.replace(/\.mcc$/i, '');
      state.savedAt = new Date();
      LS.set('rly:' + state.proj, data);
      vib(12);
      refreshShell();
      flash('✓ បានរក្សាទុក៖ ' + handle.name);
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  const fileName = sanitizeFileName(state.proj);
  const blob = new Blob([data], { type: 'application/x-mcc;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  state.savedAt = new Date();
  LS.set('rly:' + state.proj, data);
  vib(12);
  refreshShell();
  flash('✓ បានទាញយក៖ ' + fileName);
}

function readMccText(text, fileName) {
  const parsed = JSON.parse(text);
  load(parsed);
  state.proj = (fileName ? fileName.replace(/\.mcc$/i, '') : '') || parsed.name || 'គម្រោង MCC';
  state.savedAt = new Date();
  vib(12);
  refreshShell();
  flash('✓ បានបើក៖ ' + (fileName || state.proj + '.mcc'));
}

async function openMccFromDisk() {
  panel();

  if (window.showOpenFilePicker) {
    try {
      const [handle] = await window.showOpenFilePicker({
        ...MCC_PICKER_OPTS,
        multiple: false
      });
      if (!handle) return;
      const file = await handle.getFile();
      const text = await file.text();
      state.fileHandle = handle;
      readMccText(text, file.name);
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  const inp = Q('#mcc-input');
  if (inp) {
    inp.value = '';
    inp.click();
  }
}

const A = {
  menu: () => panel('menu'),
  lib: () => {
    if (state.sim) { flash('សូមចុចប៊ូតុង បញ្ឈប់ (Stop) ជាមុនសិន'); return; }
    panel(Q('#lib').hidden ? 'lib' : null);
  },
  run, undo, redo,
  zin: () => zoomC(1.25),
  zout: () => zoomC(0.8),
  fit: fitScreen,
  close: () => panel(),
  mclose: () => Q('#md').hidden = true,
  capture() { A.mclose(); capture(); },
  fullscr() { A.mclose(); document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); },
  fit2() { A.mclose(); fitScreen(); },
  openfile: () => openMccFromDisk(),
  savefile: () => saveMccToDisk(false),
  savefileas: () => saveMccToDisk(true),
  text: () => { if (!state.sim) place('txt', 'ចំណាំ'); },
  addtext: () => { if (!state.sim) place('txt', 'ចំណាំ'); },
  copy() {
    const e = state.els.find(a => a.id == state.sel);
    if (!e) { flash('សូមចុចជ្រើសរើសឧបករណ៍លើប្លង់ជាមុនសិន'); return; }
    state.clip = JSON.parse(JSON.stringify(e));
    vib(10);
    flash('✓ បានចម្លងឧបករណ៍៖ ' + (e.tag || D[e.type]?.nm || ''));
  },
  paste() {
    if (state.sim) { flash('សូមបញ្ឈប់ការសាកល្បង (Stop) ជាមុនសិន'); return; }
    if (!state.clip) { flash('មិនទាន់មានទិន្នន័យចម្លងទេ (ចុច Copy ជាមុន)'); return; }
    push();
    const svg = Q('#cv'), r = svg.getBoundingClientRect();
    const cx = Math.round((state.v.x + (r.width || 800) / state.v.k / 2) / G);
    const cy = Math.round((state.v.y + (r.height || 600) / state.v.k / 2) / G);
    const c = {
      ...JSON.parse(JSON.stringify(state.clip)),
      id: state.nid,
      x: cx,
      y: cy,
      locked: false
    };
    state.els.push(c);
    state.sel = state.nid++;
    state.selW = -1;
    vib(10);
    sheet(); draw();
    flash('✓ បានបិទភ្ជាប់ឧបករណ៍');
  },
  delany() {
    if (state.sim) { flash('សូមបញ្ឈប់ការសាកល្បង (Stop) ជាមុនសិន'); return; }
    if (state.sel != null) A.del();
    else if (state.selW >= 0) A.delw();
    else flash('សូមជ្រើសរើសឧបករណ៍ ឬខ្សែភ្លើងដែលត្រូវលុប');
  },
  rot() {
    if (state.sim) { flash('សូមបញ្ឈប់ការសាកល្បង (Stop) ជាមុនសិន'); return; }
    const e = state.els.find(a => a.id == state.sel);
    if (!e) { flash('សូមជ្រើសរើសឧបករណ៍ដែលត្រូវបង្វិល'); return; }
    if (e.locked) { flash('🔒 ឧបករណ៍នេះកំពុងជាប់សោរ'); return; }
    if (D[e.type]?.isText) {
      push();
      e.r = (e.r + 1) % 4;
      vib(10); sheet(); draw();
      return;
    }
    const mv = startMove(state.wires, e, state.els, tp), r0 = e.r;
    e.r = (r0 + 1) % 4;
    const cand = planMove(mv, e, e.x, e.y, state.els, tp);
    e.r = r0;
    if (!cand) { flash('មិនអាចបង្វិលនៅទីនេះ៖ ជើងនឹងជាន់ចំណុចខ្សែផ្សេង'); return; }
    push();
    e.r = (r0 + 1) % 4;
    state.wires = cand;
    state.selW = -1;
    vib(10);
    sheet(); draw();
  },
  lock() {
    const e = state.els.find(a => a.id == state.sel);
    if (!e) { flash('សូមជ្រើសរើសឧបករណ៍ដែលត្រូវចាក់សោរ'); return; }
    push();
    e.locked = !e.locked;
    vib(10);
    flash(e.locked ? '🔒 បានចាក់សោរឧបករណ៍' : '🔓 បានដោះសោរឧបករណ៍');
    sheet(); draw();
  },
  grid() {
    const order = ['lines', 'dots', 'none'];
    const idx = order.indexOf(state.opt.grid || 'lines');
    state.opt.grid = order[(idx + 1) % order.length];
    saveSettings({ rebuild: () => {} });
    applySettings();
    refreshShell();
  },
  tgrid() { A.grid(); },
  snap() {
    state.opt.snap = state.opt.snap === false ? true : false;
    saveSettings({ rebuild: () => {} });
    refreshShell();
    flash('ចាប់ជើង (Snap): ' + (state.opt.snap ? 'ON' : 'OFF'));
  },
  hidetags() {
    state.opt.hideTags = !state.opt.hideTags;
    document.body.classList.toggle('hide-tags', !!state.opt.hideTags);
    saveSettings({ rebuild: () => {} });
    refreshShell();
  },
  theme() { toggleTheme(); },
  lang() { toggleLang(); },
  keys() { panel(); modal('ផ្លូវកាត់ក្តារចុច (Keyboard Shortcuts)', keysHelp()); },
  dup() {
    const e = state.els.find(a => a.id == state.sel); if (!e) return;
    push();
    const c = { ...e, pins: e.pins && [...e.pins], id: state.nid, x: e.x + 1, y: e.y + 1, locked: false };
    state.els.push(c); state.sel = state.nid++; sheet(); draw();
  },
  front: () => reorder(true), back: () => reorder(false),
  wiremode() { if (state.sim) return; setWireMode(!state.wireMode); },
  del() {
    if (state.selW >= 0 && state.sel == null) { A.delw(); return; }
    const e = state.els.find(a => a.id == state.sel);
    if (!e) return;
    if (e.locked) { flash('🔒 សូមដោះសោរមុននឹងលុប'); return; }
    push(); state.els = state.els.filter(x => x.id != state.sel); state.sel = null; sheet(); draw();
  },
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
  newp() { panel(); push(); state.els = []; state.wires = []; state.nid = 1; state.proj = 'គម្រោងថ្មី'; state.fileHandle = null; state.sel = null; state.selW = -1; sheet(); draw(); refreshShell(); },
  save() { state.savedAt = new Date(); LS.set('rly:' + state.proj, ser()); panel(); refreshShell(); flash('✓ បានរក្សាទុកក្នុង Browser'); },
  saveas() { panel(); modal('រក្សាទុកជាឈ្មោះថ្មី (.mcc)', `<div class="row"><input id="nm" style="flex:1" value="${esc(state.proj)}"><button class="b pri" data-a="doas">រក្សាទុក .mcc</button></div>`); },
  doas() { const n = Q('#nm').value.trim(); if (n) { state.proj = n; A.mclose(); saveMccToDisk(true); } },
  ws() { panel(); const k = LS.keys(); modal('គម្រោងរក្សាទុកក្នុង Browser', k.length ? k.map(x => { const n = esc(x.slice(4)); return `<div class="row"><b>${n}</b><button class="b pri" data-o="${n}">បើក</button><button class="b del" data-x="${n}">លុប</button></div>`; }).join('') : 'គ្មានគម្រោងរក្សាទុកទេ'); },
  more() { modal('ផ្សេងៗ / ឯកសារ .mcc', `<div class="row"><button class="b pri" data-a="openfile">📂 បើក .mcc</button><button class="b pri" data-a="savefileas">💾 រក្សាទុកជា .mcc</button><button class="b" data-a="capture">📷 ថតរូប</button><button class="b" data-a="fullscr">⛶ ពេញអេក្រង់</button><button class="b" data-a="fit2">⊡ សមនឹងខ្លឹមសារ</button></div><div class="row"><button class="b del" data-a="newp">លុបសៀគ្វីទាំងអស់</button></div><textarea id="ta">${ser()}</textarea><div class="row"><button class="b pri" data-a="imp">នាំចូល JSON / MCC</button></div>`); },
  imp() { try { load(JSON.parse(Q('#ta').value)); A.mclose(); } catch (_) { flash('ទិន្នន័យ JSON មិនត្រឹមត្រូវ'); } },
  about() { panel(); modal('អំពីកម្មវិធី', 'កម្មវិធីក្លែងធ្វើសៀគ្វីរ៉េឡេ និងកុងតាក់ទ័រ ជាភាសាខ្មែរ (Simurelay Web App)។<br><br><b>ផ្លូវកាត់កុំព្យូទ័រ៖</b> Ctrl+Z (ត្រឡប់), Ctrl+Y (ធ្វើវិញ), Ctrl+C (ចម្លង), Ctrl+V (បិទភ្ជាប់), R (បង្វិល), Del (លុប)។'); },
  set() { panel(); modal('ការកំណត់', settingsUI(), bindSettings); }
};

function zoomAt(cx, cy, f) {
  const svg = Q('#cv'), r = svg.getBoundingClientRect(), k = Math.min(3.5, Math.max(0.35, state.v.k * f));
  const wx = state.v.x + (cx - r.left) / state.v.k, wy = state.v.y + (cy - r.top) / state.v.k;
  state.v.k = k; state.v.x = wx - (cx - r.left) / k; state.v.y = wy - (cy - r.top) / k;
  refreshShell();
}
function zoomC(f) { const r = Q('#cv').getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, f); draw(); }

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
  const termHit = (px, py) => { let best = null, bd = R0(); [...state.els].reverse().forEach(e => tp(e).forEach(p => { const d = Math.hypot(px - p[0] * G, py - p[1] * G); if (d < bd) { bd = d; best = { p, e }; } })); return best; };
  const nodeAt = (px, py) => { let best = null, bd = R0(); state.wires.forEach(w => [[w[0], w[1]], [w[2], w[3]]].forEach(p => { const d = Math.hypot(px - p[0] * G, py - p[1] * G); if (d < bd) { bd = d; best = p; } })); return best; };
  const isConn = p => state.wires.some(w => (w[0] == p[0] && w[1] == p[1]) || (w[2] == p[0] && w[3] == p[1]));

  const moveEl = (md, e, nx, ny) => {
    if (D[e.type]?.isText) { e.x = nx; e.y = ny; return; }
    if (!md.mv) md.mv = startMove(state.wires, e, state.els, tp);
    const cand = planMove(md.mv, e, nx, ny, state.els, tp);
    if (cand) {
      state.wires = cand;
    } else {
      e.x = nx; e.y = ny;
      rerouteMoved(state.wires, md.mv.orig || [], tp(e), state.els, tp);
    }
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

  // ភ្ជាប់ប៊ូតុង Properties នៅជ្រុងលើខាងស្តាំ (Toggle, Pin, Collapse)
  const propToggleBtn = Q('#prop-toggle');
  const propPinBtn = Q('#prop-pin');
  const propCloseBtn = Q('#prop-close');
  if (propToggleBtn) {
    propToggleBtn.onclick = () => {
      propOpen = !propOpen;
      sheet();
    };
  }
  if (propPinBtn) {
    propPinBtn.onclick = () => {
      propPinned = !propPinned;
      propPinBtn.classList.toggle('act', propPinned);
      if (propPinned) propOpen = true;
      sheet();
    };
  }
  if (propCloseBtn) {
    propCloseBtn.onclick = () => {
      propOpen = false;
      propPinned = false;
      if (propPinBtn) propPinBtn.classList.remove('act');
      sheet();
    };
  }

  svg.onwheel = ev => { ev.preventDefault(); zoomAt(ev.clientX, ev.clientY, ev.deltaY < 0 ? 1.15 : 1 / 1.15); draw(); };

  const mccInput = Q('#mcc-input');
  if (mccInput) {
    mccInput.onchange = async ev => {
      const file = ev.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        state.fileHandle = null;
        readMccText(text, file.name);
      } catch (_) {
        flash('មិនអាចបើកឯកសារ .mcc នេះបានទេ');
      }
    };
  }

  svg.addEventListener('dragover', ev => ev.preventDefault());
  svg.addEventListener('drop', async ev => {
    ev.preventDefault();
    const file = ev.dataTransfer?.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      state.fileHandle = null;
      readMccText(text, file.name);
    } catch (_) {
      flash('ឯកសារមិនត្រឹមត្រូវ (ត្រូវជាប្រភេទ .mcc)');
    }
  });

  svg.onpointerdown = ev => {
    svg.setPointerCapture(ev.pointerId);
    state.ptr.set(ev.pointerId, [ev.clientX, ev.clientY]);
    if (state.ptr.size == 2) { state.mode = null; const [a, b] = [...state.ptr.values()]; state.pinch = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; return; }
    const [px, py] = pos(ev);
    state.cursor = [px, py];
    const selEl = state.els.find(a => a.id == state.sel && hitE(a, px, py));
    const e = selEl || [...state.els].reverse().find(a => hitE(a, px, py));
    const pan = () => ({ k: 'pan', x: ev.clientX, y: ev.clientY, ox: state.v.x, oy: state.v.y });

    if (state.sim) {
      if (e) {
        const tpName = e.type.toLowerCase();
        if (tpName === 'ic_generator3ph') {
          state.genSel = (state.genSel === e.id) ? null : e.id;
          state.genMode = state.genMode || {};
          if (!state.genMode[e.id]) state.genMode[e.id] = 'OFF';
          vib(); sheet(); draw(); return;
        }
        if (tpName === 'ol3' || tpName === 'olnc' || tpName === 'olno' || tpName.startsWith('ic_overload')) {
          state.tripped.has(e.tag) ? state.tripped.delete(e.tag) : state.tripped.add(e.tag); vib(); tick(); return;
        }
        if (tpName === 'ic_switch3p' || tpName === 'ic_switch3p0') {
          state.multiPos = state.multiPos || {};
          state.multiPos[e.id] = ((state.multiPos[e.id] || 0) + 1) % 3;
          vib(); tick(); return;
        }
        if (tpName.startsWith('btn') || tpName.startsWith('ic_button')) {
          state.pressed.add(e.id); vib(); tick(); return;
        }
        if (tpName.startsWith('sw') || tpName.startsWith('brk') || tpName === 'estop' || tpName === 'fuse' ||
            tpName.startsWith('ic_switch') || tpName.startsWith('ic_breaker') || tpName.startsWith('ic_tmbreaker') ||
            tpName.startsWith('ic_rcbo') || tpName.startsWith('ic_rccb') || tpName.startsWith('ic_motorbreaker') ||
            tpName.startsWith('ic_isolator') || tpName.startsWith('ic_emergency') || tpName.startsWith('ic_roller') ||
            tpName.startsWith('ic_fuse')) {
          state.tog.has(e.id) ? state.tog.delete(e.id) : state.tog.add(e.id);
          vib();
          tick();
          return;
        }
      }
      state.mode = pan(); return;
    }

    if (state.wireMode) { state.mode = { k: 'wm', x: ev.clientX, y: ev.clientY, ox: state.v.x, oy: state.v.y, down: pointAt(px, py), panning: false }; return; }
    const th = termHit(px, py), nd = !th && nodeAt(px, py);
    const hw = state.wires.findIndex(w => dseg(px, py, w) < 9 / state.v.k + 3);
    if (!th && hw >= 0 && state.selW >= 0 && chainOf(state.wires, termKeys(), state.selW).includes(hw)) { state.sel = null; state.mode = segMode(hw, px, py); }
    else if (th && isConn(th.p)) {
      state.sel = th.e.id; state.selW = -1;
      state.mode = th.e.locked ? pan() : { k: 'drag', e: th.e, dx: px - th.e.x * G, dy: py - th.e.y * G, pushed: 0 };
    }
    else if (th) { state.selW = -1; state.mode = { k: 'wire', a: th.p, c: th.p, e: th.e }; }
    else if (nd) state.mode = { k: 'wire', a: nd, c: nd };
    else if (e) {
      state.sel = e.id; state.selW = -1;
      state.mode = e.locked ? pan() : { k: 'drag', e, dx: px - e.x * G, dy: py - e.y * G, pushed: 0 };
    }
    else { state.selW = hw; state.sel = null; state.mode = hw >= 0 ? segMode(hw, px, py) : pan(); }
    sheet(); draw();
  };

  svg.onpointermove = ev => {
    const [px, py] = pos(ev);
    state.cursor = [px, py];
    refreshShell();
    if (!state.ptr.has(ev.pointerId)) return;
    state.ptr.set(ev.pointerId, [ev.clientX, ev.clientY]);
    if (state.ptr.size == 2) {
      const [a, b] = [...state.ptr.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
      zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, d / state.pinch); state.pinch = d; draw(); return;
    }
    if (!state.mode) return;
    if (state.mode.k == 'wm') { wmMove(ev, px, py); draw(); return; }
    if (state.mode.k == 'pan') {
      state.v.x = state.mode.ox - (ev.clientX - state.mode.x) / state.v.k;
      state.v.y = state.mode.oy - (ev.clientY - state.mode.y) / state.v.k;
      if (state.sim && state.genSel != null) sheet();
    }
    else if (state.mode.k == 'drag') {
      if (state.mode.e.locked) return;
      if (!state.mode.pushed) { push(); state.mode.pushed = 1; }
      const nx = Math.round((px - state.mode.dx) / G), ny = Math.round((py - state.mode.dy) / G), m = state.mode.e;
      if (nx != m.x || ny != m.y) moveEl(state.mode, m, nx, ny);
      state.guides = guidesFor(m, state.els, tp);
    }
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

  // បណ្ណាល័យឧបករណ៍ (#grid) ជាមួយ Tooltip ការពារដាច់គែម និង Drag & Drop
  const gridEl = Q('#grid');
  let libTip = Q('#lib-tip');
  if (!libTip) {
    libTip = document.createElement('div');
    libTip.id = 'lib-tip';
    libTip.hidden = true;
    document.body.appendChild(libTip);
  }

  const isPhoneDevice = () => {
    const ua = navigator.userAgent || '';
    if (/iPad|Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return false;
    if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return false;
    if (/iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry/i.test(ua)) return true;
    return Math.min(window.innerWidth, window.innerHeight) < 600;
  };

  let tipTimer = null;
  const showTip = tile => {
    if (!tile || !tile.dataset.nm) { libTip.hidden = true; return; }
    const r = tile.getBoundingClientRect();
    libTip.textContent = tile.dataset.nm;
    libTip.style.cssText =
      'position:fixed;z-index:99999;transform:translateY(-100%);padding:6px 12px;border-radius:8px;' +
      'background:var(--accent,#0284c7);color:#fff;font-size:13px;font-weight:700;white-space:nowrap;' +
      'max-width:calc(100vw - 16px);overflow:hidden;text-overflow:ellipsis;' +
      'pointer-events:none;box-shadow:0 6px 18px rgba(0,0,0,.35);left:8px;' +
      `top:${Math.max(44, r.top - 6)}px;`;
    libTip.hidden = false;

    const tipW = libTip.offsetWidth;
    const idealLeft = r.left + r.width / 2 - tipW / 2;
    const safeLeft = Math.max(8, Math.min(window.innerWidth - tipW - 8, idealLeft));
    libTip.style.left = safeLeft + 'px';

    clearTimeout(tipTimer);
    if (isPhoneDevice()) tipTimer = setTimeout(() => { libTip.hidden = true; }, 1600);
  };
  const hideTip = () => { clearTimeout(tipTimer); libTip.hidden = true; };

  gridEl.addEventListener('pointerover', ev => {
    const tile = ev.target.closest('.tile[data-nm]');
    if (tile && ev.pointerType === 'mouse') showTip(tile);
  });
  gridEl.addEventListener('click', ev => {
    const tile = ev.target.closest('.tile[data-nm]');
    if (tile && isPhoneDevice()) showTip(tile);
  });
  gridEl.addEventListener('pointerout', ev => {
    if (ev.pointerType === 'mouse' && !gridEl.contains(ev.relatedTarget)) hideTip();
  });
  gridEl.addEventListener('scroll', hideTip, { passive: true });

  const filterLib = () => {
    const catVal = Q('#cat')?.value || '*';
    const qVal = (Q('#q')?.value || '').trim().toLowerCase();
    document.querySelectorAll('.tile').forEach(t => {
      const matchCat = catVal === '*' || t.dataset.k === catVal;
      const matchQ = !qVal || (t.dataset.nm || '').toLowerCase().includes(qVal) || (t.dataset.add || '').toLowerCase().includes(qVal);
      t.hidden = !(matchCat && matchQ);
    });
  };

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
      const st0 = { on: 0, cl: D[t].c ? D[t].c(e) : 0, pr: 0, a: 0 };
      const inner = libR === 1
        ? `<g transform="rotate(90)">${d.d(e, st0)}</g>`
        : d.d(e, st0);
      return `<button class="tile" data-add="${t}" data-k="${d.k}" data-nm="${esc(d.nm)}"><svg viewBox="${vb}">${inner}</svg></button>`;
    }).join('');
    filterLib();
  };
  Q('#cat').onchange = filterLib;
  if (Q('#q')) Q('#q').oninput = filterLib;

  // Drag & Drop ប្រើបានលើកុំព្យូទ័រ និងថេប្លេត — បិទតែលើទូរស័ព្ទដៃប៉ុណ្ណោះ
  let libDrag = null;
  const clearLibDrag = () => { if (libDrag?.ghost) libDrag.ghost.remove(); libDrag = null; };

  gridEl.addEventListener('pointerdown', ev => {
    const tile = ev.target.closest('.tile[data-add]');
    if (tile && ev.pointerType !== 'mouse') {
      showTip(tile);
      setTimeout(hideTip, 1200);
    }
    if (state.sim || ev.button !== 0 || isPhoneDevice()) return;
    if (tile) libDrag = { type: tile.dataset.add, ptrId: ev.pointerId, x0: ev.clientX, y0: ev.clientY, ghost: null, dragging: false };
  });
  window.addEventListener('pointermove', ev => {
    if (!libDrag || ev.pointerId !== libDrag.ptrId) return;
    if (!libDrag.dragging && Math.hypot(ev.clientX - libDrag.x0, ev.clientY - libDrag.y0) > 10) {
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
    if (!libDrag || ev.pointerId !== libDrag.ptrId) return;
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

  document.onclick = ev => {
    const gm = ev.target.closest('[data-gm]');
    if (gm && state.sim && state.genSel != null) {
      state.genMode = state.genMode || {};
      state.genMode[state.genSel] = gm.dataset.gm;
      vib(); tick(); sheet(); return;
    }
    const t = ev.target.closest('[data-a],[data-add],[data-o],[data-x],[data-ex]');
    if (!t) return;
    const d = t.dataset;
    if (d.add) place(d.add);
    else if (d.ex) { A.mclose(); loadExample(d.ex); }
    else if (d.o) { const s = LS.get('rly:' + d.o); if (s) { try { load(JSON.parse(s)); state.proj = d.o; A.mclose(); } catch (_) {} } }
    else if (d.x) { LS.del('rly:' + d.x); A.ws(); }
    else if (A[d.a]) A[d.a]();
  };

  state.els = [];
  state.wires = [];
  state.nid = 1;
  state.proj = 'គម្រោងថ្មី';
  state.fileHandle = null;
  state.sel = null;
  state.selW = -1;
  state.hist = [];
  state.fut = [];
  fitScreen();
  tbar();
  stat();
});