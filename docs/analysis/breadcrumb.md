# Breadcrumb · G1 分析产物

> 契约来源：antd 6.6.4 `/tmp/antd-repo/ant-design-master/components/breadcrumb/`（源码）
> 与 `/tmp/antd-src/package/es/breadcrumb/`（构建产物）。
> 规模 **805 行源码 / 518 行产物 / 16 文件**：
> `Breadcrumb.tsx` 327 + `BreadcrumbItem.tsx` 122 + `style/index.ts` 177 +
> `useItemRender.tsx` 72 + `useItems.ts` 44 + `BreadcrumbSeparator.tsx` 31 +
> `index.tsx` 20 + `BreadcrumbContext.ts` 12。
> Component Token **7 个**（`itemColor` / `iconFontSize` / `linkColor` / `linkHoverColor` /
> `lastItemColor` / `separatorMargin` / `separatorColor`）+ **0 个 `mergeToken` 派生**
> （上游 `mergeToken(token, {})` 是空的 —— 与 anchor 的 4 个派生形成对比）。
> **先于实现存在**（`AGENTS.md` §2 步骤 3）。

## 0. 依赖面核查（**结论：无 foundation 缺口；1 处「组件配置类型未提升」需登记**）

| antd 用的 | 本仓对应物 | 备注 |
|---|---|---|
| `@ant-design/icons/DownOutlined` | `@apollo-design/icons` 的 `DownOutlined` | ✅ 已生成（848 图标）；它是 `dropdownIcon` 的**默认值** |
| **`Dropdown` 组件**（`menu` 特性用） | `ui/src/dropdown`（**已 completed**） | `placement="bottom"`；`menu` 分支的唯一硬依赖 |
| `@rc-component/util` 的 `pickAttrs` / `toArray` / `isNonNullable` / `isReactRenderable` | `@apollo-design/utils`：`pickAttrs` / `toArray` / `isNonNullable` / **`isRenderable`** | 改名已登记（`docs/rc-util-contract.md` §8） |
| `_util/is` 的 `isPlainObject` | `@apollo-design/utils` 的 `isPlainObject` | ✅ |
| `_util/reactNode` 的 `cloneElement` | **无对应物** | Vue 侧用 `cloneVNode`（`children` 路径，见 §4） |
| `useMergeSemantic` / `useSemanticRootStyle` | `_internal/use-merge-semantic.ts`（后者叫 `semanticRootStyle`） | 三个语义槽：`root` / `item` / `separator` |
| `useComponentConfig('breadcrumb')` | ✅（读 `context.components.breadcrumb`） | ⚠️ **类型**未提升，见下 |
| `useCSSVarCls` | **无对应 hook** —— 直接拼 `${prefixCls}-css-var` | `rate` / `masonry` 先例 |
| `genStyleHooks` + `mergeToken` | `genBreadcrumbStyle` + `prepareComponentToken` + `COMPONENT_STYLES` 一行 | 无派生值 |
| `resetComponent` / `genFocusStyle` | **手写展开**（`badge` 范式） | `resetComponent` 的 box-sizing 块**不产出**（`BASE_CSS` 已覆盖）；focus 用 `outline: var(--apollo-line-width-focus) solid var(--apollo-color-primary-border); outline-offset: 1px` |
| `iconCls`（`.anticon`） | 字面量 **`.apollo-icon`**（D15） | 样式里 4 处用它（含 `> svg` 的兄弟选择器） |
| `ConfigProvider` 的 `BreadcrumbConfig`（= `ComponentStyleConfig & Pick<BreadcrumbProps, 'classNames' \| 'styles' \| 'separator' \| 'dropdownIcon'>`） | `config-provider/interface.ts` **尚未提升 `breadcrumb`** ⇒ 走 (B) `components?: Record<string, ComponentConfigLike>` | ⚠️ **`anchor` / `masonry` 也没提升** ⇒ 与最近两轮一致；**登记为缺口**（运行时可用，只是类型宽） |

**唯一需要留意的「跨包接线」**：`separator` / `dropdownIcon` 两个 prop 有 **ConfigProvider 三级兜底**
（`prop ?? context ?? 默认`）。本仓 `useComponentConfig('breadcrumb')` 能读到
`components.breadcrumb`，所以**不需要**改 `context.ts`；只有**类型提升**（A 通道）没做。

## 1. 组件面

