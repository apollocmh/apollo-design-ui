#!/usr/bin/env node
/**
 * gen-component.mjs — 组件交付物脚手架。
 *
 * 背景（2026-09-21）：目前平均一天只能收口一个组件，其中相当一部分时间花在
 * 手搓 25~30 个交付物文件的样板结构上（8 个已完成组件平均 26 个文件/个）。
 * 本工具把「§6.1 一个组件的完整交付物」的目录与文件骨架一键生成，
 * 让开发时间花在 G1 分析与 G4 实现上，而不是复制上一组件改名。
 *
 * ── 它生成什么 ────────────────────────────────────────────────────────────────
 *   packages/ui/src/<kebab-name>/
 *   ├── PLAN.md                  # G0–G14 检查单 + 开工避坑清单（每次开工先读）
 *   ├── index.ts                 # withInstall 导出骨架
 *   ├── <Name>.vue               # 主实现骨架（默认 .vue，见 COMPONENT-RULES.md §2）
 *   ├── interface.ts             # 类型空壳（G2 产物落点）
 *   ├── style/token.ts           # Component Token 空壳（G3 产物落点）
 *   ├── style/index.ts           # 样式生成空壳（G4 产物落点）
 *   ├── demo/basic.vue + basic.md
 *   ├── __tests__/{index,demo,semantic,type,theme,a11y}.test.ts   # describe.todo 占位
 *   └── README.md / index.zh-CN.md / index.en-US.md
 *
 * ── 它刻意**不**做什么 ────────────────────────────────────────────────────────
 *   1. 不写任何真实实现 / 分析结论 —— G1 分析产物必须先于实现（AGENTS.md §2）。
 *   2. 不生成「假绿灯」测试 —— 测试骨架一律 `describe.todo`（在 vitest 报告里
 *      显示为 todo，而不是 pass）。本项目吃过「降级运行假绿灯」的亏，
 *      骨架绝不允许看起来像通过。
 *   3. 不更新 registry —— 11 个维度仍然只能由真实完成置 done（H12 / G12）。
 *
 * 用法：
 *   node registry/tools/gen-component.mjs <kebab-name> [--dry-run] [--force] [--root <dir>]
 *
 * 校验（领任务纪律的自动化，G0）：
 *   - <kebab-name> 必须存在于 registry/components.json
 *   - status 不得为 completed
 *   - 前置依赖（组件 + typeOnly + foundation）必须全部 completed，否则警告并要求 --force
 *   - 目标目录已存在时拒绝（--force 逐文件覆盖）
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'dry-run': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
    root: { type: 'string' },
  },
});

const name = positionals[0];
if (!name) {
  console.error(
    '用法: node registry/tools/gen-component.mjs <kebab-name> [--dry-run] [--force] [--root <dir>]',
  );
  process.exit(1);
}

const ROOT = resolve(values.root ?? process.cwd());
const registryPath = join(ROOT, 'registry/components.json');
if (!existsSync(registryPath)) {
  console.error(`✗ 找不到 ${registryPath}（--root 指向仓库根）`);
  process.exit(1);
}

const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
const comp = registry.components.find((c) => c.name === name);
if (!comp) {
  console.error(
    `✗ registry/components.json 中不存在组件 "${name}"。可执行清单见: node registry/tools/next-task.mjs`,
  );
  process.exit(1);
}
if (comp.status === 'completed') {
  console.error(`✗ "${name}" 已 completed，禁止重复开发（AGENTS.md §3）。`);
  process.exit(1);
}

// 依赖校验：未就绪默认拒绝，--force 才放行（明确打印警告，不静默）
const depComps = [...(comp.dependencies?.components ?? []), ...(comp.dependencies?.typeOnly ?? [])];
const depFoundations = comp.dependencies?.foundation ?? [];
const notReady = [];
const isDone = (s) => s === 'completed' || s === 'done';
for (const d of depComps) {
  const c = registry.components.find((x) => x.name === d);
  if (!c || !isDone(c.status)) notReady.push(`组件 ${d}`);
}
for (const f of depFoundations) {
  const fj = JSON.parse(readFileSync(join(ROOT, 'registry/foundation.json'), 'utf8'));
  const pkg = (fj.packages ?? []).find((p) => p.name === f);
  if (!pkg || !isDone(pkg.status)) notReady.push(`foundation ${f}`);
}
if (notReady.length > 0) console.warn(`依赖状态需评估: ${notReady.join(', ')}；允许先设计或维护。`);

const exportName =
  comp.exportName ??
  name[0].toUpperCase() + name.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const targetDir = join(ROOT, 'packages/ui/src', name);
// 目录可以是已有占位（空目录），但任何**目标文件**已存在都必须显式 --force —— 不静默覆盖
mkdirSync(targetDir, { recursive: true });

const files = new Map();

// ── 文件模板 ──────────────────────────────────────────────────────────────────

files.set(
  'PLAN.md',
  `# ${exportName} · 开发计划（G0–G14）

> 由 gen-component.mjs 生成。每次开工先过一遍「开工避坑清单」，Gate 完成一个勾一个。

## 状态

- registry status: **${comp.status}** · priority ${comp.priority} · complexity ${comp.complexity}
- 依赖组件: ${(comp.dependencies?.components ?? []).join(', ') || '无'}
- foundation: ${(comp.dependencies?.foundation ?? []).join(', ') || '无'}
- Apollo token 清单: ${comp.derived?.tokenCount ?? '待核对'}

## Gate 检查单

- [ ] G0 CLAIM —— 确认需求、调用者和实际依赖
- [ ] G1 ANALYZE —— 定义 Apollo 组件契约与真实场景，需要时写 docs/analysis/${name}.md
- [ ] G2 API DESIGN —— interface.ts 枚举 props/emits/slots/expose；v-model 取代 value+onChange
- [ ] G3 TOKEN —— style/token.ts 定义本库令牌及兼容默认值
- [ ] G4 IMPLEMENT —— <Name>.vue + style/index.ts；实现本库语义与样式契约
- [ ] G5 L1 单元 + G6 L2 交互 —— __tests__/index.test.ts
- [ ] G7 L3 类型（含负例，负例包在永不调用的闭包里）
- [ ] G8 L5 a11y —— axe + role/键盘断言
- [ ] G9 L6 视觉 —— 先建基线再 compare；对比不过先怀疑实现（px 字符串！）
- [ ] G10 L4 DOM / attrs / ARIA 契约；上游比较可选
- [ ] G11 DOCS —— Demo 覆盖公开 API 和真实场景
- [ ] G12 REGISTRY —— 按真实证据更新九个质量维度
- [ ] G13 BUILD —— pnpm run registry:check && lint && test && test:build 四道全绿
- [ ] G14 COMMIT —— commit message 带 [COMP:${name}]

## 开工避坑清单（全部真实踩过，详见 .workbuddy-ai/memory/PITFALLS.md）

1. **内联 style 的数字必须转 px 字符串** —— Vue patchStyle 不做转换（React 才有），裸数字被静默丢弃。
2. **L3 负例必须包在永不调用的闭包里** —— *.test-d.ts 会被 vitest 真执行。
3. **vitest 必须从仓库根跑** —— 在 packages/<x>/ 下跑不应用根 config，大面积假失败。
4. **demo 显式指定字体** —— 继承字体差异是平台差异，会让 L6 全红。
5. **Boolean prop 未传 ≠ false** —— withDefaults 里给 undefined，否则布尔语义静默失效。
6. **cssinjs 嵌套语义**：\`&\` 是复合选择器、普通键是后代 —— 搞反会让样式作用到所有形态。
7. **var(--apollo-*) 必须在 theme tokens.css 有声明** —— 写错不报错，由 test:build B7 兜底。
8. **凡是要断言「某决策/约定是这样」先跑 node registry/tools/ask.mjs**，不凭记忆。
9. **跑重型门禁前关 IDE** —— 实测 16 分钟 → 7 分 49 秒。
10. **改完文件回读** —— Edit 偶发报 success 但内容未变；biome 会重排 import。
`,
);

files.set(
  'interface.ts',
  `/**
 * ${exportName} 的类型定义（G2 产物落点）。
 *
 * ⚠️ 本文件由 gen-component.mjs 生成为空壳 —— G2 完成**前**它必须是空的；
 *    定义 props / emits / slots / expose，覆盖 Apollo 使用场景与兼容边界。
 *    禁止 any / as any / @ts-expect-error（H10）。
 */
