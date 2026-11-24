/* ==========================================================================
   ឯកសារ៖ js/wiring.js
   តួនាទី៖ តក្កវិជ្ជាខ្សែភ្លើង (ទាំងអស់ជាអនុគមន៍សុទ្ធ មិនប៉ះ DOM)
   - dragSegment : ទាញកំណាត់ខ្សែមួយទៅចំហៀង (កំណាត់ជាប់គ្នាលាត/បន្ទោរ ឬបង្កើតកែង ១ជំហាន)
   - rerouteMoved: ពេលឧបករណ៍រំកិល/បង្វិល ខ្សែដែលជាប់ជើងត្រូវតាម ដោយរក្សាមុំ 90° (រាង L/Z)
   - netSig      : ស្នាមមេដៃនៃការតភ្ជាប់ជើង ដើម្បីបដិសេធការទាញដែលបំបែក/ភ្ជាប់ខុសសៀគ្វី
   ទម្រង់ខ្សែ៖ [x1,y1,x2,y2] ជាខ្នាតក្រឡា; តភ្ជាប់គ្នាពេលចុងត្រូវគ្នា (solver ប្រើច្បាប់នេះ)
   ========================================================================== */
const key = (x, y) => x + ',' + y;
const same = (a, b) => (a[0] == b[0] && a[1] == b[1] && a[2] == b[2] && a[3] == b[3]) ||
                       (a[0] == b[2] && a[1] == b[3] && a[2] == b[0] && a[3] == b[1]);

// លុបខ្សែប្រវែងសូន្យ និងខ្សែស្ទួន; ត្រឡប់ index ថ្មីរបស់ selObj
function clean(ws, selObj) {
  const out = [];
  let sel = -1;
  ws.forEach(w => {
    if (w[0] == w[2] && w[1] == w[3]) return;
    const dup = out.findIndex(o => same(o, w));
    if (dup >= 0) { if (w === selObj) sel = dup; return; }
    if (w === selObj) sel = out.length;
    out.push(w);
  });
  return { wires: out, sel };
}
export const cleanWires = ws => clean(ws, null).wires;

// ស្នាមមេដៃការតភ្ជាប់៖ ក្រុមចំណុចជើង (terms) ដែលភ្ជាប់គ្នាតាមខ្សែ
export function netSig(wires, terms) {
  const p = new Map();
  const f = a => { if (!p.has(a)) p.set(a, a); const r = p.get(a); if (r === a) return a; const rr = f(r); p.set(a, rr); return rr; };
  wires.forEach(w => { const a = f(key(w[0], w[1])), b = f(key(w[2], w[3])); if (a !== b) p.set(a, b); });
  const g = {};
  terms.forEach(([x, y]) => { const k = key(x, y); (g[f(k)] ??= []).push(k); });
  return Object.values(g).map(a => [...new Set(a)].sort().join('|')).filter(s => s.includes('|')).sort().join(';');
}

// ទាញកំណាត់ខ្សែ i ទៅចំហៀង d ក្រឡា (កែងនឹងទិសរបស់វា)
export function dragSegment(snap, i, d, terms) {
  const w = snap[i], horiz = w[1] == w[3], T = new Set(terms.map(p => key(p[0], p[1])));
  const mv = ([x, y]) => horiz ? [x, y + d] : [x + d, y];
  const out = snap.map(s => [...s]), extra = [];
  [[w[0], w[1]], [w[2], w[3]]].forEach(p => {
    const np = mv(p), nb = [];
    snap.forEach((s, j) => {
      if (j == i) return;
      if (s[0] == p[0] && s[1] == p[1]) nb.push([j, 0]);
      if (s[2] == p[0] && s[3] == p[1]) nb.push([j, 2]);
    });
    const perp = ([j]) => (snap[j][1] == snap[j][3]) !== horiz;
    if (!T.has(key(p[0], p[1])) && nb.every(perp)) nb.forEach(([j, o]) => { out[j][o] = np[0]; out[j][o + 1] = np[1]; }); // កំណាត់កែង៖ លាត/បន្ទោរតាម
    else extra.push([p[0], p[1], np[0], np[1]]); // ជើង ឬខ្សែត្រង់ជាប់គ្នា៖ ទុកចុងចាស់ ហើយបង្កើតកែង ១ជំហាន
  });
  out[i] = [...mv([w[0], w[1]]), ...mv([w[2], w[3]])];
  return clean(out.concat(extra), out[i]);
}

