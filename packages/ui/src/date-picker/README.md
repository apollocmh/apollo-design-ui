# DatePicker 实现说明

> 规则 R1：本文件必须记录（G11 前补齐）。

## 1. 对应 antd 组件

- antd 6.6.4 · `es/date-picker/`（只读参照，H2）
- 面板层**不在本组件**：由 foundation 包 `@apollo-design/picker` 提供
  （裁决 `picker-panel-ownership` = B）。本组件只做**输入框 + 浮层容器 + 状态类 + 语义槽**。

## 2. 与 antd 的行为差异清单

<!-- 同步到 COMPATIBILITY.md §9；分类只能是 BUG / INTENDED / PLATFORM / UPSTREAM（AGENTS.md §4.3） -->

| # | 差异 | 分类 | 依据 |
|---|---|---|---|
| 1 | locale 缺 `fieldXxxFormat` 时：上游 `.map(c => c.format)` 在 `undefined.format` 上**抛 TypeError**；本仓 `toArray(null\|undefined)` ⇒ `[]`，得到 `formatList: []` / `firstFormat: undefined`，**降级不抛**。⚠️ 2026-10-01 起 `.vue` 会先把 locale 补齐（`hooks/picker-filled.ts`）⇒ 这条**从组件路径上已走不到**；`mergeFormat` 自身仍保留该降级（可被直接以未补齐的 locale 调用），L1 仍有用例钉住 | **INTENDED** | rc `miscUtil.toArray` 是 `Array.isArray(v) ? v : [v]`；本仓 `@apollo-design/picker` 的 `toArray` 明确「`null`/`undefined` ⇒ `[]`」。L1 有一条用例钉住 |
| 2 | 范围的两端输入框：上游把 `-input` 拼在 `Input` 组件内部（调用处只传 `-input-start`）；本仓没有独立的 `Input` 组件，直接拼成 `-input -input-active? -input-start\|-end` | **PLATFORM** | 结果与 SSR 实测一致（`ant-picker-input ant-picker-input-start`）；上游结构见 `Input.js:64,344` |
| 3 | 构建期常量（padding 算式 / `lighten` 结果 / `28*8`）在静态 CSS 里**内联成字面值**，不随主色或主题变化（上游 cssinjs 运行时重算） | **PLATFORM** | 本仓「静态 CSS + CSS 变量」架构的固有差异，非 bug；影响面由 L6 的 dark / compact / token-override 矩阵钉住 |
| 4 | `DatePicker.generatePicker(customGenerateConfig)` **不实现**（本仓只支持 dayjs） | **INTENDED** | G2 的决策；`interface.ts` 里已写明 |
| 5 | 复用既有 `space/statusUtils.getStatusClassNames`（返回**空格拼接字符串**，非数组）；`root-class.ts` 整体 `push` | **PLATFORM** | 本仓既有实现的选择；`push(...str)` 会把字符串按字符展开，已加注释与断言防回归 |
| 6 | 两处 `FastColor(<cssvar 引用>).setA(α)` 派生色在产物里是 `#00000080` / `#00000033`（**不是** `#ffffff80` / `#e6f4ff33`） | **UPSTREAM** | 上游 `style/panel.js:389,471`；cssVar 模式下 token 值是**变量引用字符串**，`FastColor` 解析不了 ⇒ 回落 `#000000`。证据：同规则块内 `panel.js:392` 的**直接**使用输出成 `var(--apollo-color-text-light-solid)`；`theme.getDesignToken().colorTextLightSolid` ⇒ `#fff`（非 undefined）⇒ 排除「token 缺失」。**逐字对齐产物**，已在 E10 逐值豁免（2026-10-01） |
| 7 | 掩码模式下原生 `input` 事件**不改状态**，但本仓会在它里面主动「打一拍」把 DOM 值写回去 | **PLATFORM** | 上游 `Input.js:117-124`（有 `format` 时跳过 `onChange`）靠 **React 的 `restoreControlledState`** 把 DOM 值强制还原；**Vue 没有这个机制** ⇒ 不主动重渲染的话，浏览器在 `keydown` **之后**落进 DOM 的原生字符会留在输入框里。见 `components/mask-input.ts` 的 `onInput`（2026-10-01） |

## 3. .vue / .tsx 选择

