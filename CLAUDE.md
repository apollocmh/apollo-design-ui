# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

`@apollo-design/ui` 是以 **Ant Design React 6.6.4 为兼容性规格**、用 **Vue 3.5 + TypeScript 原生实现**的 UI 组件库。antd 是行为/视觉/DOM/API 的参考，**不是代码来源**：禁止引入 React 运行时、`@rc-component/*`、`@ant-design/cssinjs`，禁止机械翻译 JSX/hooks。

**Phase 2（2026-10-06 用户裁决）**：antd 已从「答案的判据」降为「参考实现」。根节点一律用 Vue 原生 `class` / `style`（不得声明 `rootClassName` / `rootStyle` prop）；非根目标（浮层根 / 内层元素 / item 级）用本仓 `classNames.*` / `styles.*` 槽位，上游名保留但标 `@deprecated`。

## 权威文档与事实来源

冲突时优先级：**用户当前指令 > 仓库规范 > `registry/*.json` > antd 源码/产物 > antd 文档 > Agent 先验知识**。

| 文件 | 作用 |
|---|---|
| `AGENTS.md` | 行为契约：H1–H12 硬禁止、10 步开发循环、验收纪律。**只能由用户修改。** |
| `COMPATIBILITY.md` | React→Vue 映射规则 + 差异登记表（顶部有 Phase 2 阶段声明） |
| `ARCHITECTURE.md` | 13 个包的分层、依赖规则 R1–R7、Token 与构建契约 |
| `COMPONENT-RULES.md` | 单组件目录、SFC 骨架、Props/Slot/Token/DOM/a11y 规范 |
| `TESTING.md` | 七层测试、覆盖率、反模式 |
| `WORKFLOW.md` | G0–G14、DoD、并行/泳道协议 |
| `.workbuddy-ai/memory/MEMORY.md` | 长期判据（会话注入）；`PITFALLS.md` 是坑全文；`environment.md` 是命令环境 |
| `docs/KNOWN-ISSUES.md` | 开放欠账与「不要再排查」清单 |
| `.workbuddy-ai/skills/vue-native-audit/SKILL.md` | Vue-native 审计/重构流程；进度在 `registry/vue-native-audit.json` |

> 部分文档有滞后：`AGENTS.md` §0/§8、`README.md`、`ARCHITECTURE.md` §10.2 仍停留在 Phase 1 口径。以 `COMPATIBILITY.md` 顶部阶段声明、`registry/*.json` 与 `MEMORY.md` 为准；不要擅自改 `AGENTS.md`。

**禁止凭记忆描述 antd / rc 行为**。查事实：

```bash
node registry/tools/ask.mjs progress
node registry/tools/ask.mjs component <name>
node registry/tools/ask.mjs decisions --open
node registry/tools/ask.mjs decision <id>    # 输出原文全文，不是摘要
node registry/tools/ask.mjs find <关键词>
```

## 常用命令

### 环境前提

- Node ≥ 22.12，pnpm 12.4.2（corepack 锁定）。
- 本机 `pnpm` 可能不在 PATH（只有 corepack）：macOS 上用 `/tmp/pnpm-shim/pnpm` 包一层；Windows 按实际环境适配。**不要用 `pnpm -r run build`**（该入口不可用）。
- 构建 / 视觉 / `build:ui` 前置 `CODEBUDDY_SAFE_DELETE_ENABLED=0`；跑测试可额外设 `CODEBUDDY_BROKERED_FS_HOOK_ENABLED=0 CODEBUDDY_SAFE_DELETE_SANDBOX=0`（可提速 5–8 倍，仅用于只读任务）。
- 所有 vitest 命令必须从**仓库根**运行，否则不应用根配置的 jsdom 环境。

### 安装 / 开发 / 构建

```bash
pnpm install
pnpm dev                 # 文档站开发服务器
pnpm docs:dev            # 同上
pnpm build:ui            # 只构建 @apollo-design/ui（跑 L6 前必需）
pnpm build:docs          # theme + ui + docs 构建
node tests/build/run.mjs # 权威 L7 构建门禁（含产物/体积/exports 检查）
```

### Lint / 类型

```bash
pnpm lint                # = lint:types + lint:format
pnpm lint:types          # vue-tsc --noEmit -p tsconfig.json
pnpm lint:format         # biome check .
pnpm typecheck:build     # 可选增量 typecheck，不替代 lint:types
```

### 测试

