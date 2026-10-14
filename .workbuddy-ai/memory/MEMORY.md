# MEMORY.md — 项目长期约定
> 规则本体：`AGENTS.md` 等 5 份文档；坑全文+索引：`PITFALLS.md`（先看 §0）；环境命令：`environment.md`。
> 📁 `.workbuddy` 是 `.workbuddy-ai` 的软链接，勿按版本分开记。本文件只放**仓库文档没有的**判别式。

## §0 接手顺序
1. **`docs/KNOWN-ISSUES.md`**（不在 AGENTS §5 清单里）。§1 仍开放：§1.2 VNodeChild 插槽缺口 · §1.3 date-picker id/tabIndex · §1.4 Select 条件 default slot · §1.5 form ItemHolder/StatusProvider setup 期前缀过期（2026-10-14，同 #15.3 族）。
2. `node registry/tools/next-task.mjs`（唯一权威）；`ask.mjs decisions --open`。
⚠️ 登记簿坐标复核后再信（曾改掉 4 处事实错误）⇒ `git log -S` 与跑现成测试比读文档可靠；欠账都要能被命令复现。

## §1 事实来源 / registry
Vue3+TS 重写 antd 6.6.4（兼容规格）。优先级：用户指令 > 仓库规范 > `registry/*.json` > antd 源码 > 文档 > 先验。
- 🚨 **Phase 2 起**（2026-10-06 裁决）antd 降为「参考实现」；根别名一律原生 `class`/`style`（72 组件已完成），非根目标用 `classNames.*`/`styles.*` 槽位。判别式：「这个 prop 指向组件自己的根吗？」。
- 禁止凭记忆描述 antd：读 `/tmp/antd-src/package/`；缺了现拉（`/tmp/antd-restore` + `https_proxy=http://127.0.0.1:7890 npm pack antd@6.6.4`）。
- 生成器顺序 `gen-registry → foundation-status → gen-workstreams → validate-registry`；派生字段手改会被覆盖；`notes` 不跨运行保留 ⇒ 注记写 `registry/source/components.meta.mjs`。
- 裁决须同改 `open-decisions.mjs` + `foundation.json` ⇒ `sync-decision-runtime.mjs <id>` 再跑生成器链。已裁决：`visual-baseline-in-git`=A · `noNonNullAssertion`（禁扫改）· `picker-panel-ownership`=B · `ui-style-output`=A · `ui-tree-shaking`=A+B+D。

## §2 架构 / 构建（细节查 docs）
- 包边界：≥2 **个包**消费且无视觉语义才独立成包；只被多个**组件**共用 ⇒ `_internal/`。🚨 搬逻辑时**依赖的类型必须一起搬**（否则反向依赖），原 `interface.ts` 原样再导出。
- ⚠️ `picker`=引擎+面板（L2/L4/L5 硬门禁、不产 CSS）。🚨 R7：发布包零 `@ant-design/*` 运行时依赖（E19）。14 包 `preserveModules`；B6 预算 `tests/build/budget.json`；🚨 门禁必须跑真正会被发布的命令。⚠️ ESM-only ⇒ 探测用 `import.meta.resolve` 且探针在仓库内。

## §3 收口
- 三件套：`COMPONENT_STYLES` 注册 · `index.ts` 导出(B8) · `tests/compat/fixtures/<c>/`(E9)。🚨 收口后 `git status` 确认落盘（曾两次全绿但整片未提交）。新增 demo 配 `.md`。
- 🚨 新增视觉用例后必须 `Read` 看基线图（哈希/体积/L6 对「内容缺失」全盲）。L4 `it.each` 用同形对象数组。`.vue` 出现 `typeof SomeComponent` ⇒ 查 import 被 biome 改成 `import type`（PITFALLS 299）。语义化槽支持函数形态 ⇒ prop 类型 `[Object, Function]`。
## §4 环境 / 命令
- 🚨 视觉层与构建门禁都带 `CODEBUDDY_SAFE_DELETE_ENABLED=0`（+`CODEBUDDY_BROKERED_FS_HOOK_ENABLED=0`/`CODEBUDDY_SAFE_DELETE_SANDBOX=0`）。`pnpm` 不在 PATH ⇒ `/tmp/pnpm-shim/pnpm`；📌 **`build:ui` 内部 `pnpm --filter` 找不到 pnpm ⇒ 必须 `PATH="/tmp/pnpm-shim:$PATH" pnpm run build:ui`**。
- ⚠️ `test:visual`/`test:types` **不在** `verify:full` ⇒ 显式跑；`test:types` 报 unhandled error 时「Tests 全绿但 exit=1」⇒ **每轮收口必跑 `vitest run --project types`**（~53s）。
- ⚠️ L6 解析 `packages/ui/dist` ⇒ 改组件源码也要先 build:ui。GitHub 推送走代理 `git -c http.proxy=http://127.0.0.1:7890 push origin HEAD:master`（批量传输直连会挂起）。`registry/*.json` 冲突按冲突块解析再重跑生成器。
## §5 进度
foundation 13/13；组件 72/72 completed；L6 基线全覆盖（71 目录/1128 PNG）。Issue 批量修复见 `/tmp/issues/ledger.md`，已交付 **#1–#15**（每轮：最小复现 → 修 → 回归 → verify:component + 全量 unit/dom + types + biome + L6 + L4 compat → 提交推送）。

