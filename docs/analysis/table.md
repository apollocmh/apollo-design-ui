# Table · G1 分析产物

> 兼容目标 **antd 6.6.4**。参考实现两条：
> ① antd 层 `/tmp/antd-repo/ant-design-master/components/table/`（5918 行 / 40 文件）
> ② 引擎 `@rc-component/table@1.11.1`（本机 `node_modules/.pnpm/@rc-component+table@1.11.1_.../es/`，**49 个 js / 3512 行**）
>
> 本文件的事实来源是**两份逐行侦察报告**（覆盖上表全部文件）+ 我对高风险结论的**逐条复核**。
> 凡标 `(待验)` 的，是侦察报告里推断而我没复核的。

---

## 0. 结论摘要（六句话）

1. **Table 是全库唯一必须分片交付的组件**：参考实现合计 **~9400 行 / 80 文件 / 31 token**，
   是第二名（date-picker + picker）的 2 倍以上。G4 必须切成 **6 个可独立验收的片**（见 §7）。
2. **引擎裁决**：`@rc-component/table` = `in-ui` ⇒ `packages/ui/src/table/engine/`
   （`registry/dependencies.json` 的 `rcReplacements`）。
3. ✅ **两处大额复用**：treeData 的勾选级联直接用本仓 `tree/utils` 的
   `convertDataToEntities` / `conductCheck` / `isCheckDisabled`（`@rc-component/tree` 在本仓已落地且**已导出**）；
   颜色合成用 `_internal/color-composite.ts` 的 `onBackground()`（替代 antd 的 `FastColor.onBackground`）。
4. 🚨 **三个必须先做的前置改造**（否则 Table 的公开 API 无法表达）：
   ① `_internal/use-merge-semantic.ts` 补 **`schema`（嵌套语义槽）**——`docs/KNOWN-ISSUES.md` §1.7 **早就预言了这一刻**；
   ② `packages/virtual-list` 的契约缺口（`styles` / `extraRender` / 渲染函数 child / `component` 收组件）；
   ③ 自研的「单元格级 Context 切片」机制（`@rc-component/context` 的选择器订阅在 Vue 里没有对应物）。
5. 🚨 **最危险的不是算法而是「受控判据」**：全组件密集依赖 `'x' in column` / `!== undefined` / `=== undefined`
   （不是真值判断）。Vue 里若顺手改成真值判断，`null`（取消排序）/ `false`（关 tooltip）会被吞 ⇒ 受控/非受控行为错乱。
6. **Table 的「一个组件」实际是 8 个子系统**：列归一 / 选择 / 排序 / 过滤 / 展开 / 固定列与表头 /
   分页 / 虚拟滚动。其中**固定列 + 虚拟滚动 + rowSpan** 三者叠加是上游补丁最密的地方（`BodyGrid.extraRender` 有中文注释的边界钳制）。

---

## 1. 组件面

### 1.1 上游文件 → 本仓

| 上游（antd 层） | 行 | 本仓 | 说明 |
|---|---|---|---|
| `Table.tsx` | 52 | `table/Table.ts` | 壳：`_renderTimes` 计数 + 8 个静态成员 |
| `InternalTable.tsx` | 797 | `table/InternalTable.ts` | 组装 4 个 hook + 语义槽 + 分页/空态/Spin |
| `interface.ts` | 300 | `table/interface.ts` | 全部对外类型 |
| `hooks/useSelection.tsx` | 775 | `table/hooks/use-selection.ts` | 选择状态机（含 tree 联动） |
| `hooks/useSorter.tsx` | 542 | `table/hooks/use-sorter.ts` | 排序状态机 |
| `hooks/useFilter/index.tsx` | 352 | `table/hooks/use-filter/index.ts` | 过滤状态机 |
| `hooks/useFilter/FilterDropdown.tsx` | 607 | `table/hooks/use-filter/FilterDropdown.ts` | 过滤 UI（menu / tree 两模式） |
| `hooks/useFilter/FilterSearch.tsx` | 38 | 同目录 | 过滤搜索框 |
| `hooks/useFilter/FilterWrapper.tsx` | 34 | 同目录 | 阻止冒泡的包装 |
| `hooks/usePagination.ts` | 88 | `table/hooks/use-pagination.ts` | 分页与 dataSource 的交互 |
| `hooks/useLazyKVMap.ts` | 57 | 同目录 | `key → record` 惰性 Map |
| `hooks/useFilledColumns.ts` | 49 | 同目录 | `column` 默认配置填充 |
| `hooks/useTitleColumns.ts` | 38 | 同目录 | title 渲染（分组递归） |
| `hooks/useColumnTitleProps.ts` | 30 | 同目录 | sorter/filter 的 title props 合并 |
| `hooks/useSpinProps.ts` / `useContainerWidth.ts` | 19 / 19 | 同目录 | `loading` 归一 / 容器宽 |
| `util.ts` | 72 | `table/util.ts` | 6 个纯函数 |
| `ExpandIcon.tsx` | 38 | `table/ExpandIcon.ts` | 默认展开图标 |
| `Column.ts` / `ColumnGroup.ts` | 13 / 19 | 同目录 | 语法糖（渲染 `null`） |
| `TableMeasureRowContext.ts` | 5 | `table/context.ts` | 测量行标记 |
| `style/*.ts`（16 文件） | 1586 | `table/style/*.ts` | 见 §3 |

