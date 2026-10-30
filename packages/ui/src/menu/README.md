> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

> 历史实施记录：原勾选、当时结果和缺口保留。2026-10-30 起，本文的 G0–G14 / 逐组件 G13 全仓收口与旧 Registry 进度规则由仓库 `WORKFLOW.md`、`TESTING.md` 两阶段流程替代；当前任务状态只读 `registry/vue-native-audit.json`，不据本文重复派发或重跑已有效验证。

# menu

> **层**：L3（`packages/ui`）｜ **优先级**：P3 ｜ **复杂度**：L ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/menu/`（index 97 / menu 342 / MenuItem 194 /
> SubMenu 81 / style 1109 行）+ `@rc-component/menu@1.5.0`（~2620 行）。
> 上游是**兼容性规格**，不是代码来源。
> 分析产物：[`docs/analysis/menu.md`](../../../../docs/analysis/menu.md)。

## 1. 职责

导航菜单（水平/垂直/内嵌三模式 + 折叠态）。**rc-menu 内核的 Vue 自建** ——
本组件是 trigger 生态外最大的引擎型组件（溢出折叠 + 键盘导航 + 子菜单弹出）。

## 2. 文件布局与关键决策

```
menu/
├── Menu.ts              # rc Menu.js 的状态族 + 双渲染 + Overflow 接入
├── MenuItem.ts          # li[role=menuitem]（roving tabindex / noicon / 缩进）
├── MenuItemGroup.ts     # li[role=presentation] > ul[role=group]
├── MenuDivider.ts       # li[role=separator]
├── SubMenu.ts           # title + popup（Teleport）/ inline 展开
├── context.ts           # MenuContext / PathTracker / PathRegister / isSubPathKey
├── engine/
│   ├── parse-items.ts   # items → 规范化节点（rc convertItemsToNodes 数据层等价）
│   ├── key-records.ts   # key↔path 双向登记表（PATH_SPLIT 逐字）
│   └── use-accessibility.ts # roving tabindex 键盘导航（键位矩阵逐字）
├── style/{token.ts,index.ts}
└── interface.ts
_internal/overflow.ts    # rc-overflow 的 Vue 版（horizontal 溢出折叠基建）
```

- **双渲染**：measure 子树（PathRegister 注入，子组件只登记路径渲染 null）+
  可见子树（PathTracker 注入 keyPath）—— rc 的 measureChildList 协议。
- **Overflow 新基建**：`_internal/overflow.ts`（calcDisplayCount 纯函数化，
  raw 路径 cloneVNode 注入，ssr='full'，renderRawRest）。
- **collapsed 态 Tooltip 集成**（2026-10-21 落地）：`Menu.tooltip`（`false` 关闭）
  透传到 MenuItem；折叠态（inlineCollapsed / Sider 折叠）用 Tooltip 展示标题，
  `title` 未定义时按 antd 取 firstLevel 的 label，placement 默认 RTL?left:right。

## 3. 与 antd 的差异

## 3.5 Menu 的五条判据（Issue #22）

1. 🚨 **键盘候选集要收 roving `tabindex="-1"`**：rc 是 `getFocusNodeList(container, true)`
   ⇒ `focusable(node, includePositive = true)`（负 tabindex 也要收）。写成
   `[tabindex]:not([tabindex="-1"])` 会把所有菜单项排除，ArrowUp/Down、Home/End 全失效。
2. 🚨 **焦点落点要在 rAF 里对**实时** activeKey 判定**：rc 的 `activeRef.current` 每次 render
   跟着 activeKey 走；本仓在 setup 对齐一次 ⇒ 条件恒 false ⇒ 一次都不 focus。
3. 🚨 **`e.which` 在 jsdom 恒为 0**（只有 `keyCode` 有值）⇒ 用 `getEventKeyCode()`
   （`which || keyCode`）归一化，否则键盘路径不可测（浏览器两者都有值，行为不变）。
4. 🚨 **overflow 的「更多」子菜单必须拿到省略项**（rc `Menu.js:361-371`：`childrenNodes =
   omittedItems`、`internalPopupClose = len === 0`）；写死空 children ⇒ 「更多」永远空。
5. 🚨 **context 对象是 setup 期建的**：普通字段 = 快照 ⇒ `disabled`/`inlineIndent`/延迟/
   `inlineCollapsed`/`theme`/`expandIcon` 一律写成 **getter**（消费处读时现取、可被追踪）。

✅ **Issue #22 三项遗留已全部修复（2026-10-21）**：
- **#22.1** popup 不再恒 `visibility:hidden` —— 挂载后按 title 的 `getBoundingClientRect()`
  定位（vertical 贴右侧 / horizontal 贴下方 / RTL 贴左侧）并置 `visible`；关闭时节点本就不
  渲染，无需「藏回去」。DOM 结构不变（仍 Teleport 到 body）⇒ L4 只取组件容器内的节点、
  L6 静态截图 open=false，两套基线都不受影响。
- **#22.6** 语义通道接通：`classNames` / `styles` 进 props（原先只在 interface 声明，
  `inheritAttrs: false` 导致静默丢弃），经 `useMergeSemantic` 合并（第四参 schema 处理
  `popup` / `subMenu` 的字符串形态），落点为 root+list（同一个根 ul）、item、itemTitle、
  itemContent、itemIcon、popup.root。
- **#22.8** measure 路径补对称注销：`usePathRegister()`（`context.ts`）在卸载与 keyPath
  变化时 `unregisterPath`，避免动态移除 items 后残留旧 `key → keyPath` 映射。

⚠️ 仍未做：公开类型与运行时 props 的**逐字段**对照（#22.6 只覆盖 classNames/styles；
`tooltip` 已在 2026-10-21 接通，`expandIcon` 仍按「Vue 侧 slot 替代」处理，见 COMPATIBILITY）。

登记于 `COMPATIBILITY.md` §9.2 **D87–D90**：flushSync（PLATFORM）、RO 时序
（PLATFORM）、items 唯一真源（INTENDED）、keyPath reverse 口径（UPSTREAM 事实契约）。

**PENDING-1 已在 2026-10-21 定位并修复**：horizontal 菜单整体不可见的根因不是 RO 时序，
而是 `renderRawItem` 返回的是**组件 VNode**（MenuItem / SubMenu），overflow 的 ref 拿到
组件实例后 `el instanceof HTMLElement` 恒 false ⇒ 每项宽度缺失 ⇒ `displayCount = -1`
全部判溢出。Overflow 现在解包 `$el` 再测量（`overflow.test.ts` 回归）。DOM 结构由
L4 `menu:horizontal` 钉住；几何仍需在 CI 的 L6 环境回归后更新基线。

L6 视觉 9 张（vertical/inline/dark × 3 viewport）**全部 0.000% exact**。

## 3.6 Menu 的 Sider 联动（Issue #32）

`inlineCollapsed` 的回退源是 **`SiderContext.siderCollapsed`**（上游同判）：

```
mergedInlineCollapsed = props.inlineCollapsed ?? siderContext.siderCollapsed?.value ?? false
```

- 该值同时驱动 `mergedMode`（`true ⇒ 'vertical'`）、context 的 `inlineCollapsed`
  与根上的 `-inline-collapsed` 类 ⇒ 侧栏折叠时导航自动收起。
- ⚠️ Sider 必须 provide **ComputedRef**（不能是裸布尔），否则这里只能读到首帧值
  （见 `layout/README.md` §6.5）。
- 显式 `inlineCollapsed={false}` 仍然覆盖 Sider 的折叠态。

## 4. 收口证据（G13）

- L1 29（engine 15 + 组件 14）/ L4 6（基线 `menu.dom.json`）/ L5 17 /
  L7 13 / L6 9/9 0.000% exact
- demo 13 个（与 antd 用户可见 demo 一一对应；component-token 的主题覆盖
  以默认主题渲染，文件头登记）
- registry 11 维 done，`status: completed`
