# Table · T6 虚拟滚动（XL 独立片）分析

> 分析日期：2026-10-04。**这是 `docs/analysis/table.md` T6 片的独立分析产物**（T0–T5/T7 已收口）。
> 事实来源（**全部读源码/产物，不凭记忆**）：
>
> | 材料 | 路径 |
> |---|---|
> | antd 6.6.4 薄壳 | `/tmp/antd-src/package/es/table/RcTable/{VirtualTable,index}.js` |
> | antd 6.6.4 样式 | `/tmp/antd-src/package/es/table/style/virtual.js` |
> | antd demo / 测试 | `/tmp/antd-repo/ant-design-master/components/table/{demo/virtual-list.tsx,__tests__/Table.virtual.test.tsx}` |
> | rc 引擎 | `/tmp/rc-table-ref/package/es/VirtualTable/{index,BodyGrid,BodyLine,VirtualCell,context}.js`（605 行） |
> | 本仓 virtual-list 契约 | `docs/foundation/virtual-list-contract.md` |
>
> ⚠️ **`/tmp/antd-src` / `/tmp/antd-repo` 又被系统清理**（PITFALLS 42）—— 本次已恢复；
> rc-table 产物**不在** antd tarball 里，需单独 `npm pack @rc-component/table@1.11.1`。

---

## 1. 上游结构（三层）

```
antd 层   RcTable/VirtualTable.js  15 行 —— genVirtualTable(比较器) 的薄壳
              ↓ 只为改「触发子更新」的比较器（_renderTimes 不同才更新）
rc 层     VirtualTable/index.js    93 行 —— 包 StaticContext + 渲染 <Table>
          VirtualTable/BodyGrid.js 261 行 —— VirtualList 容器 + rowSpan 补行
          VirtualTable/BodyLine.js 128 行 —— 一行（div，非 tr）+ 展开行
          VirtualTable/VirtualCell.js 121 行 —— flex 定位单元格
          VirtualTable/context.js  2 行 —— StaticContext + GridContext
```

### 1.1 `VirtualTable/index.js`（rc）—— 只有一个关键动作

```js
// scroll.x / scroll.y 必须是 number，否则兜底并 dev warning
if (typeof scrollX !== 'number') { warning(!scrollX, '`scroll.x` in virtual table must be number.'); scrollX = 1; }
if (typeof scrollY !== 'number') { scrollY = 500; warning(false, '`scroll.y` in virtual table must be number.'); }

<StaticContext.Provider value={{ sticky, scrollY, listItemHeight, getComponent, onScroll }}>
  <Table {...props}
    className={clsx(className, `${prefixCls}-virtual`)}
    scroll={{ ...scroll, x: scrollX }}
    components={{ ...components, body: data?.length ? renderBody : undefined }}  // ← 换 body
    internalHooks={INTERNAL_HOOKS}
    tailor                                                                    // ← 关键
  />
</StaticContext.Provider>
```

- **`components.body = renderBody`**：`renderBody(rawData, { ref, onScroll })` 直接返回 `<Grid/>`。
  这是 rc `Table.js:482` 的 `customizeScrollBody` 通道：`bodyContent = customizeScrollBody(mergedData, { scrollbarSize, ref: scrollBodyRef, onScroll: onInternalScroll })`，
  **只在 `fixHeader || isSticky` 分支**发生（virtual 传了 `scroll.y` ⇒ `fixHeader` 恒真）。
- **`tailor: true`**：让 `useColumns` 把 `scrollWidth = scroll.x`、`clientWidth = 容器宽` 传进去，
  `realScrollWidth` 参与 `mergedScrollX`（本仓 engine 已逐字实现该逻辑，见 `Table.ts:414-424`）。
- `data?.length` 为空时**不换 body**（antd issue 48991）⇒ 空表走普通 body（渲染 empty placeholder）。

### 1.2 `BodyGrid.js`（rc，261 行）—— 核心

