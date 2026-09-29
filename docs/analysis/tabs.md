# tabs 分析（G1）

> 契约来源：antd 6.6.4 `es/tabs/`（`index.js` 169 + `TabPane.js` 4 + `hooks/useAnimateConfig.js` 35
> + `useLegacyItems.js` 38 + `style/index.js` 913 + `style/motion.js` 37）+ rc 内核
> `@rc-component/tabs@1.13.0`（es 侧 **1653 行 / 17 文件**）。
> ⚠️ rc 包**只读不依赖**（H5）：判据从 `node_modules/.pnpm/@rc-component+tabs@1.13.0/…/es/`
> 与 antd 产物逐行读出（AGENTS §5.0）。分析日期：2026-09-29。
> **G1 产物必须先于实现存在**（AGENTS §2）。

---

## 1. 结构判定：**antd 薄壳 + rc 大内核**（本仓最大的一组之一）

```
antd Tabs（169 行壳）
  ├─ type='editable-card' → 组装 editable{onEdit, removeIcon, addIcon, showAdd}
  │    （⚠️ onEdit 的载荷被**改写**：add ⇒ 透传 event；remove ⇒ 透传 key）
  ├─ useSize(customSize)          → -large / -small
  ├─ useLegacyItems(items, children)
  │    （children → items 的兼容转换：把 `tab` prop 改名成 `label`；
  │      并做 `destroyOnHidden ?? destroyInactiveTabPane` 的兼容映射）
  ├─ useAnimateConfig(prefixCls, animated)  → inkBar / tabPane / tabPaneMotion
  ├─ mergedPlacement = tabPlacement ?? tabPosition，且 **RTL 下 start⇄right / end⇄left**
  ├─ indicator 三源合并：`indicator.align ?? tabs.indicator.align`、
  │    `indicator.size ?? indicatorSize ?? tabs.indicator.size ?? tabs.indicatorSize`
  ├─ more：`{ icon, transitionName: '{rootPrefixCls}-slide-up', ...more }`
  └─ RcTabs                        → 导航区 / 面板区 / 下拉全在这里
```

rc 内核（17 文件，1653 行）：

| 文件 | 行数 | 职责 |
|---|---:|---|
| `Tabs.js` | 153 | 状态机（activeKey 受控 + 重置）+ `mobile` + `id` 异步生成 + **根 DOM** |
| `TabNavList/index.js` | 593 | **导航区**：尺寸测量 / 滚动 / 可见区间 / 键盘 / 指示条 / ping 类 |
| `TabNavList/TabNode.js` | 107 | 单个页签（**ARIA 主力**） |
| `TabNavList/OperationNode.js` | 198 | 溢出下拉（Menu + listbox） |
| `TabNavList/ExtraContent.js` | 33 | `tabBarExtraContent` 的 left/right 两槽 |
| `TabNavList/AddButton.js` | 24 | `editable-card` 的加号 |
| `TabNavList/Wrapper.js` | 17 | `renderTabBar` 逃生口 |
| `TabPanelList/index.js` + `TabPane.js` | ~70 | 面板区（CSSMotion + `role=tabpanel`） |
| `hooks/*` | 462 | `useIndicator` 80 / `useTouchMove` 145 / `useUpdate` 45 / `useOffsets` 34 / `useAnimateConfig` 34 / `useSyncState` 13 / `useVisibleRange` ~48 |
| `util.js` | 33 | `genDataNodeKey` / `getRemovable` / `stringify` |

⇒ 本仓要写的是 **rc-tabs 的 Vue 等价物 + antd 壳的合并逻辑**。规模约为 pagination 的 2.5 倍。

---

## 2. 关键 API 语义

### 2.1 props（antd 侧）

