#!/bin/bash
# Rebuild the Sharps narration audio + js/sharps-narration.js. Run from lesson-presentation/.
set -e
WORK=${TMPDIR:-/tmp}/sharps-narration
OUT=../assets/audio/sharps
node tools/sharps-narration/extract.js "$WORK"
python3 tools/sharps-narration/gen.py "$OUT" "$WORK"
python3 - "$WORK" <<'PY'
import json, sys
d = json.load(open(sys.argv[1] + '/timing.json'))
src = open('js/sharps-narration.js').read()
hdr = src[:src.index('window.SHARPS_NARRATION')]
open('js/sharps-narration.js', 'w').write(hdr + 'window.SHARPS_NARRATION = ' + json.dumps(d, separators=(',', ':'), ensure_ascii=False) + ';\n')
print('wrote js/sharps-narration.js')
PY
