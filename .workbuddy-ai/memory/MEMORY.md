# MEMORY.md — 项目长期约定

> 只放仓库文档里没有的。规则本体：`AGENTS.md`/`WORKFLOW.md`/`TESTING.md`/`COMPATIBILITY.md`/`ARCHITECTURE.md`。
> **坑的全文 + 按主题的判据索引**：同目录 `PITFALLS.md`（**查坑先看 §0 索引**）；环境专题：`test-perf-diagnosis.md`。

## 事实来源与任务

Vue 3 + TS 重写 Ant Design（**兼容规格，非代码来源**），目标 antd **6.6.4**。优先级：用户指令 > 仓库规范 > `registry/*.json` > antd 产物/源码 > 文档 > 先验。
- 取任务唯一权威：`node registry/tools/next-task.mjs`（并行 `--parallel`；一轮一包，G0→G14）。
- **禁止凭记忆描述 antd**：读 `/tmp/antd-src/package/`（/tmp 会清，缺了按 PITFALLS 42 恢复）；说「某决策是这样」前先跑 `ask.mjs`（`decision <id>` 出**原文**）。
- 派生字段（手改被覆盖）：`notDo`/`publicApi`/包 package.json ← `scaffold-packages.mjs`；`foundation.json` ← `foundation-status.mjs`；components/dependencies/tokens/workstreams ← `gen-*.mjs`。
- 🚨 跨运行**只保留** `status` + 11 维度 + `blockers` + `layerNotes` ⇒ **收口 = 直接改 `registry/components.json` 这 13 项，再重跑生成器**。⚠️ `notes` 不保留 ⇒ 注记写 `registry/source/components.meta.mjs`(220)。

## 环境（实测）

Node ≥22.12（managed）｜pnpm 12.4.2｜TS 5.9｜Vitest 5｜Playwright（`channel:'chrome'`）。
- 🚨 `pnpm -r run build` 永不可用；权威构建门禁 `CODEBUDDY_SAFE_DELETE_ENABLED=0 node tests/build/run.mjs`。**三个「自己删目录」的入口都要带它**：`tests/build/run.mjs`、`tests/visual/run.mjs`、`pnpm build:ui`（删 `.dts-tmp`，不带则 exit 1）。
- 🚨 本机 `pnpm` **不在 PATH**（只有 corepack）⇒ 造 `/tmp/pnpm-shim/pnpm` 包一层，再 `PATH=/tmp/pnpm-shim:$PATH pnpm run <script>`。长命令一律 `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1`（「超时无输出」先查 corepack 下载提示）。`exit 137`+零日志 ≠ OOM，先怀疑前台 120s 超时。
- 🚨 **node 工具慢 5–8 倍的真凶 = WorkBuddy 沙箱的 brokered-fs hook**（298）：`open()` 走 IPC ≈6–10ms/次，jsdom 652 个 `.js` ⇒ **每测试文件 +5.8s**。跑测试/构建**前置** `CODEBUDDY_BROKERED_FS_HOOK_ENABLED=0 CODEBUDDY_SAFE_DELETE_SANDBOX=0`（**两个都要关**）。收益 ∝ 加载的小文件数：单文件 12.06s→**1.75s**、全量 unit 2121s→**280s**、全量 `test` 3919s→**594s**、构建 479s→**148s**、`vue-tsc` 124s→83s、**Playwright 无收益**。**别写进仓库脚本/CI**。
- ⚠️ vitest：降级（`--pool=forks --maxWorkers=1`）会**静默少跑**给假绿灯；目录过滤**不可靠** ⇒ 报数用 **project 名**（unit/dom-contract/types/a11y/theme），单文件传完整路径。裸 `vitest run <dir>` 会带跑 `types` ⇒ `TypeCheckError` 噪音(73) 且 exit=1 ⇒ **看「Tests passed」与「Type Errors」，别看退出码**；汇总行带 ANSI ⇒ grep 前先 `sed 's/\x1b\[[0-9;]*m//g'`。🚨 jsdom 冷缓存让 worker 启动超时（60s 上限）⇒ 先 `node -e "require('jsdom')"` 预热（199/221/231）。
- 🚨 **收口跑两个 lint**：`lint:types`（`vue-tsc -p tsconfig.json`）+ `lint:format`（`biome check .`）—— 互补。⚠️ **不许手写 glob**（zsh 不展开 `**` ⇒ 假绿灯，213）。biome error 基线 **0**。
- 🚨 `registry:check` 顺序：`gen-registry` → `foundation-status`（**不带 `--check`**）→ `gen-workstreams --check` → `validate-registry`。组件收口后要刷 foundation-status + workstreams。
- ⚠️ 机械改动**别用 Edit 批量**（会「部分落盘却报 success」，**同一文件内连续多次替换也会**，305）⇒ 写 Node 脚本断言「恰好命中 N 次」。
- ⚠️ 临时插桩标 `[TMP-DBG]`，收口前清光（`dist/` 是 gitignore ⇒ `git status` 不提醒）。并发红线：全仓构建门禁同时只允许一个会话，锁 `/tmp/apollo-build-gate.lock`。
- 单组件命令：`verify-component.mjs <kebab> [--visual]`（开发期反馈，**不替代** G13 全仓四道）｜L6 `tests/visual/run.mjs --component <name>`（默认 `--mode both` 且**打包两侧**；改源码后必须重建，312）｜compat 基线 `tests/compat/runner/index.mjs --component <name>`。

