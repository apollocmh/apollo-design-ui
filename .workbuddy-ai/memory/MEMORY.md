# MEMORY.md — 项目长期约定
> 规则本体：`AGENTS.md` 等 5 份文档；坑全文与索引：`PITFALLS.md`（先看 §0 索引）；环境：`environment.md`。
> 📁 `.workbuddy` = `.workbuddy-ai` 软链接。本文件只放**仓库文档没有的判别式，一行一条**；
> 「为什么」写在 PITFALLS.md —— 本文件过大会在注入时截断（实测 >18KB 即截），改判据时两处都要改。

## §0 接手顺序
1. **`docs/KNOWN-ISSUES.md`**（不在 AGENTS §5 清单）§1 仍开放：§1.2 VNodeChild 插槽 · §1.3 date-picker id/tabIndex · §1.4 Select 条件 default slot · §1.5 form setup 期前缀。
2. `node registry/tools/next-task.mjs`（唯一权威）；`ask.mjs decisions --open`。
3. **Claude Code 会话结束前写记忆**：追加 `.workbuddy-ai/memory/YYYY-MM-DD.md` 并更新 §5；协议见根 `CLAUDE.md`「Memory / 交接协议」。
⚠️ 登记簿坐标复核后再信 ⇒ `git log -S` 与跑现成测试比读文档可靠。

## §1 事实来源 / registry
Vue3+TS 重写 antd 6.6.4（兼容规格）。优先级：用户指令 > 仓库规范 > `registry/*.json` > antd 源码 > 文档 > 先验。
- 🚨🚨 **元判据（用户 2026-10-15 明示）：「对齐 antd ≠ 复制 antd 的缺陷」。**「antd 也是这样实现的」**不是**拒绝修复的理由。据此 #51/#53/#55/#56 由「上游同款」**改判真缺陷并修复**。
  - 顺序：**先核上游逐字源码** ⇒ 再问「行为自身站得住吗」 ⇒ 站不住就修，修成**优于上游**，在 README §2 + `COMPATIBILITY.md` §9 登记 INTENDED（D131 起）。
  - 「实现形态 ≠ 上游」**不是**不修的理由 —— 走了别的路却丢了上游行为（**复制形态、丢了行为**）必须补回。
  - 仍不修的只有一类：改动会与 **L4/L6 基线**或上游**正确**行为分叉。
- 🚨 Phase 2 起 antd 降为「参考实现」；根别名用原生 `class`/`style`，非根用 `classNames.*`/`styles.*`。判别式：「这个 prop 指向组件自己的根吗？」。
- 禁止凭记忆描述 antd/rc：读 `/tmp/antd-src/package/`，缺了现拉（`npm pack antd@6.6.4` / `unpkg.com`，走 `http_proxy=127.0.0.1:7890`）。
- 生成器顺序 `gen-registry → foundation-status → gen-workstreams → validate-registry`；派生字段手改会被覆盖 ⇒ 注记写 `registry/source/components.meta.mjs`。

## §2 架构 / 构建
- 🚨 **门禁必须跑真正会被发布的命令、处在真实执行环境**（同一教训三次应验）：裸 `unbuild` 不带参数 / `ui-tree-shaking` D 项 / B1 的 PATH 少了**包自身** `node_modules/.bin`（`vitepress` exit 127）。
- 包边界：≥2 **个包**消费且无视觉语义才独立成包；只被多个**组件**共用 ⇒ `_internal/`。🚨 搬逻辑时**依赖的类型必须一起搬**。
- ⚠️ `picker` = 引擎+面板（不产 CSS）。🚨 R7：发布包零 `@ant-design/*` 运行时依赖。14 包 `preserveModules`；B6 预算 `tests/build/budget.json`。ESM-only ⇒ 探针放仓库内、用 `import.meta.resolve`。

