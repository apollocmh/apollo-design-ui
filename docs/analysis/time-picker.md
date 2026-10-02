# TimePicker · G1 分析产物

> **先于实现存在**（`AGENTS.md` §2）。契约来源：antd **6.6.4**
> `components/time-picker/index.tsx`（174 行）+ `__tests__/`（405 行 / 9 文件）+
> `demo/`（17 个用户可见 demo）+ `es/time-picker/index.js`（71 行）+ `index.d.ts`（68 行）。
> 本仓参照：`packages/ui/src/date-picker/`（已 completed）。
>
> **可复现的实测**：`node tests/visual/debug/probe-time-picker-antd.mjs`
> —— 输出「告警矩阵」与「上下文路由」两张表的原始证据（本轮新增，见 §2.4 / §4.2）。

---

## 0. 结论摘要（三句话）

1. **`TimePicker` 是 `DatePicker` 的薄壳，零自有样式**：`TimePicker` 只做
   `variant` 合并 + 语义槽合并 + `addon`→`renderExtraFooter` + `mode={undefined}`，
   然后把一切交给 `DatePicker.TimePicker`（= `getPicker(TIME, TIMEPICKER)`）；
   `TimePicker.RangePicker` 更薄 —— 只有 `picker="time"` + `mode={undefined}`。
   ⇒ **registry 的 `tokenCount = 0` 是对的**，本组件不产 CSS、不产 Component Token。
2. 🚨 **它读的 `ConfigProvider` 配置是 `timePicker`，不是 `datePicker`** ——
   而且**内外两层各读一次** ⇒ `timePicker.classNames.root` 在最终类名里**出现两次**。
   反过来 `datePicker.classNames` **不会**泄漏进来。这两条都已实测（§4.2）。
3. 🚨 **告警矩阵不对称**：`popupClassName` / `popupStyle` / `bordered` 在**单个**
   `TimePicker` 上**不发**告警（外层解构掉了），但在 `TimePicker.RangePicker` 上**发**
   （外层 `{...props}` 原样透传）。三个 prop 的 `.d.ts` 都标着 `@deprecated`，
   **只有跑一遍才知道谁真发**（§2.4）。

---

## 1. 组件面

### 1.1 上游文件 → 本仓

| 上游 | 行数 | 本仓 | 形态 |
|---|---|---|---|
| `time-picker/index.tsx` | 174 | `time-picker/TimePicker.vue` + `TimeRangePicker.vue` | `.vue`（有 props/emits/slots 的对外面） |
| `time-picker/index.d.ts` | 68 | `time-picker/interface.ts` | 类型 |
| `date-picker/generatePicker/generateSinglePicker.tsx` | 291 | **已有**：`date-picker/DatePicker.vue` | 复用 |
| `date-picker/generatePicker/generateRangePicker.tsx` | ~240 | **已有**：`date-picker/RangePicker.vue` | 复用 |
| `date-picker/hooks/useMergedPickerSemantic.ts` | 58 | **已有**：`date-picker/hooks/use-picker-semantic.ts` | 复用 |
| `form/hooks/useVariants.ts` | 45 | **已有**：`form/hooks/useVariants.ts` | 复用 |
| `_util/PurePanel.tsx` | — | ❌ **无对应物**（date-picker 也没有） | 缺口，见 §5 |
| `time-picker/locale/*`（68 个语言） | — | **已有**：`packages/locale` | 复用 |
| **样式** | 0 | **无 `style/`** | 见 §3 |

### 1.2 对外面（`TimePickerProps` 的构成）

```
TimePickerProps = Omit<PickerTimeProps<Dayjs>, 'picker' | 'classNames' | 'styles'> & {
  addon?: () => ReactNode;          // @deprecated → renderExtraFooter
  status?: InputStatus;
  popupClassName?: string;          // @deprecated → classNames.popup.root
  popupStyle?: CSSProperties;       // @deprecated → styles.popup.root
  rootClassName?: string;
  classNames?: …['classNamesAndFn'];  // 4 平铺 + popup（嵌套）
  styles?: …['stylesAndFn'];
}

PickerTimeProps<D> = PickerPropsWithMultiple<D, GenericTimePickerProps<D>>
GenericTimePickerProps<D> = Omit<PickerProps<D>, 'picker' | 'showTime'> & {
  onSelect?: (value: D) => void;    // @deprecated → onCalendarChange
}
```

