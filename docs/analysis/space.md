# 组件分析：Space

| 项 | 值 |
|---|---|
| 组件名 | `space` |
| 导出名 | `Space`（含 `Space.Compact` / `Space.Addon`） |
| antd 版本 | 6.6.4 |
| 分组 | 布局 |
| 优先级 | P0 |
| 复杂度 | S |
| 分析日期 | 2026-09-19 |

## 0. 参考来源

| 类型 | 路径 |
|---|---|
| antd 产物（ESM + 类型） | `/tmp/antd-src/package/es/space/`（11 个文件） |
| antd 源码 | `/tmp/antd-repo/ant-design-master/components/space/` |
| antd 测试 | `components/space/__tests__/`（8 个：`index` / `gap` / `space-compact` / `semantic` / `a11y` / `demo` / `demo-extend` / `demo-semantic` / `image`） |
| antd 文档 | `components/space/index.zh-CN.md` / `index.en-US.md` |
| antd demo | `components/space/demo/`（15 个可见 + `_semantic`） |
| **antd 真实 CSS** | 用 `@ant-design/cssinjs` 的 `extractStyle` 渲染 antd 6.6.4 提取（见 §5 的「采集方式」） |

**已阅读的文件**（逐项列出，证明分析不是凭记忆）：

- [x] `es/space/index.d.ts` / `Compact.d.ts` / `Addon.d.ts` / `Item.d.ts` / `context.d.ts`
- [x] `components/space/index.tsx`（233 行）
- [x] `components/space/Compact.tsx`（165 行）
- [x] `components/space/Item.tsx`（47 行）
- [x] `components/space/Addon.tsx`（60 行）
- [x] `components/space/context.ts`（12 行）
- [x] `components/space/style/index.ts`（100 行）/ `style/compact.ts`（41 行）/ `style/addon.ts`（157 行）
- [x] `components/_util/hooks/useOrientation.ts` / `components/_util/gapSize.ts` / `components/_util/statusUtils.ts` / `components/_util/is.ts`
- [x] `components/style/compact-item.ts` / `components/style/compact-item-vertical.ts`
- [x] `__tests__/index.test.tsx` / `gap.test.tsx` / `space-compact.test.tsx` / `semantic.test.tsx`
- [x] `__tests__/__snapshots__/index.test.tsx.snap`
- [x] `index.zh-CN.md`
- [x] `@rc-component/util/es/Children/toArray.js` 与 `es/is.js`

## 1. 规模评估

| 指标 | 值 |
|---|---|
| antd 构建产物行数 | 560（`registry/components.json` 的 `derived.antdBuildLineCount`） |
| antd 文件数 | 16（`derived.antdFileCount`） |
| demo 数量 | 15 个可见 + `_semantic` |
| 测试文件数 | 8 |
| rc 依赖 | `@rc-component/util`（`toArray` + `isReactRenderable`）→ 由 `@apollo-design/utils` 替代 |
| 依赖的组件 | `config-provider`（仅 context + `useSize` 叶子模块，不是组件） |
| 依赖的 foundation | `theme` / `utils`（均 completed） |
| 叶子模块 | `config-provider/context`、`config-provider/hooks/useSize` |
| Component Token 数 | **0** —— 见 §7 |
| complexity 判定 | S（与 registry 一致） |

**为什么它是 S**：三个组件文件加起来 505 行，但**没有状态机**、没有受控语义、
没有异步、没有事件。全部复杂度集中在两处：

1. **`useOrientation` 的三级优先级**（`orientation` > `vertical`（布尔判据）> `direction`）。
2. **`Space.Compact` 的 item context 传播**（`compactSize` / `compactDirection` /
   `isFirstItem` / `isLastItem` → 下游组件自己拼类名）。

第 2 点是本组件真正的「对外契约」：`useCompactItemContext` 被 **10 个组件**消费
（Button / Input / TextArea / Input.Search / InputNumber / Select / TreeSelect /
Cascader / DatePicker / Dropdown.Button / ColorPicker），其中 Button 在本轮之后
立即需要它。所以 **Compact 必须与 Space 同轮落地**（用户指令已明确）。

## 2. API 面

### 2.1 Space 的 Props（`SpaceProps`，逐字段对齐 `index.d.ts`）

