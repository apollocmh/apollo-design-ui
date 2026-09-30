# MEMORY.md — 项目长期约定

> 只放**仓库文档里没有的**：工具所有权、易错判据、未决事项。
> 规则本体：`AGENTS.md`/`WORKFLOW.md`/`TESTING.md`/`COMPATIBILITY.md`/`ARCHITECTURE.md`；
> 坑的**全文**：同目录 `PITFALLS.md`（240+ 条，**查坑先去那**，本文件只留索引号）；日常进展：`YYYY-MM-DD.md`。

## 本质与事实来源

Vue 3 + TS 重写 Ant Design（兼容规格，非代码来源），目标 **antd 6.6.4**。
优先级：用户指令 > 仓库规范 > `registry/*.json` > antd 产物/源码 > 文档 > 先验。
**禁止凭记忆描述 antd**：读 `/tmp/antd-src/package/`（⚠️ /tmp 会清，新会话先 `ls`，缺了按 PITFALLS 42 恢复）。
凡要说「某决策/约定是这样」先跑 `node registry/tools/ask.mjs`（`decision <id>` 输出原文；`decisions --open` 看未决）。

## 取任务与派生字段

`node registry/tools/next-task.mjs`（唯一权威；并行 `--parallel`；一轮一包，G0→G14）。
派生字段（手改会被覆盖）：`notDo`/`publicApi`/包 package.json ← `scaffold-packages.mjs`；
`foundation.json` ← `foundation-status.mjs`；components/dependencies/tokens/workstreams ← 各 `gen-*.mjs`。
🚨 **跨运行保留的只有**：`status` + 11 个维度状态 + `blockers` + `layerNotes`。
⚠️ `notes` **不是**保留字段（生成器 `notes: meta.notes ?? null`）—— 改 `components.json` 的 notes 会被
下次 `registry:gen` **静默抹掉**；写注记要改 `registry/source/components.meta.mjs`（PITFALLS 220）。
组件收口后要刷 foundation-status + gen-workstreams。

## 环境（全部实测）

Node ≥22.12（managed）｜pnpm 12.4.2｜TS 5.9｜Vitest 5｜Playwright（`channel:'chrome'`）。
- 🚨 `pnpm -r run build` 永不可用；权威构建门禁 `CODEBUDDY_SAFE_DELETE_ENABLED=0 node tests/build/run.mjs`。
- 🚨 三个「自己删目录」的入口都要带 `CODEBUDDY_SAFE_DELETE_ENABLED=0`：`tests/build/run.mjs`、
  `tests/visual/run.mjs`、`pnpm build:ui`（删 `.dts-tmp`，不带则退出 1）。
- 🚨 本机 `pnpm` 不在 PATH（只有 corepack）⇒ 脚本内部调 `pnpm` 会 127。对策：造 `/tmp/pnpm-shim/pnpm`
  包一层 corepack，再 `PATH=/tmp/pnpm-shim:$PATH pnpm run <script>`（2026-09-23 实证）。
- 🚨 pnpm「超时无输出」先查 corepack 下载提示；长命令一律 `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1`。
- ⚠️ `exit 137`+零日志 ≠ OOM，先怀疑前台 120s 超时；>2 分钟后台跑。
- ⚠️ 降级 vitest（`--pool=forks --maxWorkers=1`）会**静默少跑**给假绿灯；`vitest run <目录>` 过滤不可靠，
  跑单文件传完整路径。报数一律用 **vitest project 名**（unit / dom-contract / types / a11y / theme）。
- 🚨 **收口必须跑两个 lint**：`pnpm run lint:types`（`vue-tsc -p tsconfig.json`）**和**
  `pnpm run lint:format`（`biome check .`）—— 互补不重叠（vue-tsc 不看未用 import / 未用类型参数）。
  ⚠️ **不许手写 glob**：zsh 不递归展开 `**` ⇒ `biome check src/**/*.ts` 漏顶层文件给假绿灯（PITFALLS 213）。
  biome error 基线 **0**；warnings ≈187 不 fail 门禁。
- 🚨 `registry:check` 顺序：`gen-registry.mjs` → `foundation-status.mjs`（**不带 `--check`**）→
  `gen-workstreams.mjs --check` → `validate-registry.mjs`。