| 上游（rc-table 引擎，49 个 js / 3512 行） | 本仓 |
|---|---|
| `Table.js`(692) / `Body/*`(4) / `Cell/*`(3) / `Header/*`(2) / `Footer/*`(4) / `ColGroup` / `FixedHolder`(173) / `stickyScrollBar`(178) / `VirtualTable/*`(4) / `hooks/*`(13) / `utils/*`(5) / `sugar/*` / `context/*` / `Panel` | `table/engine/**`（**逐文件同构**，路径一一对应） |

### 1.2 依赖面核查（照 skill 的对照表逐项查过）

| antd / rc 用的 | 本仓对应物 | 结论 |
|---|---|---|
| `@rc-component/table` | 无 | **自建** → `table/engine/`（in-ui） |
| `@rc-component/tree` 的 `convertDataToEntities` / `conductCheck` / `isCheckDisabled` | `packages/ui/src/tree/utils/{treeUtil,conductUtil}.ts`，经 `tree/index.ts` 的 `export * from './utils'` **已导出** | ✅ **直接复用**（省掉最易错的一块） |
| `@rc-component/virtual-list` | `packages/virtual-list`（`@apollo-design/virtual-list`） | ⚠️ **契约有 4 处缺口**，见 §4.2 |
| `@rc-component/context` 的 `createContext` + **选择器订阅** | 无对应物 | 🚨 需自研切片机制，见 §4.3 |
| `@rc-component/util` 的 `useMemo(fn, cond, cmp)`（**第三参是比较器**） | 无对应物 | 🚨 见 §4.4 |
| `@rc-component/util` 的 `useLayoutState` / `useTimeoutLock` | 无 | 自建（`useFrame` 的等价物） |
| `@rc-component/util` 的 `getScrollBarSize` / `raf` / `toArray` / `isEqual` / `warning` | `@apollo-design/utils` | ✅ |
| `_util/statusUtils` / `useBreakpoint` | `space/statusUtils` / `ui/src/grid/hooks/` | ✅ |
| `pagination` / `spin` / `checkbox` / `radio` / `dropdown` / `tooltip` / `empty` | 均已 `completed` | ✅ |
| `locale`（`Table` 命名空间） | `@apollo-design/locale` | ✅ |
| `FastColor.onBackground(bg).toHexString()` | `_internal/color-composite.ts` 的 `onBackground(fg, bg)` | ✅ 复用（color-picker 先例） |
| `genStyleHooks` / `mergeToken` | `genTableStyle` + `COMPONENT_STYLES` 一行 | ✅ |
| `useCSSVarCls` / `genCssVar` | 直接拼 `${prefixCls}-css-var` / 手写 `--{p}-table-*` | ✅ rate/splitter 先例 |

### 1.3 🚨 三个必须先做的前置改造

| # | 改造 | 为什么 Table 卡在它上面 | 判据 |
|---|---|---|---|
| P1 | `_internal/use-merge-semantic.ts` 补 **`schema`** | antd 的 `TableSemanticType` **是嵌套的**：`{ root, section, title, footer, **body:{wrapper,cell,row}**, content, **header:{wrapper,cell,row}**, pagination: PaginationSemanticType['classNames'] }`（实测 `InternalTable.tsx` 的类型段）。本仓 `useMergeSemantic` 只做平铺 | `docs/KNOWN-ISSUES.md` **§1.7 原文**：「下一个有『真·嵌套语义槽』的组件（如 **Table 的 `header.cell`**）会需要它」 |
| P2 | `packages/virtual-list` 补 4 个契约点 | rc-table 传 `styles={{horizontalScrollBar}}`（本仓无此 prop）· `extraRender` prop（本仓是 `#extra` slot）· 渲染函数 child（本仓是 default slot）· `component` 收**组件**（本仓只收 `String`） | `virtual-list.ts` 的 props 段 + `BodyGrid.js:223-256` 的调用点 |
| P3 | 「单元格级 Context 切片」机制 | `Cell` / `useHoverState` 用 `@rc-component/context` 的 **selector 订阅**（只订阅自己关心的切片 + 自带比较）。Vue 的 `inject` 是整体响应 ⇒ 照搬会全表重渲或漏更新 | `Cell/index.js:82-96`、`Cell/useHoverState.js` |

> ⚠️ P1/P2/P3 都**不是**「顺手做」的量级：P1 是 foundation 级改动（会影响全部用语义槽的组件），
> P2 是另一个包（`@apollo-design/virtual-list`）的公开面，P3 是 Table 自己的架构选择。
> ⇒ **Table 的第 1 片就应该是「P1 + P3 的 PoC」**，而不是先写组件。

---

## 2. 行为契约

### 2.1 引擎的 state（`Table.js`）

