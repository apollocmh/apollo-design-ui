# Statistic 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/statistic/`（只读参照，H2）
- 分析产物：`docs/analysis/statistic.md`（G1，先于实现存在）
- 复合组件：`Statistic`（注册名 `AStatistic`）/ `Statistic.Timer`（`AStatisticTimer`）/
  `Statistic.Countdown`（`ACountdown`，@deprecated）

## 2. 与 antd 的行为差异清单

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D6 | 前缀 `apollo-statistic` | INTENDED | L4 `statistic:no-props` |
| D5 | 无 hash 包裹；Component Token 2 变量声明在根类 | INTENDED | L4 全部 |
| — | 废弃告警（valueStyle / Countdown）setup 期发一次；antd 每次 render 发 | PLATFORM | L1 告警用例 |
| — | `title` / `prefix` / `suffix` 增加**插槽**通道（prop 优先）—— antd 的 ReactNode prop 在 Vue 侧的等价表达 | PLATFORM | L1 插槽双通道用例 |
| — | Timer 的 `class` / `style` attrs 显式映射为 `className` / `style` prop（antd 是 `{...rest}` 自然转发） | PLATFORM | L4 `statistic:timer-title` |
| — | 首帧（SSR）渲染 `'-'` 的机制：React 是 `useEffect` 置位 state；Vue 是 `onMounted` 置位 ref —— 判据等价（置位前渲染 `'-'`） | PLATFORM | L4 `statistic:timer-ssr` |

## 3. .vue / .tsx 选择

- 全部渲染函数组件（`Statistic.ts` / `Number.ts` / `Timer.ts` / `Countdown.ts`）：
  valueRender 需要拿到 valueNode 的 VNode 引用做 `cloneVNode`（Timer），
  且 Skeleton 包裹用 `h()` 更贴近上游形态（badge/Tag 同范式）。

## 4. Component Token 清单（2 个）

| token | 默认值 | 落地形态 |
|---|---|---|
| titleFontSize | `fontSize`（14） | `--{root}-statistic-title-font-size: var(--apollo-font-size)` |
| contentFontSize | `fontSizeHeading3`（30） | `--{root}-statistic-content-font-size: var(--apollo-font-size-heading-3)` |

两个都是别名派生（antd 的 `prepareComponentToken` 逐字对应），随主题自适应。

## 5. 已知缺口

- `formatter` 的字符串枚举（`'number'` / `'countdown'`）不产生任何行为 ——
  **antd 亦如此**（实现只认 `isFunction(formatter)`），逐字保留。
- Timer 计时精度依赖 `setInterval(1000/60)`，后台标签页会被节流 —— 与 antd 相同的
  浏览器行为，不做补偿。
- demo 的 `animated`（react-countup）与 `card`（Card 组件未落地）做了等价替换，
  见 demo 文件头注释；antd 原样 API 面（formatter 函数 / 语义化样式）已覆盖。

## 6. 关键判据速查

- 可渲染判据 = `isRenderable`（非 null/undefined、非 false、非 `''`）；`0` 渲染。
- Number 内部格式化：正则 `^(-?)(\d*)(\.(\d+))?$`；precision 负数 ⇒ 无 decimal span；
  **Number 的 groupSeparator 默认 `''`，Statistic 默认 `','`**。
- 类名顺序（root）：prefixCls → `-rtl` → contextClassName → className →
  rootClassName → 语义化 root（⚠️ 与 skeleton 的顺序不同）。
