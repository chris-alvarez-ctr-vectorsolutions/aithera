// Harness: load the browser-only type compilers under node and dump the
// COMPOSED system prompt each one hands the model.
const fs = require('fs'), path = require('path'), vm = require('vm');
const JS = process.argv[2];

const noop = () => {};
const elStub = () => new Proxy({}, {
  get: (t, k) => (k in t ? t[k] : (k === 'style' || k === 'dataset' || k === 'classList'
    ? elStub() : (typeof k === 'string' && /^[a-z]/.test(k) ? noop : undefined))),
  set: (t, k, v) => { t[k] = v; return true; },
});
const sandbox = {
  console,
  document: { createElement: elStub, querySelector: () => null, querySelectorAll: () => [],
              addEventListener: noop, documentElement: elStub(), body: elStub(), head: elStub() },
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  navigator: { userAgent: 'node' }, location: { href: 'file:///', search: '' },
  matchMedia: () => ({ matches: false, addEventListener: noop, addListener: noop }),
  setTimeout, clearTimeout, setInterval, clearInterval, fetch: noop,
  requestAnimationFrame: noop, Math, Date, JSON,
};
vm.createContext(sandbox);
sandbox.window = sandbox.self = sandbox.globalThis = sandbox;
const win = sandbox;

const load = (f) => vm.runInContext(fs.readFileSync(path.join(JS, f), 'utf8'), sandbox, { filename: f });
['scenario.js', 'sim-core.js', 'sim-player.js', 'scenario-v4.js', 'scenario-v4-templates.js',
 'scenario-v4-runtime.js', 'scenario-v4-scopes.js', 'scenario-types/branching-arc.js',
 'scenario-types/ensemble-arc.js', 'scenario-types/mix-arc.js', 'scenario-types/v4-universal.js'].forEach((f) => {
  try { load(f); } catch (e) { console.error('LOAD FAIL ' + f + ': ' + e.message); }
});

const dump = (globalName, outName) => {
  const T = win[globalName];
  if (!T || typeof T.compile !== 'function') { console.error('no compile on ' + globalName); return; }
  const s = T.normalize ? T.normalize(JSON.parse(JSON.stringify(T.DEFAULT))) : T.DEFAULT;
  const p = T.compile(s);
  fs.writeFileSync(path.join(process.argv[3], outName), p);
  console.log(outName + '  ' + p.length + ' chars  ~' + Math.round(p.length / 4) + ' tokens');
};
dump('AitheraBranchingArc', 'composed-branching-arc.txt');
dump('AitheraEnsembleArc', 'composed-ensemble-arc.txt');
dump('AitheraGuidedArc', 'composed-guided-arc.txt');
dump('AitheraMixArc', 'composed-mix-arc.txt');

// v4 route: compile() returns the ORDERED PER-SCOPE prompts [{role,label,text}]
const V4 = win.AitheraV4Universal;
if (V4 && typeof V4.compile === 'function') {
  const doc = V4.normalize ? V4.normalize(JSON.parse(JSON.stringify(V4.DEFAULT))) : V4.DEFAULT;
  const out = V4.compile(doc);
  if (Array.isArray(out)) {
    out.forEach((sc, i) => {
      const nm = 'composed-v4-' + String(i + 1) + '-' + String(sc.role || sc.label || i)
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.txt';
      fs.writeFileSync(path.join(process.argv[3], nm), sc.text || '');
      console.log(nm + '  ' + (sc.text || '').length + ' chars  ~'
        + Math.round((sc.text || '').length / 4) + ' tokens   [' + (sc.label || '') + ']');
    });
  } else {
    fs.writeFileSync(path.join(process.argv[3], 'composed-v4-monolith.txt'), out);
    console.log('composed-v4-monolith.txt (scopes module did not load)  ' + out.length + ' chars');
  }
}
