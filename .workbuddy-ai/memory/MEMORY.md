# MEMORY.md — 项目长期约定
> 只放**仓库文档里没有**的。规则本体：`AGENTS.md` 等 5 份文档。坑全文+索引：`PITFALLS.md`（先看 §0）。
> **环境与命令**：`environment.md`（跑测试/构建前必读）。本文件只留**指针 + 判别式 + 当前事实**。

> 📁 `.workbuddy` 是 `.workbuddy-ai` 的**软链接** —— 国际版/国内版共用一份记忆，勿按版本分开记。

## §0 接手顺序（先看这三份）
1. **`docs/KNOWN-ISSUES.md`** —— 欠账台账。**不在** `AGENTS.md` §5 的 5 份文档清单里，必须从这里找到它。
   §1 仍开放（**2026-10-07 起为空**）· §2「不要再排查」· §3 历史留痕。**引用前先核一眼**，本文件曾整段过期。
2. `node registry/tools/next-task.mjs` —— 下一个任务的**唯一权威**。
3. `node registry/tools/ask.mjs decisions --open` —— 当前未裁决决策。

⚠️ **登记簿/文档的坐标要复核后再信**（2026-10-03 实测重写时改掉 **4 处事实错误**）。
⇒ `git log -S` 与「跑一遍现成测试」比读文档可靠；每条欠账都该能被命令复现。

## §1 事实来源 / 任务 / registry
Vue3+TS 重写 antd（**兼容规格，非代码来源**），目标 **6.6.4**。
优先级：用户指令 > 仓库规范 > `registry/*.json` > antd 产物/源码 > 文档 > 先验。

- 🚨 **Phase 2 起**（2026-10-06 用户裁决）antd 从「答案的判据」降为「**参考实现**」，第 4 层只在无本仓裁决时兜底。
  **根别名一律用原生 `class`/`style`**（不再有 `rootClassName`/`rootStyle` prop，全仓 72 组件已完成）；
  **非根目标**由本仓设计 `classNames.*`/`styles.*` 槽位，上游名标 `@deprecated`。
  ⚠️ 判别式：先问「这个 prop 指向的是不是**组件自己的根**？」是⇒收敛成原生；否⇒设计槽位。
  ⚠️ `AGENTS.md` §0 还没更新（只能由用户改）；阶段声明在 `COMPATIBILITY.md` 顶部。
- 🚨 禁止凭记忆描述 antd：读 `/tmp/antd-src/package/`（缺了按 PITFALLS 42 恢复）；
  说「某决策是这样」前先 `ask.mjs decision <id>`（出原文，不是摘要）。
- **派生字段**（手改会被覆盖）：`notDo`/`publicApi`/包 package.json ← `scaffold-packages.mjs`；
  `foundation.json` ← `foundation-status.mjs`；components/dependencies/tokens/workstreams ← `gen-*.mjs`。
- 生成器**有顺序**：`gen-registry` → `foundation-status` → `gen-workstreams` → `validate-registry`。
- 🚨 跨运行**只保留** `status`+11 维度+`blockers`+`layerNotes` ⇒ 收口直接改 `components.json` 这 13 项再重跑生成器。
  ⚠️ `notes` **不保留** ⇒ 注记写 `registry/source/components.meta.mjs`。

## §2 架构
`L3 ui ｜ L2 form-core/picker/overlay/locale ｜ L1 motion/portal/position/a11y/virtual-list ｜ L0 utils/theme/icons ｜ 测试 test-utils`
- 包边界：消费者≥2 且无视觉语义才独立成包（13 包）；共享代码放 `packages/ui/src/_internal/`。
- ⚠️ **`picker` = 引擎+面板**（裁决 `picker-panel-ownership`=B）：面板在本包，ui 侧只做输入框+浮层+样式 ⇒ 它的 L2/L4/L5 是硬门禁；但**不产 CSS**。
- `prefixCls` 默认 `apollo`；动手前先 grep `packages/utils/src`。
- 🚨 R7（ADR 0004）：发布包零 `@ant-design/*` 运行时依赖，门禁 E19 双扫描。

## §3 构建与产物形态（2026-10-07 裁决 `ui-tree-shaking` = A+B+D 后）
- **全部 14 个包都保留模块结构**（`preserveModules`）：ui 出 766 个 `.mjs` + 70 份 CSS；13 个 foundation 包同步。
  12 个走共享 `scripts/unbuild-preserve-modules.mjs`（`build` 脚本 = `unbuild --config ../../scripts/...`）；
  ⚠️ **`theme` / `ui` 不用共享配置、在自己 `build.config.ts` 里各自打开** —— 「不用共享配置」≠「不用 preserveModules」。
- **B6 已转真检查**：73 条预算在 `tests/build/budget.json`（`ceil(实测×1.5+5)`）+「占全量 ≤ 30%」。
  再生：`node tests/build/checks/treeshake.mjs --measure-all`。预算只能因**技术原因**上调且须写理由（设成等于全量 = H8）。
- 实测成果：Divider **1272.9 KB → 7.5 KB**（全量 0.4%，原 63%）· Button 20.9 · Table 318.7（最重）· 全量 2009.0 KB。
- `exports`：ui 有 73 条 `@apollo-design/ui/<c>` JS 深入口 + 70 条 `<c>/style.css`，**只暴露入口名、不暴露内部路径**。
  两类都由 `uiExtraExports()` 从单一真源推导（`components.json` / `packages/ui/src/style/index.ts`）。
