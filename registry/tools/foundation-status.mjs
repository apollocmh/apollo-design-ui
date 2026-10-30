#!/usr/bin/env node
/** Refresh static package facts; current work state is owned by vue-native-audit.json. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FILE = path.join(ROOT, 'registry/foundation.json');
const { values } = parseArgs({
  options: {
    check: { type: 'boolean' },
    json: { type: 'boolean' },
    package: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
});
if (values.help) {
  console.log(
    'foundation-status.mjs [--check] [--json] [--package <dir>]\nStatic inventory only. Verification uses verify:changed / verify:full; task state uses registry:vue-native.',
  );
  process.exit(0);
}
const read = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const doc = read('registry/foundation.json');
const components = read('registry/components.json').components;
const known = new Set(doc.packages.map((pkg) => pkg.name));
const retired = [
  'status',
  'pocStatus',
  'pocResult',
  'doneWhen',
  'dimensions',
  'testLayers',
  'layerNotes',
  'blockedBy',
  'blockers',
  'notes',
  'verification',
  'phase2Order',
];
for (const pkg of doc.packages) {
  const found = retired.filter((key) => Object.hasOwn(pkg, key));
  if (found.length)
    throw new Error(
      `${pkg.name}: progress belongs to registry/vue-native-audit.json (${found.join(', ')})`,
    );
  const manifest = read(`packages/${pkg.dir}/package.json`);
  pkg.dependsOn = Object.keys(manifest.dependencies ?? {})
    .filter((name) => known.has(name))
    .sort();
}
const byName = new Map(doc.packages.map((pkg) => [pkg.name, pkg]));
const visited = new Set(),
  visiting = new Set(),
  ordered = [];
function visit(name) {
  if (visited.has(name)) return;
  if (visiting.has(name)) throw new Error(`Foundation dependency cycle: ${name}`);
  visiting.add(name);
  for (const dep of byName.get(name).dependsOn) visit(dep);
  visiting.delete(name);
  visited.add(name);
  ordered.push(name);
}
for (const name of [...known].sort()) visit(name);
function sourceFacts(dir) {
  const files = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!['__tests__', 'node_modules', 'dist'].includes(entry.name)) walk(file);
      } else if (/\.(ts|tsx|vue)$/.test(entry.name)) files.push(file);
    }
  }
  walk(path.join(ROOT, 'packages', dir, 'src'));
  let srcLines = 0;
  const exports = new Set();
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    srcLines += text.split('\n').length;
    for (const match of text.matchAll(
      /^export\s+(?:async\s+)?(?:function|const|let|var|class|interface|type|enum)\s+([A-Za-z0-9_$]+)/gm,
    ))
      exports.add(match[1]);
    for (const match of text.matchAll(/^export\s+(?:type\s+)?\{([^}]*)\}/gm)) {
      for (const part of match[1].split(',')) {
        const name = part
          .trim()
          .split(/\s+as\s+/)
          .pop()
          ?.trim();
        if (name && /^[A-Za-z0-9_$]+$/.test(name)) exports.add(name);
      }
    }
  }
  return { srcFiles: files.length, srcLines, exportDeclarations: exports.size };
}
const uiDependencies = new Set(Object.keys(read('packages/ui/package.json').dependencies ?? {}));
for (const pkg of doc.packages) {
  pkg.dependedOnBy = doc.packages
    .filter((other) => other.dependsOn.includes(pkg.name))
    .map((other) => other.name)
    .sort();
  const consumers = components.filter((component) =>
    component.dependencies.foundation.includes(pkg.name),
  );
  const byPriority = {};
  for (const consumer of consumers)
    byPriority[consumer.priority] = (byPriority[consumer.priority] ?? 0) + 1;
  pkg.derived = {
    implOrder: ordered.indexOf(pkg.name) + 1,
    componentConsumers: consumers.length,
    componentConsumersByPriority: byPriority,
    packageConsumers: [
      ...pkg.dependedOnBy,
      ...(uiDependencies.has(pkg.name) ? ['@apollo-design/ui'] : []),
    ].sort(),
    ...sourceFacts(pkg.dir),
  };
}
doc.sourceFacts =
  'Static package metadata + actual package.json dependencies + component consumers + packages/*/src measurements. Task selection and completion are not derived from imports.';
doc.summary = { total: doc.packages.length, byLayer: {} };
for (const pkg of doc.packages)
  doc.summary.byLayer[pkg.layer] = (doc.summary.byLayer[pkg.layer] ?? 0) + 1;
if (values.package || values.json) {
  const rows = values.package
    ? doc.packages.filter((pkg) => pkg.dir === values.package || pkg.name === values.package)
    : doc.packages;
  if (!rows.length) throw new Error(`Unknown foundation package: ${values.package}`);
  const state = read('registry/vue-native-audit.json');
  const result = rows.map((pkg) => ({
    ...pkg,
    task: state.tasks.find((task) => task.id === `FND:${pkg.dir}`),
  }));
  console.log(
    JSON.stringify(
      values.package ? result[0] : { summary: doc.summary, packages: result },
      null,
      2,
    ),
  );
  process.exit(0);
}
const existing = read('registry/foundation.json');
if (JSON.stringify(existing) !== JSON.stringify(doc)) {
  if (values.check) {
    console.error('[foundation] static inventory is stale; run pnpm registry:foundation');
    process.exit(1);
  }
  fs.writeFileSync(FILE, `${JSON.stringify(doc, null, 2)}\n`);
  console.log('[foundation] refreshed static inventory');
}
console.log(
  `[foundation] ${doc.packages.length} packages; current status: registry/vue-native-audit.json`,
);