| 名字 | 初值 | 语义 |
|---|---|---|
| `componentWidth` | `0` | 容器实测宽（ResizeObserver），喂给 `useColumns` / Context |
| `shadowStart` / `shadowEnd` | `false` | 横向滚到两端的阴影显隐 |
| `colsWidths` | `new Map()` | 列 key → 实测列宽 |
| `scrollInfo` | `[0,0]` | `[absScrollLeft, scrollWidth-clientWidth]` |
| `scrollbarSize` | `0` | 滚动条宽 |
| `mounted` | `useRef(false)` | 跳过首次 `triggerOnScroll` |

子 hook 内部 state：`useHover` 的 `startRow/endRow`、`useExpand` 的 `innerExpandedKeys`、`useTimeoutLock` 的 `frameRef`。

### 2.2 🚨 受控 / 非受控判据（**全组件最密集的隐式契约**）

引擎侧**没有统一约定**，混用三种：

| 字段 | 判据 | 位置 |
|---|---|---|
| `data` | 真值 `data \|\| EMPTY_DATA` | `Table.js:106` |
| `scroll.x` | `??`（`flattenScrollX ?? scrollX`） | `Table.js:158` |
| `scroll.y` | `validateValue()` = `!== null && !== undefined` | `Table.js:221` |
| `expandable.expandedRowKeys` | **真值** `\|\|`（空数组是 truthy，恰好没踩坑） | `useExpand:48` |
| `showHeader` | **唯一**显式 `!== false` | `Table.js:532,566` |
| `caption` | `!== null && !== undefined` | `Table.js:470` |
| `forceRender` | `?? false` | `Table.js:641` |
| `expandable` 是否配置 | **`'expandable' in props`**（传 `undefined` 也算配置了） | `legacyUtil:9` |

antd 层侧（**必须照抄，不能改成真值**）：

| 字段 | 判据 | 位置 |
|---|---|---|
| 列 `sortOrder` | `'sortOrder' in column` | `useSorter.tsx:98` |
| 列 `filteredValue` | `'filteredValue' in column` | `useFilter/index.tsx:39` |
| `showSorterTooltip` | `=== undefined` 才回退全局（故 `false` 有效） | `useSorter.tsx:132-135` |
| `locale.emptyText` | `typeof … !== 'undefined'` | `InternalTable.tsx:712` |

### 2.3 四个 hook 的行为契约

**`useSelection`（775 行）** —— 返回 `[transformColumns, derivedSelectedKeySet]`。
- 受控：`useControlledState(defaultSelectedRowKeys \|\| [], selectedRowKeys)`；`rowSelection` 从有变无时 effect 重置（依赖收窄成 `[!!rowSelection]`）。
- `checkStrictly` **默认 `true`**（注意：与 Tree 组件的默认相反）。
- `setSelectedKeys(keys, method)`：非 `preserve` 时**过滤掉 dataSource 里不存在的 key**，然后 `onChange(availableKeys, records, {type})`；`method ∈ all|none|invert|single|multiple`。
- 全选只在**未 disabled** 的 key 上操作；表头 checkbox 三态 + 「全 disabled」单独分支。
- `selections` 菜单：`SELECTION_ALL` 用**全量 data**，`SELECTION_INVERT` 用**当前页**，`SELECTION_NONE` **保留 disabled 且已选中的 key**。
- tree 联动（`checkStrictly=false`）：`convertDataToEntities` + `conductCheck`；**点选时先「加入再校验」，取消时二次 `conductCheck` 修正**（不是简单集合运算）。
- shift 多选：仅 `shiftKey && checkStrictly && type==='checkbox'`。
- `getCheckboxProps` 建 `checkboxPropsMap`；**含 `checked`/`defaultChecked` 会告警**。
- 列注入：无 `rowSelection` 时移除 `SELECTION_COLUMN` 并告警；插入位置**恒在 expand 列之后**；`fixed` 未指定时**继承相邻列**。

**`useSorter`（542 行）** —— 返回 `[transformColumns, mergedSorterStates, columnTitleSorterProps, getSorters]`。
- `sorter` 三形态：`boolean | CompareFn | {compare, multiple}`。
- `sortDirections` 列级优先；`nextSortDirection` 在数组内循环，**越界返回 `undefined` = 取消排序**。
- `defaultSortOrder` **只在初始化**生效（`collectSortStates(..., true)`）。
- `multiple`：`multiplePriority===false` 或已有状态非多列时**替换**为单元素。
- `showSorterTooltip` 列级 `=== undefined` 才回退；`target:'sorter-icon'` 只包图标。
- `getSortData` 拷贝后**稳定**排序，逐列比较，递归子行。
- a11y：`onHeaderCell` 注入 `aria-sort` / `aria-description` / `aria-label` + `tabIndex=0` + 回车触发。

**`useFilter`（352）+ `FilterDropdown`（607）** —— 返回 `[transformColumns, mergedFilterStates, filters]`。
- 收集条件：有 `filters || filterDropdown || onFilter`。
- 受控检测是**全有/全无**（有一列没给 `filteredValue` 就整体非受控），混用只 warn。
- 🚨 **无自定义 `filterDropdown` 时把 `filteredValue` 全部 `String()` 化**（自定义时保留原类型）——易踩的隐式转换。
- `filterMode`：`'menu'`（默认）/`'tree'`；`filterSearch` 默认 `false`。
- `filterOnClose` 默认 **true**（点外部关闭即自动应用）。
- 受控开合：`open ?? filterDropdownOpen ?? visible`；`onDropdownOpenChange` **只响应 `info.source==='trigger'`**。
- 测量行里降级成静态 trigger（不实例化 Dropdown）。

