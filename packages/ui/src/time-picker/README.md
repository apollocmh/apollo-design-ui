> 2026-10-30 当前收口：TimePicker/TimeRangePicker 固定时间轴，只提供 value/open/pickerValue 三个真实模型；移除误继承的 mode/defaultMode/update:mode、日期导航与无多选职责的槽声明。当前 attrs/ref/Boolean/原生键盘/owned emits 与原生具名槽已沿用最新共享交付。timePicker 语义配置只合并一次；TimeRange 的 root/style/variant/separator 也读取 timePicker，无 host 的 Date Range 仍读取 rangePicker。无独立 Component Token 或 PurePanel。以下旧阶段、旧告警/未实现说明与结果保留历史原义，当前状态只见 registry。

> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

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
5. ✅ **已修（2026-10-13，Issue #6.2）**：顶层时间 props 静默失效。

   14 个顶层键（`use12Hours` / `hourStep` / `minuteStep` / `secondStep` /
   `millisecondStep` / `hideDisabledOptions` / `showHour` / `showMinute` / `showSecond` /
   `showMillisecond` / `disabledTime` / `disabledHours` / `disabledMinutes` /
   `disabledSeconds`）此前**不在** `PickerCommonProps` 上 ⇒ 落进 `attrs` ⇒
   `getTimeProps` 取不到 ⇒ 面板恒 3 列 24 格。

   **上游判据**（`@rc-component/picker/es/PickerInput/SinglePicker.d.ts`）：

   ```ts
   export interface PickerProps<DateType> extends BasePickerProps<DateType>,
       Omit<SharedTimeProps<DateType>, 'format' | 'defaultValue'> {}
   ```

   **两条根因**（缺一条都修不好，第二条是本轮实测才暴露的）：

   | # | 根因 | 修法 |
   |---|---|---|
   | ① | 键**没声明** ⇒ 落进 `attrs`，`getTimeProps` 的 `pickProps(props, showTimeKeys)` 取不到 | 补进 `PickerCommonProps`（`date-picker/interface.ts`），并在 `DatePicker.vue` / `RangePicker.vue` 里**逐键下发**给 `PickerPanel` —— 面板**自己**也会跑一遍 `getTimeProps(props)`（`picker-panel.ts:298-300`），只折进 `showTime` 不够 |
   | ② | 其中 7 个是 **Boolean** 类型 ⇒ Vue 在**未传时**强制成 `false`，而 `existShowConfig`（`.some(show => show !== undefined)`）把「显式 `false`」判成「用户关了这三列」⇒ `fillShowConfig` 的「全空 ⇒ 全开」兜底失效 ⇒ **一列都不渲染**（实测 24h 从 3 列变 0 列）。⚠️ **薄壳（`TimePicker` / `TimeRangePicker`）也要加** —— 它们整包转发 `props`，不加就把 `false` **显式**喂给内层，内层自己的 `withDefaults` 也救不回来 | 四个文件都在 `withDefaults(…, { use12Hours: undefined, showHour: undefined, … })` 里显式给 `undefined`（PLAN.md 避坑清单第 5 条） |

   **修复后实测**（`__tests__/s6-issue6.test.ts`，口径是 `wrapper.element` 而不是
   `document` —— 后者会串到上一个实例的残留节点上，本轮因此误判过一次）：

   | 场景 | 列数 | 各列格数 |
   |---|---|---|
   | 不传（基线） | 3 | 24 / 60 / 60 |
   | `use12Hours` | **4** | 12 / 60 / 60 / 2（AM·PM） |
   | `hourStep: 15` | 3 | **2**（`00, 15` —— `generateUnits(0, 23, 15)` 的上界是 23）|
   | `minuteStep: 30` | 3 | 24 / **2** / 60 |
   | `disabledTime` | 3 | 24 里 **3 个禁用**（格数不变）|
   | `hideDisabledOptions` | 3 | **21**（跳过禁用档位）|

   ⚠️ `date-picker/hooks/picker-filled.ts` 里「antd 的 `DatePicker` 也不声明它们
   （`InjectDefaultProps<RcPickerProps>` 不含 `SharedTimeProps`）」这条判据**是错的**，
   已一并订正 —— 它正是本缺口长期存在的直接原因（PITFALLS 317）。

   ⚠️ **`demo/12hours` 与 `demo/interval-options` 仍未移植**（`demo.test.ts` 的
   `expectCount` 仍是 14）—— 现在**只是「还没写」**，不再是「写了会说谎」。

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
