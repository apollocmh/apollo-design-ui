# MEMORY.md — 项目长期约定
> 规则本体：`AGENTS.md` 等 5 份文档；坑全文+索引：`PITFALLS.md`（先看 §0）；环境命令：`environment.md`。
> 📁 `.workbuddy` 是 `.workbuddy-ai` 的软链接，勿按版本分开记。本文件只放**仓库文档没有的**判别式。

## §0 接手顺序
1. **`docs/KNOWN-ISSUES.md`**（不在 AGENTS §5 清单里）§1 仍开放：§1.2 VNodeChild 插槽 · §1.3 date-picker id/tabIndex · §1.4 Select 条件 default slot · §1.5 form setup 期前缀（同 #15.3 族）。
2. `node registry/tools/next-task.mjs`（唯一权威）；`ask.mjs decisions --open`。
⚠️ 登记簿坐标复核后再信 ⇒ `git log -S` 与跑现成测试比读文档可靠。

## §1 事实来源 / registry
Vue3+TS 重写 antd 6.6.4（兼容规格）。优先级：用户指令 > 仓库规范 > `registry/*.json` > antd 源码 > 文档 > 先验。
- 🚨 **Phase 2 起** antd 降为「参考实现」；根别名一律原生 `class`/`style`，非根用 `classNames.*`/`styles.*`。判别式：「这个 prop 指向组件自己的根吗？」。
- 禁止凭记忆描述 antd / rc：读 `/tmp/antd-src/package/`；缺了现拉（`npm pack antd@6.6.4` / `@rc-component/tree@1.4.0`，走 `http_proxy=127.0.0.1:7890`）⇒ gDSFP 分支判据一律核上游原文。
- 生成器顺序 `gen-registry → foundation-status → gen-workstreams → validate-registry`；派生字段手改会被覆盖 ⇒ 注记写 `registry/source/components.meta.mjs`；裁决改 `open-decisions.mjs`+`foundation.json` 后跑 `sync-decision-runtime.mjs <id>`。

## §2 架构 / 构建（细节查 docs）
- 包边界：≥2 **个包**消费且无视觉语义才独立成包；只被多个**组件**共用 ⇒ `_internal/`。🚨 搬逻辑时**依赖的类型必须一起搬**，原 `interface.ts` 原样再导出。
- ⚠️ `picker`=引擎+面板（L2/L4/L5 硬门禁、不产 CSS）。🚨 R7：发布包零 `@ant-design/*` 运行时依赖。14 包 `preserveModules`；B6 预算 `tests/build/budget.json`；🚨 门禁必须跑真正会被发布的命令。⚠️ ESM-only ⇒ 探测用 `import.meta.resolve` 且探针在仓库内。

## §3 收口
- 三件套：`COMPONENT_STYLES` 注册 · `index.ts` 导出(B8) · `tests/compat/fixtures/<c>/`(E9)。🚨 收口后 `git status` 确认落盘（曾两次全绿但整片未提交）。新增 demo 配 `.md`。
- 🚨 新增视觉用例后必须 `Read` 看基线图（L6 对「内容缺失」全盲）。L4 `it.each` 用同形对象数组。`.vue` 出现 `typeof X` ⇒ 查 biome 把 import 改成 `import type`（PITFALLS 299）。语义槽支持函数形态 ⇒ prop 类型 `[Object, Function]`。
## §4 环境 / 命令
- 🚨 视觉层与构建门禁都带 `CODEBUDDY_SAFE_DELETE_ENABLED=0`（+`CODEBUDDY_BROKERED_FS_HOOK_ENABLED=0`/`CODEBUDDY_SAFE_DELETE_SANDBOX=0`）。`pnpm` 不在 PATH ⇒ `/tmp/pnpm-shim/pnpm`；📌 **`build:ui` 内部 `pnpm --filter` 找不到 pnpm ⇒ 必须 `PATH="/tmp/pnpm-shim:$PATH" pnpm run build:ui`**。
- ⚠️ `test:visual`/`test:types` **不在** `verify:full` ⇒ 显式跑；`test:types` 报 unhandled error 时「Tests 全绿但 exit=1」⇒ **每轮收口必跑 `vitest run --project types`**（~53s）。
- ⚠️ L6 解析 `packages/ui/dist` ⇒ 改组件源码也要先 build:ui。GitHub 推送走代理 `git -c http.proxy=http://127.0.0.1:7890 push origin HEAD:master`（批量传输直连会挂起）。`registry/*.json` 冲突按冲突块解析再重跑生成器。
## §5 进度
foundation 13/13；组件 72/72 completed；L6 基线全覆盖（71 目录/1128 PNG）。Issue 批量修复见 `/tmp/issues/ledger.md`，已交付 **#1–#21 全部 + #22 的 5/8 + #23–#48 全部**（#40 关闭 app PENDING-2）（每轮：最小复现 → 修 → 回归 → verify:component + 全量 unit/dom + types + biome + L6 + L4 compat → 提交推送）。
⚠️ `pnpm run test:build`（**不在每轮清单**）当前 2 红，均为**既有**、非 issue 引入：
① B6 `app 125.7KB > 预算 9KB` —— #40 把 `useMessage`/`useModal`/`useNotification` 接进
`App.mjs` 后预算未同步（仍是最初 2.2KB），属需**用户裁决**的验收标准变更；
② B1 docs `vitepress: command not found`（依赖未装，环境问题）。