**`usePagination`（88）** —— `pagination=false` ⇒ `[{}, noop]`，不切片、不渲染、`changeEventInfo.pagination={}`。
- `total = pagination.total>0 ? pagination.total : data.length`；页码越界**直接 mutate** `mergedPagination.current`（Vue 要避免改派生对象）。
- 默认 `pageSize=10`。

### 2.4 列归一流水线（引擎侧 `useColumns`）

```
columns || convertChildrenToColumns(children) || []
  → filterHiddenColumns（递归剔除 hidden）
  → 插 EXPAND_COLUMN（默认 index 0；expandable.fixed==='right'||'end' 时插末尾）
      + 对 index < expandedRowOffset 的列强制 fixed='start'
  → transformColumns（antd 注入：sorter → filter → selection → title，**顺序不可换**）
  → flatColumns（展平；**fixed 在此归一**：true/'left'→'start'、'right'→'end'，子列继承父）
  → useWidthColumns（填宽 + 按 clientWidth 缩放）
```

antd 层的四层嵌套：`transformTitleColumns(transformSelectionColumns(transformFilterColumns(transformSorterColumns(inner))))`
（`InternalTable.tsx:633-639`）—— **title 必须最后、selection 要能看到 filter/sorter 的结果**。

### 2.5 DOM 骨架（引擎）

```
div.${p}
├─ div.${p}-title                       （title 存在时）
├─ div.${p}-container
│  ├─ [fixHeader || isSticky]
│  │   ├─ div.${p}-header  (FixedHolder) → div → table → colgroup + thead
│  │   ├─ div.${p}-body    (onScroll)    → table → colgroup + tbody
│  │   ├─ div.${p}-summary (FixedHolder)
│  │   └─ div.${p}-sticky-scroll > div.${p}-sticky-scroll-bar
│  └─ [否则] div.${p}-content → table → caption + colgroup + thead + tbody + tfoot
└─ div.${p}-footer                      （footer 存在时）
```

根类名：`-rtl` / `-fix-start-shadow(-show)` / `-fix-end-shadow(-show)` / `-layout-fixed` /
`-fixed-header` / `-fixed-column` / `-scroll-horizontal` / `-has-fix-start` / `-has-fix-end`。
antd 追加：`-wrapper` / `-wrapper-rtl` / `-medium` / `-small` / `-bordered` / `-empty` /
`-no-header` / `-pagination` / `-pagination-{start|end|center}`；行级 `-row-selected`。

### 2.6 静态成员（8 个）

| 成员 | 值 / 类型 | 用途 |
|---|---|---|
| `Table.SELECTION_COLUMN` | `{}` 哨兵 | 放进 `columns` 决定选择列位置 |
| `Table.EXPAND_COLUMN` | rc 常量哨兵 | 决定展开图标列位置 |
| `Table.SELECTION_ALL` / `_INVERT` / `_NONE` | `'SELECT_ALL'` / `'SELECT_INVERT'` / `'SELECT_NONE'` | 放进 `rowSelection.selections` |
| `Table.Column` / `Table.ColumnGroup` | 语法糖（渲染 `null`） | 声明式列 |
| `Table.Summary` | rc 的 `Summary`（挂 `.Row` / `.Cell`） | 汇总行 |

### 2.7 ✅ 复核结论：`Summary.Cell` **没有** `fixed` 字段

实测 `@rc-component/table@1.11.1` 的 `es/Footer/Cell.d.ts`：
```ts
export interface SummaryCellProps { className?, index: number, colSpan?, rowSpan?, align? }
```
`fixed` **只存在于外层 `Summary`**（`Summary.d.ts`：`fixed?: boolean | 'top' | 'bottom'`）。
⚠️ antd 官网文档写了 `Summary.Cell.fixed` —— **文档滞后于 rc 版本**，以 rc 的 `.d.ts` 为准。

### 2.8 `locale` 的实际消费面

**被用到**：`filterConfirm` / `filterReset` / `filterEmptyText` / `filterCheckAll`（+ deprecated `filterCheckall`）/
`filterSearchPlaceholder` / `emptyText`（走 **props.locale** 而非 tableLocale）/ `selectInvert` / `selectNone` /
`selectionAll` / `expand` / `collapse` / `triggerDesc` / `triggerAsc` / `cancelSort`。
**只在类型里、源码未用**：`filterTitle` / `sortTitle` / `selectAll`。

---

## 3. 样式契约

### 3.1 Component Token（**31 个**）