```js
const flattenData = useFlattenRecords(data, childrenColumnName, expandedKeys, getRowKey);

// 列宽前缀和：[key, width, total]，columnsOffset = 各列 total
const columnsWidth = flattenColumns.map(({width, minWidth, key}) => {
  const finalWidth = Math.max(width || 0, minWidth || 0);
  total += finalWidth;  return [key, finalWidth, total];
});
const columnsOffset = columnsWidth.map(c => c[2]);
useEffect(() => columnsWidth.forEach(([key, width]) => onColumnResize(key, width)), [columnsWidth]);

// imperative handle（暴露给 antd 的 Table ref）
{ scrollTo(config) { ...ALIGN_MAP[align] ?? (offset ? 'top' : 'auto')... },
  nativeElement: listRef.current?.nativeElement,
  get/set scrollLeft, get/set scrollTop }

<VirtualList
  fullHeight={false}
  prefixCls={`${prefixCls}-tbody-virtual`}
  styles={{ horizontalScrollBar: sticky ? {position:'sticky', bottom} : {} }}  // ← 本仓无 styles
  className={`${prefixCls}-tbody`}
  height={scrollY} itemHeight={listItemHeight || 24}
  data={flattenData} itemKey={item => getRowKey(item.record)}
  component={getComponent(['body','wrapper'])}   // ← 本仓 component 只收 String
  scrollWidth={scrollX} direction={direction}
  onVirtualScroll={({x}) => onScroll({ currentTarget: listRef.current?.nativeElement, scrollLeft: x })}
  onScroll={onTablePropScroll}
  extraRender={extraRender}                       // ← 本仓是 #extra slot
>{(item, index, itemProps) => <BodyLine data={item} rowKey={...} index={index} style={itemProps.style} />}</VirtualList>
```

**`extraRender`（rowSpan 补行）算法**（`:113-199`）—— 逐字记录：

```
if (end < 0) return null;
// ① 向前找「第一个没有 rowSpan=0 的行」⇒ startIndex
firstRowSpanColumns = flattenColumns.filter(c => getRowSpan(c, start) === 0)
for (i = start; i >= 0; i--) { firstRowSpanColumns = firstRowSpanColumns.filter(c => getRowSpan(c,i) === 0); if (!len) { startIndex = i; break; } }
// ② 向后找「最后一个 rowSpan 全为 1 的行」⇒ endIndex
lastRowSpanColumns = flattenColumns.filter(c => getRowSpan(c, end) !== 1)
for (i = end; i < flattenData.length; i++) { ...; if (!len) { endIndex = Math.max(i - 1, end); break; } }
// ③ 收集 [startIndex, endIndex] 内「任一列 rowSpan > 1」的行
// ④ 每行渲染 <BodyLine extra>，style.top = -offsetY + getSize(rowKey).top
//    getHeight = rowSpan => getSize(rowKey, endItemKey).bottom - .top（跨 rowSpan 的高度）
```

**`getRowSpan(column, index)`** = `column.onCell?.(flattenData[index]?.record, index)?.rowSpan ?? 1`。

### 1.3 `BodyLine.js`（rc，128 行）—— 一行

- 行组件 `getComponent(['body','row'], 'div')`（**默认 div，不是 tr**）；
  单元格 `getComponent(['body','cell'], 'div')`。
- `rowStyle = { ...style, width: scrollX }`；`extra` 时加 `position:'absolute'; pointerEvents:'none'`。
- class：`${prefixCls}-row`、`${prefixCls}-row-extra`（extra 时）、`expandedClsName`（indent≥1）。
- 展开行（`!extra && rowSupportExpand && (forceRender || expanded)`）：
  `<RowComponent class="{p}-expanded-row {p}-expanded-row-level-{indent+1}">` 里放一个 `Cell`
  （class `{p}-expanded-row-cell` + `-fixed`，`--virtual-width: {componentWidth}px`）。
  **`rowSupportExpand` 时外层再包一层 `<div ref>`**（`return <div>{rowNode}{expandRowNode}</div>`）。
- `rowInfo = useRowInfo(record, rowKey, index, indent)` —— 本仓对应 `getCellProps` 的入参来源。

### 1.4 `VirtualCell.js`（rc，121 行）—— flex 定位