## 架构要点

```
L3 ui ｜ L2 form-core/picker/overlay/locale ｜ L1 motion/portal/position/a11y/virtual-list
L0 utils/theme/icons ｜ 测试 test-utils
```
- 包边界：消费者 ≥2 且无视觉语义才独立成包（13 包）；组件间共享代码放 `packages/ui/src/_internal/`。
- ⚠️ **`picker` = 引擎 + 面板**（裁决 `picker-panel-ownership`=B）：面板组件在**本包**，`ui` 的 DatePicker/TimePicker/Calendar 只做输入框 + 浮层 + 样式 ⇒ 它的 L2/L4/L5 是**硬门禁**；但它**不产 CSS**。
- `prefixCls` 默认 `apollo`；动手前先 grep `packages/utils/src`。
- 🚨 R7（ADR 0004）：发布包零 `@ant-design/*` 运行时依赖，门禁 E19 双扫描（产物扫描前必须 stripComments）。
- Oracle 判据：上游零框架耦合 ⇒ 可对拍；绑 React 生命周期 ⇒ 只能读源码 + 行为测试。

## 主分支 / 合并 / 并行

- master 检出在 `/Users/nanren/Code/apollo-design-ui`；合并前看那边工作区，有 WIP 先 `git stash push -u`。
- `registry/*.json` 冲突**按冲突块解析**（手写 status 会丢），别 `checkout --ours`；之后重跑生成器。
- 合并后必查：`index.ts` export 排序、生成器重跑、`dist/` 各 worktree 自建。**收口后立刻合 master**；ff 后必须 `git rev-parse` 确认真的动了。
- 「绿在本地」≠「绿在仓库」：依赖磁盘产物的结论先 `git ls-files` 确认产物已入库。
- 派 subagent：门禁必须前台跑；429 后接手先 `git status`+`git log`。

## 共享文件与其它易忘