export {};
`,
);

files.set(
  `${exportName}.vue`,
  `<script setup lang="ts">
/**
 * ${exportName} 主实现。遵循 Apollo 公开契约。
 *
 * ⚠️ 骨架由 gen-component.mjs 生成 —— 依据 AGENTS.md §2，G1 的分析产物
 *    （docs/analysis/${name}.md）必须先于本文件的实质实现存在。
 */
defineOptions({ name: 'A${exportName}' });

// TODO(G2): 依据 docs/analysis/${name}.md 定义 withDefaults(defineProps<${exportName}Props>(), {...})
// TODO(G4): 实现 Apollo 的 DOM / 语义类名 / ARIA；视觉值一律走 Token（H9）
</script>

<template>
  <!-- TODO(G4): 根类名走 getPrefixCls('${name}') 的结果（默认 apollo-${name}），不要写死 -->
  <div class="apollo-${name}">
    <slot />
  </div>
</template>
`,
);

files.set(
  'index.ts',
  `/**
 * ${exportName} 的公共导出。
 *
 * Apollo 的公共导出面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import ${exportName}Component from './${exportName}.vue';

/** ${exportName} 组件。注册名 \`A${exportName}\`（COMPONENT-RULES.md 规则 R2）。 */
export const ${exportName} = withInstall(${exportName}Component);

