# Slider 实现说明

> 收口记录（2026-09-29）。

## 1. 对应 antd 组件

- antd 6.6.4 `es/slider/`：`index.js` 232 行（**薄壳**）+ `SliderTooltip.js` 42 行 +
  `Context.js` 3 行 + `style/index.js` 337 行
- rc 内核：`@rc-component/slider@1.1.1`（es 侧 **3344 行**：`Slider.js` 453 /
  `hooks/useOffset.js` 282 / `hooks/useDrag.js` 219 / `Handles/Handle.js` 173 /
  `Handles/index.js` 94 / `Tracks` 144 / `Steps` 84 / `Marks` 68 / 其余工具）
- 分析产物：`docs/analysis/slider.md`（值域状态机 / 几何与量化 / 键盘表 / 拖拽与点击 /
  tooltip 三态 / DOM 结构 / 18 token）
- 复用的本仓资产：`tooltip`（浮层）、`_internal/use-orientation`、
  `_internal/{use-merge-semantic,to-css-size,color-composite}`、`config-provider` 的
  Size/Disabled/Direction context
- 样式：**机械移植** antd 产物（54 条规则），18 个 Component Token

## 2. 与 antd 的行为差异清单（同步 COMPATIBILITY.md §9）

| # | 差异 | 分类 | 说明 |
| --- | --- | --- | --- |
| 1 | `value` + `onChange` → `v-model:value`（同时发 `change`，C11） | INTENDED | §3 映射 |
| 2 | `onChangeComplete` / `onBeforeChange` / `onFocus` / `onBlur` → **emits** | INTENDED | C5；`focus`/`blur` 带**把手索引**（对齐 rc 的 `onFocus(e, index)`） |
| 3 | `handleRender` / `activeHandleRender` → **scoped slot** `#handle` / `#activeHandle` | INTENDED | C8；槽参数额外给出 `nodeProps` / `className` / `style`（rc 是「包 node」，本仓可包可换 —— **加强**） |
| 4 | `SLIDER_INTERNAL_CONTEXT` → `provide/inject`（`sliderInternalContextKey`） | INTENDED | C4 |
| 5 | `flushSync` 无对应物（`hideHelp` 只改 ref） | PLATFORM | D74 判例：Vue 响应式同步即等价；影响面是「拖拽结束那一帧内立刻读 DOM」 |
| 6 | Tooltip 用本仓实现 | INTENDED | antd 用自己的 Tooltip |
| 7 | `SliderTooltipProps` 按「本仓 Tooltip 的 props 子集 + slider 专有项」重新定义 | INTENDED | 不搬 antd 的 `AbstractTooltipProps` 继承链 |

**跟随的上游行为（无差异但在意）**：裸 `<Slider />` 的 `role="slider"` 没有可访问名
（axe `aria-input-field-name`）—— 与 antd 逐字一致，组件不编假名，见 COMPATIBILITY 的 **U13**。

## 3. 文件结构与选型

```
slider/
├── Slider.vue          # 壳（antd 层）+ 状态机（rc 层）三层合一
├── SliderTooltip.ts    # 包本仓 Tooltip（classNames.root = {p}-tooltip）
├── Handles/
│   ├── index.ts        # 把手列表 + 活动把手替身 + expose(focus/hideHelp)
│   └── Handle.ts       # 位置 / 键盘表 / ARIA 全套 / #wrapper 槽
├── Tracks/  Steps/  Marks/   # 轨道 / 刻度点 / 文字标记（各一个 index.ts）
├── hooks/
│   ├── use-offset.ts   # 量化内核（formatValue / offsetValues / 禁用锚点 / 最近把手）
│   ├── use-drag.ts     # 拖拽（指针事件 + 拖拽删除 + returnValues 差异判据）
│   └── use-range.ts    # range 五开关 + disabled 两态
├── context.ts          # SliderContext / UnstableSliderContext / SliderInternalContext
├── util.ts             # getOffset / getDirectionStyle / getIndex
└── style/              # token.ts（18 个）+ index.ts（54 条规则机械移植）
```

- 全部 `.ts` + 渲染函数（位置 style、键盘表、条件类名与槽转发都是命令式的），
  `Slider.vue` 用 `<script lang="ts">`（不是 `setup` 模板）—— 与 `Form.vue` 同判。

## 4. Component Token（18 个）

`prepareComponentToken` 与 antd 6.6.4 产物逐字对拍，判定值见 `index.zh-CN.md` 的 Token 表。
两处构建期算式：`setA(0.2)`（`handleActiveOutlineColor`）与
`onBackground`（`handleColorDisabled` —— 已按三次法则收敛到 `_internal/color-composite.ts`）。

⚠️ antd 的 `marginPart` **不是 token**：产物里它始终是 calc 表达式，已逐字落在规则里。

## 5. 实现要点（最容易写错的判据）

1. **量化是「候选集合上的最近值」**：`formatValue` 的候选 = `marks ∪ {step 对齐值} ∪ {min,max}`，
   并列时**后者胜**（`<=` 而非 `<`）⇒ 候选顺序敏感，别重排。
