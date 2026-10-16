# MEMORY.md — 项目长期约定
> 规则本体：`AGENTS.md` 等 5 份文档；坑全文与索引：`PITFALLS.md`（先看 §0 索引）；环境：`environment.md`。
> 📁 `.workbuddy` = `.workbuddy-ai` 软链接，勿分版本记。本文件只放**仓库文档没有的**判别式，
> 且只放**一行一条的判据**（详细「为什么」在 PITFALLS.md）—— 写太长会在注入时被截断，等于没写。

## §0 接手顺序
1. **`docs/KNOWN-ISSUES.md`**（不在 AGENTS §5 清单）§1 仍开放：§1.2 VNodeChild 插槽 · §1.3 date-picker id/tabIndex · §1.4 Select 条件 default slot · §1.5 form setup 期前缀（同 #15.3 族）。
2. `node registry/tools/next-task.mjs`（唯一权威）；`ask.mjs decisions --open`。
⚠️ 登记簿坐标复核后再信 ⇒ `git log -S` 与跑现成测试比读文档可靠。

## §1 事实来源 / registry
Vue3+TS 重写 antd 6.6.4（兼容规格）。优先级：用户指令 > 仓库规范 > `registry/*.json` > antd 源码 > 文档 > 先验。
- 🚨🚨 **元判据（用户 2026-10-15 明示，推翻此前多轮判断）：「对齐 Ant Design ≠ 复制 Ant Design 的缺陷」。** 不许把「antd 也是这样实现的」当成**拒绝修复**的充分理由。据此 #51/#53/#55/#56 由「上游同款/实现形态差异」**改判为真缺陷并修复**（此前判为不可修的三条全部翻案）。
  - 判定顺序：**先核上游逐字源码** ⇒ 再问「这个行为自身站得住吗」 ⇒ 站不住（ARIA 非法、异步后不重算、动态 prop 不响应、children 无处注入）就修，修成**优于上游**并在 README §2 + `COMPATIBILITY.md` §9 登记为 INTENDED（D131 起）。
  - 「本仓实现形态 ≠ 上游」本身**不是**不修的理由 —— 恰恰相反：走了不同的路却丢了上游行为（如用 children 注入代替 `createPortal`）是典型的**「复制形态、丢了行为」**，必须补回来。
  - 仍然不修的只有一类：改动会与 **L4/L6 基线**或上游**正确**行为分叉的性能/时序取舍。
- 🚨 Phase 2 起 antd 降为「参考实现」；根别名一律原生 `class`/`style`，非根用 `classNames.*`/`styles.*`。判别式：「这个 prop 指向组件自己的根吗？」。
- 禁止凭记忆描述 antd/rc：读 `/tmp/antd-src/package/`；缺了现拉（`npm pack antd@6.6.4`，走 `http_proxy=127.0.0.1:7890`）。gDSFP 分支判据一律核上游原文。
- 生成器顺序 `gen-registry → foundation-status → gen-workstreams → validate-registry`；派生字段手改会被覆盖 ⇒ 注记写 `registry/source/components.meta.mjs`；裁决改 `open-decisions.mjs`+`foundation.json` 后跑 `sync-decision-runtime.mjs <id>`。

## §2 架构 / 构建
- 🚨 **门禁必须跑真正会被发布的命令、处在真实执行环境**（同一教训**三次**应验）：① B1 曾跑裸 `unbuild` 不带参数（出单文件却全绿）② `ui-tree-shaking` D 项 ③ 2026-10-15 B1 的 PATH 少了「**包自身** `node_modules/.bin`」⇒ pnpm workspace 下 `vitepress` 解析不到、exit 127。凡「门禁自己拼命令/拼环境」处都要问「它真等价吗」。
- 包边界：≥2 **个包**消费且无视觉语义才独立成包；只被多个**组件**共用 ⇒ `_internal/`。🚨 搬逻辑时**依赖的类型必须一起搬**，原 `interface.ts` 原样再导出。
- ⚠️ `picker` = 引擎+面板（L2/L4/L5 硬门禁、不产 CSS）。🚨 R7：发布包零 `@ant-design/*` 运行时依赖。14 包 `preserveModules`；B6 预算 `tests/build/budget.json`。⚠️ ESM-only ⇒ 探测用 `import.meta.resolve` 且探针在仓库内。

