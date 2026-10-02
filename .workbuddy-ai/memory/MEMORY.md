# MEMORY.md — 项目长期约定

> 只放仓库文档里没有的：易错判据、工具所有权、未决事项。
> 规则本体：`AGENTS.md`/`WORKFLOW.md`/`TESTING.md`/`COMPATIBILITY.md`/`ARCHITECTURE.md`；
> **坑的全文**：同目录 `PITFALLS.md`（300+ 条，**查坑先去那**）；环境专题：`test-perf-diagnosis.md`。

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
- ⚠️ 机械改动**别用 Edit 批量**（会「部分落盘却报 success」——**同一文件内连续多次替换也会**，
  305 的成因就是同一文件三处调用点只落盘一处）⇒ 写 Node 脚本断言「恰好命中 N 次」，改完 `grep` 复核。
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
  驼峰转 kebab 用 `/([a-z0-9])([A-Z])/g`(16,228) · 产物 `NaN`/`undefined` 由 B11 兜(10) ·
  🚨 `genXxxStyle` 必须把 `genTokenDecls(p)` spread 进**组件根规则**(287) ·
  🚨 token **名**与 token→var 转换**别混用** ⇒ `var(--apollo-var(--x))` 双包裹会让声明整条失效，
  而 `theme.test.ts` 与 B7 的同一个正则**都看不见**（只认最内层），只有 L6 抓得到(305) ·
  ⚠️ E10 的「硬编码圆角」是**文本**扫描 ⇒ `v('x')` 先存变量再插值会被误判，应内联 `${v(...)}`(304)
- **浮层**：🚨必须复刻 `-panel-container` 层（否则真机点不动，jsdom 测不出）(9,251) · 关闭异步⇒断言卸载要
  轮询(11,179) · 测几何前剥 motion 相位类(17,253) · 动效名前缀 `rootPrefixCls`(12,180)
- **响应式**：🚨写状态→立刻比较恒假，**先取快照**(13,207) · `watch(immediate)` 在 `setup()` 同步跑且不补跑(14,211) ·
  `setup()` 里不能建带 `ref` 的 vnode(11,178,264) · 深联合 `ref` 用 `shallowRef`(15,TS2589)
- **Vue 化**：🚨本仓把外层 Provider 挪进组件 ⇒ 外层 `provide` 不生效，hack 面走 **props**(20,256) ·
  类型比上游窄先问「上游是不是 JS」⇒ 补类型不改实现(21,257) · `Skeleton` `inheritAttrs:false` ⇒ 用 `className`(19,181) ·
  `biome.json` 不能写注释(4,139) · `index.ts` 手工维护 / 重名用别名(6,158,168) ·
  🚨 biome 把「只在模板 + 类型位置用」的组件 import 改成 `import type`(299) ·
  透传另一组件的 props 常需过一次 `unknown`(301) · 既有 `onXxx` prop 又有 emit ⇒ **只 emit**(267) ·
  🚨 上游 `Children.toArray(children).some(isString)` 在 Vue 侧**恒假**（`toArray` 归一成 Text vnode）
  ⇒ 用 `isTextVNode`(306) · `withDefaults` 是编译器宏**不能 import**，默认 `true` 的布尔 prop 必须声明(307) ·
  🚨 `h(组件, props, 数组)` 会告警「非函数插槽」⇒ 组件 children 写成显式插槽函数(308)
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

## 收口期长期约定（跨组件通用）

- **视觉变体要避开「静态帧测不到」的面**：`:hover` / `cursor` / `transition` / 纯属性差异（`href` / `id`）
  在截图上不可见 ⇒ 必然是空转变体，别给它独立 variant（归 L1 类名断言与 L4）。
- 🚨 写/改变体后先 `md5 tests/visual/baselines/react/<c>/*.png | sort` 查同哈希 —— 同哈希 = **空转**。
- **demo 里的外网图片一律换本地等价物**（`data:image/png;base64,…` 或纯色块）；**未落地的组件**
  （如 avatar）用**原生等价物**并登记组件 `README §5`。
- **L4 的 `it.each` 别用「长度不一致的元组数组」**（推断退化成元组联合、TS2345）⇒ 同形对象数组 + `$name`。
- **`*.test.ts` 也在 `vue-tsc` 检查范围内** ⇒ 加完测试要重跑 `lint:types`；`noUncheckedIndexedAccess`
  下 `arr[0]` 是 `T | undefined`，用 `?.`，别用 `!`（`noNonNullAssertion` 是 warn）。
- 🚨 **只要 `.vue` 里出现 `typeof SomeComponent`，就检查那条 import 有没有被 biome 改成 `import type`**（299）：
  `grep -rn "^import type .* from '.*\.vue'"` 一条命令扫全仓。

## 进度（2026-10-02）

foundation **13/13 completed**；组件 **65/72 completed**。下一条用 `next-task.mjs` 取。
已 completed：`date-picker` / `masonry` / `anchor` / `breadcrumb` / `card` / `avatar` / `list`
（各自的判据与坑见 `PITFALLS.md` 与组件 `README §5`，不在此重复）。
进行中：**timeline**（G0–G6 已完；🚨 它是 **`Steps` 的薄壳** —— 没有自己的 DOM，
实现是 **`.ts` 渲染函数**，样式靠**覆盖 Steps 的内部变量**）。
⚠️ 已按用户裁决**扩展了 `steps`**（`ef6cc7e`）：新增 `steps/context.ts` 的
`stepsInternalContextKey`（`rootComponent`/`itemComponent`）+ `stepsUnstableContextKey`
（`railFollowPrevStatus`）。🚨 必须由 `Steps` **接住并转发**（它自己 provide 同族键 ⇒
外层会被「最近的赢」遮蔽，**PITFALLS 256**）。
🚨 两条 timeline 实测判据：**`Steps` 主动剥掉 `attrs.class`** ⇒ 传类名只能用 **`className` prop**(309)；
**`--apollo-cmp-steps-*` 前缀固定 `apollo`**（`genStepsStyle` 只重命名选择器、不重命名变量名）(310)。
⚠️ **既有事实**：9 个组件「completed + `visualStatus: done` 但零入库 L6 基线」
（select / auto-complete / cascader / popconfirm / float-button / rate / segmented /
**steps** / progress）⇒ 它们的 L6 在 **`--mode compare` 下不可用**，只能跑 `--mode both`。
根因 = 已登记未裁决的开放决策 **`visual-baseline-in-git`**。
