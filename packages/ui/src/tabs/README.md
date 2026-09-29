# Tabs 实现说明

> 收口记录（2026-09-30）。

## 1. 对应 antd 组件

- antd 6.6.4 `es/tabs/`：`index.js` 169 行（**壳**）+ `TabPane.js` 5 + `hooks/useAnimateConfig.js` 27
  + `hooks/useLegacyItems.js` 44 + `style/index.js` 913 + `style/motion.js` 43
- rc 内核：`@rc-component/tabs@1.13.0`（**17 文件 ≈ 1653 行**，是本仓目前最大的一组）
  - `Tabs.js` 153 / `TabNavList/index.js` **593** / `TabNavList/OperationNode.js` 198 /
    `TabNavList/TabNode.js` 107 / `TabNavList/AddButton.js` 28 / `TabNavList/ExtraContent.js` 33 /
    `TabPanelList/index.js` 71 / `TabPanelList/TabPane.js` 30 / `hooks/*` 462
- 分析产物：`docs/analysis/tabs.md`
- 复用的本仓资产：`dropdown`（溢出下拉）、`menu`（下拉菜单，**本轮补了 `role` 覆盖与 `aria-*` 透传**）、
  `motion` 的 `CSSMotion`、`utils` 的 `useResizeObserver` 与 `raf`、
  `_internal/{use-merge-semantic, to-css-size}`、`config-provider` 的 Size/Direction/Config
- 样式：**机械移植** antd 产物（**128 条规则**），**26 个** Component Token + 6 个内部 token

## 2. 与 antd 的行为差异清单（同步 COMPATIBILITY.md §9）

| # | 差异 | 分类 | 说明 |
| --- | --- | --- | --- |
| 1 | `activeKey` + `onChange` → `v-model:activeKey`（同时发 `change`，C11） | INTENDED | —— |
| 2 | `onTabClick` / `onEdit` / `onTabScroll` → **emits**（`tabClick` / `edit` / `tabScroll`） | INTENDED | ⚠️ **不要**同时声明成 props：`emit('tabClick')` 会去找 `props.onTabClick` ⇒ **回调触发两次**（本轮实测踩到） |
| 3 | `renderTabBar` / `more.popupRender` / `tabBarExtraContent` → **scoped slot** | INTENDED | C8 |
| 4 | `children`（`Tabs.TabPane` 兼容写法）**不实现**，只发告警 | UPSTREAM | 上游 v6 已 deprecated |
| 5 | `onPrevClick` / `onNextClick` **不实现**，只发 breaking 告警 | UPSTREAM | 上游已移除 |
| 6 | 面板 id 前缀是 `apollo-tabs-N`（上游是 `rc-tabs-N`） | PLATFORM | 上游用模块级 `uuid`；本仓用 `prefixCls` 使前缀随库 |
| 7 | 溢出触发器多一个 `-dropdown-trigger` 类（差异 **U15**） | PLATFORM | 上游用 **rc 级 dropdown**（只加 `-open`），本仓复用**本仓 Dropdown**（契约就是补 `-trigger`）；L4 以定向豁免放行 |
| 8 | `more.icon` 的优先级 | 同上游 | `props.more.icon` > `context.more.icon` > deprecated 的 `moreIcon`（**注意 direction**） |

**跟随的上游行为（无差异但在意）**：
- `id` **异步生成**（首帧 `null` ⇒ 首帧不渲染 `aria-controls` / `aria-labelledby` / `id`）；
- `animated` 默认 `{ inkBar: true, tabPane: false }`（**面板默认无动画**）；
- `more.transitionName` 被**强制**成 `{rootPrefixCls}-slide-up`（`apollo-slide-up`，**不是** `apollo-tabs-*`）；
- 溢出下拉的菜单是 `role=listbox` + `role=option`（靠给 Menu 传 `role` 表达）。

## 3. 文件结构与选型