## §3 收口
- 三件套：`COMPONENT_STYLES` 注册 · `index.ts` 导出(B8) · `tests/compat/fixtures/<c>/`(E9)。🚨 收口后 `git status` 确认落盘（曾两次全绿但整片未提交）。新增 demo 配 `.md`。
- 🚨 新增视觉用例后必须 `Read` 看基线图（L6 对「内容缺失」全盲）。L4 `it.each` 用同形对象数组。`.vue` 出现 `typeof X` ⇒ 查 biome 把 import 改成 `import type`（PITFALLS 299）。语义槽支持函数形态 ⇒ prop 类型 `[Object, Function]`。
- ⚠️ 修完「缺口登记」同步更正 README §7 缺口表 / 组件头注 / 测试头注三处过期描述。

## §4 环境 / 命令
- 🚨 视觉层与构建门禁都带 `CODEBUDDY_SAFE_DELETE_ENABLED=0`（+`CODEBUDDY_BROKERED_FS_HOOK_ENABLED=0`/`CODEBUDDY_SAFE_DELETE_SANDBOX=0`）。`pnpm` 不在 PATH ⇒ `/tmp/pnpm-shim/pnpm`；📌 **`build:ui` 内部 `pnpm --filter` 找不到 pnpm ⇒ 必须 `PATH="/tmp/pnpm-shim:$PATH" pnpm run build:ui`**。
- ⚠️ `test:visual`/`test:types` **不在** `verify:full` ⇒ 显式跑；`test:types` 报 unhandled error 时「Tests 全绿但 exit=1」⇒ **每轮收口必跑 `vitest run --project types`**（~2min）。
- ⚠️ L6 解析 `packages/ui/dist` ⇒ 改组件源码也要先 build:ui。GitHub 推送走代理 `git -c http.proxy=http://127.0.0.1:7890 push origin HEAD:master`（直连会挂起）。
- ⚠️ zsh 下「前置 env 赋值 + `for` 复合命令」会 parse error ⇒ 用 `env A=.. bash -c 'for ...'`。
- 🚨 **`registry/*.json` 是生成物**：改了 `packages/*/src` 后 `verify:full` 首关 `registry:check` 就红（`foundation.json 已过期`）⇒ 重跑 `node registry/tools/foundation-status.mjs`。**verify:full 长期不跑 ⇒ 派生漂移会沉积**。

## §5 进度
foundation 13/13；组件 72/72 completed；L6 基线全覆盖（71 目录/1128 PNG）。Issue 台账 `/tmp/issues/ledger.md`，已交付 **#1–#21 全部 + #22 的 5/8 + #23–#56 全部**。每轮：最小复现 → 修 → 回归 → verify:component + 全量 unit/dom + types + biome + L6 + L4 compat → 提交。
- 📌 **推送授权 2026-10-15 恢复**：此前「不推送了」是**阶段性**指令；本轮用户明确要求「统一推送到 GitHub 并关闭已完成 Issue」⇒ 已推（`gh` 不在 PATH，用 **`/usr/local/bin/gh`**，已登录 apollocmh）。推送命令：`git -c http.proxy=http://127.0.0.1:7890 push origin HEAD:master`。
- ✅ **#51–#56 已全部翻案修复 + 推送 + 关闭**（2026-10-15）：#51/`8de72b49` #52/`e77e9c6b` #53/`05820f04` #54/`7c09c142` #55/`e50c5f6f` #56/`9f1475d1`。翻案理由四类：违反外部规范(#51) / 功能正确性缺失(#53) / 动态 prop 不响应(#55) / **复制形态丢了行为**(#56)；#52 = 半更新态比不更新更糟，#54 = 有界 ≠ 无代价。
- ✅ **Issue 已统一清账**（2026-10-15 夜）：#18–#56 **全部关闭**，仓库仅剩 **#22 开放**（menu，`partial 5/8`）。清账方式：台账行 → `git cat-file -e <commit>` 逐个核验提交存在 → 批量 `gh issue close`，评论附 commit + 台账验收记录 + 门禁结论。
- ⚠️ **#22 不能关**：#22.1 SubMenu popup 恒 `visibility:hidden`、#22.6 menu 无语义通道、#22.8 measure 路径缺对称 deregister（见 `docs/KNOWN-ISSUES.md` §1.6/§1.7）。⚠️ #22.1 尤其不能只翻可见性 —— **现有 L6 基线与 DOM 契约都编码了「popup 不可见」**（React 静态渲染 Trigger 浮层本就不产出）⇒ 改了 menu 的 L6/L4 会红，必须「只在测量阶段隐藏」+ 重拍基线 + 复核 Tabs/Dropdown。
✅ `test:build` 两处既有红灯已于 2026-10-15 清零（`d152fd32`）⇒ **151 项 / FAIL 0 / PENDING 0**：① B6 app 预算按公式 `ceil(measured*1.5+5)` 重定 9→194KB（App 契约必须提供 message/modal/notification context，modal 又传导 skeleton/button，上游 antd 同源）② B1 docs `vitepress` 找不到 ⇒ 门禁真缺陷，见 §2。

