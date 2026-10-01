# MEMORY.md — 项目长期约定

> 只放**仓库文档里没有的**：易错判据、工具所有权、未决事项。
> 规则本体：`AGENTS.md`/`WORKFLOW.md`/`TESTING.md`/`COMPATIBILITY.md`/`ARCHITECTURE.md`；
> **坑的全文**：同目录 `PITFALLS.md`（250+ 条，**查坑先去那**，本文件只留判据）；日常进展：`YYYY-MM-DD.md`。

## 本质与事实来源

Vue 3 + TS 重写 Ant Design（兼容规格，非代码来源），目标 **antd 6.6.4**。
优先级：用户指令 > 仓库规范 > `registry/*.json` > antd 产物/源码 > 文档 > 先验。
**禁止凭记忆描述 antd**：读 `/tmp/antd-src/package/`（⚠️ /tmp 会清，新会话先 `ls`，缺了按 PITFALLS 42 恢复）。
凡要说「某决策/约定是这样」先跑 `node registry/tools/ask.mjs`（`decision <id>` 出**原文**）。

## 取任务与派生字段

`node registry/tools/next-task.mjs`（唯一权威；并行 `--parallel`；一轮一包，G0→G14）。
派生字段（手改被覆盖）：`notDo`/`publicApi`/包 package.json ← `scaffold-packages.mjs`；
`foundation.json` ← `foundation-status.mjs`；components/dependencies/tokens/workstreams ← `gen-*.mjs`。
🚨 跨运行保留的只有：`status` + 11 个维度状态 + `blockers` + `layerNotes`。
⚠️ `notes` **不是**保留字段 ⇒ 写注记要改 `registry/source/components.meta.mjs`（PITFALLS 220）。

## 环境（全部实测）

Node ≥22.12（managed）｜pnpm 12.4.2｜TS 5.9｜Vitest 5｜Playwright（`channel:'chrome'`）。
- 🚨 `pnpm -r run build` 永不可用；权威构建门禁 `CODEBUDDY_SAFE_DELETE_ENABLED=0 node tests/build/run.mjs`。
- 🚨 三个「自己删目录」的入口都要带 `CODEBUDDY_SAFE_DELETE_ENABLED=0`：`tests/build/run.mjs`、
  **`tests/visual/run.mjs`**、**`pnpm build:ui`**（删 `.dts-tmp`，不带则整个 build 退出 1）。
- 🚨 本机 `pnpm` **不在 PATH**（只有 corepack）⇒ 脚本内部调 `pnpm` 会 127。对策：造
  `/tmp/pnpm-shim/pnpm` 包一层 corepack，再 `PATH=/tmp/pnpm-shim:$PATH pnpm run <script>`（2026-09-23 实证）。
- 🚨 pnpm「超时无输出」先查 corepack 下载提示；长命令一律 `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1`。
- ⚠️ `exit 137`+零日志 ≠ OOM，先怀疑前台 120s 超时；>2 分钟后台跑。
- ⚠️ vitest：降级（`--pool=forks --maxWorkers=1`）会**静默少跑**给假绿灯；`vitest run <目录>` 过滤
  **不可靠**（会漏文件）⇒ 报数一律用 **project 名**（unit / dom-contract / types / a11y / theme），
  单文件传完整路径。⚠️ 裸 `vitest run <dir>` 会把 `types` project 一起跑 ⇒ 大量 `TypeCheckError`
  （SFC 解析噪音，PITFALLS 73）且 **exit=1** —— **看「Tests passed」与「Type Errors」，别看退出码**。
- 🚨 jsdom 冷缓存让 worker 启动超时（60s 硬上限，与代码无关）⇒ 先 `node -e "require('jsdom')"` 预热（199/221/231）。
- 🚨 **收口必须跑两个 lint**：`pnpm run lint:types`（`vue-tsc -p tsconfig.json`）**和**
  `pnpm run lint:format`（`biome check .`）—— 互补不重叠（vue-tsc 不看未用 import / 未用类型参数）。
  ⚠️ **不许手写 glob**（zsh 不展开 `**` ⇒ 漏顶层文件给假绿灯，PITFALLS 213）。biome error 基线 **0**。
- 🚨 `registry:check` 顺序：`gen-registry.mjs` → `foundation-status.mjs`（**不带 `--check`**）→
  `gen-workstreams.mjs --check` → `validate-registry.mjs`。组件收口后要刷 foundation-status + workstreams。
- ⚠️ 多文件机械改动**别用 Edit 批量**（会「部分落盘但报 success」）⇒ 写 Node 脚本断言「恰好命中 1 次」。
- ⚠️ 临时插桩标 `[TMP-DBG]`，收口前清光（`dist/` 是 gitignore ⇒ 不会被 `git status` 提醒）。
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