| 组 | props |
|---|---|
| 类型 | `type`(`line\|card\|editable-card`，默认 `line`) `centered` `size`(走 ConfigProvider) |
| 位置 | `tabPlacement`(`top\|end\|bottom\|start`，新 API) / `tabPosition`(`top\|right\|bottom\|left`，**废弃**) |
| 值 | `activeKey` / `defaultActiveKey` / `items` / `renderTabBar` / `onChange` / `onTabClick` / `onTabScroll` |
| 增删 | `type='editable-card'` + `onEdit` / `hideAdd` / `addIcon` / `removeIcon` |
| 溢出 | `more`(`MoreProps`：`icon` / `popupRender` + Dropdown 的 props) `moreIcon`(废弃) `popupClassName`(**废弃**) |
| 外观 | `indicator`(`{align, size}`) / `indicatorSize`(**废弃**) / `animated` / `tabBarGutter` / `tabBarStyle` / `tabBarExtraContent` / `destroyOnHidden` / `destroyInactiveTabPane`(**废弃**) / `classNames` / `styles` / `rootClassName` |
| 逃生 | `locale`(`{dropdownAriaLabel, removeAriaLabel, addAriaLabel}`) `getPopupContainer` |

`items: (Tab & { destroyInactiveTabPane? })[]`，`Tab = { key: string; label: VNodeChild; children?; icon?; disabled?; closable?; closeIcon?; forceRender?; style?; className? }`。

### 2.2 **5 条废弃/移除的告警**（G2 要逐条实现）

1. `popupClassName` → `classNames.popup`（`warning.deprecated`）
2. `tabPosition` → `tabPlacement`（`warning.deprecated`）
3. `onPrevClick` / `onNextClick` → **已移除**（`warning` breaking 级）
4. `indicatorSize` → `indicator={{ size: ... }}`（deprecated）
5. `destroyInactiveTabPane` → `destroyOnHidden`（deprecated，**且 items 里也查**）
   ＋ `children`（`Tabs.TabPane`）→ `items`（`useLegacyItems` 里的 deprecated 告警）

### 2.3 语义槽：**8 个平铺 + 1 个嵌套**

`root` / `item` / `remove` / `indicator` / `body` / `content` / `header` / `popup(root)`。
⚠️ antd 的 `popup` 是 **嵌套形状** `{ root }`，而 rc 侧是**扁平**的 `classNames.popup` ——
antd 在传给 RcTabs 时做了**两层展平**（`popup: clsx(popupClassName, …, mergedClassNames.popup?.root)`、
`styles.popup = mergedStyles.popup?.root`）。这条是「形状不一致时以 rc 的消费端为准」。

`TabsRef` 只有 `{ nativeElement }`（**没有** `focus`/`blur`，与 pagination 的「无 expose」不同）。

---

## 3. 状态机（`Tabs.js` 判据）

### 3.1 `activeKey` 的受控 + **自动重置**

```
tabs = (items ?? []).filter(item => item && typeof item === 'object' && 'key' in item)
mergedActiveKey = useControlledState(defaultActiveKey ?? tabs[0]?.key, activeKey)
activeIndex = tabs.findIndex(tab => tab.key === mergedActiveKey)

useEffect([tabs 的 key 串, mergedActiveKey, activeIndex]):
  newActiveIndex = tabs.findIndex(...)
  if (newActiveIndex === -1) {
    newActiveIndex = max(0, min(activeIndex, tabs.length - 1))   // ← 用**旧索引**夹住
    setMergedActiveKey(tabs[newActiveIndex]?.key)
  }
  setActiveIndex(newActiveIndex)
```
⚠️ 重置判据的三条：**当前 key 被删** ⇒ 用「旧 activeIndex 夹到新长度」的位置补；
`tabs` 为空 ⇒ `tabs[0]?.key` 是 `undefined`（不是 `''`）；依赖数组里有一项是
`tabs.map(t => t.key).join('_')`（**用 key 串当依赖**，因为数组每轮都是新引用）。

### 3.2 `id` 是**异步生成**的

