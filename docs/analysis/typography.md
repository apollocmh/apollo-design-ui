# 组件分析：Typography

| 项 | 值 |
|---|---|
| 组件名 | `typography` |
| 导出名 | `Typography`（+ `Typography.Text` / `Typography.Title` / `Typography.Paragraph` / `Typography.Link`） |
| antd 版本 | 6.6.4 |
| 分组 | 通用 |
| 优先级 | P0 |
| 复杂度 | M（**实测偏高**，见 §1） |
| 分析日期 | 2026-09-20 |

## 0. 参考来源

| 类型 | 路径 |
|---|---|
| antd 产物（ESM + 类型） | `/tmp/antd-src/package/es/typography/` |
| antd 源码 | `/tmp/antd-repo/ant-design-master/components/typography/` |
| antd 测试 | `components/typography/__tests__/`（12 个文件） |
| antd demo | `components/typography/demo/`（15 个 .tsx） |

**已阅读的文件**：

- [x] `Typography.tsx` / `Text.tsx` / `Title.tsx` / `Paragraph.tsx` / `Link.tsx` / `Editable.tsx` / `index.tsx`
- [x] `Base/index.tsx`（622 行，主实现）/ `Base/Ellipsis.tsx`（327 行，测量）/ `Base/CopyBtn.tsx` / `Base/EllipsisTooltip.tsx` / `Base/util.ts`
- [x] `hooks/useCopyClick.ts` / `useMergedConfig.ts` / `usePrevious.ts` / `useTooltipProps.ts` / `useTypographySemantic.ts`
- [x] `style/index.ts` / `style/mixins.ts`
- [x] `es/typography/**/*.d.ts`（全部）
- [x] `components/style/index.tsx` 的 `operationUnit` / `textEllipsis` / `genFocusOutline` / `genFocusStyle` / `resetComponent`
- [x] `components/_util/copy.ts` / `toList.ts` / `is.ts`（`isPlainObject`）
- [x] `components/locale/en_US.ts` / `zh_CN.ts` 的 `Text` 段

## 1. 规模评估

| 指标 | 值 |
|---|---|
| antd 构建产物行数 | 1499（`derived.antdBuildLineCount`） |
| antd 文件数 | 38 |
| demo 数量 | 15 |
| 测试文件数 | 12 |
| rc 依赖 | `@rc-component/util`（`omit`/`toArray`/`useControlledState`/`useDelayState`/`useLayoutEffect`/`KeyCode`）→ `@apollo-design/utils` 替代；`@rc-component/resize-observer` → `utils/observers/useResizeObserver`；`@rc-component/input` 的 `AutoSizeType` → 仅类型，见 §9.2 |
| 依赖的组件 | **无**（`config-provider` 仅类型） |
| 依赖的 foundation | `icons` / `theme` / `utils`（全部 completed）+ `locale`（`Text` 段） |
| 叶子模块 | `input/TextArea`（**未落地**，见 §9.2） |
| Component Token 数 | **2 个**：`titleMarginTop` / `titleMarginBottom` |
| complexity 判定 | M —— 但它是**复合组件**：5 个对外组件 + 3 个能力（ellipsis / copyable / editable），实际工作量接近 L |

### 1.1 组件分解（antd 的真实结构）

```
Typography            → 薄包装，渲染动态标签（默认 article），只支持 root 语义
└─ InternalTypography → 同上（内部）

Text / Title / Paragraph / Link → 薄包装，各自固定 component（span / h1-h5 / div / a）
└─ Base               → 全部逻辑：装饰 / type / disabled / ellipsis / copyable / editable
   ├─ Editable        → 编辑态（依赖 TextArea）
   ├─ EllipsisMeasure → 测量 + 逐字二分裁剪
   │  └─ MeasureText  → 隐藏的测量容器（position:fixed）
   ├─ CopyBtn         → 复制按钮（依赖 Tooltip）
   └─ EllipsisTooltip → 省略号悬浮提示（依赖 Tooltip）
```

**关键结论**：`Typography` 与 `Text/Title/Paragraph/Link` 走**两条不同的实现路径** ——
前者是 `Typography → InternalTypography`，后者是 `X → Base → InternalTypography`。
`Typography` 本身**不支持** ellipsis / copyable / editable（它的 props 里没有这三个）。

