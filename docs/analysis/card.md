# Card · G1 分析产物

> 契约来源：antd 6.6.4 `/tmp/antd-repo/ant-design-master/components/card/`（源码）
> 与 `/tmp/antd-src/package/es/card/`（构建产物）。
> 规模 **1018 行源码 / 676 行产物 / 10 文件**：
> `Card.tsx` 319 + `style/index.ts` 502 + `CardMeta.tsx` 136 + `CardGrid.tsx` 38 + `index.tsx` 23。
> Component Token **13 个** + **4 个 `mergeToken` 派生**（`cardShadow` / `cardHeadPadding` /
> `cardPaddingBase` / `cardActionsIconSize`）。
> 用户可见 demo **14 个**。
> **先于实现存在**（`AGENTS.md` §2 步骤 3）。

## 0. 依赖面核查（**结论：无 foundation 缺口；2 处需登记**）

| antd 用的 | 本仓对应物 | 备注 |
|---|---|---|
| `_util/hooks/useSize` | `config-provider/size-context.ts` 的 **`useSize`** | ✅ 同名同义（`button` / `collapse` / `date-picker` 已用） |
| `form/hooks/useVariants` 的 `useVariant` | `form/hooks/useVariants.ts` 的 **`useVariant`** | ⚠️ **签名不同**：上游是位置参数 `useVariant('card', variant, bordered)`，本仓是**对象形态** `useVariant({ component, variant, legacyBordered })` ⇒ 调用点要改写（不是等价搬运） |
| `Skeleton` | `ui/src/skeleton`（**已 completed**） | `loading` 分支：`<Skeleton loading active paragraph={{rows:4}} title={false}>` |
| `Tabs` | `ui/src/tabs`（**已 completed**） | `tabList` 分支：`<Tabs size className="{p}-head-tabs" items />` |
| `@rc-component/util` 的 `omit` / `toArray` / `isReactRenderable` | `@apollo-design/utils`：`omit` / `toArray` / **`isRenderable`** | ✅ |
| `useMergeSemantic` / `useSemanticRootStyle` | `_internal/use-merge-semantic.ts`（后者叫 `semanticRootStyle`） | `Card` **7 槽**；`CardMeta` **5 槽** |
| `useComponentConfig('card')` | ✅（走 (B) 通道） | ⚠️ **类型未提升**（与 anchor / masonry / breadcrumb 一致） |
| 🚨 `useComponentConfig('cardMeta')` | ✅ 运行时可用 | ⚠️ **第二个组件配置键**（`CardMeta` 自己读 `components.cardMeta`）—— 同一组件族两个键，别漏 |
| `useCSSVarCls` | **无对应 hook** —— 直接拼 `${prefixCls}-css-var` | `rate` / `masonry` / `breadcrumb` 先例 |
| `genStyleHooks` + `mergeToken` | `genCardStyle` + `prepareComponentToken` + `COMPONENT_STYLES` 一行 | **有 4 个派生值**（手写 `calc` 或构建期算） |
| `resetComponent` / `genFocusStyle` | **手写展开**（`badge` 范式） | 见 §3 |

## 1. 组件面

`Card`（注册名 `ACard`）+ **两个复合子组件**：
`Card.Grid`（`CardGrid`）/ `Card.Meta`（`CardMeta`）—— 都**不是** deprecated。

```
CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>
  prefixCls? title?: ReactNode extra?: ReactNode
  bordered?(deprecated) headStyle?(deprecated) bodyStyle?(deprecated)
  style? className? rootClassName? id?
  loading? hoverable? children?
  size?: CardSize          // Exclude<SizeType,'large'> | 'default'(deprecated)
  type?: 'inner'
  cover?: ReactNode actions?: ReactNode[] tabList?: CardTabListType[]
  tabBarExtraContent? onTabChange? activeTabKey? defaultActiveTabKey? tabProps?
  classNames? styles?      // 语义化 7 槽（支持函数形态）
  variant?: 'borderless' | 'outlined'
```

### 🚨 三种 ref 形状（**不一样**，最容易搞错）

| 组件 | 上游 | 形状 |
|---|---|---|
| `Card` | `React.forwardRef<HTMLDivElement, CardProps>` | **ref 就是 DOM 元素本身**（不是 `{nativeElement}`） |
| `Card.Grid` | `forwardRef` + `useImperativeHandle` | `{ nativeElement: HTMLDivElement }` |
| `Card.Meta` | `forwardRef` + `useImperativeHandle` | `{ nativeElement: HTMLDivElement }` |

