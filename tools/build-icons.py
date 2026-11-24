#!/usr/bin/env python3
"""
tools/build-icons.py — បំប្លែង SVG នៃ assets/icons/*.svg (ទម្រង់ Simurelay: metadata nodes/contacts/frames)
ទៅជា js/icons.js (ទិន្នន័យ inline: ជើង, លេខជើងលំនាំដើម, ស៊ុមនីមួយៗ)។ ប្រើ៖ python3 tools/build-icons.py
"""
import re, glob, os, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'icons')
OUT = os.path.join(ROOT, 'js', 'icons.js')
SKIP = ('icon', 'text')            # រូបតំណាងកម្មវិធី + ប្រអប់អត្ថបទ

def attrs(s): return dict(re.findall(r'([\w:-]+)\s*=\s*"([^"]*)"', s))
def num(x):
    v = round(float(x), 2); return str(int(v)) if v == int(v) else str(v)
def round_d(d): return re.sub(r'-?\d+\.\d+(?:e-?\d+)?', lambda m: num(m.group(0)), d)

def style_fix(style, sim):
    st = dict(p.split(':', 1) for p in style.split(';') if ':' in p)
    st.pop('display', None)
    out = {}
    for k, v in st.items():
        v = v.strip()
        if k == 'stroke-width': out[k] = num(float(v) * 3)           # icon 60 ឯកតា = 1 ក្រឡា (20px) → ×3 ឱ្យ 2px
        elif k in ('stroke', 'fill'):
            out[k] = v if v in ('none', 'currentColor') else ('var(--simfill)' if (sim and k == 'fill') else 'var(--ink)')
        elif k in ('stroke-dasharray', 'stroke-miterlimit', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'fill-opacity', 'opacity'):
            out[k] = v
    return ';'.join(f'{k}:{v}' for k, v in out.items())

def element(body, eid, sim):
    m = re.search(r'<(path|circle|rect|ellipse|line|polygon|polyline)\b([^>]*?\bid="%s"[^>]*?)/?>' % re.escape(eid), body, re.S)
    if not m: return ''
    tag, a = m.group(1), attrs(m.group(2))
    keep = {k: v for k, v in a.items() if k in ('d', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'points', 'transform', 'x1', 'y1', 'x2', 'y2')}
    if 'd' in keep: keep['d'] = round_d(keep['d'])
    st = style_fix(a.get('style', ''), sim)
    return '<%s %s style="%s"/>' % (tag, ' '.join(f'{k}="{v}"' for k, v in keep.items()), st)

icons = {}
for f in sorted(glob.glob(os.path.join(SRC, '*.svg'))):
    name = os.path.basename(f)[:-4]
    if name.startswith(SKIP) or '%' in name: continue
    s = open(f, encoding='utf-8').read()
    mm = re.search(r'<metadata.*?</metadata>', s, re.S)
    if not mm or '<nodes' not in mm.group(0):                        # ក្រៅពីឧបករណ៍ (ឧ. រូបកម្មវិធី)
        continue
    m = mm.group(0); body = s[s.index('</metadata>') + 11:]
    vb = [float(x) for x in re.search(r'viewBox="([^"]*)"', s).group(1).split()]
    w, h = vb[2], vb[3]
    info = attrs(re.search(r'<info\s+([^>]*?)/>', m, re.S).group(1)) if '<info' in m else {}
    nodes = re.search(r'<nodes[^>]*>(.*?)</nodes>', m, re.S).group(1)
    nl = [attrs(x) for x in re.findall(r'<node\s+([^>]*?)/>', nodes, re.S)]
    t = [[round(w / 2 + float(n['dx']), 2), round(h / 2 + float(n['dy']), 2)] for n in nl]
    tags = [n.get('tag', '') for n in nl]
    cs = re.search(r'<contacts>(.*?)</contacts>', m, re.S)
    ef, cp = None, []
    if cs:
        for c in re.findall(r'<contact\s+([^>]*?)/>', cs.group(1), re.S):
            a = attrs(c); cp.append([int(a['nodeId1']), int(a['nodeId2']), a.get('type', '')])
            if ef is None and 'enableFrames' in a: ef = [int(x) for x in a['enableFrames'].split(',')]
    fr = re.search(r'<frames[^>]*>(.*?)</frames>', m, re.S).group(1)
    frames = []
    for fb in re.findall(r'<frame\b[^>]*>(.*?)</frame>', fr, re.S)[:3]:
        mk = ''
        for pf in re.findall(r'<pathFrame\b([^>]*)/?>', fb, re.S):
            at = attrs(pf); mk += element(body, at.get('id', ''), at.get('type') == 'simulation')
        frames.append(mk)
    icons[name] = {'w': w, 'h': h, 'cat': info.get('category', ''), 'type': info.get('type', ''), 'nm': info.get('name', name),
                   't': t, 'tags': tags, 'cp': cp, 'ef': ef, 'fr': frames}

with open(OUT, 'w', encoding='utf-8') as o:
    o.write('/* បង្កើតដោយ tools/build-icons.py ពី assets/icons/*.svg — កុំកែដោយដៃ */\nexport const ICONS = ')
    json.dump(icons, o, ensure_ascii=False, separators=(',', ':'))
    o.write(';\n')
print(len(icons), 'icons ->', OUT, os.path.getsize(OUT) // 1024, 'KB')