## §3 收口
- 三件套：`COMPONENT_STYLES` 注册 · `index.ts` 导出(B8) · `tests/compat/fixtures/<c>/`(E9)。🚨 收口后 `git status` 确认落盘（曾两次全绿但整片未提交）。新增 demo 配 `.md`（含 `order`）。
- 🚨 新增视觉用例后必须 `Read` 看基线图（L6 对「内容缺失」全盲）。L4 `it.each` 用同形对象数组。`.vue` 出现 `typeof X` ⇒ biome 把 import 改成 `import type`。语义槽支持函数形态 ⇒ prop 类型 `[Object, Function]`。
- ⚠️ 修完缺口同步更正 README §7 缺口表 / 组件头注 / 测试头注三处过期描述。

## §4 环境 / 命令
- 🚨 视觉与构建门禁带 `CODEBUDDY_SAFE_DELETE_ENABLED=0` + `CODEBUDDY_BROKERED_FS_HOOK_ENABLED=0` + `CODEBUDDY_SAFE_DELETE_SANDBOX=0`（后两个也让 vitest 提速 5-8×）。`pnpm` 不在 PATH ⇒ 📌 **`PATH="/tmp/pnpm-shim:$PATH" pnpm run build:ui"`**（`build:ui` 内部 `pnpm --filter` 找不到 pnpm）。
- ⚠️ `test:visual`/`test:types` **不在** `verify:full` ⇒ 显式跑；types 报 unhandled error 时「Tests 全绿但 exit=1」⇒ **每轮收口必跑 `vitest run --project types`**（~2min）。
- ⚠️ L6 解析 `packages/ui/dist` ⇒ 改组件源码先 build:ui。推送走代理：`git -c http.proxy=http://127.0.0.1:7890 push origin HEAD:<branch>`（直连挂起）；`gh` 用 **`/usr/local/bin/gh`**（已登录 apollocmh）。
- 🚨 **`registry/*.json` 是生成物**：改了 `packages/*/src` 后 `registry:check` 就红 ⇒ 重跑 `node registry/tools/foundation-status.mjs`。
- ⚠️ zsh 下「前置 env 赋值 + `for` 复合命令」parse error ⇒ 用 `env A=.. bash -c 'for ...'`。
- 📌 **手动发 Pages**（用户 2026-10-20 要求）：`gh-pages` 分支根就是 `packages/docs/dist`；workflow `deploy-docs.yml` 只在 master 触发。做法：`git worktree add -b gh-pages /tmp/ghp origin/gh-pages` → 清内容 → 拷 dist（保留 `.nojekyll`）→ commit → `git -c http.proxy=… push origin HEAD:gh-pages`。站点 https://apollocmh.github.io/apollo-design-ui/ 。