export default ${exportName};

// TODO(G2): export type { ${exportName}Props, ${exportName}Ref, ... } from './interface';
// TODO(G4): export { gen${exportName}Style } from './style';
// TODO(G4): export type { ComponentToken as ${exportName}ComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepare${exportName}ComponentToken } from './style/token';
`,
);

files.set(
  'style/token.ts',
  `/**
 * ${exportName} 的 Component Token（G3 产物落点）。
 *
 * 契约来源：Apollo 主题与组件设计，包含
 * prepareComponentToken。registry 数据：该组件 token 数 = ${comp.derived?.tokenCount ?? '?'}。
 *
 * 规则（divider 的 token.ts 是范本）：
 *   - 名称、默认值与公开类型保持一致
 *   - 别名派生的 token 落 var(--apollo-*)（B7 可校验、随主题自适应）
 *   - 字面量 token 以常量为唯一真源，由 style/index.ts 内联消费
 */
// TODO(G3): 定义 Apollo 令牌后替换本占位（tokenCount 为 0 时，写明「该组件无 Component Token」并删除本行）
export type ComponentToken = Record<string, never>;

// TODO(G3): export const prepareComponentToken = (token: AliasToken): Partial<ComponentToken> => ({ ... });
`,
);

files.set(
  'style/index.ts',
  `/**
 * ${exportName} 的样式生成（G4 产物落点）。
 *
 * 契约来源：Apollo 组件设计。
 * 选择器表达稳定的组件语义，视觉值消费主题令牌。
 *
 * 易错点（divider/affix 实测）：
 *   - cssinjs 的 \`&\` 是复合选择器、普通键是后代选择器，搞反会让样式串形态
 *   - 内联 style 的数字必须转 px 字符串 —— Vue patchStyle 不做转换，裸数字被静默丢弃
 *   - 每个 var(--apollo-*) 必须在 theme 的 tokens.css 有声明（test:build B7 校验）
 *   - 无字面视觉值（H9）；cssinjs 的 hash 包裹层不复制（差异 D5）
 */
// TODO(G4): 实现 gen${exportName}Style(prefixCls: string): string 并在 index.ts 导出
`,
);

files.set(
  'demo/basic.vue',
  `<script setup lang="ts">
// TODO(G11): 展示本库基本用法；demo 与 .md 成对出现，最终数量由 demo.test.ts 的 expectCount 钉死
import { ${exportName} } from '../index';
</script>

<template>
  <${exportName}>basic demo 占位</${exportName}>
</template>
`,
);

files.set(
  'demo/basic.md',
  `---
order: 0
title:
  zh-CN: 基本
  en-US: Basic
---

<!-- TODO(G11): 描述示例用途、状态与交互，与本示例代码一致 -->
\`\`\`vue
<script setup lang="ts">
import { ${exportName} } from '@apollo-design/ui';
</script>

<template>
  <${exportName}>basic demo 占位</${exportName}>
</template>
\`\`\`
`,
);