```
tabs/
├── Tabs.vue            # antd 壳（5 条告警 / placement 映射 / editable / more / indicator / items 归一）
│                       # + rc 状态机（activeKey 自动重置 / 异步 id / mobile / 事件分流）
├── TabNavList.ts       # 导航区：测量链 / 滚动 / 指示条 / 键盘 / 溢出（对应上游 593 行）
├── TabNode.ts          # 单个页签（ARIA 主力）
├── OperationNode.ts    # 溢出下拉（listbox + 键盘）
├── AddButton.ts / ExtraContent.ts
├── TabPanelList.ts + TabPane.ts   # 面板区（CSSMotion）
├── util.ts             # 纯函数：genDataNodeKey / getRemovable / getSize / getTabSize /
│                       # getUnitValue / alignInRange / getTransformRange / filterItems …
├── hooks/
│   ├── use-animate-config.ts   # getAnimateConfig（**纯函数**）
│   ├── use-offsets.ts          # getTabOffsets（**纯函数**）
│   ├── use-visible-range.ts    # getVisibleRange + getScrollToTabTransform（**纯函数**）
│   ├── use-indicator.ts        # getIndicatorStyle + useIndicator（rAF + 抖动抑制）
│   └── use-touch-move.ts       # 触摸拖动 + 惯性
└── style/  token.ts（26 + 6）+ index.ts（128 条规则）
```

**为什么把「几何」抽成纯函数**：它们有大量边界（三区间不对称、两个哨兵、`endIndex` 初值、
复用只递一层），纯函数形态让 L1 能穷举（`pure.test.ts` 33 条），而 DOM 尺寸那部分在 jsdom 里恒 0
（只能用真浏览器 + L6 视觉）。

## 4. Component Token（26 个自有 + 6 个内部）

判定值与 antd 产物逐字对拍（`node tests/visual/debug/extract-tabs-css.mjs --tokens`）。
⚠️ 上游 `.d.ts` 里的第 7 个内部 token `tabsNavWrapPseudoWidth` **只出现在类型声明里**
（无赋值无消费）⇒ 死字段，**刻意不实现**。

## 5. 实现要点（最容易写错的判据）

1. **`getSize` 的 `< 1` 容差**：`rect` 与 `offsetWidth` 相差小于 1 才采信 `rect`（避免小数抖动）。
2. **位移的三个区间不对称**：纵向与横向 LTR 共用 `[min(0, visible−content), 0]`，
   横向 **RTL** 是 `[0, max(0, content−visible)]`。
3. **`visibleRange` 的两个哨兵**：空 `tabs` ⇒ `[0, 0]`；区间为空 ⇒ `[0, -1]`；
   ⚠️ 全可见时是 **`[0, len]`**（`endIndex` 初值是 `len`，越界一位，消费方 `slice` 天然安全）。
4. **`getTabOffsets` 的复用只递一层**（查的是**测量表**的前一项，不是上一轮的偏移）。
5. **`scrollToTab` 的三条 `if` 有优先级**：「已可见但位移没归零」时会被**主动归位**。
6. **`getRemovable` 的四条件**（非 editable / disabled / `closable === false` /
   `closable === undefined` 且 `closeIcon` 是 `false`·`null`）。
7. **`TabNode` 的 `tabIndex` 三态**（`disabled ? null : active ? 0 : -1`），
   而**删除按钮用 `active`**（与 btn 不同）；溢出下拉里的删除按钮**恒 0**。
8. **`activeKey` 的自动重置**用**旧索引**夹到新长度（删末尾会落到倒数第二个）。
9. **键盘读 `e.code`**：纵向时 `←/→` **什么都不做也不 preventDefault**；`↑/↓` 无条件 `preventDefault`。
10. 🚨 **所有内联样式的数值必须过 `toCssSize`**（PITFALLS 8 / D94）：Vue 不给 `style` 里的裸数字
    补 `px`，`el.style.width = '33.45'` 是**非法值会被静默丢弃** —— 指示条会恒 0 宽。
    本轮**正是 L6 视觉（0.03% 像素差）**把它揪出来的；`pure.test.ts` 里已加哨兵断言。
11. 🚨 **回调不能同时是 prop 与 emit**（否则触发两次）—— 见 §2 的第 2 条。
12. `tabBarGutter` 的首项**不带**间距（`i === 0 ? styles.item : {...tabBarNodeStyle, ...}`）。

## 6. 层与证据

