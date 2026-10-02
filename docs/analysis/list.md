# List · G1 分析产物

> 契约来源：antd **6.6.4** 的 `components/list/`（源码 1001 行）与 `es/list/`（产物 674 行）。
> **先于实现存在**（`AGENTS.md` §2）。实现落点：`packages/ui/src/list/`。

---

## 0. 依赖面核查（**结论：无 foundation 缺口，全部可复用**）

| antd 用的 | 本仓落点 | 备注 |
|---|---|---|
| `@rc-component/util` 的 `mergeProps` | `@apollo-design/utils` 的 `mergeProps` | 只跳过 `undefined` 键 |
| `@rc-component/util` 的 `toArray` | `@apollo-design/utils` 的 `toArray`（`children/to-array`） | `Item` 的 no-flex 判据用 |
| `_util/is` 的 `isFunction` / `isString` / `isPlainObject` | `@apollo-design/utils` 的 `is.ts` | 全部同名导出 ✓ |
| `_util/warning` 的 `devUseWarning` | `@apollo-design/utils` 的 `devUseWarning` | ⚠️ 上游**三参** `(valid,'breaking',msg)`、本仓**两参** ⇒ 调用点合并消息（slider/avatar 同判） |
| `_util/responsiveObserver` 的 `responsiveArray` / `Breakpoint` | `ui/src/_internal/responsive-observer.ts` | 同名导出 ✓ |
| `_util/reactNode` 的 `cloneElement` | **Vue 原生 `cloneVNode`** | badge `ScrollNumber` / typography `Editable` 先例 |
| `config-provider/hooks/useSize` | `config-provider/size-context.ts` 的 `useSize` | ⚠️ 本仓返回 **`ComputedRef`**（D39 家族） |
| `useComponentConfig('list')` | `config-provider/context.ts` 的 `useComponentConfig` | 取 `className` / `style` / `item?.classNames` / `item?.styles` |
| `ConfigContext.renderEmpty` | `useConfigContext().renderEmpty` | |
| `DefaultRenderEmpty` | `config-provider/default-render-empty.ts` | 组件形态 + `defaultRenderEmpty()` 函数形态都有 |
| `grid` 的 `Row` / `Col` | `ui/src/grid` 的 `Row` / `Col`（completed） | grid 模式下 `Item` 外包 `Col` |
| `grid/hooks/useBreakpoint` | `ui/src/grid/hooks/use-breakpoint.ts` | 响应式列数 |
| `pagination` | `ui/src/pagination`（completed） | |
| `spin` | `ui/src/spin`（completed） | ⚠️ 依赖它的内部类名 `-nested-loading` / `-container` |
| `useCSSVarCls` | **无对应 hook** ⇒ 直接拼 `${prefixCls}-css-var` | rate / card 先例 |
| `genCssVar(root,'list')` | **无对应物** ⇒ 手写 `--{root}-list-*` | splitter 先例 |
| `genStyleHooks` | `genListStyle` + `prepareComponentToken` + `COMPONENT_STYLES` 一行 | 与 card/masonry 同形 |

⚠️ **一处需要新落的机制**：`genStyleHooks` 的第 4 参
`extraCssVarPrefixCls: ({ prefixCls }) => [\`${prefixCls}-container\`]`
—— css-var 声明块**同时挂 `.ant-list` 与 `.ant-list-container`**（产物实测见 §6.1）。
本仓无 cssinjs ⇒ 按 **D95 家族**（image / input）的判据：**声明块必须覆盖全部根形态**。

---

## 1. 组件面

| 上游文件 | 行数 | 本仓 | 形态 |
|---|---|---|---|
| `index.tsx` | 349 | `List.vue` | `.vue` SFC（见 §4） |
| `Item.tsx` | 180 | `Item.vue` + `ItemMeta.vue` | `.vue` SFC ×2 |
| `context.ts` | 12 | `context.ts` | `InjectionKey` + `provide` / `inject` |
| `style/index.ts` | 460 | `style/index.ts` | `genListStyle` + `genTokenDecls` |

导出面（`index.tsx:24-32` + `Item.tsx:12-48`）：
`List`（默认）+ `List.Item` + `List.Item.Meta`；类型 `ListProps<T>` / `ListGridType` /
`ColumnCount` / `ColumnType` / `ListSize` / `ListItemLayout` / `ListLocale` /
`ListItemProps` / `ListItemMetaProps` / `ListItemMetaRef` / `ListItemSemanticName` /
`ListItemSemanticClassNames` / `ListItemSemanticStyles` / `ListConsumerProps`。