⇒ Vue 侧：`Card` 用 `expose` **元素本身**？—— 不行，Vue 的 `expose` 只暴露对象。
本仓按 `badge/Ribbon` 的既有约定统一成 `{ nativeElement }`（可空），并在 README 记
**一处与上游的形状差异**（UPSTREAM 的 `forwardRef` 在 Vue 没有对应物）。

### 其余类型

- `CardSize = Exclude<SizeType, 'large'> | 'default'`（`'default'` **已废弃** ⇒ 发告警，用 `'medium'`）
- `CardTabListType extends Omit<Tab, 'label'>`：`key: string` + `tab?(deprecated)` / `label?`
- `CardGridProps extends HTMLAttributes<HTMLDivElement>`：`prefixCls? className? hoverable?(默认 **true**) style?`
- `CardMetaProps`：`prefixCls? style? className? avatar? title? description? classNames? styles?`

## 2. 行为契约（逐条，给上游行号）

### 2.1 `Card` 的渲染骨架（`Card.tsx:305-312`）

```html
<div class="{p} …" style={mergedStyles.root} {...divProps}>
  {head}        <!-- 仅当 title | extra | tabs 可渲染 -->
  {coverDom}    <!-- 仅当 cover 可渲染 -->
  {body}        <!-- 仅当 loading 或 children.length -->
  {actionDom}   <!-- 仅当 actions.length -->
</div>
```

`divProps = omit(rest, ['onTabChange'])` —— ⚠️ `onTabChange` 从 DOM 属性里**摘掉**
（它是组件回调，不是 DOM 事件）。

### 2.2 `head` 的判据与结构（`:226-251`）

- 判据：`isRenderable(title) || isRenderable(extra) || tabs`（**三者任一**）。
- 结构：
  ```html
  <div class="{p}-head [semantic.header]" style={...headStyle, ...semantic.header}>
    <div class="{p}-head-wrapper">
      <div class="{p}-head-title [semantic.title]" style={semantic.title}>{title}</div>   <!-- 仅 title 可渲染 -->
      <div class="{p}-extra [semantic.extra]" style={semantic.extra}>{extra}</div>       <!-- 仅 extra 可渲染 -->
    </div>
    {tabs}   <!-- 在 head-wrapper **之外**、head **之内** -->
  </div>
  ```
- ⚠️ `headStyle`（deprecated）与 `semantic.header` **按顺序合并**：`{...headStyle, ...mergedStyles.header}`
  ⇒ 语义化槽**覆盖** `headStyle`。

### 2.3 `tabs` 分支（`:216-225`）

```jsx
const tabSize = mergedSize !== 'small' ? 'large' : mergedSize;   // ⚠️ 非 small 一律 'large'
<Tabs size={tabSize} {...tabProps} [activeKey|defaultActiveKey]={…} tabBarExtraContent
      className={`${prefixCls}-head-tabs`} onChange={onTabChange}
      items={tabList.map(({ tab, ...item }) => ({ label: tab, ...item }))} />
```

- ⚠️ `tabList` 的 `tab` → `label`（**`tab` 覆盖同名的 `label`**，因为 `label: tab` 写在前面、`...item` 在后？
  实际是 `{ label: tab, ...item }` ⇒ 若 item 里还有 `label`，**item.label 赢**）。
- ⚠️ **受控/非受控二选一**：`activeTabKey !== undefined` 时传 `activeKey`，否则传 `defaultActiveKey`
  （**不会同时传**）。
- ⚠️ `tabProps` 展开在 `size` 之后、受控键之前 ⇒ `tabProps.activeKey` 会被**覆盖**。

### 2.4 `body` / `loading`（`:200-204`、`:263-268`）

- `body` 仅在 `loading || childNodes.length` 时渲染。
- `loading` ⇒ 内容替换成 `<Skeleton loading active paragraph={{rows:4}} title={false}>{children}</Skeleton>`
  （⚠️ `title={false}`：骨架**没有**标题行）。
- `childNodes = toArray(children)`（`useMemo`）。

### 2.5 `actions`（`:88-109`、`:270-277`）

```html
<ul class="{p}-actions [semantic.actions]" style={semantic.actions}>
  <li style="width: {100/n}%"><span>{action}</span></li>   <!-- 每项 -->
</ul>
```