```
mergedId = useControlledState(null, id)      // 注意：默认值是 null
useEffect(() => { if (!id) { setMergedId(`rc-tabs-${NODE_ENV==='test' ? 'test' : uuid++}`) } }, [])
```
⇒ 首帧 `id` 为 `null`，于是 `aria-controls` / `aria-labelledby` / `id` **首帧不渲染**，
挂载后才有。本仓用 `useId` 的话语义会不同（**必须显式记录这条**，见 §10 R3）。

### 3.3 `mobile`

`isMobile()` 在 `useEffect` 里求值 ⇒ 只影响根类名 `{p}-mobile`（SSR 恒不加）。

### 3.4 点击与滚动事件

```
onInternalTabClick(key, e):
  onTabClick(key, e)
  isActiveChanged = key !== mergedActiveKey
  setMergedActiveKey(key)
  if (isActiveChanged) onChange(key)
```
⚠️ `onChange` **只在真的变了**才发（同一页签重复点不发）；`onTabClick` **每次都发**。

---

## 4. 导航区的布局与滚动（`TabNavList` 593 行，最难的一块）

### 4.1 尺寸测量（全部走 DOM 实测，不是纯计算）

| 量 | 来源 | 备注 |
|---|---|---|
| `containerExcludeExtraSize` | `containerRef` 尺寸 − 左右 `ExtraContent` 尺寸 | 用 `getSize`：优先 `getBoundingClientRect`，与 `offsetWidth` 差 < 1 才信（**避免小数误差**） |
| `tabContentSize` | `tabListRef` 尺寸 − `addSize` | ⚠️ **含 AddButton**，所以要减掉 |
| `addSize` / `operationSize` | `innerAddButtonRef` / `operationsRef` | |
| `tabSizes` | 每个页签 `[data-node-key]` 的 `[w,h,left,top]`（相对 `tabListRef`） | key 列表变化时重测 |

`needScroll = floor(containerExcludeExtra) < floor(tabContent + add)`
`visibleTabContentValue = needScroll ? containerExcludeExtra - operationSize : containerExcludeExtra - addSize`

### 4.2 位移的三个变换区间（`transformMin` / `transformMax`）

```
纵向（left/right）:  transformMin = min(0, visible - content), transformMax = 0
横向 + RTL      :  transformMin = 0,                        transformMax = max(0, content - visible)
横向 + LTR      :  transformMin = min(0, visible - content), transformMax = 0
```
`alignInRange(v)` 把位移夹到 `[transformMin, transformMax]`。
⚠️ 三个分支**不对称**：RTL 的符号方向与另两者相反（`translate` 用同一个 `transformLeft`）。

### 4.3 可见区间（`useVisibleRange`）

```
横向: charUnit='width',  position = rtl ? 'right' : 'left', transformSize = |transform|
纵向: charUnit='height', position = 'top',                   transformSize = -transform
endIndex: 第一个 `floor(offset[pos] + offset[unit]) > floor(transformSize + visible)` 的下标 − 1
startIndex: 从后往前第一个 `offset[pos] < transformSize` 的下标 + 1
startIndex > endIndex ⇒ [0, -1]（**空区间**的特殊值）
```
`hiddenTabs = tabs.slice(0, visibleStart) + tabs.slice(visibleEnd + 1)`；`hasDropdown = hiddenTabs.length > 0`。

### 4.4 `scrollToTab(key)`（激活页签必须可见）

横向：LTR 用 `tabOffset.left` / RTL 用 `tabOffset.right` + `width`；
`newTransform` 只在「跑出可视区间」时才改，最后 `alignInRange`。
⚠️ 副作用：**切到横向时把 `transformTop` 归零、反之亦然**（避免残留位移）。

### 4.5 触摸拖动（`useTouchMove` 145 行）

`tabsWrapperRef` 上做水平/纵向拖动；`needScroll` 为假时返回 `false`（**不拦截事件**）；
拖动后 `doLockAnimation()` 写入 `lockAnimation = Date.now()`，100ms 后清零
⇒ `transition: lockAnimation ? 'none' : undefined`（拖动期间**禁掉过渡**，否则会“追”手指）。