```js
const { style: cellStyle, colSpan = 1, rowSpan = 1 } = additionalCellProps;

const startColIndex = colIndex - 1;
const concatColWidth = getColumnWidth(startColIndex, colSpan, columnsOffset);  // columnsOffset[i+span] - (columnsOffset[i] || 0)
const marginOffset = colSpan > 1 ? colWidth - concatColWidth : 0;

mergedStyle = { ...cellStyle, ...style,
  flex: `0 0 ${concatColWidth}px`, width: `${concatColWidth}px`,
  marginRight: marginOffset, pointerEvents: 'auto' };

// rowSpan/colSpan 为 0 ⇒ visibility:hidden（保留占位）；inverse(extra) 时 height = getHeight(rowSpan)
// Virtual 必须重置 colSpan/rowSpan 为 1（div 布局下无效）
if (rowSpan === 0 || colSpan === 0) { cellSpan.rowSpan = 1; cellSpan.colSpan = 1; }
```

⭐ `getColumnWidth(colIndex, colSpan, columnsOffset)` 用**前缀和**算跨列宽，`colSpan=0` 当 **1** 处理。

### 1.5 `context.js`（rc）—— 两个 context

- `StaticContext`：`{ sticky, scrollY, listItemHeight, getComponent, onScroll }`（Table → BodyGrid）。
- `GridContext`：`{ columnsOffset }`（BodyGrid → VirtualCell）。

---

## 2. antd 层

### 2.1 `RcTable/VirtualTable.js`（15 行）

```js
const RcVirtualTable = genVirtualTable((prev, next) => prev._renderTimes !== next._renderTimes);
```

**只为替换「触发子更新」的比较器** —— 普通 rc-table 用 `shouldTableUpdate`，virtual 用 `_renderTimes`。
本仓没有 `_renderTimes` 机制（Vue 靠 props 响应式），**这一层无需移植**（登记 INTENDED）。

### 2.2 `style/virtual.js` → 本仓**已移植**

`packages/ui/src/table/style/index.ts:299-308` 已含全部 8 条规则（`-tbody-virtual` / `-scrollbar` /
`-holder-inner` 的 flex 行 / `-cell` border / `-expanded-row-cell-fixed` / bordered / placeholder）。
⚠️ `-tbody-virtual-scrollbar` 的 `:hover` 背景属**自绘滚动条**视觉 —— 本仓用原生滚动条，
该规则**保留但永不命中**（无对应 DOM），登记 PLATFORM（与 virtual-list §5.1 同源）。

### 2.3 DOM 契约（从 `Table.virtual.test.tsx` 提取，**这是 L4 的判据**）

| 断言 | 选择器 / 值 |
|---|---|
| 虚拟行**不是 tr** | `.ant-table-wrapper .ant-table-tbody-virtual .ant-table-row:not(tr)` |
| holder 内的单元格 | `.ant-table-tbody-virtual-holder .ant-table-cell` |
| 行 `display: flex` | `.ant-table-tbody-virtual .ant-table-row` → `{display:'flex'}` |
| 展开行内的行**恢复 table-row** | `.ant-table-tbody-virtual-holder .ant-table-expanded-row .ant-table-row` → `{display:'table-row'}` |
| 展开行结构 | `.ant-table-tbody-virtual-holder-inner > div > .ant-table-row` |
| 无 `scroll.y` 警告 | `Warning: \`scroll.y\` in virtual table must be number.` |
| selection 列宽 token | `.ant-table-selection-col` → `{width:'200px'}`；自定义 `columnWidth: 50` 优先 |

⚠️ **展开行内的行是 `display: table-row`** —— 由 antd 基础样式给 `tr`，但虚拟行是 `div`，
所以样式层的 `-holder-inner > .row {display:flex}` 只覆盖**顶层行**，展开行内的 `-row` 仍走默认。
本仓移植时必须保证：`-holder-inner > div:not(.row) > .row` 选择器（已含在 style/index.ts:301）。

---

## 3. 本仓对应设计

### 3.1 与上游的结构差异（**必须登记**）