| Prop | 类型 | 默认 | 说明 | Vue 映射 |
|---|---|---|---|---|
| `prefixCls` | `string` | 从 ConfigProvider 取，兜底 `apollo` | | 直接同名 |
| `className` | `string` | — | 落在根元素（**在** `-{orientation}` 等之后、`rootClassName` 之前） | Vue 里是 attr |
| `rootClassName` | `string` | — | 也落在根元素（在 `className` 之后） | 直接同名 |
| `style` | `CSSProperties` | — | 根元素；**覆盖** `styles.root` | Vue 里是 attr |
| `size` | `SpaceSize \| [SpaceSize, SpaceSize]` | `contextSize ?? 'small'` | 预设串或数字；数组 = `[horizontal, vertical]` | 直接同名 |
| `direction` | `Orientation` | — | **@deprecated** → `orientation`，保留并告警 | 直接同名 |
| `vertical` | `boolean` | — | ⚠️ 未传 ≠ `false`（见 §6.2） | 直接同名，`default: undefined` |
| `orientation` | `Orientation` | — | 优先级最高 | 直接同名 |
| `align` | `'start' \| 'end' \| 'center' \| 'baseline'` | 水平时折成 `'center'` | | 直接同名 |
| `split` | `ReactNode` | — | **@deprecated** → `separator`，保留并告警 | 直接同名 |
| `separator` | `ReactNode` | — | 分隔符；`separator ?? split` | 直接同名，`default: undefined` |
| `wrap` | `boolean` | `false` | 仅 horizontal 有意义 | 直接同名 |
| `classNames` | `{root?,item?,separator?}` 或函数 | — | 语义化类名（**拼接**） | 直接同名 |
| `styles` | `{root?,item?,separator?}` 或函数 | — | 语义化样式（**覆盖**） | 直接同名 |
| `children` | `ReactNode` | — | | **默认插槽**（规则 C19） |

### 2.2 Space.Compact 的 Props

| Prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| `prefixCls` | `string` | 兜底 `apollo-space-compact` | ⚠️ 后缀是 `space-compact`，不是 `compact` |
| `size` | `SizeType` | `useSize((ctx) => size ?? ctx)` | 向下游提供 `compactSize` |
| `direction` | `Orientation` | — | **@deprecated** → `orientation` |
| `orientation` | `Orientation` | — | |
| `vertical` | `boolean` | — | ⚠️ 未传 ≠ `false` |
| `block` | `boolean` | `false` | 加 `-block` |
| `rootClassName` | `string` | — | |
| `className` / `style` / 其余 | HTML 属性 | — | 透传到根 div |

### 2.3 Space.Addon 的 Props

| Prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| `prefixCls` | `string` | 兜底 `apollo-space-addon` | ⚠️ 后缀是 `space-addon` |
| `variant` | `Variant` | `'outlined'` | `outlined` / `borderless` / `filled` / `underlined` |
| `disabled` | `boolean` | — | 加 `-disabled` |
| `status` | `InputStatus` | — | `warning` / `error` / `''` / `success` / `validating` |
| `children` | `ReactNode` | — | 默认插槽 |

### 2.4 Events

**无。** 三个组件都是纯展示（`Space.Compact` 的 `Popover trigger` 用例只是
「根元素能被当触发器」，不产生事件 API）。

### 2.5 方法（Expose）

```ts
interface SpaceRef     { nativeElement: HTMLDivElement }   // antd: forwardRef<HTMLDivElement>
interface SpaceCompactRef { nativeElement: HTMLDivElement }
interface SpaceAddonRef   { nativeElement: HTMLDivElement }
```

Vue 侧用 `defineExpose({ nativeElement: rootRef })`。

### 2.6 静态方法 / 子组件

| React | Vue |
|---|---|
| `Space.Compact` | `SpaceCompact` 具名导出 + `Space.Compact` 静态属性别名 |
| `Space.Addon` | `SpaceAddon` 具名导出 + `Space.Addon` 静态属性别名 |
| `SpaceContext` | `useSpaceContext()` composable + `spaceContextKey` |

### 2.7 从 `space/Compact` 导出的**叶子模块**（下游依赖，必须落地）

| 导出 | 消费方 |
|---|---|
| `SpaceCompactItemContextType` | Input / Select / Button / … |
| `useCompactItemContext(prefixCls, direction)` | **10 个组件**（见 §1） |
| `NoCompactStyle` | `_util/ContextIsolator`（Modal / Drawer / Tooltip / Dropdown 用它把浮层里的内容隔离出 Compact 上下文） |
| `Compact`（默认导出） | `Input.Search` / `InputNumber` 直接 `import Compact from '../space/Compact'` |

⚠️ **这是本组件最容易被低估的部分**：`Space.Compact` 不是「一个容器组件」，
它是一套**跨组件上下文协议**。`space-compact.test.tsx` 里 4 条用例
（`context for Modal` / `Dropdown` / `Drawer` / `Tooltip`）测的就是
「浮层内容不能继承 Compact 上下文」——那由 `NoCompactStyle` 保证，不是 Compact 自己。

## 3. 类型面

### 3.1 关键类型

| antd 类型 | Vue 侧类型 | 备注 |
|---|---|---|
| `SpaceSize = SizeType \| number` | 同名 | `SizeType` 复用 `config-provider` 的 |
| `Orientation = 'horizontal' \| 'vertical'` | 同名（本地声明） | antd 从 `_util/hooks` 导入；我们不重复导出到 barrel（见 §9 D3） |
| `SpaceSemanticType` | `SpaceSemanticType` | `{classNames?, styles?}` |
| `SpaceSemanticAllType` | 同名（接口而非条件类型） | 含 `classNamesAndFn` / `stylesAndFn` |
| `SpaceSemanticValue<T>` | 同名 | `T \| ((info: {props}) => T)` |
| `GenerateSemantic<...>` | 不实现 | 见 §9 D4 |
| `Variant` | 复用 `config-provider/context` 的 `Variant` | antd 也是从 config-provider 导入 |
| `InputStatus` | 本地声明 | antd 在 `_util/statusUtils` 里，我们没有 `_util` |
| `SpaceContextType` | 同名 | `{latestIndex: number}` |

