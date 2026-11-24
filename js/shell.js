/* ==========================================================================
   ឯកសារ៖ js/shell.js
   តួនាទី៖ សំបកកម្មវិធី (App shell)
   - កុំព្យូទ័រ (≥900px)៖ របារម៉ឺនុយ (Project/Edit/View/…) + របារឧបករណ៍អាយខុន + របារស្ថានភាព + ផ្លូវកាត់ក្តារចុច
   - ទូរស័ព្ទ៖ របារឧបករណ៍ជាស្លាយផ្ដេក (អូសឆ្វេង/ស្តាំ) មានអាយខុន + ឈ្មោះ
   - ភាសាម៉ឺនុយ KM/EN, ពន្លឺ/ងងឹត
   ========================================================================== */
import { state, Q, esc } from './state.js';
import { save as saveSettings, apply as applySettings } from './settings.js';

// អាយខុនបន្ទាត់ 24×24 (stroke)
const P = {
  menu: 'M4 6h16M4 12h16M4 18h16', more: 'M5 12h.01M12 12h.01M19 12h.01',
  new: 'M6 3h8l4 4v14H6zM14 3v4h4M12 11v6M9 14h6', open: 'M3 7h6l2 2h10v10H3z', save: 'M5 3h12l3 3v15H5zM8 3v5h8M8 21v-7h8v7',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3', redo: 'M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
  run: 'M7 4l13 8-13 8z', stop: 'M6 6h12v12H6z', wire: 'M3 17h5V8h8v9h5M3 17h0M21 17h0',
  text: 'M5 6h14M12 6v13M9 19h6', lib: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM16.5 13v7M13 16.5h7',
  copy: 'M8 8h11v13H8zM5 16V3h11', paste: 'M9 4h6v3H9zM7 5H5v16h14V5h-2M9 12h6M9 16h6',
  del: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6', rot: 'M20 12a8 8 0 1 1-3-6.2M20 4v5h-5',
  lock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3', unlock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 7.5-2',
  grid: 'M4 4h16v16H4zM4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16', snap: 'M5 20v-9a7 7 0 0 1 14 0v9h-4v-9a3 3 0 0 0-6 0v9z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6', eyeoff: 'M3 3l18 18M10.6 6.1A9 9 0 0 1 12 5c6 0 10 7 10 7a16 16 0 0 1-3 3.5M6.5 7.5A16 16 0 0 0 2 12s4 7 10 7a9 9 0 0 0 3.5-.7M9.9 9.9a3 3 0 0 0 4.2 4.2',
  zout: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5M8 11h6', zin: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5M8 11h6M11 8v6',
  fit: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5M9 9h6v6H9z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5', moon: 'M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z'
};
const ic = k => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[k]}"/></svg>`;