### 4.6 `ping` 类（滚动提示）

```
横向 RTL: pingRight = transformLeft > 0;      pingLeft = transformLeft !== transformMax
横向 LTR: pingLeft  = transformLeft < 0;      pingRight = transformLeft !== transformMin
纵向    : pingTop   = transformTop < 0;       pingBottom = transformTop !== transformMin
```
类名挂在 `{p}-nav-wrap` 上：`-ping-left` / `-ping-right` / `-ping-top` / `-ping-bottom`。

### 4.7 DOM 结构（逐字）

```
div.{p}-nav[role=tablist][aria-orientation=horizontal|vertical]   ← 还吃 classNames.header / styles.header
├─ ExtraContent(left)                                  → div.{p}-nav-extra 的 left 槽
├─ div.{p}-nav-wrap[-ping-*]                            ← 可拖动区
│  └─ div.{p}-nav-list[style=translate(x,y)]
│     ├─ {tabNodes}
│     ├─ AddButton（editable-card）→ span.{p}-nav-add[role=button|tabindex] > {addIcon}
│     └─ div.{p}-ink-bar[-animated]                      ← 指示条
└─ OperationNode → div.{p}-nav-operations[-hidden]       ← 溢出下拉触发器
   └─ ExtraContent(right)
```
⚠️ `-ink-bar` 在 `-nav-list` **内部**、`-nav-operations` 在**外部**（兄弟）。

### 4.8 `TabNode` 的 DOM / ARIA（**规范主力**）

```
div.{p}-tab[data-node-key][-with-remove][-active][-disabled][-focus][style=item]   ← 外层（点击/样式）
└─ div.{p}-tab-btn[role=tab][aria-selected][id={id}-tab-{key}]
     [aria-controls={id}-panel-{key}][aria-disabled][tabindex: disabled?null : active?0:-1]
     [onKeyDown / onFocus / onBlur / onMouseDown / onMouseUp]
   ├─ div[aria-live=polite]{`Tab {i} of {n}`}          ← 仅 focus 时（视觉隐藏）
   ├─ span.{p}-tab-icon{icon}                           ← 有 icon 时
   └─ {label}（⚠️ `icon && typeof label === 'string'` 时包一层 `<span>`）
└─ button.{p}-tab-remove[aria-label=removeAriaLabel||'remove'][tabindex: active?0:-1]  ← removable 时
```
- `removable = getRemovable(closable, closeIcon, editable, disabled)`：
  **非 editable ⇒ 永不可删；disabled ⇒ 不可删；`closable === false` ⇒ 不可删；
  `closable === undefined` 且 `closeIcon` 是 `false`/`null` ⇒ 不可删**；
- `data-node-key` 用 `genDataNodeKey`：把 `"` 替换成 `TABS_DQ`（**属性选择器的转义**）；
- 关闭按钮的 `tabIndex` 判据是 **active**（而 btn 本身是 active?0:-1）。

---

## 5. 键盘表（挂在 `-tab-btn` 的 `onKeyDown`，`e.code` 不是 `keyCode`）

| `e.code` | 行为 |
|---|---|
| `ArrowLeft` | 横向时 `onOffset(rtl ? 1 : -1)`；**纵向什么都不做**（也不 preventDefault） |
| `ArrowRight` | 横向时 `onOffset(rtl ? -1 : 1)` |
| `ArrowUp` | **先 `preventDefault`**；纵向时 `onOffset(-1)` |
| `ArrowDown` | 先 `preventDefault`；纵向时 `onOffset(1)` |
| `Home` / `End` | `preventDefault` + 跳到**第一个/最后一个启用**页签 |
| `Enter` / `Space` | `preventDefault` + `onTabClick(focusKey ?? activeKey, e)` |
| `Backspace` / `Delete` | `handleRemoveTab(focusKey, e)` |