### 3.2 类型测试要点（正例与负例）

- 正例：`size` 接受 `'small' | 'medium' | 'middle' | 'large' | number | [a, b]`
- 正例：`align` 接受四个字面量
- 负例：`align: 'middle'` 报错
- 负例：`orientation: 'left'` 报错（那是 Divider 的 `TitlePlacement`）
- 负例：`variant: 'dashed'` 报错（那是 Divider 的 `DividerVariant`）
- 负例：`Space.Compact` 不接受 `block: 'yes'`

## 4. DOM 结构

**采集方式**：`__tests__/__snapshots__/index.test.tsx.snap`（antd 真实渲染）

```html
<!-- <Space separator="-">text1<span>text1</span><>text3</></Space> -->
<div class="ant-space ant-space-horizontal ant-space-align-center
            ant-space-gap-row-small ant-space-gap-col-small css-var-root">
  <div class="ant-space-item">text1</div>
  <span class="ant-space-item-separator">-</span>
  <div class="ant-space-item"><span>text1</span></div>
  <span class="ant-space-item-separator">-</span>
  <div class="ant-space-item">text3</div>
</div>
```

```html
<!-- <Space.Compact><Input/><Button/></Space.Compact> -->
<div class="ant-space-compact">
  <span class="ant-input-wrapper ant-input-group">
    <input class="ant-input ant-input-compact-first-item" />
  </span>
  <button class="ant-btn ant-btn-compact-last-item" />
</div>
```

### 4.1 稳定契约（必须对齐）

| 项 | 值 |
|---|---|
| Space 根元素 | `<div>` |
| Space 根类名 | `${prefixCls}-space`，后缀 `-{orientation}`、`-rtl`?、`-align-{align}`?、`-gap-row-{size}`?、`-gap-col-{size}`? |
| Space 子结构 | `${prefixCls}-space-item`（每个子节点一个 div）、`${prefixCls}-space-item-separator`（span） |
| Compact 根元素 | `<div>`，类 `${prefixCls}-space-compact` + `-rtl`? + `-block`? + `-vertical`? |
| Addon 根元素 | `<div>`，类 `${prefixCls}-space-addon` + `-variant-{variant}` + `-{size}`? + `-disabled`? + status 类 |
| `data-*` 语义属性 | **无** |
| 多根 / 单根 | 单根（但 `Space`/`Compact` 在**无子节点**时返回 `null`） |

**`Item` 渲染成 Fragment**（`<div>` + 可选的 `<span>`），不是单一根 ——
这是 Vue 侧必须用多根组件（或直接内联）的地方。

## 5. ARIA

| 元素 | role | aria-* |
|---|---|---|
| Space 根 | **无** | **无** |
| Compact 根 | **无** | **无** |
| Addon 根 | **无** | **无** |

**键盘交互**：无。**焦点管理**：无（不产生可聚焦元素，不移动焦点）。

⚠️ 结论：**L5 判 `done` 但内容很少** —— 只断言「不产生错误的 ARIA 语义」
（例如不误加 `role="group"`）+ 跑 axe 扫描不出 violation。这仍然是**可证伪**的：
`role="separator"` 之类的「顺手加一个语义」会让 axe 或快照红。

**CSS 侧的 `-rtl`**：`direction: rtl` 是**视觉**方向，不是 ARIA 属性。

## 6. 行为规格

### 6.1 方向合并（`useOrientation(orientation, vertical, legacyDirection)`）

```
orientation 是 'horizontal' / 'vertical'   → 用它
否则 typeof vertical === 'boolean'          → vertical ? 'vertical' : 'horizontal'
否则 legacyDirection 是合法方向             → 用它（并告警）
否则                                        → 'horizontal'
```

⚠️ **判据是 `typeof vertical === 'boolean'`，不是真值判断。** 所以：

| 输入 | 结果 | 依据 |
|---|---|---|
| `orientation=undefined, direction=undefined` | `horizontal` | `index.test.tsx` testCases[0] |
| `orientation=undefined, direction='vertical'` | `vertical` | testCases[1] |
| `orientation='vertical', direction='horizontal'` | `vertical` | testCases[2] |
| `orientation='vertical', direction=undefined` | `vertical` | testCases[3] |
| `orientation='horizontal', direction='vertical'` | `horizontal` | testCases[4] |

`mergedVertical = mergedOrientation === 'vertical'`（第二个返回值）。

### 6.2 `vertical` 未传 ≠ `false`（PITFALLS 46 / D21）

Vue 的 Boolean prop 转换：运行时类型含 `Boolean` 且未传且无 `default` ⇒ 赋成 `false`。
而判据是 `typeof vertical === 'boolean'` ⇒ **`<Space direction="vertical" />` 会静默变成
`horizontal`**，组件照样渲染，只是方向错。

