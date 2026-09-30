# MEMORY.md — 项目长期约定

> 只放**仓库文档里没有的**：工具所有权、易错判据、未决事项。
> 规则本体：`AGENTS.md`/`WORKFLOW.md`/`TESTING.md`/`COMPATIBILITY.md`/`ARCHITECTURE.md`；
> 坑：同目录 `PITFALLS.md`（185 条，**查坑先去那**）；日常进展：`YYYY-MM-DD.md`。

## 本质与事实来源

Vue 3 + TS 重写 Ant Design（兼容规格，非代码来源），目标 **6.6.4**。
优先级：用户指令 > 仓库规范 > `registry/*.json` > antd 产物/源码 > 文档 > 先验。
**禁止凭记忆描述 antd**：读 `/tmp/antd-src/package/`（⚠️ /tmp 会清，新会话先 `ls`，缺了按 PITFALLS 42 恢复）。
凡要说「某决策/约定是这样」先跑 `node registry/tools/ask.mjs`（decision <id> 输出原文）。

## 取任务与派生字段

`node registry/tools/next-task.mjs`（唯一权威；并行用 `--parallel`；一轮一包，G0→G14）。
派生字段（手改被覆盖）：`notDo`/`publicApi`/包 package.json ← `scaffold-packages.mjs`；
`foundation.json` ← `foundation-status.mjs`；components/dependencies/tokens/workstreams ← 各 `gen-*.mjs`；
🚨 **跨运行保留的只有**：`status` + 11 个维度状态 + `blockers` + `layerNotes`。
⚠️ **`notes` 不是保留字段**（生成器是 `notes: meta.notes ?? null`）—— 改 `components.json` 的
notes 会被下次 `registry:gen` **静默抹掉**；要写注记就改 `registry/source/components.meta.mjs`（PITFALLS 220）。
组件收口后要刷 foundation-status + gen-workstreams（registry:check 会催）。

## 环境

Node ≥22.12（managed 路径）｜pnpm 12.4.2｜TS 5.9｜Vitest 5｜Playwright（`channel:'chrome'`）。
- 🚨 `pnpm -r run build` 永远不可用；权威构建门禁 `CODEBUDDY_SAFE_DELETE_ENABLED=0 node tests/build/run.mjs`。
- 🚨 会自己删目录的三个入口都要带 `CODEBUDDY_SAFE_DELETE_ENABLED=0`：`tests/build/run.mjs`、
  **`tests/visual/run.mjs`**、**`pnpm build:ui`**（后者删 `packages/ui/.dts-tmp`，3026 个文件，
  不带时 dts 步骤报 `SAFE_DELETE_BULK_CONFIRM_REQUIRED` 并让整个 build 退出 1 —— 2026-09-26 实测）。
- 🚨 本机 `pnpm` **不在 PATH**（只有 corepack，`corepack pnpm`=12.4.2）；脚本内部再调 `pnpm` 会 127。
  对策：`printf '#!/bin/zsh\nexec /Users/nanren/.workbuddy/binaries/node/versions/22.22.2-3/bin/corepack pnpm "$@"\n' > /tmp/pnpm-shim/pnpm && chmod +x` 后 `PATH=/tmp/pnpm-shim:$PATH pnpm run <script>`（2026-09-23 实证）。
- 🚨 pnpm「超时无输出」先查 corepack 下载提示，长命令一律 `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1`。
- ⚠️ `exit 137`+零日志 ≠ OOM，先怀疑前台 120s 超时；>2 分钟的命令后台跑或显式 timeout。
- ⚠️ 降级运行的 vitest（`--pool=forks --maxWorkers=1`）会**静默少跑**给假绿灯，不能当门禁证据；
  看「N passed」先核分母。`vitest run <目录>` 位置过滤不可靠，跑单文件传完整路径。
- 收口只跑一次全仓门禁；跑重型门禁前关 IDE。`tsc --build` 已落地（`pnpm typecheck:build`）。
- 🚨 **收口必须跑「两个」lint**：`pnpm run lint:types`（`vue-tsc -p tsconfig.json`）**和**
  `pnpm run lint:format`（`biome check .`）。二者**互补不重叠** —— `vue-tsc` 不看未使用的
  import / 未使用的 TS **类型参数**（后者 biome 会报 `noUnusedVariables`）。
  ⚠️ **门禁命令不许自己手写 glob**：zsh 不递归展开 `**` ⇒ `biome check src/**/*.ts` 会漏掉
  顶层 `src/*.ts`，给出「0 error」**假绿灯**（2026-09-30 真踩，PITFALLS 213）。
  biome error 基线：**0**（2026-09-30 清算，此前 21 个）；warnings ≈187 不 fail 门禁。