## §6 判别式（高价值）
**响应性**
- 🚨 **setup 期快照三件套**（最高频）：① 纯函数式归一/解析（#18 pagination）② 上游 render 体里的
  常量（#17.1 table / #28.2 anchor affixProps）③ `toValue` hook 传裸值（`useDisabled`/`useSize`，#30.3）
  ⇒ 一律改 computed / getter。传 getter 时注意：watch 依赖要写**求值后**的结果（#27.4）。
- 🚨 **attrs 追踪准确口径**
- 🚨 **provide 的 context 里放值必须是 ref/computed 或 getter**
- 🚨 **hook 工厂（useNotification 等）在 setup 期解构配置 ⇒ 裸值被钉死**（#45）：
  要「配置后改」能传导就传 **getter** + 容器侧 `toValue`。⚠️ 放宽类型时同名键可能有多份
  （NoticeProps/NoticeListProps/NotificationsProps）⇒ 按行号精准替换，改完必跑 `--project types`。
  ✅ 同族（notification Holder #46，含 `showProgress`）已一并修掉：message 改完顺手改 notification。
- 🚨 **React `useContext(X)` 每次 render 重读 ⇒ Vue 侧 provide 必须 computed/getter，且
  消费者也要改**（#48，与 #41/#32.1 同族但**两侧配套**）：
  `ConfigProvider` 的 size/disabled 早就是 computed，`warning` 漏了 —— 看到「同层三条
  provide 只有一条是裸值」就是漏网。⚠️ **只改一侧无效**：provide 改 computed 而消费者
  仍 `context.strict` ⇒ 拿到 `ComputedRef` 当对象读（恒 undefined）。
- 🚨 **React `useImperativeHandle(ref, () => ({...}))` 无依赖数组 = 每次 render 重建**（#47）：
  命令式 API 从 ref 现读的字段（如 notification 的 `closeLabel`）在 React 侧是「活的」。
  本仓等价物 = **响应式源（`useLocaleReactive`）+ `computed` + `expose` 上挂 getter**
  （`expose({ get x() { return c.value } })`）。⚠️ 边界：`open()` 把值**烘进** notice 配置
  ⇒ 只有**新开**的 notice 跟随，「已存在的」保留旧值（antd 同判，别当缺陷改）。
- 🚨 **命令式 API 的模块级单例要留 `app` 引用**（#43）：`createApp().mount(游离容器)` 是真根应用，
  复位函数必须 `unmount()`。判据：Teleport 出去的 notice 是否还在 DOM 里。
  ✅ 同族（notification #44）已一并修掉：改一个就改另一个，不要留半边。
- 🚨 **异步资源回调（Image onload 等）必须有 requestId 守卫**（#42）：只有最新一次能提交，
  卸载时作废。⚠️ 复现这类竞态时先确认缓存：`useSingletonCache` 把 HTMLElement 归一成 `''`
  ⇒ 只换资源不换几何参数会命中缓存、根本不重绘（掩盖竞态）。
- 🚨 **provide `computed.value` = 快照**（#41）：配置对象类 context 一律 **reactive 对象 + watchEffect 打补丁**
  （引用恒定 + 内容同步，ConfigProvider `config` / App `appConfig` 同范式）。（Sider `siderCollapsed` 传裸布尔 ⇒
  子孙永远首帧值，#32.1）。🚨 **attrs 回调不能解构**（快照）⇒ 触发时现读（#32.2）。（#15.2）：computed 直接读 `attrs.class` **会**更新；真坑是 setup 期解构 attrs。
- 🚨 **cloneVNode 是合并不是替换**（`on*` 拼数组、`class` 拼两遍）⇒ ① 注入 `on*` 后**不要再手动调**
  `origin.props?.onXxx`（#30.2）；② 要「替换」语义就先 clone 再整体替换 `cloned.props`（保 dirs，#24.7）。
- 🚨 **「受控 hook 的 onChange + 业务 handler」各调一次 = 双调**（tooltip #24.1 / popconfirm #26.1 /
  float-button #27.1 / tag #30.1 四连）⇒ 回调只留一个出口。