⇒ `withDefaults` 里 `vertical: undefined` **不是冗余**（与 Divider 完全同形）。

### 6.3 `size` 的四种取值路径

```
size = props.size ?? contextSize ?? 'small'         // ⚠️ `??`，所以 size=0 会用 0
[horizontalSize, verticalSize] = Array.isArray(size) ? size : [size, size]
```

| 路径 | 类名 | 内联 gap |
|---|---|---|
| `isPresetSize(x)`（`small`/`medium`/`middle`/`large`） | `-gap-row-x` / `-gap-col-x` | 不加（交给 CSS） |
| `!preset && isValidGapNumber(x)`（数字且非 NaN 且非 0） | 不加 | `rowGap`/`columnGap` = `x` |
| `0` | 不加 | 不加（`isValidGapNumber` 的 `!size` 短路） |
| `NaN` / 字符串数字 / 非法串 | 不加 | 不加 |

⚠️ 三处容易写错：

1. `contextSize ?? 'small'` 里 `size: 0` 是**有效值**（`??` 不看真值）。
   但 `isValidGapNumber(0)` 为假 ⇒ **既没有类名也没有内联 gap**。
   这正是 `index.test.tsx` 的 `should render width ConfigProvider support 0` 用例：
   `ConfigProvider space={{size: 0}}` 时**不能**出现 `-gap-row-small`。
2. `isPresetSize` 与 `isValidGapNumber` **互斥**：预设串走类名，数字走内联。
3. 数字 gap 必须**补 px**（PITFALLS 32）：React 的 `dangerousStyleValue` 对
   `rowGap: 10` 输出 `10px`，Vue 的 `setStyle` 不补 ⇒ 裸 `10` 会被静默丢弃。
   `gap.test.tsx` 的 `should size work` 断言的正是 `rowGap: '10px'`。

### 6.4 `align` 的折算

```
mergedAlign = align === undefined && !mergedVertical ? 'center' : align
```

⚠️ 判据是 `align === undefined`（不是真值）。所以垂直时 `align` 保持 `undefined`
⇒ 不产生 `-align-*` 类名。而水平时默认 `center`。

### 6.5 `separator` / `split`

```
mergedSeparator = separator ?? split
```

- `??` 而不是 `||`：`separator=''` 时**不**回落到 `split`。
- Item 里的判据是**真值**：`index < latestIndex && separator` —— 所以
  `separator={0}` / `separator=""` 都**不渲染**分隔符 span。
- 分隔符只在 `index < latestIndex` 时渲染，即**最后一个「有内容」的 item 之后没有分隔符**。

### 6.6 `latestIndex` 的计算（⭐ 最易错）

```
childNodes.reduce((latest, child, i) => isReactRenderable(child) ? i : latest, 0)
```

- 初值是 `0`（不是 `-1`）。所以**全空** children 时 `latestIndex = 0`。
- 只看「有内容」的子节点。
- Item 的渲染判据也是 `isReactRenderable(children)`：**不可渲染的子节点整个 item 不渲染**
  （连 wrapper 都没有）。

React 侧的「空」：`null` / `undefined` / `false` / `''`。
Vue 侧对应物是 `isEmptyVNode`（`@apollo-design/utils`）：
Comment vnode（`v-if="false"` / `null` / `undefined` / `false` 归一化的产物）、
空文本 vnode（`{{ '' }}` 的产物）、递归为空的 Fragment。

⚠️ **`toArray(children, {keepEmpty: true})` 的语义**（`@rc-component/util` 实测）：
`React.Children.forEach` 会把 `null` / `undefined` / `boolean` 归一成 `null` 后
**仍然回调**一次，所以 `keepEmpty` 时 `false` 会以 `null` 留在数组里（影响下标）。
Vue 侧 `toArray` 把同样三种输入变成 Comment vnode 并保留 —— **长度与下标对齐**。

### 6.7 空 children ⇒ 返回 `null`

`Space` 与 `Space.Compact` 在 `childNodes.length === 0` 时返回 `null`
（`index.test.tsx` 的 `should render width empty children` 断言 `container.children.length === 0`）。

⚠️ 注意与 §6.6 的区别：`<Space><Null/></Space>`（`<Null/>` 渲染 null）**长度是 1**
⇒ 渲染出一个空的 `-item` div（由 CSS `:empty{display:none}` 隐藏）。

### 6.8 Compact 的 item context 传播

```
isFirstItem = i === 0 && (!ctx || ctx.isFirstItem)
isLastItem  = i === childNodes.length - 1 && (!ctx || ctx.isLastItem)
```

⚠️ 两条判据的**合取**是「嵌套 Compact 时内层的第一/最后才生效」——
`compact-nested.tsx` demo 与 `space-compact.test.tsx` 的嵌套用例覆盖它。

`useCompactItemContext(prefixCls, direction)` 产出：

```
separator = compactDirection === 'vertical' ? '-vertical-' : '-'
`${prefixCls}-compact${separator}item`
+ `${prefixCls}-compact${separator}first-item`?   (isFirstItem)
+ `${prefixCls}-compact${separator}last-item`?    (isLastItem)
+ `${prefixCls}-compact${separator}item-rtl`?     (direction === 'rtl')
```

