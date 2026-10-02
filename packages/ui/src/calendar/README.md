# Calendar 实现说明

> 契约来源：antd **6.6.4** 的 `es/calendar/`（`generateCalendar.js` 445 行 +
> `Header.js` 201 行 + `style/index.js` 275 行）。
> 逐条判据见 `docs/analysis/calendar.md`（G1 产物）与
> `packages/ui/src/calendar/PLAN.md`（Gate 检查单）。

## 1. 对应 antd 组件

| 上游 | 行数 | 本仓 | 形态 |
|---|---|---|---|
| `generateCalendar.tsx` | 445 | `Calendar.vue` | `.vue`（无模板 + 渲染函数） |
| `Header.tsx` | 201 | `components/CalendarHeader.ts` | `.ts` 渲染函数（三块内联子组件） |
| `style/index.ts` | 275 | `style/index.ts` + `style/token.ts` | 见 §4 |
| `locale/*`（68 语言） | — | `@apollo-design/locale` 的 `Calendar` 分片 | 复用 |
| `date-picker/style` 的 `genPanelStyle` 等 | — | `date-picker` 的 `PANEL_RULES` / `genPanelRules` / `initPanelComponentToken` | **跨组件复用**（上游也是 `import`） |

### 🚨 三条最容易写错的判据

1. **类名前缀是 `apollo-picker-calendar`**（`getPrefixCls('picker')`），
   而 **CSS 变量是 `--apollo-calendar-*`** —— **类名与变量名的命名空间不同**。
   ⚠️ 但 `prefixCls` 作为 **prop** 传时会**整体覆盖**（传 `'apollo'` ⇒ `apollo-calendar`）。
2. **`triggerChange` 的顺序即语义**：`setMergedValue` → 与当前值**同一天则 `change` /
   `panelChange` 都不发** → 跨月（`panelMode==='date'`）或跨年（`panelMode==='month'`）
   才**补发** `panelChange` → 最后才 `change`。
3. 🚨 **`dateRender` 判 `isFunction(fullCellRender)`，而 `monthRender` 判 `fullCellRender`
   的「真值」** —— **两处判据不同**，照抄上游别「统一」。

## 2. 与 antd 的行为差异清单

| # | 差异 | 分类 | 说明 |
|---|---|---|---|
| 1 | `value` + `onChange` → `v-model:value` + `@change`（**双发**） | INTENDED | 规则 C11 |
| 2 | `mode` + `onPanelChange` → `v-model:mode` + `@panelChange`（**双发**） | INTENDED | ⚠️ `update:mode` **只在模式真的变了**时发；`panelChange` 会因「日期跨月/跨年」多发一次 |
| 3 | `onSelect` → `@select`（无 v-model 通道） | 同上游 | 它不是状态 |
| 4 | `headerRender` / `cellRender` / `fullCellRender` 双通道（函数 prop + scoped slot） | INTENDED | 规则 C8 |
| 5 | `ref` → `expose({ nativeElement })` | PLATFORM | 上游 `CalendarRef` 也只有这一个字段（**不补** `focus` / `blur`） |
| 6 | 4 个废弃 prop 的判据是 `!== undefined` | PLATFORM | Vue 的 `props` 恒含所有声明过的键，照抄 `in props` 会**恒告警** |
| 7 | 无 `hashId` | PLATFORM | D2；`-css-var` 直接拼（D5 家族） |
| 8 | 别名 token 落 `var(--apollo-*)` 而非解析后字面量 | INTENDED | 与 date-picker 同判（零运行时 + 静态 CSS 下的必然选择） |
| 9 | 🚨 根节点**不透传 `attrs`** | 同上游 | 上游 `generateCalendar.js` 里 `restProps` 出现 **0** 次 ⇒ `id` / `data-*` / `aria-*` 被丢弃。⚠️ 但 Vue 的 `class` / `style` 会**显式并入**（React 那边它们是 prop） |

## 3. `.vue` / `.ts` 选择

- `Calendar.vue` 用 **无模板 + 渲染函数**（照 `slider/Slider.vue`）——
  根类名是条件组合、header 与面板都是组件、`headerRender` 的返回值要过
  `NodeRenderer`（`.vue` 模板没有「渲染一个 VNode 变量」的语法）。
- `components/CalendarHeader.ts` 用**渲染函数**：上游这一个文件里有**三个内联子组件**
  （`YearSelect` / `MonthSelect` / `ModeSwitch`），写成 `.vue` 会得到三个近乎空的 SFC。

## 4. Component Token 清单

**6 个自有**（registry 的 `tokenCount = 6` 是实测口径）：

| token | 默认值来源 |
|---|---|
| `fullBg` | `colorBgContainer` |
| `fullPanelBg` | `colorBgContainer` |
| `itemActiveBg` | `controlItemBgActive` |
| `yearControlWidth` | 字面量 `80` |
| `monthControlWidth` | 字面量 `70` |
| `miniContentHeight` | 字面量 `256` |

