# MEMORY.md — 项目长期约定

> `@apollo-design/ui` 的跨会话长期约定。日常进展写在 `YYYY-MM-DD.md`。

---

## 项目本质

用 **Vue 3 + TypeScript** 重新实现 Ant Design。**antd React 是兼容性规格，不是代码来源。**
兼容目标：antd **6.6.4**（`registry/components.json` 的 `antdVersion`）。

事实来源优先级：用户指令 > 仓库规范文件 > `registry/*.json` > antd 固定版本产物/源码 > 官方文档 > 模型先验。
**禁止凭记忆描述 antd 的 API/行为**，必须读产物或源码：
`/tmp/antd-src/package/`（产物）、`/tmp/antd-repo/ant-design-master/`（源码+测试+文档）。

---

## 硬约束（详见 `AGENTS.md` §1）

禁 React runtime ｜ 禁复制 antd 实现 ｜ 禁机械翻译 ｜ 禁模拟 React 生命周期 ｜
禁 `@rc-component/*` ｜ 禁 `@ant-design/cssinjs` 家族 ｜ 禁改测试预期让红灯变绿 ｜
禁硬编码视觉值 ｜ 禁 `any` ｜ 禁跨层反向依赖 ｜ 禁跳过 Registry 更新。

---

## 怎么取任务

```bash
node registry/tools/next-task.mjs              # 唯一权威
node registry/tools/next-task.mjs --foundation # foundation 包视图
```

- 组件清单的 `blockedBy` **只表达组件依赖组件**，不表达「组件依赖 foundation 包」。
  `next-task` 会打印告警提示先做 foundation —— **必须服从**，否则是虚假进度。
- **一轮一个组件/包**：走完 G0→G14 全部 14 道 Gate 再停下汇报，不许批量推进。

### foundation 包（`registry/foundation.json`）

组件 `completed` 而 foundation 依赖只有骨架 = **虚假进度**。

- `phase2Order` = 推进顺序（含 AR1/AR2 的 PoC 槽位，允许早于依赖包）
- `derived.implOrder` = 严格拓扑序（回答「可开始完整实现的下一个」）
- `testLayers` 的 `n/a` 必须有 `layerNotes`（E16 强制）—— 防「用 n/a 掩盖未做」
- `openDecisions` 是「项目卡在什么问题上」的登记处，`blockedBy` 只能引用这里的 id（E17）
- `status: completed` 需同时满足：6 维度 done/n/a + 7 测试层 done/n/a + `thresholds.met` +
  `build.status==='passing'` + `blockedBy` 为空

**派活前先读 `dependencies.json` 的 `purpose`** —— 凭包名猜职责会出错
（曾把 DOM 测量层误派给 `overlay`，实际在 `position`）。

---

## 架构

### 分层（依赖只能同层或更低）

```
L3  ui
L2  form-core / picker / overlay / locale
L1  motion / portal / position / a11y / virtual-list
L0  utils / theme / icons
测试  test-utils
```

### 包边界判据

> 能力只有在「消费者 ≥ 2」且「无视觉语义」时才升级为独立包，否则留在 `packages/ui/src/<component>/engine/`。
> 因此不照搬 antd 的 37 个 rc 包，只建 13 个。

### 可复用（不要重写）

`@ant-design/icons-svg`｜`@ant-design/colors`｜`@ant-design/fast-color`｜`dayjs`｜`scroll-into-view-if-needed`

### 组件间共享代码

**必须放 `packages/ui/src/_internal/` 叶子模块。** 组件间禁止互相 import 组件目录
（否则复现 antd 的 4 组假循环依赖）。

### 前缀与样式（✅ 已裁决，见下）

- `prefixCls` 默认 **`apollo`**，ConfigProvider 可覆盖为 `ant`
- 零运行时静态 CSS 是**默认与推荐**路径，但不是唯一 —— `theme` 需同时提供运行时注入路径
  （自研，不是引入 cssinjs）

---

## 已裁决的开放决策（2026-09-16）

| id | 裁决 | 影响 |
|---|---|---|
| `build-output-contract` | **A** 只保留 `dist/` 单文件 | 解锁 13 个包的 pkg 维度 |
| `prefix-cls-default` | **A** 默认 `apollo` | theme 收口 + 全部组件 DOM 契约 |
| `zero-runtime-mode` | **B** 零运行时默认 + 提供运行时注入路径 | theme 需维护两条注入路径，变量命名必须一致 |
| `event-name-rewrite` | **A** 接受 `onKeyDown → onKeydown` | utils API 契约 + D8 |

**仍未裁决**：`use-id-test-env`（仅测试写法）等 5 项不阻塞 foundation 的。

### 裁决要走命令行，不要手改 JSON

```bash
node registry/tools/foundation-status.mjs --decide <id> --choice <A|B|C> --by "<谁>" --note "<理由>"
```

`--choice` 必须命中 `registry/source/open-decisions.mjs` 里的选项，否则拒绝写入。
决策**内容**在 `source/open-decisions.mjs`（工具拥有，每次覆盖），只有 5 个运行时字段从 json 反向合入。