- ⚠️ 多文件机械改动**别用 Edit 批量**（会「部分落盘但报 success」）⇒ 写 Node 脚本断言「恰好命中 1 次」。
- ⚠️ 临时插桩标 `[TMP-DBG]`，收口前 grep 清光（`dist/` 是 gitignore ⇒ 不会被 `git status` 提醒）。
- 并发红线：全仓构建门禁同一时刻只允许一个会话，锁 `/tmp/apollo-build-gate.lock`。
- 🚨 jsdom 冷缓存会让 vitest worker 启动超时（60s 硬上限，与代码无关）——先怀疑环境（199/221/231）。

## 架构要点

```
L3 ui ｜ L2 form-core/picker/overlay/locale ｜ L1 motion/portal/position/a11y/virtual-list
L0 utils/theme/icons ｜ 测试 test-utils
```
- 包边界：消费者 ≥2 且无视觉语义才独立成包，共 13 包；组件间共享代码放 `packages/ui/src/_internal/`。
- ⚠️ **`picker` = 引擎 + 面板**（裁决 `picker-panel-ownership`=B）：面板组件在本包，`ui` 的
  DatePicker/TimePicker/Calendar 只做输入框 + 浮层 + 样式 ⇒ 它的 L2/L4/L5 是**硬门禁**。但它**不产 CSS**。
- `prefixCls` 默认 `apollo`。动手前先 grep `packages/utils/src`。
- 🚨 R7（ADR 0004）：发布包零 `@ant-design/*` 运行时依赖，门禁 E19 双扫描（产物扫描前必须 stripComments）。
- Oracle 判据：上游零框架耦合 ⇒ 可对拍；绑 React 生命周期 ⇒ 只能读源码 + 行为测试。

## ⚠️ 跨包易错判据（全文见 PITFALLS，此处只留判据）

1. Vue 事件 prop 名**全小写**（`onMouseenter`；大写静默失效）。
2. `VNodeChild` prop 必须显式 `undefined` 默认值（Boolean 转换陷阱）。
3. `biome.json` 不能写注释；`--write` 配置非法时静默重排全仓。
4. 🚨 `packages/ui/src/index.ts` 手工维护（生成器不覆盖）：只动自己的 export 块、按字母序追加。
5. catch-all prop 别用 `PropType<unknown>`（推断成 undefined 全线误报）——用 `[String,Number,Boolean]` 联合（137）。
6. biome warning 不 fail 门禁；对象字面量内 suppression 无效，用变量绕过（139）。
7. Edit 批量编辑可能部分落盘且报 success——改完必须 grep 回读（138）。
8. 🚨 进 `style` 的尺寸**必须 `toCssSize()`**：Vue 不给数字补 px，裸数字被静默丢弃（170/D94）。
9. 🚨 组件变量声明块要覆盖**全部根形态**（含 Teleport 浮层根），漏挂 ⇒ 浮层里 `var()` 静默回退（171/D95）。
10. 产物 CSS 里的 `NaN`/`undefined` 由构建门禁 **B11** 兜。
11. 🚨 `setup()` 里不能创建带 `ref` 的 vnode ⇒ 要子实例用 `onReady` 回调，要命令面把 `Ref` 当普通 prop（178）。
12. 🚨 浮层的「关闭」是异步的（离场动效后才卸载）⇒ 断言卸载必须**轮询**（179）。
13. 🚨 `as unknown as PropType<unknown>` 让 prop 推断成 `undefined`；用具体命名类型（185）。
    同族：`ref<深联合>` 触发 `TS2589` ⇒ 换 `shallowRef`。
14. ⚠️ 动效名前缀是 `rootPrefixCls`（`apollo-zoom`/`apollo-fade`），写错**静默失效**（180）。
15. ⚠️ `Skeleton` 设了 `inheritAttrs:false` ⇒ 传 `className`，`class` 被丢弃（181）。
16. 🚨 React 的值是快照、Vue 响应式值是活引用 ⇒ 上游「写状态→立刻比较」在 Vue 恒为假；
    对策**先取快照再写**（207）。