- 🚨 `registry:check` 的**顺序**：`gen-registry.mjs` → `foundation-status.mjs`（**不带 `--check`**，
  否则误报「foundation.json 已过期」）→ `gen-workstreams.mjs --check` → `validate-registry.mjs`。
- ⚠️ 多文件/多点机械改动**别用 `Edit` 批量**（会「部分落盘但报 success」，连签名带 call-site
  半改会让 `tsc` 直接红）⇒ 写 Node 脚本逐条断言「恰好命中 1 次」并打印 `OK/SKIP`。
- ⚠️ 临时插桩一律标 `[TMP-DBG]` 并**收口前 grep 清光**：`dist/` 是 gitignore ⇒ 插桩进了产物
  **不会被 `git status` 提醒**。
- 并发红线：全仓构建门禁同一时刻只允许一个会话，锁 `/tmp/apollo-build-gate.lock`（mkdir 抢/rmdir 放）。

## 架构要点

```
L3 ui ｜ L2 form-core/picker/overlay/locale ｜ L1 motion/portal/position/a11y/virtual-list
L0 utils/theme/icons ｜ 测试 test-utils
```

- 包边界：消费者 ≥2 且无视觉语义才独立成包，共 13 包；组件间共享代码放 `packages/ui/src/_internal/`。
- ⚠️ **`picker` 是「引擎 + 面板」**（裁决 B）：面板组件（`PickerPanel` / `PanelHeader` /
  七个面板 / `TimeColumn`）在**本包**，`ui` 的 DatePicker/TimePicker/Calendar 只做
  输入框 + 浮层 + 样式。⇒ 它的 L2/L4/L5 是**硬门禁**（不是 n/a）。
  L4 的基线打的是 **rc 的 `PickerPanel`**（antd 的 DatePicker 在 SSR 下不渲染面板）。
  ⚠️ `PickerFormat` **没有泛型参数**（`string | readonly string[] | { format: string }`）——
  上游 `@rc-component/picker` 的 `format` 还含 `CustomFormat<DateType>` **函数形态**，本仓未实现，
  故不挂泛型；做 `date-picker` 时若要支持函数式 format，**随实现一起加回来**（PITFALLS 214）。
- `prefixCls` 默认 `apollo`。动手前先 grep `packages/utils/src`（focus 陷阱/is-visible/raf/dev-warning 两参/color 等）。
- 🚨 R7（ADR 0004）：发布包零 `@ant-design/*` 运行时依赖，门禁 E19 双扫描（产物扫描前必须 stripComments）。
- Oracle 判据：上游零框架耦合 ⇒ 可对拍；绑 React 生命周期 ⇒ 只能读源码+行为测试。oracle 与 units 并存。

## ⚠️ 跨包易错判据（详见 PITFALLS）

1. Vue 事件 prop 名**全小写**（`onMouseenter`；大写静默失效）。
2. `VNodeChild` prop 必须显式 `undefined` 默认值（Boolean 转换陷阱）。
3. `biome.json` 不能写注释；`--write` 配置非法时静默重排全仓。
4. 🚨 `packages/ui/src/index.ts` 手工维护（生成器不覆盖），多流必碰：只动自己的 export 块、按字母序追加。
5. catch-all prop 别用 `PropType<unknown>`（vue-tsc 推断成 undefined 全线误报）；
   用 `[String, Number, Boolean]` 联合 + Group 侧 VNodeProps 放行（PITFALLS 137）。
6. biome warning 不 fail 门禁（error 才会）；对象字面量内 suppression 注释无效，
   用变量替代字面量绕过（PITFALLS 139）。
7. Edit 工具批量编辑可能部分落盘且报 success——改完必须 grep 回读（PITFALLS 138）。
8. 🚨 进 `style` 的尺寸**必须 `toCssSize()`**：Vue 3 不给数字补 px（React 才补），裸数字被
   静默丢弃、还会被 CSS 兜底伪装成「有图但尺寸错」——只有 L6 能发现（PITFALLS 170 / D94）。