- 🚨 **根 VNode 末尾 `...attrs` 会顶掉内部 class 与 `on*`** ⇒ 一律 `mergeProps(内部, attrs)`（#27.3）；
  `vnode.props.class` 恒为字符串 ⇒ class 合并用 `normalizeClass([...])`；转发 attrs 前先 `omit`
  掉本组件要消费的键（`onPopupClick` 因此双调，#26.1）。
- 🚨 **`inheritAttrs:false` 薄壳：类型 `extends` 承诺的字段要显式声明 + 显式下传**（#25.1/#26.1）；
  「外层有 prop、引擎/下层没声明」同理（modal wrapProps #19.1、drawer push #20.1 静默退化 180）。
- 🚨 **`useMergeSemantic` 第三参传 computed/getter**（不是 `.value`），否则函数式槽吃快照（#26.3）。
- 🚨 **内置类名放进 `classNames.*` 时必须合并用户的 classNames**（对象 + 函数形态，#29.1）；
  上游用独立键（`rootClassName`）不会覆盖 ⇒ 本仓换通道就要自己补合并。
- 🚨 **「父级默认 + 单项配置」的展开顺序照抄上游**
- 🚨 **React「JSX children = props.children」在 Vue 不成立**
- 📌 **App 的 HookAPI**：`useMessage/useNotification(getter)` + `Modal.useModal()` ⇒ `[api, holder]`，
  holder 与 `<Component>` **同级** ⇒ App 根是 Fragment（测试别用 `wrapper.element` 当根）。
  通知 API 必须在 holder 挂载后调用，open→DOM 需 3 次 nextTick（#40）。
- 🚨 **Boolean prop 写 `default: true` 会破坏继承**（#39.1）：值恒真 ⇒ 子级永远覆盖父级。
  凡「未传应继承」的布尔配置，缺省只能是 `undefined`，在**合并处**写 `props.x ?? parent.x ?? 兜底`。
- 🚨 **判定上游继承/缺省语义的快招**：React SSR 渲染组合（无 Provider / 父+子不传 / 子显式）看产物分支。
- ⚠️ flaky：`select/__tests__/theme.test.ts` 的 L7「light 态下渲染」全量跑 ~5.2s > 默认 5s ⇒ 偶发超时红。
- 🚨 **React 组件默认不透传普通 attrs**（rc 根不展开 restProps）⇒ 本仓（Vue 自动继承）
  透传是**超集**；两侧自洽优先 + 登记 D 编号（#38 / D130）。透传给内部组件前先摘掉
  `class`/`style`（内部会再拼一次 ⇒ 类名重复）。
- 🚨 **React `useEffect(无依赖数组)` = 每次渲染后都跑 ⇒ Vue 用 `watchEffect(post)`**（#37.1）：
  别写成显式依赖数组（漏依赖就是「改颜色不重绘」）。ref 容器 + 布尔标记要**显式读**标记。
- 🚨 **静态审计型 issue 的前提可能错**（#36）：先跑真浏览器探针/L6 复核，再动手；
  **改样式前先记录该组件当前 L6 状态**（`git checkout` + `build:ui` + 跑 L6 ≈ 1.5min），
  否则分不清「新坏」与「本来就红」。L6 也是「过度修复」的哨兵。
- 🚨 **`style: [a, b]` 后展开者胜**：`{...attrs}` / 数组尾部会让**原始裸数字**顶掉内部
  已 px 化的值 ⇒ 声明被 CSSOM 丢弃。修法：px 化后**再覆盖回** callerStyle（#36）。
- 🚨 **renderless 复合组件收集 `vnode.props` 时别只认 `className`**
- 🚨 **「slot 覆盖 prop」的回退禁用 `??`**：`undefined`=无插槽、`null`=显式空插槽 ⇒ 写
  `slot === undefined ? prop : slot`（#34.1）；`??` 会把「显式空」误判成「未提供」而回退旧值。 —— Vue 侧是原生 `class`；
  修法是把原生 class 也传给内部渲染组件（走 attrs ⇒ Vue 归并/合并/保响应式，#33.1）。：语法糖组件正文在**默认插槽**
  （`vnode.children.default`）⇒ 读 vnode 生成数据的函数要同时读插槽（#31.1）。
- 🚨 **归一化产出的标记字段不能丢**（`span:'filled'` ⇒ `filled:true`，#31.2）⇒ 丢了是静默退化。
  验证行切分/布局要用**三条目以上**（行尾补齐会让两条目的用例误绿）。：anchor `{replace, ...item, key}` = **单项胜**（#28.1）。
- 🚨 **派生数据要确认真进渲染链且真有人消费**（table column #17.2、tabs mergedItems #23.1）⇒ 先写
  **静态**复现；归一 pipeline = **先过滤非法项再 map**。
