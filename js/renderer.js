/* ==========================================================================
   ឯកសារ៖ js/renderer.js
   តួនាទី៖ គូរក្រឡាចត្រង្គ ខ្សែភ្លើង ឧបករណ៍ SVG លេខជើង និងការតម្រឹមអេក្រង់
   ========================================================================== */
import { state, Q, esc } from './state.js';
import { G, COL, D, rot, tp, cond, pinOf } from './components.js';
import { buildPolylines, makeHops, polyPath } from './wiring.js';
import { computeFlow, polyDir } from './flow.js';

// គូរសៀគ្វីទាំងមូលឡើងវិញលើផ្ទាំង SVG
export function draw() {
  const svg = Q('#cv');
  if (!svg) return;
  const r = svg.getBoundingClientRect();
  const W = (r.width || 800) / state.v.k;
  const H = (r.height || 600) / state.v.k;
  svg.setAttribute('viewBox', `${state.v.x} ${state.v.y} ${W} ${H}`);

  // គូរចំណុចក្រឡាចត្រង្គ (Grid)
  let h = `<defs><pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse">${state.opt.grid == 'dots' ? '<circle cx="0" cy="0" r="1.2" style="fill:var(--grid);stroke:none"/>' : '<path d="M20 0H0V20" style="fill:none;stroke:var(--grid);stroke-width:1"/>'}</pattern></defs>` +
          (state.opt.grid && state.opt.grid != 'none' ? `<rect x="${state.v.x}" y="${state.v.y}" width="${W}" height="${H}" style="fill:url(#g);stroke:none"/>` : '');

  // បន្ទាត់ណែនាំតម្រឹមពេលអូសឧបករណ៍
  (state.guides || []).forEach(g => {
    const st = g.hit ? 'stroke:#0ea5e9;stroke-width:1.4;opacity:.9' : 'stroke:#7dd3fc;stroke-width:1;stroke-dasharray:5 4;opacity:.65';
    h += g.k == 'v' ? `<line x1="${g.v * G}" y1="${state.v.y}" x2="${g.v * G}" y2="${state.v.y + H}" style="${st}"/>`
                    : `<line x1="${state.v.x}" y1="${g.v * G}" x2="${state.v.x + W}" y2="${g.v * G}" style="${st}"/>`;
  });

  // រាប់ចំនួនខ្សែដែលប្រសព្វគ្នាដើម្បីគូរគ្រាប់ចំណុចតភ្ជាប់ (T-Junction Dot)
  const deg = {};
  state.wires.forEach(([x1, y1, x2, y2]) => {
    deg[x1 + ',' + y1] = (deg[x1 + ',' + y1] || 0) + 1;
    deg[x2 + ',' + y2] = (deg[x2 + ',' + y2] || 0) + 1;
  });

  // កំណត់ពណ៌ខ្សែភ្លើងតាមហ្វាស
  const col = k => {
    if (!state.live) return 'var(--off)';
    const n = [...state.live.nm(k)];
    return n.length ? (n.length > 1 ? '#ef4444' : COL[n[0]]) : 'var(--off)';
  };

  // គូរខ្សែភ្លើងជា polyline ជាប់គ្នា (ជ្រុងមូល + ដៃលោតត្រង់ចំណុចកាត់គ្នាដែលមិនភ្ជាប់)
  const termKeys = new Set(state.els.flatMap(tp).map(p => p[0] + ',' + p[1]));
  const flow = (state.sim && state.live && state.opt.flow !== false) ? computeFlow(state, D, tp) : null;   // ចរន្តរត់
  const phase = ((state.flowT || 0) * 28) % 14;
  const hops = makeHops(state.wires, termKeys);
  buildPolylines(state.wires, termKeys).forEach(pl => {
    const d = polyPath(pl.pts, hops), sel = state.selW >= 0 && pl.idx.includes(state.selW);
    const fd = sel ? 0 : polyDir(flow, pl);
    const dash = fd ? `;stroke-linecap:butt;stroke-dasharray:8 6;stroke-dashoffset:${(fd > 0 ? -phase : phase).toFixed(2)}` : ''; // ជ្រើសខ្សែ = ជ្រើស polyline ទាំងមូល
    if (sel) h += `<path d="${d}" style="fill:none;stroke:#f59e0b;stroke-width:7;opacity:.3;stroke-linecap:round;stroke-linejoin:round"/>`;
    h += `<path class="w" d="${d}" style="fill:none;stroke:${sel ? '#f59e0b' : col(pl.pts[0][0] + ',' + pl.pts[0][1])};stroke-width:1.5;stroke-linejoin:round;stroke-linecap:round${dash}"/>`;
  });
  Object.keys(deg).forEach(k => { if (deg[k] > 2) { const [x, y] = k.split(','); h += `<circle class="dot" cx="${x * G}" cy="${y * G}" r="2.2" style="fill:${col(k)}"/>`; } });

  // គូរឧបករណ៍នីមួយៗ ឈ្មោះសម្គាល់ (Tag) និងលេខជើង (Pins)
  state.els.forEach(e => {
    const d = D[e.type];
    const res = (state.sim && state.live && d.ld) ? state.live.en(e) : false;
    const st = {
      on: !!(res && res.on && !state.live.short),
      dir: res ? res.dir : 1,
      cl: cond(e),
      pr: state.pressed.has(e.id),
      tr: state.tripped.has(e.tag),
      a: state.ang
    };

    if (state.sel == e.id) {
      const [b0, b1, b2, b3] = d.bb;
      h += `<g transform="translate(${e.x * G} ${e.y * G}) rotate(${e.r * 90})"><rect x="${b0 - 3}" y="${b1 - 3}" width="${b2 - b0 + 6}" height="${b3 - b1 + 6}" rx="4" class="sel-box"/></g>`;
    }

    h += `<g transform="translate(${e.x * G} ${e.y * G}) rotate(${e.r * 90})" class="${state.sel == e.id ? 'sel' : ''}">${d.d(e, st)}</g>`;

    if (d.pre !== undefined && e.tag) {
      const [b0, b1, b2, b3] = d.bb;
      const corners = [[b0, b1], [b2, b1], [b0, b3], [b2, b3]].map(([cx, cy]) => rot(cx, cy, e.r));
      const minX = Math.min(...corners.map(c => c[0]));
      const maxX = Math.max(...corners.map(c => c[0]));
      const minY = Math.min(...corners.map(c => c[1]));
      const maxY = Math.max(...corners.map(c => c[1]));
      const midY = (minY + maxY) / 2;

      const rawTag = e.tag.trim();
      const dispTag = rawTag.startsWith('-') ? rawTag : '-' + rawTag;
      let label = esc(dispTag);
      let timeStr = '';
      if (d.tm && state.sim && state.live && state.live.en(e)) {
        timeStr = `${Math.max(0, e.sec - (state.acc[e.id] || 0)).toFixed(1)}s`;
      }

      // ឧបករណ៍បញ្ឈរ (r=1,3 ឬកុងតាក់ទ័រ/ប្រេកគ័រ/ម៉ូទ័រ) ដាក់ Tag បញ្ឈរ (-90°) នៅចំហៀងខាងឆ្វេងដូច Simurelay
      const isVerticalPart = e.r % 2 === 1 || d.t.length >= 3 || e.type.startsWith('mot');
      const lockBadge = e.locked ? ' 🔒' : '';
      if (isVerticalPart) {
        // បន្ថែមគម្លាតបន្ថែមសម្រាប់ប៊ូតុងចុច (Button/E-Stop/Roller) កុំឱ្យអក្សរជាន់លើក្បាលប៊ូតុងខាងឆ្វេង
        const hasActuatorLeft = /btn|button|estop|emergency|roller|sw/i.test(e.type);
        const tagGap = hasActuatorLeft ? 20 : 12;
        const txX = e.x * G + minX - tagGap;
        const txY = e.y * G + midY;
        h += `<text x="${txX}" y="${txY}" text-anchor="middle" dominant-baseline="central" class="tag-txt" transform="rotate(-90 ${txX} ${txY})">${label}${lockBadge}</text>`;
        if (timeStr) {
          const tmX = txX - 11;
          h += `<text x="${tmX}" y="${txY}" text-anchor="middle" dominant-baseline="central" class="tag-tm" transform="rotate(-90 ${tmX} ${txY})">${timeStr}</text>`;
        }
      } else {
        const txX = e.x * G + (minX + maxX) / 2;
        const txY = e.y * G + minY - 10;
        h += `<text x="${txX}" y="${txY}" text-anchor="middle" class="tag-txt">${label}${lockBadge}</text>`;
        if (timeStr) {
          h += `<text x="${txX}" y="${txY - 11}" text-anchor="middle" class="tag-tm">${timeStr}</text>`;
        }
      }
    } else if (e.locked && !D[e.type]?.isText) {
      h += `<text x="${e.x * G + 12}" y="${e.y * G + 10}" style="font-size:9px">🔒</text>`;
    }

    tp(e).forEach(([a, b], idx) => {
      if (!state.sim) h += `<circle class="tm" cx="${a * G}" cy="${b * G}" r="2.5"/>`;
      const pn = pinOf(e, idx);
      if (state.opt.pins && pn) {
        if (e.type === 'ic_generator3ph' && pn === 'C1') {
          h += `<text x="${a * G - 18}" y="${b * G - 3}" class="tm-pin">${esc(pn)}</text>`;
        } else {
          h += `<text x="${a * G + 5}" y="${b * G - 3}" class="tm-pin">${esc(pn)}</text>`;
        }
      }
    });
  });

  // គូរខ្សែដាច់ៗពេលកំពុងអូសតភ្ជាប់ខ្សែថ្មី ជាមួយសញ្ញា Snap ពណ៌បៃតងពេលចំជើងឧបករណ៍
  if (state.mode && state.mode.k == 'wire') {
    const [x1, y1] = state.mode.a, [x2, y2] = state.mode.c;
    const isSnapped = termKeys.has(x2 + ',' + y2) || deg[x2 + ',' + y2] > 0;
    const snapCol = isSnapped ? '#10b981' : 'var(--accent)';
    h += `<path d="M${x1 * G} ${y1 * G}L${x2 * G} ${y2 * G}" style="stroke:${snapCol};stroke-width:2.5;stroke-dasharray:5 3"/>` +
         `<circle cx="${x2 * G}" cy="${y2 * G}" r="${isSnapped ? 6 : 7}" style="fill:${isSnapped ? '#10b98133' : 'none'};stroke:${snapCol};stroke-width:2"/>`;
  }

  // របៀបគូរខ្សែ
  if (state.wireMode && !state.sim) {
    const c = state.wp ? '#22c55e' : '#f59e0b';
    state.els.forEach(e => tp(e).forEach(([a, b]) => { h += `<circle cx="${a * G}" cy="${b * G}" r="6.5" style="fill:none;stroke:${c};stroke-width:1.6"/>`; }));
    const base = state.wp || (state.mode && state.mode.k == 'wm' && state.mode.down ? [state.mode.down] : null);
    if (base) {
      const path = state.wcur ? [...base, state.wcur] : base;
      let d = `M${path[0][0] * G} ${path[0][1] * G}`;
      for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i]; if (a[0] != b[0] && a[1] != b[1]) d += `L${b[0] * G} ${a[1] * G}`; d += `L${b[0] * G} ${b[1] * G}`; }
      h += `<path d="${d}" style="fill:none;stroke:var(--accent);stroke-width:2.5;stroke-dasharray:5 3"/>`;
      path.forEach(p => { h += `<circle cx="${p[0] * G}" cy="${p[1] * G}" r="4" style="fill:var(--accent);stroke:none"/>`; });
    }
  }

  svg.innerHTML = h;
}

