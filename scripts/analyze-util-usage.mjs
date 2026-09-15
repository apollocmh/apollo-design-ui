#!/usr/bin/env node
/**
 * 提取 antd 实际从 @rc-component/util 导入的符号清单。
 *
 * 为什么需要它：
 *   AGENTS.md §5.1 禁止凭记忆描述 antd 的行为。实现 @apollo-design/utils 时，
 *   我们必须知道 antd 真实需要哪些工具函数，而不是猜测"通用工具库应该有什么"。
 *   同时可以看清每个符号的使用广度 —— 使用面最广的优先实现。
 *
 * 用法：node scripts/analyze-util-usage.mjs [antd-es-path]
 */

import fs from 'node:fs';
import path from 'node:path';

const ES = process.argv[2] ?? '/tmp/antd-src/package/es';

function collect(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) collect(fp, out);
    else if (/\.js$/.test(e.name)) out.push(fp);
  }
  return out;
}

const usage = new Map();
const subpaths = new Map();
const hooks = new Map();

for (const f of collect(ES)) {
  const comp = path.relative(ES, f).split('/')[0];
  const text = fs.readFileSync(f, 'utf8');

  const named = /import\s+\{([^}]*)\}\s+from\s+["']@rc-component\/util(?:\/([^"']*))?["']/g;
  for (const m of text.matchAll(named)) {
    const sub = m[2] ? m[2].replace(/\.js$/, '') : null;
    if (sub) {
      if (!subpaths.has(sub)) subpaths.set(sub, new Set());
      subpaths.get(sub).add(comp);
    }
    for (const raw of m[1].split(',')) {
      const name = raw
        .trim()
        .split(/\s+as\s+/)[0]
        .trim();
      if (!name) continue;
      const bucket = /^use[A-Z]/.test(name) ? hooks : usage;
      if (!bucket.has(name)) bucket.set(name, new Set());
      bucket.get(name).add(comp);
    }
  }

  const def = /import\s+([A-Za-z_$][\w$]*)\s+from\s+["']@rc-component\/util\/([^"']*)["']/g;
  for (const m of text.matchAll(def)) {
    const sub = m[2].replace(/\.js$/, '');
    if (!subpaths.has(sub)) subpaths.set(sub, new Set());
    subpaths.get(sub).add(comp);
  }
}

const pad = (n) => String(n).padStart(3);

console.log(`=== @rc-component/util 具名导入（非 hook）：${usage.size} 个 ===\n`);
for (const [name, comps] of [...usage].sort((a, b) => b[1].size - a[1].size)) {
  console.log(`${pad(comps.size)}  ${name}`);
}

console.log(`\n=== hooks：${hooks.size} 个 ===\n`);
for (const [name, comps] of [...hooks].sort((a, b) => b[1].size - a[1].size)) {
  console.log(`${pad(comps.size)}  ${name}`);
}

console.log(`\n=== 子路径导入：${subpaths.size} 个 ===\n`);
for (const [sub, comps] of [...subpaths].sort((a, b) => b[1].size - a[1].size)) {
  console.log(`${pad(comps.size)}  @rc-component/util/${sub}`);
}

// 输出机器可读版本，供 registry 使用
const json = {
  generatedFrom: ES,
  named: Object.fromEntries([...usage].map(([k, v]) => [k, [...v].sort()])),
  hooks: Object.fromEntries([...hooks].map(([k, v]) => [k, [...v].sort()])),
  subpaths: Object.fromEntries([...subpaths].map(([k, v]) => [k, [...v].sort()])),
};
const outFile = path.resolve('registry/source/antd-util-usage.json');
fs.writeFileSync(outFile, `${JSON.stringify(json, null, 2)}\n`);
console.log(`\n→ ${outFile}`);
