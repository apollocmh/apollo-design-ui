const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const ROOT = path.resolve(__dirname, '../../..');
process.chdir(ROOT);
const ts = require(path.join(ROOT, 'node_modules/typescript'));
const files = cp.execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n');
const counts = {};
let scanned = 0,
  sourceFiles = 0;
const imports = [];
for (const file of files) {
  if (!/\.(?:md|json|ya?ml|[cm]?js|jsx|tsx?|vue|html|css)$/.test(file) || file === 'pnpm-lock.yaml')
    continue;
  const text = fs.readFileSync(file, 'utf8');
  scanned++;
  const hits = [...text.matchAll(/antd|ant.?design|\bReact\b/gi)].length;
  const category = file.startsWith('packages/')
    ? file.split('/').slice(0, 2).join('/')
    : file.split('/')[0];
  counts[category] ??= { files: 0, matchedFiles: 0, references: 0 };
  counts[category].files++;
  if (hits) {
    counts[category].matchedFiles++;
    counts[category].references += hits;
  }
  if (
    !/^packages\/(?!docs\/|test-utils\/)[^/]+\/src\//.test(file) ||
    /\/(?:__tests__|demo)\//.test(file) ||
    !/\.(?:tsx?|vue)$/.test(file)
  )
    continue;
  sourceFiles++;
  const code = file.endsWith('.vue')
    ? [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n')
    : text;
  const ast = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      if (
        /^(?:react(?:-dom|-is)?|antd|@ant-design\/|@rc-component\/|rc-)/.test(
          node.moduleSpecifier.text,
        )
      )
        imports.push({ file, specifier: node.moduleSpecifier.text });
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
}
console.log(JSON.stringify({ scanned, sourceFiles, sourceImports: imports, counts }, null, 2));