`Breadcrumb`（注册名 `ABreadcrumb`）+ **两个复合子组件**
（`index.tsx:19-21` 的 `Breadcrumb.Item = BreadcrumbItem` / `Breadcrumb.Separator = BreadcrumbSeparator`，
**都是 deprecated**）。内部另有 `InternalBreadcrumbItem`（**导出**，`BreadcrumbItem.tsx:42`）与
`renderItem`（**导出**，`useItemRender.tsx:30`）。

```
BreadcrumbProps<T extends AnyObject = AnyObject>
  prefixCls? params?: T separator? dropdownIcon?
  style? className? rootClassName? children?
  routes?: ItemType[]      // @deprecated 用 items
  items?: ItemType[]
  classNames? styles?      // 语义化：root / item / separator（**支持函数形态**）
  itemRender?: (route, params, routes, paths) => ReactNode
BreadcrumbRef = { nativeElement: HTMLElement }        // 不是 DOM 本身
```

`ItemType = Partial<BreadcrumbItemType & BreadcrumbSeparatorType>`：
`{ key?, href?, path?, title?, breadcrumbName?(deprecated), menu?, className?, style?,
   dropdownProps?, onClick?, children?(deprecated), [key: data-${string}]: string }`
∪ `{ type: 'separator', separator? }`。

⚠️ **泛型 `<T>` 的落地方式**：本仓 SFC **不用泛型**（无先例）⇒ `props` 用非泛型默认实例化，
`params` 是 `Record<string, unknown>`，泛型只留在**类型导出**里（`BreadcrumbProps<T>`）。
`itemRender` 的入参因此**不能写窄**（函数参数逆变 ⇒ TS2322）。

## 2. 行为契约（逐条，给上游行号）

### 2.1 三级兜底（`Breadcrumb.tsx:140-141`）

| 值 | 解析顺序 |
|---|---|
| `mergedSeparator` | `separator ?? contextSeparator ?? '/'` |
| `mergedDropdownIcon` | `dropdownIcon ?? contextDropdownIcon ?? <DownOutlined />` |

### 2.2 `items` 的合并（`useItems.ts:12-35`）

`items` 优先；否则 `routes.map(route2item)`；两者都没有 ⇒ **`null`**。
`route2item`：`breadcrumbName → title`，并把 `children` 折成
`menu = { items: children.map(({breadcrumbName, ...rest}) => ({...rest, title: breadcrumbName})) }`。

### 2.3 `items` 分支（`Breadcrumb.tsx:200-259`）

1. `paths: string[]` 逐项累积。
2. `getPath(params, path)`（`:97-106`）：`path === undefined` ⇒ 返回 `undefined`（**不 push**）；
   否则 `path.replace(/^\//, '')`，再把每个 `:${key}` 替换成 `params[key]`。
3. `type === 'separator'` ⇒ 渲染 `<BreadcrumbSeparator>{itemSeparator}</BreadcrumbSeparator>`，
   **不再走 item 分支**；`key = item.key ?? index`。
4. `isLastItem = index === mergedItems.length - 1`；`separator = isLastItem ? '' : mergedSeparator`。
5. `href`：`paths.length && mergedPath !== undefined` ⇒ **覆盖**为 `#/${paths.join('/')}`，
   否则用 item 自己的 `href`。
6. `pickAttrs(item, { data: true, aria: true })` 展开到 `InternalBreadcrumbItem`
   （**只取 `data-*` / `aria-*`**）。
7. children = `mergedItemRender(item, params, itemRoutes, paths, href)`
   （`itemRoutes = items || legacyRoutes`）。

### 2.4 `children` 分支（`Breadcrumb.tsx:260-274`）

`toArray(children).map(cloneElement(el, { separator: isLastItem ? '' : mergedSeparator, key: index }))`
—— **只覆盖这两个 prop**，不 pickAttrs、不注入 `prefixCls`。

### 2.5 `itemRender` / 默认渲染（`useItemRender.tsx:30-72`）

- 传了 `itemRender` ⇒ `itemRender(item, params, routes, path)` —— **只 4 个实参，没有 `href`**。
- 否则 `getBreadcrumbName(item, params)`：
  `isRenderable(title)` 为假 ⇒ `null`；`isPlainObject(title)` ⇒ **原样返回**（不替换参数）；
  否则 `String(title).replace(new RegExp(':(' + Object.keys(params).join('|') + ')', 'g'),
  (m, key) => params[key] || m)`。
  ⚠️ `params` 为空时正则是 `:()` —— `()` 是**空捕获组**，会匹配裸 `:`；回调里 `params['']`
  是 `undefined` ⇒ 回退 `replacement` ⇒ **净效果原样**。无害但必须照抄（别「顺手修」）。
  ⚠️ `params[key] || replacement`：`params[key]` 是 `0` / `''` 时**也回退**。