多流必碰（按字母序追加）：`packages/ui/src/index.ts`、`style/index.ts`、`tests/visual/matrix.mjs`、`cases/shared.mjs`、`tests/compat/baseline/*.mjs`、`registry/source/open-decisions.mjs`、root `package.json`。新组件另需 `tests/compat/baseline/<name>.mjs` + `tests/visual/render/cases/{react,vue}/<name>.{jsx,js}` + matrix 一行。
- ⚠️ 改 foundation 包（utils/portal/motion/**picker**）后**必须单独重建**，否则 ui 的 dist 带不上（176/249）。
- 视觉层只链接 theme + ui ⇒ **用例文件**里 import `@apollo-design/icons` 解析不到；需要图标时用「两侧同一份内联结构」替身。
- ⚠️ demo 的 `.md` 有两派格式：frontmatter 与 `## zh-CN`/`## en-US`。⚠️「L7」两个口径：`TESTING.md` §10 = Build Test；组件测试文件头把 theme 层也叫 L7。
- `_internal/` 三次法则收敛物：`use-merged-mask.ts`、`to-css-size.ts`、`color-composite.ts`。
- 全仓 `update:*` 缺口（162）：C11 要求 v-model 与语义事件同时发出，目前仅 radio/switch 实现。
- ⚠️ **`test:visual` 与 `test:types` 都不在 `verify:full`** ⇒ 两条都要显式跑。
- 未决：B6 按需样式子路径（`exports` 缺 `./css/*`）；`--project types` 的 SFC 解析噪音(73)；Empty SVG 不跟 darkAlgorithm；开放决策见 `ask decisions --open`。

## 收口期长期约定（跨组件通用）

- **视觉变体要避开「静态帧测不到」的面**：`:hover`/`cursor`/`transition`/纯属性差异（`href`/`id`）在截图上不可见 ⇒ 必然是空转变体（归 L1 类名断言与 L4）。
- 🚨 写/改变体后先 `md5 tests/visual/baselines/react/<c>/*.png | sort` 查同哈希 —— 同哈希 = **空转**；`run.mjs` 结尾的「基线自检」也查。
- **demo 里的外网图片一律换本地等价物**（`data:image/png;base64,…` 或纯色块）；**未落地的组件**用**原生等价物**并登记组件 `README §5`。
- **L4 的 `it.each` 别用「长度不一致的元组数组」**（推断退化成元组联合、TS2345）⇒ 同形对象数组 + `$name`。
- **`*.test.ts` 也在 `vue-tsc` 范围内** ⇒ 加完测试重跑 `lint:types`；`noUncheckedIndexedAccess` 下 `arr[0]` 是 `T | undefined`，用 `?.`（`noNonNullAssertion` 是 warn）。
- 🚨 **`.vue` 里出现 `typeof SomeComponent` 就查那条 import 有没有被 biome 改成 `import type`**（299）：`grep -rn "^import type .* from '.*\.vue'"` 扫全仓。
- **语义化槽（`classNames`/`styles`）支持函数形态** ⇒ prop 类型必须收 `[Object, Function]`，只写 `Object` 会发 `Invalid prop` 告警（timeline 实测）。

## 进度（2026-10-02）

foundation **13/13 completed**；组件 **66/72 completed**。已 completed：`date-picker`/`masonry`/`anchor`/`breadcrumb`/`card`/`avatar`/`list`/`timeline`（判据见 `PITFALLS.md` 与各自 `README §5`）。
**timeline 要点**：**`Steps` 的薄壳**（无自己的 DOM；`.ts` 渲染函数；样式靠**覆盖 Steps 的内部变量**）；**6 个 Component Token 只声明 4 条**（`dotSize`/`dotBg` 刻意不声明，靠 `var(custom, origin)` 回退链；已登记 B7 的 `UPSTREAM_UNDECLARED_TOKEN_VARS`）。
⚠️ 已按用户裁决**扩展 `steps`**（`ef6cc7e`）：新增 `stepsInternalContextKey`（`rootComponent`/`itemComponent`）+ `stepsUnstableContextKey`（`railFollowPrevStatus`）；🚨 必须由 `Steps` **接住并转发**（它自己 provide 同族键 ⇒ 外层被「最近的赢」遮蔽，**256**）。
🚨 timeline 判据：**`Steps` 主动剥掉 `attrs.class`** ⇒ 传类名只能用 **`className` prop**(309)；**`--apollo-cmp-steps-*` 前缀固定 `apollo`**（310）。
⚠️ **既有事实**：9 个组件「completed + `visualStatus: done` 但零入库 L6 基线」（select/auto-complete/cascader/popconfirm/float-button/rate/segmented/**steps**/progress）⇒ 它们的 L6 在 `--mode compare` 下不可用，只能 `--mode both`。根因 = 未裁决的开放决策 **`visual-baseline-in-git`**。