17. 🚨 `watch(…,{immediate:true})` 在 `setup()` 同步跑一次（那时 `ref` 还是 null），DOM 后不再补跑（211）。
18. ⚠️ `defineComponent` 的 `required: true` 要写 `as const`，否则 `ExtractPropTypes` 判不出必填（200）。
19. 🚨 驼峰转 kebab 用 `/([a-z0-9])([A-Z])/g`；`/[A-Z]/g` 会把 `paddingBlockSM` 拆坏（228）。
20. 🚨 ui 根 index.ts 的 re-export 必须用别名（`genTokenDecls as genXTokenDecls` /
    `prepareComponentToken as prepareXComponentToken`，158/168）。

## 主分支 / 合并 / 并行（硬教训）

- master 检出在 `/Users/nanren/Code/apollo-design-ui`；合并前看那边工作区，有 WIP 先 `git stash push -u`。
- `registry/*.json` 冲突**按冲突块解析**（手写 status 会丢），别 `checkout --ours`；之后重跑生成器。
- 合并后必查：`index.ts` export 排序（biome Safe fix）、生成器重跑、`dist/` 各 worktree 自建。
- **收口后立刻合 master**；ff 后必须 `git rev-parse` 确认真的动了。
- 「绿在本地」≠「绿在仓库」：依赖磁盘产物的结论先 `git ls-files` 确认产物已入库。
- 派 subagent：门禁必须前台跑；429 后接手先 `git status`+`git log`，**写文件前确认没有别人的东西**。

## 共享文件（多流必碰，按字母序追加）

`packages/ui/src/index.ts`、`style/index.ts`、`tests/visual/matrix.mjs`、`cases/shared.mjs`、
`tests/compat/baseline/*.mjs`、`registry/source/open-decisions.mjs`、root `package.json`。
新组件另需：`tests/compat/baseline/<name>.mjs` + `tests/visual/render/cases/{react,vue}/<name>.{jsx,js}` + matrix 一行。

## 其它易忘

- ⚠️ 改 foundation 包（utils/portal/motion）后**必须单独重建**，否则 ui 的 dist 带不上（176）。
- **视觉层只链接 theme + ui 两个 workspace 包** ⇒ **用例文件**里 import `@apollo-design/icons` 解析不到；
  组件内部 import 没问题。需要图标时用「两侧同一份内联结构」替身。
- ⚠️ demo 的 `.md` 有**两派格式**：frontmatter（carousel/input-number）与 `## zh-CN`/`## en-US`（dropdown/app/menu/image）。
- ⚠️ 「L7」两个口径：`TESTING.md` §10 = Build Test；组件测试文件头把 theme 层也叫 L7。
- `_internal/` 三次法则收敛物：`use-merged-mask.ts`（drawer+modal）、`to-css-size.ts`、
  `color-composite.ts`（返回 `Color` 实例而非字符串，格式由调用方决定）。
- **全仓 `update:*` 缺口**（PITFALLS 162）：C11 要求 v-model 与语义事件同时发出，目前仅 radio/switch 实现。

## 当前进度（2026-10-01）

- foundation **13/13 completed**；组件 **58/72 completed**；可执行 13 / 被阻塞 1。
- **进行中：`date-picker`**（status=analyzing；P5/XL）。G0–G3 完，G7/G8/G10/G11 完，G4 分 S1–S5。
  S1 功能 + 样式已落地（257 规则 / 45 声明）。
  **S2 的阻塞项已闭合**（2026-10-01：补 rc `useLocale`→`fillLocale` 的硬编码兜底层，
  `hooks/picker-filled.ts`；根因更正见 PITFALLS 235）+ **`format` 函数形态已落地**（PITFALLS 236）。
  S2 只剩「落值 + 提交时机」= 上游 `useRangeValueChange.js`（405 行）状态机，
  **与 S4 字段导航同源、必须同批做**。开工先读 `date-picker/PLAN.md` + `README.md §5.5`。
- ⚠️ `registry:check` 在本轮之前**已经是红的**（E10 两处上游字面量色）—— 已按 UPSTREAM 逐值豁免
  （PITFALLS 238）。**教训**：产物里的硬编码色有两种成因，先重跑提取器再决定改哪边。
