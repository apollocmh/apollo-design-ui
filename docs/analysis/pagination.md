# pagination 分析（G1）

> 契约来源：antd 6.6.4 `es/pagination/`（`Pagination.js` 213 + `style/index.js` 595 +
> `style/bordered.js` 87 + `useShowSizeChanger.js` 12）+ rc 内核
> `@rc-component/pagination@1.4.0`（es 侧 `Pagination.js` 441 / `Options.js` 119 / `Pager.js` 41）。
> ⚠️ rc 包**只读不依赖**（H5）：每条判据都从
> `node_modules/.pnpm/@rc-component+pagination@1.4.0/…/es/` 与 antd 产物逐行读出（AGENTS §5.0）。
> 分析日期：2026-09-29。**G1 产物必须先于实现存在**（AGENTS §2）。

---

## 1. 结构判定：**antd 中等厚度的壳 + rc 内核**

与 slider（antd 侧几乎零逻辑）不同，pagination 的壳做了不少事：

```
antd Pagination（213 行）
  ├─ useBreakpoint(responsive)      → xs ⇒ size='small'（`responsive` 的判据）
  ├─ useSize(customizeSize)         → ConfigProvider 的 componentSize
  ├─ useVariant('input')            → 输入框变体类（与 form 的 variant 体系同源）
  ├─ useLocale('Pagination', enUS)  → locale 合并（context 打底、props.locale 覆盖）
  ├─ useShowSizeChanger ×2          → props 与 ConfigProvider 的 showSizeChanger 正交合并
  ├─ sizeChangerRender              → 把 rc 的「尺寸切换器」渲染成本仓的 Select
  │                                   （含 options / value / aria-label / getPopupContainer 的接线）
  ├─ iconsProps（useMemo）          → 4 组图标节点：prev/next（`button`）+ jump-prev/jump-next（`a`）
  │                                   ⚠️ RTL 下左右箭头互换（DoubleLeft ⇄ DoubleRight）
  ├─ token.wireframe → BorderedStyle（`{p}-bordered` 的一条独立样式）
  └─ RcPagination                   → 页面列表 / 跳页 / 快速跳转全部在这里
```

rc 内核（≈600 行）：

| 文件 | 行数 | 职责 |
|---|---:|---|
| `Pagination.js` | 441 | 状态（current/pageSize 受控/非受控）+ **页码列表算法** + 简化模式 + 事件与键盘 + `<ul>` 结构 |
| `Options.js` | 119 | 尺寸切换器（`sizeChangerRender` 注入点）+ 快速跳转输入框（`jump_to … page`） |
| `Pager.js` | 41 | 单个页码（`li.{p}-item.{p}-item-{n}[-active][-disabled]`） |
| `locale/*` | 15 each | 12 个文案键（zh_CN 逐字见 §6） |

⇒ 本仓要写的是 **rc-pagination 的 Vue 等价物 + antd 壳的合并逻辑**（规模远小于 slider）。

---

## 2. 关键 API 语义

### 2.1 `PaginationProps`（= `Omit<RcPaginationProps, 'showSizeChanger'|'pageSizeOptions'|'classNames'|'styles'|'sizeChangerRender'>` + antd 追加）

| 组 | props |
|---|---|
| 值 | `current` `defaultCurrent`(1) `total`(0) `pageSize` `defaultPageSize`(10) |
| 行为 | `disabled` `simple`(`boolean \| {readOnly}`) `hideOnSinglePage` `showPrevNextJumpers`(true) `showLessItems` `showTitle`(true) `align`(`start\|center\|end`) `responsive` `size`(`small\|default\|large`) |
| 尺寸切换 | `showSizeChanger`(`boolean \| SelectProps`；默认 `total > totalBoundaryShowSizeChanger`) `pageSizeOptions`(`(string\|number)[]`；字符串形态**下个大版本移除**) `totalBoundaryShowSizeChanger`(50) `components.sizeChanger` |
| 跳转 | `showQuickJumper`(`boolean \| {goButton}`) |
| 渲染 | `itemRender(page, type, element)` `showTotal(total, range)` `role` `locale` |
| 语义槽 | `classNames.{root,item}` / `styles.{root,item}` |
| 事件 | `onChange(page, pageSize)` `onShowSizeChange(current, size)` |
| 已废弃 | `selectComponentClass`（非官方 API，v7 移除）`mini` 类（v7 移除） |