// ផ្លូវកែង B → A' (រាង Z) ចាប់ពីចុងថេរ B ទៅចុងថ្មី A'; vertical = ខ្សែដើមឈរ
// occ = សំណុំចំណុចដែលមានរួចហើយ (ជើង/ចុងខ្សែ) ដើម្បីកុំឱ្យជ្រុងថ្មីជាន់ចំហើយភ្ជាប់ខុសសៀគ្វី
// ជ្រើសជួរកណ្ដាលនៅចន្លោះ B..A' ជាមុន (មិនចេញក្រៅ → មិនកើតរង្វិល U) ចេញក្រៅបានតែករណីចាំបាច់
function zroute(B, A, vertical, occ) {
  if (B[0] == A[0] || B[1] == A[1]) return [[B[0], B[1], A[0], A[1]]];
  const free = (x, y) => !occ || !occ.has(key(x, y));
  const pick = (mid, lo, hi, ok) => {
    const cand = []; for (let v = lo; v <= hi; v++) cand.push(v);
    cand.sort((p, q) => Math.abs(p - mid) - Math.abs(q - mid));
    for (const v of cand) if (ok(v)) return v;
    for (const v of [lo - 1, hi + 1, lo - 2, hi + 2]) if (ok(v)) return v;
    return mid;
  };
  if (vertical) {
    const my = pick(Math.round((B[1] + A[1]) / 2), Math.min(B[1], A[1]), Math.max(B[1], A[1]), y => free(B[0], y) && free(A[0], y));
    return [[B[0], B[1], B[0], my], [B[0], my, A[0], my], [A[0], my, A[0], A[1]]];
  }
  const mx = pick(Math.round((B[0] + A[0]) / 2), Math.min(B[0], A[0]), Math.max(B[0], A[0]), x => free(x, B[1]) && free(x, A[1]));
  return [[B[0], B[1], mx, B[1]], [mx, B[1], mx, A[1]], [mx, A[1], A[0], A[1]]];
}
const lshape = (a, b) => [[a[0], a[1], b[0], a[1]], [b[0], a[1], b[0], b[1]]];

// លុបចំណុចស្ទួន និងចំណុចកណ្ដាលដែលត្រង់/ត្រឡប់ក្រោយ (ធ្វើឱ្យខ្សែខ្លីបំផុត ដោយរក្សាចុងទាំងពីរ)
function tidy(pts) {
  const m = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const b = pts[i], a = m[m.length - 1];
    if (a[0] == b[0] && a[1] == b[1]) continue;
    if (m.length >= 2) {
      const p = m[m.length - 2];
      if ((a[0] - p[0]) * (b[1] - a[1]) - (a[1] - p[1]) * (b[0] - a[0]) === 0) m.pop();
    }
    m.push(b);
  }
  return m;
}

// រំកិលចុង pts[0] ទៅ A៖ ជ្រុងទី១ (P1) រំកិលតាម ដូច្នេះកំណាត់ដើមលាត/បន្ទោរ មិនបង្កើតកំណាត់ថ្មី។
// បើខ្សែមានកំណាត់តែមួយ (ចុងម្ខាងថេរ) ទើបប្រើផ្លូវ Z
function moveEnd(pts, A, used) {
  const P0 = pts[0], P1 = pts[1];
  if (pts.length == 2) {
    const z = zroute(P1, A, P0[0] == P1[0], used), path = [[z[0][0], z[0][1]]];
    z.forEach(sg => path.push([sg[2], sg[3]]));
    return path.reverse();
  }
  const dx = A[0] - P0[0], dy = A[1] - P0[1];
  const n1 = P0[0] == P1[0] ? [P1[0] + dx, P1[1]] : [P1[0], P1[1] + dy];
  return [[A[0], A[1]], n1, ...pts.slice(2)];
}