<!-- 默认 .vue。若用 .tsx，在此写明理由（COMPONENT-RULES.md §2 的三条件之一）。 -->
<!-- G4 决定。 -->

## 4. Component Token 清单

registry 数据：该组件 `tokenCount = 3` —— 即**它自己声明的**三个用户面 token
（`presetsWidth` / `presetsMaxWidth` / `zIndexPopup`）。完整面是三处继承 + 3 自有：

| 来源 | 键数 | 内容 |
|---|---|---|
| 自有 | 3 | `presetsWidth`(120) · `presetsMaxWidth`(200) · `zIndexPopup`(`zIndexPopupBase + 50` = 1050) |
| `input` 的 `initComponentToken` | **18** | `lineWidthFocus` + `paddingBlock/SM/LG` + `paddingInline/SM/LG` + `addonBg` + `activeBorderColor` / `hoverBorderColor` + 3 个 `activeShadow` + `hoverBg` / `activeBg` + `inputFontSize/LG/SM` |
| `initPanelComponentToken` | 21 | 12 自有（`cell*` / `time*` / `cellWidth` / `textHeight` / `withoutTimeCellHeight`）+ 8 个 `MultipleSelectorToken`（与 Select 同源）+ 1 内部量 |
| `getArrowToken` | 3 | `arrowShadowWidth` / `arrowPath` / `arrowPolygon` |
| **合计（对象键数）** | **45** | 其中 `INTERNAL_FIXED_ITEM_MARGIN` **不落变量** ⇒ **44 个变量** |
| 内部 token `initPickerPanelToken` | 10 | 不落变量，G4 会内联进规则（判定值由 theme.test 钉住） |

⚠️ 产物里还有一个 **`--ant-date-picker-affix-color`** —— 它**不在** `prepareComponentToken`
的返回值里，而是被声明在 **`.ant-picker` 规则内部**（状态变体用）：
```css
.ant-picker                  { --ant-date-picker-affix-color: inherit; }
.ant-picker-status-error     { --ant-date-picker-affix-color: var(--ant-color-error-affix); }
.ant-picker-status-warning   { --ant-date-picker-affix-color: var(--ant-color-warning-affix); }
```
⇒ 所以「对象 45 键 / 变量 45 个」是**巧合**，含义不同，别当交叉验证。

取证 / 判定值：`node tests/visual/debug/extract-date-picker-css.mjs --tokens`（45 个变量全打印）；
断言：`__tests__/theme.test.ts`（22 条）。

⚠️ **`cellHoverWithRangeBg` / `cellRangeBorderColor` 用的是 `Color#lighten`，
不是 `_internal/color-composite.ts` 的 `onBackground`** —— 两个是不同的颜色运算
（后者是「半透明前景合成到背景」，tour / input-number / slider 用）。
实测逐位一致：`lighten(35)` → `#cbe0fd`、`lighten(20)` → `#82b4f9`

⚠️ **`note`**：本组里的构建期常量（padding 算式、`lighten` 结果、`28*8`）
在静态 CSS 里会被**内联成字面值** ⇒ **不随主色 / 主题变化**。
这是本仓「静态 CSS + CSS 变量」架构的**已知固有差异**（上游 cssinjs 会在运行时重算），
不是 bug；影响面由 L6 的 dark / compact / token-override 矩阵钉住。
<!-- G3 补齐：presetsWidth / presetsMaxWidth / zIndexPopup 三个自有 token，
     另并入 input（SharedComponentToken 去掉 addonBg）、select（MultipleSelectorToken）、
     roundedArrow（ArrowToken）三处继承面。默认值推导见 docs/analysis/date-picker.md §7。 -->

## 5. 已知缺口

### 5.1 输入框内核 —— 已裁决「完整对齐」（2026-09-30）

rc 的 `lib/PickerInput` 是 **37 个 `.js` / 4290 行**、且**绑 React**
（`useState` + `useEvent`），而 `picker` foundation 只 Vue 化了**面板**。
⇒ **输入框的解析 / 掩码 / 键盘字段导航 / 分段（`-input-active`）** 必须自研。