⚠️ **两个静态属性挂在 `List` 上**（`Item` 挂在 `List` 上、`Meta` 挂在 `Item` 上）⇒
本仓用 `Object.assign` 挂（avatar `Avatar.Group` 先例）。

---

## 2. 行为契约（逐条）

1. **`dataSource` 的渲染**：`renderInternalItem` 逐项调用 `renderItem(item, index)`，
   **外层包一个带 key 的 Fragment**。key 的解析链：
   `isFunction(rowKey) ? rowKey(item) : rowKey ? item[rowKey] : item.key`，再 `??= \`list-item-${index}\``
   （⚠️ `??=` —— `0` / `''` 是**有效 key**，只有 `null` / `undefined` 才回退）。
   ⚠️ `renderItem` **未传时返回 `null`**（不是渲染原 item）。
2. **`isSomethingAfterLastItem` = `!!(loadMore || pagination || footer)`** ⇒
   `-something-after-last-item` 类（只影响 CSS，见 §3 的 `:last-child` 下边框规则）。
3. **`loading`**：`boolean` ⇒ 包成 `{ spinning }`；`isLoading = !!loadingProp?.spinning`。
   `isLoading` 时 `childrenContent` 先被置成 `<div style={{minHeight:53}} />`；
   **空态判断因此是「非 loading 才判」**（`else if (!children && !isLoading)`）。
4. 🚨 **空态判据是「`splitDataSource.length === 0` **且** 无 `children` **且** 非 loading」**：
   `locale?.emptyText || renderEmpty?.('List') || <DefaultRenderEmpty componentName="List" />`
   —— 三级回退。⚠️ `emptyText` 为 `''`（空串）时走**第二级**（`||` 不是 `??`）。
5. **分页**：`pagination === false` 是默认值 ⇒ 不渲染。`pagination` 为对象时
   `mergeProps({current:1,total:0,position:'bottom'}, {total:len, current, pageSize}, pagination)`。
   🚨 `largestPage = Math.ceil(total / pageSize)`，`current = Math.min(current, largestPage)`。
   🚨 **切片条件是 `dataSource.length > (current-1)*pageSize`** —— 不满足时**不切片**
   （`splitDataSource` 保持全量）。`position: 'top' | 'both'` 时渲染在 header **之前**。
   ⚠️ `paginationContent` 是**同一个 JSX 表达式**在**两处**使用（top 与 bottom）——
   React 里这是两个不同的 element 实例，Vue 侧**不能复用同一个 vnode**（PITFALLS：vnode 一次性）。
6. **`itemLayout === 'vertical'`** ⇒ `-vertical` 根类；`Item` 内部据此走「两段式」分支。
7. **`size`**：`useSize(customizeSize)` ⇒ `large→'lg'` / `small→'sm'`，其余**不加类**
   （⚠️ `'default'` / `'middle'` / `'medium'` 都不落类）。
8. **`grid`**：`needResponsive = Object.keys(grid).some(k => responsiveArray.includes(k))`；
   `useBreakpoint(needResponsive)`；`currentBreakpoint` 按 `responsiveArray`（**从大到小**）**首个**为真的断点。
   `columnCount = (currentBreakpoint && grid[currentBreakpoint]) ? grid[currentBreakpoint] : grid.column`。
   `colStyle = { width: \`${100/n}%\`, maxWidth: \`${100/n}%\` }`（**字符串**，不是裸数字）。
   ⚠️ `useMemo` 依赖是 **`JSON.stringify(grid)`** —— 等价物在 Vue 里是 `computed` 读 props（天然深比较由 Vue 做）。
   ⚠️ `columnCount` 为 `0` / `undefined` ⇒ `colStyle` 为 `undefined`（不产出内联 style）。
9. **`grid` 改变 DOM 结构**（`Item.tsx:133`）：`Element = grid ? 'div' : 'li'`；
   且 `grid` 时外层包 `<Col flex={1} style={colStyle}>`，`ref` **落在 `Col` 上**（不落 `li`）。
   非 grid 时 `ref` 落在 `li` 上。