// snap = ខ្សែមុនរំកិល; oldT/newT = ជើងឧបករណ៍មុន/ក្រោយ; termKeys = ជើងទាំងអស់មុនរំកិល (ដើម្បីដឹងថាខ្សែមួយចប់នៅឯណា)
// ធ្វើការលើ polyline ទាំងមូល៖ ចំនួនកំណាត់មិនកើនឡើងពេលអូសឧបករណ៍ទៅឆ្វេងស្តាំច្រើនដង
export function rerouteMoved(snap, oldT, newT, occ, termKeys) {
  const mp = new Map();
  oldT.forEach((p, k) => mp.set(key(p[0], p[1]), newT[k]));
  const tk = termKeys || new Set(oldT.map(p => key(p[0], p[1])));
  const used = occ ? new Set(occ) : null, out = [];
  buildPolylines(snap, tk).forEach(ch => {
    const first = ch.pts[0], last = ch.pts[ch.pts.length - 1];
    const a = mp.get(key(first[0], first[1])), b = mp.get(key(last[0], last[1]));
    if (!a && !b) { ch.idx.forEach(i => out.push([...snap[i]])); return; }
    let pts = ch.pts.map(p => [...p]);
    if (a && b && pts.length == 2) pts = (a[0] - first[0] == b[0] - last[0] && a[1] - first[1] == b[1] - last[1]) ? [a, b] : [a, [b[0], a[1]], b];
    else {
      if (a) pts = moveEnd(pts, a, used);
      if (b) pts = moveEnd(pts.slice().reverse(), b, used).reverse();
    }
    pts = tidy(pts);
    for (let i = 0; i < pts.length - 1; i++) {
      out.push([pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]]);
      if (used) { used.add(key(pts[i][0], pts[i][1])); used.add(key(pts[i + 1][0], pts[i + 1][1])); }
    }
  });
  return out;
}

// សំណុំចំណុចដែលជ្រុងខ្សែថ្មីមិនគួរជាន់៖ ជើងឧបករណ៍ទាំងអស់ + ចុងខ្សែទាំងអស់
export function occupied(terms, wires) {
  const o = new Set(terms.map(p => key(p[0], p[1])));
  wires.forEach(w => { o.add(key(w[0], w[1])); o.add(key(w[2], w[3])); });
  return o;
}

// ស្នាមមេដៃការតភ្ជាប់តាមអត្តសញ្ញាណជើង (id:index) — មិនប្រែពេលឧបករណ៍រំកិលដរាបណាការតភ្ជាប់នៅដដែល
export function termSig(wires, els, tp) {
  const p = new Map();
  const f = a => { if (!p.has(a)) p.set(a, a); const r = p.get(a); if (r === a) return a; const rr = f(r); p.set(a, rr); return rr; };
  wires.forEach(w => { const a = f(key(w[0], w[1])), b = f(key(w[2], w[3])); if (a !== b) p.set(a, b); });
  const g = {};
  els.forEach(e => tp(e).forEach((q, k) => { (g[f(key(q[0], q[1]))] ??= []).push(e.id + ':' + k); }));
  return Object.values(g).filter(a => a.length > 1).map(a => a.sort().join('|')).sort().join(';');
}

// ចាប់ផ្តើមរំកិល/បង្វិលឧបករណ៍ e (ហៅមុនកែ e)
export function startMove(wires, e, els, tp) {
  return { snap: wires.map(w => [...w]), old: tp(e).map(p => [...p]), sig: termSig(wires, els, tp), lx: e.x, ly: e.y, tk: new Set(els.flatMap(tp).map(p => key(p[0], p[1]))) };
}

// ព្យាយាមដាក់ e ទៅ (nx,ny) (និង e.r បច្ចុប្បន្ន)។ ត្រឡប់ខ្សែថ្មី ឬ null បើទីតាំងនោះនឹងភ្ជាប់/បំបែកសៀគ្វីខុស
// (ឧ. ជើងទម្លាក់ចំចុងខ្សែផ្សេង ធ្វើឱ្យឆ្លងភ្លើង) — ក្នុងករណី null ឧបករណ៍ត្រឡប់ទៅទីតាំងត្រឹមត្រូវចុងក្រោយ
export function planMove(md, e, nx, ny, els, tp) {
  e.x = nx; e.y = ny;
  const cand = cleanWires(rerouteMoved(md.snap, md.old, tp(e), occupied(els.flatMap(tp), md.snap), md.tk));
  if (termSig(cand, els, tp) !== md.sig) { e.x = md.lx; e.y = md.ly; return null; }
  md.lx = nx; md.ly = ny;
  return cand;
}