- 🚨 上游 `useXxx(...)` 每次渲染重算 ⇒ Vue 侧包 computed（#12.3）；rc gDSFP 分支逐条复刻（#16.1，
  派生态同步**静默不 emit**）；`${props.prefixCls}-x` 一律 computed（#15.3，form 同族未修 §1.5）。
- 🚨 provide context 里来自 props 的字段写 getter（#22.7）；`activeRef` 每次 render 同步 activeKey（#22.2）；
  焦点来源只在「变真」帧记录、从不清空（#20.2）；监听器解绑用「绑定时的元素」（#23.5）；
  document/window 监听用 `watch(条件,(ok,_o,onCleanup)=>…,{immediate:true})`（#27.2）。
- 🚨 **antd 多 child 结构照抄**（dropdown-button `[left, <Dropdown>right]` #21.1）；Overlay 用 Fragment（#25.5）。
- 🚨 **`useId()` 只在同一个 app 内唯一**
- 🚨 **`useSize` 一律函数形态** `useSize((ctx) => props.size ?? ctx)`（#35.1 第七例）：
  `useSize(props.size)` 是 setup 期裸值快照；`useSize(() => props.size)` 丢 context 兜底。
- ⚠️ 修完「缺口登记」要同步更正 README §7 缺口表 / 组件头注 / 测试头注三处过期描述。（`instance.ids[1]++`）⇒ 跨 app 自传 id（#24.2）。
- 🚨 **薄壳→底层隔离上层专属 ConfigProvider 配置**（antd `data-popover-inject` ⇒ provide/inject 标记，
  公共 getPopupContainer/direction 不动，#24.4）。
- ⚠️ **`ReturnType<typeof ref<T>>` = `Ref<T|undefined>`** ⇒ 返回值直接声明 `Ref<T>`。
- ⚠️ 键码在 jsdom 只有 `keyCode`（`which` 恒 0）；rc `getFocusNodeList(c,true)` 收负 tabindex；
  rc 可见性判据（offsetParent/rect）在 jsdom 恒 false ⇒ 退化 display/visibility。
**渲染 / 事件**
- 🚨 computed 调 `slots.default?.()` 不过「插槽有无」变化 ⇒ 无 slot 那次求值不 track ⇒ 之后 slot 从无到有但缓存干净 ⇒ 选项永远不出现（#14.3，引擎级，§1.4）。⇒ 薄壳传插槽的包装函数要显式读本组件 reactive 分类态。
- 🚨 computed 里的 dev 告警随惰性求值不触发一起消失 ⇒ 放渲染期沿对比（#14）。
- 🚨 SFC 模板不能放 HTML 注释：编译成 Comment vnode，`Trigger` 取 `slots.default()[0]` ⇒ 顶掉触发元素、整组件渲染成空。
- 🚨 末尾 `...restAttrs` 覆盖内部同名事件键（展开后者胜）⇒ 内部事件键先从 `restAttrs` 摘掉。`triggers` 键已是 `onChange` 形态，再拼 `on` 得 `onOnChange`（恒 undefined）。
**测试探针**
- 🚨 **jsdom 不给 `disabled` 元素派发 click**（原生 button / Button 组件双通道都测不到监听器层）⇒ 禁用态事件用例用**非表单元素**（`<a disabled>`）探针（#15.1）。
- 🚨 `console.log(w.html())` 后接 `grep` 造假象：Vue DOM 含换行、grep 只打首行 ⇒ 「空 form」是截断假象；打印先 `.replace(/\s+/g,' ')`。
- 🚨 **jsdom 下 expand/collapse 动效不结束**：`expandedKeys` 引用一变 NodeList 就 `motionType='show'` 且 `onMotionEnd` 不触发 ⇒ `transitionData` 停在旧列表 ⇒ 「新节点没渲染」可能是动效假象。树结构类复现**只改 treeData**。
- 📌 「新出现的 key 即使已在 expandedKeys 里也不自动展开」是**上游同款**（rc 只在 needSync('expandedKeys') 重算），别当缺陷改。
- ⚠️ tree 的 `TreeCheckedKeys` 只指对象形态；数组形态是 `SafeKey[]`（prop = `SafeKey[] | TreeCheckedKeys`）—— 写错会 7 条 types unhandled error。
- 浮层断言查 `wrapper.element` 别查 `document`（`attachTo` 串残留实例）。
**样式合并 / 元判据**
- `attrs.style` 可能是字符串 ⇒ 合并必须过 `semanticRootStyle`/`mergeStyles`（对象展开拆成 `{0:'w'}` 崩组件）。语义 root 落点：class `[rootClass, classNames.root]`、style `[styles.root, rootStyle]`（原生 style 胜）。
- 🚨 别信注释、跑代码（switch interface 注释与代码不符、radio README D44 过期）。空态占位项也算 `menu-item`（「搜索为空」别写 `length===0`）。