## §6 判别式索引（**完整判据见 PITFALLS.md 末尾「判别式总表」**）
⚠️ MEMORY.md 每轮自动注入，**过大会被截断**（实测 ~18KB 字节即截断；中文 3 字节/字 ⇒ 约 1 万字符到顶），
所以本文件只放**索引**。改判据时**两处都要改**。命中下列关键字 ⇒ 去 PITFALLS 查对应条目：

- **A 静态审计型 issue**（#36/#49–#56）：四步：测量 → 核上游**逐字**源码 → **真缺陷才修** → 钉回归。三类产出：真缺陷 / 上游同款（**现在也要再看一遍是否站得住**）/ Vue 超集。📌「运行时改配置不生效」在 antd 上大多也不生效，别顺着 issue 措辞改 —— 但**站不住就要修**（见 §1 元判据）。🚨 另两条翻案理由：**「有界 ≠ 无代价」**（性能类要再问代价/频率/触发源是否相关）、**「半更新态比完全不更新更糟」**（先量两条通道各动了几条）。
- **B 响应性**（最高频）：setup 期快照三件套 · provide 必须是 ref/computed/getter · React `useContext` 每次 render 重读 ⇒ provide 与消费者**两侧配套改** · `useImperativeHandle` 无依赖数组 ⇒ expose 挂 getter · hook 工厂 setup 期解构配置 ⇒ 传 getter · 模块级单例留 `app` 引用 · `useEffect(无deps)` ⇒ `watchEffect(post)` · attrs 回调不能解构 · 异步回调加 requestId 守卫 · `useSize` 函数形态 · `useMergeSemantic` 第三参传 computed。
- **C VNode/clone/透传**：根 VNode 末尾 `...attrs` 顶掉内部 class/on\* ⇒ `mergeProps(内部, attrs)` · cloneVNode 是合并非替换 · `vnode.ref` 是归一化对象（原值在 `props.ref`）· 🚨 **往 children 塞内容是死路 ⇒ 统一走 `<Teleport :to="宿主DOM">`**（children 原样回填；根恒 Fragment；`to` 传元素对象；非 HTMLElement 回落 null）· React children ≠ Vue 插槽 · `provide` 无法 setup 后增删 · React 默认不透传 attrs。
- **D 薄壳/语义槽/合并顺序**：`inheritAttrs:false` 要显式下传 · `classNames.*` 必须合并用户的 · slot 回退禁用 `??`（`undefined`/`null` 语义不同）· 归一化标记字段不能丢 · 布尔 prop `default:true` 破坏继承。
- **E 事件/渲染**：受控 onChange + 业务 handler = 双调 ⇒ 只留一个出口 · computed 调 slots 不 track「有无」· SFC 模板不能放 HTML 注释。
- **F 测试探针（jsdom）**：不给 disabled 派发 click ⇒ 用 `<a disabled>` · 🚨 **Teleport 被全局 stub**（`vitest.setup.ts`）⇒ 断言「内容落进目标 DOM」会**假绿**，必须 `global:{stubs:{teleport:false}}` · 🚨 **多根组件 `w.element` = 父容器**（不是第一个根）⇒ 容器内再查一次 · 🚨 **性能/契约回归先确认被测路径真被走到**（#54 [A3] 白测教训：未固钉时 `affixStyle` 保持 `undefined`、引用不变 ⇒ watch 不触发 ⇒ 修复前后都绿）⇒ 先造状态翻转再连续触发 · 造固钉翻转要 mock `getBoundingClientRect` 且**给非零 width/height**（否则「零矩形」短路）；target=window ⇒ `placeholderTop < offsetTop` 才固钉 · 计数用 `spyOn(...).mockImplementation` 且别漏了 `window` · `console.log(html)` 后 grep 造假象 · 动效不结束（expand/collapse、`MotionList`）· 容器尺寸恒为 0 · `TreeCheckedKeys` 只指对象形态 · 递归类型 TS2589 ⇒ 🚨 **追踪响应式数组用「字符串签名探针」而非 `deep:true`**，且赋值要**浅拷贝**（不拷贝 = 赋同一引用 = 不触发）。
- **G 样式合并**：`attrs.style` 可能是字符串 ⇒ 过 `mergeStyles` · `style:[a,b]` 后展开者胜 ⇒ px 化后再覆盖回 · 别信注释、跑代码。
- **H 文档站（2026-10-16 重建，VitePress 已拆）**：vite-ssg 必须显式传 `base: import.meta.env.BASE_URL`（缺省 `/` ⇒ 子路径部署全站水合后 404）· 组件样式必须显式 `import '@apollo-design/ui/style.css'`（无 cssinjs ⇒ 漏了 demo 变裸 HTML）；vite alias 是**前缀**匹配 ⇒ `…/style.css` 要排在 `@apollo-design/ui` 前 · dirStyle 用 **flat**（nested 的 `x/index.html` vite preview 不认，只有尾斜杠命中）· `build.cssMinify:'esbuild'`（lightningcss 拒收 collapse 的非法 `transition: A !important, B !important`，组件侧缺陷 D1）· frontmatter 数字标量必须转字符串（`title: 403` ⇒ 搜索白屏）· demo 动态 import 在 jsdom 首次 ~8s ⇒ 测试用轮询别数 tick · teleport 内容查 `document.body`。
- **I overlay/Trigger 契约（2026-10-16，#ea0cbf6c）**：🚨 `useOverlay().popupRef` 必须接浮层元素（trigger.ts `setPopupEle` 是**唯一**写入口）—— 漏接 ⇒ hover 保活（§3.6）与「点浮层内不算外部点击」（§3.10）双双静默失效，表现为"hover 浮层鼠标一移过去就消失"· 🚨 测浮层 hover 移入**用直接派发 mouseenter（fake timers）或单步 move**：Playwright `steps`/手动分步每次插值都是一次 CDP 往返（~5-35ms），20 步就能耗光 0.1s 的 leave 窗口 ⇒ 假阴性 · 页面多浮层实例时选目标：筛「无 -hidden + 有 placement 类 + 离 trigger 最近」，tooltip 再用 `aria-describedby` 精确关联。
- **J Dropdown 开合（2026-10-16，#fee81a58）**：🚨 antd `dropdown.js:149-157` 的 menu 点击是**两步**：① `onOpenChange(false,{source:'menu'})`（受控消费者可按 source 忽略，如 Table 过滤多选）② `setOpen(false)`（同步内部状态）。**只做①不做② = 非受控下点菜单项不关闭**。本仓 `useControlledValue` 把「写值」与「通知」绑死（setValue ⇒ onChange），照抄②会补发一发 `source:'trigger'` ⇒ Table 误关（#21 回归）⇒ 必须用 `suppressNotify` 抑制第二次通知（上游 rc 的 `useControlledState` 只写值不通知，故无此问题）。判据：**凡「通知带 source + 写状态」双通道组件，都要检查本仓 hook 是否把通知绑在写值上**。
- 🚨 **§4 补充：不要用 `git stash push -- <path>` + `pop` 做 baseline 验证**（2026-10-16 实测）：本仓 stash 栈里有 2026-09-21 的旧 master stash，pop 后 **index 被污染**（6488 文件 staged delete、工作树文件全变 `??`）；工作树内容不丢。改用「Edit 改回 → 跑 → Edit 改回」或 `git show HEAD:<path> > /tmp/x`。急救修复：`git reset -q HEAD`（mixed，**不动工作树**），之后 `git status` 应回到只剩自己的改动。
- **J2 BaseSelect 接线（2026-10-16）：`optionListRenderer` 形态的消费者（Cascader / TreeSelect）给 BaseSelect 的 `open` 必须传本层 `mergedOpen`，不能传原始 `props.open`** —— 传 `undefined` 时 BaseSelect 的 `useOpen({getOpen:()=>props.open})` 走**它自己的**非受控状态，与本层 mergedOpen 成两套 ⇒ 面板/树里 `toggleOpen(false)` 只改本层 ⇒ **非受控下选完不关闭**（antd 会关）。Select 用内建 OptionList（关闭在 BaseSelect 内部发生），不受影响。判据：凡「自定义列表 + toggleOpen」形态，检查 open 是否双向闭合。