## §5 进度
- 2026-10-22 文档站 V3（分支 `feature/docs-site-visual-v3`，P4 `e1f872c1`）：Token 自举、2560 内容 2008、Demo Canvas 优先 + 稳定 Grid、自举 8→3 原生按钮；verify 20/20、docs 150、smoke 36、visual 9/9；各阶段截图在 `docs/audit/visual-v3/screenshots-p*`。
foundation 13/13；组件 72/72 completed；L6 基线全覆盖（71 目录/1128 PNG）。Issue 台账 `/tmp/issues/ledger.md`，**#1–#56 全部关闭（#22 于 2026-10-21 收口），仓库当前 0 个开放 issue**。
- ✅ `test:build` 151 项 / FAIL 0（`d152fd32`）。
- 📌 推送授权 2026-10-15 恢复：用户要求统一推送并关闭已完成 Issue。
- 2026-10-21 Claude Code 接手：分析 + 建根 `CLAUDE.md`（含 Memory 交接协议）；业务代码零改动，结论/文档漂移见 `2026-10-21.md`。
- 2026-10-21 阶段 0–4 整改（`fix/docs-motion-demo-quality`）：Trigger/Notification/Tree/Modal 动效修复；Demo 758→**881**（可比对覆盖 82.7%）；文档站 viewport 模式 / BASE_URL / iframe 校验 / 语言同步 / 布局与内部文案清理；门禁 unit **7147**、types **2213**、L7 **151/FAIL 0**、docs smoke **36/36**、文档视觉 9/9 `0.000%`。报告 `docs/audit/FINAL-REPORT.md`；发布标签 `v0.1.1` → `cc8af285`；CI 39610059996 / Deploy Docs 39610060088 全绿。
- 2026-10-21 审计 A01–A13 整改（收口）：docs **142 tests** / L7 `--no-build` **151 FAIL 0** / 独立 Icon 页 **848** / **Input.Search+OTP 补齐**（L4 **40 例**、L6 `both` **15/15 exact**；新增 6 张 Windows 基线待 macOS 重生成）/ `verify:consumer` **tarball+Vite+Webpack** / Playwright 冒烟 **36/36** 进 `docs-ci.yml`；台账 `docs/audit/2026-10-21-remediation.md`。审计项 0 剩余。
- 2026-10-22 发布 **`v0.1.2`**（`c081508c`，tag `819cd0d2`）：CI 39628929380 全绿（lint/build/test/coverage/registry + L6 4 shard）、Deploy Docs 39628929319 全绿，gh-pages `a0a4ded3`。
- 2026-10-21 阶段 5（master `9691d36c`）：Demo 881→**989**（可比对覆盖 **92.9%** / 场景重合 **83.8%**）；修 Menu measure 路径/折叠 openKeys/嵌套弹层/Tooltip、Overflow `$el` 测量、BaseSelect hover 泄漏（Select/AutoComplete/TreeSelect/Cascader/Pagination）；`pnpm test` unit 7263 + dom 1743 + a11y 1357 + theme 890、types 2213、L7 151/0、docs smoke 36/36、docs visual 9/9。
- 2026-10-21 CI 收口：`ci.yml` / `deploy-docs.yml` 改为 **`v*` 标签触发**（PR 门禁保留）；Deploy Docs 改构建后推 `gh-pages`；手动 dispatch CI **run 39555460116 全绿**（registry/lint/test/coverage/build + 4 L6 shard），Docs CI **run 39554118134 全绿**（含冒烟 36/36）。
- 2026-10-21 首个标签 **`v0.1.0`**（指向 `2fa3d9f1`）：CI **39559668861 全绿**；Deploy Docs **39559668851 全绿**，已推 `gh-pages`（`9bea9c11`）并上线 https://apollocmh.github.io/apollo-design-ui/ 。
- 2026-10-21 阶段 0（`fix/docs-motion-demo-quality` @ `fceda9a9`）：六类动效真实浏览器复现（Trigger 关闭瞬移屏外 / Notification 立即卸载 / Modal zoom 原点 / Tree 再展开无 motion）；Demo 覆盖 Form 5/44、DatePicker 2/32、Upload 3/24；交付 `docs/audit/{baseline-motion-matrix,demo-coverage-matrix,stage0-static-findings}.md` + `evidence/`。**待用户确认后进入阶段 1**。
- 2026-10-17～21 文档站 V2 分支 `feature/docs-site-v2`：hover 浮层 `ea0cbf6c` · dropdown 开合 `fee81a58` · cascader/tree-select `9118f946` · 点外部 `d2460163` · `.html` 深链 `463cfcde` · 重复标题 `8cbe272f` · tree 动效收尾 `5de76911` · table 示例 `65243a1e` · 过滤弹层 token `9f0e0d06` · 组件页 TOC 顺序 `797c8399` · **menu #22 三项 `7b00b40c`**。