| 层 | 文件 / 命令 | 结果 |
| --- | --- | --- |
| L1 | `__tests__/pure.test.ts` | **33**（几何与配置的纯函数穷举） |
| L2 | `__tests__/index.test.ts` | **46**（结构 / ARIA / 异步 id / 自动重置 / 事件分流 / 键盘 / editable / 面板 / 语义槽 / 插槽） |
| L3 | `__tests__/type.test-d.ts` | **36**（11 正 + 6 负），`Type Errors: no errors` |
| L4 | `__tests__/semantic.test.ts` + `baselines/tabs.dom.json` | **27/27**（26 用例，各**恰好 1 条**豁免 = U15） |
| L5 | `__tests__/a11y.test.ts` | **26**（16 种真实配置的 axe + role/ARIA 6 + 键盘 5） |
| L6 | `tests/visual`（`tabs`：13 variant × 3 viewport） | **39/39 逐像素 exact** |
| L7/主题 | `__tests__/theme.test.ts`（26 token 判定 + 4 主题 × 13 demo） | 全绿 |
| demo | `__tests__/demo.test.ts`（`expectCount: 13`） | 全绿 |
| 构建 | `tests/build/run.mjs` | 见门禁输出 |

## 7. 已知缺口

1. **导航区真的溢出**（`-nav-more` 可见 + 下拉菜单结构）不在 L4 基线里：由 DOM 实测驱动，
   SSR 恒判定为「无隐藏页签」；L6 的用例宽度足够（640px）也不溢出 ⇒ 这条目前只有
   **单元级**（`getVisibleRange` 的纯函数用例）与**间接**覆盖。要真正覆盖需要
   「窄容器 + 等测量稳定」的视觉用例（目前刻意不做：溢出下拉何时打开是时序问题）。
2. **`destroyOnHidden` 的离场卸载**在 L2 用**轮询**断言（PITFALLS 179），L6 不含动画帧。
3. **26 个 Component Token 目前无法由用户覆盖**（零运行时管线缺「Component Token → CSS 变量」
   那一段，`ConfigProvider` 的 `theme.components.Tabs` 未接通）—— 与 divider / pagination 同源的缺口。
   `TabsSeedToken` 的 `cardHeight` 三个可选字段是该管线预留的入口。
4. **`mobile` 分支**（`isMobile()` 为真时根类名带 `-mobile` 且**溢出触发器不渲染**）在 jsdom 下
   打不到真实 UA ⇒ 只有 `isMobile()` 的纯函数断言。
5. **demo 维度的 axe**（`a11yDemoTest`）**刻意不接**：它的 `allow` 是全局的
   （要求每个 demo 都命中），而 Tabs 的 `aria-required-children` 是**结构固有且只出现在
   含 `<button>` 的 demo 上** ⇒ 无法表达。demo 的形态已由 `a11y.test.ts` 的 `cases` 表
   按用例 id **定向豁免**覆盖（含「额外内容里放 Button」这一条）。

## 8. demo 覆盖登记

antd 6.6.4 的 `components/tabs/demo/` 有 **21 个** `.tsx`，本仓落 **13 个**
（`demo.test.ts` 的 `expectCount` 钉死）。未落地的 8 个：

| demo | 原因 |
| --- | --- |
| `_semantic` | 上游内部语义调试页（`_` 前缀），不面向用户 |
| `component-token` | 依赖 `antd-style` 的 `createStyles` 与 ConfigProvider 的 `theme.components` 覆盖；本仓零运行时 + 静态 CSS，且**该管线尚未接通**（见 §7.3） |
| `style-class` | 同上（`styles` / `classNames` 的语义逃生口用法，依赖 antd-style 写法） |
| `slide` | 上游演示自定义 tabBar 的**动效**（依赖 `@rc-component/motion` 的 `CSSMotion` 在自定义 tabBar 里的用法）；本仓的 `#tabBar` 槽已覆盖「替换导航区」，动效差异化留给使用者 |
| `nest` | 演示「内层 Tabs 与外层 Tabs 的状态隔离」，依赖 `context` 里的嵌套跟踪；本仓 `activeKey` 是组件级状态、天然隔离，无需专门 demo |
| `popupRender-Search` | 依赖**未落地**的 `Input.Search`（与 tree 的 search demo 同因，已在 §7 登记） |
| `custom-tab-bar-node` | 依赖 rc 内部的 `renderWrapper` 通道（本仓明确**不实现**，见 `docs/analysis/tabs.md` §12） |
| `card-top` | 与 `card` 的差异只是 `tabPlacement="top"` 的显式写法（已由 `placement` demo 覆盖） |

13 个 demo 覆盖了全部**对外能力**：值域与受控、禁用、图标、三档尺寸、四向位置、卡片式、
居中、可增删（含 `hideAdd` / 自定义图标）、两侧附加内容（两形态）、指示条（align / size /
函数形态）、自定义导航区、动画三形态。