## §6 判别式（高价值）
**响应性**
- 🚨 **attrs 追踪准确口径**（#15.2 实测修正）：Vue 3.5.42 attrs 代理 `get` 会 `track(attrs,'get','')`、`updateProps` 变化时 `trigger(attrs,'set','')` ⇒ **computed 直接读 `attrs.class` 有追踪会更新**（#15.2「缓存旧值」是误报）。真坑 = **setup 期解构 attrs**（快照），date-picker #5.3 那个才是。
- 🚨 **`cloneVNode` 是合并不是替换**：`mergeProps` 对 `on*` 拼数组 ⇒ 用户回调双调/`TypeError`。复刻 React `cloneElement` 必须 `createVNode(child.type, 自拼props, child.children)`（#8.3 与 #15.1 同栽两次；`key`/`ref` 随 props 铺过去）。
- 🚨 新 Boolean prop 必须 `withDefaults(…,{x:undefined})`（薄壳也要）：未传时 Vue 强制 `false`，`existShowConfig` 把「显式 false」当「用户关了」⇒ 整片不渲染（#6.2）。
- 公共 Hook 收 `MaybeRefOrGetter`+`toValue`；`useSize` 必须解析器形态 `useSize((ctx)=>props.size??ctx)`（`()=>props.size` 会绕过 componentSize）。
- 🚨 上游 React `useXxx(...)` 每次渲染重算 ⇒ Vue 侧包 `computed`，否则动态改配置静默无效（#12.3）。🚨 prop 默认值写字面量堵死 ConfigProvider 回退 ⇒ `default: undefined`+`mergedXxx`。
- 🚨 **`${props.prefixCls}-x` 在 setup 期求值 = 切前缀后子树全过期** ⇒ 一律 computed（#15.3 修 transfer/Section；form 同族未修见 §1.5）。⚠️ `prefixCls` prop 是**完整前缀**（`'p1'` ⇒ `.p1-section`）。
**渲染 / 事件**
- 🚨 computed 调 `slots.default?.()` 不过「插槽有无」变化 ⇒ 无 slot 那次求值不 track ⇒ 之后 slot 从无到有但缓存干净 ⇒ 选项永远不出现（#14.3，引擎级，§1.4）。⇒ 薄壳传插槽的包装函数要显式读本组件 reactive 分类态。
- 🚨 computed 里的 dev 告警随惰性求值不触发一起消失 ⇒ 放渲染期沿对比（#14）。
- 🚨 SFC 模板不能放 HTML 注释：编译成 Comment vnode，`Trigger` 取 `slots.default()[0]` ⇒ 顶掉触发元素、整组件渲染成空。
- 🚨 末尾 `...restAttrs` 覆盖内部同名事件键（展开后者胜）⇒ 内部事件键先从 `restAttrs` 摘掉。`triggers` 键已是 `onChange` 形态，再拼 `on` 得 `onOnChange`（恒 undefined）。
**测试探针**
- 🚨 **jsdom 不给 `disabled` 元素派发 click**（原生 button / Button 组件双通道都测不到监听器层）⇒ 禁用态事件用例用**非表单元素**（`<a disabled>`）探针（#15.1）。
- 🚨 `console.log(w.html())` 后接 `grep` 造假象：Vue DOM 含换行、grep 只打首行 ⇒ 「空 form」是截断假象；打印先 `.replace(/\s+/g,' ')`。
- 浮层断言查 `wrapper.element` 别查 `document`（`attachTo` 串残留实例）。
**样式合并 / 元判据**
- `attrs.style` 可能是字符串 ⇒ 合并必须过 `semanticRootStyle`/`mergeStyles`（对象展开拆成 `{0:'w'}` 崩组件）。语义 root 落点：class `[rootClass, classNames.root]`、style `[styles.root, rootStyle]`（原生 style 胜）。
- 🚨 别信注释、跑代码（switch interface 注释与代码不符、radio README D44 过期）。空态占位项也算 `menu-item`（「搜索为空」别写 `length===0`）。