| 选项 | 内容 | 代价 |
|---|---|---|
| **A. 完整重写** | 逐块对齐 `PickerInput`；`inputReadOnly` / `preserveInvalidOnBlur` / `previewValue` / `format.type: 'mask'` / 键入解析 全部落地 | 最大；但 11 维度可全 `done`、无缺口 |
| **B. 核心 + 明确缺口** | 值 / 开合 / 面板 / 格式化 / 约束 / 状态 / 语义槽 全落地；键入解析与掩码标 `DEFERRED` | 缺口**可枚举、可测** |

**用户裁决 = A（完整对齐，分阶段落地）**，登记在 `registry/source/open-decisions.mjs` 的
`date-picker-input-kernel`。⇒ 本组件**不留**输入框相关的 `DEFERRED`；
键入解析 / 掩码 / 键盘字段导航 / 分段 全部要落地（分 S1–S5 五阶段，见 `PLAN.md`）。

**当前进度（2026-10-01）**：

| 阶段 | 内容 | 状态 |
|---|---|---|
| S1 | 值 / 开合 / 面板接线 + 样式（257 规则 / 45 声明） | ✅ |
| S2 | 键入解析 + `format` 补齐层 + `format` 函数形态 + **提交时机状态机** | ✅ |
| S3 | **掩码模式**（`format.type: 'mask'`） | ✅ |
| S4 | 键盘字段导航与 `-input-active` 分段 | 🟡 **单值部分完成**：调度（随 S2）+ `-focused` + 确认离开才关浮层。`-input-active` 与 `useFocusLock` 是**范围专属**（上游 `SinglePicker` 不传 `activeIndex`；单值下 `forceFocus` 恒 false）⇒ 随 S5 的 RangePicker 一起做 |
| S5 | `multiple` + `tagRender` / `maxTagCount`、范围两端、`presets` / footer | 🟡 **部分**：面板粒度**受控化 + 打开即重置** ✅、**`multiple` 全链路** ✅（含 `tagRender` / `maxTagCount` / 删除 / `-multiple-input`）；范围与 presets/footer 未开始 |

### 5.2 ✅ **已解决**（2026-10-01）：`format` 的函数形态

上游 `FormatType<DateType> = string | CustomFormat<DateType>`，即 `format` 可以是
`(value) => string`（`DatePicker.test.tsx` 有 `showTime should work correctly when
format is custom function` 为证）。跨包欠账（`PickerFormat` 的泛型 + `CustomFormat`）
已在 **2026-09-30** 还清（PITFALLS 214），**ui 侧的归一**在 **2026-10-01** 补上：

| 位置 | 改动前 | 改动后 |
|---|---|---|
| `hooks/picker-format.ts` 的 `.map` | `typeof c === 'string' ? c : c.format` ⇒ 函数读成 `undefined` | `typeof c === 'string' \|\| typeof c === 'function' ? c : c.format`（上游逐字） |
| `MergedFormat.formatList` / `firstFormat` | `string[]` / `string` | `MergedFormatEntry[]` / `MergedFormatEntry`（含函数） |
| `components/picker-shared.ts` | 无 | 新增 `getFormatLength(firstFormat, now)`（函数形态**先求值**再取 `.length`） |
| `components/Selector.ts` | prop `firstFormat: string` | prop `firstFormatLength: number`（哑组件不持有日期库，求值在 `.vue` 侧） |

判据：函数**只参与格式化**（`formatValue` 直接调用它）、**不参与解析**
（`picker-typing.ts` 的 `typeof === 'string'` 检查跳过它）—— 上游如此。

### 5.2b `DatePicker.generatePicker(customGenerateConfig)` **不实现**（本仓只支持 dayjs）—— INTENDED。

### 5.3 ✅ **已解决**：一处跨组件的 `getMergedStatus` 不一致（`??` → `||`）

**发现（2026-09-30，读上游源码时）**：

| 位置 | 改动前 | 与上游 |
|---|---|---|
| antd 6.6.4 `es/_util/statusUtils.js` | `customStatus \|\| contextStatus` | —— 规格 |
| 本仓 `packages/ui/src/form/context.ts` | `customStatus ?? contextStatus` | ❌ **不一致** |

**分歧点只有一个**：`customStatus === ''`（空串是 `InputStatus` 的**合法**取值）。
上游**回落**到 Form.Item 的 status，改动前本仓**不回落**。

