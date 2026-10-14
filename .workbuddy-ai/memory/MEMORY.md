# MEMORY.md — 项目长期约定
> 只放**仓库文档里没有**的。规则本体：`AGENTS.md` 等 5 份文档。坑全文+索引：`PITFALLS.md`（先看 §0）。
> **环境与命令**：`environment.md`（跑测试/构建前必读）。本文件只留**指针 + 判别式 + 当前事实**。
> 📁 `.workbuddy` 是 `.workbuddy-ai` 的**软链接** —— 国际版/国内版共用一份记忆，勿按版本分开记。

## §0 接手顺序
1. **`docs/KNOWN-ISSUES.md`** —— 欠账台账。**不在** `AGENTS.md` §5 的 5 份文档清单里，必须从这里找到。
   §1 仍开放 · §2「不要再排查」· §3 历史留痕。**引用前先核一眼**，本文件曾整段过期。
2. `node registry/tools/next-task.mjs` —— 下一个任务的唯一权威。
3. `node registry/tools/ask.mjs decisions --open` —— 未裁决决策。
⚠️ **登记簿/文档的坐标要复核后再信**（重写时实测改掉 4 处事实错误）⇒ `git log -S` 与「跑一遍现成测试」比读文档可靠；每条欠账都该能被命令复现。

## §1 事实来源 / registry
Vue3+TS 重写 antd（**兼容规格，非代码来源**），目标 **6.6.4**。
优先级：用户指令 > 仓库规范 > `registry/*.json` > antd 产物/源码 > 文档 > 先验。

- 🚨 **Phase 2 起**（2026-10-06 用户裁决）antd 从「答案的判据」降为「**参考实现**」，第 4 层只在无本仓裁决时兜底。
  **根别名一律用原生 `class`/`style`**（不再有 `rootClassName`/`rootStyle` prop，全仓 72 组件已完成）；**非根目标**由本仓设计 `classNames.*`/`styles.*` 槽位，上游名标 `@deprecated`。
  ⚠️ 判别式：先问「这个 prop 指向的是不是**组件自己的根**？」是⇒收敛成原生；否⇒设计槽位。
  ⚠️ `AGENTS.md` §0 还没更新（只能由用户改）；阶段声明在 `COMPATIBILITY.md` 顶部。
- 🚨 禁止凭记忆描述 antd：读 `/tmp/antd-src/package/`（缺了按 PITFALLS 42 恢复）；说「某决策是这样」前先 `ask.mjs decision <id>`（出原文）。
- **派生字段**（手改会被覆盖）：`notDo`/`publicApi`/包 package.json ← `scaffold-packages.mjs`；`foundation.json` ← `foundation-status.mjs`；components/dependencies/tokens/workstreams ← `gen-*.mjs`。
- 生成器**有顺序**：`gen-registry` → `foundation-status` → `gen-workstreams` → `validate-registry`。
- 🚨 跨运行**只保留** `status`+11 维度+`blockers`+`layerNotes` ⇒ 收口直接改 `components.json` 这 13 项再重跑。⚠️ `notes` **不保留** ⇒ 注记写 `registry/source/components.meta.mjs`。
- 裁决：**同时改** `registry/source/open-decisions.mjs`（`open()`→`decided()`）与 `registry/foundation.json` ⇒ 用 `node registry/tools/sync-decision-runtime.mjs <id>`，再跑生成器链。
  📌 `decision.blocks` 不在运行时键里 ⇒ 只认种子；语义 =「曾约束过哪些包」⇒ **看到「decided + 非空 blocks」别当陈旧**；只有值是组件名才是真陈旧。
- 已裁决要点：`visual-baseline-in-git`=A（`float-button` 因 `position:fixed` 故意不入库）· `noNonNullAssertion`（测试目录关闭、生产逐个收窄、**禁止扫改**）· `picker-panel-ownership`=B · `ui-style-output`=A · `ui-tree-shaking`=A+B+D。

## §2 架构 / 构建
`L3 ui ｜ L2 form-core/picker/overlay/locale ｜ L1 motion/portal/position/a11y/virtual-list ｜ L0 utils/theme/icons ｜ 测试 test-utils`
- 包边界：消费者≥2 **个包**且无视觉语义才独立成包（13 包）；只被多个**组件**共用 ⇒ `packages/ui/src/_internal/`，**不是**新包。
  🚨 搬逻辑到 `_internal/` 时**它依赖的类型必须一起搬**（否则造出 `_internal/ → <组件>/` 反向依赖）。做法：类型搬进去，原 `interface.ts` **原样再导出** ⇒ 公开 API 零变化。
