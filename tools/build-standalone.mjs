#!/usr/bin/env node
/** Deterministic local build of the no-install verifier and unit suite. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
if (process.argv.slice(2).some(arg => arg !== '--check')) {
  throw new Error('Usage: node tools/build-standalone.mjs [--check]');
}
const configFile = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
if (configFile.error) throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
const options = { ...config.options, sourceMap: false, declaration: false, removeComments: true };
const diagnostics = [...config.errors, ...ts.getPreEmitDiagnostics(ts.createProgram(config.fileNames, options))];
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: f => f, getCurrentDirectory: () => root, getNewLine: () => '\n',
  }));
  process.exit(1);
}

function filesUnder(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const name = path.join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(name) : [name];
  });
}
const tests = filesUnder(path.join(root, 'tests')).filter(f => f.endsWith('Tests.ts')).sort();
const testEntry = tests.map(f => `import './${path.relative(path.join(root, 'tests'), f).replaceAll(path.sep, '/').replace(/\.ts$/, '')}';`).join('\n');

const shim = `
const nodeTest = require('node:test');
const wrap = fn => typeof fn !== 'function' ? fn : function () {
  return fn.call({ timeout() {}, slow() {}, retries() {} });
};
for (const name of ['describe', 'it']) {
  const original = nodeTest[name];
  const bound = (description, fn) => original(description, wrap(fn));
  for (const mode of ['skip', 'only', 'todo']) {
    bound[mode] = (description, fn) => original[mode](description, wrap(fn));
  }
  globalThis[name] = bound;
}
for (const name of ['before', 'after', 'beforeEach', 'afterEach']) {
  globalThis[name] = fn => nodeTest[name](wrap(fn));
}
`;

function bundle(entry, syntheticSource) {
  const modules = new Map();
  function add(file, source = fs.readFileSync(path.join(root, file), 'utf8')) {
    const id = file.replace(/\.ts$/, '.js');
    if (modules.has(id)) return;
    const output = ts.transpileModule(source, { fileName: file, compilerOptions: options }).outputText;
    modules.set(id, output);
    const ast = ts.createSourceFile(id, output, ts.ScriptTarget.ES2020, true);
    function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'require'
          && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
        const spec = node.arguments[0].text;
        if (spec.startsWith('.')) {
          const base = path.posix.join(path.posix.dirname(file), spec);
          const candidate = [base, base + '.ts', base + '/index.ts'].find(p => p.endsWith('.ts') && fs.existsSync(path.join(root, p)));
          if (candidate) add(candidate);
          else if (!fs.existsSync(path.join(root, base))) throw new Error(`Missing dependency ${spec} from ${file}`);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  add(entry, syntheticSource);
  const body = [...modules].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([id, code]) =>
    `${JSON.stringify(id)}: function(module, exports, require, __filename, __dirname) {\n${code}\n}`).join(',\n');
  return `/** Generated from committed sources. Rebuild: npm run build:standalone. Check: npm run check:standalone. */
'use strict';
${syntheticSource ? shim : ''}
const path = require('node:path');
const nodeRequire = require;
const modules = {\n${body}\n};
const cache = Object.create(null);
function load(from, spec) {
  if (!spec.startsWith('.')) return nodeRequire(spec);
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(from), spec));
  const id = [base, base + '.js', base + '/index.js'].find(p => Object.hasOwn(modules, p));
  if (!id) return nodeRequire(path.join(__dirname, base));
  if (cache[id]) return cache[id].exports;
  const module = { exports: {} };
  cache[id] = module;
  modules[id](module, module.exports, s => load(id, s), path.join(__dirname, id), path.dirname(path.join(__dirname, id)));
  return module.exports;
}
load('', './${entry.replace(/\.ts$/, '.js')}');
`;
}

// Build both before writing either, so a dependency error cannot leave a partial build.
const products = [
  ['verify.js', bundle('tests/verify.ts')],
  ['test.js', bundle('tests/__standalone-entry.ts', testEntry)],
];
let stale = false;
for (const [file, content] of products) {
  const target = path.join(root, file);
  if (check) {
    const matches = fs.existsSync(target) && fs.readFileSync(target, 'utf8') === content;
    console.log(`${matches ? 'OK' : 'STALE'} ${file}`);
    stale ||= !matches;
  } else {
    fs.writeFileSync(target, content);
    console.log(`Built ${file}`);
  }
}
if (stale) process.exitCode = 1;
