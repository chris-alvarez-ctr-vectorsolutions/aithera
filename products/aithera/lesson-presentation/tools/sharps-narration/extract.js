// Pulls the PODCAST scripts out of js/layered-sharps.js → <work>/narr.json
// as { "<sector>/<screen>": [[speaker, text], ['PAUSE'], …] }.
const fs = require('fs'), work = process.argv[2];
const src = fs.readFileSync('js/layered-sharps.js', 'utf8');
function grab(name) {
  const i = src.indexOf('var ' + name + ' = {'); let d = 0; const j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && !--d) return src.slice(j, k + 1); }
}
const POD = eval('(' + grab('PODCAST') + ')');
const out = {};
for (const sec in POD) for (const id in POD[sec]) out[sec + '/' + id] = POD[sec][id];
fs.mkdirSync(work, { recursive: true });
fs.writeFileSync(work + '/narr.json', JSON.stringify(out));
console.log(Object.keys(out).length + ' screens');