⚠️ 这里拼的是**下游组件自己的** `prefixCls`（`apollo-btn` → `apollo-btn-compact-item`），
不是 `apollo-space-compact`。`space-compact.test.tsx` 的 `compact-item className`
用例把这条钉死。

### 6.9 边界条件汇总

| 场景 | antd 的行为 | 依据 |
|---|---|---|
| `<Space />` 无 children | 返回 `null`（零个根节点） | `index.test.tsx:14-18` |
| `<Space><Null/></Space>` | 渲染 1 个**空** `-item`，CSS `:empty` 隐藏 | `index.test.tsx:215-225` |
| `<Space>` 混合文本与元素 | 每个子节点一个 `-item`（含裸文本） | `index.test.tsx:117-126`（3 个） |
| `separator` 传 `0` / `''` | 真值判据 ⇒ **不渲染**分隔符 | `Item.tsx:34` |
| `size` 传 `0` | 无类名、无内联 gap | `gapSize.ts:9-12` |
| `size` 传 `NaN` | 不抛错、无 gap | `gap.test.tsx:37-45` |
| `size` 传 `[a, b]` | 横向取 `a`、纵向取 `b` | `index.tsx:89` |
| 子节点带 `key` | 用 `child.key` 当 React key（避免重复 key 告警） | `index.test.tsx:197-213` |
| 子节点更新 | `-item` 的 DOM **保留**（`should be keep store`：点击内层按钮，内层 state 变化，外层不重建） | `index.test.tsx:128-167` |
| `direction` 传值 | 告警 `\`direction\` is deprecated. Please use \`orientation\` instead.` | `index.test.tsx:97-99` |
| `split` 传值 | 告警 `\`split\` is deprecated. Please use \`separator\` instead.` | `index.test.tsx:189-191` |
| `Space.Compact` + `direction` | 告警前缀是 `Space.Compact`（不是 `Space`） | `space-compact.test.tsx:213-215` |

## 7. Component Token

**Space 没有用户可覆盖的 Component Token。**

```ts
// components/space/style/index.ts
// biome-ignore lint/suspicious/noEmptyInterface: ComponentToken need to be empty by default
export interface ComponentToken {}
export const prepareComponentToken: GetDefaultToken<'Space'> = () => ({});
```

`genStyleHooks` 用 `mergeToken` 造出三个**内部** token（用户无法通过
`theme.components.Space` 覆盖）：

| 内部 token | 值 | 落点 |
|---|---|---|
| `spaceGapSmallSize` | `token.paddingXS` | `var(--apollo-padding-xs)` |
| `spaceGapMiddleSize` | `token.padding` | `var(--apollo-padding)` |
| `spaceGapLargeSize` | `token.paddingLG` | `var(--apollo-padding-lg)` |

`Compact` / `Addon` 的 `ComponentToken` 同样是空接口。

⇒ `registry/tokens.json` 里 `space` 的 `tokenStatus` 记 **`n/a`**（附依据），
不是 `done` —— 「登记 0 个 token 并声称完成」与「确认它确实没有 token」是两件事
（与 empty 的处置一致）。

⚠️ `Addon` 的 CSS 里有一批**组件级 CSS 自定义属性**
（`--apollo-space-addon-addon-border-color` 等）。它们是 `genCssVar(antCls, 'space-addon')`
在**规则内部**声明的，**不是** theme 的 token。零运行时下不能照抄 ——
理由见 §11 决策 3。

## 8. 依赖面

| antd | 我们 |
|---|---|
| `@rc-component/util` 的 `toArray` / `isReactRenderable` | `@apollo-design/utils` 的 `toArray` / `isEmptyVNode` |
| `clsx` | 无需 —— Vue 的 `:class` 数组 |
| `useComponentConfig('space')` | `config-provider/context` 的 `useComponentConfig` ✓ |
| `useSize((ctx) => size ?? ctx)` | `config-provider` 的 `useSize` ✓（支持函数入参） |
| `useOrientation` | **本包内新建** `space/useOrientation.ts`（见 §9 D2） |
| `isPresetSize` / `isValidGapNumber` | **本包内新建** `space/gapSize.ts`（antd 在 `_util/gapSize.ts`） |
| `getStatusClassNames` | **本包内新建**（antd 在 `_util/statusUtils.ts`） |
| `devUseWarning('Space')` | `@apollo-design/utils` 的 `useDevWarning` ✓ |
| `useMergeSemantic` | `_internal/use-merge-semantic` ✓ |
| `useStyle(prefixCls)` → hashId/cssVarCls | **不复刻** —— 静态 CSS，没有 hash（D1） |
| `ConfigContext` 的 `direction` | `useDirection()`（D27：解构是快照） |

### 8.1 叶子模块的处理

antd 从 `space/Compact` 导出 `useCompactItemContext` / `NoCompactStyle` /
`SpaceCompactItemContext`。我们的对应位置：