## 2. API 面

### 2.1 Props

#### `TypographyProps`（`Typography` 本体，`Typography.d.ts`）

| 名称 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `component` | `keyof JSX.IntrinsicElements` | `'article'` | 渲染的标签（`@internal`） |
| `prefixCls` | `string` | ConfigProvider，兜底 `apollo` | |
| `className` / `rootClassName` | `string` | — | 都落根元素 |
| `style` | `CSSProperties` | — | |
| `classNames` | `{ root? }` | — | 语义化 |
| `styles` | `{ root? }` | — | 语义化 |
| `direction` | `'ltr' \| 'rtl'` | ConfigProvider | |

#### `BlockProps`（`Text` / `Title` / `Paragraph` / `Link` 的公共面，`Base/index.d.ts`）

| 名称 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `actions` | `{ placement?: 'start' \| 'end' }` | `placement: 'end'` | **v6.4.0 新增**：操作区位置 |
| `title` | `string` | — | 原生 title（也是 ellipsis tooltip 的候选） |
| `editable` | `boolean \| EditConfig` | — | |
| `copyable` | `boolean \| CopyConfig` | — | |
| `type` | `'secondary' \| 'success' \| 'warning' \| 'danger'` | — | |
| `disabled` | `boolean` | — | |
| `ellipsis` | `boolean \| EllipsisConfig` | — | |
| `code` / `mark` / `underline` / `delete` / `strong` / `keyboard` / `italic` | `boolean` | — | 装饰，**嵌套顺序固定**（见 §6.3） |
| `prefixCls` / `className` / `rootClassName` / `style` / `classNames` / `styles` / `direction` / `id` / `aria-label` | 同上 | | `component` 是 `@private` |
| 其余 `HTMLAttributes` | — | | 透传 |

`TextProps` 额外：`ellipsis?: boolean | Omit<EllipsisConfig, 'expandable' | 'rows' | 'onExpand'>`
（**运行时告警**：传了 `expandable` / `rows` 会警告，且会被 `omit` 掉）。
`LinkProps` 额外：`ellipsis?: boolean`（**仅布尔**，传对象会告警）；
`rel` 未传且 `target="_blank"` 时自动补 `noopener noreferrer`。
`TitleProps`：`level?: 1|2|3|4|5`（默认 1，非法值兜底 `h1` 并告警）；**Omit 掉 `strong`**。

#### `CopyConfig`

| 名称 | 类型 | 说明 |
|---|---|---|
| `text` | `string \| (() => string \| Promise<string>)` | 未传时用 children 拼接（`toList(children, {skipEmpty:true}).join('')`） |
| `onCopy` | `(event?) => void` | |
| `icon` | `ReactNode \| [ReactNode, ReactNode]` | `[未复制, 已复制]` |
| `tooltips` | `ReactNode \| [ReactNode, ReactNode]` | `[未复制, 已复制]` |
| `format` | `'text/plain' \| 'text/html'` | |
| `tabIndex` | `number` | |

#### `EditConfig`

| 名称 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `text` | `string` | children（字符串时） | 编辑初值 |
| `editing` | `boolean` | — | 受控 |
| `icon` | `ReactNode` | `<EditOutlined />` | |
| `tooltip` | `ReactNode \| false` | locale `edit` | |
| `onStart` / `onChange` / `onCancel` / `onEnd` | 回调 | — | |
| `maxLength` | `number` | — | |
| `autoSize` | `boolean \| AutoSizeType` | `true` | |
| `triggerType` | `('icon' \| 'text')[]` | `['icon']` | |
| `enterIcon` | `ReactNode` | `<EnterOutlined />` | `null` 时不渲染 |
| `tabIndex` | `number` | — | |

#### `EllipsisConfig`