// ពាក្យម៉ឺនុយ/ឧបករណ៍ ២ ភាសា
const L = {
  km: {
    project: 'គម្រោង', edit: 'កែប្រែ', view: 'មើល', insert: 'បញ្ចូល', simulation: 'ក្លែងធ្វើ', tools: 'ឧបករណ៍', window: 'បង្អួច', help: 'ជំនួយ',
    menu: 'ម៉ឺនុយ', more: 'ផ្សេងៗ', new: 'គម្រោងថ្មី', open: 'បើកគម្រោង (.mcc)', save: 'រក្សាទុក (.mcc)', saveas: 'រក្សាទុកជាឈ្មោះថ្មី…', browser_ws: 'គម្រោងក្នុង Browser', exm: 'សៀគ្វីឧទាហរណ៍', capture: 'ថតរូប PNG', json: 'ទិន្នន័យ JSON',
    undo: 'ត្រឡប់', redo: 'ធ្វើវិញ', run: 'ដំណើរការ', stop: 'បញ្ឈប់', wire: 'ខ្សែ', text: 'អត្ថបទ', lib: 'ឧបករណ៍', copy: 'ចម្លង', paste: 'បិទភ្ជាប់', dup: 'ស្ទួន', del: 'លុប',
    rot: 'បង្វិល', lock: 'ចាក់សោ', unlock: 'ដោះសោ', front: 'ខាងមុខ', back: 'ខាងក្រោយ', grid: 'ក្រឡាចត្រង្គ', snap: 'ចាប់ជើង', hide: 'លាក់ស្លាក', zin: 'ពង្រីក', zout: 'ពង្រួម', fit: 'សមអេក្រង់',
    theme: 'ងងឹត/ភ្លឺ', lang: 'ភាសា', fullscr: 'ពេញអេក្រង់', set: 'ការកំណត់', about: 'អំពី', keys: 'ផ្លូវកាត់ក្តារចុច',
    zoom: 'ពង្រីក', saved: 'រក្សាទុក', mode: 'របៀប', m_sel: 'ជ្រើសរើស', m_wire: 'គូរខ្សែ', m_sim: 'ក្លែងធ្វើ', on: 'បើក', off: 'បិទ', never: 'មិនទាន់', proj: 'គម្រោង'
  },
  en: {
    project: 'Project', edit: 'Edit', view: 'View', insert: 'Insert', simulation: 'Simulation', tools: 'Tools', window: 'Window', help: 'Help',
    menu: 'Menu', more: 'More', new: 'New Project', open: 'Open (.mcc)', save: 'Save (.mcc)', saveas: 'Save As…', browser_ws: 'Browser Projects', exm: 'Example Circuits', capture: 'Capture PNG', json: 'JSON Data',
    undo: 'Undo', redo: 'Redo', run: 'Simulate', stop: 'Stop', wire: 'Wire', text: 'Text', lib: 'Library', copy: 'Copy', paste: 'Paste', dup: 'Duplicate', del: 'Delete',
    rot: 'Rotate', lock: 'Lock', unlock: 'Unlock', front: 'Bring to Front', back: 'Send to Back', grid: 'Grid', snap: 'Snap', hide: 'Hide Labels', zin: 'Zoom In', zout: 'Zoom Out', fit: 'Fit',
    theme: 'Light / Dark', lang: 'Language', fullscr: 'Full Screen', set: 'Settings', about: 'About', keys: 'Keyboard Shortcuts',
    zoom: 'Zoom', saved: 'Saved', mode: 'Mode', m_sel: 'Selection', m_wire: 'Wiring', m_sim: 'Simulation', on: 'ON', off: 'OFF', never: 'not yet', proj: 'Project'
  }
};
export const t = k => (L[state.opt.lang] || L.km)[k] ?? L.en[k] ?? k;

// របារឧបករណ៍
const TB = [
  { a: 'menu', i: 'menu', k: 'menu', mo: 1 },
  { a: 'newp', i: 'new', k: 'new' }, { a: 'openfile', i: 'open', k: 'open' }, { a: 'savefile', i: 'save', k: 'save' }, '|',
  { a: 'undo', i: 'undo', k: 'undo', id: 'undo' }, { a: 'redo', i: 'redo', k: 'redo', id: 'redo' }, '|',
  { a: 'run', i: 'run', k: 'run', id: 'run' }, '|',
  { a: 'wiremode', i: 'wire', k: 'wire', id: 'wm' }, { a: 'text', i: 'text', k: 'text' }, { a: 'lib', i: 'lib', k: 'lib', id: 'libbtn' }, '|',
  { a: 'copy', i: 'copy', k: 'copy' }, { a: 'paste', i: 'paste', k: 'paste' }, { a: 'del', i: 'del', k: 'del' }, '|',
  { a: 'rot', i: 'rot', k: 'rot' }, { a: 'lock', i: 'lock', k: 'lock', id: 'lockbtn' }, '~',
  { a: 'grid', i: 'grid', k: 'grid', id: 'gridbtn' }, { a: 'snap', i: 'snap', k: 'snap', id: 'snapbtn' }, { a: 'hidetags', i: 'eye', k: 'hide', id: 'hidebtn' }, '|',
  { a: 'zout', i: 'zout', k: 'zout' }, { a: 'fit', i: 'fit', k: 'fit' }, { a: 'zin', i: 'zin', k: 'zin' }, '|',
  { a: 'theme', i: 'sun', k: 'theme', id: 'themebtn' }, { a: 'lang', k: 'lang', id: 'langbtn', txt: 1 },
  { a: 'more', i: 'more', k: 'more', mo: 1 }
];