⇒ **`picker` 与 `showTime` 被剔除**（本组件恒 `picker='time'`），
`classNames` / `styles` 被**换成 TimePicker 自己的语义类型**再挂回去。

`TimeRangePickerProps = Omit<RangePickerTimeProps<Dayjs>, 'picker'> & { popupClassName?, popupStyle? }`
，其中 `RangePickerTimeProps = Omit<RangePickerProps, 'showTime' | 'picker'>`。

### 1.3 静态成员与内部件

| 上游 | 本仓对应 |
|---|---|
| `TimePicker.RangePicker` | `TimePickerRangePicker` 具名导出 + `Object.assign` 别名（照 `date-picker` 的 `DatePickerWithRange` 先例） |
| `TimePicker._InternalPanelDoNotUseOrYouWillBeFired` | ❌ 缺口（`PurePanel` 未落地，与 date-picker 同判） |
| `TimePicker.displayName` | Vue 侧用 `defineComponent({ name: 'ATimePicker' })`（规则 R2） |

### 1.4 依赖面核查（照 skill 的对照表逐项查过）

| antd 用的 | 本仓落点 | 结论 |
|---|---|---|
| `../date-picker` 的 `TimePicker` / `RangePicker` | `date-picker/DatePicker.vue` / `RangePicker.vue` | ✅ 已有，`picker` prop 已支持 `'time'` |
| `../date-picker/hooks/useMergedPickerSemantic` | `date-picker/hooks/use-picker-semantic.ts` | ⚠️ **签名不同**（本仓收**对象**、无 `pickerType` 参数）⇒ 见 §4.2 |
| `../form/hooks/useVariants` | `form/hooks/useVariants.ts` | ✅ 同构（`{component, variant, legacyBordered}`） |
| `../config-provider/context` 的 `useComponentConfig` | `config-provider/context.ts` | ✅ 同构（动态键查 `context.components[propName]`） |
| `../_util/warning` 的 `devUseWarning` | `@apollo-design/utils` | ✅ 已有（date-picker 已用） |
| `../_util/PurePanel` 的 `genPurePanel` | ❌ | 缺口，见 §5 |
| `@rc-component/picker` 的 `PickerRef` | `date-picker` 的 expose 面 | ✅ 复用 |
| `dayjs` | `date-picker/hooks/dayjs-config.ts` | ✅ 复用 |

**没有新增 foundation 缺口**（`next-task.mjs` 报的 9 个 foundation 包全部 completed）。

---

## 2. 行为契约（逐条）

### 2.1 单个 `TimePicker` 的渲染链（`index.tsx:94-154` 逐字）

```
① addon 的废弃告警（devUseWarning('TimePicker')）
② mergedVariant = useVariant('timePicker', variant, bordered)[0]
③ internalRenderExtraFooter = renderExtraFooter ?? addon ?? undefined
④ mergedProps = { ...props, variant: mergedVariant }        ← 给语义槽的 info.props
⑤ [mergedClassNames, mergedStyles] = useMergedPickerSemantic(
     'timePicker', classNames, styles, popupClassName, popupStyle, mergedProps
   )                                                          ← 第 7 参不传
⑥ <InternalTimePicker {...restProps} mode={undefined}
     renderExtraFooter={internalRenderExtraFooter}
     variant={mergedVariant} classNames={mergedClassNames} styles={mergedStyles} />
```

**四处「顺序即语义」**：

1. `mode={undefined}` 写在 `{...restProps}` **之后** ⇒ 用户传 `mode` 也会被覆盖
   （实测：`<TimePicker mode="month" />` 无告警、渲染与裸 TimePicker 相同）。