| antd 叶子模块 | 我们的位置 |
|---|---|
| `space/Compact`（context + hook + `NoCompactStyle`） | `packages/ui/src/space/Compact.ts` |
| `space/context`（`SpaceContext`） | `packages/ui/src/space/context.ts` |
| `_util/hooks/useOrientation` | `packages/ui/src/space/useOrientation.ts`（见 D2） |
| `_util/gapSize` | `packages/ui/src/space/gapSize.ts` |
| `_util/statusUtils` | `packages/ui/src/space/statusUtils.ts` |

⚠️ **命名冲突风险**：`Compact.ts`（模块）与 `Compact.vue`（组件）同名。
`import Compact from './Compact'` 在 TS 与 Vite 下都解析到 **`.ts`**（`.vue` 由插件
追加在扩展名列表末尾）—— 与 antd 的 `space/Compact` 路径一致，下游可以照抄。
内部引用一律写**显式扩展名**（`./Compact.vue`）以免歧义。

## 9. 差异登记

> **编号已对齐到 `COMPATIBILITY.md` §9 的全局编号。**
>
> 本文件初稿（G1 阶段）用的是**局部**编号 `D1–D12`。收口时发现局部编号会与全局编号
> 撞名（例如局部 `D1` 指 hash 类名、而全局 `D1` 指 `visible` → `open`），
> 所以统一改成全局编号，并在末列保留映射。
>
> 全部差异已**追加**进 `COMPATIBILITY.md` §9.2（`D34–D40`）与 §9.2.1（`U4–U6`）——
> 纯追加，未改动任何既有行。

| # | React 行为 | 我们 | 分类 | 理由 | G1 局部编号 |
|---|---|---|---|---|---|
| D5 | 根元素带 `css-var-root` / `css-xxx` hash 类 | 无 | INTENDED | 零运行时静态 CSS（H6），`dom-contract.ts` 做对称剔除 | D1 |
| D6 | 默认前缀 `ant` | `apollo` | INTENDED | 裁决 `prefix-cls-default` = A | D6 |
| D21 | `separator` / `split` 是 `ReactNode`（Vue 侧 `VNodeChild` 的运行时类型含 `Boolean` ⇒ 未传被转成 `false`）；废弃告警判据是 `!(name in props)` | `VNodeChild` prop + `default: undefined`；判据改成 `!== undefined` | PLATFORM | PITFALLS 46：SFC 编译出的运行时类型含 `Boolean`；Vue 的 `props` 恒含全部声明键 | D9 / D11 |
| D22 | `SpaceRef.nativeElement` 声明为 `HTMLDivElement` | `HTMLDivElement \| null` | PLATFORM | 与 empty / divider 同形：首渲染前它真的是 `null` | D10 |
| D27 | context 的解构值是**活的**（Provider 更新时 React 重跑消费者函数体） | 解构是快照 ⇒ 一律用返回 `ComputedRef` 的 composable | PLATFORM | 见 `docs/analysis/config-provider.md` §6.3 | —— |
| D34 | `useOrientation` 来自 `_util/hooks`（全库共享） | 落在 `space/useOrientation.ts` | INTENDED | 我们没有 `_util/`；Divider 已内联了自己的副本（两份）；第三次出现时提升到 `_internal/` | D2 |
| D35 | `Orientation` 由 `_util/hooks` 导出 | 本地声明，**不**从 barrel 导出 | PLATFORM | barrel 已从 `./divider` 导出 `Orientation`，重复导出会冲突；antd 也不从 `space` 导出它 | D3 |
| D36 | `GenerateSemantic<SpaceSemanticType, SpaceProps>` 条件类型 | 手写的 `SpaceSemanticAllType` 接口 | INTENDED | 与 empty / divider 同形（避免条件类型 + 双重断言） | D4 |
| D37 | `SpaceContext` 是 `React.Context`，配 `Provider`，值是裸对象 | `spaceContextKey` + `useSpaceContext()`，值是 `ComputedRef` | PLATFORM | Vue 用 `provide`/`inject`；`inject` 是 setup 期快照 ⇒ 不注入 `ComputedRef` 时「子节点增删」不传导到 `Item` 的分隔符判据 | D5 |
| D38 | 组件级 CSS 自定义属性（Addon 的 `--ant-space-addon-*`）；status 段只改写变量、不额外产规则 | 内联为 `border-color` / `background`，并把「status × variant」**展开成复合选择器**（33 条 vs 29 条） | INTENDED | B7 要求每个 `var(--apollo-*)` 都在 theme 的 `tokens.css` 里有声明；这些变量是规则内局部声明的，照抄会判 FAIL。展开后特异性拉平 ⇒ 必须**重排选择器顺序**以保持层叠等价（见 §11 决策 3） | D7 |
| D39 | `useCompactItemContext` 返回裸值 | 返回 `ComputedRef` | PLATFORM | D27 同一根源：Compact 的 props 变化要传导到下游 10 个组件 | D8 |
| D40 | `separator={0}` 时 `Item` 的 `{… && separator && <span/>}` 求值成数字 `0`，React 把它渲染成**裸文本节点** ⇒ `<div>a</div>0<div>b</div>` | 真 `if` 走假值分支 ⇒ 不产生任何节点 | **DEFECT** | JSX「`0` 会渲染」的经典陷阱；上游的意图显然是「没有分隔符」。⚠️ 这条差异**进不了 L4**：`dom-contract.ts:204` 的投影只用 `content.children`（只含元素节点）⇒ 两侧投影相同、没有 `ALLOW` 条目。钉住它的是 L1 的 `index.test.ts`，证据是基线 `separator:zero` | （实现期新增） |