9. 🚨 组件变量声明块要覆盖**全部根形态**（含 portal/Teleport 出来的浮层根）：本仓无 antd 的
   `-css-var` 类机制，漏挂 ⇒ 浮层里 `var(--{p}-*)` 静默回退继承值（PITFALLS 171 / D95 / D69）。
10. 产物 CSS 里的 `NaN`/`undefined`/未展开占位由构建门禁 **B11** 兜（PITFALLS 170 的产物侧）。
11. 🚨 **`setup()` 里不能创建带 `ref` 的 vnode**（owner 是 `currentRenderingInstance`）——
    要子组件实例就让它 `onReady` 回调；要外部传命令面就把 **`Ref` 当普通 prop 传**。
    踩中时只有一条 `Missing ref owner context` 的 warn，ref 静默永不赋值（PITFALLS 178）。
12. 🚨 **浮层的「关闭」是异步的**（离场动效结束才卸载）⇒ 断言卸载必须**轮询**，
    不能数 tick（PITFALLS 179）。
13. 🚨 **`as unknown as PropType<unknown>` 会让该 prop 推断成 `undefined`**，
    模板里所有传值报 "not assignable to type 'undefined'"。用**具体命名类型**
    （`PropType<XProps['x']>`），运行时类型列表里别写 `null`（PITFALLS 185）。
    同族：`ref<深联合类型>` 会触发深解包报 `TS2589` ⇒ 换 `shallowRef`。
14. ⚠️ **动效名的前缀是 `rootPrefixCls`**（`apollo-zoom` / `apollo-fade`），不是组件前缀；
    写错时动效**静默失效**（PITFALLS 180）。
15. ⚠️ **`Skeleton` 设了 `inheritAttrs: false`** ⇒ 传 `className` prop，`class` 被静默丢弃（PITFALLS 181）。
16. 🚨 **React 的「值」是快照，Vue 的响应式值是活引用**：上游「写状态 → 立刻比较状态」的
    写法搬到 Vue 会**恒为假**（`computed` 写完就返回新值）⇒ 状态更新永不上报。
    对策：**先取快照再写**（PITFALLS 207，picker 实测）。
17. 🚨 **`watch(…, { immediate: true })` 在 `setup()` 就同步跑一次**（不受 `flush` 影响），
    那时 `ref` 还是 `null`、**DOM 渲染后不会再补跑**。要「DOM 就绪后那一次」必须另找触发点（PITFALLS 211）。
18. 🚨 **jsdom 冷缓存会让 vitest 的 worker 启动超时**（60s 硬上限，与代码无关）：
    `node -e "require('jsdom')"` 冷缓存实测 25s、热 ~8s。先怀疑环境再怀疑代码（PITFALLS 199）。
19. ⚠️ **`defineComponent` 的 props 里 `required: true` 要写 `as const`**，否则被推成
    `boolean`、`ExtractPropTypes` 判不出必填 ⇒ 该 prop 变成 `X | undefined`（PITFALLS 200）。

## 主分支 / 合并 / 并行（硬教训浓缩，原文见 PITFALLS）

- master 检出在 `/Users/nanren/Code/apollo-design-ui`；合并前看那边工作区，有 WIP 先 `git stash push -u`。
- `registry/*.json` 冲突**按冲突块解析**（手写 status 会丢），别 `checkout --ours`；之后重跑生成器。
- 合并后必查：`index.ts` export 排序（biome Safe fix）、生成器重跑、`dist/` 各 worktree 自建。
- **收口后立刻合 master**；ff 后必须 `git rev-parse` 确认真的动了。
- 「绿在本地」≠「绿在仓库」：依赖磁盘产物的门禁结论先 `git ls-files` 确认产物已入库。
- 派 subagent：门禁必须前台跑；429 后它可能已跑很久甚至已提交——接手先 `git status`+`git log`，
  **往组件目录写文件前先确认没有别人的东西**（Write 默认 overwrite）。
- 复核纪律：agent 的汇报逐条自己重跑才算数；新坑一律登记 PITFALLS.md（按流分段预留号段防撞车）。

