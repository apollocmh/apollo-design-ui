# TimePicker 实现说明

> 规则 R1：本文件必须记录（G11 前补齐）：

## 1. 对应 antd 组件

- antd 6.6.4 · `es/time-picker/`（只读参照，H2）

## 2. 与 antd 的行为差异清单

<!-- 同步到 COMPATIBILITY.md §9；分类只能是 BUG / INTENDED / PLATFORM / UPSTREAM（AGENTS.md §4.3） -->

## 3. .vue / .tsx 选择

- 默认 .vue。若用 .tsx，在此写明理由（COMPONENT-RULES.md §2 的三条件之一）。

## 4. Component Token 清单

<!-- registry 数据：token 数 = 0 -->

## 5. 已知缺口

<!-- 未支持的能力 + 落点（范本见 divider/README.md §7） -->

1. **`PurePanel` / `_InternalPanelDoNotUseOrYouWillBeFired` 未落地** —— `genPurePanel`
   在本仓无对应物（`date-picker` 也没有）⇒ 上游 `demo/render-panel.tsx` 不移植。
2. 🚨 **继承 `date-picker` 的缺口：`classNames.root` / `styles.root` 没接到根元素上**。
   `date-picker/components/root-class.ts` 的 `getRootClassNames` **没有这个入参**、
   `Selector` 也不消费 `classNames.root` ⇒ `<TimePicker classNames={{ root: 'x' }}>` 的 `x`
   **不出现**在 `.apollo-picker` 上（上游会）。
   ⚠️ 本组件的 L1 因此**改用 `suffixIcon` 作路由探针**（同一条 `useComponentConfig` 通道）。
3. **`ref` 未暴露命令式句柄**：上游 `TimePicker` 的 `ref` 是 `PickerRef`
   （`focus` / `blur` / `nativeElement`…），本仓 `DatePicker.vue` / `RangePicker.vue`
   **没有 `defineExpose`** ⇒ `TimePickerExpose` / `TimeRangePickerExpose` 是
   **已声明的类型契约但运行时未实现**。⚠️ 同样是继承来的缺口。
4. **`ConfigProvider` 的 `TimePickerConfig` 类型未提升**：与 anchor / masonry / card /
   avatar / list / timeline 一致（走 `components?: Record<string, ConfigLike>`，
   运行时可用、只是类型宽）。
5. 🚨 **顶层时间 props 静默失效**（`use12Hours` / `hourStep` / `minuteStep` /
   `secondStep` / `millisecondStep` / `hideDisabledOptions` / `showHour` / `showMinute` /
   `showSecond` / `showMillisecond` / `disabledTime` / `disabledHours` / `disabledMinutes` /
   `disabledSeconds`）—— 它们**不在**本仓 `PickerCommonProps` 上。

   **实测**（临时 vitest 探针；SSR 看不到浮层，不能用 SSR 探针）：

   | 场景 | 面板列数 | 第一列格数 |
   |---|---|---|
   | `<DatePicker picker="time"/>` | 3 | 24 |
   | `<DatePicker picker="time" use12Hours/>` | 3 | **24** ← 应为 12 项 + AM/PM 列 |
   | `<TimePicker use12Hours/>` | 3 | **24** ← 同上 |
   | `<TimePicker showTime={{ use12Hours: true }}/>` | **4** | 24 ← `showTime` 通道**生效** |

   **上游判据**（`@rc-component/picker/es/PickerInput/SinglePicker.d.ts` 全文）：

   ```ts
   export interface PickerProps<DateType> extends BasePickerProps<DateType>,
       Omit<SharedTimeProps<DateType>, 'format' | 'defaultValue'> {}
   ```

   ⇒ `PickerProps` **本身就有** `use12Hours` / `hourStep` / … ⇒ antd 的 `TimePickerProps`
   （`Omit<PickerProps, 'picker' | 'showTime'>`）与 `DatePickerProps` **都接受**它们
   （已用 `tsc` 探针验证）。

   ⚠️ `date-picker/hooks/picker-filled.ts:96` 的注释写着「antd 的 `DatePicker` 也不声明它们
   （`InjectDefaultProps<RcPickerProps>` 不含 `SharedTimeProps`）」—— **这条判据是错的**，
   是本缺口能长期存在的直接原因（PITFALLS 317）。

   **影响**：`demo/12hours` 与 `demo/interval-options` **无法忠实移植**（写了也是 24 小时面板
   ⇒ demo 会说谎）⇒ `demo.test.ts` 的 `expectCount` 相应少 2。
   **未擅自修改已 completed 的 `date-picker`** —— 修法是把这 14 个键补进 `PickerCommonProps`
   并传进面板（面板侧 `getTimeProps(props)` 已支持顶层时间 props，缺的只是「组件层声明 + 转发」），
   需要一次跨组件的独立修复 + 它的 7 层回归。
6. **`children` 形态不支持**（上游 `TimePicker` 也没有）。
