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
    const id = E.length; E.push({ a, b, w });
    [a, b].forEach(k => { if (!adj.has(k)) adj.set(k, []); adj.get(k).push(id); });
  };
  state.wires.forEach((w, i) => add(key([w[0], w[1]]), key([w[2], w[3]]), i));
  state.els.forEach(e => {
    const d = D[e.type];
    if (!d) return;
    const t = tp(e).map(key);
    if (d.n && t[0]) { req.add(t[0]); srcs.push(t[0]); }
    if (d.multiSrc) d.multiSrc.forEach((ph, i) => { if (ph && t[i]) { req.add(t[i]); srcs.push(t[i]); } });
    const pairs = d.pairs ? d.pairs(e) : (d.p && d.c ? d.p.filter((_, idx) => d.c(e, idx)) : []);
    pairs.forEach(([a, b]) => { if (t[a] && t[b]) add(t[a], t[b], -1); });                         // កុងតាក់ដែលបិទ
    if (d.link && e.tag && t[0]) add(t[0], 'link:' + e.tag.trim(), -1);                               // ព្រួញបញ្ជូន-ទទួលចរន្ត
    if (d.ld && live.en(e)) t.forEach(k => { if (k && live.nm(k).size > 0) req.add(k); });           // បន្ទុកដែលមានចរន្តពិត
  });
  // កាត់មែកទាល់ចោល (ចុង ១ ដែលមិនមែនប្រភព/បន្ទុកដំណើរការ)
  const alive = E.map(() => true), deg = new Map();
  adj.forEach((ids, k) => deg.set(k, ids.length));
  const q = [...deg.keys()].filter(k => deg.get(k) === 1 && !req.has(k));
  while (q.length) {
    const k = q.pop();
    if (deg.get(k) !== 1 || req.has(k)) continue;
    const id = adj.get(k).find(i => alive[i]); if (id === undefined) continue;
    alive[id] = false; deg.set(k, 0);
    const o = E[id].a === k ? E[id].b : E[id].a; deg.set(o, deg.get(o) - 1);
    if (deg.get(o) === 1 && !req.has(o)) q.push(o);
  }
  // ចម្ងាយពីប្រភព (BFS លើផ្លូវដែលនៅសល់)
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
  E.forEach((x, id) => { if (alive[id] && x.w >= 0 && live.nm(x.a).size > 0) carry.add(x.w); });
  const ret = k => { const n = live.nm(k); return n.has('N') || n.has('M') || n.has('PE'); };    // ខ្សែត្រឡប់
  return { carry, dist, ret };
}

// ទិសរត់នៃ polyline (pts ជាក្រឡា): +1 = ពីចំណុចដំបូងទៅចុង, -1 = ផ្ទុយ, 0 = គ្មានចរន្ត
export function polyDir(flow, pl) {
  if (!flow || !pl.idx.some(i => flow.carry.has(i))) return 0;
  const k0 = key(pl.pts[0]), k1 = key(pl.pts[pl.pts.length - 1]), a = flow.dist.get(k0), b = flow.dist.get(k1);
  if (a === undefined || b === undefined || a === b) return flow.ret(k0) ? -1 : 1;
  return (a < b ? 1 : -1) * (flow.ret(k0) ? -1 : 1);
}