### 2.2 `PaginationConfig` / `PaginationPosition`（antd 用于「表格分页」的场景）

`PaginationConfig = Omit<PaginationProps,'rootClassName'> & { position?: 'top'|'bottom'|'both' }`。
⚠️ 它是**给 Table 之类的容器用的配置形状**，本仓在 pagination 里只导出类型（不实现容器逻辑）。

### 2.3 语义槽只有 **2 个**：`root` + `item`

⚠️ `item` 会落到每个页码/上一页/下一页的 `li` 上（rc 的 `paginationClassNames?.item`），
**不**落到 `<ul>` 上 —— 这是最容易写错的一条。

---

## 3. 状态机（`Pagination.js` 判据）

### 3.1 受控/非受控 + **钳制**

```
pageSize = useControlledState(defaultPageSize, props.pageSize)
internalCurrent = useControlledState(defaultCurrent, props.current)
current = clamp(internalCurrent, 1, allPages)      // ⚠️ 每次渲染都钳
allPages = floor((total - 1) / pageSize) + 1
```
- `total === 0` ⇒ `allPages === 0`；`current` 被钳到 **1**（不是 0）；
- ⚠️ `allPages === 0` 时页码列表里会放一个 `{p}-item-disabled` 的占位项（`page: 1`）。

### 3.2 变化的三个入口与各自的规则

| 入口 | 规则 |
|---|---|
| `handleChange(page)` | 先钳到 `[1, allPages]`；`isValid(page)` = 整数 **且 `page !== current`** 且 `total > 0`；`disabled` 时直接返回 |
| `changePageSize(size)` | `nextCurrent = current > newAllPages && newAllPages !== 0 ? newAllPages : current` ⇒ 换页大小后若当前页越界则**回退到最后一页**；依次 `setPageSize → setInternalInputVal → onShowSizeChange(current, size) → setCurrent → onChange(nextCurrent, size)` |
| 简化模式的输入框 | Enter / ↑ / ↓ 分别触发「跳到输入值 / 值-1 / 值+1」（见 §4） |

⚠️ `current` prop 给了但没给 `onChange` ⇒ 开发期告警「This will render a read-only component」。

### 3.3 快速跳转的可见性

`shouldDisplayQuickJumper = total > pageSize ? showQuickJumper : false`
⇒ **只有一页时不显示跳转**（与 `hideOnSinglePage` 无关）。

### 3.4 尺寸切换器的默认值

`showSizeChanger = total > totalBoundaryShowSizeChanger`（rc 默认）；antd 侧再与
ConfigProvider 的 `pagination.showSizeChanger` 做 **`??` 合并**（props 优先，**不等价于布尔或**）。

---

## 4. 页码列表算法（**核心判据**，实现时逐行对齐）

```
pageBufferSize = showLessItems ? 1 : 2
if (allPages <= 3 + pageBufferSize * 2)   // ≤ 7（或 ≤ 5）
    → 全部页码；allPages === 0 时额外放一个 disabled 的 1
else
    left  = max(1, current - pageBufferSize)
    right = min(current + pageBufferSize, allPages)
    if (current - 1 <= pageBufferSize) right = 1 + pageBufferSize * 2
    if (allPages - current <= pageBufferSize) left = allPages - pageBufferSize * 2
    hasJumpPrev = current - 1 >= pageBufferSize * 2 && current !== 1 + 2
    hasJumpNext = allPages - current >= pageBufferSize * 2 && current !== allPages - 2
    if (!showLessItems && hasJumpPrev && right !== allPages) left += 1
    if (!showLessItems && hasJumpNext && left !== 1) right -= 1
    渲染 left..right
    hasJumpPrev ⇒ 第 0 项补 `{p}-item-after-jump-prev` 并在前面 unshift `jump-prev`
    hasJumpNext ⇒ 末项补 `{p}-item-before-jump-next` 并在后面 push `jump-next`
    left !== 1         ⇒ unshift 页码 1
    right !== allPages ⇒ push 页码 allPages
```

