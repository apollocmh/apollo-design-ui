# MEMORY.md — 项目长期约定

> 只放仓库文档里没有的：易错判据、工具所有权、未决事项。
> 规则本体：`AGENTS.md`/`WORKFLOW.md`/`TESTING.md`/`COMPATIBILITY.md`/`ARCHITECTURE.md`；
> **坑的全文**：同目录 `PITFALLS.md`（290+ 条，**查坑先去那**）；环境专题：`test-perf-diagnosis.md`。

## 本质与事实来源

Vue 3 + TS 重写 Ant Design（兼容规格，非代码来源），目标 **antd 6.6.4**。优先级：用户指令 >
仓库规范 > `registry/*.json` > antd 产物/源码 > 文档 > 先验。
**禁止凭记忆描述 antd**：读 `/tmp/antd-src/package/`（⚠️ /tmp 会清，缺了按 PITFALLS 42 恢复）；
说「某决策是这样」前先跑 `node registry/tools/ask.mjs`（`decision <id>` 出**原文**）。

## 取任务与派生字段

`node registry/tools/next-task.mjs`（唯一权威；并行 `--parallel`；一轮一包，G0→G14）。
派生字段（手改被覆盖）：`notDo`/`publicApi`/包 package.json ← `scaffold-packages.mjs`；
`foundation.json` ← `foundation-status.mjs`；components/dependencies/tokens/workstreams ← `gen-*.mjs`。
🚨 跨运行保留的只有 `status` + 11 维度状态 + `blockers` + `layerNotes`；
⚠️ `notes` **不是**保留字段 ⇒ 写注记改 `registry/source/components.meta.mjs`（220）。

## 环境（全部实测）

Node ≥22.12（managed）｜pnpm 12.4.2｜TS 5.9｜Vitest 5｜Playwright（`channel:'chrome'`）。
- 🚨 `pnpm -r run build` 永不可用；权威构建门禁 `CODEBUDDY_SAFE_DELETE_ENABLED=0 node tests/build/run.mjs`。
- 🚨 三个「自己删目录」入口都要带 `CODEBUDDY_SAFE_DELETE_ENABLED=0`：`tests/build/run.mjs`、
  `tests/visual/run.mjs`、`pnpm build:ui`（删 `.dts-tmp`，不带则 build 退出 1）。
- 🚨 本机 `pnpm` **不在 PATH**（只有 corepack）⇒ 造 `/tmp/pnpm-shim/pnpm` 包一层，再
  `PATH=/tmp/pnpm-shim:$PATH pnpm run <script>`。⚠️「超时无输出」先查 corepack 下载提示；
  长命令一律 `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1`。
- ⚠️ `exit 137`+零日志 ≠ OOM，先怀疑前台 120s 超时；>2 分钟后台跑。
- 🚨 **本机 vitest 慢 7 倍的真凶是 WorkBuddy 沙箱的 brokered-fs hook**（298，见
  `test-perf-diagnosis.md`）：每次 `open()` 走 IPC 代理 ≈6–10ms，jsdom 652 个文件 ⇒
  **每文件固定 5.8s**（全量 unit 2121s 的 71%）。会话里跑测试/构建**前置**
  `CODEBUDDY_BROKERED_FS_HOOK_ENABLED=0 CODEBUDDY_SAFE_DELETE_SANDBOX=0`
  （**两个都要关，是「或」关系**）⇒ 单文件 12.06s → **1.75s**，全量 2121s → **280s**。
  **别写进仓库脚本/CI**（用户终端没有这些变量）。
- ⚠️ vitest：降级（`--pool=forks --maxWorkers=1`）会**静默少跑**给假绿灯；`vitest run <目录>` 过滤
  **不可靠** ⇒ 报数用 **project 名**（unit / dom-contract / types / a11y / theme），单文件传完整路径。
  裸 `vitest run <dir>` 会带跑 `types` project ⇒ `TypeCheckError` 噪音（73）且 exit=1 —— **看
  「Tests passed」与「Type Errors」，别看退出码**。
- 🚨 jsdom 冷缓存让 worker 启动超时（60s 硬上限）⇒ 先 `node -e "require('jsdom')"` 预热（199/221/231）。
- 🚨 **收口必须跑两个 lint**：`pnpm run lint:types`（`vue-tsc -p tsconfig.json`）**和**
  `pnpm run lint:format`（`biome check .`）—— 互补（vue-tsc 不看未用 import / 类型参数）。
  ⚠️ **不许手写 glob**（zsh 不展开 `**` ⇒ 假绿灯，213）。biome error 基线 **0**。
- 🚨 `registry:check` 顺序：`gen-registry.mjs` → `foundation-status.mjs`（**不带 `--check`**）→
  `gen-workstreams.mjs --check` → `validate-registry.mjs`。组件收口后要刷 foundation-status + workstreams。