| 名称 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `rows` | `number` | `1` | |
| `expandable` | `boolean \| 'collapsible'` | `false` | `'collapsible'` 时展开后仍可收起 |
| `suffix` | `string` | — | 追加在省略号后 |
| `symbol` | `ReactNode \| ((expanded) => ReactNode)` | locale `expand`/`collapse` | |
| `defaultExpanded` | `boolean` | `false` | |
| `expanded` | `boolean` | — | 受控 |
| `onExpand` | `(e, { expanded }) => void` | — | |
| `onEllipsis` | `(ellipsis: boolean) => void` | — | **仅变化时触发** |
| `tooltip` | `ReactNode \| TooltipProps` | — | `true` → 用 `editConfig.text ?? children` |

### 2.2 Events（Vue emit）

| antd 回调 | Vue emit | payload |
|---|---|---|
| `onCopy` | `copy` | `(event: MouseEvent)` |
| `onStart` | `start` | `()` |
| `onChange` | `change` | `(value: string)` |
| `onCancel` | `cancel` | `()` |
| `onEnd` | `end` | `()` |
| `onExpand` | `expand` | `(e: MouseEvent, info: { expanded: boolean })` |
| `onEllipsis` | `ellipsis` | `(ellipsis: boolean)` |
| `update:editing` | `update:editing` | `(editing: boolean)` |
| `update:expanded` | `update:expanded` | `(expanded: boolean)` |

**注意**：`copy` / `start` / `change` / `cancel` / `end` / `expand` / `ellipsis` 都是**配置对象里的回调**，
不是组件顶层 prop。Vue 侧保留同名配置键（函数），同时**额外** emit 同名事件（便于 `@change` 监听）。
优先级：配置对象里的回调先执行，再 emit 事件。

### 2.3 Slots

| slot | 说明 | slot props |
|---|---|---|
| `default` | 内容（antd 的 `children`） | — |
| `icon` | `copyable.icon` 的插槽形态（`[未复制, 已复制]` 用两个具名插槽 `copyIcon` / `copiedIcon`） | — |
| `enterIcon` | 编辑态的确认图标 | — |
| `symbol` | `ellipsis.symbol` 的插槽形态 | `{ expanded: boolean }` |
| `expandIcon` / `collapseIcon` | 展开/收起图标 | — |

⚠️ 规则 C8：prop 与插槽同时存在时 **prop 优先**。

### 2.4 方法（Expose）

| 方法 | 说明 |
|---|---|
| `nativeElement` | 根元素（`HTMLElement \| null`） |

antd 的 `Base` **没有** `defineExpose`（它只 `forwardRef` 到根元素）。
`ref` 在 Vue 侧即 `nativeElement`。

### 2.5 静态方法 / 子组件

- 无静态方法。
- 子组件：`Typography.Text` / `Typography.Title` / `Typography.Paragraph` / `Typography.Link`
  —— 与 antd 的 `Typography.Text = Text` 同构（规则 R17）。
- 同时具名导出 `TypographyText` / `TypographyTitle` / `TypographyParagraph` / `TypographyLink`
  （规则 C1：`<a-typography-text>` 与 `<TypographyText>` 两种用法）。

## 3. 类型面

### 3.1 关键类型名（规则 C17：与 antd 一致）

`TypographyProps` / `BaseTypographyProps` / `BlockProps` / `TextProps` / `TitleProps` /
`ParagraphProps` / `LinkProps` / `CopyConfig` / `EditConfig` / `EllipsisConfig` /
`ActionsConfig` / `BaseType` / `TypographySemanticType` / `TypographySemanticAllType` /
`TypographyRef`。

⚠️ antd 的 `EditConfig` 是**非导出**的 `interface`（`Base/index.d.ts` 里没有 `export`）。
我们**导出**它（`EditConfig`）—— 否则 Vue 侧的 `editable` prop 类型无法被使用者引用。
这是一条 INTENDED 差异（登记 D-typography-1）。

### 3.2 类型映射（规则 C16 / C18 / C19）

| antd | Vue |
|---|---|
| `React.ReactNode` | `VNodeChild` |
| `React.CSSProperties` | `CSSProperties`（from `vue`） |
| `React.MouseEvent<HTMLElement>` | `MouseEvent` |
| `children` | 默认插槽（**不出现在 Props**） |
| `AutoSizeType`（`@rc-component/input`） | 本项目自定义 `AutoSizeType`（`{ minRows?; maxRows? } \| boolean`） |
| `TooltipProps` | 本项目不定义（Tooltip 未落地，见 §9.2） |