2. **`offsetValues` 的两个模式语义完全不同**：数字 offset 在 `unit` 模式是「候选步数」
   （PageUp/Down 的 ±2 与方向键的 ±1 都走这里），要按**距离**位移必须用 `'dist'`（拖拽用）。
3. **`pushable` 的四段回推**（Basic push 的 End/Start + Revert 的 End→Start、Start→End）：
   顺序与方向都不可改，改了会出现「把手互相穿过」或「推不动」；`pushable === true` 在组件层
   归一成 `mergedStep`（`step === null` 时退化为 false）。
4. **禁用把手是固定锚点**（`getDisabledBoundaryValues`），且「有任一禁用」会关掉
   `range.editable` 与整轨拖拽。
5. **键盘表**：**Up is plus**、纵向 `ttb` 反转、`PageUp/PageDown = ±2 候选步`、
   `preventDefault` **只在有位移时**、**`keyup` 才 `changeComplete`**。
6. **拖拽结束要把焦点交给被拖的把手**（rc 的 `useEffect(…, [dragging])` +
   `rawValues.lastIndexOf(draggingValue)`）—— 缺它时「拖完接着按方向键改的是另一个把手」
   （G5 的 L2 用例抓出来的）。
7. **事件链**：`beforeChange`（载荷是**新值**）→ `update:value` + `change` → `changeComplete`；
   点 mark 走「无 `e`」分支：不开始拖拽、同步 `changeComplete`，但**仍发** beforeChange。
8. **`value` 归一的补齐判据是 `count || value === undefined`**：受控 `[50]` 的 range
   **只有 1 个把手**（不是补齐成 2 个）。
9. **RTL 下 antd 会把 `reverse` 取反**（横向 slider 在 RTL 页面上反向）——照做。
10. **marks 归一**要过滤「label 为 falsy 且非 number」并升序；`label === 0` 必须渲染。

## 6. 层与证据

| 层 | 文件 / 命令 | 结果 |
| --- | --- | --- |
| L1/L2 | `__tests__/index.test.ts` | **64 用例** |
| L3 | `__tests__/type.test-d.ts` | **15 用例**（11 正 + 4 负），`Type Errors: no errors` |
| L4 | `__tests__/semantic.test.ts` + `tests/compat/baselines/slider.dom.json` | **17 用例**逐节点一致（18/18 通过） |
| L5 | `__tests__/a11y.test.ts` | **32 用例**（13 demo 的 axe + 7 真实配置 + role/ARIA + 键盘焦点） |
| L6 | `tests/visual`（matrix `slider`：8 variant × 3 viewport） | **24/24 逐像素 exact**（首次即过） |
| L7/demo | `__tests__/theme.test.ts`（含 demo 主题矩阵）+ `__tests__/demo.test.ts`（13） | 全绿 |
| 构建 | `tests/build/run.mjs` | 见门禁输出 |

## 7. 已知缺口

1. **hover / active / focus-visible 三态与拖拽过程帧**不进像素比对（`run.mjs` 只截静态帧）；
   其 CSS 规则本身由样式机械移植保证，语义由 L2 钉。
2. **tooltip 浮层**不在 L4 基线里（portal 在 SSR 不可达），只在 L2 断言开合与内容。
3. **真实指针的坐标精度**：jsdom 无布局，L2 用手写 rect 替身 —— 真实浏览器的几何由 L6 的
   静态位置 style 间接覆盖（`left/width` 百分比）。
4. **`activeHandle`（range 的「跟随当前把手的 tooltip」）** 只做了结构与透传，
   三态开合的交互断言依赖 hover/focus 时序，未在 L2 全量覆盖。
5. **`aria-input-field-name`**：不给把手名字时 axe 会报（上游同判，U13）—— 不是缺陷，但
   文档里必须写明「要给名字」。

## 8. demo 覆盖登记

antd 6.6.4 的 `components/slider/demo/` 有 **16 个** `.tsx`，本仓落 **13 个**（`demo.test.ts`
的 `expectCount` 钉死）。未落地的 3 个：

| demo | 原因 |
| --- | --- |
| `_semantic` | 上游内部语义调试页（`_` 前缀），不面向用户 |
| `component-token` | 依赖 `antd-style` 的 `createStyles` 与 ConfigProvider 的 `theme.components` 覆盖；本仓零运行时 + 静态 CSS，等价能力走 `ConfigProvider` 的 token 覆盖（登记在 config-provider 的文档里） |
| `style-class` | 同上（`styles` / `classNames` 的语义逃生口用法），本仓已支持 `classNames`/`styles` 5 槽，但 demo 依赖 antd-style 写法 |

⚠️ 这不是「按需挑选」：13 个 demo 覆盖了全部**对外能力**（值域、range 四种配置、方向、
标记与刻度、禁用两态、事件链、tooltip、自定义把手、与 InputNumber 联动）。
