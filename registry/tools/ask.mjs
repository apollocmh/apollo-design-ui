#!/usr/bin/env node
/** Read Registry records as evidence. Project policy lives in AGENTS.md and its domain documents. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAudit, summarizeAudit } from './audit-workflow.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, 'registry', p), 'utf8'));

const [cmd, ...rest] = process.argv.slice(2);
const flag = (name) => rest.includes(name);

function progress() {
  const audit = readAudit(ROOT);
  console.log(JSON.stringify(summarizeAudit(audit), null, 2));
}

function component(name) {
  const c = readJson('components.json').components.find((x) => x.name === name);
  if (!c) {
    console.error(
      `未找到组件 "${name}"。已知：${readJson('components.json')
        .components.map((x) => x.name)
        .join(', ')}`,
    );
    process.exit(1);
  }
  const task = readAudit(ROOT).tasks.find((entry) => entry.id === `CMP:${name}`);
  console.log(JSON.stringify({ metadata: c, task }, null, 2));
}

function decisionList() {
  const ds = readJson('foundation.json').referenceDecisions ?? [];
  const only = flag('--open') ? 'open' : flag('--decided') ? 'decided' : null;
  const rows = ds.filter((d) =>
    only === 'open' ? d.status === 'open' : only === 'decided' ? d.status !== 'open' : true,
  );
  console.log(`决策 ${rows.length} 条（共 ${ds.length}）\n`);
  for (const d of rows) {
    const mark = d.status === 'open' ? '⬜' : '✅';
    const decided = d.decision ? ` → ${d.decision}` : '';
    console.log(`  ${mark} ${d.id.padEnd(30)} ${d.status}${decided}`);
  }
  console.log('\n用 `node registry/tools/ask.mjs decision <id>` 看全文。');
}

function decision(id) {
  const d = (readJson('foundation.json').referenceDecisions ?? []).find((x) => x.id === id);
  if (!d) {
    console.error(
      `未找到决策 "${id}"。已知：${(readJson('foundation.json').referenceDecisions ?? []).map((x) => x.id).join(', ')}`,
    );
    process.exit(1);
  }
  // 原样转录，不做摘要 —— 这正是本工具存在的意义。
  console.log(JSON.stringify(d, null, 2));
}

function find(keyword) {
  if (!keyword) {
    console.error('用法：node registry/tools/ask.mjs find <关键词>');
    process.exit(1);
  }
  const files = fs.readdirSync(path.join(ROOT, 'registry')).filter((f) => f.endsWith('.json'));
  let hits = 0;
  for (const f of files) {
    const text = fs.readFileSync(path.join(ROOT, 'registry', f), 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      if (line.includes(keyword)) {
        hits += 1;
        console.log(`registry/${f}:${i + 1}  ${line.trim().slice(0, 160)}`);
      }
    });
  }
  console.log(`\n共 ${hits} 处命中（${files.length} 个 registry 文件）。`);
  if (hits === 0)
    console.log('⚠️ 关键词不在 registry 里 ⇒ 任何关于它的断言都**不能**以 registry 为依据。');
}

switch (cmd) {
  case 'progress':
    progress();
    break;
  case 'component':
    component(rest[0]);
    break;
  case 'decisions':
    decisionList();
    break;
  case 'decision':
    decision(rest[0]);
    break;
  case 'find':
    find(rest[0]);
    break;
  default:
    console.log(
      [
        '用法：',
        '  node registry/tools/ask.mjs decisions [--open|--decided]   # 决策清单',
        '  node registry/tools/ask.mjs decision <id>                  # 单个决策全文（原样转录）',
        '  node registry/tools/ask.mjs component <name>               # 静态元数据 + 本轮两阶段状态',
        '  node registry/tools/ask.mjs progress                       # 组件 / foundation 进度',
        '  node registry/tools/ask.mjs find <关键词>                   # 全 registry 搜关键词',
      ].join('\n'),
    );
    process.exit(cmd ? 1 : 0);
}
