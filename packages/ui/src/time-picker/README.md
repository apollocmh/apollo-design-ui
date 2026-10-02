# TimePicker 实现说明

> 规则 R1：本文件记录「仓库文档里没有的」—— 差异、选型理由、Token 落点、已知缺口。

## 1. 对应 antd 组件

- antd 6.6.4 · `es/time-picker/`（只读参照，H2）
- 规模 **412 行产物 / 138 文件**；Component Token **0 个**（本组件**没有样式表**）
- 分析产物：`docs/analysis/time-picker.md`（G1，先于实现存在）

| 上游文件 | 行数 | 本仓 | 形态 |
|---|---|---|---|
| `time-picker/index.tsx` | 174 | `TimePicker.vue` + `TimeRangePicker.vue` | `.vue`（有完整 props/emits/slots 对外面） |
| `time-picker/index.d.ts` | 68 | `interface.ts` | 类型（从 `DatePickerProps` 派生） |
| `date-picker/generatePicker/*` | ~530 | **已有**：`date-picker/DatePicker.vue` / `RangePicker.vue` | 复用 |
| `date-picker/hooks/useMergedPickerSemantic.ts` | 58 | **已有**：`date-picker/hooks/use-picker-semantic.ts` | 复用 |
| `form/hooks/useVariants.ts` | 45 | **已有** | 复用 |
| `_util/PurePanel.tsx` | — | ❌ **无对应物** | 缺口，见 §5 |
| `time-picker/locale/*`（68 个语言） | — | **已有**：`packages/locale` | 复用 |
| **样式** | 0 | **无 `style/`** | 见 §4 |

### 🚨 本组件是 `DatePicker` 的**薄壳**（零自有样式）

`TimePicker` 只做四件事：`variant` 合并 → 语义槽合并 → `addon`→`renderExtraFooter`
→ `mode={undefined}`，然后把一切交给 `DatePicker.TimePicker`（`pickerType = 'timePicker'`）。
`TimePicker.RangePicker` 更薄 —— 上游只有 3 行（`{...props} picker="time" mode={undefined}`）。

⇒ **`tokenCount = 0` 是对的**：`es/time-picker/` 里没有一句样式代码，
138 个「文件」里 136 个是 dayjs 语言包。

## 2. 与 antd 的行为差异清单

<!-- 同步到 COMPATIBILITY.md §9；分类只能是 BUG / INTENDED / PLATFORM / UPSTREAM（AGENTS.md §4.3） -->

| # | 差异 | 分类 |
|---|---|---|
| 1 | 🚨 **它读的 `ConfigProvider` 配置是 `timePicker`，不是 `datePicker`**（内层 `pickerType` 由**入口组件名**决定，不是由 `picker` 模式决定）；且**内外两层各读一次** ⇒ `timePicker.classNames.root` 在最终类名里出现**两次** | 与上游一致 |
| 2 | 🚨 **告警矩阵不对称**：`popupClassName` / `popupStyle` / `bordered` 在**单个** TimePicker 上**不发**废弃告警（外层解构掉了），在 `TimePicker.RangePicker` 上**发**（外层 `{...props}` 原样透传）。三个 prop 的 `.d.ts` 都标着 `@deprecated`，**只有跑一遍才知道谁真发**（探针 `probe-time-picker-antd.mjs`） | 与上游一致 |
| 3 | `TimeRangePicker` 的 `variant` 走 `rangePicker` 那份配置、`separator` 读 `rangePicker.separator`（**不是** `timePicker`） | 与上游一致 |
| 4 | **`ref` 未暴露命令式句柄**（继承 date-picker 的缺口） | 缺口，见 §5 |
| 5 | **`mode` 被强制丢弃**（上游 `mode={undefined}`） | 与上游一致 |
| 6 | 语义槽是「4 平铺 + `popup` 嵌套」，与 `DatePickerSemanticType` **逐字段相同** ⇒ 本仓**别名复用**（上游声明了两份） | PLATFORM（等价简化） |
| 7 | `TimePicker.RangePicker` 的静态成员用 `Object.assign` 表达（Vue 无「函数组件带静态属性」） | PLATFORM |
| 8 | `addon` / `renderExtraFooter` 是**函数 prop**（不是插槽）—— 本仓额外提供了插槽等价物 | PLATFORM（本仓扩展） |
| 9 | 无 `hashId`（D2）；`-css-var` 直接拼（D5 家族） | PLATFORM |

