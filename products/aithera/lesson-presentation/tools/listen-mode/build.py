"""Build the Listen mode caption timing (and the placeholder hand-back clip).

  cd products/aithera/lesson-presentation
  python3 tools/listen-mode/build.py

Reads ../assets/audio/sharps/listenModeAudio/manifest.json and, for every
file it names (topics + quickTakes), writes timing.json beside it:

  { "<file>": { "dur": seconds,
                "env": 30 Hz loudness, one base-36 char per sample,
                "sents": [{ "w": speaker, "t": text, "em": [word idx], "s": start, "e": end }] } }

Timing comes from the file's `captions` (its WebVTT export) when it has one:
each cue's words are spread across the cue by character share, then the
words are regrouped into whole SENTENCES (cues break mid-sentence; the
player shows one sentence at a time). A file with no captions falls back to
ALIGNING its `transcript` to the file's own pauses: every sentence boundary
is matched (in order, by dynamic programming) to the measured pause nearest
its character-proportional estimate — close, not word-perfect.

Transcript conventions: "SPEAKER: text"; [stage directions] are dropped;
an ALL-CAPS word is spoken emphasis — shown in lower case and flagged in `em`
so the caption can set it in italics (hyphenated spellings like H-I-V stay).

A transcript line may omit its speaker ("You may now continue the lesson.").
"""
import json, math, os, re, struct, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.normpath(os.path.join(HERE, '..', '..', '..', 'assets', 'audio', 'sharps', 'listenModeAudio'))
ENV_HZ = 30
PAUSE_DB, PAUSE_MIN = -38, 0.2

def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, **kw)

def duration(path):
    out = run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).stdout
    return float(out.decode().strip())

def pauses(path):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af',
                          'silencedetect=noise=%ddB:d=%s' % (PAUSE_DB, PAUSE_MIN), '-f', 'null', '-'],
                         capture_output=True).stderr.decode()
    st = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', err)]
    en = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', err)]
    out = []
    for i, s in enumerate(st):
        out.append((max(0.0, s), en[i] if i < len(en) else None))
    return out

def envelope(path):
    raw = run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', '22050', '-f', 's16le', '-']).stdout
    n = len(raw) // 2
    smp = struct.unpack('<%dh' % n, raw)
    step = 22050 // ENV_HZ
    env = []
    for i in range(0, n, step):
        c = smp[i:i + step]
        env.append(math.sqrt(sum(x * x for x in c) / max(1, len(c))) / 32768)
    peak = max(env) or 1
    return ''.join('0123456789abcdefghijklmnopqrstuvwxyz'[min(35, int(35 * (v / peak) ** 0.7))] for v in env)

SPLIT = re.compile(r'(?<=[.?!”"])\s+(?=[A-Z“"\[])')
def sentences(path):
    out = []
    for line in open(path, encoding='utf-8').read().splitlines():
        if not line.strip():
            continue
        m = re.match(r'\s*([A-Z][A-Z ]+):\s*(.*)', line)
        who, text = (m.group(1).strip(), m.group(2)) if m else ('', line)
        text = re.sub(r'\[[^\]]*\]\s*', '', text).strip()
        for t in SPLIT.split(text):
            t = t.strip()
            if not t:
                continue
            words, em = [], []
            for i, w in enumerate(t.split()):
                core = re.sub(r'[^A-Za-z]', '', w)
                if len(core) >= 2 and core.isupper() and '-' not in w:
                    em.append(i)
                    w = w.lower()
                words.append(w)
            out.append({'w': who, 't': ' '.join(words), 'em': em})
    return out

def clean_words(text):
    """Words with stage directions dropped and ALL-CAPS emphasis flagged."""
    text = re.sub(r'\[[^\]]*\]\s*', '', text).strip()
    out = []
    for w in text.split():
        core = re.sub(r'[^A-Za-z]', '', w)
        em = len(core) >= 2 and core.isupper() and '-' not in w
        out.append((w.lower() if em else w, em))
    return out

