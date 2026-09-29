# Pagination 实现说明

> 收口记录（2026-09-29）。

## 1. 对应 antd 组件

- antd 6.6.4 `es/pagination/`：`Pagination.js` 213 行（**壳**）+ `useShowSizeChanger.js` 12 +
  `style/index.js` 595 + `style/bordered.js` 87
- rc 内核：`@rc-component/pagination@1.4.0`（es 侧 ≈600 行：`Pagination.js` 441 /
  `Options.js` 119 / `Pager.js` 41 / 45 个 locale）
- 分析产物：`docs/analysis/pagination.md`
- 复用的本仓资产：`select`（尺寸切换器）、`input` 的 token 公式、`_internal/{use-merge-semantic,
  to-css-size}`、`config-provider` 的 Size/Direction/Config、`grid/hooks/use-breakpoint`、
  `form/hooks/useVariants`
- 样式：**机械移植** antd 产物（108 条规则 + 2 个媒体查询），**12 个**自有 Component Token

## 2. 与 antd 的行为差异清单（同步 COMPATIBILITY.md §9）

| # | 差异 | 分类 | 说明 |
| --- | --- | --- | --- |
| 1 | `current` + `onChange` → `v-model:current`（同时发 `change`，C11） | INTENDED | 同理 `pageSize` → `v-model:pageSize` |
| 2 | `onChange` / `onShowSizeChange` → emits（`change` / `showSizeChange`） | INTENDED | 载荷与 antd 同形（`change` 是双参） |
| 3 | `itemRender` / `showTotal` / `components.sizeChanger` → **scoped slot** | INTENDED | C8；`sizeChangerRender` prop 与 `#sizeChanger` 槽并存 |
| 4 | `selectComponentClass` **不实现** | UPSTREAM | antd 标注「非官方 API + v7 移除」 |
| 5 | `pageSizeOptions` 只收数字 | INTENDED | 字符串形态 antd 标注「下个大版本移除」 |
| 6 | 属性透传按 rc 的 `pickAttrs({aria, data})` | PLATFORM | 只有 `aria-*` / `data-*` 落到根 `<ul>`，其余未知属性**丢弃** |
| 7 | `PaginationConfig.position` 只导出类型 | INTENDED | 它是给容器（table 等）的配置，本组件不实现布局 |

**跟随的上游行为（无差异但在意）**：
- `simple` 模式**仍然渲染 prev/next**（rc 的结构是 `{totalText}{prev}{simple ? simplePager : pagerList}{next}{Options}`）；
- 尺寸切换器的显示判据是 `props ?? ConfigProvider ?? (total > totalBoundaryShowSizeChanger)`（**`??` 合并**，不是布尔或）。

## 3. 文件结构与选型

```
pagination/
├── Pagination.vue        # 壳（antd 层）+ 状态机（rc 层）
├── getPagerList.ts       # 页码列表算法（**纯函数**，含 calculatePage）
├── Pager.ts              # 单个页码
├── Options.ts            # 尺寸切换器注入点 + 快速跳转
├── useShowSizeChanger.ts # 布尔/对象/未传 三态归一
└── style/                # token.ts（12 自有 + 19 输入框族 + 2 派生）+ index.ts（108 条规则）
```

**为什么页码算法抽成纯函数**：它有 6 处边界（`pageBufferSize` / 两个魔数 / `!showLessItems` 挤位 /
±5 与 ±3 / 补类位置），纯函数形态让 L1 能用「224 行判定表」直接穷举对拍 —— 见 §5。

## 4. Component Token（12 个自有 + 19 输入框族 + 2 派生）

判定值与 antd 产物逐字对拍（`node tests/visual/debug/extract-pagination-css.mjs --tokens`）。
输入框族按 `input-number/style/token.ts` 的先例**本地复刻公式、不跨组件 import**
（上游就是每个组件各自调 `initComponentToken`）。

## 5. 实现要点（最容易写错的判据）

1. **页码列表的 6 处边界**（`getPagerList.ts`）：`pageBufferSize = showLessItems ? 1 : 2`；
   `allPages <= 3 + buffer*2` 走全列；跳页项的两个魔数 `current !== 1 + 2` / `current !== allPages - 2`；
   `!showLessItems` 且有跳页项时的**挤位**（`left += 1` / `right -= 1`）；跳页目标 `±5`（`showLessItems` 时 ±3）；
   补类 `-item-after-jump-prev` / `-item-before-jump-next` 的位置（首/末项）。
2. **`current` 是三重钳制**：`clamp(internalCurrent, 1, allPages)`；`total = 0` 时 `allPages = 0` 而
   `current` 钳到 **1**（并渲染一个 `-item-disabled` 的占位项）。