- ⚠️ 多文件机械改动**别用 Edit 批量**（会「部分落盘却报 success」）⇒ 写 Node 脚本断言「恰好命中 1 次」。
- ⚠️ 临时插桩标 `[TMP-DBG]`，收口前清光（`dist/` 是 gitignore ⇒ `git status` 不提醒）。
- 并发红线：全仓构建门禁同一时刻只允许一个会话，锁 `/tmp/apollo-build-gate.lock`。

## 架构要点

```
L3 ui ｜ L2 form-core/picker/overlay/locale ｜ L1 motion/portal/position/a11y/virtual-list
L0 utils/theme/icons ｜ 测试 test-utils
```
- 包边界：消费者 ≥2 且无视觉语义才独立成包，共 13 包；组件间共享代码放 `packages/ui/src/_internal/`。
- ⚠️ **`picker` = 引擎 + 面板**（裁决 `picker-panel-ownership`=B）：面板组件在**本包**，`ui` 的
  DatePicker/TimePicker/Calendar 只做输入框 + 浮层 + 样式 ⇒ 它的 L2/L4/L5 是**硬门禁**；但它**不产 CSS**。
- `prefixCls` 默认 `apollo`。动手前先 grep `packages/utils/src`。
- 🚨 R7（ADR 0004）：发布包零 `@ant-design/*` 运行时依赖，门禁 E19 双扫描（产物扫描前必须 stripComments）。
- Oracle 判据：上游零框架耦合 ⇒ 可对拍；绑 React 生命周期 ⇒ 只能读源码 + 行为测试。

## ⚠️ 跨包易错判据索引（**全文见 PITFALLS.md**，此处只留判据 + 编号）

- **props/attrs**：事件名全小写(1) · `VNodeChild` 显式 `undefined` 默认值(2) · 🚨未声明 prop 归 `attrs`
  静默失效(3,250) · catch-all 别用 `PropType<unknown>`(5,137,185) · `required:true` 要 `as const`(15,200)
- **样式**：进 `style` 必须 `toCssSize()`(7,D94) · 变量声明块覆盖**全部根形态**含浮层根(8,171,D95,248) ·
  驼峰转 kebab 用 `/([a-z0-9])([A-Z])/g`(16,228) · 产物 `NaN`/`undefined` 由 B11 兜(10)
- **浮层**：🚨必须复刻 `-panel-container` 层（否则真机点不动，jsdom 测不出）(9,251) · 关闭异步⇒断言卸载要
  轮询(11,179) · 测几何前剥 motion 相位类(17,253) · 动效名前缀 `rootPrefixCls`(12,180)
- **响应式**：🚨写状态→立刻比较恒假，**先取快照**(13,207) · `watch(immediate)` 在 `setup()` 同步跑且不补跑(14,211) ·
  `setup()` 里不能建带 `ref` 的 vnode(11,178) · 深联合 `ref` 用 `shallowRef`(15,TS2589)
- **Vue 化**：🚨本仓把外层 Provider 挪进组件 ⇒ 外层 `provide` 不生效，hack 面走 **props**(20,256) ·
  类型比上游窄先问「上游是不是 JS」⇒ 补类型不改实现(21,257) · `Skeleton` `inheritAttrs:false` ⇒ 用 `className`(19,181) ·
  `biome.json` 不能写注释(4,139) · `index.ts` 手工维护 / 重名用别名(6,158,168)
- **流程**：⚠️「旧写法有测试、新写法没有」最易长期潜伏(18,252) · 🚨BSD `grep` 不支持 `\|`、会**静默返回空**
  (277) —— 搜代码用 Grep 工具。

## 主分支 / 合并 / 并行（硬教训）

- master 检出在 `/Users/nanren/Code/apollo-design-ui`；合并前看那边工作区，有 WIP 先 `git stash push -u`。
- `registry/*.json` 冲突**按冲突块解析**（手写 status 会丢），别 `checkout --ours`；之后重跑生成器。
- 合并后必查：`index.ts` export 排序、生成器重跑、`dist/` 各 worktree 自建。
- **收口后立刻合 master**；ff 后必须 `git rev-parse` 确认真的动了。
- 「绿在本地」≠「绿在仓库」：依赖磁盘产物的结论先 `git ls-files` 确认产物已入库。
- 派 subagent：门禁必须前台跑；429 后接手先 `git status`+`git log`，写文件前确认没别人的东西。

## 共享文件与其它易忘