```bash
pnpm test                # unit + dom-contract + a11y + theme
pnpm test:unit           # L1+L2
pnpm test:dom            # L4 DOM 契约
pnpm test:a11y           # L5
pnpm test:theme
pnpm test:types          # L3（不在 verify:full 内，收口必跑）
pnpm test:visual         # L6（不在 verify:full 内，需先 build:ui）
pnpm test:build          # L7 构建门禁
pnpm test:compat         # 双实现兼容性比对
pnpm verify:full         # registry:check + lint + test + test:build
```

单文件 / 单组件：

```bash
node_modules/.bin/vitest run --project unit packages/ui/src/button/__tests__/index.test.ts
node scripts/verify-component.mjs <kebab-name> [--visual]   # 单组件反馈，不替代全仓收口
node tests/visual/run.mjs --component <kebab> --no-build --mode compare
```

### Registry / 任务

```bash
node registry/tools/next-task.mjs            # 唯一权威的「下一个任务」
node registry/tools/next-task.mjs --parallel # 当前全部可并行任务
pnpm run registry:check                      # E1–E18 全量校验
pnpm run gen:component <kebab-name>          # 生成 17 个组件交付物骨架
node registry/tools/foundation-status.mjs    # 改过 foundation 包后刷新度量
```

生成器顺序固定：`gen-registry → foundation-status → gen-workstreams → validate-registry`；乱序会让 `registry:check` 报「已过期」。`registry/*.json` 是生成物：派生字段禁止手改，进度字段可人工维护但必须指向证据。

## 架构

### Monorepo 分层

```
L0  utils | theme | icons
L1  motion | portal | position | a11y | virtual-list
L2  overlay | form-core | picker | locale
L3  ui（72 个组件 + ConfigProvider + 全局样式）
T   test-utils（private）
    packages/docs（private，Vite + vite-ssg 文档站，已弃用 VitePress）
```

依赖只能向下（R1–R7）：L0 互不依赖（`utils` 是唯一公共底座），只有 `ui` 产组件 CSS，发布包零 `@ant-design/*` 运行时依赖。包边界判据：**≥2 个上层组件消费且不绑定具体视觉语义**才升级为独立包；否则留在 `ui/src/<component>/engine/` 或 `_internal/`。

### Registry 驱动开发

`registry/` 是任务来源与机器可读事实：`components.json`（72×11 维度）、`foundation.json`（13 包×6 维度 + 决策）、`workstreams.json`（泳道/批次）、`tokens.json`、`dependencies.json`、`vue-native-audit.json`。开发任务必须由 `next-task.mjs` 决定，不得凭兴趣挑组件；组件完成必须把 11 个维度置 `done` 并落盘。

### 样式 / Token

零运行时静态 CSS 是默认路径：Token 层级 `Seed 34 → Map 140 → Alias 82/222 → Component 70 组/517`，组件 CSS 全部消费 `var(--apollo-*)`，禁止硬编码颜色/圆角/高度/间距/字体/阴影/border。运行时动态 token 走 `theme` 包自研注入路径，两条路径变量命名必须一致。Component Token 的名称/数量/默认值与 antd 一致。

### 组件结构

`packages/ui/src/<kebab-name>/`：`index.ts`、主实现（默认 `.vue`；`.tsx` 仅纯渲染/复杂泛型例外并需 README 说明）、`interface.ts`、`style/token.ts` + `style/index.ts`、`demo/`、`__tests__/`、`index.zh-CN.md` / `index.en-US.md`、`README.md`。

- SFC：`defineOptions({ name: 'AButton' })`、`inheritAttrs: false` + 显式 attrs 合并、`withDefaults` 默认值与 antd 一致。
- ReactNode / render prop → 插槽（规则 C8-R2）；文本类保留 string prop 且 slot 优先；命令式 config / ConfigProvider componentConfig / 对象子字段 / 内部组件是 VNode 豁免。
- 事件：React `onXxx` → emit `xxx`，payload 顺序一致；原生 DOM 事件经 `$attrs`；受控 prop 同时发 `update:xxx`。
- 类型名与 antd 一致但必须重新定义，禁止从 antd / rc 导入类型。

### 文档站

`packages/docs` 是 Vue 3 + Vite + vite-ssg 独立应用；组件页内容来自 `packages/ui/src/<c>/index.*.md` 与 `demo/`。关键约定：显式 `base: import.meta.env.BASE_URL`；组件样式显式 `import '@apollo-design/ui/style.css'`；vite alias 是前缀匹配（`…/style.css` 必须排在 `@apollo-design/ui` 前）；`cssMinify: 'esbuild'`；SSG 产出 flat `.html`，客户端路由需剥 `.html` 守卫。

