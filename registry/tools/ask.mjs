#!/usr/bin/env node
/**
 * `ask` —— 把「读 registry 原文」这件事**机械化**。
 *
 * ── 为什么需要它 ──────────────────────────────────────────────────────────────
 *
 * `AGENTS.md` §5 的事实来源优先级是：
 *   **用户指令 > 仓库规范 > `registry/*.json` > antd 产物/源码 > 文档 > 模型先验**
 *
 * 但 2026-09-21 一个会话里连续三次**跳过 `registry/*.json` 直接凭记忆下结论**，
 * 三次都错（详见 `.workbuddy-ai/memory/2026-09-21.md`）：
 *   1. 「作用域 typecheck 快 22 倍」—— 单次异常测量
 *   2. 「a11y 只收集 2/9 个文件」—— 降级运行给的假绿灯
 *   3. 「skeleton 语义化与决策 B 不一致」—— 决策**从未裁决**，且我把 A/B 记反了
 *
 * ⇒ 与其反复叮嘱「要读原文」，不如让读原文**比凭记忆更省事**。
 *    本工具只做一件事：**把 registry 里的原始记录原样打出来**，不做解释、不做摘要。
 *
 * ── 用法 ──────────────────────────────────────────────────────────────────────
 *
 *   node registry/tools/ask.mjs decisions [--open|--decided]   # 决策清单
 *   node registry/tools/ask.mjs decision <id>                  # 单个决策全文
 *   node registry/tools/ask.mjs component <name>               # 组件状态 + 11 维度
 *   node registry/tools/ask.mjs progress                       # 组件 / foundation 进度
 *   node registry/tools/ask.mjs find <关键词>                   # 全 registry 搜关键词
 *
 * ⚠️ 输出是**原样转录**。若本工具的输出与你的记忆冲突，**以本工具为准**。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, 'registry', p), 'utf8'));

const [cmd, ...rest] = process.argv.slice(2);
const flag = (name) => rest.includes(name);

/** 11 个维度（顺序即 `registry/components.json` 的约定）。 */
const DIMS = [
  'antdApi',
  'api',
  'token',
  'style',
  'unit',
  'interaction',
  'type',
  'a11y',
  'visual',
  'compat',
  'docs',
];

function progress() {
  const comps = readJson('components.json').components;
  const done = comps.filter((c) => c.status === 'completed');
  console.log(`组件：${done.length} / ${comps.length} completed\n`);
  for (const c of done) console.log(`  ✅ ${c.name}`);
  const inProg = comps.filter((c) => c.status === 'implementing');
  if (inProg.length) {
    console.log(`\n进行中：${inProg.length}`);
    for (const c of inProg) console.log(`  🔧 ${c.name}`);
  }

  const f = readJson('foundation.json');
  const pkgs = f.packages ?? [];
  const fdone = pkgs.filter((p) => p.status === 'completed');
  console.log(`\nfoundation：${fdone.length} / ${pkgs.length} completed`);
  for (const p of pkgs.filter((x) => x.status !== 'completed')) {
    console.log(`  🔧 ${p.name} (${p.status})`);
  }
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
  console.log(`# ${c.name}  status=${c.status}\n`);
  for (const d of DIMS) {
    const v = c[`${d}Status`];
    const mark = v === 'done' ? '✅' : v === 'n/a' ? '➖' : '⬜';
    console.log(`  ${mark} ${d.padEnd(12)} ${v ?? '(缺)'}`);
  }
  if (c.notes) console.log(`\n## notes\n${c.notes}`);
}

function decisionList() {
  const ds = readJson('foundation.json').openDecisions ?? [];
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
  const d = (readJson('foundation.json').openDecisions ?? []).find((x) => x.id === id);
  if (!d) {
    console.error(
      `未找到决策 "${id}"。已知：${(readJson('foundation.json').openDecisions ?? []).map((x) => x.id).join(', ')}`,
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
        '  node registry/tools/ask.mjs component <name>               # 组件状态 + 11 维度',
        '  node registry/tools/ask.mjs progress                       # 组件 / foundation 进度',
        '  node registry/tools/ask.mjs find <关键词>                   # 全 registry 搜关键词',
      ].join('\n'),
    );
    process.exit(cmd ? 1 : 0);
}