⚠️ 三条最容易写错的：
1. `current !== 1 + 2` / `current !== allPages - 2` 这两个**魔数判据**（跳页项在离端点 3 页时消失）；
2. `!showLessItems` 时的 `left += 1` / `right -= 1`（**挤位**：有跳页项时少显示一个页码）；
3. 跳页项的 `jumpPrevPage = max(1, current - (showLessItems ? 3 : 5))`（**不是** ±pageBufferSize）。

### 4.1 跳页与相邻页的点击目标

| 元素 | 目标页 | 备注 |
|---|---|---|
| `prev` | `current - 1 > 0 ? current - 1 : 0` | `0` 只在不可用时出现（配合 `disabled`） |
| `next` | `current + 1 < allPages ? current + 1 : allPages` | |
| `jump-prev` / `jump-next` | `current ∓ 5`（`showLessItems` 时 ∓3），各自钳到 `[1, allPages]` | |

---

## 5. DOM 与类名（`Pagination.js` + `Pager.js` + `Options.js`）

```
ul.{p}[-start|-center|-end][-simple][-disabled]        ← 根；antd 壳再加 -{size} / -{align} / -rtl / -mini / -bordered / -{variant}
├─ li.{p}-total-text                                   （showTotal 时）
├─ li.{p}-prev[-disabled]  > {prevIcon}                ← `tabIndex` 不可用时为 **null**（不聚焦）
├─ li.{p}-jump-prev[-custom-icon] > {jumpPrevIcon}
├─ li.{p}-item.{p}-item-{n}[-active][-disabled][-after-jump-prev|-before-jump-next] > a[rel=nofollow]{n}
├─ li.{p}-jump-next[-custom-icon] > {jumpNextIcon}
├─ li.{p}-next[-disabled]  > {nextIcon}
├─ li.{p}-simple-pager > input[aria-label=jump_to] | {值} + span.{p}-slash + {allPages}
└─ li.{p}-options
   ├─ {sizeChangerRender 的输出}（类名 `{p}-options-size-changer`）
   └─ div.{p}-options-quick-jumper > "跳至" input[aria-label=page] "页" [button.{p}-options-quick-jumper-button]
```
- `prev`/`next` 的**图标是 `<button type=button tabIndex=-1>`**（antd 侧给的 `prevIcon`），
  外层的 `li` 才是点击与键盘的目标（`tabIndex` 可用时 0）；
- `jump-prev`/`jump-next` 的图标是 `a.{p}-item-link > div.{p}-item-container > svg.{p}-item-link-icon + span.{p}-item-ellipsis`；
- 简化模式的根还有 `{p}-simple`，且「上一页/下一页」的 `tabIndex` 判据是 `nextTabIndex = hasPrev ? 0 : null`（**用 hasPrev 而不是 hasNext**，上游如此）。

---

## 6. locale（12 键，zh_CN 逐字）

```
items_per_page '条/页'   jump_to '跳至'   jump_to_confirm '确定'   page '页'
prev_page '上一页'  next_page '下一页'
prev_5 '向前 5 页'  next_5 '向后 5 页'  prev_3 '向前 3 页'  next_3 '向后 3 页'
page_size '页码'
```
- 合并顺序：`rc 的 enUS` → `ConfigProvider.locale.Pagination` → `props.locale`（props 最优先）；
- antd 的 `zh_CN` **直接复用 rc 的 zh_CN**（`components/locale/zh_CN.ts` 里就是 `import Pagination from '@rc-component/pagination/locale/zh_CN'`）
  ⇒ 本仓的 locale 包只需在 `Pagination` 键下放这 12 个文案（**逐字一致**）。

---

## 7. Component Token（12 个，`prepareComponentToken` 逐字）

| token | 派生 |
|---|---|
| `itemBg` / `itemActiveBg` / `itemLinkBg` / `itemInputBg` | `colorBgContainer` |
| `itemSize` / `itemSizeSM` / `itemSizeLG` | `controlHeight` / `controlHeightSM` / `controlHeightLG` |
| `itemActiveColor` / `itemActiveColorHover` | `colorPrimary` / `colorPrimaryHover` |
| `itemActiveColorDisabled` | `colorTextDisabled` |
| `itemActiveBgDisabled` | `controlItemBgActiveDisabled` |
| `miniOptionsSizeChangerTop` | `0` |

