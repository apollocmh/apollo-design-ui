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
- **collapsed 态 Tooltip 集成**：firstLevel item 的标题走 Tooltip（v1 由
  noicon/Tooltip 通道承担，完整 tooltip prop 透传 PENDING）。

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

⚠️ 未修（已登记 `KNOWN-ISSUES.md` §1.6/§1.7）：SubMenu 的 popup 恒 `visibility:hidden`
（缺 rc PopupTrigger 的定位，单独翻可见性会打断 L6 基线）；公开类型与运行时 props 的逐字段
对照；measure 路径缺 `unregisterPath`。

登记于 `COMPATIBILITY.md` §9.2 **D87–D90**：flushSync（PLATFORM）、RO 时序
（PLATFORM）、items 唯一真源（INTENDED）、keyPath reverse 口径（UPSTREAM 事实契约）。

**已知缺口 PENDING-1**：horizontal 的 L6 视觉裁剪 —— Overflow 的 RO 测量
时序存在 hidden 中间态冻结（absolute 元素不再触发 RO ⇒ 无法收敛）。
DOM 结构由 L4 `menu:horizontal` 钉住；几何待 Overflow 时序精调后回归。

L6 视觉 9 张（vertical/inline/dark × 3 viewport）**全部 0.000% exact**。

## 4. 收口证据（G13）

- L1 29（engine 15 + 组件 14）/ L4 6（基线 `menu.dom.json`）/ L5 17 /
  L7 13 / L6 9/9 0.000% exact
- demo 13 个（与 antd 用户可见 demo 一一对应；component-token 的主题覆盖
  以默认主题渲染，文件头登记）
- registry 11 维 done，`status: completed`