## ⚠️ 跨包易错判据（全文见 PITFALLS，此处只留判据）

1. Vue 事件 prop 名**全小写**（`onMouseenter`；大写静默失效）。
2. `VNodeChild` prop 必须显式 `undefined` 默认值（Boolean 转换陷阱）。
3. 🚨 **Vue 未声明 prop ⇒ 归进 `attrs` ⇒ 静默失效**：凡「按 key 从 props 取值」（尤其 `pickProps`）
   的键必须在 props 里声明过。**已踩三次**（顶层时间 props / `onModeChange` / 4 个图标 props，250）。
4. `biome.json` 不能写注释；对象字面量内 suppression 无效，用变量绕过（139）。
5. catch-all prop 别用 `PropType<unknown>`（推断成 undefined 全线误报，137/185）；用 `[String,Number,Boolean]`。
6. 🚨 `packages/ui/src/index.ts` 手工维护（生成器不覆盖）：只动自己的 export 块、按字母序追加；
   re-export 重名用别名（158/168）。跨包重名（如 `CustomTagProps`）按 antd 的做法**不导出**。
7. 🚨 进 `style` 的尺寸**必须 `toCssSize()`**：Vue 不给数字补 px，裸数字被静默丢弃（170/D94）。
8. 🚨 组件变量声明块要覆盖**全部根形态**（含 Teleport 浮层根），漏挂 ⇒ 浮层里 `var()` 静默回退（171/D95/248）。
9. 🚨 **浮层必须复刻上游的 `-panel-container` 那层**：它是 `pointer-events: none → auto` 的唯一重置点，
   缺了 ⇒ **真实浏览器里点不动**（jsdom 的 `trigger()` 绕过 `pointer-events` ⇒ L1–L5 全绿，251）。
10. 产物 CSS 里的 `NaN`/`undefined` 由构建门禁 **B11** 兜。
11. 🚨 `setup()` 里不能创建带 `ref` 的 vnode（178）；浮层「关闭」异步 ⇒ 断言卸载要**轮询**（179）。
12. ⚠️ 动效名前缀是 `rootPrefixCls`（`apollo-zoom`/`apollo-fade`），写错**静默失效**（180）。
13. 🚨 React 的值是快照、Vue 响应式值是活引用 ⇒ 上游「写状态→立刻比较」在 Vue 恒为假；
    对策**先取快照再写**（207）。
14. 🚨 `watch(…,{immediate:true})` 在 `setup()` 同步跑一次（那时 `ref` 还是 null），DOM 后不再补跑（211）。
15. ⚠️ `defineComponent` 的 `required: true` 要写 `as const`（200）；`ref<深联合>` 会 `TS2589` ⇒ `shallowRef`。
16. 🚨 驼峰转 kebab 用 `/([a-z0-9])([A-Z])/g`；`/[A-Z]/g` 会把 `paddingBlockSM` 拆坏（228）。
17. 🚨 测浮层几何前必须剥 motion 相位类（`stabilize.mjs` 的 `stripMotionPhaseClasses`）；
    指纹：`getBoundingClientRect()` 全 0 而 `offsetWidth` 正常（253）。
18. ⚠️ **「旧写法有测试、新写法没有」最易长期潜伏**：旧写法红不了，新写法没人测（252）。
19. ⚠️ `Skeleton` 设了 `inheritAttrs:false` ⇒ 传 `className`，`class` 被丢弃（181）。
20. 🚨 **本仓把上游的「外层 Provider」挪进了组件内部** ⇒ 外层再 `provide` **完全不生效**
    （最近的赢）。`PickerPanel` 自己 `providePanelHack`，所以双面板的
    `hidePrev` / `hideNext` / `onCellDblClick` 只能走 **props**（256）。
    凡「上游在外层 Context 下发」的地方，先 grep `provide` 再动手。
21. 🚨 **类型比上游窄时先问「上游是不是 JS」**：rc 的 `showTime.disabledTime` 单值 1 参、
    **范围 3 参**；本仓收窄成一种形态 ⇒ 范围编译不过。修法是**补类型**
    （`TimeConfigShowTime`），不是改实现（257）。函数参数**逆变**，可选参数救不了。

## 主分支 / 合并 / 并行（硬教训）

- master 检出在 `/Users/nanren/Code/apollo-design-ui`；合并前看那边工作区，有 WIP 先 `git stash push -u`。
- `registry/*.json` 冲突**按冲突块解析**（手写 status 会丢），别 `checkout --ours`；之后重跑生成器。
- 合并后必查：`index.ts` export 排序、生成器重跑、`dist/` 各 worktree 自建。
- **收口后立刻合 master**；ff 后必须 `git rev-parse` 确认真的动了。
- 「绿在本地」≠「绿在仓库」：依赖磁盘产物的结论先 `git ls-files` 确认产物已入库。
- 派 subagent：门禁必须前台跑；429 后接手先 `git status`+`git log`，写文件前确认没有别人的东西。

