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

  // ២. តភ្ជាប់តាមជើងកុងតាក់/ប្រេកគ័រ/រ៉េឡេដែលបានបិទ និងព្រួញបញ្ជូន-ទទួលចរន្ត (Arrow Links)
  state.els.forEach(e => {
    if (e.type && e.type.toLowerCase().includes('powersupply')) return;
    const d = D[e.type];
    const T = tp(e);
    if (!d) return;

    // ព្រួញបញ្ជូន និងទទួលចរន្តដែលមាន Tag ដូចគ្នា (ឧ. -X1 ទៅ -X1)
    if (d.link && e.tag && T[0]) {
      const tagKey = 'link:' + e.tag.trim();
      add(T[0][0] + ',' + T[0][1], tagKey);
    }

    if (!d.p || !d.p.length) return;
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

  // ៥. ពិនិត្យបន្ទុក (Load: បូប៊ីន, ចង្កៀង, ម៉ូទ័រគ្រប់ប្រភេទ និងម៉ាស៊ីនភ្លើង)
  const getPh = pt => pt ? ['L1', 'L2', 'L3'].find(x => nm(pt[0] + ',' + pt[1]).has(x)) : null;

  const en = e => {
    if (e.type === 'ic_generator3ph') {
      return genRunning.has(e.id) && !short ? { on: true, dir: 1 } : false;
    }
    const d = D[e.type], T = tp(e);
    if (!d || !d.ld || short || T.length < 2) return false;

    // បន្ទុក 1 ហ្វាស / DC (បូប៊ីន, ចង្កៀង, ម៉ូទ័រ 1 ហ្វាស, ម៉ូទ័រ DC)
    if (d.ld == 1) {
      const a = nm(T[0][0] + ',' + T[0][1]), b = nm(T[1][0] + ',' + T[1][1]);
      if (!a.size || !b.size) return false;
      for (const x of a) {
        for (const y of b) {
          if (x != y && x != 'PE' && y != 'PE') {
            const dir = (e.type === 'ic_motorDC' && x === 'M' && y === 'P') ? -1 : 1;
            return { on: true, dir };
          }
        }
      }
      return false;
    }

    // ម៉ូទ័រផ្កាយ-ត្រីកោណ 6 ជើង (U1, V1, W1, W2, U2, V2)
    if (e.type === 'ic_motorStarDelta' && T.length >= 6) {
      const topPh = [getPh(T[0]), getPh(T[1]), getPh(T[2])];
      if (new Set(topPh.filter(Boolean)).size < 3) return false;
      const idx = topPh.map(x => ['L1', 'L2', 'L3'].indexOf(x));
      const dir = ((idx[1] - idx[0] + 3) % 3 == 1) ? 1 : -1;

      // ពិនិត្យការតបែបផ្កាយ (Star): ជើងក្រោមទាំង ៣ (T[3], T[4], T[5]) ត្រូវបានភ្ជាប់ចូលគ្នា
      const k3 = T[3][0] + ',' + T[3][1];
      const k4 = T[4][0] + ',' + T[4][1];
      const k5 = T[5][0] + ',' + T[5][1];
      const vis = new Set([k3]);
      const q = [k3];
      while (q.length) {
        const u = q.shift();
        (adj.get(u) || []).forEach(v => { if (!vis.has(v)) { vis.add(v); q.push(v); } });
      }
      const isStar = vis.has(k4) && vis.has(k5);

      // ពិនិត្យការតបែបត្រីកោណ (Delta): ជើងក្រោមទាំង ៣ មានហ្វាសខុសពីជើងលើរៀងៗខ្លួន (U1!=W2, V1!=U2, W1!=V2)
      const botPh = [getPh(T[3]), getPh(T[4]), getPh(T[5])];
      const isDelta = new Set(botPh.filter(Boolean)).size === 3 &&
                      botPh[0] !== topPh[0] && botPh[1] !== topPh[1] && botPh[2] !== topPh[2];

      if (isStar) return { on: true, dir, spd: 1 };
      if (isDelta) return { on: true, dir, spd: 2 };
      return false;
    }

    // ម៉ូទ័រ 2 ល្បឿន 6 ជើង (Dahlander / Two Speeds)
    if ((e.type === 'ic_motorDhalander' || e.type === 'ic_motorTwoSpeeds') && T.length >= 6) {
      const p1 = [getPh(T[0]), getPh(T[1]), getPh(T[2])];
      const p2 = [getPh(T[3]), getPh(T[4]), getPh(T[5])];
      if (new Set(p2.filter(Boolean)).size === 3) {
        const idx = p2.map(x => ['L1', 'L2', 'L3'].indexOf(x));
        const dir = ((idx[1] - idx[0] + 3) % 3 == 1) ? 1 : -1;
        return { on: true, dir, spd: 2 };
      }
      if (new Set(p1.filter(Boolean)).size === 3) {
        const idx = p1.map(x => ['L1', 'L2', 'L3'].indexOf(x));
        const dir = ((idx[1] - idx[0] + 3) % 3 == 1) ? 1 : -1;
        return { on: true, dir, spd: 1 };
      }
      return false;
    }

    // ម៉ូទ័រ 3 ហ្វាសធម្មតា (3 ជើង U, V, W)
    const ph = T.slice(0, 3).map(getPh);
    if (new Set(ph.filter(Boolean)).size < 3) return false;
    const idx = ph.map(x => ['L1', 'L2', 'L3'].indexOf(x));
    const dir = ((idx[1] - idx[0] + 3) % 3 == 1) ? 1 : -1;
    return { on: true, dir };
  };

  // ៦. គណនាស្ថានភាពបូប៊ីន (Coil, Timer, Flasher, Latch) និងរ៉េឡេការពារបាត់ហ្វាស
  const next = {};
  if (!state.latchPrev) state.latchPrev = {};

  state.els.forEach(e => {
    const d = D[e.type];
    if (!d || !e.tag) return;

    // រ៉េឡេការពារបាត់ហ្វាស (Phase Failure Relay): ពិនិត្យ 3 ជើងលើ (L1, L2, L3)
    if (e.type === 'ic_phaseFailure') {
      const T = tp(e);
      if (!short && T.length >= 3) {
        const ph = T.slice(0, 3).map(getPh);
        if (new Set(ph.filter(Boolean)).size === 3) {
          next[e.tag] = 1;
        }
      }
      return;
    }

    if (d.k != 'C') return;
    const r = en(e);
    const on = !!(r && r.on);

    if (e.type === 'ic_coilLatch') {
      // Impulse Latch Relay: ប្តូរស្ថានភាពរាល់ពេលមានភ្លើងចូលថ្មី (Rising Edge)
      const prev = !!state.latchPrev[e.id];
      const curState = !!state.out[e.tag];
      if (on && !prev) {
        if (!curState) next[e.tag] = 1;
      } else if (curState) {
        next[e.tag] = 1;
      }
      state.latchPrev[e.id] = on;
    } else if (!d.tm) {
      if (on) next[e.tag] = 1;
    } else if (d.tm == 1) {
      // ON-Delay (TON)
      if (on && (state.acc[e.id] || 0) >= e.sec) next[e.tag] = 1;
      else if (!on) state.acc[e.id] = 0;
    } else if (d.tm == 2) {
      // OFF-Delay (TOF)
      if (on) { state.acc[e.id] = e.sec; next[e.tag] = 1; }
      else if ((state.acc[e.id] || 0) > 0) next[e.tag] = 1;
    } else if (d.tm == 3) {
      // ON-OFF Delay: ពន្យារពេលទាំងពេលបើក និងពេលបិទ
      const cur = !!state.out[e.tag];
      if (on) {
        if (cur || (state.acc[e.id] || 0) >= e.sec) {
          state.acc[e.id] = e.sec;
          next[e.tag] = 1;
        }
      } else {
        if (cur && (state.acc[e.id] || 0) > 0) next[e.tag] = 1;
        else state.acc[e.id] = 0;
      }
    } else if (d.tm == 4) {
      // Flasher Relay: ភ្លឹបភ្លែតឆ្លាស់គ្នាតាមរយៈពេល e.sec
      if (on) {
        const period = Math.max(0.2, Number(e.sec) || 1);
        const phaseOn = ((state.acc[e.id] || 0) % (period * 2)) < period;
        if (phaseOn) next[e.tag] = 1;
      } else {
        state.acc[e.id] = 0;
      }
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
      if (d.tm == 3) {
        if (on) state.acc[e.id] = Math.min(e.sec, (state.acc[e.id] || 0) + dt);
        else if ((state.acc[e.id] || 0) > 0) state.acc[e.id] = Math.max(0, state.acc[e.id] - dt);
      }
      if (d.tm == 4 && on) state.acc[e.id] = (state.acc[e.id] || 0) + dt;
    });
  }

  state.flowT = (state.flowT || 0) + dt;

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