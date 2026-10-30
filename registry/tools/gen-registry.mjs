#!/usr/bin/env node
/** Refresh Apollo-owned derived data without consulting an upstream inventory. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
if (args.some((arg) => !['--check', '--print-dag'].includes(arg))) {
  throw new Error(
    'Usage: gen-registry.mjs [--check] [--print-dag]. Upstream versions belong to reference tools.',
  );
}
const read = (name) => JSON.parse(fs.readFileSync(path.join(ROOT, 'registry', name), 'utf8'));
const componentsDoc = read('components.json');
const dependenciesDoc = read('dependencies.json');
const tokensDoc = read('tokens.json');
const tokens = tokensDoc.layers;
for (const [name, layer] of Object.entries(tokens)) {
  if (Object.hasOwn(layer, 'status'))
    throw new Error(`${name}: token progress belongs to the archived implementation record`);
}
if (tokensDoc.algorithms.some((algorithm) => Object.hasOwn(algorithm, 'status'))) {
  throw new Error('Algorithm progress belongs to the archived implementation record');
}
// Alias owns only its additions; effective aliases also include the map layer.
tokens.alias.own = tokens.alias.effective.filter((token) => !tokens.map.aggregate.includes(token));
Object.assign(tokensDoc.summary, {
  seed: tokens.seed.tokens.length,
  mapAggregate: tokens.map.aggregate.length,
  mapByCategory: Object.fromEntries(
    Object.entries(tokens.map.categories).map(([name, list]) => [name, list.length]),
  ),
  aliasOwn: tokens.alias.own.length,
  aliasEffective: tokens.alias.effective.length,
  componentTokenGroups: tokens.component.groups.length,
  componentTokensTotal: Object.values(tokens.component.perComponent).reduce(
    (sum, list) => sum + list.length,
    0,
  ),
  componentsWithTokens: Object.values(tokens.component.perComponent).filter((list) => list.length)
    .length,
});
const components = componentsDoc.components;
const retiredProgress = [
  'status',
  'blockedBy',
  'blockers',
  'apiStatus',
  'tokenStatus',
  'styleStatus',
  'unitStatus',
  'interactionStatus',
  'typeStatus',
  'a11yStatus',
  'visualStatus',
  'docsStatus',
];
for (const component of components) {
  const retired = retiredProgress.filter((key) => Object.hasOwn(component, key));
  if (retired.length) {
    throw new Error(
      `${component.name}: progress belongs to registry/vue-native-audit.json, not components.json (${retired.join(', ')})`,
    );
  }
}
const byName = new Map(components.map((c) => [c.name, c]));
if (byName.size !== components.length) throw new Error('Duplicate component name');
const levels = new Map();
const visiting = new Set();
function level(name) {
  if (levels.has(name)) return levels.get(name);
  if (visiting.has(name)) throw new Error(`Dependency cycle: ${[...visiting, name].join(' → ')}`);
  const component = byName.get(name);
  if (!component) throw new Error(`Unknown component dependency: ${name}`);
  visiting.add(name);
  const result = Math.max(-1, ...component.dependencies.components.map(level)) + 1;
  visiting.delete(name);
  levels.set(name, result);
  return result;
}
function dependents(name, seen = new Set()) {
  for (const component of components) {
    if (component.dependencies.components.includes(name) && !seen.has(component.name)) {
      seen.add(component.name);
      dependents(component.name, seen);
    }
  }
  return seen;
}
const edges = [];
const layers = {};
for (const component of components) {
  component.priorityNum = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5'].indexOf(component.priority);
  component.derived.dagLevel = level(component.name);
  component.derived.unblocks = dependents(component.name).size;
  component.derived.tokenCount = tokens.component.perComponent[component.name]?.length ?? 0;
  (layers[component.derived.dagLevel] ??= []).push(component.name);
  for (const [key, kind] of [
    ['components', 'runtime'],
    ['typeOnly', 'type-only'],
  ]) {
    for (const from of component.dependencies[key]) {
      if (!byName.has(from)) throw new Error(`Unknown ${kind} dependency: ${from}`);
      edges.push({ from, to: component.name, kind });
    }
  }
}
const countBy = (field) =>
  components.reduce((counts, component) => {
    counts[component[field]] = (counts[component[field]] ?? 0) + 1;
    return counts;
  }, {});
componentsDoc.summary = {
  total: components.length,
  byPriority: countBy('priority'),
  byGroup: countBy('group'),
};
dependenciesDoc.componentDag = {
  nodes: Object.fromEntries(
    components.map((component) => [
      component.name,
      {
        priority: component.priority,
        dagLevel: component.derived.dagLevel,
        dependsOn: component.dependencies.components,
        dependedBy: components
          .filter((c) => c.dependencies.components.includes(component.name))
          .map((c) => c.name),
        unblocks: component.derived.unblocks,
      },
    ]),
  ),
  edges,
  layers,
};
Object.assign(dependenciesDoc.summary, {
  componentEdgesRuntime: edges.filter((e) => e.kind === 'runtime').length,
  componentEdgesTypeOnly: edges.filter((e) => e.kind === 'type-only').length,
  maxDagLevel: Math.max(0, ...levels.values()),
});
let drift = false;
for (const [name, document] of [
  ['components.json', componentsDoc],
  ['dependencies.json', dependenciesDoc],
  ['tokens.json', tokensDoc],
]) {
  const file = path.join(ROOT, 'registry', name);
  // Do not touch audit timestamps or progress evidence on a no-op run.
  const current = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (JSON.stringify(current) === JSON.stringify(document)) continue;
  if (args.includes('--check')) {
    console.error(`[registry] ${name} derived data is stale; run pnpm registry:gen`);
    drift = true;
  } else {
    fs.writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`);
    console.log(`[registry] refreshed ${name}`);
  }
}
if (args.includes('--print-dag')) {
  for (const [depth, names] of Object.entries(layers))
    console.log(`L${depth}: ${names.join(', ')}`);
}
console.log(
  `[registry] Apollo inventory: ${components.length} components; static metadata and token records preserved`,
);
process.exitCode = drift ? 1 : 0;
