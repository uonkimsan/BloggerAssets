/* ==========================================================================
   ឯកសារ៖ js/flow.js
   តួនាទី៖ ចរន្តរត់តាមខ្សែ (Current flow) ពេល Simulation ដូច SimuListrik
   - ខ្សែដែលមានចរន្តពិត (នៅលើផ្លូវពីប្រភព → បន្ទុកដែលកំពុងដំណើរការ) → បន្ទាត់ដាច់ៗរត់ (dash animation)
   - ខ្សែដែលមានតែសក្តានុពល (មែកទាល់/ទៅកុងតាក់បើក) → បន្ទាត់ពណ៌ធម្មតា មិនរត់
   - វិធី៖ ក្រាហ្វខ្សែ + កុងតាក់បិទ → កាត់មែកទាល់ (leaf pruning) → ចំណុចដែលនៅសល់ជាផ្លូវចរន្ត
   - ទិស៖ ហ្វាស L/+ រត់ពីប្រភពទៅបន្ទុក; N/−/PE រត់ត្រឡប់ពីបន្ទុកទៅប្រភព
   ========================================================================== */
const key = p => p[0] + ',' + p[1];

export function computeFlow(state, D, tp) {
  const live = state.live;
  if (!live || live.short) return null;

  const E = [], adj = new Map(), req = new Set(), srcs = [];
  const add = (a, b, w) => {
    if (!a || !b || a === b) return;
    const id = E.length;
    E.push({ a, b, w });
    [a, b].forEach(k => {
      if (!adj.has(k)) adj.set(k, []);
      adj.get(k).push(id);
    });
  };

  // ១. បញ្ចូលខ្សែភ្លើងទាំងអស់ចូលក្នុងក្រាហ្វ
  state.wires.forEach((w, i) => add(key([w[0], w[1]]), key([w[2], w[3]]), i));

  // ២. បញ្ចូលប្រភពភ្លើង កុងតាក់បិទ និងបន្ទុកដែលកំពុងដំណើរការ
  state.els.forEach(e => {
    const d = D[e.type];
    if (!d) return;
    const t = tp(e).map(key);
    const tpLow = e.type.toLowerCase();
    const isPs = tpLow.includes('powersupply');
    const isGen = e.type === 'ic_generator3ph';

    // ក. ប្រភពភ្លើងដើម
    if (isGen) {
      const genOn = !!live.en(e);
      const mode = (state.genMode && state.genMode[e.id]) || 'OFF';
      t.forEach((pt, idx) => {
        const ph = d.multiSrc && d.multiSrc[idx];
        if (ph && genOn) { req.add(pt); srcs.push(pt); }
        else if (mode === 'AUTO' && idx === 4) { req.add(pt); srcs.push(pt); }
      });
    } else if (isPs && d.multiSrc) {
      const hasOut = t.some((pt, idx) => (d.multiSrc[idx] === 'P' || d.multiSrc[idx] === 'M') && live.nm(pt).size > 0);
      t.forEach((pt, idx) => {
        const ph = d.multiSrc[idx];
        if (ph === 'P' || ph === 'M') {
          if (hasOut) { req.add(pt); srcs.push(pt); }
        } else if (hasOut && live.nm(pt).size > 0) {
          req.add(pt); // ជើង AC Input របស់ Power Supply ក្លាយជាបន្ទុកពេល Output មានភ្លើង
        }
      });
    } else {
      if (d.n && t[0]) { req.add(t[0]); srcs.push(t[0]); }
      if (d.multiSrc) {
        d.multiSrc.forEach((ph, i) => {
          if (ph && t[i]) { req.add(t[i]); srcs.push(t[i]); }
        });
      }
    }

    // ខ. កុងតាក់ ប្រេកគ័រ និងកុងតាក់ទ័រដែលបានបិទ (គាំទ្រ pairIdx សម្រាប់ពហុជើង)
    if (!isPs && d.p && d.p.length && d.c) {
      d.p.forEach(([a, b], pairIdx) => {
        if (t[a] && t[b] && d.c(e, pairIdx)) add(t[a], t[b], -1);
      });
    }

    // គ. ព្រួញយោង (Source / Destination Arrow)
    if (d.link && t[0]) add(t[0], 'ln:' + e.tag, -1);

    // ឃ. បន្ទុកដែលកំពុងដំណើរការពិត (បូប៊ីន ចង្កៀង ម៉ូទ័រ)
    if (!isGen && d.ld && live.en(e)) {
      t.forEach(k => { if (k && live.nm(k).size > 0) req.add(k); });
    }
  });

  // ៣. កាត់មែកទាល់ចោល (Leaf pruning) ទុកតែផ្លូវដែលមានចរន្តឆ្លងកាត់ពិតប្រាកដ
  const alive = E.map(() => true), deg = new Map();
  adj.forEach((ids, k) => deg.set(k, ids.length));
  const q = [...deg.keys()].filter(k => deg.get(k) === 1 && !req.has(k));
  while (q.length) {
    const k = q.pop();
    if (deg.get(k) !== 1 || req.has(k)) continue;
    const id = adj.get(k).find(i => alive[i]);
    if (id === undefined) continue;
    alive[id] = false;
    deg.set(k, 0);
    const o = E[id].a === k ? E[id].b : E[id].a;
    deg.set(o, deg.get(o) - 1);
    if (deg.get(o) === 1 && !req.has(o)) q.push(o);
  }

  // ៤. គណនាចម្ងាយពីប្រភព (BFS) ដើម្បីរកទិសដៅចរន្តរត់
  const dist = new Map(), bq = [];
  srcs.forEach(k => { if (!dist.has(k)) { dist.set(k, 0); bq.push(k); } });
  for (let h = 0; h < bq.length; h++) {
    const k = bq[h];
    (adj.get(k) || []).forEach(id => {
      if (!alive[id]) return;
      const o = E[id].a === k ? E[id].b : E[id].a;
      if (!dist.has(o)) { dist.set(o, dist.get(k) + 1); bq.push(o); }
    });
  }

  const carry = new Set();
  E.forEach((x, id) => {
    if (alive[id] && x.w >= 0 && live.nm(x.a).size > 0) carry.add(x.w);
  });
  const ret = k => {
    const n = live.nm(k);
    return n.has('N') || n.has('M') || n.has('PE');
  };
  return { carry, dist, ret };
}

// ទិសរត់នៃ polyline (pts ជាក្រឡា): +1 = ពីចំណុចដំបូងទៅចុង, -1 = ផ្ទុយ, 0 = គ្មានចរន្ត
export function polyDir(flow, pl) {
  if (!flow || !pl.idx.some(i => flow.carry.has(i))) return 0;
  const k0 = key(pl.pts[0]), k1 = key(pl.pts[pl.pts.length - 1]);
  const a = flow.dist.get(k0), b = flow.dist.get(k1);
  if (a === undefined || b === undefined || a === b) return flow.ret(k0) ? -1 : 1;
  return (a < b ? 1 : -1) * (flow.ret(k0) ? -1 : 1);
}