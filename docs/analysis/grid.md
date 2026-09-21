# Grid · G1 分析产物

> 契约来源：antd 6.6.4 `/tmp/antd-src/package/es/grid/`（row.js / col.js / hooks / style）。
> **先于实现存在**。规模：440 行 / 14 文件；Row 与 Col 两个组件、Component Token 各 0 个。

## 1. 组件面

`Grid` = **Row + Col** 两个导出（antd `es/grid/index.js` 同时导出两个）。注册名 `ARow` / `ACol`。

### RowProps

| prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| `gutter` | `number \| string \| Partial<Record<Breakpoint, GutterValue>> \| [horizontal, vertical]` | `0` | 间距；数组第二位是纵向 rowGap |
| `justify` | `'start' \| 'end' \| 'center' \| 'space-around' \| 'space-between' \| 'space-evenly'` \| 响应式对象 | — | 产生 `-justify` 类 |
| `align` | `'top' \| 'middle' \| 'bottom' \| 'stretch'` \| 响应式对象 | — | 产生 `-align` 类 |
| `wrap` | `boolean` | `true`（CSS 默认） | `false` → `-no-wrap` 类 |
| `prefixCls` / `className` / `style` + HTMLAttributes | | | |

### ColProps

| prop | 类型 | 说明 |
|---|---|---|
| `span` / `order` / `offset` / `push` / `pull` | `number`（0–24） | 基础类 `-6` / `-order-3` / `-offset-4` / `-push-*` / `-pull-*` |
| `flex` | `string \| number` | parseFlex 规则见 §3 |
| `xs` … `xxxl` | `number \| {span,order,offset,push,pull,flex}` | 响应式：**所有** size 类同时渲染，由 CSS media query 生效 |
| `prefixCls` / `className` / `style` + HTMLAttributes | | |

## 2. 行为契约

1. **方向合并（Row）**：`getMergedPropByScreen(align|justify, screens)` —— 字符串直通；
   对象按 `responsiveArray = ['xxxl','xxl','xl','lg','md','sm','xs']` **从大到小**找第一个
   `screens[bp] && value !== undefined`。jsdom/SSR（screens=null）→ 返回 `''`（无类名）。
2. **useGutter**：数组归一 `[h, v]`；对象按 responsiveArray 从大找第一个命中
   （⚠️ screens=null 时兜底全 true → **SSR 响应式 gutter 命中 xxxl**，逐字对齐）。
3. **gutter 落地**：Row `marginInline = -(g/2)`（数字 → `${g/-2}px`，字符串 → `calc(x / -2)`）
   + `rowGap = v`（数字由 React 补 px：0 → `'0'`）；Col `paddingInline = +(g/2)`（同规则）。
4. **RowContext**：Row 向 Col provide `[gutterH, gutterV]` + `wrap`。
5. **flex 解析（Col）**：`'auto'` → `'1 1 auto'`；数字 → `` `${n} ${n} auto` ``；
   长度串（`/^\d+(\.\d+)?(px|em|rem|%)$/`）→ `0 0 ${flex}`；其余原样。`flex === 0` 也生效；
   `wrap === false` 时补 `minWidth: 0`（Firefox hack）。
6. **响应式 flex**：`sizeProps.flex` 存在（含 0）→ 加 `-{size}-flex` 类 + 内联 CSS 自定义属性
   `--${rootPrefixCls}-col-${size}-flex`（CSS 规则 `flex: var(...)` 消费）。
   ⚠️ Vue patchStyle 对 `--` 键走 setProperty，支持；数字值在此**不补 px**（React 侧 var 值
   经 cssinjs var 管道也是原样字符串）。
7. **Col 响应式类**：`responsiveArrayReversed`（xs→xxxl）遍历，`isNonNullable` 判据，
   `order/offset/push/pull` 用真值判断 + 显式 `=== 0` 兜底（antd 原样）。
8. **RTL**：`-rtl` 类，`direction === 'rtl'`。
9. **useBreakpoint**：matchMedia 订阅（`min-width: screenXMin`，xs 是 `max-width: screenXSMax`）；
   subscribe 时**立即回调**当前 screens；jsdom 桩全 false。

## 3. 样式契约（零运行时移植）

- Row：`display:flex; flex-flow:row wrap; min-width:0; ::before/::after{display:flex}` +
  `-no-wrap` + 6 个 justify 类 + top/middle/bottom 三个 align 类（`-stretch` **无规则**，逐字）。
- Col 基础：`position:relative; max-width:100%; min-height:1px`。
- **24 栏循环**（i = 24…0，与 antd 同序）：
  - `i===0`：`-{i}` → `display:none`；`-push-0/-pull-0` → inset auto；`-offset-0` → 0；`-order-0` → order:0
  - 其余：`-{i}` → `display:block; flex:0 0 {i/24*100}%; max-width:{i/24*100}%`；
    push → `inset-inline-start:{i/24*100}%`；pull → `inset-inline-end`；offset → `margin-inline-start`；order → `order:{i}`
- **媒体查询**：base 与 `-xs` 不包裹；`sm…xxxl` 包 `@media (min-width: {screenXMin}px)`
  （值来自 `useToken()` 的 screen token；`unit()` 数字补 px）。
- ⚠️ antd 的 `{[gridVarName('display')]: 'block', display: gridVarRef('display')}` 是给 Form 覆盖
  Col display 用的 CSS 变量机制，**ant 自己也没有生产者**（计算结果恒为 fallback `display:block`）。
  我们直接输出 `display:block`，Form 落地时再补变量机制（登记 §已知缺口）。
- Component Token：Row 与 Col 各 **0 个**（`prepareRowComponentToken/prepareColComponentToken = () => ({})`）。

## 4. 预判差异（进 COMPATIBILITY §9 前验证）

| # | 差异 | 分类 |
|---|---|---|
| D6 | 前缀 `apollo-row`/`apollo-col` vs `ant-*` | INTENDED |
| D5 | 无 hash 包裹类 | INTENDED |
| — | Form 覆盖 Col display 的 CSS 变量机制缺失（Form 未落地） | 已知缺口 |
| — | CSS 自定义属性命名 `--apollo-col-{size}-flex`（内部契约，与 ant 的 `--ant-col-*` 同构不同名） | INTENDED |

## 5. 共享层

新增 `_internal/responsive-observer.ts`（responsiveArray / matchScreen / useResponsiveObserver），
被 grid 消费；后续Descriptions/Form 等复用。断点值来自 `useToken()` 的 screen token。

## 6. 本分析没有证明什么

- 真实浏览器的 media query 行为（jsdom 全 false；L6 视觉只在 3 个固定 viewport 截图）
- Form 覆盖链路（Form 未落地）
