/* ==========================================================================
   ឯកសារ៖ js/settings.js
   តួនាទី៖ ការកំណត់ (ក្រឡាចត្រង្គ ញ័រ ផ្ទាំងពង្រីក របៀបងងឹត ពណ៌ប្រភព/ស្លាក) និងថតរូប Canvas
   ========================================================================== */
import { state, Q } from './state.js';
import { COL } from './components.js';
import { draw } from './renderer.js';

const KEY = 'rly.settings';
const DEF_COL = { ...COL };
const DEF_OPT = { grid: 'lines', pins: true, vibrate: true, zoom: true, listLib: false, dark: null };
const SRC = [['L1', 'ប្រភព L1'], ['L2', 'ប្រភព L2'], ['L3', 'ប្រភព L3'], ['N', 'Neutral (N)'], ['PE', 'ដីការពារ PE'], ['P', 'វិជ្ជមាន (+)'], ['M', 'អវិជ្ជមាន (−)']];
let hooks = {};

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ opt: state.opt, col: COL, tag: state.tagCol, pin: state.pinCol })); } catch (_) {}
}

// អានការកំណត់ដែលបានរក្សា (ហៅមុន apply)
export function load(h) {
  hooks = h || {};
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s) { Object.assign(state.opt, s.opt); Object.assign(COL, s.col); state.tagCol = s.tag || ''; state.pinCol = s.pin || ''; }
  } catch (_) {}
}

// អនុវត្តការកំណត់ទៅ UI ទាំងមូល
export function apply() {
  const root = document.documentElement, o = state.opt;
  if (o.dark === null || o.dark === undefined) delete root.dataset.theme; else root.dataset.theme = o.dark ? 'dark' : 'light';
  const z = Q('#zm'); if (z) z.style.display = o.zoom ? '' : 'none';
  const g = Q('#grid'); if (g) g.classList.toggle('list', !!o.listLib);
  state.tagCol ? root.style.setProperty('--tag', state.tagCol) : root.style.removeProperty('--tag');
  state.pinCol ? root.style.setProperty('--pin', state.pinCol) : root.style.removeProperty('--pin');
  document.querySelectorAll('.leg i').forEach((el, i) => { const k = ['L1', 'L2', 'L3', 'N', 'PE'][i]; if (k) el.style.background = COL[k]; });
  if (hooks.rebuild) hooks.rebuild(); // គូរនិមិត្តសញ្ញាបណ្ណាល័យឡើងវិញតាមពណ៌ថ្មី
  draw();
}

export function reset() {
  Object.assign(state.opt, DEF_OPT); Object.assign(COL, DEF_COL); state.tagCol = ''; state.pinCol = '';
  save(); apply();
}

export function settingsUI() {
  const o = state.opt, dark = o.dark ?? (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches);
  const w = 'justify-content:space-between;width:100%';
  const tg = (id, l, on) => `<label class="row" style="${w}"><span>${l}</span><input type="checkbox" id="${id}" ${on ? 'checked' : ''}></label>`;
  const clr = (id, l, v) => `<label class="row" style="${w}"><span>${l}</span><input type="color" id="${id}" value="${v}"></label>`;
  return `<div class="row" style="${w}"><span>បង្ហាញក្រឡាចត្រង្គ</span><select id="s-grid"><option value="none">គ្មាន</option><option value="lines">បន្ទាត់</option><option value="dots">ចំណុច</option></select></div>` +
    tg('s-vib', 'ញ័រពេលចុច (Vibration)', o.vibrate) + tg('s-lib', 'បង្ហាញឧបករណ៍ជាក្រឡា (Grid)', !o.listLib) +
    tg('s-zoom', 'បង្ហាញផ្ទាំងពង្រីក', o.zoom) + tg('s-pins', 'បង្ហាញលេខជើង', o.pins) + tg('s-dark', 'របៀបងងឹត (Dark Mode)', dark) +
    '<h4 style="margin:12px 0 2px">ពណ៌</h4>' +
    clr('c-tag', 'ស្លាកឧបករណ៍', state.tagCol || '#0284c7') + clr('c-pin', 'ស្លាកជើង', state.pinCol || '#64748b') +
    SRC.map(([k, l]) => clr('c-' + k, l, COL[k])).join('') +
    '<div class="row"><button class="b del" id="s-reset">កំណត់ឡើងវិញជាលំនាំដើម</button></div>';
}

export function bindSettings() {
  Q('#s-grid').value = state.opt.grid;
  const on = (id, f) => { const el = Q('#' + id); if (el) el.oninput = () => { f(el); save(); apply(); }; };
  on('s-grid', el => state.opt.grid = el.value);
  on('s-vib', el => { state.opt.vibrate = el.checked; if (el.checked && navigator.vibrate) navigator.vibrate(30); });
  on('s-lib', el => state.opt.listLib = !el.checked);
  on('s-zoom', el => state.opt.zoom = el.checked);
  on('s-pins', el => state.opt.pins = el.checked);
  on('s-dark', el => state.opt.dark = el.checked);
  on('c-tag', el => state.tagCol = el.value);
  on('c-pin', el => state.pinCol = el.value);
  SRC.forEach(([k]) => on('c-' + k, el => COL[k] = el.value));
  Q('#s-reset').onclick = () => { reset(); Q('#mb').innerHTML = settingsUI(); bindSettings(); };
}

// ថត Canvas ជារូប PNG (បញ្ចូល CSS + ពណ៌ចូលក្នុង SVG មុនបំលែង)
export function capture() {
  const svg = Q('#cv'), r = svg.getBoundingClientRect(), cs = getComputedStyle(document.documentElement);
  const vars = ['--bg', '--panel', '--ink', '--muted', '--grid', '--off', '--on', '--lamp', '--danger', '--accent', '--tag', '--pin']
    .map(v => cs.getPropertyValue(v).trim() ? `${v}:${cs.getPropertyValue(v).trim()}` : '').join(';');
  let css = '';
  for (const sh of document.styleSheets) { try { for (const rule of sh.cssRules) if (rule.cssText.startsWith('svg')) css += rule.cssText; } catch (_) {} }
  const c = svg.cloneNode(true), k = state.v.k;
  c.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); c.setAttribute('width', r.width * 2); c.setAttribute('height', r.height * 2); c.setAttribute('style', vars);
  c.insertAdjacentHTML('afterbegin', `<style>${css}</style><rect x="${state.v.x}" y="${state.v.y}" width="${r.width / k}" height="${r.height / k}" style="fill:var(--panel);stroke:none"/>`);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(c)], { type: 'image/svg+xml' }));
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas'); cv.width = r.width * 2; cv.height = r.height * 2;
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
    cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (state.proj || 'circuit') + '.png'; a.click(); });
  };
  img.src = url;
}