- `renderItem(prefixCls, item, children, href)`：
  `isRenderable(children)` 为假 ⇒ `null`；
  `href !== undefined` ⇒ `<a class="{p}-link {item.className}" href>`，
  否则 `<span class="{p}-link {item.className}">`；
  透传 `pickAttrs(item 去掉 className/onClick, {data,aria})` + `onClick`。

### 2.6 `BreadcrumbItem`（`BreadcrumbItem.tsx:42-102`）

- 有 `menu` ⇒ `Dropdown placement="bottom"`（合并 `dropdownProps`）包
  `<span class="{p}-overlay-link">{children}{dropdownIcon}</span>`；否则直接渲染 children。
- `menu.items` 映射：`label = label ?? title`；`path` 存在 ⇒ label 再包一层
  `<a href={`${href}${path}`}>`（⚠️ `href` 为 `undefined` 时会拼出字面量 `"undefined/…"` ——
  **上游如此，照抄**）；`key = key ?? index`。
- 外层：`<li class="{p}-item {semantic.item}" style={semantic.item}>{link}</li>`
  + **仅当** `isRenderable(separator)` 时追加 `<BreadcrumbSeparator>{separator}</BreadcrumbSeparator>`。
- `link` 为 `null` ⇒ **整个 item 返回 `null`**（`:88-101`）。

### 2.7 `BreadcrumbSeparator`（`BreadcrumbSeparator.tsx:14-25`）

`<li class="{p}-separator {semantic.separator}" style={semantic.separator} aria-hidden="true">`
，内容是 `children === '' ? children : children ?? '/'`。
⚠️ 它的 `prefixCls` 取自 **`ConfigContext` 的 `getPrefixCls('breadcrumb')`**（**不接 prop**）——
与 `AnchorLink` 同族（PITFALLS 272 的判据：**L4 基线生成器每个用例都要包 ConfigProvider**）。

### 2.8 根与 ref（`Breadcrumb.tsx:276-313`）

```html
<nav class="{p} {contextClassName} {-rtl}? {className} {rootClassName} {semantic.root} {hashId} {cssVarCls}"
     style={...semantic.root}  {...restProps}>
  <ol>{crumbs}</ol>
</nav>
```

- `-rtl` 落在 **`nav`（根）** 上（`direction === 'rtl'`）。
- `restProps` 展开在**最后** ⇒ 未知 prop 直接落到 `<nav>`。
- `useImperativeHandle(ref, () => ({ nativeElement }))` ⇒ **`BreadcrumbRef` 是对象**，
  不是 DOM。Vue 侧用 `expose({ nativeElement })`。

### 2.9 两条 deprecated 警告（`:170-196`）

`routes` → `items`；children（`Breadcrumb.Item` / `Breadcrumb.Separator`）→ `items`，
且**只接受这两个类型**作为 children（否则 `usage` 警告）。

## 3. 样式契约（`style/index.ts` 177 行）

**7 个 Component Token**（全部是**别名派生**，可被 `theme.components.Breadcrumb` 覆盖）：

| token | 默认值来源 | 消费点 |
|---|---|---|
| `itemColor` | `colorTextDescription` | `.{p}` 的 `color` |
| `lastItemColor` | `colorText` | `.{p}-item:last-child` |
| `iconFontSize` | `fontSize` | `.{p} .apollo-icon` |
| `linkColor` | `colorTextDescription` | `.{p}-item a` |
| `linkHoverColor` | `colorText` | `.{p}-item a:hover` / `.{p}-overlay-link:hover` |
| `separatorColor` | `colorTextDescription` | `.{p}-separator` |
| `separatorMargin` | `marginXS` | `.{p}-separator` 的 `margin-inline` |

规则清单（**选择器必须按 cssinjs 的嵌套语义展开**）：

- `.{p}`：`resetComponent` 展开（color / fontSize / box-sizing）+ `ol { display:flex;
  flex-wrap:wrap; margin:0; padding:0; list-style:none }`。
- `.{p} .apollo-icon { font-size: iconFontSize }` ← 注意 `iconCls` 是**后代**选择器。
- `.{p}-item a`：`linkColor` / `transition color` / `padding: 0 4px` / `borderRadiusSM` /
  `height: fontHeight` / `inline-block` / `margin-inline: -2px` /
  `:hover → linkHoverColor + colorBgTextHover` + focus 样式。
  ⚠️ 只作用于 **`a`** —— 非链接项（`<span>`）没有这层内边距与 hover。