`onOffset(offset)` 在 `enabledTabs`（**过滤掉 disabled**）上做**环形**移动：
`(currentIndex + offset + len) % len`，焦点 key 写进 `focusKey`（`focus` prop ⇒ TabNode 的 useEffect 里 `.focus()`）。
⚠️ 鼠标聚焦时**不更新 focusKey**（`isMouse` 标记，`mousedown` 置 true、`mouseup` 置 false）。

---

## 6. 溢出下拉（`OperationNode`）

- 触发器：`div.{p}-nav-operations[-hidden]`（`hasDropdown` 为假时加 `-hidden`）+ `more.icon`；
- 菜单：antd **自己的 Menu**（不是 rc 的 dropdown-menu）：`role=listbox` +
  `aria-activedescendant={popupId}-{selectedKey}` + `aria-label = locale.dropdownAriaLabel ?? 'expanded dropdown'`；
- 每项：`role=option` + `aria-controls={id}-panel-{key}` + `disabled`；
- 删除按钮：`button.{p}-dropdown-menu-item-remove`（**tabIndex 恒 0**，与 TabNode 的 remove 不同）；
- `popupRender(menu, { restTabs, onClose })` 是逃生口；
- `popupId = {id}-more-popup`；`dropdownPrefix = {p}-dropdown`。

---

## 7. 面板区（`TabPanelList` + `TabPane`）

```
div.{p}-body-holder
└─ div.{p}-body[-{tabPosition}][-animated][classNames.body][style=styles.body]
   └─ 每个 tab 一个 CSSMotion（visible=active, forceRender, removeOnLeave=destroyOnHidden,
        leavedClassName={p}-content-hidden, …animated.tabPaneMotion）
      └─ div.{p}-content[-active][classNames.content][style=content+item.style+motion]
           [id={id}-panel-{key}][role=tabpanel][tabindex: active && hasContent ? 0 : -1]
           [aria-labelledby={id}-tab-{key}][aria-hidden=!active]
```
- `destroyOnHidden` 的粒度是**每个 tab**（items 级 `destroyOnHidden` 会被壳映射到 rc 的 `destroyOnHidden`）；
- `forceRender` 让面板在未激活时就渲染（**但没有 `aria-hidden` 之外的隐藏**）；
- `tabPane` 动画默认 **false**（`useAnimateConfig` 默认 `{inkBar: true, tabPane: false}`）。

---

## 8. Component Token（**26 个**，`prepareComponentToken` 逐字）

| token | 派生 |
|---|---|
| `zIndexPopup` | `zIndexPopupBase + 50` |
| `cardBg` | `colorFillAlter` |
| `cardHeight` / `cardHeightSM` / `cardHeightLG` | `cardHeight \|\| controlHeightLG` / `cardHeightSM \|\| controlHeight` / `cardHeightLG \|\| controlHeightLG + 8` |
| `cardPadding` / `cardPaddingSM` / `cardPaddingLG` | `(h − fontHeight)/2 − lineWidth` + `padding` / `paddingXS` / `padding` |
| `titleFontSize` / `titleFontSizeLG` / `titleFontSizeSM` | `fontSize` / `fontSizeLG` / `fontSize` |
| `inkBarColor` | `colorPrimary` |
| `horizontalMargin` | `0 0 {margin}px 0` |
| `horizontalItemGutter` | **`32`（固定值）** |
| `horizontalItemMargin` / `horizontalItemMarginRTL` | **空串**（构建期由 gutter 算，见下） |
| `horizontalItemPadding` / `SM` / `LG` | `{paddingSM\|paddingXS\|padding}px 0` |
| `verticalItemPadding` | `{paddingXS}px {paddingLG}px` |
| `verticalItemMargin` | `{margin}px 0 0 0` |
| `itemColor` / `itemSelectedColor` / `itemHoverColor` / `itemActiveColor` | `colorText` / `colorPrimary` / `colorPrimaryHover` / `colorPrimaryActive` |
| `cardGutter` | `marginXXS / 2` |