## 3. `.vue` / `.ts` 选择

**`.vue`**（与 `date-picker` 一致）：本组件有完整的 props / emits / slots / expose 对外面，
且渲染体是一棵固定结构的子树 ⇒ 不触发 `COMPONENT-RULES.md` §2 的三个例外条件。

⚠️ **插槽转发不能用 `v-slots`** —— 它是 **JSX-only 的指令**，模板编译器不认识它，
会连发两条告警（`Failed to resolve directive: slots` + `Runtime directive used on
component with non-element root node`）。改用 `<template v-for #[name]>` 动态具名插槽。

## 4. Component Token 清单

<!-- registry 数据：token 数 = 0 -->

**0 个**，且**没有 `style/` 目录** —— 判据：

```sh
ls /tmp/antd-src/package/es/time-picker/          # → index.js / index.d.ts / locale/
ls /tmp/antd-repo/ant-design-master/components/time-picker/   # → 没有 style/ 目录
```

⇒ registry 里 `tokenStatus` / `styleStatus` 置 **`n/a`** + `layerNotes` 写依据
（照 `watermark` 先例），`COMPONENT_STYLES` **不加行**。

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
6. ✅ **已修（2026-10-02）**：时间列从不滚动到选中值 —— 根因在 **`packages/picker` 的
   `TimeColumn`**（`watch(..., { immediate: true, flush: 'post' })` 的首次回调跑在
   本组件渲染**之前** ⇒ `ulRef === null` ⇒ 早退且永不重跑），**不是本组件**。
   修法与实测见 **PITFALLS 318**；`picker` 包回归 **372/372**、`date-picker` **434/434**、
   本组件 L6 **15/15 `exact`（0.000%）**。
   ⚠️ 下面保留的是**当时的现场记录**（含探针与误判），供以后排查同类问题参考。

   **实测**（`tests/visual/debug/probe-timepicker-scroll.mjs`，真浏览器，两侧同一用例）：

   | 侧 | `targetTop`（时/分/秒列） | `scrollTop` @+1.1s | @+2.6s | 选中格 |
   |---|---|---|---|---|
   | react | 336 / 840 / 1260 | **336 / 840 / 1260** | 同左 | 12 / 30 / 45 |
   | vue | 336 / 840 / 1260 | **0 / 0 / 0** | **0 / 0 / 0** | 12 / 30 / 45 |

   `scrollHeight` / `clientHeight` / `offsetTop` / 选中类 **两侧完全一致** ⇒
   不是布局、不是值、不是选中态，而是 **`startScroll()` 的 rAF 循环从未跑起来**
   （或跑了一次就放弃）。`scrollTop` 在 +2.6s 仍是 0 ⇒ **不是「截图早于动画收敛」**。

   **最可能的成因**（待 `picker` 包侧确认）：`time-column.ts` 的
   `watch(..., { immediate: true, flush: 'post' })` 在**首次 post-flush** 就调 `startScroll()`，
   而那一刻浮层里的列**还没有布局盒**（`offsetTop` 全 0）⇒ 命中
   `if (targetLiTop === 0 && targetLi !== firstLi)` 的「等目标格上屏（最多 5 帧）」分支
   ⇒ 5 帧后**放弃**；此后 `props.value` 不再变化 ⇒ watch 不再触发 ⇒ **永久停在 0**。

   ⚠️ **为什么 `date-picker` 一直没暴露它**：它的 `datetime` 变体的时间值是 `00`
   ⇒ `targetLi === firstLi` ⇒ `startScroll` 在守卫处就 return（**不需要滚**）⇒ 恒不触发。
   ⇒ 本组件是**第一个**让时间列真正需要滚动的消费者。

   **影响**：L6 当前 **3/15**（只有不开浮层的 `variants` 全绿），其余 12 张全部 `block-diff`
   （差异率 0.09%–0.74%，随视口变大而反比下降 = **固定尺寸**的面板区域）。
   **未擅自修改 foundation 包** —— `picker` 是 L2 包，改动要走它自己的 7 层 + L6。