**处理（已落地）**：把 `form/context.ts` **统一为 `||`**（逐字对齐上游），
于是 `date-picker` 与 `input` / `textarea` / `input-number` / `select`
**共用同一个函数**；本组件此前为避开「同名不同义」而另起的
`getMergedPickerStatus` **已删除**（不再需要两份语义相同的实现）。

**改动前核实的风险面**：
   - 4 个消费者：`Input` / `TextArea` / `InputNumber` / `Select`
   - **全仓没有任何测试钉住 `status: ''` 这个分歧点**
     （只有 `space/__tests__` 用了空串，但那打的是 `getStatusClassNames`，与本文无关）
   - ⇒ 这是一次**行为对齐**，不是回归

⚠️ **验证缺口（环境阻塞，非代码问题）**：这 4 个消费者的 jsdom 回归**本轮没跑成** ——
当时 jsdom 的冷加载是 **3 分 15 秒**（远超 vitest 的 60s worker 启动上限），
所有 jsdom 测试都报 `Timeout waiting for worker to respond`（详见 PITFALLS 231）。
已跑通的是：`--project unit`（`@vitest-environment node`，**54 passed**）、
根 `vue-tsc`（**0 error**）、`biome`（**error 0**）。
**下次环境恢复后应补跑**：`input` / `input-number` / `select` / `form` / `space` 的
`index.test.ts` + `semantic.test.ts`。

### 5.4 G1 阶段实测出来的、G4 必须处理的坑

1. **`value` / `defaultValue` 必须是 dayjs 实例**：传 ISO 字符串会在 rc 的 `isValidate`
   抛 `getUDayjs(…).isValid is not a function`（写 SSR 探针时直接踩到）。
2. **L4 必须「挂载后」取证**：`open: true` 的 SSR 只有 **889 B**，与不传 `open`
   **字节相同**（浮层走 Portal）。面板侧的契约继续挂在 `picker` 的 37 条 rc 基线上。
3. **`allowClear={false}` 在无值时 SSR 字节不变** ⇒ L4 的 allowClear 用例**必须给值**。
4. **`status="error"` 不改 `input[aria-invalid]`**（仍是 `"false"`），只加类名。
5. **自定义 `separator` 会去掉 `aria-hidden`**（默认分隔符带 `aria-hidden`）——
   上游有两条专门测试（`hides the default separator from the accessibility tree` /
   `preserves a custom separator accessible name`），必须进 L5。
6. **`prefixCls` 传下去会变成 `apollo-picker`**（上游 `getPrefixCls('picker', …)` 传的是
   字面量 `'picker'`）⇒ 面板类名整体换前缀，基线要按「类名替换后的同构」比对。

### 5.5 2026-10-01 新发现（**未修**，逐条记在案）

#### (a) 🚨 `picker-panel.ts:244` 的 `fillLocale` 第二参**用错了值**（**潜在**分歧，当前不可观测）

```ts
// packages/picker/src/picker-panel.ts:244
const filledLocale = computed(() => fillLocale(props.locale, localeTimeProps.format ?? ''));
```

上游 `useLocale(locale, localeTimeProps)` 传的是 **4 个 show 标志**，由
`fillLocale` 内部调 `fillTimeFormat(...)` 推出时间格式（`useLocale.js:55`）；
**不是** `localeTimeProps.format`（那是 `showTime.format` / `props.format`，只在
`picker === 'time'` 时才被写进 `timeConfig`）。

⇒ 症状（`datetime` / `time` 面板）：`fieldDateTimeFormat` 得到 `'YYYY-MM-DD '`（尾部空格）
而不是 `'YYYY-MM-DD HH:mm:ss'`。

⚠️ **为什么至今没人发现**：`filledLocale` 只被 `fillShowTimeConfig` 的 `getRowFormat`
读一次，而那一次的结果只用于**反推 show 标志**；实测两条路径（补成空串 / 补成
`HH:mm:ss`）在 `fillShowConfig` 之后**落到同一组 show 标志** ⇒ 面板渲染逐位一致。
⇒ 这是**潜在**分歧，不是当前可见 bug。**修正它需要单独过 picker 包的门禁**
（跨包改动，AGENTS.md §7），故本轮只登记、不改。

#### (b) `showNow` / `showToday` **不生效**（面板没有 footer）

