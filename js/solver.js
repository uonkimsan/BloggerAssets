/* ==========================================================================
   ឯកសារ៖ js/solver.js
   តួនាទី៖ ម៉ាស៊ីនគណនាចរន្តអគ្គិសនី សៀគ្វីខ្លី Timer បូប៊ីន ចង្កៀង ម៉ូទ័រ និងម៉ាស៊ីនភ្លើង
   ========================================================================== */
import { state, Q } from './state.js';
import { D, tp } from './components.js';
import { draw } from './renderer.js';

// គណនាចរន្តអគ្គិសនីក្នុងសៀគ្វីទាំងមូល
export function solve() {
  const adj = new Map();
  const add = (a, b) => {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push(b);
    adj.get(b).push(a);
  };

  // ១. តភ្ជាប់តាមខ្សែភ្លើង
  state.wires.forEach(([a, b, c, d]) => add(a + ',' + b, c + ',' + d));

  // ២. តភ្ជាប់តាមជើងកុងតាក់/ប្រេកគ័រ/រ៉េឡេដែលបានបិទ (លើកលែង Power Supply ដើម្បីកុំឱ្យ L1, L2, L3 ឆ្លងចូលគ្នា)
  state.els.forEach(e => {
    if (e.type && e.type.toLowerCase().includes('powersupply')) return;
    const d = D[e.type];
    const T = tp(e);
    if (!d || !d.p || !d.p.length) return;
    d.p.forEach(([i, j], pairIdx) => {
      if (T[i] && T[j] && d.c && d.c(e, pairIdx)) {
        add(T[i][0] + ',' + T[i][1], T[j][0] + ',' + T[j][1]);
      }
    });
  });

  // ៣. ចែកចាយប្រភពភ្លើង (L1, L2, L3, N, PE, P, M) តាមបណ្តាញខ្សែ (BFS)
  const net = new Map();
  const nm = k => net.get(k) || (net.set(k, new Set()), net.get(k));

  const flood = (startKey, sig) => {
    if (!startKey || !sig) return;
    const q = [startKey];
    nm(startKey).add(sig);
    while (q.length) {
      const u = q.shift();
      (adj.get(u) || []).forEach(v => {
        if (!nm(v).has(sig)) {
          nm(v).add(sig);
          q.push(v);
        }
      });
    }
  };

  // ចែកចាយប្រភពភ្លើងដើម (លើកលែង Output P/M របស់ Power Supply និង Generator រង់ចាំលក្ខខណ្ឌសិន)
  state.els.forEach(e => {
    const d = D[e.type];
    const T = tp(e);
    if (!d || !T.length) return;
    const isPs = e.type && e.type.toLowerCase().includes('powersupply');
    const isGen = e.type === 'ic_generator3ph';
    if (isGen) return;

    if (d.multiSrc) {
      T.forEach((pt, idx) => {
        const ph = d.multiSrc[idx];
        if (!ph || !pt) return;
        if (isPs && (ph === 'P' || ph === 'M')) return;
        flood(pt[0] + ',' + pt[1], ph);
      });
    } else if (d.n && T[0]) {
      flood(T[0][0] + ',' + T[0][1], d.n);
    }
  });

  // ម៉ាស៊ីនភ្លើង 3 ហ្វាស (Generator: OFF / ON / AUTO តាមជើង C1-C2)
  const genRunning = new Set();
  state.els.forEach(e => {
    if (e.type !== 'ic_generator3ph') return;
    const d = D[e.type];
    const T = tp(e);
    if (!d || !T.length) return;
    const mode = (state.genMode && state.genMode[e.id]) || 'OFF';
    let active = false;

    if (mode === 'ON') {
      active = true;
    } else if (mode === 'AUTO' && T[4] && T[5]) {
      const k1 = T[4][0] + ',' + T[4][1];
      const k2 = T[5][0] + ',' + T[5][1];
      // បញ្ចេញភ្លើងពណ៌លឿង (L1) ពីជើង C1 ទៅរង់ចាំត្រង់ជើងកុងតាក់ភ្លាមពេលចុច AUTO
      flood(k1, 'L1');
      if (nm(k2).has('L1')) {
        active = true;
      }
    }

    if (active) {
      genRunning.add(e.id);
      T.forEach((pt, idx) => {
        const ph = d.multiSrc && d.multiSrc[idx];
        if (ph && pt) flood(pt[0] + ',' + pt[1], ph);
      });
    }
  });

  // ពិនិត្យភ្លើង AC Input របស់ Power Supply (8P ឬ 4P) រួចបញ្ចេញ P (+) និង M (-) នៅជើង Output
  state.els.forEach(e => {
    if (!e.type || !e.type.toLowerCase().includes('powersupply')) return;
    const d = D[e.type];
    const T = tp(e);
    if (!d || !d.multiSrc || !T.length) return;

    const hasAcIn = T.some((pt, idx) => {
      if (!pt) return false;
      const ph = d.multiSrc[idx];
      if (ph === 'P' || ph === 'M' || ph === 'PE') return false;
      const s = nm(pt[0] + ',' + pt[1]);
      return [...s].some(x => ['L1', 'L2', 'L3', 'N'].includes(x));
    });

    if (hasAcIn) {
      T.forEach((pt, idx) => {
        const ph = d.multiSrc[idx];
        if ((ph === 'P' || ph === 'M') && pt) {
          flood(pt[0] + ',' + pt[1], ph);
        }
      });
    }
  });

  // ៤. ត្រួតពិនិត្យសៀគ្វីខ្លី (Short Circuit)
  let short = false;
  net.forEach(s => {
    const acPhases = ['L1', 'L2', 'L3'].filter(x => s.has(x));
    const hasN = s.has('N');
    const hasPE = s.has('PE');
    const hasP = s.has('P');
    const hasM = s.has('M');
    if (acPhases.length > 1 || ((acPhases.length >= 1 || hasN) && hasPE) || (hasP && hasM)) {
      short = true;
    }
  });

  // ៥. ពិនិត្យបន្ទុក (Load: បូប៊ីន, ចង្កៀង, ម៉ូទ័រ និងស្ថានភាពពណ៌ម៉ាស៊ីនភ្លើង)
  const en = e => {
    if (e.type === 'ic_generator3ph') {
      return genRunning.has(e.id) && !short ? { on: true, dir: 1 } : false;
    }
    const d = D[e.type], T = tp(e);
    if (!d || !d.ld || short || T.length < 2) return false;
    if (d.ld == 1) {
      const a = nm(T[0][0] + ',' + T[0][1]), b = nm(T[1][0] + ',' + T[1][1]);
      if (!a.size || !b.size) return false;
      for (const x of a) {
        for (const y of b) {
          if (x != y && x != 'PE' && y != 'PE') return { on: true, dir: 1 };
        }
      }
      return false;
    }
    const ph = T.slice(0, 3).map(p => ['L1', 'L2', 'L3'].find(x => nm(p[0] + ',' + p[1]).has(x)));
    if (new Set(ph.filter(Boolean)).size < 3) return false;
    const idx = ph.map(x => ['L1', 'L2', 'L3'].indexOf(x));
    const dir = ((idx[1] - idx[0] + 3) % 3 == 1) ? 1 : -1;
    return { on: true, dir };
  };

  // ៦. គណនាស្ថានភាពបូប៊ីន (Coil & Timer ទាំងអស់)
  const next = {};
  state.els.forEach(e => {
    const d = D[e.type];
    if (!d || d.k != 'C' || !e.tag) return;
    const r = en(e);
    const on = !!(r && r.on);
    if (!d.tm) {
      if (on) next[e.tag] = 1;
    } else if (d.tm == 1) {
      if (on && (state.acc[e.id] || 0) >= e.sec) next[e.tag] = 1;
      else if (!on) state.acc[e.id] = 0;
    } else if (d.tm == 2) {
      if (on) { state.acc[e.id] = e.sec; next[e.tag] = 1; }
      else if ((state.acc[e.id] || 0) > 0) next[e.tag] = 1;
    }
  });

  return { nm, short, en, next };
}