⚠️ 另有 `mergeToken` 注入的**内部** token（不进公开面但样式要用）：
`tabsCardPadding`(= `cardPadding`)、`dropdownEdgeChildVerticalPadding`(= `paddingXXS`)、
`tabsDropdownHeight: 200`、`tabsDropdownWidth: 120`、
`tabsHorizontalItemMargin` / `tabsHorizontalItemMarginRTL` = `0 0 0 {gutter}px`。

⚠️ **`cardHeight` 家族可以来自用户覆盖**：`cardHeight || controlHeightLG` —— 因为
「`cardHeight` 会锁住 nav add 按钮的高度」，所以 token 里存的是**合并后的值**。

---

## 9. 复用的本仓资产

| 需要的能力 | 本仓已有 | 备注 |
|---|---|---|
| 浮层下拉 | `dropdown` / `trigger` / `overlay` / `position` | 溢出菜单与 `more` 的逃生口 |
| 尺寸上下文 | `config-provider` 的 `size-context` / `useSize` | **函数形态**（PITFALLS 163） |
| 方向 | `config-provider` 的 `useDirection` | RTL 的 `start⇄right` 映射与指示条 `right` |
| 语义槽 | `_internal/use-merge-semantic` | 返回**对象** `{classNames, styles}`；**嵌套 popup 要展平** |
| 动画 | `@apollo-design/motion` 的 `CSSMotion` | `tabPaneMotion`（`{rootPrefixCls}-switch`） |
| 元素尺寸观察 | **`@apollo-design/utils` 的 `useResizeObserver({ target, onResize, disabled })`** | ✅ 已核实（splitter 在用）。⚠️ rc 用**包装组件** `<ResizeObserver onResize>` 包住三个嵌套节点，因为它没有 ref；本仓给这三个元素各挂一个 `ref` 再调 hook 即可（**不需要新建 `_internal` 原语**） |
| 测量 | `@apollo-design/utils` 的 `raf` | `useIndicator` 的 rAF 与数值抖动抑制 |
| 图标 | `@apollo-design/icons` | Close/Plus/Ellipsis + `DownOutlined`（下拉触发器） |

---

## 10. Vue 化决策（按 COMPATIBILITY.md 映射）

| React | Vue | 分类 |
|---|---|---|
| `activeKey` + `onChange` | `v-model:activeKey`（C11：`update:activeKey` 与 `change` 同发） | INTENDED |
| `onTabClick` / `onEdit` / `onTabScroll` | emits（载荷与 antd 同形） | INTENDED |
| `renderTabBar` | **scoped slot** `#tabBar`（槽参数=rc 的 `RenderTabBarProps`） | INTENDED（C8） |
| `more.popupRender` | **scoped slot** `#morePopup`（`(menu, {restTabs, onClose})`） | INTENDED（C8） |
| `tabBarExtraContent`（`ReactNode \| {left,right}`） | **scoped slot** `#extra`（`{position: 'left'\|'right'}` 参数）+ prop 两形态 | INTENDED |
| `items[].label` / `children` | `VNodeChild`；⚠️ `children` 的 `Tabs.TabPane` 兼容形态**不实现**（见下） | PLATFORM |
| `TabsRef.nativeElement` | `expose({ nativeElement })` | 同上游 |
| `Tabs.TabPane`（`children` 兼容写法） | **不实现**，只发 deprecated 告警 | UPSTREAM（v6 已 deprecated，用 `items`） |
| `destroyInactiveTabPane` / `tabPosition` / `indicatorSize` / `popupClassName` / `onPrevClick` / `onNextClick` | **照发 deprecated 告警**，前三者**仍生效**（兼容），后三者不实现 | UPSTREAM |
| `items[].renderWrapper`（rc 内部） | 不需要（它是 TabNode 的包装通道，属内部） | — |

---