### 9.1 被移除的一条：G1 的局部 `D12` **不是差异**

初稿把「无子节点时返回 `null`（零个根节点）」列成了一条差异，理由写的是
「Vue 支持返回 `null`」。实现期复核发现**两侧行为完全相同**（antd 也是返回 `null`），
所以它不是差异，只是一条**需要被断言的行为**。它的落点是 L4 的
`children:none` 用例（断言 `container.children.length === 0`），不进差异表。

### 9.2 跟随的上游缺陷（`COMPATIBILITY.md` §9.2.1 的 `U4–U6`）

| # | 位置 | 上游行为 | 我们为何跟随 |
|---|---|---|---|
| U4 | `Space.Addon` | `disabled` 只改颜色，不设 `disabled` / `aria-disabled` | 它只是视觉容器，交互由插槽里的子组件承载。代价：对辅助技术**完全不可见**（真实缺口） |
| U5 | `Space` / `Space.Compact` | 根是裸 `<div>`，无 `role` / `aria-*`；`-item` 无 `role="listitem"` | 纯布局容器，不是列表语义；挂 `role="list"` 会凭空声明列表结构 |
| U6 | `Space`（分隔符） | `-item-separator` 是裸 `<span>`，无 `aria-hidden` | 上游可改进项；单方面加会让 L4 的逐节点比对红 |


## 10. 测试矩阵

| 维度 | 取值 | 用例数（计划） |
|---|---|---|
| `orientation` | `undefined` / `horizontal` / `vertical` | 3 |
| `vertical` | 未传 / `true` / `false` | 3 |
| `direction`（废弃） | 未传 / `horizontal` / `vertical` | 3 |
| `size` | `small` / `medium` / `middle` / `large` / 数字 / `0` / `NaN` / 数组 / 数组含预设 | 9 |
| `align` | 未传 / `start` / `end` / `center` / `baseline` | 5 |
| `separator` / `split` | 未传 / 字符串 / 节点 / `0` / `''` | 5 |
| `wrap` | `true` / `false` | 2 |
| children | 无 / 单 / 多 / 裸文本 / 空组件 / `v-if=false` / 空串 / `0` | 8 |
| 语义化 | classNames 对象 / 函数 / styles 对象 / 函数 / 合并顺序 | 6 |
| ConfigProvider | `size` / `className` / `classNames` / `direction=rtl` | 4 |
| Compact | `block` / `orientation` / `vertical` / `size` / 嵌套 / `rtl` / 空 | 7 |
| Addon | `variant` ×4 / `status` ×3 / `disabled` / compact item 类名 | 9 |

**7 层测试的覆盖计划与实际**（收口时回填）：

| 层 | 文件 | 计划 | 实际 | 关键断言 |
|---|---|---|---|---|
| L1 Unit | `__tests__/index.test.ts` | ~70 | **123** | 方向合并表、size 四路径、latestIndex、空 children、告警文案、gap px 补全 |
| L2 Interaction | `__tests__/index.test.ts`（`should be keep store` 一节） | ~3 | **n/a** | 见 `README.md` §5.1：三个组件都没有交互面 |
| L3 Type | `__tests__/type.test-d.ts` | ~18 | **44**（含 20 条负例） | 见 §3.2 |
| L4 DOM Contract | `__tests__/semantic.test.ts` | 基线全量（≈60） | **127** | 与 `space.dom.json` 逐节点比对 |
| L5 A11y | `__tests__/a11y.test.ts` | ~16 | **28** | axe 扫描 + 「不误加 role」 |
| L6 Visual | `tests/visual/` | 用例 × 3 viewport | **27**（9 × 3） | 逐像素：全部 `0.000% exact` |
| L7 Build | `tests/build/run.mjs` | — | **FAIL 0** | B5/B7/B8 |
| 主题矩阵 | `__tests__/theme.test.ts` | ~6 | **26** | 变量引用、无硬编码色值、规则条数、顺序契约 |
| demo 冒烟 | `__tests__/demo.test.ts` | ~15 | **17** | 每个 demo 能挂载 |

**变异验证**：8 个变异全部被捕获（M1–M8，见 `README.md` §5.5）。
其中 M8（把 Addon 的决胜规则挪到 status 之前）**首轮存活** —— 补了 4 条顺序断言才抓住，
这是本组件唯一一处「变异验证改动了实现之外的产物」。

## 11. 实现决策

