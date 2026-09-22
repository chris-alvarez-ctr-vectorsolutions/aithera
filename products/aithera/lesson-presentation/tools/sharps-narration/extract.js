// Pulls DECK / DECK_LENS narration out of js/layered-sharps.js → <work>/narr.json
const fs = require('fs'), work = process.argv[2];
const src = fs.readFileSync('js/layered-sharps.js', 'utf8');
function grab(name) {
  const i = src.indexOf('var ' + name + ' = {'); let d = 0; const j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && !--d) return src.slice(j, k + 1); }
}
const F1_STATEMENT = '', F3_STATEMENT = '';
const DECK = eval('(' + grab('DECK') + ')'), LENS = eval('(' + grab('DECK_LENS') + ')');
const out = {};
for (const id in DECK) out['manufacturing/' + id] = DECK[id].narration;
for (const sec in LENS) for (const id in LENS[sec]) if (LENS[sec][id].narration) out[sec + '/' + id] = LENS[sec][id].narration;
fs.mkdirSync(work, { recursive: true });
fs.writeFileSync(work + '/narr.json', JSON.stringify(out));
console.log(Object.keys(out).length + ' screens');