7. 🚨 **`defaultOpenValue` 被忽略**（继承 `date-picker` 的缺口，首轮 L6 的另一个根因）。
   `<DatePicker picker="time" defaultOpenValue={12:30:45} />` 的面板**不选中任何格**
   （实测：`-time-panel-cell-selected` 零命中），而 `value` / `defaultValue` **正常**。
   ⇒ 本组件的视觉用例因此**必须由 `value` / `defaultValue` 驱动**，不能用 `defaultOpenValue`。
   ⚠️ 也不能干脆不给值：rc 的 openValue 会回退到 `getNow()` ⇒ 基线随运行时刻 flaky。
   `date-picker/README.md` 的缺口表里有一条相关的（`disableSubmit` 的
   `isTimePickerEmptyValue` 分支），但它把影响限定为「本组件的 `picker` 不含 `'time'`」
   —— 而本组件**正是**那个消费者。
8. **`children` 形态不支持**（上游 `TimePicker` 也没有）。

## 6. 本轮实测结果（G4–G11）

| 层 | 命令 | 结果 |
|---|---|---|
| L1/L2 | `--project unit …/timeline/__tests__/index.test.ts` | **22/22** |
| L3 | `--project types …/type.test-d.ts` | **36/36**，`Type Errors no errors` |
| L4 | `--project dom-contract …/semantic.test.ts` | **22/22**（21 用例机械 oracle + 覆盖检查） |
| L5 | `--project a11y …/a11y.test.ts` | **16/16**（axe 5 形态 0 violation） |
| L6 | `run.mjs --component time-picker --mode compare` | **15/15 `exact`（0.000%）** |
| demo | `--project unit …/demo.test.ts` | **16/16**（14 demo + 计数 + 告警） |

**本轮抓到的真 bug（4 个）**：

1. 🚨 **`picker: 'time'` 没传下去** ⇒ `<TimePicker>` 渲染出**日期面板**。
   `TimePickerProps` 按上游剔除了 `picker` ⇒ `{...rest}` 带不上、内层用了默认 `'date'`。
   `lint:types` 与 L4 都看不出来，只有「断言**面板类型**」的 L1 能抓（**PITFALLS 315**）。
2. 🚨 **Boolean prop 被 Vue 强制成 `false`** ⇒ `bordered` 变 `false` ⇒ 默认渲染 `-borderless`
   （应为 `-outlined`）。补 `withDefaults(..., { bordered: undefined, … })`（PITFALLS 46 同族）。
3. **`defaultValue: null` 无法转发**（上游含 `null`，本仓 `DatePickerProps` 不含）⇒ 归一成 `undefined`。
4. 🚨 **`v-slots` 是 JSX-only 指令** ⇒ 模板里用它会连发两条告警（demo 冒烟抓到）。

**一处**跨组件**修复**（不是本组件的 bug，但本组件是第一个撞上它的消费者）：
🚨 **`picker` 包的时间列从不滚动到选中值** —— `watch(..., { immediate: true, flush: 'post' })`
的首次回调跑在**本组件自己的渲染之前** ⇒ `ulRef === null` ⇒ 早退且永不重跑。
**PITFALLS 318** 有完整现场（含两次误判）；`picker` 包回归 **372/372**、
`date-picker` **434/434**。
