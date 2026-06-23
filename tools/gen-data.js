/* ============================================================
   tools/gen-data.js — generate the JSON "database" from seed.js
   Runs the browser seed in a Node VM sandbox (window === sandbox),
   then writes one JSON file per table into /data + a manifest.
   Usage:  node tools/gen-data.js
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');

// --- sandbox that behaves like a browser global (window === global) ---
const sandbox = {};
sandbox.window = sandbox;
sandbox.console = console;
sandbox.document = { createElement: function () { return { style: {}, classList: { add() {} }, setAttribute() {}, appendChild() {}, addEventListener() {} }; } };
sandbox.navigator = { userAgent: 'node' };
vm.createContext(sandbox);

function run(file) { vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file }); }
run('js/util.js');
run('js/seed.js');

const data = vm.runInContext('App.seed.build()', sandbox);

if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });

const manifest = { generatedAt: new Date().toISOString(), version: data.meta ? data.meta.version : '3.0', tables: [] };
let totalRows = 0;

Object.keys(data).sort().forEach(function (key) {
  const val = data[key];
  const file = key + '.json';
  fs.writeFileSync(path.join(DATA, file), JSON.stringify(val, null, 2));
  const isArr = Array.isArray(val);
  const count = isArr ? val.length : (val && typeof val === 'object' ? Object.keys(val).length : 1);
  if (isArr) totalRows += val.length;
  manifest.tables.push({ key: key, file: file, type: isArr ? 'array' : 'object', count: count });
});

fs.writeFileSync(path.join(DATA, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log('Wrote ' + manifest.tables.length + ' tables to /data (' + totalRows + ' array rows total)');
manifest.tables.forEach(function (t) { console.log('  ' + t.file.padEnd(22) + t.type.padEnd(7) + t.count); });