### 3.3 类型测试要点

- 正例：`level` 只接受 `1|2|3|4|5`；`type` 只接受 4 个枚举；`copyable` 接受 `boolean | CopyConfig`。
- 负例：`level: 6` 报错；`ellipsis: { rows: 2, expandable: true }` 在 `TextProps` 上报错
  （`Omit<..., 'expandable' | 'rows' | 'onExpand'>`）；`TitleProps` 上 `strong` 报错（被 Omit）。

## 4. DOM 结构

### 4.1 稳定契约

**`Typography` 本体**（`component` 默认 `article`）：

```html
<article class="apollo-typography [apollo-typography-rtl] [className] [rootClassName] [classNames.root]">
  {children}
</article>
```

**`Text`（`component="span"`）无 ellipsis 时**：

```html
<span class="apollo-typography [apollo-typography-secondary|-success|-warning|-danger] [apollo-typography-disabled] [className]">
  {装饰包裹后的 children}
</span>
```

**`Title`（`level=1` → `h1`）**：`<h1 class="apollo-typography">…</h1>`

**`Paragraph`**：`<div class="apollo-typography">…</div>`

**`Link`**：`<a class="apollo-typography apollo-typography-link">…</a>`

⚠️ `component === 'a'` 时才加 `-link` 类名（**不是**看 `type`）。`Link` 传的是 `component="a"`。

**装饰的嵌套顺序（外层 → 内层）**：`strong → u → del → code → mark → kbd → i`。
即 `wrapperDecorations` 里 `wrap` 的调用顺序；**最内层是 `i`**。

**ellipsis 时**（`rows=1`，CSS 省略）：

```html
<span class="apollo-typography apollo-typography-ellipsis apollo-typography-ellipsis-single-line">…</span>
```

`rows>1` 时用 `-ellipsis-multiple-line` + 内联 `-webkit-line-clamp`。

**操作区**（`copyable` / `editable` / `expandable` 任一存在时）：

```html
<span class="apollo-typography-actions [apollo-typography-actions-start]">
  [<button class="apollo-typography-expand|-collapse" aria-label="Expand|Collapse">…</button>]
  [<button class="apollo-typography-edit" aria-label="Edit" tabindex>…</button>]
  [<button class="apollo-typography-copy [apollo-typography-copy-success] [apollo-typography-copy-icon-only]" aria-label="Copy|Copied">…</button>]
</span>
```

**编辑态**（`editing === true` 时**整棵树被替换**）：

```html
<div class="apollo-typography apollo-typography-edit-content [apollo-typography-rtl] [apollo-typography-{component}]">
  <textarea class="…" rows="1" aria-label="…" />
  <span role="img" class="…-edit-content-confirm">…</span>
</div>
```

### 4.2 `data-*`

antd 的 Typography **不输出任何 `data-*` 属性**（与 Divider/Spin 不同）。
契约靠类名与 `aria-*`。

## 5. ARIA

| 场景 | 属性 |
|---|---|
| ellipsis 且 `topAriaLabel` 存在 | 根元素 `aria-label={topAriaLabel}`，内容包一层 `<span aria-hidden>` |
| 省略号本身 | `<span aria-hidden>...</span>` |
| expand 按钮 | `aria-label={expanded ? collapse : expand}`（locale） |
| edit 按钮 | `aria-label={tooltip 文案或 locale edit}` |
| copy 按钮 | `aria-label={tooltip 文案或 locale copy/copied}` |
| 编辑态 textarea | `aria-label` 透传 |
| `role="img"` | 图标自带（icons 包） |

`topAriaLabel` 的判据：`(!enableEllipsis || cssEllipsis) ? undefined : [editConfig.text, children, title, tooltipProps.title].find(isValidText)`。
`isValidText = (v) => ['string','number'].includes(typeof v)`。

## 6. 行为规格

### 6.1 状态机（`R15`：≥3 状态 / ≥5 转移必须描述）

**editing**：