- ⚠️ `li` 的宽度是**内联百分比**（`100 / actions.length`）⇒ 数字必须转成**字符串**（`50%`）。
- ⚠️ key 是 `action-${index}`（上游注释解释了为什么用索引 key）。

### 2.6 根类名（`:281-299`）

```
{p}
contextClassName
{p}-loading          ← loading
{p}-bordered         ← variant !== 'borderless'（**注意是「不是 borderless」而不是「是 outlined」**）
{p}-hoverable        ← hoverable
{p}-contain-grid     ← 有 CardGrid 子元素（`child.type === CardGrid`）
{p}-contain-tabs     ← tabList?.length
{p}-small            ← mergedSize === 'small'
{p}-type-{type}      ← !!type
{p}-rtl              ← direction === 'rtl'
className / rootClassName / hashId / cssVarCls / semantic.root
```

⚠️ **`isContainGrid` 靠 vnode 身份比较**（`child.type === CardGrid`）⇒ Vue 侧是
`vnode.type === CardGrid`（与 `Breadcrumb` 的 children 校验同一手法）。

### 2.7 `CardMeta`（`CardMeta.tsx`）

- 前缀：`metaPrefixCls = `${getPrefixCls('card', prefixCls)}-meta``。
- 结构：
  ```html
  <div class="{p}-meta [className] [contextClassName] [semantic.root]" style={semantic.root} {...restProps}>
    {avatarDom}     <!-- 仅 avatar 可渲染：<div class="{p}-meta-avatar [semantic.avatar]"> -->
    {MetaDetail}    <!-- 仅 title|description 可渲染：<div class="{p}-meta-section …"> 包 title/description -->
  </div>
  ```
- ⚠️ `title` / `description` 在 `section` **里面**；`avatar` 在 `section` **外面**（并列）。
- ⚠️ 根上**没有** `-rtl`（`CardMeta` 不读 `direction`）。

### 2.8 `CardGrid`（`CardGrid.tsx`）

```html
<div class="{p}-grid [className] [-grid-hoverable 若 hoverable]" {...rest} />
```

- ⚠️ `hoverable` **默认 `true`**（与 `Card` 的 `hoverable` 默认 `false` **不同**）。
- ⚠️ 前缀取自 **`ConfigContext`**（`getPrefixCls('card', prefixCls)`）—— 有 `prefixCls` prop ✓
  （与 `BreadcrumbSeparator` 不同，那个连 prop 都没有）。

### 2.9 告警（`:149-152`、`:175-184`）

- `size="default"` ⇒ deprecated（用 `"medium"`）。
- `headStyle` / `bodyStyle` / `bordered` ⇒ deprecated（分别用 `styles.header` / `styles.body` / `variant`）
  —— 判据是 **`deprecatedName in props`**（传了才告警，传 `undefined` 也算「传了」）。

## 3. 样式契约（`style/index.ts` 502 行）

**13 个 Component Token**（`prepareComponentToken`）：

| token | 默认值 | 类型 |
|---|---|---|
| `headerBg` | `'transparent'`（**字面量**） | string |
| `headerFontSize` | `fontSizeLG` | number |
| `headerFontSizeSM` | `fontSize` | number |
| `headerHeight` | `fontSizeLG * lineHeightLG + padding * 2` | number |
| `headerHeightSM` | `fontSize * lineHeight + paddingXS * 2` | number |
| `actionsBg` | `colorBgContainer` | string |
| `actionsLiMargin` | `` `${paddingSM}px 0` ``（**字符串**） | string |
| `tabsMarginBottom` | `-padding - lineWidth`（**负数**） | number |
| `extraColor` | `colorText` | string |
| `bodyPaddingSM` | `12`（**字面量**） | number |
| `headerPaddingSM` | `12`（**字面量**） | number |
| `bodyPadding` | `token.bodyPadding ?? paddingLG` | number |
| `headerPadding` | `token.headerPadding ?? paddingLG` | number |

⚠️ **`token.bodyPadding` / `token.headerPadding` 不是标准 `AliasToken`** ——
它们来自 antd v4 的全局 token（迁移遗留）。在 antd 6 的 `AliasToken` 里**不存在**
⇒ 运行时恒 `undefined` ⇒ 实际取值是 `paddingLG`。
本仓：**不引入这两个键**，直接写 `paddingLG` 并在 README 记差异
（否则要么类型报错、要么引入两个永远为 `undefined` 的死键）。