- `.{p}-item:last-child { color: lastItemColor }`。
- `.{p}-separator { margin-inline: separatorMargin; color: separatorColor }`。
- `.{p}-link > svg`（**裸 svg**）：`inline-block` / `vertical-align: middle` /
  `margin-block-end: 0.2em`；`.{p}-link > .apollo-icon + span|a, > svg + span|a`
  → `margin-inline-start: marginXXS`。
- `.{p}-overlay-link`：`borderRadiusSM` / `height: fontHeight` / `inline-block` /
  `padding: 0 4px` / `margin-inline: -2px`；`> .apollo-icon` → `margin-inline-start: marginXXS`
  + `font-size: fontSizeIcon`；`:hover` → `linkHoverColor + colorBgTextHover`（**含内层 `a` 的 color**）；
  内层 `a:hover { background-color: transparent }`。
- `&.{p}-rtl { direction: rtl }` ← 上游写作 `&${token.componentCls}-rtl`（等价）。

## 4. Vue 对应（平台差异）

| 上游 | 本仓 |
|---|---|
| `cloneElement(element, {separator, key})` | `cloneVNode(el, {separator, key})`（`children` 路径） |
| `useItems` 的 `useMemo` | `computed` |
| `useImperativeHandle` | `expose({ nativeElement })` |
| `Breadcrumb.Item = …` 复合挂载 | `Object.assign(Component, { Item, Separator })` + `withInstall`（**21 个组件的既有写法**，`anchor/index.ts` 是最近的样板） |
| `restProps` 落到 `<nav>` | `inheritAttrs` 默认 true（⚠️ `class` / `style` / `classNames` / `styles` 必须**声明成 props**，否则落进 attrs 会与手工拼的 class **重复**） |
| `direction`（`useComponentConfig` 解构） | **必须** `useDirection()`（computed）—— 解构是快照（**D27**） |
| `isReactRenderable` | `isRenderable`（语义**已交叉验证一致**，见 §6.1） |

**文件形态**：`Breadcrumb.vue`（默认 `.vue`）+ `BreadcrumbItem.ts` / `BreadcrumbSeparator.ts`
（纯渲染函数型内部件 ⇒ `COMPONENT-RULES.md` §2 条件 1，**须在 README 记理由**）+
`context.ts`（`BreadcrumbContext`，provide 语义化 classNames/styles）+ `interface.ts` + `style/`。

⚠️ **`BreadcrumbSeparator` 的 prefixCls 来源**：上游不接 prop，取 `getPrefixCls('breadcrumb')`。
本仓要**照抄**（与 `AnchorLink` 同族）—— 否则 L4 的 `bare` 用例（自定义 `prefixCls`）会对不上。

## 5. 预判差异

1. **D1**：默认根前缀 `apollo` vs `ant`（`BreadcrumbSeparator` 同样受影响）。
2. **D15**：`.anticon` → `.apollo-icon`（样式里 4 处 + `dropdownIcon` 的实际类名）。
3. **`resetComponent` 展开**：box-sizing 块不产出（`BASE_CSS` 已覆盖，`spin` 范式）。
4. **泛型 `<T>`**：本仓非泛型实例化 ⇒ `params` 是 `Record<string, unknown>`；
   `itemRender` 的入参在测试里不能写窄。
5. **组件配置类型**：`breadcrumb` 未提升进 `ConfigProvider` 的 (A) 通道
   （与 `anchor` / `masonry` 一致）⇒ `components={{ breadcrumb: … }}` 类型宽。
6. **`dropdownIcon` 的视觉**：两侧图标数据同源（`@ant-design/icons-svg`），
   但类名不同（`anticon` vs `apollo-icon`）⇒ 若图标基础样式（`getIconStyle`）未接上，
   会出现 typography 那种「图标偏细」的残差（`matrix.mjs` 的 `LIMITATIONS` 已登记该根因）。

## 6. 两处**已实测**的关键结论

### 6.1 ✅ `isRenderable('')` 是 **false** ⇒ 最后一项后面**不会**多出空分隔符 `<li>`

本仓 `packages/utils/src/is.ts` 把 `''` 判为「无内容」。这是**可能错**的一步（若 rc-util
把 `''` 当可渲染，DOM 就会差一个 `<li class="-separator">`），所以直接读了依赖源码：

```js
// node_modules/.pnpm/@rc-component+util@1.13.0/…/es/is.js
export function isReactRenderable(value) {
  return isNonNullable(value) && value !== false && value !== '';
}
```