// បំបែកខ្សែដែលមានចំណុច (x,y) នៅកណ្ដាល ដើម្បីឱ្យតភ្ជាប់បែប T-junction
function splitAt(x, y) {
  const out = [];
  state.wires.forEach(w => {
    const [a, b, c, d] = w;
    const inside = (a == c && x == a && y > Math.min(b, d) && y < Math.max(b, d)) ||
                   (b == d && y == b && x > Math.min(a, c) && x < Math.max(a, c));
    if (inside) out.push([a, b, x, y], [x, y, c, d]); else out.push(w);
  });
  state.wires = out;
}
export function splitAll() {
  state.wires.flatMap(w => [[w[0], w[1]], [w[2], w[3]]]).forEach(([x, y]) => splitAt(x, y));
}

// បន្ថែមខ្សែ polyline ថ្មីតាមចំណុច P
export function addPolyline(P) {
  const pts = P
    .map(([x, y]) => [Math.round(x * 2) / 2, Math.round(y * 2) / 2])
    .filter((p, i, arr) => i === 0 || p[0] !== arr[i - 1][0] || p[1] !== arr[i - 1][1]);
  if (pts.length < 2) return;
  const occ = new Set(state.els.flatMap(tp).map(p => p[0] + ',' + p[1]));
  state.wires.forEach(w => { occ.add(w[0] + ',' + w[1]); occ.add(w[2] + ',' + w[3]); });
  const seg = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (a[0] === b[0] || a[1] === b[1]) { seg.push([a[0], a[1], b[0], b[1]]); continue; }
    const c1 = [b[0], a[1]], c2 = [a[0], b[1]];
    const c = occ.has(c1 + '') && !occ.has(c2 + '') ? c2 : c1;
    occ.add(c + '');
    seg.push([a[0], a[1], c[0], c[1]], [c[0], c[1], b[0], b[1]]);
  }
  seg.forEach(w => state.wires.push(w));
  const f = pts[0], l = pts[pts.length - 1];
  splitAt(f[0], f[1]); splitAt(l[0], l[1]);
  state.selW = -1;
}
export function addWire(a, b) { addPolyline([a, b]); }