// រកទីតាំងទំនេរជិតបំផុត ដែលជើងរបស់ឧបករណ៍ថ្មី មិនជាន់ជើង/ចុងខ្សែដែលមានរួចហើយ
export function freeSpot(proto, els, wires, tp) {
  const occ = occupied(els.flatMap(tp), wires);
  for (let r = 0; r < 14; r++)
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) != r) continue;
      const c = { ...proto, x: proto.x + dx, y: proto.y + dy };
      if (!tp(c).some(p => occ.has(key(p[0], p[1])))) return [c.x, c.y];
    }
  return [proto.x, proto.y];
}

/* ==========================================================================
   Polyline: ខ្សែភ្ជាប់ជាប់គ្នា (មិនដាច់ជាកំណាត់) + ដៃលោតពេលខ្សែកាត់គ្នា + បន្ទាត់ណែនាំតម្រឹម
   ទិន្នន័យនៅរក្សាជាកំណាត់ (solver ដដែល) ប៉ុន្តែការបង្ហាញ/ជ្រើសគិតជា polyline មួយ
   ========================================================================== */

// ភ្ជាប់កំណាត់ខ្សែដែលជួបគ្នាត្រង់ចំណុចធម្មតា (ចុង ២ មិនមែនជើង/ប្រសព្វ T) ជា polyline តែមួយ
export function buildPolylines(wires, termKeys) {
  const at = new Map();
  wires.forEach((w, i) => [0, 2].forEach(o => { const k = key(w[o], w[o + 1]); if (!at.has(k)) at.set(k, []); at.get(k).push([i, o]); }));
  const through = k => at.get(k).length == 2 && !termKeys.has(k);
  const used = new Array(wires.length).fill(false), out = [];
  wires.forEach((w, i0) => {
    if (used[i0]) return;
    used[i0] = true;
    const pts = [[w[0], w[1]], [w[2], w[3]]], idx = [i0], ord = [i0];
    const extend = tail => {
      for (;;) {
        const p = tail ? pts[pts.length - 1] : pts[0], k = key(p[0], p[1]);
        if (!through(k)) break;
        const nb = at.get(k).find(([j]) => !used[j]);
        if (!nb) break;
        const [j, o] = nb; used[j] = true; idx.push(j); tail ? ord.push(j) : ord.unshift(j);
        const q = [wires[j][2 - o], wires[j][3 - o]];
        tail ? pts.push(q) : pts.unshift(q);
      }
    };
    extend(true); extend(false);
    const m = [pts[0]];                       // លុបចំណុចកណ្ដាលដែលត្រង់ជាមួយគ្នា
    for (let i = 1; i < pts.length - 1; i++) {
      const a = m[m.length - 1], b = pts[i], c = pts[i + 1];
      const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      const dot = (b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1]);
      if (cross === 0 && dot > 0) continue;
      m.push(b);
    }
    m.push(pts[pts.length - 1]);
    out.push({ pts: m, idx, ord });
  });
  return out;
}

// ចំណុចដែលខ្សែផ្ដេកត្រូវលោតពីលើខ្សែឈរ៖ កាត់គ្នាត្រង់កណ្ដាលទាំងពីរ ហើយមិនមានចុងខ្សែ/ជើងនៅទីនោះ (មិនភ្ជាប់)
export function makeHops(wires, termKeys) {
  const nodes = new Set();
  wires.forEach(w => { nodes.add(key(w[0], w[1])); nodes.add(key(w[2], w[3])); });
  const V = wires.filter(w => w[0] == w[2] && w[1] != w[3]);
  return (y, xa, xb) => {
    const lo = Math.min(xa, xb), hi = Math.max(xa, xb), xs = [];
    V.forEach(v => {
      const x = v[0];
      if (x > lo && x < hi && y > Math.min(v[1], v[3]) && y < Math.max(v[1], v[3]) && !nodes.has(key(x, y)) && !termKeys.has(key(x, y))) xs.push(x);
    });
    return [...new Set(xs)].sort((a, b) => a - b);
  };
}