2. `renderExtraFooter` 在 `{...restProps}` 之后 ⇒ **用户传的 `renderExtraFooter` 被 `??`
   的结果覆盖**；`??` 的语义是「`renderExtraFooter` 优先，其次 `addon`」。
3. `addon` 与 `popupClassName` / `popupStyle` / `bordered` / `classNames` / `styles` /
   `variant` 都**被解构掉**，不进 `restProps` ⇒ 见 §2.4 的告警矩阵。
4. `ref` 是 `PickerRef`（命令式句柄），直接透传给内层 ⇒ 本仓按 `date-picker` 的
   `DatePickerExpose` 复用（不新定义）。

### 2.2 `TimePicker.RangePicker` 的渲染链（`index.tsx:76-78`，只有 3 行）

```jsx
const RangePicker = forwardRef((props, ref) => (
  <InternalRangePicker {...props} picker="time" mode={undefined} ref={ref} />
));
```

🚨 **它不解构任何 prop** —— 所以 `bordered` / `popupClassName` / `popupStyle` / `onSelect`
全部落到内层，由内层（`generateRangePicker`，命名空间 `DatePicker.RangePicker`）发告警。
`picker="time"` 决定内层 `pickerType = 'timePicker'`（语义上下文），但
`useVariant('rangePicker', …)` 与 `rangePicker.separator` **仍读 `rangePicker` 那份配置**。

### 2.3 值 / 开合 / 面板 / 格式化

**本组件不新增任何一条** —— 全部由 `date-picker` 的两条链承担：

- 值状态机 → `date-picker/hooks/picker-value.ts` + `picker-value-change.ts`
- 键入解析 / 掩码 → `date-picker/hooks/picker-typing.ts` + `components/mask-*.ts`
- 面板 → `@apollo-design/picker`（L2 包）
- 开合 / 浮层 → `date-picker` 的 `Trigger` 接线

⇒ **G5/G6 的 L1/L2 只钉三件事**：① `picker='time'` 真的传到了内层；
② `mode` 被强制成 `undefined`；③ 语义槽 / variant / `renderExtraFooter` 的合并结果
真的落到了 DOM（**断言「效果」而不是「传过去了」**，PITFALLS 300）。

### 2.4 🚨 告警矩阵（**实测**，`probe-time-picker-antd.mjs` 的原始输出）

| prop | `<TimePicker>` | `<TimePicker.RangePicker>` |
|---|---|---|
| `addon` | ✅ `[antd: TimePicker] \`addon\` is deprecated. Please use \`renderExtraFooter\` instead.` | —（类型上就没有这个 prop） |
| `onSelect` | ✅ `[antd: TimePicker] \`onSelect\` is deprecated. Please use \`onCalendarChange\` instead.` | ✅ `[antd: DatePicker.RangePicker] …` |
| `dropdownClassName` | ✅ `[antd: TimePicker] \`dropdownClassName\` is deprecated. Please use \`classNames.popup.root\` instead.` | ✅ `[antd: DatePicker.RangePicker] …` |
| `popupClassName` | ❌ **不发**（外层解构掉了） | ✅ `[antd: DatePicker.RangePicker] …` |
| `popupStyle` | ❌ **不发** | ✅（同上） |
| `bordered` | ❌ **不发**（外层解构掉了，只用来算 `variant`） | ✅ `[antd: DatePicker.RangePicker] \`bordered\` is deprecated. Please use \`variant\` instead.` |
| `variant` / `renderExtraFooter` | ❌ 不是废弃 prop，不发 | ❌ 同上 |

🚨 **为什么必须实测**：三个 prop 在 `.d.ts` 里都带 `@deprecated`，
**从类型完全看不出谁会真发告警**。本仓要逐字复刻这张表 ⇒ 实现时
`TimePicker.vue` 必须**自己吞掉** `popupClassName` / `popupStyle` / `bordered`
（合并进语义槽 / 只用来算 variant），而 `TimeRangePicker.vue` 必须**原样透传**。