10. **`Item` 的 flex 判据**（`Item.tsx:104-115`，**最容易抄错的一处**）：
    `isItemContainsTextNodeAndNotSingular()` = `toArray(children).some(isString) && childNodes.length > 1`
    （**两个条件都要**：有字符串子节点 **且** 子节点数 > 1）；
    `isFlexMode()` = `itemLayout === 'vertical' ? !!extra : !isItemContainsTextNodeAndNotSingular()`；
    `!isFlexMode()` ⇒ `-item-no-flex` 类。
    ⚠️ 字符串子节点判定用 **`isString`**（`''` 也算字符串）。
11. **`Item` 的内容分支**（`Item.tsx:146-160`）：
    `itemLayout === 'vertical' && extra` ⇒ **两个 div**（`-item-main` 包 children + actionsContent，
    `-item-extra` 包 extra）；**否则** `[children, actionsContent, cloneElement(extra, {key:'extra'})]`
    —— 即 **`extra` 与 children 平级**（不包 div）。
12. **`actions`**：`actions && actions.length > 0` ⇒ `<ul class="-item-action">`，
    每项一个 `<li key="-item-action-{i}">`，**除最后一项外**追加 `<em class="-item-action-split" />`。
    ⚠️ `actions={[]}`（空数组）**不渲染**。
13. **`Item.Meta`**：`<div class="-item-meta">`；`avatar` 有 ⇒ `<div class="-item-meta-avatar">`；
    `(title || description)` 有 ⇒ `<div class="-item-meta-content">`（内含 `h4.-item-meta-title` 与
    `div.-item-meta-description`，**各自独立判真值**）。
14. **语义化槽**（`Item` 级，**不是 List 级**）：`classNames` / `styles` 各含
    `actions` / `extra` 两个槽；ConfigProvider 的 `list.item.classNames` / `.styles` 作为**底座**被
    用户 prop **覆盖**（`{...ctx, ...props}`）。⚠️ `Item` 的 `className` 与语义槽**是两回事**。
15. **`ref` 形状**：`List` / `Item.Meta` 上游是 `forwardRef<HTMLDivElement>`（ref 就是 DOM），
    `Item` 也是。本仓按既有约定统一成 `{ nativeElement }`（可空）—— PLATFORM。
16. **废弃告警**（`index.tsx:304-311`）：**非生产环境**无条件发
    `The \`List\` component is deprecated and will be removed in the next major version. If you're using version 6.6.0 or later, please use \`Listy\` instead.`
    ⚠️ `devUseWarning('List')` 的 `warning(false, 'deprecated', msg)` ⇒ 走 `console.error`。
    ⚠️ **不是**「传了某 prop 才告警」，是**每次渲染都告警**。
17. **`rest` 透传**：`{...rest}` 落在根 `<div>`（`id` / `data-*` / 事件等）。
    ⚠️ `Item` 的 `{...others}` 落在 `Element` 上（`div` 或 `li`）。

---

## 3. 样式契约（产物 **62 条**含 `ant-list` 的规则）

可复现命令：

```sh
node tests/visual/debug/extract-list-css.mjs > /tmp/list-antd.css   # 62 条 ant-list 规则
```

**11 个 Component Token**（产物 css-var 块的声明顺序，逐条一致）：

| token | 产物解析值 | 默认值来源 |
|---|---|---|
| `contentWidth` | `220px` | 字面量 `220` |
| `itemPadding` | `12px 0` | `${paddingContentVertical} 0` |
| `itemPaddingSM` | `8px 16px` | `${paddingContentVerticalSM} ${paddingContentHorizontal}` |
| `itemPaddingLG` | `16px 24px` | `${paddingContentVerticalLG} ${paddingContentHorizontalLG}` |
| `headerBg` | `transparent` | 字面量 |
| `footerBg` | `transparent` | 字面量 |
| `emptyTextPadding` | `16px` | `padding` |
| `metaMarginBottom` | `16px` | `padding` |
| `avatarMarginRight` | `16px` | `padding` |
| `titleMarginBottom` | `12px` | `paddingSM` |
| `descriptionFontSize` | `14px` | `fontSize` |

**2 个 `mergeToken` 派生**（用户**不可**覆盖）：
`listBorderedCls` = `${componentCls}-bordered`（**类名字符串**，进 token 只为复用）、
`minHeight` = `controlHeightLG`。

