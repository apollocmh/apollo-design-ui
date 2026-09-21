# Flex · G1 分析产物

> 契约来源：antd 6.6.4 `/tmp/antd-src/package/es/flex/`（index.js / interface.d.ts /
> utils.js / style/index.js）。**先于实现存在**（AGENTS.md §2 步骤 3）。
> 规模：构建产物 190 行 / 8 文件；Component Token **0 个**；rc 依赖 `@rc-component/util`
> （`isNonNullable` / `omit` / `clsx` —— 逐字重写判据，不引入包，H5）。

## 1. API 面（G1 → antdApiStatus）

### props（`FlexProps`，interface.d.ts）

| prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| `prefixCls` | `string` | — | 自定义前缀（getPrefixCls 直通，不加 `-flex` 后缀） |
| `rootClassName` | `string` | — | 追加在根类名之后 |
| `vertical` | `boolean` | `false` | 主轴垂直（flex-direction: column） |
| `orientation` | `'horizontal' \| 'vertical'` | — | 新 API，优先级高于 `vertical` |
| `wrap` | `boolean \| flex-wrap` | — | `true` 等价 `'wrap'`；产生 `-wrap-{v}` 类名（仅合法值） |
| `justify` | `justify-content` | — | 产生 `-justify-{v}` 类名；**不透传到 DOM** |
| `align` | `align-items` | — | 产生 `-align-{v}` 类名；**不透传到 DOM**；缺省且垂直时 `-align-stretch` |
| `flex` | `flex` 简写 | — | **内联** `style.flex`（isNonNullable 才写，`0`/`''` 语义见下） |
| `gap` | `'small' \| 'medium' \| 'middle' \| 'large' \| string \| number` | — | 预设串 → `-gap-{v}` 类名；否则**内联** `style.gap` |
| `component` | `CustomComponent` | `'div'` | 自定义根元素类型 |
| + HTMLAttributes | | | `className` / `style` / 透传 attrs |

### 静态导出（utils.js）

`flexWrapValues`（11 个）/ `justifyContentValues`（12 个）/ `alignItemsValues`（10 个）——
antd 不从组件 index 导出它们，我们从 `flex/utils.ts` 提供但不进 barrel。

### ref / methods

`React.RefAttributes<HTMLElement>` → 根元素。Vue 侧 `defineExpose({ rootElement })`。

### slots

`children` → 默认 slot。无具名 slot、无 events。

## 2. 行为契约（index.js 逐条）

1. **方向合并**：`useOrientation(orientation, vertical ?? ctxFlex?.vertical)` ——
   `orientation` > `vertical` > context.vertical > `'horizontal'`。
   第二级判据是 `typeof vertical === 'boolean'`（未传 ≠ false，D21）。
2. **类名合成**（顺序）：
   `className`（attrs）→ `rootClassName` → `ctxFlex?.className` → `prefixCls` →
   语义类（wrap/align/justify，基于 **mergedVertical**）→ `-gap-{gap}`（isPresetSize）→
   `-vertical`（mergedVertical）→ `-rtl`（ctxDirection === 'rtl'）。
3. **align-stretch 特例**：`!align && !!mergedVertical` → `-align-stretch`。
4. **样式合成**：`{ ...ctxFlex?.style, ...style }`；`isNonNullable(flex)` → 加 `flex`；
   `isNonNullable(gap) && !isPresetSize(gap)` → 加 `gap`。
   ⚠️ `isNonNullable`：`gap: 0` **会**写内联 `gap: 0`（isValidGapNumber 只用于 Space）。
5. **DOM 透传**：`omit(othersProps, ['justify','wrap','align'])` —— 这三个是纯类名驱动，
   不落 DOM。
6. **ctxFlex**：`useComponentConfig('flex')` 的 `className` / `style` / `vertical`。

## 3. 样式契约（style/index.js）

- 基础：`display:flex; margin:0; padding:0`；`&-vertical → flex-direction:column`；
  `&-rtl → direction:rtl`；`&:empty → display:none`。
- gap 三档：`-gap-small → flexGapSM`、`-gap-medium/-gap-middle → flexGap`、
  `-gap-large → flexGapLG`；token 派生 `flexGapSM=paddingXS`、`flexGap=padding`、
  `flexGapLG=paddingLG`（全部别名派生 → `var(--apollo-padding-xs/-padding/-padding-lg)`）。
- wrap/align/justify：枚举值逐一展开为静态类（`flex-wrap` 关键字是结构属性，非 H9 视觉值）。
- `resetStyle: false` —— **Flex 不吃 resetComponent 字体样式**（上游 issue 46403）。
- **Component Token = 0 个**（`prepareComponentToken = () => ({})`）。

## 4. 与 antd 的预判差异（进 COMPATIBILITY §9 前先验证）

| # | 差异 | 分类 |
|---|---|---|
| D-flex-1 | `vertical` 布尔 prop 未传必须保持 `undefined`（withDefaults 显式 undefined），否则 context.vertical 回落失效 | PLATFORM（D21 同源） |
| D-flex-2 | `prefixCls` 默认 `apollo` 不是 `ant`（已裁决 `prefix-cls-default`=A） | INTENDED（D6） |
| D-flex-3 | 无 cssinjs hash 包裹类 | INTENDED（D5） |
| D-flex-4 | ref：React forwardRef(HTMLElement) → Vue `defineExpose`（不改 DOM） | PLATFORM |
| D-flex-5 | `component` :is 透传 —— React `CustomComponent<P>` ≈ Vue `string \| Component` | PLATFORM |

## 5. 本分析没有证明什么

- 没证明**视觉**一致（L6）；
- 没证明 `:empty` 在真实浏览器的选择器行为（jsdom 支持 `:empty`，浏览器侧由 L6 覆盖）；
- 没证明 demo 与 antd 一一对应之外的行为（G11 逐 demo 对照）。

## 6. 共享层影响

`useOrientation` 的第三个消费者出现 → 按 space/useOrientation.ts 的预定计划提升到
`packages/ui/src/_internal/use-orientation.ts`（三次法则），space 侧留 re-export 垫片。