## 共享文件（多流必碰，按字母序追加）

`packages/ui/src/index.ts`、`style/index.ts`、`tests/visual/matrix.mjs`、`cases/shared.mjs`、
`tests/compat/baseline/*.mjs`、`registry/source/open-decisions.mjs`、root `package.json`。
新组件另需：`tests/compat/baseline/<name>.mjs` + `tests/visual/render/cases/{react,vue}/<name>.{jsx,js}` + matrix 一行。

## 其它易忘

- ⚠️ 改 foundation 包（utils/portal/motion/**picker**）后**必须单独重建**，否则 ui 的 dist 带不上（176/249）。
- **视觉层只链接 theme + ui 两个 workspace 包** ⇒ **用例文件**里 import `@apollo-design/icons` 解析不到；
  组件内部 import 没问题。需要图标时用「两侧同一份内联结构」替身。
- ⚠️ demo 的 `.md` 有**两派格式**：frontmatter（carousel/input-number）与 `## zh-CN`/`## en-US`。
- ⚠️ 「L7」两个口径：`TESTING.md` §10 = Build Test；组件测试文件头把 theme 层也叫 L7。
- `_internal/` 三次法则收敛物：`use-merged-mask.ts`、`to-css-size.ts`、`color-composite.ts`。
- **全仓 `update:*` 缺口**（PITFALLS 162）：C11 要求 v-model 与语义事件同时发出，目前仅 radio/switch 实现。

## 当前进度（2026-10-01）

- foundation **13/13 completed**；组件 **60/72 completed**；可执行 13 / 被阻塞 1。
- **`date-picker` 已 `completed`**（11 维度全 done，S1–S5 落地；L6 **27/27 exact**）。
- **`masonry` 已 `completed`（2026-10-01）** —— 11 维度全 done。
  **无 foundation 缺口**（14 处依赖全部可复用，对照表见 `docs/analysis/masonry.md` §0）；
  L4 20 用例（**只 1 条豁免**）/ L5 15 条（零 axe violation）/ L6 **21/21 exact** /
  L3 26 passed / demo 6 个（`expectCount: 6`）。
  开工先读 `packages/ui/src/masonry/PLAN.md`（Gate 清单已全部勾掉）。
- 下一条任务用 `node registry/tools/next-task.mjs` 取。
- **进行中：`anchor`**（P5 / M / 526 行产物）—— **6/11 维度 done**
  （antdApi · api · token · style · unit · interaction），`status: analyzing`。
  已落地：`docs/analysis/anchor.md`（G1）· `interface.ts` · `style/token.ts` ·
  **`Anchor.ts` + `AnchorLink.ts` + `context.ts` + `style/index.ts`**（都是 `.ts` 渲染函数，
  理由见 README §3）· 用例 **18 条**。
  剩 **G7 type · G8 a11y · G9 visual · G10 compat · G11 docs** → 然后 G12–G14。
  ⚠️ 上游 `Anchor.test.tsx` 有 **49** 条，目前只镜像了 18 条（收口前要补）。
  ⚠️ 三处易错：`onClick` 是**自定义签名的 prop**（不能声明成 `emits:['click']`，
  否则组件上的 `@click` 不再挂到根元素）；`Anchor` **没有** `ref`/`expose`（上游是 `React.FC`）；
  `children` 在 Vue 侧是**插槽** ⇒ spread item 前要摘掉（PITFALLS 271）。
- ⚠️ **`test:visual` 不在 `verify:full`**、`test:types` 也不在 ⇒ 两条都要显式跑。
- 未决：B6 按需样式子路径（`exports` 缺 `./css/*`）；`--project types` 的 SFC 解析噪音（PITFALLS 73）；
  Empty SVG 不跟 darkAlgorithm；开放决策见 `ask decisions --open`。
- ⚠️ **必读判据**（PITFALLS 256–267）：
  `PickerPanel` 自己 provide ⇒ hack 面走 props（256）；
  `TimeConfigSource.showTime` 只是「面板形态」，范围是三参 ⇒ 用 `TimeConfigShowTime`（257）；
  `Selector.onSelectorClick` 要收事件（258）；范围**没有** `multiple` / `removeIcon`（261）；
  `fieldCount` 传 getter（262）；`toDateArray` 收范围元组（263）；
  🚨 **渲染期之外创建的 vnode 不许带 `ref:`**（264）；
  🚨 **`hoverRangeValue` 是 `-cell-in-range` 的唯一来源**（265）；
  🚨 **L6 走 `packages/ui/dist`，改源码要先 `pnpm build:ui`**（266）；
  🚨 **`emit('x')` 自己会调 `props.onX` ⇒ 别手写一遍（会调两次）**（267）。