`prepareComponentToken` 的产物（`style/index.ts`）：`headerBg` / `headerColor` / `headerSortActiveBg` /
`headerSortHoverBg` / `bodySortBg` / `rowHoverBg` / `rowSelectedBg` / `rowSelectedHoverBg` / `rowExpandedBg` /
`cellPaddingBlock` / `cellPaddingInline` / `cellPaddingBlockMD` / `cellPaddingInlineMD` / `cellPaddingBlockSM` /
`cellPaddingInlineSM` / `borderColor` / `headerBorderRadius` / `footerBg` / `footerColor` / `cellFontSize` /
`cellFontSizeMD` / `cellFontSizeSM` / `headerSplitColor` / `fixedHeaderSortActiveBg` / `headerFilterHoverBg` /
`filterDropdownMenuBg` / `filterDropdownBg` / `expandIconBg` / `selectionColumnWidth` / `stickyScrollBarBg` /
`stickyScrollBarBorderRadius`（+ 派生 `expandIconMarginTop` / `headerIconColor`…）。

⚠️ **颜色合成**：antd 用 `new FastColor(x).onBackground(colorBgContainer).toHexString()`
（`colorFillSecondarySolid` / `colorFillContentSolid` / `colorFillAlterSolid`）⇒ 本仓用
`_internal/color-composite.ts` 的 `onBackground(fg, bg).toHexString()`（**已核实该函数存在**）。
⚠️ `headerIconColor` 用 `FastColor.setA(a * opacityLoading)` ⇒ 需要 `Color` 的 **`setA`**（`utils.Color` 已 public，KNOWN-ISSUES §2.5 已关闭）。

### 3.2 样式文件（16 个 / 1586 行）

`index`(612) · `filter`(181) · `bordered`(175) · `expand`(148) · `selection`(119) · `sorter`(110) ·
`fixed`(95) · `virtual`(93) · `radius`(80) · `size`(74) · `sticky`(65) · `rtl`(54) · `pagination`(40) ·
`ellipsis`(36) · `summary` · `empty`。

### 3.2.1 ✅ **已实测**（2026-10-03，T0.3）