---

## 工具链

| 命令 | 作用 |
|---|---|
| `next-task.mjs` | 下一个任务（唯一权威） |
| `foundation-status.mjs` | foundation 进度；`--package <dir>` / `--verify` / **`--verify-build`** / **`--decide`** / `--check` |
| `gen-registry.mjs` | 刷新 Registry（保留进度字段） |
| `validate-registry.mjs` | 18 项规范检查（E1-E18） |
| `gen-workstreams.mjs` | 并行编排 |
| `scaffold-packages.mjs` | 生成包骨架；**`--force-pkg` 只刷 package.json**，`--force` 会清空 `src/index.ts` |
| `tests/build/run.mjs` | **L7 构建门禁**；`--no-build` / `--package <dir>` / `--strict` / `--json` |

**派生字段禁止手工编辑**（下次生成会被覆盖）。进度字段由 Agent 写入。

### 坑（实测）

1. **Bash 的 `grep` 对某些文件静默返回空** —— 一律用 Grep 工具。
2. `biome-ignore` 必须紧贴目标行，reason 同行。
3. 别盲信 lint 自动修复：`noConfusingVoidType` 建议 `() => void | Cleanup` → `undefined | Cleanup` 会破坏 API，先用 `tsc` 验证。
4. biome 2.x 键名变了：`files.ignore`→`files.includes`、`overrides[].include`→`includes`、`rules.recommended`→`preset`。
5. `passWithNoTests` 是 vitest **根级**选项，写进 `projects[]` 不生效。
6. 新增生成的 registry 文件要同步加进 `biome.json` 忽略列表。
7. **必须从仓库根跑 vitest**（`node_modules/.bin/vitest run --project unit`）。
   在 `packages/<x>/` 下跑不会应用根 config 的 jsdom 环境，会大面积假失败。
8. `pnpm install` / `pnpm -r build` 在本环境会挂起（疑似网络）。用 `node_modules/.bin/unbuild`
   逐包构建代替。

---

## 环境

Node ≥22.12（managed: `~/.workbuddy-ai/binaries/node/versions/22.22.2-2/bin/node`）｜
pnpm 12.4.2（`.npmrc` `hoist=false`）｜TypeScript 锁 5.9.x（unbuild 3.6.1 peer 要求）｜
Vitest 5｜Playwright + pixelmatch

---

## 架构风险

| # | 风险 | 状态 |
|---|---|---|
| AR1 | 浮层定位几何 | ✅ 几何内核 PoC 通过（5000 组差分与 antd 逐位一致）。**DOM 测量外壳仍在 `position` 包内未完成** |
| AR2 | motion 五类语义 | ⚠️ **WIP 且当前红灯**（见下） |
| AR3 | picker 状态机 | 待验证 |
| AR4 | 零运行时下 `classNames`/`styles` 优先级 | 随 config-provider |
| AR6 | Vue 泛型对 `Table<T>` 的表达力 | 待验证 |

### PoC 的 DoD（`WORKFLOW.md` §1.1.1）

1. 对照物必须**机械移植**，不是理解重写 —— 否则差分通过只说明两边都想通了
2. 确定性 PRNG 千级用例，写死种子
3. oracle 上留开关，使「这是唯一差异」成为可证伪断言
4. **必须写明「没有证明什么」**
5. `pocStatus=done` 必须同时填 `pocResult`（E16 强制）

---

## 兼容性差异

任何 L1-L5 差异必须登记到 `COMPATIBILITY.md` §9（编号 D1、D2…），未登记视为 BUG。
已登记 13 项（D1-D13）。四类：`INTENDED` / `PLATFORM` / `DEFECT` / `UNDECIDED`。
**`DEFECT` = antd 自身缺陷，我们有意不复刻**（如 D13 相交面积算式）。

校验器从 §9.2 的 Markdown 表格**刮取**真实存在的 `D<n>` —— 引用不存在的编号会报错。

---

## ⚠️ 当前未决事项（下次接手先看这里）

1. **`packages/motion/src/**` 是未提交的上次会话 WIP（AR2 PoC），3 个用例红灯。**
   已定位根因两条，都指向「Vue `<Transition>` 不能原生满足 antd 类名契约」：
   - Vue 的 `onBeforeEnter` 钩子**在添加 from/active 类之前**触发 → 在钩子里读 classList 只能读到 `['box']`
   - Vue 只挂 `from/active/to` 三类，**不会挂裸的 `{name}` 类**（antd 的序列里始终有它）
   修正方向：测量点改到 `onEnter`，并由我们的 CSSMotion 包装层显式补上 `{name}` 类。
   **这属于 AR2 PoC 工作项，不是本轮范围，不要顺手改测试让它变绿。**

2. L7 门禁的 B5/B6/B7/B8 仍是 PENDING（只对 `theme` / `ui`），需 CSS 产物与组件落地后才能启用。

3. 用户此前要求：**规划完成后等待确认，不要自行进入大规模组件实现。**
