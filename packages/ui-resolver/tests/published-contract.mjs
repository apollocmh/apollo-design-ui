/** Metadata/declaration checks run against the installed tarballs, never source-stage UI dist. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const started = performance.now();
assert.ok(process.argv[2], 'Usage: published-contract.mjs <installed-consumer-directory>');
const require = createRequire(resolve(process.argv[2], 'package.json'));
const uiDirectory = dirname(require.resolve('@apollo-design/ui/package.json'));
const resolverDirectory = dirname(require.resolve('@apollo-design/ui-resolver/package.json'));
const manifest = require('@apollo-design/ui/package.json');
const resolverManifest = require('@apollo-design/ui-resolver/package.json');
const styleManifest = require('@apollo-design/ui/style-manifest.json');
const ts = require('typescript');
const { ApolloResolver } = await import(
  pathToFileURL(resolve(resolverDirectory, resolverManifest.exports['.'].import)).href
);
// Inspect the map actually shipped and used by the resolver; this is not a new public export.
const { componentImports } = await import(
  pathToFileURL(resolve(resolverDirectory, 'dist/component-imports.mjs')).href
);

for (const [tag, family] of [
  ['AAutoComplete', 'select'],
  ['ATimePicker', 'date-picker'],
  ['ALayoutSider', 'layout-sider'],
]) {
  const result = await ApolloResolver().resolve(tag);
  assert.deepEqual(
    result.sideEffects,
    styleManifest.components[family].styles,
    `${tag}: special styles`,
  );
}

const first = ApolloResolver();
const initial = await first.resolve('AInput');
await first.resolve('AButton');
await first.resolve('AUnknown');
assert.deepEqual(
  await first.resolve('AInput'),
  initial,
  'Styles must not depend on previous calls',
);
assert.deepEqual(
  await ApolloResolver().resolve('AInput'),
  initial,
  'Styles must not depend on resolver sessions',
);

const exportsByPath = new Map();
const exportNames = (path) => {
  const previous = exportsByPath.get(path);
  if (previous) return previous;
  const entry = manifest.exports[`./${path}`];
  assert.ok(entry && typeof entry === 'object', `Missing public declaration entry: ${path}`);
  const file = resolve(uiDirectory, entry.types);
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const names = new Set();
  for (const statement of source.statements) {
    if (
      ts.isExportDeclaration(statement) &&
      !statement.isTypeOnly &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const entry of statement.exportClause.elements)
        if (!entry.isTypeOnly) names.add(entry.name.text);
    } else if (ts.isExportAssignment(statement) && !statement.isExportEquals) names.add('default');
    else if (
      ts.canHaveModifiers(statement) &&
      ts.getModifiers(statement)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations)
          if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      } else if (
        (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
        statement.name
      )
        names.add(statement.name.text);
    }
  }
  exportsByPath.set(path, names);
  return names;
};
for (const [tag, component] of componentImports) {
  assert.notEqual(manifest.exports[`./${component.path}`], undefined, tag);
  assert.ok(
    exportNames(component.path).has(component.name),
    `${tag}: ${component.path}#${component.name}`,
  );
  const result = await ApolloResolver().resolve(tag);
  assert.ok(result && typeof result === 'object', `${tag}: component import metadata`);
  if (!component.style) {
    assert.equal(result.sideEffects, undefined, tag);
    continue;
  }
  const styles = styleManifest.components[component.style]?.styles;
  assert.ok(styles, `${tag}: manifest family ${component.style}`);
  assert.deepEqual(result.sideEffects, styles, tag);
  assert.equal(styles[0], styleManifest.base, tag);
  assert.equal(new Set(styles).size, styles.length, tag);
  for (const style of styles) {
    assert.match(
      style,
      /^@apollo-design\/ui\/(?:base\.css|[\w-]+\/structure\.css|shared\/[\w-]+\.css)$/,
      tag,
    );
    assert.notEqual(manifest.exports[style.replace('@apollo-design/ui/', './')], undefined, tag);
  }
}
console.log(
  JSON.stringify({
    exitCode: 0,
    durationMs: Math.round(performance.now() - started),
    mappedNames: componentImports.size,
    checks: [
      'special-style-families',
      'order-independent-styles',
      'public-javascript-declarations-and-structural-css',
    ],
  }),
);