⚠️ **两个 `calc` 派生量**（CSS 里必须用 `calc()`，不能预计算成字面量，否则与产物分叉）：
- `innerCornerBorderRadius` = `borderRadiusLG - lineWidth` ⇒ `calc(var(--apollo-border-radius-lg) - var(--apollo-line-width))`
- `-item-action-split` 的 `height` = `fontHeight - marginXXS * 2`
  ⇒ `calc(var(--apollo-font-height) - var(--apollo-margin-xxs) * 2)`

结构要点（**从产物抄下来，不是推演**）：
- 根规则含 `resetComponent` 展开（box-sizing 4 条，`BASE_CSS` 已覆盖）+ 一条自定义属性
  `--rc-virtual-list-scrollbar-bg: var(--apollo-color-split)`（供 virtual-list 复用；⚠️ 变量名**不是** `--apollo-*`，B7 不管它，但**必须逐字保留**）。
- `*` 的 `outline:none`（产物 #6）。
- **两条 media**：`@media screen and (max-width:768px)`（screenMD）与
  `@media screen and (max-width: 576px)`（screenSM）—— 🚨 **冒号后空格不同**，源码就是这样写的
  （`index.ts` 的 `genResponsiveStyle` 第 134 行无空格、第 152 行有空格），产物逐字保留。
- `-grid .{antCls}-col > -item` 用的是 **`antCls`**（`.apollo-col`），不是 componentCls。
- `-loading .{p}-spin-nested-loading` 与 `-split.-something-after-last-item .{antCls}-spin-container > -items > -item:last-child`
  —— 跨组件（spin）的类名契约。

---

## 4. Vue 对应（平台差异）

- **`.vue` SFC**：`List.vue` / `Item.vue` / `ItemMeta.vue`。渲染树形状静态（div/ul/li 的组合），
  动态的只是「渲哪一支」与类名 —— `v-if` / `v-else-if` 能直接表达，不触发 `COMPONENT-RULES.md` §2 的例外。
  ⚠️ `Item` 的根标签在 `div` / `li` 之间切换 ⇒ 用 `<component :is="...">` 或 `v-if` 双分支
  （⚠️ 双分支会重建节点、丢 `ref` ⇒ 用 `<component :is>` 保身份，或用 `v-if` + 函数 ref）。
- **`children` 是默认插槽**（规则 C19）；`renderItem` / `rowKey` 是**函数 prop**（不是插槽 ——
  它们是「数据 → vnode」的映射，不是「内容」）。
- **内容类 prop 保持 `VNodeChild` prop 形态**（`header` / `footer` / `loadMore` / `extra` /
  `title` / `description` / `avatar` / `emptyText`），**数组类**保持 `VNodeChild[]`
  （`actions`）—— 🚨 这是**照 `card` 的实际做法**（同组、最接近的先例：
  `card/interface.ts:187/189/215` 的 `title` / `extra` / `actions` 都是 prop），
  **不是**照 `COMPATIBILITY.md` D111 的字面（D111 写的是「全部改为 slot」）。
  ⚠️ **两处不一致，本轮不擅自统一**：D111 的措辞与 card 的落地不同；`list` 取
  「与最近先例一致」这一侧，并把这条不一致登记进 `README §5`。
- **`locale`**：`ListLocale = { emptyText }` ⇒ **纯 prop 覆盖**（上游**没有** `useLocale('List')`，
  只有 `locale?.emptyText || renderEmpty?.('List') || DefaultRenderEmpty` 三级回退）。
- **`ListContext`** ⇒ `InjectionKey<ListConsumerProps>` + `provide`；⚠️ `Item` 在 `setup()` 里
  `inject` 一次即快照 ⇒ 值必须是 **`ComputedRef`**（D37 / D39 家族），否则 `grid` / `itemLayout`
  的后续变化不传导到已挂载的 `Item`。
- **`paginationContent` 复用** ⇒ Vue 侧**必须每次新建 vnode**（不能把同一个 vnode 放两处）。
- **`cloneElement(extra, { key:'extra' })`** ⇒ `cloneVNode(extra, { key:'extra' })`
  （⚠️ 只在 `extra` 是 vnode 时；字符串/数字原样 —— 与 `NodeRenderer` 的归一化同判）。

---

## 5. 预判差异