⚠️ 另有 `initComponentToken(token)`（来自 `input/style`）展开的**输入框族** token ——
与 `input` / `input-number` 共用（本仓应复用 `input/style/token.ts` 的同名实现，勿重造）。
⚠️ `prepareToken` 里还有一批**派生 token**（`quickJumperInputWidth` =
`controlHeightLG × 1.25`、`paginationItemPaddingInline` = `marginXXS × 1.5`、
`paginationEllipsisTextIndent` = `'0.13em'` 魔法值 …）—— 走「internal token」而非公开 Component Token。

---

## 8. Vue 化决策（按 COMPATIBILITY.md 映射）

| React | Vue | 分类 |
|---|---|---|
| `current` + `onChange` | `v-model:current`（C11：`update:current` 与 `change` 同发） | INTENDED |
| `pageSize` + `onShowSizeChange` | `v-model:pageSize` + `showSizeChange` | INTENDED |
| `itemRender` / `showTotal` | **scoped slot** `#itemRender` / `#total`（插槽参数对齐 rc 的实参） | INTENDED（C8） |
| `components.sizeChanger` | `#sizeChanger` slot（槽参数 `{value, onChange, disabled, className, options, 'aria-label'}`） | INTENDED |
| `showQuickJumper.goButton`（ReactNode） | `VNodeChild` | PLATFORM |
| `role`（`AriaRole`） | `string` | PLATFORM |
| `selectComponentClass` | **不实现**（antd 标注「非官方 API + v7 移除」） | UPSTREAM（登记不跟随） |
| `classNames/styles` 的 items 语义 | 同上游（2 槽） | 同上游 |

⚠️ `simple` 的 readOnly 输入框用的是**非受控 input**（`onChange` 也接 `handleKeyUp`）——
Vue 侧要保留「输入即受控于内部 state」的语义，别换成 `v-model` 直接改 prop。

---

## 9. 风险预登记（G4 动手前逐条核实）

| # | 风险 | 处置 |
|---|---|---|
| R1 | 页码列表算法有 **6 处边界判据**（§4 的三个易错点） | G4 逐行移植并在 L1 用「页数 × 当前页」的**判定表**覆盖（镜像 antd 的 `index.test.tsx` 用例） |
| R2 | 依赖 `select`（尺寸切换器）与 `input` 族 token | 复用已收口的 `select`；输入框族 token 复用 `input/style/token.ts` |
| R3 | `responsive` 依赖 `useBreakpoint` | 复用 `grid/hooks/useBreakpoint`；L2 断言「xs ⇒ small」 |
| R4 | `useVariant('input')` 与 form 的 variant 体系耦合 | 复用 `form/hooks/useVariants`；只落类名，不引表单逻辑 |
| R5 | locale 12 键要在 `@apollo-design/locale` 的 Pagination 键下逐字对齐 | G3 落地时对拍 rc 的 zh_CN/en_US |
| R6 | `wireframe` 模式（`-bordered`）是**独立样式文件**（`style/bordered.js` 87 行） | G4 单独移植，并接 `token.wireframe` 的判据 |
| R7 | `getPopupContainer: triggerNode => triggerNode.parentNode`（尺寸切换器的 Select） | 与 select 的默认策略不同 ⇒ 在 sizeChangerRender 里显式传，L4 断言 DOM 位置 |
| R8 | 与 `table` 的 `PaginationConfig`（`position`）耦合 | 本仓只导出类型，**不实现**容器逻辑（table 未落地，登记缺口） |

---

## 10. 不做什么（明确边界）

- 不实现 `selectComponentClass`（上游非官方 API，v7 移除）；
- 不实现 `mini` 的**新**逻辑：`{p}-mini` 只是「xs + responsive」的兼容类名（v7 移除），
  照上游落类名即可；
- 不把 `position`（`PaginationConfig`）实现成分页自身的布局能力 —— 它属于容器（table 等）；
- 不引 `@rc-component/*`（H5）、不引 cssinjs（H6）、不搬实现（H2）。