// ដំណើរការ Simulation រៀងរាល់ 50ms
export function tick() {
  const now = performance.now();
  const dt = state.last ? Math.min(0.2, (now - state.last) / 1000) : 0;
  state.last = now;

  if (state.live) {
    state.els.forEach(e => {
      const d = D[e.type];
      if (!d || !d.tm) return;
      const r = state.live.en(e);
      const on = !!(r && r.on);
      if (d.tm == 1 && on) state.acc[e.id] = Math.min(e.sec, (state.acc[e.id] || 0) + dt);
      if (d.tm == 2 && !on && (state.acc[e.id] || 0) > 0) state.acc[e.id] = Math.max(0, state.acc[e.id] - dt);
    });
  }

  let r;
  for (let i = 0; i < 6; i++) {
    r = solve();
    const k1 = Object.keys(r.next).sort().join();
    const k2 = Object.keys(state.out).sort().join();
    state.out = r.next;
    if (k1 == k2) break;
  }
  state.live = r;

  if (state.els.some(e => D[e.type] && D[e.type].ld && r.en(e) && !r.short)) {
    state.ang = (state.ang + dt * 360) % 360;
  }

  draw();
  stat();
}

// បង្ហាញសារជូនដំណឹងនៅជ្រុងខាងក្រោមឆ្វេង
export function stat(msg) {
  const s = Q('#st');
  if (!s) return;
  if (msg) { s.textContent = msg; s.className = ''; return; }
  if (state.live && state.live.short) { s.textContent = '⚠ ឆ្លងភ្លើង! (Short Circuit)'; s.className = 'err'; return; }
  if (state.sim) { s.textContent = '● កំពុងដំណើរការ — ចុចលើប៊ូតុង ឬកុងតាក់'; s.className = 'sim'; return; }
  s.textContent = 'រួចរាល់ — អូសពីជើងមួយទៅជើងមួយ ដើម្បីតភ្ជាប់ខ្សែ';
  s.className = '';
}