- ⚠️ **`picker` = 引擎+面板**（裁决 `picker-panel-ownership`=B）：面板在本包，ui 侧只做输入框+浮层+样式 ⇒ 它的 L2/L4/L5 是硬门禁；但**不产 CSS**。
- `prefixCls` 默认 `apollo`；动手前先 grep `packages/utils/src`。
- 🚨 R7（ADR 0004）：发布包零 `@ant-design/*` 运行时依赖，门禁 E19 双扫描。
- 全部 14 包 `preserveModules`（ui 出 766 `.mjs` + 70 CSS）；12 个走共享 `scripts/unbuild-preserve-modules.mjs`，**`theme`/`ui` 不用共享配置、在自己 `build.config.ts` 里各自打开** —— 「不用共享配置」≠「不用 preserveModules」。
- **B6**：73 条预算在 `tests/build/budget.json`（`ceil(实测×1.5+5)`）+「占全量 ≤ 30%」；再生 `node tests/build/checks/treeshake.mjs --measure-all`。预算只能因**技术原因**上调且须写理由。
- `exports`：ui 73 条 JS 深入口 + 70 条 `<c>/style.css`，只暴露入口名；两类由 `uiExtraExports()` 从单一真源推导。
- 🚨 **门禁必须跑真正会被发布的命令**（B1 曾硬编码裸 `unbuild` ⇒ 出单文件还全绿）。
- ⚠️ 本仓 **ESM-only** ⇒ `createRequire().resolve()` 探测必然 `ERR_PACKAGE_PATH_NOT_EXPORTED`（假警报）；用 `import.meta.resolve`，且探针文件必须在仓库内。

## §3 收口期判据
- 📌 置 `completed` 前三件套：① `COMPONENT_STYLES` 注册；② `index.ts` 导出(B8)；③ `tests/compat/fixtures/<c>/` 有 fixture(E9)。
- 🚨 **收口后必须 `git status` 确认已落盘** —— 曾两次「验证全绿但整片未提交」。
- ⚠️ 新增 demo 要配套 `.md`（每个 demo 一个 `.tsx` + `.md`）。
- **视觉变体避开静态帧测不到的面**：`:hover`/`cursor`/`transition`/纯属性(`href`/`id`) 截图不可见 ⇒ 必然空转（归 L1/L4）。🚨 写/改变体后 `md5 tests/visual/baselines/react/<c>/*.png | sort` 查同哈希。
- 🚨 **新增视觉用例后必须 `Read` 看基线图**。哈希查重 / 体积 / L6 exact 对「内容缺失」全是盲的（两侧一致地错时像素差异恰好为 0）。
- **L4 的 `it.each` 别用「长度不一致的元组数组」**(TS2345) ⇒ 同形对象数组 + `$name`。`*.test.ts` 也在 `vue-tsc` 内。
- 🚨 `.vue` 里出现 `typeof SomeComponent` 就查那条 import 有没有被 biome 改成 `import type`（PITFALLS 299）。**语义化槽支持函数形态** ⇒ prop 类型必须 `[Object, Function]`。

## §4 环境 / 命令 / 同步
- 🚨 视觉层与构建门禁入口**都要带** `CODEBUDDY_SAFE_DELETE_ENABLED=0`（另有 `CODEBUDDY_BROKERED_FS_HOOK_ENABLED=0` / `CODEBUDDY_SAFE_DELETE_SANDBOX=0`，本机两个都是 1）：漏了会在打包阶段被 safe-delete 拦下（阈值 50）。`pnpm` 不在 PATH ⇒ 先造 `/tmp/pnpm-shim/pnpm`。详见 `environment.md`。
- ⚠️ **`test:visual` / `test:types` 都不在 `verify:full`** ⇒ 都要显式跑。`test:types` 报 **unhandled error** 时会「Tests 全绿但 exit=1」⇒ 搜 `Unhandled Source Error`。（`build.config.ts` 的类型错误**只有** `test:types` 抓得到。）
- ⚠️ 改 foundation 包后**必须单独重建**；视觉层只链接 theme+ui ⇒ 用例里 import `@apollo-design/icons` 解析不到，用「两侧同构」替身。
- ⚠️ L6 解析的是 `packages/ui/dist` ⇒ 改**组件源码**也要先 `pnpm build:ui`。
- **GitHub 同步**：`git -c http.proxy=http://127.0.0.1:7890 push origin HEAD:master`（`origin` 私有）。⚠️ 到 GitHub 的**批量**传输直连会挂起 ⇒ 必须走代理；小 API 请求直连可用。
- 合并：`registry/*.json` 冲突**按冲突块解析**，别 `checkout --ours`，之后重跑生成器。**收口后立刻合 master**。⚠️「绿在本地」≠「绿在仓库」：依赖磁盘产物先 `git ls-files` 确认已入库。