3. **🚨 `changePageSize` 必须先取旧 current**：Vue 的 `computed` 惰性求值 ⇒ 改了 `pageSize` 后
   `mergedCurrent` 会立刻按新 `allPages` 重新钳制；直接 emit 会把 `showSizeChange` 的 `current`
   报成「已回退后的新页」（rc 报的是旧页）。
4. **🚨 快速跳转要先取值再清空**：Vue 的 `ref` 是**同步**的，`setGoInputText('')` 之后读 `validValue`
   会立刻变成 `undefined`（rc 能那么写是因为 React 的 setState 异步）—— 顺序反了就是「点确认没反应」。
5. **🚨 输入过滤要把 DOM 值按回去**：React 对受控 input 有 `restoreControlledState`，Vue 没有 ⇒
   状态不变就不 patch，非法字符会**留在框里**。
6. **prev/next 需要 `hasPrev` / `hasNext` 守卫**（rc 的 `prevHandle` 有）：否则点「已禁用的上一页」
   会把 0 传进 `changeCurrent`，`isValid(0)` 通过（0 是整数、≠ current、total>0），钳回 1 后**多发一次同值事件**。
7. **`simple` 模式仍渲染 prev/next**（见 §2）。
8. **注入点两个字段名**：rc `sizeChangerRender` 的实参叫 `onSizeChange`、antd `components.sizeChanger`
   叫 `onChange` —— 两个都给同一个函数。
9. **`useSize` 必须用函数形态**（`(ctx) => props.size ?? ctx`）：`toRef(props, 'size')` 非响应式，
   `-small` 类名不会落（PITFALLS 163 族）。
10. **`h()` 的 children 必须是 `VNodeChild[]`**：`unknown[]` 会让 `build:ui` 的 vue-tsc 步骤报
    TS2769（vitest 不做这层检查 ⇒ 只有构建门禁能发现）。

## 6. 层与证据

| 层 | 文件 / 命令 | 结果 |
| --- | --- | --- |
| L1 | `__tests__/pagers.test.ts` | **227**（224 行页码判定表对拍 antd 产物 + calculatePage + useShowSizeChanger） |
| L2 | `__tests__/index.test.ts` | **47**（结构 / 值变化 / showTotal / itemRender / 简化模式 / 快速跳转 / 尺寸切换 / ConfigProvider 合并） |
| L3 | `__tests__/type.test-d.ts` | **28**（11 正 + 4 负），`Type Errors: no errors` |
| L4 | `__tests__/semantic.test.ts` + `tests/compat/baselines/pagination.dom.json` | **23** 用例逐节点一致（24/24 通过） |
| L5 | `__tests__/a11y.test.ts` | **36**（12 demo 的 axe + 10 真实配置 + role/ARIA + 键盘） |
| L6 | `tests/visual`（matrix `pagination`：10 variant × 3 viewport） | **30/30 逐像素 exact** |
| L7/demo | `__tests__/theme.test.ts`（12 token 判定 + 4 主题 × 12 demo）+ `demo.test.ts`（12） | 全绿 |
| 构建 | `tests/build/run.mjs` | 见门禁输出 |

## 7. 已知缺口

1. **`getPopupContainer` 的浮层 DOM 位置**（尺寸切换器的 Select 浮层挂 `triggerNode.parentNode`）
   不在 L4 基线里（浮层走 portal，SSR 不可达）；静态帧只验证「切换器在 `-options` 内」。
2. **下拉展开 / 快速跳转输入中的帧**不进像素比对（时刻不确定）。
3. **`responsive` 的 `xs` 分支**在 jsdom 下无法命中 matchMedia（L2 用显式 `size` 验证等价类名）。
4. **`variant-debug` / `component-token` / `style-class`** 三个上游 demo 不落（原因见 §8）。
5. **`PaginationConfig.position`** 只导出类型（属容器职责，table 未落地）。

## 8. demo 覆盖登记

antd 6.6.4 的 `components/pagination/demo/` 有 **16 个** `.tsx`，本仓落 **12 个**
（`demo.test.ts` 的 `expectCount` 钉死）。未落地的 4 个：

| demo | 原因 |
| --- | --- |
| `_semantic` | 上游内部语义调试页（`_` 前缀），不面向用户 |
| `variant-debug` | 上游内部变体调试页（v6 的 `variant` 实验） |
| `component-token` | 依赖 `antd-style` 的 `createStyles` 与 ConfigProvider 的 `theme.components` 覆盖；本仓零运行时 + 静态 CSS，等价能力走 `ConfigProvider` 的 token 覆盖 |
| `style-class` | 同上（`styles` / `classNames` 的语义逃生口用法，依赖 antd-style 写法） |

12 个 demo 覆盖了全部**对外能力**：值域与受控、总数、尺寸切换、快速跳转、简化模式、
尺寸、对齐、每页更少页码、自定义页码、自定义切换器（InputNumber）。