// ម៉ឺនុយធ្លាក់ចុះ (កុំព្យូទ័រ)
const MENUS = {
  project: [['newp', 'new', 'Ctrl+N'], ['openfile', 'open', 'Ctrl+O'], ['savefile', 'save', 'Ctrl+S'], ['savefileas', 'saveas'], ['ws', 'browser_ws'], '-', ['exm', 'exm'], ['capture', 'capture'], ['more', 'json']],
  edit: [['undo', 'undo', 'Ctrl+Z'], ['redo', 'redo', 'Ctrl+Y'], '-', ['copy', 'copy', 'Ctrl+C'], ['paste', 'paste', 'Ctrl+V'], ['dup', 'dup', 'Ctrl+D'], ['del', 'del', 'Del'], '-', ['rot', 'rot', 'R'], ['lock', 'lock', 'L'], ['front', 'front'], ['back', 'back']],
  view: [['grid', 'grid', 'G'], ['snap', 'snap'], ['hidetags', 'hide', 'H'], '-', ['zin', 'zin', '+'], ['zout', 'zout', '−'], ['fit', 'fit', 'F'], '-', ['fullscr', 'fullscr', 'F11'], ['theme', 'theme']],
  insert: [['lib', 'lib', 'I'], ['wiremode', 'wire', 'W'], ['text', 'text', 'T']],
  simulation: [['run', 'run', 'Space']],
  tools: [['set', 'set']],
  window: [['lib', 'lib']],
  help: [['keys', 'keys'], ['about', 'about']]
};

const KEYS = [
  ['Ctrl+N', 'new'], ['Ctrl+O', 'open'], ['Ctrl+S', 'save'], ['Ctrl+Z / Ctrl+Y', 'undo / redo'],
  ['Ctrl+C / Ctrl+V / Ctrl+D', 'copy / paste / duplicate'], ['Delete', 'del'],
  ['R', 'rot'], ['L', 'lock'], ['W', 'wire'], ['T', 'text'], ['G', 'grid'], ['H', 'hide'], ['F', 'fit'],
  ['+ / −', 'zoom'], ['Space', 'run / stop'], ['Esc', 'cancel / deselect'],
  ['Mouse wheel', 'zoom'], ['Middle / right drag', 'pan']
];

let A = {}, helpers = {};

export function keysHelp() {
  return '<table style="width:100%;border-collapse:collapse">' + KEYS.map(([k, v]) => `<tr><td style="padding:3px 8px;font-family:monospace;white-space:nowrap">${esc(k)}</td><td style="padding:3px 8px">${esc(v.split(' / ').map(x => L.km[x] && state.opt.lang == 'km' ? L.km[x] : x).join(' / '))}</td></tr>`).join('') + '</table>';
}

function buildToolbar() {
  const tb = Q('#tb'); if (!tb) return;
  tb.innerHTML = TB.map(b => {
    if (b === '|') return '<span class="sep"></span>';
    if (b === '~') return '<span class="sp"></span>';
    return `<button type="button" data-a="${b.a}"${b.id ? ` id="${b.id}"` : ''} class="${b.mo ? 'mo' : ''}" title="${esc(t(b.k))}">${b.txt ? `<b class="tx">${state.opt.lang == 'en' ? 'EN' : 'KM'}</b>` : ic(b.i)}<span>${esc(t(b.k))}</span></button>`;
  }).join('');
}
function buildMenubar() {
  const mb = Q('#menubar'); if (!mb) return;
  mb.innerHTML = Object.keys(MENUS).map(k => `<button type="button" class="mb" data-menu="${k}">${esc(t(k))}</button>`).join('') + '<span id="mtitle"></span>';
}
let openMenu = null;
function closeMenu() {
  openMenu = null;
  const d = Q('#mdrop');
  if (d) d.hidden = true;
  document.querySelectorAll('#menubar .mb').forEach(b => b.classList.remove('open'));
}
function showMenu(k, btn) {
  const d = Q('#mdrop'); if (!d) return;
  if (openMenu == k) { closeMenu(); return; }
  closeMenu(); openMenu = k;
  d.innerHTML = MENUS[k].map(it => it === '-' ? '<hr>' : `<button type="button" data-a="${it[0]}"><span>${esc(t(it[1]))}</span><kbd>${it[2] || ''}</kbd></button>`).join('');
  const r = btn.getBoundingClientRect();
  d.style.left = r.left + 'px';
  d.style.top = r.bottom + 'px';
  d.hidden = false;
  btn.classList.add('open');
}

// ប្តូរអាយខុន/ឈ្មោះប៊ូតុង Run ↔ Stop (ហៅពី main.run)
export function setRunUi(on) {
  const b = Q('#run'); if (!b) return;
  b.classList.toggle('act', !!on);
  b.innerHTML = ic(on ? 'stop' : 'run') + `<span>${esc(t(on ? 'stop' : 'run'))}</span>`;
  b.title = t(on ? 'stop' : 'run');
  const lb = Q('#libbtn');
  if (lb) lb.disabled = !!on;
}