## §5 进度（当前事实）
foundation **13/13**；组件 **72/72 completed**。
- ✅ **L6 基线已全覆盖**：`tests/visual/baselines/react/` 下 **71 个组件目录 / 1128 张 PNG，零基线：无**。⚠️ 别再信「9 个组件零基线只能 `--mode both`」那条（已过期）—— 动手前 `ls` 一遍数一下。
- Issue 批量修复进度见 `/tmp/issues/ledger.md`。已交付：#1–#9（button / space / input / select / date-picker / time-picker / input-number / form / checkbox），每轮跑全量 unit+dom-contract + L6 + L4 compat + biome。

## §6 判别式（合并 §8–§10，按主题）

### 响应性 / props 契约
- 🚨 **`useAttrs()` 不参与依赖追踪** ⇒ 包进 `computed` = 首帧快照（父级只改 `class`/`style`/`aria-*`/`data-*` 时永远读旧值）。全仓判据统一为**模板里 `v-bind="fn()"`**（渲染期求值）。⚠️ `vue-tsc` 对「组件 + `v-bind="fn()"`」要求返回值第一实参满足必填 prop ⇒ 模板里把必填 prop 显式写出来。
- 🚨 **新加的 Boolean prop 必须配 `withDefaults(…, { x: undefined })`，薄壳也要给** —— 未传时 Vue 强制 `false`，而 `existShowConfig`（`.some(v => v !== undefined)`）把「显式 false」判成「用户关了」⇒ `fillShowConfig` 的「全空即全开」兜底失效 ⇒ 整片不渲染。薄壳整包转发 `props`，不给就把 `false` 显式喂给内层（#6.2 实测：24h 3 列 → 0 列）。
- **公共 Hook 收裸值 = 静默失效**：`useAllowClear` / `useMergeSemantic` / `useDisabled` 已全部改成 `MaybeRefOrGetter` + `toValue`；新写 Hook 一律按此。
- 🚨 **`useSize` 必须用解析器形态** `useSize((ctx) => props.size ?? ctx)`：`useSize(props.size)` 是 setup 快照；**`useSize(() => props.size)` 会绕过 `ConfigProvider componentSize`**。全仓范式：tabs / radio / card / input / input-number / pagination（#8.1）。
- 🚨 **`cloneVNode` 是「合并」不是「替换」**：走 `mergeProps(child.props, extra)`，`mergeProps` 对 `on*` 键**拼成数组**。要复刻 React `cloneElement` 必须 `createVNode(child.type, 自己拼好的 props, child.children)` —— 否则用户回调调 2 次（`[user, user]`）或 `TypeError: attrs.onX is not a function`（#8.3）。
- ⚠️ **`triggers` / 事件键的形态**：rc 的 `trigger` 默认值**已经是 `onChange` 形态** ⇒ 查用户回调时键就是 `eventName` 本身，再拼一次 `on` 会得到 `onOnChange`（恒 undefined，**静默不调用户回调**）。

### 样式合并 / 语义槽
- 🚨 **样式合并不要用对象展开**：`attrs.style` 可能是**字符串**，`{...'width:200px'}` 得到 `{0:'w',…}` ⇒ Vue `setStyle` 抛 `'set' on proxy: trap returned falsish`（**整组件崩**）。助手 `semanticRootStyle` / `mergeStyles` 已统一归一（就地解析字符串，不引 `@vue/shared`——属幻影依赖）；新写合并逻辑沿用 `[semantic.root, rootStyle]` 数组形态。
- **语义 `root` 槽落点**（rc `SinglePicker.js:476-478`）：class = `[rootClass, classNames.root]`、style = `[styles.root, rootStyle]`（原生 style 胜）。
- **消重不是无条件的**：`_internal/use-merge-semantic.ts` 的 clsx **刻意**比共享版窄（只收字符串）。判据是「宽版会不会把错误形态静默吞掉」。

