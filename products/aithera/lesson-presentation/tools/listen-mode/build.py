"""Build the Listen mode caption timing (and the placeholder hand-back clip).

  cd products/aithera/lesson-presentation
  python3 tools/listen-mode/build.py

Reads ../assets/audio/sharps/listenModeAudio/manifest.json and, for every
file it names (topics + quickTakes), writes timing.json beside it:

  { "<file>": { "dur": seconds,
                "env": 30 Hz loudness, one base-36 char per sample,
                "sents": [{ "w": speaker, "t": text, "em": [word idx], "s": start, "e": end }] } }

There is no speech recogniser on this machine, so sentences are placed by
ALIGNING the transcript to the file's own pauses: every sentence boundary is
matched (in order, by dynamic programming) to the measured pause nearest its
character-proportional estimate. Close, not word-perfect — the player times
words inside a sentence by character share, as the Read to me player does.

Transcript conventions: "SPEAKER: text"; [stage directions] are dropped;
an ALL-CAPS word is spoken emphasis — shown in lower case and flagged in `em`
so the caption can set it in italics (hyphenated spellings like H-I-V stay).

Also (re)creates the placeholder hand-back clip the manifest's `continue`
topic names — a synthesised ding, then "You may now continue the lesson."
in a placeholder voice — when it is missing or --continue is passed.
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
        m = re.match(r'\s*([A-Z][A-Z ]+):\s*(.*)', line)
        if not m:
            continue
        who, text = m.group(1).strip(), m.group(2)
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

def make_continue(entry):
    mp3 = os.path.join(PKG, entry['file'])
    txt = os.path.join(PKG, entry['transcript'])
    work = os.path.join(os.environ.get('TMPDIR', '/tmp'), 'listen-continue')
    os.makedirs(work, exist_ok=True)
    R = 44100
    # the ding: one soft bell (B5 + its octave), 1.4 s, then 0.35 s of room
    n = int(R * 1.75); smp = []
    for i in range(n):
        t = i / R
        a = min(1, t / 0.006) * math.exp(-t * 3.4) if t < 1.4 else 0
        v = a * (math.sin(2 * math.pi * 987.77 * t) + 0.3 * math.sin(2 * math.pi * 1975.5 * t))
        smp.append(int(max(-1, min(1, v * 0.28)) * 32767))
    import wave
    ding = os.path.join(work, 'ding.wav')
    w = wave.open(ding, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(R)
    w.writeframes(struct.pack('<%dh' % n, *smp)); w.close()
    voice = os.path.join(work, 'voice.aiff')
    line = 'You may now continue the lesson.'
    run(['say', '-v', 'Samantha', '-o', voice, line])
    run(['ffmpeg', '-y', '-v', 'error', '-i', ding, '-i', voice, '-filter_complex',
         '[1:a]aresample=44100,aformat=channel_layouts=mono[v];[0:a][v]concat=n=2:v=0:a=1,apad=pad_dur=0.4',
         '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '192k', mp3])
    open(txt, 'w', encoding='utf-8').write('DANA: ' + line + '\n')
    print('made', entry['file'])

def main():
    man = json.load(open(os.path.join(PKG, 'manifest.json')))
    entries = []
    for key, topic in man['topics'].items():
        for kind in ('normal', 'harder', 'addon', 'reinforced'):
            if kind in topic:
                entries.append((key, topic[kind]))
    for key, q in man.get('quickTakes', {}).items():
        entries.append(('qt-' + key, q))
    cont = man['topics'].get('continue', {}).get('normal')
    if cont and ('--continue' in sys.argv or not os.path.exists(os.path.join(PKG, cont['file']))):
        make_continue(cont)
    out = {}
    for key, e in entries:
        path = os.path.join(PKG, e['file'])
        d = duration(path)
        ps = pauses(path)
        s = sentences(os.path.join(PKG, e['transcript'])) if e.get('transcript') else []
        out[e['file']] = {'dur': round(d, 3), 'env': envelope(path), 'sents': align(s, d, ps) if s else []}
        print('%-28s %6.1fs  %2d sentences  %2d pauses' % (e['file'], d, len(s), len(ps)))
    json.dump(out, open(os.path.join(PKG, 'timing.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    print('wrote timing.json')

if __name__ == '__main__':
    main()