⚠️ 另一半：**告警的命名空间来自「内层」**。`onSelect` 在单个 TimePicker 上报
`[antd: TimePicker]`（因为内层 `displayName='TimePicker'`），
在 RangePicker 上报 `[antd: DatePicker.RangePicker]`。
本仓 `DatePicker.vue` / `RangePicker.vue` 的命名空间是**硬编码**的
（`useDevWarning('DatePicker')` / `useDevWarning('DatePicker.RangePicker')`）
⇒ 见 §4.3 的设计取舍。

### 2.5 语义槽（4 平铺 + 7 嵌套）

与 `date-picker` **同一套**（`TimePickerSemanticType` 与 `DatePickerSemanticType` 逐字段相同）：

```
root | prefix | input | suffix                                     ← 平铺
popup: { root | header | body | content | item | footer | container }  ← 嵌套
```

- `classNames.popup` 允许 **string**（旧写法）⇒ 等价 `popup.root`。
- `popupClassName` / `popupStyle`（deprecated）也落到 `popup.root`。
- ⚠️ `TimePickerSemanticType` 与 `DatePickerSemanticType` 是**两份独立的类型**
  （上游各自声明），但本仓可以**复用** date-picker 的
  `DatePickerSemanticClassNames` / `Styles` / `Value` + `PickerCommonProps`
  —— 逐字段已核对相同（含 `popup` 的 7 槽）。

### 2.6 locale

`TimePickerLocale = { placeholder?: string; rangePlaceholder?: [string, string] }`。
⚠️ **只有两个字段**（时间轴没有年月日，`lang` 里也不需要月份/星期名）。
本仓 `packages/locale` 已有对应（date-picker 的 locale 补齐层 `fillLocale` 复用）。

### 2.7 a11y

上游 `__tests__/a11y.test.ts` 只有 3 行（`a11yTest()` 共享夹具），
`image.test.ts` 7 行（视觉快照清单），`type.test.tsx` 11 行。
⇒ **a11y 的实质断言全在 date-picker 那边**（role / 键盘 / `aria-*`）。
本组件的 L5 只需钉：① axe 零 violation（含面板打开态）；② 输入框的
`role="combobox"` / `aria-expanded` 链路没有被薄壳破坏；③ 清除按钮的
`aria-label`（`date-picker` 已覆盖，这里只做**不回归**的哨兵）。

---

## 3. 样式契约

**零自有样式。** 判据：

```sh
ls /tmp/antd-src/package/es/time-picker/          # → index.js / index.d.ts / locale/
ls /tmp/antd-repo/ant-design-master/components/time-picker/   # → 没有 style/ 目录
grep -n "style" /tmp/antd-repo/ant-design-master/components/time-picker/index.tsx   # → 零命中
```

`es/time-picker/index.js` 全文 71 行里**没有一句 import style**；
`TimePicker` 的观感 100% 来自 `date-picker` 的 `-picker-*` 样式
（`.ant-picker` / `.ant-picker-time-panel` / `.ant-picker-dropdown` …）。

⇒ 本组件：
- **不建 `style/` 目录**，`tokenCount = 0`（registry 数据一致）；
- `tokenStatus` 置 **`n/a`** + `layerNotes` 写依据（E16 要求 n/a 有架构依据）；
- `styleStatus` 置 **`n/a`**（同上）；
- `COMPONENT_STYLES` **不加行**（加了会产出 0 条规则的空文件）。

---

## 4. Vue 对应（平台差异与关键设计）

### 4.1 `.vue` vs `.ts` 的选择

**用 `.vue`**（与 `date-picker` 一致）：本组件有完整的 props / emits / slots / expose 对外面，
且渲染体是一棵固定结构的子树（不是「纯渲染函数型内部件」）⇒ 不触发
`COMPONENT-RULES.md` §2 的三个例外条件。

### 4.2 🚨 最关键的设计问题：**`timePicker` 上下文怎么路由**