### 渲染 / 事件陷阱
- 🚨 **SFC 模板里不能放 HTML 注释** —— Vue 编译成 Comment vnode 保留，而 `Trigger` 取 `slots.default()[0]`（`_internal/trigger.ts:613-614`）⇒ 一条注释就把触发元素顶掉、**整个组件渲染成空**。注释写进 `<script>`。
- **组件 expose 用 getter**：`defineExpose({ get nativeElement() {…} })` —— 暴露对象被 `proxyRefs` 包一层，字面量会在 setup 期定格成 `null`。
- ⚠️ **`w.emitted('x')` 对「薄壳不声明 `defineEmits`」的组件无效**（time-picker / auto-complete）—— 靠 attrs 转发 `onXxx`，测试要 spy 那个 handler。
- ⚠️ **VTU `setValue()` 对文本输入会同时派发 `input` 与 `change`** ⇒ 计数用例只能调一次 `setValue`（再手动 `trigger('change')` 会数出 2）。
- 🚨 **末尾 `...restAttrs` 会覆盖内部同名事件键**（对象展开后者胜）：cascader 把 BaseSelect 的 `onSearch`/`onOpenChange` 顶掉（内部 `setSearchValue`/`setOpen` 不再跑）；switch 的 `onKeydown` 被内部覆盖（模板 `@keydown` 一次都不调）。⇒ **内部持有的事件键必须先从 `restAttrs` 摘掉**；用户回调通常已在内部处理器里被调（内部先跑、再通知用户）。
- 🚨 **prop 默认值写成字面量会堵死 ConfigProvider 回退**：`direction: { default: 'ltr' }` ⇒ `props.direction ?? ctx ?? 'ltr'` 永远短路在第一支，全局 RTL 不可能生效。收敛成 `default: undefined` + `mergedDirection`。同类：`componentSize` 要经 `useSize((ctx) => props.size ?? compactSize ?? ctx)`、`getPopupContainer` 要 `?? config.getPopupContainer`。
- 🚨 **上游 `useXxx(...)`（React 每次渲染重算）在 Vue 侧必须包 `computed`**，否则动态改配置静默无效（cascader `useSearchConfig` #12.3）。同族：`normalizeSearchConfig` / `fillFieldNames` 这类「归一」函数。
- 🚨 **别信注释、要跑代码**：switch 的 `interface.ts` 注释写着 D21 的正确形态而代码写 `String`；radio README 的 D44「form 未落地」早已过期（form 在 #8 落地）⇒ 引用任何「已知缺口 / PLATFORM 判据」前先确认它是否仍成立。
- ⚠️ **空态占位项也算 `menu-item`** ⇒ 断言「搜索结果变空」不能写 `length === 0`（换成不匹配 filter 后是 1 条 disabled 的 `Not Found`）。
- ⚠️ `autoFocus` 必须自己 `focus()`：原生 `autofocus` 只在 HTML 解析期生效，Vue 是创建后才设属性 ⇒ 浏览器与 jsdom 都不聚焦；**禁用态不聚焦**（判据与 Rate / action-button 一致）。

### 测试探针
- 🚨 **浮层断言一律查 `wrapper.element`，不要查 `document`** —— `attachTo: document.body` + `document.querySelector` 会**串到上一个实例残留的节点**。曾据此误判「纯 `picker:'time'` 面板在 jsdom 里渲染为空」，白绕一大圈。正确口径 `wrapper.element.querySelectorAll`。
- **探针 buildAll 传绝对路径**：vite outDir 相对 `render/` 解析，相对路径产物写歪 ⇒ bundle 是旧的 ⇒ 结果全盘误导（判据：asset 名 hash 不变）。

### 已知忠实移植（非 bug）
- **antd 6.6.4 `Transfer` 的 `defaultRender = () => null`** ⇒ 不传 `render` 列表项内容为空（`item.title` 只进原生 `title` 属性）。
- 🚨 **U-KEYFRAMES 家族**：静态 CSS 里 `animation-name` 引用 cssinjs 开发态占位名（`css-dev-only-do-not-override-…-antFadeIn`）⇒ `@keyframes` 对不上 ⇒ 动画不跑、motion 类名**卡死在 appear 态**。新组件样式禁照抄占位名（用 select/style 的「动画名稳定化 + keyframes 内联」模式）。
- **useClosable 的 vnode 注入**：antd 对最终 closeIcon 注入 `aria-label=closeLabel(locale.global.close)`；本仓 `computeClosable` 已用 cloneVNode 等价实现。新消费者不用自己做。