## 11. 风险预登记（G4 动手前逐条核实）

| # | 风险 | 处置 |
|---|---|---|
| R1 | ~~`ResizeObserver` 依赖~~ **已解决** | 复用 `@apollo-design/utils` 的 `useResizeObserver`（splitter 先例）；rc 的**包装组件**形态改写成「三个 ref + 三次 hook」。⚠️ 该 hook 是 `watch(..., {flush:'post'})` 建立监听的 ⇒ **首次测量要等 DOM 就绪**，L2 用桩 + `nextTick` 覆盖 |
| R2 | 测量/滚动的**逻辑量极多**（`useOffsets` / `useVisibleRange` / `transform` 三区间 / `ping` 四类 / `scrollToTab` 双向）| G4 逐行移植；L1 把 `useVisibleRange` 与 `alignInRange` 抽成**纯函数**用例（jsdom 无布局，DOM 量只能靠 L6 视觉） |
| R3 | **`id` 异步生成**首帧不渲染 aria | 保留上游语义（`useEffect` 后补），并在 L2 断言「首帧无 aria-controls、挂载后有」；⚠️ 不要换成 `useId`（会变语义） |
| R4 | `activeKey` 的**重置规则**（删掉当前页签 ⇒ 旧索引夹住）| L2 用例覆盖「删末尾 / 删中间 / 删光 / tabs 为空」四态 |
| R5 | **指示条的三种 align + size 三形态（数字/函数/缺省）** | `useIndicator` 抽成可测单元；`align` 与 `rtl` 的组合 6 种都要断言 |
| R6 | 语义槽是**8 个平铺 + 1 个嵌套**，且 antd 侧要**展平** popup | G2 定 `TabsSemanticClassNames` 为嵌套形状（与 antd 同），G4 在传给内部时展平；L3 断言形状、L4 断言 DOM 类名 |
| R7 | `type='editable-card'` 的 `onEdit` 载荷**被改写**（add 传 event、remove 传 key） | L2 断言两种载荷形状；`hideAdd` / `addIcon` / `removeIcon` 三源合并（item → `tabs.addIcon`）都要覆盖 |
| R8 | `more` 的 `transitionName` 是 **`{rootPrefixCls}-slide-up`**（不是组件前缀） | 照抄；L2 断言传给浮层的名字（PITFALLS 180 同族：写错动效静默失效） |
| R9 | 与 `config-provider` 的 `tabs` 分片耦合（`more.icon` / `moreIcon` / `indicator.align` / `indicatorSize` / `addIcon` / `removeIcon`） | 6 个取值点都要做 `props ?? context` 合并，逐条在 L2 覆盖 |
| R10 | 面板的 `forceRender` / `destroyOnHidden` 与 CSSMotion 的组合 | L2 断言「未激活 + forceRender ⇒ 渲染但 `aria-hidden`」；`destroyOnHidden` ⇒ 离场后卸载（**要轮询**，PITFALLS 179） |
| R11 | `size` 的三档（`small`/`default`/`large`）各有独立的 padding token 与 `-small`/`-large` 类名 | L2 断言类名；L7 断言三档的 token 值 |
| R12 | **`animated` 的三形态**（`false` / `true` / 对象）与默认 `{inkBar: true, tabPane: false}` | L1 纯函数用例覆盖 `useAnimateConfig` 全部分支 |

---

## 12. 不做什么（明确边界）

- **不实现** `Tabs.TabPane` 的 `children` 兼容写法（v6 已 deprecated，只发告警）；
- **不实现** `onPrevClick` / `onNextClick`（上游已移除，只发 breaking 告警）；
- **不实现** `items[].renderWrapper`（rc 内部通道）；
- 不引 `@rc-component/*`（H5）、不引 cssinjs（H6）、不搬实现（H2）；
- 溢出菜单**用本仓 Menu**（与 antd 同判：antd 也是用自己的 Menu，不是 rc 的 dropdown-menu）。