// path SVG របស់ polyline៖ ជ្រុងកែងមូល (R) + ដៃលោតពាក់កណ្ដាលរង្វង់ (HR) នៅចំណុចកាត់
export function polyPath(pts, hops, G = 20, R = 6, HR = 6) {
  const P = pts.map(p => [p[0] * G, p[1] * G]), n = P.length - 1;
  let d = `M${P[0][0]} ${P[0][1]}`;
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!len) continue;
    const ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len, re = i < n - 1 ? Math.min(R, len / 2) : 0;
    if (uy === 0) {
      const xs = hops(pts[i][1], pts[i][0], pts[i + 1][0]).map(x => x * G);
      if (ux < 0) xs.reverse();
      xs.forEach(cx => { d += ` L${cx - ux * HR} ${a[1]} A${HR} ${HR} 0 0 ${ux > 0 ? 1 : 0} ${cx + ux * HR} ${a[1]}`; });
    }
    d += ` L${b[0] - ux * re} ${b[1] - uy * re}`;
    if (re) {
      const c = P[i + 2], l2 = Math.hypot(c[0] - b[0], c[1] - b[1]) || 1, r2 = Math.min(R, l2 / 2);
      d += ` Q${b[0]} ${b[1]} ${b[0] + (c[0] - b[0]) / l2 * r2} ${b[1] + (c[1] - b[1]) / l2 * r2}`;
    }
  }
  return d;
}

// បន្ទាត់ណែនាំពេលអូសឧបករណ៍៖ បន្ទាត់ឈរ/ផ្ដេកកាត់ជើងនីមួយៗ; hit = មានជើងឧបករណ៍ផ្សេងត្រូវគ្នា (តម្រឹមហើយ)
export function guidesFor(e, els, tp) {
  const others = els.filter(o => o !== e).flatMap(tp);
  const xs = new Set(others.map(p => p[0])), ys = new Set(others.map(p => p[1]));
  const g = [], sx = new Set(), sy = new Set();
  tp(e).forEach(([x, y]) => {
    if (!sx.has(x)) { sx.add(x); g.push({ k: 'v', v: x, hit: xs.has(x) }); }
    if (!sy.has(y)) { sy.add(y); g.push({ k: 'h', v: y, hit: ys.has(y) }); }
  });
  return g;
}

// "ខ្សែ" មួយ = polyline ទាំងមូល (កំណាត់ទាំងអស់ដែលជាប់គ្នាតាមចំណុចធម្មតា រហូតដល់ជើង/ចំណុចប្រសព្វ T)
export const chainOf = (wires, termKeys, i) => (buildPolylines(wires, termKeys).find(p => p.idx.includes(i)) || { idx: [i] }).idx;

// បញ្ចូលកំណាត់បំបែកដែលត្រង់ជាមួយគ្នា (leg មួយ) ទៅជាកំណាត់តែមួយ មុនទាញ ដើម្បីកុំឱ្យទាញបានតែបំណែក ហើយបែកជាកែងតូចៗ
export function mergeLeg(wires, termKeys, i) {
  const pl = buildPolylines(wires, termKeys).find(p => p.idx.includes(i));
  if (!pl) return { wires, i };
  const ord = pl.ord, at = ord.indexOf(i), horiz = wires[i][1] == wires[i][3];
  const same = j => (wires[j][1] == wires[j][3]) === horiz && (horiz ? wires[j][1] == wires[i][1] : wires[j][0] == wires[i][0]);
  let a = at, b = at;
  while (a > 0 && same(ord[a - 1])) a--;
  while (b < ord.length - 1 && same(ord[b + 1])) b++;
  if (a == b) return { wires, i };
  const grp = ord.slice(a, b + 1), xs = grp.flatMap(j => [wires[j][0], wires[j][2]]), ys = grp.flatMap(j => [wires[j][1], wires[j][3]]);
  const merged = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const tot = grp.reduce((s, j) => s + Math.abs(wires[j][2] - wires[j][0]) + Math.abs(wires[j][3] - wires[j][1]), 0);
  if (tot !== (merged[2] - merged[0]) + (merged[3] - merged[1])) return { wires, i }; // មិនបន្តត្រង់ល្អ (ត្រឡប់ក្រោយ) → មិនបញ្ចូល
  const first = Math.min(...grp), out = [];
  let ni = -1;
  wires.forEach((w, j) => { if (j == first) { ni = out.length; out.push(merged); } else if (!grp.includes(j)) out.push(w); });
  return { wires: out, i: ni };
}