def ts(x):
    h, m, rest = ([0] + x.split(':'))[-3:]
    return int(h) * 3600 + int(m) * 60 + float(rest.replace(',', '.'))

def from_vtt(path):
    """Sentences, timed from a WebVTT file's cues."""
    words = []   # (word, em, who, start, end)
    blocks = re.split(r'\n\s*\n', open(path, encoding='utf-8').read().replace('\r', ''))
    for b in blocks:
        m = re.search(r'([0-9:.,]+)\s*-->\s*([0-9:.,]+)', b)
        if not m:
            continue
        s, e = ts(m.group(1)), ts(m.group(2))
        body = b[m.end():].strip()
        v = re.match(r'<v\s+([^>]+)>', body)
        who = v.group(1).strip().upper() if v else ''
        body = re.sub(r'<[^>]+>', '', body).replace('\n', ' ')
        ws = clean_words(body)
        total = sum(len(w) + 1 for w, _ in ws) or 1
        acc = 0
        for w, em in ws:
            a = s + (e - s) * acc / total
            acc += len(w) + 1
            words.append((w, em, who, a, s + (e - s) * acc / total))
    sents, cur = [], []
    def flush():
        if cur:
            sents.append({'w': cur[0][2], 't': ' '.join(x[0] for x in cur),
                          'em': [i for i, x in enumerate(cur) if x[1]],
                          's': round(cur[0][3], 3), 'e': round(cur[-1][4], 3)})
    for i, x in enumerate(words):
        if cur and x[2] != cur[0][2]:
            flush(); cur = []
        cur.append(x)
        if re.search(r'[.?!]["”’)]*$', x[0]):
            flush(); cur = []
    flush()
    return sents