## §6 判别式索引（完整判据见 PITFALLS.md 末尾「判别式总表」）
- **A 静态审计型 issue**：四步：测量 → 核上游**逐字**源码 → **真缺陷才修** → 钉回归。三类产出：真缺陷 / 上游同款（再看是否站得住）/ Vue 超集。🚨 翻案理由：**「有界 ≠ 无代价」**、**「半更新态比完全不更新更糟」**。
- **B 响应性**（最高频）：setup 期快照三件套 · provide 必须是 ref/computed/getter 且**两侧配套改** · `useImperativeHandle` 无 deps ⇒ expose 挂 getter · hook 工厂传 getter · 模块级单例留 `app` 引用 · `useEffect(无deps)` ⇒ `watchEffect(post)` · attrs 回调不能解构 · 异步回调加 requestId 守卫 · `useSize` 函数形态 · `useMergeSemantic` 第三参传 computed。
- **C VNode/clone/透传**：根 VNode 末尾 `...attrs` 顶掉内部 ⇒ `mergeProps(内部, attrs)` · cloneVNode 是合并非替换 · `vnode.ref` 是归一化对象（原值在 `props.ref`）· 🚨 **往 children 塞内容是死路 ⇒ `<Teleport :to="宿主DOM">`** · React children ≠ Vue 插槽 · `provide` 无法 setup 后增删。
- **D 薄壳/语义槽**：`inheritAttrs:false` 要显式下传（**漏声明的 prop 会被静默丢弃**，见 M 组）· `classNames.*` 必须合并用户的 · slot 回退禁用 `??` · 布尔 prop `default:true` 破坏继承。
- **E 事件/渲染**：受控 onChange + 业务 handler = 双调 ⇒ 只留一个出口 · computed 调 slots 不 track「有无」· SFC 模板不能放 HTML 注释。
- **F 测试探针（jsdom）**：不给 disabled 派发 click ⇒ 用 `<a disabled>` · 🚨 **Teleport 被全局 stub** ⇒ 断言「落进目标 DOM」会假绿，须 `stubs:{teleport:false}` · 🚨 **多根组件 `w.element` = 父容器** · 🚨 **先确认被测路径真被走到**（先造状态翻转再连续触发）· 造固钉要 mock `getBoundingClientRect` 且给非零尺寸 · `TreeCheckedKeys` 只指对象形态 · 追踪响应式数组用「字符串签名探针」+ 浅拷贝赋值 · 容器尺寸恒为 0 · 动效不结束。
- **G 样式合并**：`attrs.style` 可能是字符串 ⇒ 过 `mergeStyles` · `style:[a,b]` 后展开者胜 ⇒ px 化后再覆盖回 · 别信注释、跑代码。
- **H 文档站（2026-10-16 重建，VitePress 已拆）**：vite-ssg 必须显式传 `base: import.meta.env.BASE_URL` · 组件样式必须显式 `import '@apollo-design/ui/style.css'` · vite alias 是**前缀**匹配（`…/style.css` 排在 `@apollo-design/ui` 前）· dirStyle **flat** · `cssMinify:'esbuild'`（lightningcss 拒收 collapse 的非法 `transition: A !important, B !important`）· frontmatter 数字标量转字符串 · demo 动态 import 在 jsdom 首帧 ~8s ⇒ 轮询别数 tick · teleport 内容查 `document.body`。
- **I overlay/Trigger 契约（#ea0cbf6c）**：🚨 `useOverlay().popupRef` 必须接浮层元素（`setPopupEle` 是**唯一**写入口）—— 漏接 ⇒ hover 保活与「点浮层内不算外部点击」双失效。🚨 测 hover 移入用**直接派发 mouseenter** 或单步 move（Playwright 分步每次插值一次 CDP 往返 ~5-35ms，20 步耗光 0.1s 窗口 ⇒ 假阴性）。
- **J Dropdown 开合（#fee81a58）**：🚨 antd menu 点击两步：① `onOpenChange(false,{source:'menu'})` ② `setOpen(false)`。只做① ⇒ 非受控下不关闭；本仓 `useControlledValue` 写值即通知 ⇒ 照抄②会补发 `source:'trigger'`（Table 误关）⇒ 用 `suppressNotify`。判据：**凡「通知带 source + 写状态」双通道组件都要查**。
- **J2 BaseSelect 接线**：`optionListRenderer` 形态（Cascader/TreeSelect）给 BaseSelect 的 `open` 必须传本层 `mergedOpen`，不能传 `props.open`（否则两套状态 ⇒ 选完不关闭）。
- **K Trigger 目标元素契约**：🚨 `overlay.targetRef` 必须是 DOM 元素，`setTargetEle()` 是唯一写入口（**不能**写 `ref: overlay.targetRef`）—— 组件 vnode 的 ref 给的是**实例** ⇒ `inPopupOrChild()` 抛 TypeError ⇒ 点外部不关。🚨 测「点外部关闭」会假绿（targetRef 恒 null 时一切都算外部）⇒ 必须**同时**钉反向哨兵。jsdom 无 transition ⇒ 关闭断言接受 `-hidden` **或** `-leave`。
- **L docs 站 `.html` 深链接（#463cfcde）**：🚨 flat SSG 产出 `.html` 物理路径，客户端路由只认无后缀 ⇒ 直开先闪预渲染、水合后变 404 ⇒ `router.beforeEach(stripHtmlGuard)`。⚠️ **「静态内容能打开」≠「路由能匹配」**，探针须在水合后再验一次。另：`site.css` 的 `prefers-reduced-motion` 全局禁动画会连组件浮层动画一起杀掉（用户说「动画像没有」先查系统设置）。
- 🚨 **不要用 `git stash push -- <path>` + `pop` 做 baseline 验证**：本仓 stash 栈里有旧 master stash，pop 后 **index 被污染**（6488 文件 staged delete）。改用「Edit 改回 → 跑 → 改回」或 `git show HEAD:<path> > /tmp/x`；急救 `git reset -q HEAD`（不动工作树）。
- **M 动效收尾契约（2026-10-17～20，#5de76911）**：🚨 三件事必须同时成立，缺一个就表现为「**点一次收起之后整棵树再也点不动**」：
  ① `CSSMotion` 是 `inheritAttrs:false` ⇒ 回调**必须显式声明成 prop**（`onVisibleChanged` 曾漏声明 ⇒ 被静默丢弃 ⇒ `listChanging` 永久为真 ⇒ 后续点击全被 `if (listChanging) return` 吞掉）；
  ② rc 的 `useLayoutEffect` **挂载时也跑** ⇒ Vue 侧必须 `onMounted` 跑一次同步（**不能**用 `watch(immediate)`：setup 期置 false ⇒ 首帧不渲染 ⇒ 没有离场过渡）；哨兵节点是与 `motionNodes` 一起新建的 ⇒ `watch` 永不触发；
  ③ motion 配置要**整个摊进** CSSMotion（`_extends({ref,visible}, motion, {...})`）—— 只带 `motionName` ⇒ antd `initCollapseMotion()` 的 `onLeaveStart/Active` 缺失 ⇒ 高度不变 ⇒ `transition: height` 无过渡 ⇒ `transitionend` 永不到（连 `motionDeadline` 兜底都没有）。
  ⚠️ 判据：jsdom 无真实 CSS transition ⇒「永不结束」与「还没结束」长得一样 ⇒ **既有测试必然全绿**。回归必须手动派发带 `propertyName:'height'` 的 `transitionend`，并钉「收起后还能再展开」。
- **N 写 demo 的类型三坑（2026-10-20）**：① `interface` **没有隐式索引签名**（只有类型别名/推断的对象字面量有）⇒ 传给 `data-source` 要显式 `[key: string]: unknown`；② table 内部类型在根出口**统一加 `Table` 前缀**（根名 `TableFilterDropdownProps`，不是 `FilterDropdownProps`）；③ 展开含 `SelectProps` 的大类型（`{...pagination.value}`）触发 **TS2589** ⇒ 逐字段赋值。