**问题**：本仓 `DatePicker.vue:220` 与 `RangePicker.vue:194` **硬编码**
`useComponentConfig('datePicker')`；而 antd 的内层 `DatePicker.TimePicker`
（`pickerType = displayName === 'TimePicker' ? 'timePicker' : 'datePicker'`）
读的是 **`timePicker`**。

**实测的 antd 行为**（`probe-time-picker-antd.mjs`）：

| 场景 | antd 根类名 |
|---|---|
| `timePicker.classNames.root='ctx-root'` + `<TimePicker/>` | `… ctx-root ctx-root`（**两次**） |
| `datePicker.classNames.root='dp-root'` + `<TimePicker/>` | `…`（**没有** `dp-root`） |
| `timePicker.classNames.root='ctx-root'` + `<DatePicker picker="time"/>` | `…`（**没有** `ctx-root`） |
| `datePicker.classNames.root='dp-root'` + `<DatePicker picker="time"/>` | `… dp-root` |

⇒ 两条判据：
1. **`TimePicker` 只认 `timePicker`**，`datePicker` 的配置一点都不泄漏；
2. `TimePicker` 的语义槽**合并两次**（外层一次 + 内层一次）⇒ 类名重复出现。

**候选方案**：

| 方案 | 内容 | 判定 |
|---|---|---|
| **A（选它）** | 新增内部 `InjectionKey`（照 `steps/context.ts` 先例，**不进任何公开 props**）：`DatePicker.vue` / `RangePicker.vue` 改 `useComponentConfig(inject(pickerContextKey, 'datePicker'))`；`TimePicker.vue` / `TimeRangePicker.vue` `provide(pickerContextKey, 'timePicker')` | ✅ 与 antd **结构同构** ⇒ 重复两次、无泄漏，**自动对齐**；代价是改 `date-picker`（已 completed）⇒ 必须单独跑它的 7 层回归 |
| B | 不改 date-picker：外层把合并结果当 `classNames`/`styles` props 传下去 | ❌ `components.datePicker.classNames` 会**泄漏**进 TimePicker（实测 antd 不泄漏）⇒ 只能登记成 BUG，不可接受 |
| C | 外层不合并，只透传，让内层读 `datePicker` | ❌ 两个方向都错（该读的不读、不该读的读） |

🚨 **方案 A 的注意点**：`InjectionKey` 必须在**渲染 `DatePicker` 的那一层** `provide`，
而 `DatePicker.vue` 是它的**直接子组件** ⇒ 不会被「最近的赢」遮蔽
（PITFALLS 256 的形态是**中间层自己 provide 同族键**，这里不存在中间层）。

### 4.3 告警命名空间的实现取舍

`onSelect` 在单个 TimePicker 上要报 `[apollo: TimePicker]`，但本仓
`DatePicker.vue` 的 `useDevWarning('DatePicker')` 是硬编码的。

**方案**：`TimePicker.vue` **自己**发 `onSelect` 的告警（命名空间 `'TimePicker'`），
并**把 `onSelect` 从透传里摘掉**？—— **不行**：`onSelect` 必须仍然生效
（上游 `legacy.test.tsx` 断言点击面板单元格后 `onSelect` 被调用且拿到值）。

⇒ 采用：**同一个 `InjectionKey` 携带 `{ contextKey, warningName }`**，
`DatePicker.vue` 的 `useDevWarning` 名字从注入值取（默认 `'DatePicker'`）。
这样 `onSelect` 的告警自然由内层发出、命名空间正确，且**只发一次**。

⚠️ 这与 §2.4 的表一致：单个 TimePicker 只对 `onSelect` / `dropdownClassName` 发告警，
而这两个**都在 `restProps` 里**（透传给内层）⇒ 由内层发，命名空间取自注入值。

### 4.4 `Object.assign` 挂静态成员