⇒ 语义**逐字一致** ✓。所以 `separator={isLastItem ? '' : mergedSeparator}` 的
`''` 会让 `isRenderable('')` 为假 ⇒ **不渲染**那个 `<li>`。
（`BreadcrumbSeparator` 里的 `children === '' ? children : …` 分支因此只在
「直接使用 `<Breadcrumb.Separator>''</…>`」或 `items` 里 `type:'separator'` + `separator:''` 时才可达。）

### 6.2 ✅ `item.style` **确实落不到 DOM**，`item.className` 只落到 `<a>` / `<span>`

**G10 已用机械 oracle 实测确认**（`tests/compat/baselines/breadcrumb.dom.json` 的
`breadcrumb:item-class-style`）：

```html
<li class="apollo-item">
  <a class="apollo-link item-cls" href="#/a">A</a>   <!-- ⚠️ 没有 style 属性 -->
</li>
```

`item.style: { color: 'red' }` **完全没有出现**；`item.className` 落到了 `<a>` 的
`class` 上。机制：`InternalBreadcrumbItem` 的解构里**没有 `className` / `style`**，
而 `renderItem` 把 `className` 拼进链接元素的 `class`、把 `style` 丢掉
（`pickAttrs({data,aria})` 也不收它）。

**归属**：UPSTREAM quirk（照抄）。⚠️ 上游测试**没有**覆盖这一点
（`Breadcrumb.test.tsx` 里只有 `styles` 语义化的用例）—— 是本仓的 L4 契约先发现的。

### 6.3 ✅ 分隔符的**类名与前缀**：`-breadcrumb-separator` vs `-item` / `-link`

同一份基线还确认了一条容易看漏的结构：

```html
<li class="apollo-item">        <!-- 用传进来的 prefixCls（`apollo`） -->
<li class="apollo-breadcrumb-separator" aria-hidden="true">/</li>   <!-- 用根前缀！ -->
```

`BreadcrumbSeparator` 取的是 `getPrefixCls('breadcrumb')` —— **ConfigProvider 的根前缀**，
与 `Breadcrumb` 的 `prefixCls` prop **无关**（它连 prop 都没有）。
⇒ 传 `prefixCls: 'apollo'` 时，item/link 是 `apollo-item` / `apollo-link`，
而分隔符是 `apollo-breadcrumb-separator`。**两侧行为一致**（PITFALLS 272 同族）。
⇒ 这也是 L4 基线生成器**每个用例都要包 `ConfigProvider`** 的原因。

### 6.4 ✅ 另外三条实测结论

| 输入 | 实测 DOM |
|---|---|
| `separator: ''` | **完全没有**分隔符 `<li>`（`isRenderable('')` 为假） |
| `items: [{title: ''}]` | **整项不渲染**（`renderItem` 的 `isRenderable(children)` 拦下） |
| `type:'separator'` + `separator: ''` | 渲染一个**空**的 `<li class="-separator" aria-hidden="true"></li>`（那条分支**可达**） |

## 7. 本分析没有证明什么

1. **没跑过任何 oracle**：`item.style` / `item.className` 的落点（§6.2）、
   `href = '#/' + paths.join('/')` 的确切字符串、`type:'separator'` 的 DOM，
   都只是**读码结论**，须由 G10（`tests/compat/baseline/breadcrumb.mjs`）实测。
2. **没实测 `menu` 分支的浮层 DOM**：它依赖 `Dropdown` 的 portal / motion，
   G1 阶段只确认了「本仓有 Dropdown 且已 completed」。
3. **没数 demo 的语义等价性**：上游 9 个用户可见 demo
   （`basic` / `separator` / `separator-component` / `withIcon` / `withParams` /
   `overlay` / `style-class` / `component-token` / `debug-routes`，另 `_semantic.tsx` 是
   `demo-semantic.test.tsx` 的夹具）—— 哪些能在本仓等价落地要到 G11 才定。
4. **没验证 `restProps` 与 Vue `attrs` 的等价边界**：上游把 `className` / `style`
   解构掉（不进 restProps），Vue 侧靠「声明成 props」达到同样效果 ——
   但「声明成 props 后 `class` 还能不能合并到根」要在 G4 实测（PITFALLS 3 同族）。
5. **没验证 `new RegExp(':(' + keys.join('|') + ')')` 在 `params` 为空/含正则元字符时的行为**
   （如 `params` 的 key 含 `.` / `|`）—— 上游直接拼接，**未转义**。
6. **没评估 `itemRender` 只传 4 参**（无 `href`）对自定义渲染的影响面。