多流必碰（按字母序追加）：`packages/ui/src/index.ts`、`style/index.ts`、`tests/visual/matrix.mjs`、
`cases/shared.mjs`、`tests/compat/baseline/*.mjs`、`registry/source/open-decisions.mjs`、root `package.json`。
新组件另需：`tests/compat/baseline/<name>.mjs` + `tests/visual/render/cases/{react,vue}/<name>.{jsx,js}` + matrix 一行。
- ⚠️ 改 foundation 包（utils/portal/motion/**picker**）后**必须单独重建**，否则 ui 的 dist 带不上（176/249）。
- 视觉层只链接 theme + ui 两个 workspace 包 ⇒ **用例文件**里 import `@apollo-design/icons` 解析不到
  （组件内部没问题）；需要图标时用「两侧同一份内联结构」替身。
- ⚠️ demo 的 `.md` 有**两派格式**：frontmatter（carousel/input-number）与 `## zh-CN`/`## en-US`。
- ⚠️「L7」两个口径：`TESTING.md` §10 = Build Test；组件测试文件头把 theme 层也叫 L7。
- `_internal/` 三次法则收敛物：`use-merged-mask.ts`、`to-css-size.ts`、`color-composite.ts`。
- 全仓 `update:*` 缺口（162）：C11 要求 v-model 与语义事件同时发出，目前仅 radio/switch 实现。
- ⚠️ **`test:visual` 与 `test:types` 都不在 `verify:full`** ⇒ 两条都要显式跑。
- 未决：B6 按需样式子路径（`exports` 缺 `./css/*`）；`--project types` 的 SFC 解析噪音（73）；
  Empty SVG 不跟 darkAlgorithm；开放决策见 `ask decisions --open`。

## 进度（2026-10-02）

foundation **13/13 completed**；组件 **63/72 completed**；可执行 12 / 被阻塞 1。下一条用 `next-task.mjs` 取。
`date-picker` / `masonry` / `anchor` / `breadcrumb` / `card` 已 **completed**（11 维度全 done）：

- **card**（本轮）：`.vue` SFC ×3（`Card` / `CardMeta` / `CardGrid`）；13 个 Component Token + 4 个
  `mergeToken` 派生；**L6 33/33 exact、L4 51/51、L1 46/46、L3 28/28、L5 15/15、L7 19/19、demo 12/12**。
  🚨 三条判据：① `-contain-tabs` 用 `tabList?.length`，而 **head 的判据是 `tabList` 的真值**（空数组也渲染）；
  ② `Card.Grid` 的 **vnode 身份**（`child.type === CardGrid`）是 `-contain-grid` 的唯一判据；
  ③ `onTabChange` 是**上游的 prop**（不是 emits）⇒ 用 `:on-tab-change`。
  ⚠️ 两条坑：**PITFALLS 299**（biome 把只在模板 + 类型位置用的组件 import 改写成 `import type` ⇒
  静默渲染成原生标签）、**PITFALLS 300**（跨组件 prop 名形近 `defaultActiveTabKey` vs `defaultActiveKey`，
  类型检查无感、只有行为用例能抓）、**PITFALLS 301**（透传 `tabProps` 必须过一次 `unknown`）。
  ⚠️ `-hoverable` **不给独立视觉变体**（静态帧只差 `cursor` / `transition` ⇒ 必然空转）。

- **masonry**：无 foundation 缺口（对照表 `docs/analysis/masonry.md` §0）；L6 21/21 exact；先读 `packages/ui/src/masonry/PLAN.md`。
- **anchor**：两个 `.ts` 渲染函数（`Anchor.ts`/`AnchorLink.ts`）；⚠️ `AnchorLink` 类名前缀取自
  **ConfigProvider 根前缀** ⇒ L4 基线生成器每个用例都要包 ConfigProvider；L6 `active` 需「`bounds` 抬阈值 +
  零高度夹具」且 `affix ≠ false`（旧写法两条都漏 ⇒ 三张基线与 `basic` 逐字节相同，276）。
  🚨 改视觉用例前先 `md5 tests/visual/baselines/react/<comp>/*.png | sort` 查重复；`rtl-active` 与 `active`
  **预期**相同（antd 对 Anchor 零 RTL CSS），别当重复删掉。⚠️ `onClick` 是自定义签名 prop；`Anchor` 没有
  `ref`/`expose`；`children` 是插槽（271）。

### 收口期新增长期约定

- **视觉变体要避开「静态帧测不到」的面**：`:hover` / `cursor` / `transition` / 纯属性差异（`href` / `id`）
  在截图上不可见 ⇒ 必然是空转变体，别给它独立 variant（归 L1 的类名断言与 L4）。
- **demo 里的外网图片一律换本地等价物**（`data:image/png;base64,…` 或纯色块）；
  **未落地的组件**（如 `avatar`，`status: todo`）用**原生等价物**并登记组件 `README §5`。
- **L4 的 `it.each` 别用「长度不一致的元组数组」**（推断退化成元组联合、回调签名对不上，TS2345）——
  改用**同形对象数组** + `$name` 模板。
- **`*.test.ts` 也在 `vue-tsc` 的检查范围内**（`lint:types` 覆盖全仓，不只是 `*.test-d.ts`）⇒
  加完测试要重跑 `lint:types`；`noUncheckedIndexedAccess` 下 `arr[0]` 是 `T | undefined`，
  用 `?.`，别用 `!`（`noNonNullAssertion` 是 warn）。
- 🚨 **只要 `.vue` 里出现 `typeof SomeComponent`，就检查那条 import 有没有被 biome 改写成
  `import type`**（PITFALLS 299）：`grep -rn "^import type .* from '.*\.vue'"` 一条命令扫全仓。