| 当前 | 事件 | 下一状态 | 副作用 |
|---|---|---|---|
| 非编辑 | 点 edit 图标 | 编辑 | `onStart()` |
| 非编辑 | 点根元素（`triggerType` 含 `'text'`） | 编辑 | `onStart()` |
| 编辑 | Enter（keyup，且非 IME / 无修饰键） | 非编辑 | `onChange(trim 后的值)` + `onEnd()` |
| 编辑 | Esc | 非编辑 | `onCancel()` |
| 编辑 | blur | 非编辑 | `onChange(trim 后的值)` |
| 编辑→非编辑 | 渲染后 | — | `editIconRef.focus()`（焦点归还，仅在**从编辑态退出**时） |

`editing` 是**受控/非受控**双通道：`useControlledState(false, editConfig.editing)`。

**expanded**：`useControlledState(defaultExpanded || false, ellipsisConfig.expanded)`。
`onExpandClick(e, { expanded: !expanded })` → `setExpanded` + `onExpand(e, info)`。

**copied**：点击 copy → `copied=true`（立即）→ `copied=false`（3000ms 后）；
`copyLoading` 在复制 Promise 期间为 `true`。

### 6.2 ellipsis 的判定链（最容易写错）

```
enableEllipsis = Boolean(ellipsis prop)              // useMergedConfig
mergedEnableEllipsis = enableEllipsis && (!expanded || expandable === 'collapsible')
needMeasureEllipsis = mergedEnableEllipsis && (suffix !== undefined || onEllipsis || expandable || enableEdit || enableCopy)
canUseCssEllipsis = needMeasureEllipsis ? false : (rows === 1 ? isTextOverflowSupport : isLineClampSupport)
cssEllipsis = canUseCssEllipsis && mergedEnableEllipsis
needNativeEllipsisMeasure = cssEllipsis && !!tooltipProps.title
isMergedEllipsis = mergedEnableEllipsis && (cssEllipsis ? needNativeEllipsisMeasure && isNativeEllipsis : isJsEllipsis)
cssTextOverflow = mergedEnableEllipsis && rows === 1 && cssEllipsis
cssLineClamp = mergedEnableEllipsis && rows > 1 && cssEllipsis
```

`isStyleSupport('webkitLineClamp')` / `isStyleSupport('textOverflow')` 用 `document.createElement`
+ `style` 探测（jsdom 下恒为 `true`，因为 jsdom 的 `CSSStyleDeclaration` 接受任意属性名）。

### 6.3 `wrapperDecorations` 顺序（契约）

`strong → u → del → code → mark → kbd → i`（依次**向内**包裹）。
`DECORATION_PROPS` 是 `['delete','mark','code','underline','strong','keyboard','italic']`，
它们从透传属性里被 `omit` 掉（不进 DOM）。

### 6.4 `style` 合并顺序

`Typography`：`mergedStyle = { ...styles.root, ...style }`（`style` 覆盖 `styles.root`）。
`Base` 走 `useMergeSemantic`：`[contextStyles, semanticRootStyle(contextStyle), styles, semanticRootStyle(style)]`。
`Base` 的根样式还额外叠 `{ WebkitLineClamp: cssLineClamp ? rows : undefined }`（**在 style 之后**）。

### 6.5 边界条件

| 输入 | 行为 |
|---|---|
| `copyable.text` 未传且 children 非字符串 | 拼接 `toList(children, {skipEmpty:true}).join('')` |
| `copyable` 且 children 不可渲染 | 按钮加 `-copy-icon-only` |
| `editable.text` 未传 | `typeof children === 'string' ? children : ''` |
| `editable` 但 `triggerType` 不含 `'icon'` | **不渲染** edit 按钮（只支持点击文本触发） |
| `Link` 且 `target="_blank"` 且 `rel` 未传 | `rel="noopener noreferrer"` |
| `Title` 且 `level` 非法 | 兜底 `h1` + 告警 |
| `Text` 且 `ellipsis` 含 `expandable`/`rows` | 告警 + `omit` 掉这两个键 |
| `type` 且 `component === 'a'` | `-link` 与 `-{type}` 同时存在（CSS 用 `.apollo-typography-link.apollo-typography-danger` 等选择器） |