// ជើងឧបករណ៍មានខ្សែភ្ជាប់ជានិច្ច
export function follow(e, fn) {
  const old = tp(e), refs = [];
  state.wires.forEach((w, i) => old.forEach((q, k) => {
    if (w[0] == q[0] && w[1] == q[1]) refs.push([i, 0, k]);
    if (w[2] == q[0] && w[3] == q[1]) refs.push([i, 2, k]);
  }));
  fn();
  const nw = tp(e);
  refs.forEach(([i, o, k]) => { state.wires[i][o] = nw[k][0]; state.wires[i][o + 1] = nw[k][1]; });
}

// ប្តូរខ្សែទ្រេតជាកែង 90° (L-shape)
export function fixWires() {
  const o = [];
  state.wires.forEach(w => {
    if (w[0] == w[2] && w[1] == w[3]) return;
    if (w[0] != w[2] && w[1] != w[3]) o.push([w[0], w[1], w[2], w[1]], [w[2], w[1], w[2], w[3]]);
    else o.push(w);
  });
  state.wires = o; state.selW = -1;
}

// តម្រឹមសៀគ្វីទាំងមូលឱ្យចំកណ្ដាលអេក្រង់
export function fitScreen() {
  const svg = Q('#cv');
  if (!state.els.length) {
    state.v = { x: -20, y: -20, k: 1 };
    draw();
    return;
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  state.els.forEach(e => {
    minX = Math.min(minX, (e.x - 1) * G);
    minY = Math.min(minY, (e.y - 2) * G);
    maxX = Math.max(maxX, (e.x + 4) * G);
    maxY = Math.max(maxY, (e.y + 4) * G);
  });
  const r = svg.getBoundingClientRect();
  const k = Math.min(1.4, Math.max(0.4, Math.min((r.width || 800) / (maxX - minX + 60), (r.height || 600) / (maxY - minY + 80))));
  state.v.k = k;
  state.v.x = (minX + maxX) / 2 - ((r.width || 800) / k) / 2;
  state.v.y = (minY + maxY) / 2 - ((r.height || 600) / k) / 2;
  draw();
}