⚠️ `prepareComponentToken` 里 **`...initPanelComponentToken(token)`** ⇒ 实测
**27 条** `--apollo-calendar-*` 声明（6 自有 + 21 面板，含内部的
`internal_fixed_item_margin`）。

**5 个 `mergeToken` 派生**里 3 个进 CSS（`CALENDAR_DERIVED` 固化成**表达式**，
因为产物里它们本来就是表达式）：`dateValueHeight` / `weekHeight` / `dateContentHeight`；
`calendarCls` / `pickerCellInnerCls` 是拼出来的类名，不进 CSS。

## 5. 已知缺口

| # | 缺口 | 落点 |
|---|---|---|
| 1 | `lunar` demo 需要第三方 `lunar-typescript`（未安装） | 不移植，见 `__tests__/demo.test.ts` 的文件头 |
| 2 | `component-token` demo 用 `theme.components.Calendar` 调试 token | 与全仓 10+ 组件同判（零运行时架构下 token 是构建期产物） |
| 3 | `event-range` / `notice-calendar` / `style-class` 三个 demo 里的 `antd-style`（第三方 CSS-in-JS） | **demo 级替换**：改用内联 style / SFC `<style>` 块（效果等价） |
| 4 | `card` / `customize-header` 里的 `theme.useToken()` | **demo 级替换**：写等值字面量（本仓没有这个 hook） |
| 5 | `style-class` 的函数式 `styles` 在 `else` 分支 `return undefined` | **类型收窄**：本仓 `CalendarSemanticValue<T, P>` 的函数分支要求返回 `T`（与上游 `GenerateSemantic` 同形，**不收 `undefined`**）⇒ demo 返回 `{}`（6 槽全可选，效果等价） |

⚠️ 以上都是 **demo 级**或**全仓同判**的缺口，**不是组件能力缺口** ——
组件的 6 层门禁全部达标（见 §6）。

## 6. 本轮实测结果（G0–G11）

| 层 | 结果 |
|---|---|
| L1/L2（unit） | **29 / 29** |
| L3（types） | **42 / 42**，`Type Errors no errors` |
| L4（dom-contract） | **28 / 28**，**零豁免** |
| L5（a11y） | **14 / 14**（axe 8 形态 0 violation；唯一豁免 `label`，照 select 同判） |
| L6（visual） | **30 / 30 exact（0.000%）**（10 变体 × 3 视口，React 基线入库） |
| L7（theme） | **18 / 18** |
| demo | **10 / 10**（8 demo + 计数 + 防腐烂） |

### 🚨 本轮抓到的真 bug（都已修）

1. **`triggerChange` 先写状态再比较**（PITFALLS 13/207）：Vue 的 `computed` 写完**立刻**
   变 ⇒ `isSameDate` 恒真 ⇒ **非受控模式下 `change` / `panelChange` 永远不发**。
   修法：`const prev = mergedValue.value` **先取快照**。
2. **`calc()` 多了一个 `)`**：`height:calc(… + var(--apollo-line-width-bold)))`
   ⇒ 浏览器**丢弃整条 `height`** ⇒ `showWeek` 的周号落到行中间（antd 贴行顶）。
   修法：删掉多余的括号 + **加括号配平守卫**（本组件与 date-picker 各一条）。
3. **`semanticProps.mode` 用错值**：上游 `{...props, mode, fullscreen, showWeek}` 里
   只有 `fullscreen` 有解构默认值 ⇒ `mode` 未传时是 `undefined`（**不是** `'month'`）。
4. **`classNames` / `styles` 的运行时类型写成 `Object`**，而它们支持**函数形态**
   ⇒ Vue 报警告但**用例照过**（只有告警没有红灯的假绿）。改成 `[Object, Function]`。
5. **`genPanelRules` 只换了作用域类**，选择器其余部分的面板类名没换 ⇒
   `ant` 版产出 `.ant-picker-calendar .apollo-picker-panel{…}`（面板样式不生效）。

### ⚠️ 顺带修掉的**跨包**问题

- **`picker` 的面板根元素泄漏 `value` 属性**（`PickerPanel` 传了但 8 个面板都不读，
  Vue 落 `attrs`）⇒ 在 `sharedPanelProps` 里**声明**它 + 3 条哨兵（已自证）。
- **`date-picker` 的 `ant` 前缀样式为空**（`dist` 里 `.ant-picker-*` 0 条）⇒
  新增 `genDatePickerRules`；顺带全仓扫描发现**另有 22 个组件**同类缺口，
  已登记在 `packages/ui/src/__tests__/style-prefix.test.ts` 的 `KNOWN_GAPS`（**双向校验**）。