`showNow` 在 `interface.ts` 里声明了、`DatePicker.vue` 的 `withDefaults` 也给了
`undefined`，但**整条链上没有消费者**：`showTimeKeys` 会把它挑进 `timeProps`，
而 `@apollo-design/picker` 里除了那一行 `showTimeKeys` **没有任何 `showNow` 的引用**。
上游的「此刻 / 今天」按钮渲染在 `PickerInput/Popup/Footer.js`（**浮层**层，不是面板层）
—— 而裁决 `picker-panel-ownership` = B 只把**面板** Vue 化了 ⇒ footer 属未移植面。
⇒ 与 `renderExtraFooter` / `panelRender` 同批（S5 或单独一轮）。

#### (c) ✅ **已解决**（2026-10-01 同日）：S2 的「落值 + 提交时机」

`hooks/picker-value-change.ts` 是上游 `PickerInput/hooks/useRangeValueChange.js`
（405 行）的逐字移植：`triggerChange(index, source, value)` 先按
`source × needConfirm × allowEmpty × index` 解析出唯一 action（8 种），再统一执行。
`DatePicker.vue` 按 `SinglePicker.js` 接线（键入 / 聚焦 / `Tab` / `Esc` / 关浮层 /
清除 / 面板点选）。

⇒ **S4 的字段导航调度**（`field-switch` 分支 + `forceFocus` 强弱）已随之落地；
S4 只剩**渲染**（`-input-active` 分段高亮 + 焦点跟随）。
用例：L1 **36 条** + L2 **12 条**；四条「想当然」判据见 `PLAN.md` 的同名小节。

#### (d) ✅ **已解决**（2026-10-01 同日）：面板 `mode` 的受控化 + 「打开即重置」

上游把 `mergedMode`（`useControlledState(picker, mode)` 的产物）**受控地**喂给面板
（`SinglePicker.js:366` 的 `mode: mergedMode` + `onPanelChange: triggerModeChange`），
并在每次打开浮层时把粒度重置回 `picker`：

```js
useLayoutEffect(() => {
  if (mergedOpen && activeIndex !== undefined) { triggerModeChange(null, picker, false); }
}, [mergedOpen, activeIndex, picker]);
```
（注释：`Reset for every active`；`triggerEvent = false` ⇒ **不**发 `onPanelChange`。）

**为什么必须做**：本仓浮层关闭**不卸载**（`Trigger` 的 `removeOnLeave: false`，与 antd 一致）
⇒ 面板粒度会**跨开合保留** ⇒ 下钻到年面板后关闭、再打开会**仍停在年面板**。

已落地：`panelProps.mode` 改传 `mergedMode`；`mergedOpen` 变真时（且 `props.mode` 未给）
`innerMode = mergedPicker`。用例 `s5-mode.test.ts` **5 条**（含「重置不发事件」与
「受控 `mode` 不重置」两条反向哨兵）。

#### (e) 浮层侧的焦点事件未接

上游把 `onFocus`/`onBlur` 挂在**浮层容器**上（`SinglePicker.js:355-361` 的
`onPanelFocus` / `onBlur`），用于两支行为：
1. 焦点进入面板 ⇒ `onFieldFocus(0,'panel',event)` ⇒ `focusedIndex` 保持 ⇒ `-focused` 不丢；
2. 面板里获得焦点的控件变 `disabled` ⇒ 把焦点抢回输入框
   （`useFocusEvents` 的 `isDisabledTarget` 那一支）。

本仓的 `Trigger` 的浮层 div 没有透传 focus/blur 的位置（`popupProps` 里只有
`onMouseenter` 一类），故这两支**未接**。⚠️ 第 1 支在当前实现下**恰好不影响**
`-focused`：点格子时焦点落到**面板根**（`tabindex="0"`）⇒ 输入的 blur 的
`relatedTarget` 在浮层里 ⇒ 我们不清理 `focusedIndex`。但若焦点是**从外部**进入面板的
（如 Tab 进面板），`-focused` 就不会置位 —— 属边角，登记待补。

#### (d) `theme.test.ts` 实际 **30 条**（README §4 与 PLAN G3 写的是 22 条）

`pnpm vitest run --project theme <date-picker>` 实测 `30 tests`。
§4 / PLAN 里的「22 条」是 G3 当时的数字，后续扩过但文档没跟。以**实测**为准。