## 7. Component Token

```ts
interface ComponentToken {
  /** @desc 标题上间距 @descEN Margin top of title */
  titleMarginTop: number | string;      // 默认 '1.2em'
  /** @desc 标题下间距 @descEN Margin bottom of title */
  titleMarginBottom: number | string;   // 默认 '0.5em'
}
export const prepareComponentToken = () => ({
  titleMarginTop: '1.2em',
  titleMarginBottom: '0.5em',
});
```

⚠️ 与 Divider 同一处境：两个字面量 token 在零运行时管线里**内联**（唯一真源在 `style/token.ts`），
`theme.components.Typography` 的运行时覆盖落点是「Component Token → CSS 变量」那段管线（缺口登记 README）。

## 8. 依赖面

| 依赖 | 用途 | 状态 |
|---|---|---|
| `@apollo-design/icons` | `EditOutlined` / `CopyOutlined` / `CheckOutlined` / `LoadingOutlined` / `EnterOutlined` | ✅ |
| `@apollo-design/utils` | `omit` / `toList` / `useControlledValue` / `useDelayState` / `useResizeObserver` / `devUseWarning` / `isPlainObject`(=`is.ts`) / `KeyCode` / `composeRef` | ✅ |
| `@apollo-design/theme` | `AliasToken` / `token2CSSVar` | ✅ |
| `@apollo-design/locale` | `useLocale('Text')` → `edit`/`copy`/`copied`/`expand`/`collapse` | ✅ |
| `config-provider/context` | `useComponentConfig('typography')` / `useDirection` | ✅ |
| `_internal/use-merge-semantic` | 语义化合并 | ✅ |
| **`input/TextArea`** | `Editable` 的输入框 | ❌ **未落地** → §9.2 |
| **`tooltip`** | `CopyBtn` / `EllipsisTooltip` | ❌ **未落地** → §9.2 |

### 8.1 `useResizeObserver` 可直接复用（不重复造）

`packages/utils/src/observers/use-resize-observer.ts` 的契约**就是** `@rc-component/resize-observer`
（全局单例 + 元素→回调集合），且注释明确说明「typography 是 5 个消费者之一」。
所以 `ellipsis` 的宽度监听直接用它，**不新增封装**。

⚠️ 差异：`@rc-component/resize-observer` 是**组件**（`<ResizeObserver onResize>` + render prop），
我们是 **composable**（`useResizeObserver({ target, onResize, disabled })`）。语义等价（PLATFORM）。

### 8.2 未落地的两个依赖（诚实登记，不假装实现）

`input/TextArea` 与 `tooltip` 都**不在**已收口组件里（`packages/ui/src/` 只有 `empty` / `divider` /
`spin` / `config-provider` / `form` 骨架）。两条路：

| 选项 | 代价 |
|---|---|
| A. 等它们落地再做 Typography | 阻塞 P0；而 Typography 是 50 个下游的解锁点之一 |
| B. 先做**不依赖**它们的部分，两个依赖的能力用最小替身 + 登记差异 | `editable` / `copyable` 的 DOM 与 antd 有可测差异 |

**选 B**，理由：`ellipsis` 是 Typography 的**主要复杂度**且**不依赖** Tooltip / TextArea
（只依赖 `ResizeObserver` + `useLocale`）。先把核心 + ellipsis 做扎实，比「等 Tooltip」有价值。

替身与差异：
- `copyable`：**不包 Tooltip**（复制按钮本体、类名、`aria-label`、copied 状态机全部一致；
  差异只有「悬浮不出现提示」）。→ 登记 **D-typography-2**（`UNDECIDED`，落点是 Tooltip 落地后补齐）。
- `editable`：用**原生 `<textarea>`** 而非 `TextArea`（结构、事件、状态机一致；
  差异是 `textarea` 上没有 `apollo-input*` 类名与 autosize 行为）。→ 登记 **D-typography-3**（`UNDECIDED`）。

## 9. 差异预判

### 9.1 会进 `COMPATIBILITY.md` §9 的差异

