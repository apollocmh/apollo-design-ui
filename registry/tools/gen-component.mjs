#!/usr/bin/env node
/**
 * Create component file skeletons without claiming tasks or changing audit state.
 * Existing implementations are preserved unless --force is explicitly requested.
 * The generated plan follows WORKFLOW.md's architecture / final acceptance stages.
 * Usage: gen-component.mjs <kebab-name> [--dry-run] [--force] [--root <dir>]
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
// Imports identify consumers and capabilities, not prerequisite final acceptance.
const componentNames = new Set(registry.components.map((entry) => entry.name));
for (const dependency of [
  ...(comp.dependencies?.components ?? []),
  ...(comp.dependencies?.typeOnly ?? []),
]) {
  if (!componentNames.has(dependency))
    throw new Error(`Unknown component dependency: ${dependency}`);
}
const exportName =
  comp.exportName ??
  name[0].toUpperCase() + name.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const targetDir = join(ROOT, 'packages/ui/src', name);
// 目录可以是已有占位（空目录），但任何**目标文件**已存在都必须显式 --force —— 不静默覆盖
if (!values['dry-run']) mkdirSync(targetDir, { recursive: true });

const files = new Map();

// ── 文件模板 ──────────────────────────────────────────────────────────────────

files.set(
  'PLAN.md',
  `# ${exportName} · 整改计划

当前任务状态只写 registry/vue-native-audit.json；本文件只记录本项范围、契约与必要验证，不重复维护进度表。

## 第一阶段：架构整改

- 说明要解决的真实 Vue 使用问题和影响面；复用仍有效的审计、测试与示例。
- 追踪 Props、Slots、Emits、v-model、attrs、Expose、响应式与共享职责的相关链路，按根因修复。
- 实现、类型、关键行为回归和必要 Demo 同步；共享层变更立即验证受影响消费者。
- 针对性类型和核心行为检查通过即可完成本项架构整改；记录非阻塞缺陷的影响及延期理由。
- 核心契约、数据、资源安全或集成阻塞必须解决，不能标为通过。
- 文件归属：packages/ui/src/${name}；共享出口、状态和基础层由集成人统一修改。
- 静态依赖组件：${(comp.dependencies?.components ?? []).join(', ') || '无'}。
- 静态基础包依赖：${(comp.dependencies?.foundation ?? []).join(', ') || '无'}。imports 不自动构成工作阻塞。

## 第二阶段：冻结版本全库验收

全部架构整改结束后，统一对同一冻结版本执行既有九维标准；一次构建，消费者读取同一产物。
本阶段不逐组件重跑完整视觉、覆盖率、全库测试或发布消费。

## 验证记录

只记录本项实际执行的命令、结果、尚未验证与非阻塞边界。证据有效则沿用，变更影响到的部分再补查。
`,
);

files.set(
  'interface.ts',
  `/**
 * ${exportName} 的类型定义（G2 产物落点）。
 *
 * 本文件由 gen-component.mjs 生成为类型骨架；
 *    定义 props / emits / slots / expose，覆盖 Apollo 使用场景与兼容边界。
 *    禁止 any / 强制断言掩盖缺陷；类型负例可用带原因的 @ts-expect-error。
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
 * 骨架由 gen-component.mjs 生成；先明确本次公开契约、真实场景与针对性验证，不重复已有审计。
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

> 记录当前公开契约和必要迁移；阶段状态见 registry/vue-native-audit.json。

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

console.log(`\n✓ ${name} 骨架就绪: ${created} 个文件${skipped ? `（跳过已存在 ${skipped} 个）` : ''}${values['dry-run'] ? '（dry-run，未写盘）' : ''}
下一步（按 WORKFLOW.md 评估适用检查）:
  1. 读 packages/ui/src/${name}/PLAN.md，明确本项范围和文件归属
  2. 完成针对性类型、核心行为和必要 Demo；共享变更验证消费者
  3. 按真实证据更新唯一任务状态，不把骨架或未知结果当作完成`);