| # | 差异 | 分类 |
|---|---|---|
| 1 | `List` / `Item` / `Item.Meta` 的 `ref` 是 `{ nativeElement }`（可空）而非 DOM 本身 | PLATFORM（D51 家族） |
| 2 | 无 `useCSSVarCls` ⇒ 直接拼 `${prefixCls}-css-var`；声明块覆盖 `.apollo-list` + `.apollo-list-container` 两个根（§6.1） | PLATFORM（D95 家族） |
| 3 | `devUseWarning` 上游三参、本仓两参 ⇒ 把 `'deprecated'` 并进消息 | PLATFORM |
| 4 | 语义化槽只在 `Item` 上（`actions` / `extra`）；`List` 本身只有 `className` / `style` | 与上游一致，**不是**差异 |
| 5 | **`List` 整体 deprecated** ⇒ 保留同款 `console.error`（**每次渲染**），非生产环境 | UPSTREAM（跟随废弃，D91 先例） |
| 6 | 上游的 `-action` 选择器是**死选择器**（真类名是 `-item-action`）⇒ 逐字保留 | UPSTREAM（§6.2） |
| 7 | 无 `hashId`（D2）；无 cssinjs 的 `css-dev-only-do-not-override-*` 类 | PLATFORM（D5） |

---

## 6. 三处**已实测**的关键结论

### 6.1 🚨 css-var 声明块覆盖**两个根形态**（`.ant-list` + `.ant-list-container`）

产物实测（`extract-list-css.mjs` 第 61 条）：

```css
.css-var-_R_0_.ant-list, .css-var-_R_0_.ant-list-container{--ant-list-content-width:220px;…}
```

成因是 `genStyleHooks` 的 `extraCssVarPrefixCls`。⚠️ `.ant-list-container` 是 **grid 模式的
`Row`** 与**非 grid 模式的 `<ul>`** 共用的类名 ⇒ 它**不在** `.ant-list` 子树内的位置是
「`.ant-list > .ant-list-container`」（非 grid）或「`.ant-list > .ant-row.ant-list-container`」（grid）。
本仓按 **D95**（image 的两根 / input 的三根）判据：`genTokenDecls` 必须落在**两个选择器**上。

### 6.2 上游的 `-action` 是**死选择器**（UPSTREAM quirk）

产物第 57 条：`.ant-list .ant-list-item .ant-list-action{margin-inline-start:var(--ant-margin-sm);}`。
源码写的是 `[\`${componentCls}-action\`]`（`style/index.ts:157`），但 `Item` 渲染出的真实类名是
**`-item-action`** ⇒ 这条规则**永不命中**。⚠️ 与 radio 的 U7/U8 同类：**逐字保留**，
改成 `-item-action` 会凭空多出一条上游没有的视觉差异（且窄屏下 action 的左边距会变）。

### 6.3 两条 media query 的**空格写法不同**（必须逐字保留）

```css
@media screen and (max-width:768px)   /* screenMD —— 冒号后无空格 */
@media screen and (max-width: 576px)  /* screenSM —— 冒号后有空格 */
```

源码 `genResponsiveStyle` 就是这样写的（134 行 vs 152 行）。⚠️ 写统一了产物就与 antd 分叉；
L6 的 media 变体可能因此产生假差异。

---

## 7. 本分析**没有证明**什么

- **没有证明视觉正确** —— 那是 L6 逐像素的职责。
- **没有对拍过客户端行为** —— 分页切片、`useBreakpoint` 的响应式列数、`Spin` 的包裹效果
  都只在 SSR / jsdom 下观察过静态形态；真实交互归 L1 / L6。
- **没有验证 `virtual-list` 的 `--rc-virtual-list-scrollbar-bg` 是否真的被消费** ——
  List 自身不使用虚拟滚动（那是 `listy` 的能力），这条自定义属性在 List 里只是**透传给可能的内层**
  （如 `pagination` 无、`spin` 无）⇒ 本仓**逐字保留但不断言其效果**。
- **没有裁决 demo 的取舍** —— 上游 16 个 demo 里 `drag-sorting*`（3 个）依赖 `dnd-kit`
  （非 antd 依赖），是否移植需在 G11 单独判断并登记。
- **没有确认 `List` 与 `Listy` 的关系是否需要在 registry 里登记为「已被替代」** ——
  这是登记层面的问题（见 README §7），不是实现层面的。