照 `date-picker` 的 `DatePickerWithRange` 先例：
`export const TimePickerWithRange = Object.assign(TimePicker, { RangePicker })`。
⚠️ `Object.assign` 是**原地**修改 ⇒ `TimePicker` 自己也带上 `RangePicker`；
返回值额外把类型带上（直接赋值需要 `as any`，H10 禁止）。

### 4.5 其它平台差异

| # | 差异 | 分类 |
|---|---|---|
| 1 | `PurePanel` / `_InternalPanelDoNotUseOrYouWillBeFired` 未落地（`genPurePanel` 无对应物） | **缺口**（与 date-picker 同判，登记 README §5；`render-panel` demo 随之不移植） |
| 2 | `TimePicker.RangePicker` 的静态成员用 `Object.assign` 表达（Vue 无「函数组件带静态属性」） | PLATFORM |
| 3 | `ref` 暴露 `PickerRef` 命令式句柄 —— 本仓复用 `DatePickerExpose` / `RangePickerExpose` | PLATFORM |
| 4 | `addon` 的**函数**形态 ⇒ Vue 侧收 `() => VNodeChild`（不是 slot） | PLATFORM（与 `renderExtraFooter` 同判，date-picker 已如此） |
| 5 | 无 `hashId`（D2）；`-css-var` 直接拼（D5 家族） | PLATFORM |

---

## 5. 预判差异

| # | 差异 | 分类 | 处置 |
|---|---|---|---|
| 1 | `ConfigProvider.datePicker.*` 是否会作用于 `TimePicker` | **BUG（若发生）** | 方案 A 消除；L1 用「不泄漏」的哨兵用例钉住 |
| 2 | 语义槽合并次数（类名重复两次） | 与上游一致 | 方案 A 下自动一致；L1 断言 `ctx-root` 出现**两次** |
| 3 | 告警矩阵（§2.4） | 与上游一致 | 逐个 prop 写用例；**必须断言「不发的那三个真的没发」**（豁免可自证的反面） |
| 4 | `PurePanel` 缺失 | 缺口 | README §5 登记；`render-panel` demo 不移植，`demo.test.ts` 的 `expectCount` 相应钉死 |
| 5 | `mode` 被强制 `undefined` | 与上游一致 | L1 哨兵：传 `mode="month"` 不生效 |
| 6 | `variant` 的解析链（`props.variant > bordered===false > components.timePicker.variant > 全局 variant > 'outlined'`） | 与上游一致 | L1 逐级用例 |
| 7 | `TimePicker.RangePicker` 的 `separator` 读 `rangePicker.separator`（**不是** `timePicker`） | 与上游一致 | L1 哨兵（这条最容易「顺手写对成 timePicker」） |

⚠️ 上面 1 / 2 / 7 三条是**本组件的核心考点** —— 都是「看起来该读 A、实际读 B」的形态。

---

## 6. 本分析没有证明什么

1. **没证明视觉正确**。本组件零自有样式 ⇒ 视觉差异只可能来自薄壳把某个 prop 传错
   （如 `variant` 没传、`mode` 没覆盖）。L6 逐像素是唯一判据。
2. **没证明面板 / 值状态机正确**。那是 `date-picker` 与 `picker` 包的契约，
   本组件只负责「把 prop 原样送到位」。
3. **没证明 `PurePanel` 缺口可接受**。它只是被**登记**，不是被证明无害；
   `render-panel` demo 的缺失会让 G11 的 `expectCount` 与上游差 1。
4. **没证明告警矩阵覆盖全部 prop**。§2.4 只测了 7 个（上游 `.d.ts` 里的全部
   `@deprecated` 字段 + `variant` 对照组）；`PickerProps` 里若还有未标注的废弃字段，
   需要 G4 时再补一轮探针。
5. **没证明 `InjectionKey` 方案对 `date-picker` 的既有用例零影响**。
   它是**新增**注入 + 默认值 ⇒ 理论上行为不变，但必须跑一遍 `date-picker` 的 7 层回归
   才算证完（SOUL.md：不擅自改别的组件；跨组件影响要单独过它的门禁）。