**复现命令**：\`node tests/visual/debug/extract-table-css.mjs [--tokens]\`
（SSR + \`extractStyle\`，渲染 16 种形态：默认 / middle / small / bordered / 空态 / 选择 /
展开 / 汇总 / 分页 / 固定表头+固定列+sticky / virtual / 排序激活 / 过滤激活 / loading /
无表头 / 全 ellipsis / RTL）

| 指标 | 实测值 |
|---|---|
| 与 \`ant-table\` 相关的规则 | **200 条**（唯一选择器 **194**） |
| Component Token 声明条数 | **37 条** |

🚨 **registry 的 \`tokenCount = 31\` 与实际的 37 条不一致** —— 31 是
\`prepareComponentToken\` **字面写出的键数**，而真正发到 CSS 里的还包含它内部算出的派生值
（\`expandIconHalfInner\` / \`expandIconSize\` / \`expandIconScale\` /
\`headerIconColor\` / \`headerIconHoverColor\`）。
⇒ **T1 写 \`style/token.ts\` 时以这 37 条为准**，registry 的数字只当交叉参考
（同族先例：mentions 的 3 vs 实际 22）。

**实测到的 37 条**（逐条抄自产物，T1 直接对拍）：
\`header-bg\` \`header-color\` \`header-sort-active-bg\` \`header-sort-hover-bg\`
\`body-sort-bg\` \`row-hover-bg\` \`row-selected-bg\` \`row-selected-hover-bg\`
\`row-expanded-bg\` \`cell-padding-block\` \`cell-padding-inline\` \`cell-padding-block-md\`
\`cell-padding-inline-md\` \`cell-padding-block-sm\` \`cell-padding-inline-sm\`
\`border-color\` \`header-border-radius\` \`footer-bg\` \`footer-color\`
\`cell-font-size\` \`cell-font-size-md\` \`cell-font-size-sm\` \`header-split-color\`
\`fixed-header-sort-active-bg\` \`header-filter-hover-bg\` \`filter-dropdown-menu-bg\`
\`filter-dropdown-bg\` \`expand-icon-bg\` \`selection-column-width\`
\`sticky-scroll-bar-bg\` \`sticky-scroll-bar-border-radius\` \`expand-icon-margin-top\`
\`header-icon-color\` \`header-icon-hover-color\` \`expand-icon-half-inner\`
\`expand-icon-size\` \`expand-icon-scale\`

⚠️ 两处**不是纯别名**、要构建期算：
\`--ant-table-expand-icon-margin-top:2.5px\`（算式：\`(fontSize*lineHeight - lineWidth*3)/2 - ceil((fontSizeSM*1.4 - lineWidth*3)/2)\`）
与 \`--ant-table-header-icon-color:rgba(0,0,0,0.29250000000000004)\`（\`colorIcon\` 的 alpha **乘以 \`opacityLoading\`**，
本仓要用 \`utils.Color\` 的 \`setA\` —— 那正是 \`KNOWN-ISSUES §2.5\` 把 \`Color\` 改 public 的原因）。

### 3.3 抽取方式

用 `tests/visual/debug/extract-<c>-css.mjs` 的模式（SSR + `extractStyle`）：
把 8 个子系统的形态都渲染一遍（bordered / size / selection / sorter / filter / expand / fixed / sticky /
virtual / summary / empty / ellipsis / rtl），再按括号配平拆块 ⇒ 机械搬运 + 参数化（`__P__` 占位符）。
⚠️ **两条已登记的坑必须遵守**：① 组件 token 声明块要覆盖 **Portal 出去的浮层**
（过滤下拉 `div.${p}-table-filter-dropdown` 不在 `.${p}-table` 子树里 ⇒ 需要
`.${p}-table-css-var{…}` 那一份，见 PITFALLS 342）；② `calc()` 括号配平（PITFALLS 19）。

---

## 4. Vue 对应（平台差异与关键设计）

### 4.1 React 强依赖清单（12 条）

| # | React | Vue 里要注意什么 |
|---|---|---|
| 1 | `useMemo/useCallback` 依赖数组 | `computed` 的依赖追踪语义不同；`deps.join('_')` 的字符串依赖 trick（`Table.js:219`、`FixedHolder:21`）要显式化 |
| 2 | `useMemo(fn, cond, cmp)`（**第三参是比较器**，rc-util 自定义） | 这是「带比较器的缓存」，`computed` 表达不了 ⇒ `shallowRef` + 手写 `isEqual`（`useFixedInfo.js:6`、`useCellRender.js:15`） |
| 3 | `useControlledState` | 手写 `!== undefined` 判定 + 内部 ref |
| 4 | `useSyncState`（ref + forceUpdate） | `shallowRef` + `triggerRef` |
| 5 | `useRef` 可变缓存（`preserveRecordsRef` / `mapCacheRef` / `renderTimesRef`） | 闭包变量 / `shallowRef` |
| 6 | `forwardRef` + `useImperativeHandle` + **Proxy 混入 DOM** | `expose`；`nativeElement` 语义要对齐（holder vs 外层容器），否则 antd 层的 `scrollTo` 失效 |
| 7 | `createContext` + **selector 订阅** | 🚨 无对应物 ⇒ 见 §4.3 |
| 8 | `React.Children` / `convertChildrenToColumns` | 引擎用 `toArray`（不是 `React.Children`）⇒ Vue 用 `slots`；`<Table.Column>` 形态要能用 slot 表达 |
| 9 | `cloneElement`（`MeasureRow.js:38` 克隆 title 挂 `ref:null`） | `cloneVNode`（本仓 virtual-list 已有先例） |
| 10 | `useLayoutEffect` | `onMounted` + `nextTick`；注意 SSR 无布局时机 |
| 11 | **渲染期副作用** `renderTimesRef.current += 1`（`Table.tsx:23`） | 移到渲染前后钩子 |
| 12 | `genTable(shouldTableUpdate)`（`RcTable/index.tsx:9-13`） | Vue 没有「父渲染即强制子更新」⇒ 必须**显式 props 白名单 + 主动触发子更新**，否则会出现「父重渲染但表体不刷新」的幽灵 bug |

### 4.2 `@apollo-design/virtual-list` 的 4 处契约缺口

| rc-table 用法 | 本仓现状 | 处理 |
|---|---|---|
| `styles={{horizontalScrollBar}}` | 无 `styles` prop | 丢弃（本仓用原生滚动，无自绘滚动条） |
| `extraRender={fn}` prop | 是 `#extra` slot | 映射为 slot（`BodyGrid.extraRender` 的 rowSpan 补行逻辑要跟着改写法） |
| 渲染函数式 child | 是 default slot（载荷 `{item,index,style,offsetX}`） | 改 slot 写法 |
| `component` 传**组件** | `component` 只收 `String` | 要么扩类型，要么用 `v-bind`/`h` 包一层 |

⚠️ 本仓 virtual-list **已把「自绘滚动条 + marginLeft 模拟横向」改成原生滚动**（`virtual-list.ts:6-16`）
⇒ 横向定位模型与 rc 不同，`VirtualCell` 的 flex/负 margin 定位**不能照搬**。

### 4.3 🚨 Context 切片（本组件最大的架构决策）

rc-table 用 `@rc-component/context` 的 **selector 订阅**：`Cell` / `useHoverState` 只订阅自己关心的切片
（`useContext(TableContext, selector)`），自带浅比较 ⇒ **只有真正变化的单元格重渲**。
Vue 的 `inject` 是整体响应 ⇒ 直接照搬会「全表重渲」或「漏更新」。

**候选方案**（G4 第 1 片必须定案，写进 README）：

| 方案 | 做法 | 代价 |
|---|---|---|
| A. 拆 key | 把大 Context 拆成 N 个 `provide`（`scroll` / `row` / `hover` / `column` / `measure`…），每个是独立 `shallowRef` | 改动小；但 `hover` 仍会让所有行重渲（除非行级再拆） |
| B. 行级 provide | 每行 provide 自己的 `rowInfo`，单元格 inject 行级 key | 粒度最接近上游；provide 数量 = 行数 × 列数？不行 ⇒ 行级即可 |
| C. 外部 store + `shallowRef` | 自建 `reactive` 之外的轻量 store，用 `markRaw` + 手动 `triggerRef` | 最接近上游的「比较后更新」，但需要自研 |

### 4.3.1 ✅ **已定案**（2026-10-03，**实测**）：候选 B「行级 provide」

