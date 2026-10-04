#!/usr/bin/env node
/**
 * assert-shard.mjs —— 断言某个 visual shard **真的把它的 case 全渲染了**。
 *
 * ── 为什么需要它 ────────────────────────────────────────────────────────────
 *
 * 视觉像素比对在 CI 上是**非阻塞**的（入库基线由 macOS + 系统 Chrome 生成，
 * Linux 渲染必然有差）⇒ 那一步带 `continue-on-error`。
 *
 * 但「**渲染前就崩了**」—— dist 没解包出来 / vite 打包失败 / 浏览器起不来 ——
 * 也会被 `continue-on-error` 吞成**绿**。2026-10-04 实测发生过：
 * 4 个 shard 都在 46s「绿」了，实际**一个 case 都没渲染**（`upload-artifact` 的
 * 通配路径把 `packages/<p>/dist/` 前缀剥掉了，见 ci.yml 的说明）。
 *
 * ⇒ 用 `run.mjs` 落下的摘要 JSON（`report-<i>-of-<n>.json`）做两条断言：
 *    ① `compared === expected`（没中途崩）
 *    ② `renderErrors === 0`（没有**渲染期报错** —— 那是 harness/环境问题，
 *       与「跨平台像素差异」是两码事，不该被非阻塞吞掉）
 *
 * 用法：node tests/visual/assert-shard.mjs <i>/<n>
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = process.argv[2];

if (!/^[1-9]\d*\/[1-9]\d*$/.test(arg ?? '')) {
  console.error('用法：node tests/visual/assert-shard.mjs <i>/<n>');
  process.exit(2);
}

const file = path.join(HERE, `report-${arg.replace('/', '-of-')}.json`);
if (!fs.existsSync(file)) {
  console.error(`❌ 找不到 ${path.relative(process.cwd(), file)} —— 本 shard 很可能在渲染前就崩了`);
  process.exit(1);
}

const s = JSON.parse(fs.readFileSync(file, 'utf8'));
console.log(
  `shard ${s.shard}：expected=${s.expected} compared=${s.compared} ` +
    `failed=${s.failed} renderErrors=${s.renderErrors}（全部 ${s.total} 组）`,
);

if (s.compared !== s.expected) {
  console.error(`❌ 只渲染了 ${s.compared}/${s.expected} 组 —— 中途崩了`);
  process.exit(1);
}
if (s.renderErrors > 0) {
  console.error(
    `❌ ${s.renderErrors} 组是**渲染期报错**（harness / 环境问题，不是跨平台像素差异）`,
  );
  process.exit(1);
}
console.log('✅ 本 shard 完整渲染，且无渲染期报错');