const todo = (layer, gate, extra = '') => `/**
 * L${layer} 测试占位 —— ${gate} 未开始。
 *
 * ⚠️ 刻意使用 describe.todo（报告里显示 todo 而不是 pass）：本项目不允许
 *    「假绿灯」——骨架测试绝不能看起来像通过。${extra}
 */
import { describe } from 'vitest';

describe.todo('${exportName} · L${layer}（${gate} 未开始）');
`;

files.set(
  '__tests__/index.test.ts',
  todo(
    '1/L2',
    'G5/G6',
    '\n * 范本见 divider/__tests__/index.test.ts（合并表镜像上游 testCases）。',
  ),
);
files.set(
  '__tests__/demo.test.ts',
  `/**
 * demo 冒烟测试占位 —— G11 未开始。
 *
 * ⚠️ 实现后必须：demos glob + **expectCount**（覆盖本库公开场景，
 * 防腐断言）；「不产生告警」是 demo 的硬约束。
 */
import { describe } from 'vitest';

describe.todo('${exportName} · demo 冒烟（G11 未开始，expectCount 待定）');
`,
);
files.set(
  '__tests__/semantic.test.ts',
  todo(
    '4',
    'G10',
    '\n * L4 DOM 契约验证本库语义、attrs 与 ARIA；只覆盖 SSR 可达形态（SSR 恒不固钉类差异注意）。',
  ),
);
files.set(
  '__tests__/type.test-d.ts',
  todo('3', 'G7', '\n * 负例必须包在永不调用的闭包里 —— *.test-d.ts 会被 vitest 真执行。'),
);
files.set('__tests__/theme.test.ts', todo('7 主题', 'G3'));
files.set(
  '__tests__/a11y.test.ts',
  todo(
    '5',
    'G8',
    '\n * axe 扫全部 demo（0 violation）+ 显式 role/键盘断言；「架构上不适用」要在 layerNotes 写明。',
  ),
);

files.set(
  'README.md',
  `# ${exportName} 实现说明

> 规则 R1：本文件必须记录（G11 前补齐）：

## 1. 组件契约

- 用途、公开 API、兼容边界与依赖

## 2. 行为与迁移记录

<!-- 同步到 COMPATIBILITY.md §9；分类只能是 BUG / INTENDED / PLATFORM / UPSTREAM（AGENTS.md §4.3） -->

## 3. .vue / .tsx 选择

- 默认 .vue。若用 .tsx，在此写明理由（COMPONENT-RULES.md §2 的三条件之一）。

## 4. Component Token 清单

<!-- registry 数据：token 数 = ${comp.derived?.tokenCount ?? '?'} -->

## 5. 已知缺口

<!-- 未支持的能力 + 落点（范本见 divider/README.md §7） -->
`,
);

for (const file of ['index.zh-CN.md', 'index.en-US.md']) {
  files.set(
    file,
    `# ${exportName}

<!-- TODO(G11): 中文/英文文档骨架。结构对齐 divider/index.zh-CN.md：
     何时使用 / 代码演示（demo 一一对应）/ API（props/events/slots/expose 表）/ Theme（token 表）。
     API 表由 interface.ts 的注释生成口径书写；@desc/@descEN 描述本库公开行为。 -->
`,
  );
}

// ── 写盘 ─────────────────────────────────────────────────────────────────────

let created = 0;
let skipped = 0;
for (const [rel, content] of files) {
  const abs = join(targetDir, rel);
  if (existsSync(abs) && !values.force) {
    skipped += 1;
    continue;
  }
  if (values['dry-run']) {
    console.log(`  [dry-run] ${rel}`);
    created += 1;
    continue;
  }
  mkdirSync(join(abs, '..'), { recursive: true });
  writeFileSync(abs, content, 'utf8');
  created += 1;
}

const warnLine = notReady.length > 0 ? `\n⚠️ 依赖状态需后续验证: ${notReady.join(', ')}` : '';
console.log(`\n✓ ${name} 骨架就绪: ${created} 个文件${skipped ? `（跳过已存在 ${skipped} 个）` : ''}${values['dry-run'] ? '（dry-run，未写盘）' : ''}${warnLine}
下一步（按 WORKFLOW.md 评估适用检查）:
  1. 读 packages/ui/src/${name}/PLAN.md —— Gate 检查单 + 开工避坑清单
  2. G1: 分析 Apollo API、用户场景与调用者→ docs/analysis/${name}.md
  3. 按验证证据更新计划与 Registry，不把生成骨架当作完成`);