## 开发纪律要点

- **10 步开发循环 / G0–G14** 不得跳步：分析产物必须先于实现；测试失败按「实现 → Token → 测试写错（说明原因）→ 上游特殊行为（登记）」顺序排查，绝不放宽断言。
- 任何兼容性差异必须登记到 `COMPATIBILITY.md` §9.2；「跟随的上游缺陷」登记到 §9.2.1 并附钉住它的测试名。
- 元判据：**「对齐 antd ≠ 复制 antd 的缺陷」**；上游同款不是拒绝修复的理由，但也不得与已入库的 L4/L6 基线或上游正确行为分叉。
- 收口证据必须是可复现命令 + 真实输出；新增视觉用例后必须亲眼看基线图。
- 多文件机械改动不要用 Edit 批量（会「部分落盘却报 success」）⇒ 写 Node 脚本并断言「恰好命中 N 次」。

## 高频坑（完整清单见 `PITFALLS.md` §0）

- 改组件源码后跑 L6 前必须 `pnpm build:ui`——视觉层解析 `packages/ui/dist`，否则差异率逐位不变。
- `{ class: X, ...attrs }` 会被末尾 `...attrs` 整体顶掉；`inheritAttrs: false` 且不读 `attrs` 会静默丢弃调用方 `class`/`style`。
- Vue 的 `provide/inject` 是 setup 期快照：跨层状态必须传 ref/computed/getter；`watch(immediate)` 不能替代挂载时执行。
- VTU 默认 stub `<Teleport>` ⇒ 断言「落进目标 DOM」会假绿，需 `stubs: { teleport: false }`；多根组件 `wrapper.element` 是父容器。
- 过滤后的 vitest 用例数不可信；大批量迁移后必须跑全量 unit + dom-contract + types。
- 本仓禁用 `git stash push -u`（会导致 index 失同步）；不要用 `gate | tail && next-step`（管道退出码会掩盖失败）。
- `registry/*.json` 纯 `generatedAt` 时间戳抖动不要提交；改 foundation 包后需重跑 `foundation-status.mjs`。

## Memory / 交接协议（Claude ↔ WorkBuddy）

长期记忆在 `.workbuddy-ai/memory/`，WorkBuddy AI 与 Claude Code 共用同一套文件。**Claude 会话结束前必须把进度写回这里**，否则切回 WorkBuddy 会出现断层。

### 会话开始

1. 读 `.workbuddy-ai/memory/MEMORY.md` §0（接手顺序）、`environment.md`、`docs/KNOWN-ISSUES.md` §1。
2. 用 `node registry/tools/ask.mjs progress` 与 `node registry/tools/next-task.mjs` 确认当前状态与下一个任务。
3. 读最近日期的 `YYYY-MM-DD.md`，了解上一次会话做了什么、验证到哪一步。

### 会话结束 / 里程碑

1. **追加当天日志** `.workbuddy-ai/memory/YYYY-MM-DD.md`（不存在则新建）。沿用现有格式：`## 交付：<主题>` / 根因 / 门禁 / 发布 / 记忆维护。必须记录：改了什么、根因、验证命令与真实输出、未完成项、下一步。
2. **更新 `MEMORY.md` §5 进度**：组件/foundation 数量、开放 issue、当前分支与 HEAD、最近提交。只写一行快照，不写过程。
3. **新增坑写 `PITFALLS.md`**：同时在 §0 索引补一行；改判据时 `MEMORY.md` 与 `PITFALLS.md` 两处同步。
4. **修掉 `docs/KNOWN-ISSUES.md` 的条目**：从 §1 移除，在 §3 留痕表加一行 commit。
5. 记忆提交单独成 commit，沿用 `chore(memory): ...` 前缀。

### 边界

- `MEMORY.md` 只放「仓库文档没有的判别式」，一行一条；不要重复 `AGENTS.md` / `ARCHITECTURE.md` 等已有规则。文件超过 ~18KB 会被会话注入截断。
- `AGENTS.md` 只能由用户修改；记忆不能替代规范裁决。
- 记忆里的事实必须能在代码/测试/命令输出中找到依据；不确定的标注「待验证」。
- 每日日志是**事实记录**，不是规范修订；规范变更仍走各自文档与用户裁决。