1. **`.vue` SFC**（COMPONENT-RULES §2 默认）。`Space.vue` / `Compact.vue` / `Addon.vue`。
   `Item` 用 `defineComponent` + `h` 写在 `Item.ts`（它是 Fragment 结构，模板无优势，
   且要 inject `latestIndex`）。

2. **`SpaceContext` 用 `provide` + `InjectionKey<ComputedRef<SpaceContextType>>`**。
   `Item` inject 它拿 `latestIndex`。

3. ⚠️ **Addon 的组件级 CSS 变量必须内联，且要重排选择器顺序**（D7）。
   antd 靠自定义属性的「同元素覆盖」实现 variant/status 的优先级，内联后必须用
   等价特异性的选择器重现：

   | antd 机制 | 内联等价物 |
   |---|---|
   | `.addon{border-color:var(--bc);background:var(--bg)}` | `.addon{border-color:var(--apollo-color-border);background:var(--apollo-color-bg-container-disabled)}` |
   | `-variant-outlined` 把 `--bc` 指向 `--bc-outlined` | `.addon-variant-outlined{border-color:var(--apollo-color-border)}` |
   | `-variant-filled` 把 `--bc:transparent`、`--bg:var(--bg-filled)` | `.addon-variant-filled{border-color:transparent;background:var(--apollo-color-bg-container-disabled)}` |
   | `-status-error` 改 `--bc-outlined` / `--bg-filled` | `.addon-status-error.addon-variant-outlined{border-color:var(--apollo-color-error)}` + `.addon-status-error.addon-variant-filled{background:var(--apollo-color-error-bg)}` |
   | `-variant-filled.addon-disabled` 用 (0,2,0) 压过 `-variant-filled` | 同选择器 (0,2,0)，但**必须排在 status 规则之后**（同特异性靠顺序决胜） |

   最后一行是这条内联的唯一陷阱：按 antd 的原始顺序写会让
   「filled + error + disabled」变成 error 背景而不是 disabled 背景。

4. **数字 gap 自己补 px**（PITFALLS 32），规则与 React 的 `dangerousStyleValue` 一致：
   非零数字 → `` `${v}px` ``。`0` 走不到这条路径（`isValidGapNumber` 已短路）。

5. **告警写在 `watchEffect` 里**（Divider README §8 第 5 条）：antd 每次渲染都求值，
   setup 期只求值一次会让「挂载时合法、之后变非法」这条差异静默。

6. **`prefixCls` 是完整前缀**：`getPrefixCls('space', customize)` ——
   传了 `customize` 就直接返回它（不加 `-space`）。Compact 传 `'space-compact'`，
   Addon 传 `'space-addon'`。

7. ⚠️ **`separator={0}` 不复刻上游漏出的裸文本节点**（D40 / DEFECT）。
   `Item.ts` 用真 `if`（`if (index < latestIndex && separator)`）而不是把
   `&&` 链交给渲染函数 —— 后者在 Vue 里同样会渲染出 `0`（`h('span', …, 0)`
   或直接把 `0` 当 child），所以这条「修复」是**写法的自然结果**，不是额外分支。
   代价：L4 观测不到它（`dom-contract.ts` 的投影只含元素节点）⇒ 判据落在 L1。

## 12. 待验证问题（收口时已全部回答）

- [x] `--apollo-line-type` / `--apollo-line-width` 是否真的在 `tokens.css` 里有声明
      （Addon 的 `border-style` / `calc()` 用到）？
      **是。** 构建门禁 `tests/build/run.mjs` 的 B7 对 `packages/ui/dist/index.css`
      逐个 `var(--apollo-*)` 校验，结果 `FAIL 0`（检查项 127 / PENDING 1 / n/a 50，
      PENDING 是 ui 的 B6 体积预算，与 space 无关）。
- [x] Vue 侧「空文本 vnode」是否会让 `:empty` 失效？
      **不会。** L4 的 `children:empty-string` 用例与 antd 的机械基线逐节点一致
      （空文本节点的 `data.length === 0` 按 CSS 规范不影响 `:empty`）。
- [x] `space/Compact.ts` 与 `space/Compact.vue` 的同名解析在 `vue-tsc` 下是否稳定？
      **稳定。** `lint:types`（`vue-tsc --noEmit -p tsconfig.json`）0 错误。
      TS 与 Vite 都先解析 `.ts`（`.vue` 由插件追加在扩展名列表末尾）——
      与 antd 的 `space/Compact` 路径一致，**下游可以照抄 import**，不必改名。
      内部引用一律写显式扩展名（`./Compact.vue`）以免歧义。
- [x] L6 是否需要为 Compact 提供假的 Button/Input 桩？
      **需要，且已落地。** 9 个视觉用例全部用**两侧同一份**原生 `<button>` / `<input>`
      替身（`tests/visual/render/cases/shared.mjs` 的 `SPACE_*_STYLE`，取值是 antd 6.6.4
      的默认 Button / Input 实测值）。代价（Compact 的边框合并只验证到替身）已登记为
      `tests/visual/matrix.mjs` 的 `LIMITATIONS`：`space·standins` / `space·state`。
      结果：27 组全部 `0.000% exact`。