**4 个 `mergeToken` 派生**（用户**不可**覆盖）：`cardShadow`(= `boxShadowCard`) ·
`cardHeadPadding`(= `padding`) · `cardPaddingBase`(= `paddingLG`) · `cardActionsIconSize`(= `fontSize`)。

样式分两块：`genCardStyle` + `genCardSizeStyle`。关键选择器（**必须从产物提取**）：
根（含 `-bordered` / `-hoverable` / `-contain-grid` / `-contain-tabs` / `-type-inner` / `-rtl`）·
`-head`（+ `-head-wrapper` / `-head-title` / `-extra` / `-head-tabs`）· `-cover` ·
`-body` · `-actions`（+ `> li` / `> li > span`）· `-grid`（+ `-grid-hoverable` / `-hoverable`）·
`-meta`（+ `-meta-avatar` / `-meta-section` / `-meta-title` / `-meta-description`）·
`-small` 的尺寸覆盖。

## 4. Vue 对应（平台差异）

| 上游 | 本仓 |
|---|---|
| `React.forwardRef`（`Card` 的 ref 是 DOM） | `expose({ nativeElement })`（统一形状，**记差异**） |
| `useImperativeHandle` | 同上 |
| `child.type === CardGrid` | `vnode.type === CardGrid` |
| `useVariant('card', v, bordered)` | `useVariant({ component: 'card', variant, legacyBordered })`（**签名改写**） |
| `toArray(children)` + `useMemo` | `computed` + `toArray(slots.default?.())` |
| `{...divProps}` 落到根 `<div>` | `inheritAttrs` + `mergeProps`（⚠️ `class` / `style` / `classNames` / `styles` 必须声明成 props） |
| `direction`（`useComponentConfig` 解构） | **必须** `useDirection()`（computed）—— **D27** |
| `onTabChange` prop | **prop**（不是 emits —— 上游是 `onTabChange`，无 `v-model`；C11 双发不适用） |

**文件形态**：`Card.vue`（默认 `.vue`）+ `CardMeta.vue` + `CardGrid.vue` +
`context.ts`?（`Card` **没有** context —— 它靠 props 下传，与 `Breadcrumb` 不同）
+ `interface.ts` + `style/`。

## 5. 预判差异

1. **D1**：默认根前缀 `apollo` vs `ant`。
2. **D15**：`.anticon` → `.apollo-icon`（`-actions` 里的图标字号 `cardActionsIconSize`）。
3. **`resetComponent` 展开**：box-sizing 块不产出（`BASE_CSS` 已覆盖）。
4. **`bodyPadding` / `headerPadding` 两个遗留 token 不落地**（见 §3）。
5. **`Card` 的 ref 形状**：上游是 DOM 本身，本仓是 `{ nativeElement }`（UPSTREAM）。
6. **`card` / `cardMeta` 两个组件配置键都未提升**进 `ConfigProvider` 的 (A) 通道
   （与 anchor / masonry / breadcrumb 一致）。
7. **`useVariant` 的调用签名**（对象形态）。

## 6. 本分析没有证明什么

1. **没跑过任何 oracle**：`isContainGrid` 的 vnode 身份比较、`tabs` 分支的 DOM、
   `Skeleton` 的骨架结构、`actions` 的 `width` 内联值，都要由 G10 实测。
2. **没数 `style/index.ts` 的规则条数**（502 行，比 breadcrumb 的 177 行多得多）
   ⇒ G4 前必须先跑一次 `extractStyle` 提取产物（`extract-cascader-css.mjs` 是模板）。
3. **没验证 `token.bodyPadding` / `headerPadding` 在 antd 6 里真的恒 `undefined`**
   （读的是 `prepareComponentToken` 的写法 + `AliasToken` 的类型面；G3 要用产物交叉验证）。
4. **没验证 `useVariant` 的 `enableVariantCls`** 在 `Card` 里有没有被消费（读码看没有 ⇒
   本仓 `useVariant` 的返回值可能只用 `variant`）。
5. **没评估 14 个 demo 的语义等价性**：`component-token` / `style-class` 预计不移植
   （与 breadcrumb 同判），`button-alignment-debug` / `no-body-debug` / `in-column` 是
   **调试 demo**（要看 antd 文档里是否对用户可见）。
6. **没确认 `Card` 的 `title` 与 HTML 的 `title` 属性冲突**：上游用
  `Omit<HTMLAttributes<HTMLDivElement>, 'title'>` 摘掉了 DOM 的 `title` ⇒
  Vue 侧要把 `title` 声明成 prop（否则落进 `attrs` 变成 tooltip）。