**复现命令**：\`node tests/visual/debug/poc-table-context.mjs\`（100 行 × 5 单元格，jsdom + Vue）

| 变体 | \`hoverRow\` 从 -1 改成 3 | **无关字段**（\`scrollLeft\`）变化 |
|---|---|---|
| 单一 \`reactive\` context，\`Cell\` 直接读 \`ctx.hoverRow\` | **500 / 500（全表重渲）** | **0** |
| 行级 \`provide\` 一个 \`computed(() => ctx.hoverRow === index)\` | **5 / 500（只有命中行的 5 个 cell）** | **0** |

**两条结论**：

1. 🚨 **推翻了我原来的假设**：Vue 的 \`reactive\` 本来就是**属性级**追踪 ⇒「无关字段变化」**不会**重渲
   （上表第三列两行都是 0）。所以问题不是「inject 太粗」，而是
   **「\`Cell\` 直接读了一个每次 hover 都会变的表级字段」**。
2. ✅ **决策 = 行级 provide**（候选 B）：每行 \`provide\` 一个 \`computed\`，
   把「本行是否命中」变成**行级依赖** ⇒ 与上游 selector 订阅**同样粒度**（5 vs 500，**100×**），
   而且**不需要自研 store**（候选 C 被否）。每行多一个 \`provide\` 是唯一代价。

**由此得到一条 T1 必须遵守的硬规则**（写进 T1 的 README）：

> **\`Cell\` 只能 \`inject\` 行级 \`computed\`，不能直接 \`inject\` 表级 \`reactive\` 对象。**
> 凡是「每个单元格都读、但只有少数行会变」的字段（hover 区间、rowSpan 补行、展开态…），
> 一律走行级 computed。反之，**每个单元格都读、且变化时本来就该全表重渲**的字段
> （列定义、\`prefixCls\`、\`ellipsis\`…）才留在表级。

⚠️ **本 PoC 没有证明**：真实 Table 的 \`Cell\` 会不会**间接**读到表级字段（例如通过 \`rowInfo\` 展开对象）；
那要在 T1 落地后用同样的计数法再测一次（届时把 \`poc-table-context.mjs\` 的骨架换成真组件）。

### 4.4 其余平台差异（照抄就错）

| # | 上游 | 本仓 | 分类 |
|---|---|---|---|
| 1 | `tableProps` **全量 spread** 给 rc-table（antd-only prop 也泄漏过去） | **显式白名单**透传 | INTENDED |
| 2 | `expandIcon` / `expandedRowRender` 等 rc legacy 字段走**两条注入路径** | 只走一条（`mergedExpandable`） | INTENDED |
| 3 | `_renderTimes` 计数打破 memo | 显式触发（见 §4.1 #12） | PLATFORM |
| 4 | `expandType` 判据 `some(item => item?.[childrenColumnName])`（**空数组 truthy**） | 逐字保留（跟上游） | UPSTREAM |
| 5 | `mergedPagination.current` **直接 mutate** | 不改派生对象（改成 `computed` 里算夹取后的值） | INTENDED |
| 6 | `isCheckboxDisabled` 用 `has(某key)` 却 `get(重算的key)`（`getRowKey` 被调两次） | 逐字保留（跟上游） | UPSTREAM |
| 7 | `stickyScrollBar` 的 `left = x + pageX - x - delta`（`x` 自相消，疑似笔误但结果对） | 逐字保留 | UPSTREAM |
| 8 | `ColGroup` 的 `minWidth` **只在 `tableLayout==='auto'`** 时写 | 逐字保留 | UPSTREAM |
| 9 | `Cell` 的 span 顺序：`render 返回的 props` > `onCell` > 列定义 > 1 | 逐字保留（反直觉但被依赖） | UPSTREAM |
| 10 | `useFilter` 的 `filteredValue` 自动 `String()`（仅无自定义 dropdown 时） | 逐字保留 | UPSTREAM |
| 11 | `useExpand` 里 `mergedExpandedKeys.delete()` **原地改 memo 出的 Set** | 改成不可变（新建 Set） | INTENDED |
| 12 | `MeasureRow` 用 `cloneElement(title, {ref:null})` | `cloneVNode` | PLATFORM |

---

## 5. 预判的最大风险（按概率排序）

1. **受控判据被「顺手改真值」**（§2.2）—— 症状是 `null`（取消排序）/ `false`（关 tooltip）被吞，
   而**类型与结构断言都看不出来**。⇒ 落地时每一条 `'x' in column` / `!== undefined` 都配一条 L1 用例
   （「传 `null` / `false` 时行为**不是**默认行为」）。
2. **`transformColumns` 的四层嵌套顺序**（§2.4）—— 换成独立 `computed` 会破坏顺序与「列被克隆」的引用语义
   ⇒ 症状是「过滤列头没有排序图标」这类**组合态**才暴露的问题。
3. **固定列 / 固定表头 / sticky 的三层协作**（§2.5 + `fixUtil` 的 z-index 与阴影偏移）——
   任何一处口径错位都会视觉崩坏，而 **jsdom 完全测不到**（无布局）⇒ 只有 L6 抓得到。
4. **虚拟滚动 + rowSpan 的补行逻辑**（`BodyGrid.extraRender` 有中文注释的边界钳制）——
   且本仓 virtual-list 的定位模型与 rc 不同 ⇒ **不能照搬**。
5. **Context 切片粒度**（§4.3）—— 选错会让「大表 hover 卡顿」或「单元格不更新」，两者都难定位。

---

## 6. 本分析**已经证明**什么 / **没有**证明什么

### ✅ 已证明（可复核）

- 上游文件清单与行数（`find | wc -l`，§1.1）。
- `@rc-component/table@1.11.1` 的 `Summary.CellProps` **无 `fixed`**（读 `es/Footer/Cell.d.ts`）。
- `tree/utils/{treeUtil,conductUtil}.ts` 导出了 `convertDataToEntities` / `conductCheck` / `isCheckDisabled`，
  且经 `tree/index.ts` 的 `export * from './utils'` 对外可用 ⇒ **可直接复用**。
- `_internal/color-composite.ts` 导出 `onBackground(fg, bg): Color`。
- `_internal/use-merge-semantic.ts` **不支持 `schema`**，而 antd 的 `TableSemanticType` **是嵌套的**
  ⇒ `docs/KNOWN-ISSUES.md` §1.7 的预言成立。
- `packages/virtual-list` 的 4 处契约缺口（逐条对照 `virtual-list.ts` 的 props 段与 `BodyGrid.js:223-256`）。

### ❌ 没有证明（G4 每片开工前必须先做）

- **没有**跑过任何一条 Table 的行为（本文件是纯静态分析）。
- **没有**抽取过 Table 的真实 CSS（§3.2 的文件清单来自 antd 源码，**不是** `extractStyle` 产物）
  ⇒ 真实规则条数与 `-css-var` 形态待 `extract-table-css.mjs` 产出后确认。
- **没有**验证 `useSelection` 的 tree 联动与 `checkStrictly` 的边界（半选 / 禁用节点 / 父子取消）。
- **没有**验证固定列在真实浏览器里的几何（L6 的活）。
- **没有**定案 Context 切片方案（§4.3 只给了三个候选）。
- **没有**验证 `_renderTimes` 在 Vue 里的等价物到底需要什么（`genTable` 的 `shouldTableUpdate` 语义）。
- **没有**确认 `@rc-component/table` 与 antd 6.6.4 的版本配对是否还有其他 breaking change（只读了 1.11.1）。

---

## 7. 分片实施计划（**Table 不能一次做完**）

每片都是一个可独立验收的里程碑（各自能过 L1 + L4 + L6 的对应子集）。

| 片 | 内容 | 交付判据 | 依赖 |
|---|---|---|---|
| **T0 · 前置** | ① `use-merge-semantic` 补 `schema`（含 L1 用例：顶层 `root` 与嵌套 `body.cell` 各传一半）；② Context 切片方案 PoC（3 个候选各写 20 行验证重渲粒度）；③ `extract-table-css.mjs` 产出真实 CSS + 31 token 声明块 | ① 单测绿 + `color-picker`/`card` 等既有消费者不回归；② PoC 结论写进 README；③ `extractStyle` 产物落盘 | — |
| **T1 · 骨架** | 引擎的 `Table.js` + `Body` + `Cell` + `Header` + `ColGroup`（**不含** fixed/sticky/virtual/selection/sorter/filter）+ antd 层的最小壳 | `columns` / `dataSource` / `rowKey` / `size` / `bordered` / `loading` / `emptyText` 的 L1+L4+L6 | T0 |
| **T2 · 展开** | `expandable`（row / nest 两型）+ `ExpandIcon` + `expandedRowRender` + `indentSize` | `expand` 系 demo 的 L1+L4+L6 | T1 |
| **T3 · 排序 + 过滤** | `useSorter` + `useFilter` + `FilterDropdown`（menu/tree 两模式）+ `locale` 接线 | 排序/过滤系 demo；**受控判据的 L1 用例**（`null`/`false` 各一条） | T1 |
| **T4 · 选择 + 分页** | `useSelection`（含 tree 联动、shift、`preserveSelectedRowKeys`）+ `usePagination` | 选择系 demo；tree 联动的 L1（半选/禁用/父子取消各一条） | T2、T3（选择列要能看到 filter/sorter） |
| **T5 · 固定 + 粘性 + 汇总** | `FixedHolder` + `fixUtil` + `useStickyOffsets` + `stickyScrollBar` + `Summary` | fixed/sticky/summary 系 demo 的 L6（jsdom 测不到，**必须靠 L6**） | T1 |
| **T6 · 虚拟滚动** | `VirtualTable/**` + virtual-list 的 4 处契约补齐 + rowSpan 补行 | `virtual-list` demo 的 L6；**横向定位模型要先定案** | T5 |
| **T7 · 收口** | 52 个 demo / 文档 / 52×3 张 L6 基线 / registry | 11 维度全 `done` + `verify:full` exit=0 | 全部 |

⚠️ **T0 必须先做**：它产出的三样东西（`schema` / 切片方案 / 真实 CSS）是后面 6 片的共同前提，
而且都是**独立可验收**的小任务 —— 不适合混在组件实现里做。