| # | 上游 | 本仓 | 分类 |
|---|---|---|---|
| 1 | 独立组件 `VirtualTable`（包 `<Table>` + 换 `components.body`） | engine 加 `virtual` prop，内部换 body | INTENDED（Vue 无 render-prop 通道，见 §3.2） |
| 2 | `genVirtualTable` 的 `_renderTimes` 比较器 | 无（Vue 响应式） | INTENDED |
| 3 | `styles={{horizontalScrollBar}}` | 无 `styles` prop ⇒ 丢弃 | PLATFORM（与 virtual-list §5.1 同源：无自绘滚动条） |
| 4 | `extraRender` prop（函数） | `#extra` slot（本仓 virtual-list 已是 slot） | INTENDED |
| 5 | 渲染函数式 child | default slot | INTENDED |
| 6 | `component` 传**组件** | `component` 只收 String | ⚠️ 需评估：BodyGrid 传 `getComponent(['body','wrapper'])`（可能是组件） |
| 7 | 横向用 `margin-left: -offsetX` 模拟 | **原生横向滚动** | PLATFORM（见 §4 定案） |
| 8 | `customizeScrollBody` 通道（`components.body` 为函数） | engine 的 `_customizeScrollBody` **是死代码**（定义未用） | 本仓不走该通道，改由 `virtual` prop 驱动 |

### 3.2 为什么本仓不走 `components.body`

- rc 的 `components.body` 是 **render prop**（`(data, {ref,onScroll}) => ReactNode`）；
  Vue 的 `components` 更自然是**组件**，语义不同。
- 本仓 engine 的 `_customizeScrollBody`（`Table.ts:372`）**定义了但从未使用** ——
  说明 T1 移植时就没打算走这条通道。
- ⇒ **本仓方案**：engine 加 `virtual?: boolean` + `listItemHeight?: number`，
  在 `fixHeader || sticky` 分支里，`virtual` 为真时把 `bodyContent` 换成 `BodyGrid`。
  **DOM 结果与上游等价**（都是「div 容器 + VirtualList」），且不引入 render-prop 语义。

### 3.3 新增文件

```
packages/ui/src/table/engine/
├── VirtualTable.ts              # 组件：StaticContext + 渲染 engine Table（virtual 时）… 见下
└── VirtualTable/
    ├── context.ts               # StaticContext / GridContext（Vue provide/inject 或 props）
    ├── BodyGrid.ts              # VirtualList 容器 + rowSpan 补行
    ├── BodyLine.ts              # flex 行 + 展开行
    └── VirtualCell.ts           # flex 单元格
```

⚠️ 因本仓走 `virtual` prop（§3.2），**不需要**单独的 `VirtualTable.ts` 包装组件 ——
BodyGrid 直接在 engine `Table.ts` 的 fixHeader 分支里渲染。
`StaticContext` 用 **props 直接传递**（BodyGrid → BodyLine → VirtualCell 是直接父子链，
无跨层订阅需求）⇒ 少一个 context 文件。**只保留 `GridContext` 的等价物 `columnsOffset` 也走 props。**

---

## 4. ⭐ 横向定位模型（**定案**）

> `table.md` §4.2 要求「横向定位模型要先定案」。本节是定案。

### 4.1 上游模型

- holder：`overflowY: hidden; overflowX: hidden`（`useVirtual` 时）。
- 横向偏移由 **VirtualList 内部** `margin-left: -offsetX` 模拟（Filler 内层）。
- 滚动条是**自绘** `ScrollBar`（`borderRadius:99` / `rgba(0,0,0,.5)`），
  它绑到 holder 的横向 scroll 事件 ⇒ 拖动滚动条改变 `offsetX` ⇒ 内容左移。
- 行：`display:flex; width: scrollX`；单元格：`flex: 0 0 {w}px; width:{w}px`。

### 4.2 本仓模型（**定案 = 原生横向滚动**）

本仓 `@apollo-design/virtual-list` 已裁决**不做自绘滚动条、不做 marginLeft 模拟**
（`docs/foundation/virtual-list-contract.md` §5.1/§5.2，属已登记差异）。因此：

| 面 | 本仓做法 |
|---|---|
| holder | `overflow: auto`（原生） |
| 横向偏移 | holder 的**原生 `scrollLeft`**（`onFallbackScroll` 从 `scrollLeft` 读，`virtual-list.ts:242-244`） |
| 内容宽度 | 设了 `scrollWidth` 时给 Filler 内层显式 `width`（`filler.ts`） |
| 行 / 单元格 | **与上游一致**：`display:flex; width:{scrollX}px` + `flex:0 0 {w}px` |
| 固定列 | **与上游一致**：Cell 的 `insetInlineStart/End` + sticky（与虚拟化正交） |