def fit_vtt(sents, ps):
    """The VTT exports run a few percent fast against the mp3s (2026-10-01:
    every file, ~2-4%, i.e. different renders or a speed setting applied to
    the audio only). Fit the stretch + shift that puts the most sentence
    starts on a measured pause end. Returns (stretch, shift, matched, of)."""
    ends = [e for s, e in ps if e]
    starts = [x['s'] for x in sents[1:]]
    if not ends or not starts:
        return 1.0, 0.0, 0, len(starts)
    def hits(k, off):
        return sum(1 for t in starts if min(abs(p - (t * k + off)) for p in ends) < 0.15)
    best = max((hits(1 + i / 1000.0, o / 100.0), 1 + i / 1000.0, o / 100.0)
               for i in range(-10, 61) for o in range(-50, 51, 5))
    # No correction unless one is clearly better: on a short file a few
    # chance matches can 'fit' a stretch that isn't there.
    raw = hits(1.0, 0.0)
    if best[0] - raw <= max(1, len(starts) // 8):
        return 1.0, 0.0, raw, len(starts)
    return best[1], best[2], best[0], len(starts)

def apply_fit(sents, k, off, dur):
    for x in sents:
        x['s'] = round(max(0.0, min(dur, x['s'] * k + off)), 3)
        x['e'] = round(max(0.0, min(dur, x['e'] * k + off)), 3)
    return sents

def align(sents, dur, ps):
    """Start time for every sentence. Boundaries snap to pause ENDS (speech
    resuming), chosen in order to stay closest to a character-proportional
    estimate over the file's speech time."""
    lead = ps[0][1] if ps and ps[0][0] < 0.05 and ps[0][1] else 0.0
    tail = ps[-1][0] if ps and ps[-1][1] is None else dur
    inner = [(s, e) for s, e in ps if e is not None and s > lead + 0.05 and e < tail - 0.05]
    # speech-time axis (pauses removed) → real time
    speech = []
    t = lead
    for s, e in inner:
        speech.append((t, s)); t = e
    speech.append((t, tail))
    total = sum(b - a for a, b in speech) or 1
    def real(frac):
        want = frac * total
        for a, b in speech:
            if want <= b - a:
                return a + want
            want -= b - a
        return tail
    w = [len(x['t']) + 6 for x in sents]
    W = float(sum(w))
    est, acc = [], 0
    for x in w[:-1]:
        acc += x; est.append(real(acc / W))
    cand = [e for s, e in inner]
    lens = [e - s for s, e in inner]
    n, m = len(est), len(cand)
    INF = float('inf')
    # dp[i][j]: best cost placing boundaries 0..i-1 using pauses before j
    dp = [[INF] * (m + 1) for _ in range(n + 1)]
    choice = [[None] * (m + 1) for _ in range(n + 1)]
    for j in range(m + 1):
        dp[0][j] = 0.0
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            # skip pause j-1
            best, pick = dp[i][j - 1], ('skip', None)
            # use pause j-1 for boundary i-1 (longer pauses are likelier sentence ends)
            c = dp[i - 1][j - 1] + abs(cand[j - 1] - est[i - 1]) - 0.6 * min(lens[j - 1], 0.8)
            if c < best:
                best, pick = c, ('use', j - 1)
            dp[i][j] = best; choice[i][j] = pick
    starts = [lead]
    if n and m >= n:
        bounds, i, j = [], n, m
        while i > 0:
            kind, p = choice[i][j]
            if kind == 'use':
                bounds.append(cand[p]); i -= 1
            j -= 1
        starts += bounds[::-1]
    else:
        starts += est
    for k, x in enumerate(sents):
        x['s'] = round(starts[k], 3)
        nxt = starts[k + 1] if k + 1 < len(starts) else tail
        # end at the pause before the next sentence, if there is one
        gap = [s for s, e in inner if x['s'] < s < nxt]
        x['e'] = round(gap[-1] if gap else nxt, 3)
    return sents

def main():
    man = json.load(open(os.path.join(PKG, 'manifest.json')))
    entries = []
    for key, topic in man['topics'].items():
        for kind in ('normal', 'harder', 'addon', 'reinforced'):
            if kind in topic:
                entries.append((key, topic[kind]))
    for key, q in man.get('quickTakes', {}).items():
        entries.append(('qt-' + key, q))
    out, fits, pending = {}, [], []
    for key, e in entries:
        path = os.path.join(PKG, e['file'])
        d = duration(path)
        ps = pauses(path)
        if e.get('captions'):
            s = from_vtt(os.path.join(PKG, e['captions']))
            k, off, hit, of = fit_vtt(s, ps)
            # Trust a file's own fit only when it is convincing; otherwise
            # (music beds, very short files) use the package's typical one.
            if of >= 4 and hit >= of * 0.5:
                fits.append(k)
                s, how = apply_fit(s, k, off, d), 'captions x%.3f %+.2fs (%d/%d on pauses)' % (k, off, hit, of)
            elif s and 1.0 <= d / max(.01, s[-1]['e']) <= 1.06:
                # Speech runs to the end of the file: anchor the last cue to it.
                k = d / s[-1]['e']
                s, how = apply_fit(s, k, 0.0, d), 'captions x%.3f, end-anchored (own fit only %d/%d)' % (k, hit, of)
            else:
                pending.append((e['file'], s, d)); how = 'captions (package stretch)'
        else:
            s = sentences(os.path.join(PKG, e['transcript'])) if e.get('transcript') else []
            s, how = (align(s, d, ps) if s else []), 'aligned'
        out[e['file']] = {'dur': round(d, 3), 'env': envelope(path), 'sents': s}
        print('%-28s %6.1fs  %2d sentences  %s' % (e['file'], d, len(s), how))
    if pending:
        fits.sort(); k = fits[len(fits) // 2] if fits else 1.0
        for f, s, d in pending:
            out[f]['sents'] = apply_fit(s, k, 0.0, d)
            print('%-28s package stretch x%.3f' % (f, k))
    json.dump(out, open(os.path.join(PKG, 'timing.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    print('wrote timing.json')

if __name__ == '__main__':
    main()