## 当前进度（2026-09-30）

- foundation **13/13 全部 completed**（2026-09-30 收口最后一个 pkg：`picker`）。
  ⚠️ `picker` 自 2026-09-30 起**含面板 Vue 组件**（裁决 `picker-panel-ownership` = B，
  见 MEMORY 的「架构要点」）—— 但它仍**不产 CSS**（R4 的约束没变）。
- ⚠️ foundation 变化后 `registry/workstreams.json` 会过期 ⇒ 必须重跑
  `node registry/tools/gen-workstreams.mjs`，否则 `--check` 报「已过期」。
- 组件 **42/72** completed（最新：**modal** —— rc-dialog 的 Vue 自建 + confirm 命令式路径）。
  ⚠️ 命令式组件已成三件套：`message` / `notification`（共用 `notification/engine/` 内核）+
  **`modal`**（自己的 `modal/engine/` = rc-dialog 内核，`confirm.ts` 用游离 `div` + `createApp`）。
- `App.useApp()` 的 `modal` **仍是 `stubModal`**（`app/App.ts`）—— modal 侧已提供 `useModal`，
  回填是 `app` 组件自己的事（modal README §5 P1）。
- ⚠️ 改 foundation 包（utils / portal / motion）后**必须单独重建**，否则 ui 的 dist 带不上（PITFALLS 176）。
- 未决：B6 按需样式子路径（`exports` 缺 `./css/*`，全库基建议题）；`--project types` 的
  SFC 解析噪音（PITFALLS 73，tag/checkbox/radio/switch 同报 unhandled，非本包引入）；
  Empty SVG 不跟 darkAlgorithm 需补；开放决策 7 项（`ask decisions --open`）。
- **全仓 `update:*` 缺口**（PITFALLS 162）：C11 要求 v-model 与语义事件同时发出，
  但截至 carousel 只有 radio / switch 实现了 ⇒ 其余组件上 `v-model:xxx` 不生效，待统一补齐。
  （image 也是「发 `update:open`/`update:current` 但未写进 `emits`」的状态，README §5 P4。）
- 共享文件 7 个（ui 的 index.ts / style/index.ts、tests/visual/matrix.mjs、cases/shared.mjs、
  **tests/compat/baseline/*.mjs**、**registry/source/open-decisions.mjs**、root package.json）按字母序追加；⚠️ ui 根 index.ts 的 re-export
  必须用别名（`genTokenDecls as genXTokenDecls` / `prepareComponentToken as prepareXComponentToken`，
  PITFALLS 158/168，已两次踩坑）。新组件另需：`tests/compat/baseline/<name>.mjs` +
  `tests/visual/render/cases/{react,vue}/<name>.{jsx,js}` + matrix 里一行。
- `_internal/` 现有三个「三次法则」收敛物：`use-merged-mask.ts`（drawer+modal）、
  `to-css-size.ts`（image+drawer+modal，两个旧文件保留为再导出）、
  **`color-composite.ts`（tour + input-number + slider，2026-09-29；`onBackground`
  返回 `Color` 实例而不是字符串 —— 因为 tour 要 `toRgbString()`、其余要 `toHexString()`，
  替调用方决定格式会让某一侧的 L7 断言变红）**。
- ⚠️ `dom-contract` 的 cssinjs 类名过滤器 2026-09-26 补了 `^css-var-[\w-]+$`
  （`css-var-_R_x_` 是 React `useId` 产物，见 PITFALLS 183）。
- **视觉层只链接 theme + ui 两个 workspace 包**（root devDeps）⇒ **用例文件**（在
  `tests/visual/render/cases/`）里 import `@apollo-design/icons` 解析不到；**组件内部**
  import 没问题（从 `packages/ui/node_modules` 解析，pnpm 每包依赖）。需要图标时用
  「两侧同一份内联结构」替身。
- ⚠️ demo 的 `.md` 有**两派格式**并存：frontmatter（`order`/`title`，carousel/input-number）
  与 `## zh-CN`/`## en-US`（dropdown/app/menu/image）。新组件跟随后者。
- ⚠️ 「L7」两个口径：`TESTING.md` §10 = Build Test；组件测试文件头把 theme 层也叫 L7。
  报数一律用 **vitest project 名**（unit / dom-contract / types / a11y / theme）。