| # | React | Vue | 分类 | 理由 |
|---|---|---|---|---|
| D-typography-1 | `EditConfig` 未导出 | 导出 `EditConfig` | INTENDED | Vue 使用者需要引用该类型 |
| D-typography-2 | `copyable` / `ellipsis.tooltip` 包 Tooltip | 暂不包 | UNDECIDED | Tooltip 未落地 |
| D-typography-3 | `editable` 用 `TextArea` | 原生 `textarea` | UNDECIDED | Input 未落地 |
| D-typography-4 | `ResizeObserver` 组件形态 | `useResizeObserver` composable | PLATFORM | 组件 vs composable |
| D-typography-5 | 每次渲染重建 `mergedProps` | `computed` 缓存 | PLATFORM | 响应式模型 |
| D-typography-6 | `component` prop 接受任意标签 | 只接受已知标签的联合 + `string` 逃生口 | PLATFORM | Vue 无 `JSX.IntrinsicElements` |

### 9.2 已知缺口（不是差异，是我们没做）

| 缺口 | 原因 | 落点 |
|---|---|---|
| 悬浮提示（copy / edit / ellipsis） | Tooltip 未落地 | Tooltip 收口后补 |
| `editable` 的 autosize | TextArea 未落地 | Input 收口后补 |
| 运行时改 `theme.components.Typography` | Component Token → CSS 变量管线未落地 | theme 管线补 |

## 10. 测试矩阵

| 层 | 文件 | 覆盖 |
|---|---|---|
| L1 | `__tests__/index.test.ts` | 5 个组件的标签/类名/装饰/type/disabled/style 合并/告警/expose |
| L2 | `__tests__/ellipsis.test.ts`、`copy.test.ts`、`editable.test.ts` | 测量裁剪、复制状态机、编辑状态机（含键盘、IME、焦点归还） |
| L3 | `__tests__/type.test-d.ts` | level 枚举 / Omit 负例 / 语义化函数式 / expose |
| L4 | `__tests__/semantic.test.ts` | 与 `tests/compat/baselines/typography.dom.json` 逐节点比对 |
| L5 | `__tests__/a11y.test.ts` | axe 0 violation + 键盘可达 + `aria-label` |
| L6 | `tests/visual/` | 6 个用例 × 3 viewport |
| L7 | `tests/build/run.mjs` | 产物无 React / CSS 变量声明完整 |
| demo | `__tests__/demo.test.ts` | 每个 demo 渲染无报错 |
| theme | `__tests__/theme.test.ts` | 四态渲染 + 字面值来源 |

## 11. 实现决策

1. **`Base.vue` 承载全部逻辑**（对齐 antd 的 `Base`），`Text/Title/Paragraph/Link` 是薄包装。
2. **`Typography.vue` 独立实现**（对齐 antd 的 `InternalTypography`，不支持三大能力）。
3. **`EllipsisMeasure` 用 `.ts` + `h()`**（`COMPONENT-RULES.md` §2 允许的唯一条件 1：
   纯渲染函数型内部件）。理由：它需要在渲染函数里多次调用插槽并做二分裁剪，
   模板表达不了「同一份内容渲染到 4 个隐藏测量容器」。
4. **`ellipsis` 的宽度来自 `useResizeObserver`**（复用 L0，不重复造）。
5. **`copied` / `editing` / `expanded` 全部走 `useControlledValue`**（与 `useControlledState` 同语义）。
6. **`onEllipsis` 只在值变化时触发**（`if (isJsEllipsis !== jsEllipsis)`）—— 必须显式保存前值。

## 12. 待验证问题

| # | 问题 | 验证方法 |
|---|---|---|
| 1 | jsdom 下 `isStyleSupport` 恒真？ | L1 断言 `cssTextOverflow` 类名出现 |
| 2 | `ResizeObserver` mock 的触发时机（PITFALLS 33：挂载后两拍） | L2 用 `MockResizeObserver` + `await nextTick()` ×2 |
| 3 | 装饰的嵌套顺序 | L4 与机械 oracle 逐节点比对 |
| 4 | `Link` 的 `rel` 自动补全 | L1 断言 |
| 5 | 复制在 jsdom 下走哪条分支 | L2 mock `navigator.clipboard` + `document.execCommand` |