**结论**：横向定位模型 = **「flex 行 + 原生横向滚动」**。行的 flex 布局与上游**逐字一致**，
差异只在**滚动驱动方式**（原生 vs 模拟）—— 这正是 virtual-list 已裁决的差异面，
不引入新的定位算法。

### 4.3 连带影响（必须写进 README / COMPATIBILITY）

1. `scrollWidth` 必须是**数值**（上游亦然：`typeof scrollX !== 'number'` ⇒ 兜底 1 + 警告）。
2. 滚动条外观由**消费方 CSS** 决定（`scrollbar-width` / `::-webkit-scrollbar`）；
   `-tbody-virtual-scrollbar` 规则保留但无 DOM 命中。
3. `styles={{horizontalScrollBar}}`（sticky 时让滚动条 sticky）**不生效** —— 原生滚动条无法这样定位。
   本仓 sticky 的横向滚动条**缺失**（登记 COMPATIBILITY）。
4. 嵌套滚动边界交接交给浏览器 scroll chaining（上游用 `useOriginScroll` 手工模拟）。

### 4.4 ⚠️ 未证明（只有真实浏览器能验，属 L6）

- flex 行 + 原生横向滚动在**真实排版**下是否与上游视觉一致（abspos 元素的溢出是否计入滚动区）。
- 固定列 + 虚拟滚动叠加时的阴影 / z-index。
- `scrollTo({ index })` 在真实滚动容器下的收敛（jsdom 无布局 ⇒ 会迭代到 10 次上限）。

---

## 5. 本仓要动的地方

| 文件 | 改动 |
|---|---|
| `engine/Table.ts` | 加 `virtual` / `listItemHeight` props；fixHeader 分支按 virtual 换 `bodyContent`；把 `scrollX` 数值化（兜底 + 警告）；暴露 `scrollTo`/`nativeElement` 给上层 |
| `engine/VirtualTable/BodyGrid.ts` | **新增**（§1.2 的移植） |
| `engine/VirtualTable/BodyLine.ts` | **新增**（§1.3 的移植） |
| `engine/VirtualTable/VirtualCell.ts` | **新增**（§1.4 的移植） |
| `engine/VirtualTable/context.ts` | **新增**（仅 `columnsOffset` 类型，若走 props 可并入 BodyGrid） |
| `ui/Table.ts` | `virtual` 时传 `virtual` + `listItemHeight`；实现 `expose.scrollTo` / `nativeElement`（当前是空实现，`Table.ts:579-590`） |
| `style/index.ts` | 已就绪，无需改（§2.2） |

---

## 6. 测试策略

| 层 | 内容 |
|---|---|
| L1 | `getColumnWidth`（前缀和 / colSpan=0 当 1）、rowSpan 补行的**区间算法**（startIndex / endIndex 的前后扫描）、`ALIGN_MAP` 映射 |
| L2 | jsdom：`virtual` 开关、无 `scroll.y` 警告、展开行结构、`selectionColumnWidth` token、`components.body.row/cell` 自定义 |
| L4 | DOM 契约（§2.3 全部断言，对齐 antd 的 `Table.virtual.test.tsx`） |
| L6 | `virtual-list` demo 视觉基线（basic / bordered / fixed / expandable / empty / selection × 3 viewport） |
| L7 | 构建门禁（已在 `verify:full` 内） |

---

## 7. 这个片**没有**证明什么

1. 没有证明真实浏览器下的**横向滚动**视觉正确（§4.4）。
2. 没有证明 `scrollTo({ index })` 在真实容器下能收敛（jsdom 无布局）。
3. 没有证明 sticky 横向滚动条缺失**不影响**视觉（它确实缺失，登记差异）。
4. 没有验证 `listItemHeight` 默认值（上游 24）与 antd 实际行高的一致性 —— 需 L6 对拍。
5. 没有验证 `expandable + virtual` 组合下 `--virtual-width` 的计算（依赖 `componentWidth`，需真实布局）。