const cache = {};
const setIf = (id, key, fn) => { const el = Q(id); if (el && cache[id] !== key) { cache[id] = key; fn(el); } };
export function refresh() {
  const o = state.opt, e = state.els.find(x => x.id == state.sel), dark = o.dark ?? (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches);
  const u = Q('#undo'), r = Q('#redo');
  if (u) u.disabled = !state.hist.length;
  if (r) r.disabled = !state.fut.length;
  setIf('#lockbtn', (e && e.locked) + t('lock'), b => { b.innerHTML = ic(e && e.locked ? 'unlock' : 'lock') + `<span>${esc(t(e && e.locked ? 'unlock' : 'lock'))}</span>`; b.classList.toggle('on', !!(e && e.locked)); });
  setIf('#gridbtn', o.grid, b => b.classList.toggle('on', o.grid != 'none'));
  setIf('#snapbtn', o.snap, b => b.classList.toggle('on', o.snap !== false));
  setIf('#hidebtn', o.hideTags, b => { b.innerHTML = ic(o.hideTags ? 'eyeoff' : 'eye') + `<span>${esc(t('hide'))}</span>`; b.classList.toggle('on', !!o.hideTags); });
  setIf('#themebtn', dark, b => { b.innerHTML = ic(dark ? 'moon' : 'sun') + `<span>${esc(t('theme'))}</span>`; });
  const sb = Q('#statusbar');
  if (sb) {
    const [x, y] = state.cursor || [0, 0], at = state.savedAt, hh = n => String(n).padStart(2, '0');
    const mode = state.sim ? t('m_sim') : state.wireMode ? t('m_wire') : t('m_sel');
    const html = `<span>X: ${Math.round(x)}, Y: ${Math.round(y)}</span><span>${t('zoom')}: ${Math.round(state.v.k * 100)}%</span><span>${t('saved')}: ${at ? hh(at.getHours()) + ':' + hh(at.getMinutes()) : t('never')}</span><span>${t('snap')}: ${o.snap !== false ? t('on') : t('off')}</span><span>${t('mode')}: ${mode}</span>`;
    setIf('#statusbar', html, el => { el.innerHTML = html; });
  }
  setIf('#mtitle', state.proj + '|' + o.lang, el => { el.textContent = state.proj || t('proj'); });
}

function onKey(ev) {
  const tg = ev.target && ev.target.tagName;
  if (tg == 'INPUT' || tg == 'TEXTAREA' || tg == 'SELECT') return;
  const k = (ev.key || '').toLowerCase(), c = ev.ctrlKey || ev.metaKey, run = fn => { ev.preventDefault && ev.preventDefault(); fn(); };
  if (k == 'escape') {
    closeMenu();
    if (state.wireMode) A.wiremode();
    else { state.sel = null; state.selW = -1; state.selT = null; helpers.refreshSheet && helpers.refreshSheet(); }
    return;
  }
  if (c) {
    const m = { n: 'newp', o: 'openfile', s: 'savefile', z: 'undo', y: 'redo', c: 'copy', v: 'paste', d: 'dup' }[k];
    if (k == 'z' && ev.shiftKey) return run(A.redo);
    if (m && A[m]) return run(A[m]);
    return;
  }
  if (k == 'delete' || k == 'backspace') return run(() => (state.selW >= 0 && state.sel == null && state.selT == null) ? A.delw() : A.del());
  const m = { r: 'rot', l: 'lock', w: 'wiremode', t: 'text', g: 'grid', h: 'hidetags', f: 'fit', i: 'lib', '+': 'zin', '=': 'zin', '-': 'zout', ' ': 'run' }[k];
  if (m && A[m]) run(A[m]);
}

export function initShell(actions, h) {
  A = actions;
  helpers = h || {};
  buildToolbar();
  buildMenubar();
  setRunUi(state.sim);
  document.addEventListener && document.addEventListener('click', ev => {
    const mb = ev.target.closest && ev.target.closest('[data-menu]');
    if (mb) { showMenu(mb.dataset.menu, mb); return; }
    closeMenu();
  });
  window.addEventListener('keydown', onKey);
  const iv = setInterval(refresh, 150);
  if (iv && iv.unref) iv.unref();
  refresh();
}

// ប្តូរភាសាម៉ឺនុយ KM ↔ EN និងងងឹត/ភ្លឺ
export function toggleLang() {
  state.opt.lang = state.opt.lang == 'en' ? 'km' : 'en';
  saveSettings();
  buildToolbar();
  buildMenubar();
  setRunUi(state.sim);
  Object.keys(cache).forEach(k => delete cache[k]);
  refresh();
}
export function toggleTheme() {
  const dark = state.opt.dark ?? (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches);
  state.opt.dark = !dark;
  saveSettings();
  applySettings();
  refresh();
}