- 🚨 **门禁必须跑真正会被发布的命令**：B1 改过一次硬编码裸 `unbuild` 的坑（不带 `--config` ⇒ D 实施后照样出单文件还全绿）。
- ⚠️ 本仓是 **ESM-only**（dist 里零 `.cjs`，exports 只有 `types`/`import`）⇒ 用 `createRequire().resolve()` 探测必然
  `ERR_PACKAGE_PATH_NOT_EXPORTED`（**假警报**）；要用 `import.meta.resolve`，且**探针文件必须在仓库内**。

## §4 决策（registry）
- 🚨 裁决时**必须同时改** `registry/source/open-decisions.mjs`（`open()`→`decided()`）**和** `registry/foundation.json`
  （运行时键 `status/decision/decidedAt/decidedBy/note` 以后者为准）⇒ 用
  `node registry/tools/sync-decision-runtime.mjs <id>` 同步，再跑生成器链。
- 📌 `decision.blocks` **不在**运行时键里 ⇒ 只认种子（`blocks` 要跑生成器链才生效）。语义 =「曾约束过哪些包」：
  `open` 时是当前阻塞、`decided` 时是历史影响范围 ⇒ **看到「decided + 非空 blocks」别当陈旧**；
  只有**值是组件名**（违反 schema「只填 foundation 包名」）才是真陈旧。
- 已裁决要点：`visual-baseline-in-git`=A（基线入库；`float-button` 因 `position:fixed` 故意不入库）·
  `noNonNullAssertion`（测试目录关闭、生产逐个收窄、**禁止扫改**）· `picker-panel-ownership`=B · `ui-style-output`=A ·
  `ui-tree-shaking`=A+B+D。

## §5 收口期判据
- **视觉变体避开静态帧测不到的面**：`:hover`/`cursor`/`transition`/纯属性(`href`/`id`) 截图不可见 ⇒ 必然空转（归 L1/L4）。
  🚨 写/改变体后 `md5 tests/visual/baselines/react/<c>/*.png | sort` 查同哈希。
- **L4 的 `it.each` 别用「长度不一致的元组数组」**(TS2345) ⇒ 同形对象数组 + `$name`。`*.test.ts` 也在 `vue-tsc` 内。
- 🚨 `.vue` 里出现 `typeof SomeComponent` 就查那条 import 有没有被 biome 改成 `import type`（PITFALLS 299）。
  **语义化槽（`classNames`/`styles`）支持函数形态** ⇒ prop 类型必须 `[Object, Function]`。
- 📌 置 `completed` 前三件套：① `COMPONENT_STYLES` 注册；② `index.ts` 导出(B8)；③ `tests/compat/fixtures/<c>/` 有 fixture(E9)。
- 🚨 **收口后必须 `git status` 确认已落盘** —— 曾两次「验证全绿但整片未提交」，隔一轮才发现。
- ⚠️ 新增 demo 要配套 `.md`（每个 demo 一个 `.tsx` + `.md`）。

## §6 环境 / 命令 / 同步
- 🚨 视觉层与构建门禁的入口**都要带** `CODEBUDDY_SAFE_DELETE_ENABLED=0`（另有 `CODEBUDDY_BROKERED_FS_HOOK_ENABLED=0`
  / `CODEBUDDY_SAFE_DELETE_SANDBOX=0`，本机两个都是 1）：漏了会在打包阶段被 safe-delete 拦下（阈值 50）。
  `pnpm` 不在 PATH（只有 corepack）⇒ 先造 `/tmp/pnpm-shim/pnpm`。详见 `environment.md`。
- ⚠️ **`test:visual` / `test:types` 都不在 `verify:full`** ⇒ 都要显式跑。
  ⚠️ `test:types` 报的是 **unhandled error** 时会「Tests 全绿但 exit=1」⇒ 看到这种组合直接搜 `Unhandled Source Error`。
  （`build.config.ts` 的类型错误**只有** `test:types` 抓得到 —— `vue-tsc --noEmit` 不看它。）
- ⚠️ 改 foundation 包后**必须单独重建**；视觉层只链接 theme+ui ⇒ 用例文件里 import `@apollo-design/icons` 解析不到，用「两侧同构」替身。
- ⚠️ L6 解析的是 `packages/ui/dist` ⇒ 改**组件源码**（不只样式）也要先 `pnpm build:ui`。
- **GitHub 同步**（每完成一个阶段都要）：
  `git -c http.proxy=http://127.0.0.1:7890 push origin HEAD:master`（`origin` 私有）。
  ⚠️ 到 GitHub 的**批量**传输直连会挂起 ⇒ 必须走代理；小 API 请求直连可用。
- 合并：`registry/*.json` 冲突**按冲突块解析**，别 `checkout --ours`，之后重跑生成器。**收口后立刻合 master**。
  ⚠️「绿在本地」≠「绿在仓库」：依赖磁盘产物先 `git ls-files` 确认已入库。

## §7 进度
foundation **13/13**；组件 **72/72 completed**（全量封顶）。
- 9 个组件「completed 但零入库 L6 基线」（含 select/cascader/float-button/steps…）⇒ L6 只能 `--mode both`。
- 已收口的大项：Table 虚拟滚动（`dd706d7`）· color-picker（`0255c4b`）· timeline（Steps 薄壳）·
  ui 按需引入 / `ui-tree-shaking`（`c4fcf4bc`）。
