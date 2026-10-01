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
| S5 | `multiple` + `tagRender` / `maxTagCount`、范围两端、`presets` / footer | 🟡 **部分**：面板粒度**受控化 + 打开即重置** ✅、**`multiple` 全链路** ✅（含 `tagRender` / `maxTagCount` / 删除 / `-multiple-input`）、**footer ✅（2026-10-01，含 `renderExtraFooter`）**；剩**范围两端**与 **`presets`**（两者都需要新组件/新 API） |
| **G9 L6 视觉** | ✅ **21 / 21 exact**（2026-10-01 三轮）。首轮 3.51% 的根因（`-css-var` 漏挂）、二轮两处（表头图标、缺 `-panel-container`）、三轮一处（**缺 `Today` 页脚**）**全部已修** —— 见 §5.5(e)(f)(f′)。**G9 的 L6 门禁已过**（其余 G12/G13/G14 未做） |

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

#### (b) ✅ **已解决**（2026-10-01）：`showNow` / `showToday` / `renderExtraFooter`

`showNow` 在 `interface.ts` 里声明了、`DatePicker.vue` 的 `withDefaults` 也给了
`undefined`，但**整条链上没有消费者**：`showTimeKeys` 会把它挑进 `timeProps`，
而 `@apollo-design/picker` 里除了那一行 `showTimeKeys` **没有任何 `showNow` 的引用**。
上游的「此刻 / 今天」按钮渲染在 `PickerInput/Popup/Footer.js`（**浮层**层，不是面板层）
—— 而裁决 `picker-panel-ownership` = B 只把**面板** Vue 化了 ⇒ footer 属未移植面。

⇒ **2026-10-01 已落地**：新增 `components/Footer.ts`（上游 `Footer.js` 78 行的逐字移植）+
`components/picker-shared.ts` 的 `getShowNow`（上游 `useShowNow.js`），
并在 `DatePicker.vue` 接线。`renderExtraFooter` 一并生效（它是 footer 的 `-footer-extra` 槽）。
⚠️ **`panelRender` 仍未接线** —— 它的挂载点就是 `-panel-layout`
（上游 `panelRender(mergedNodes)` 包的是那一层），属待补项。

#### (b′) ⏳ 本轮**新登记**的缺口（逐条有出处，都不是「已知范围」而是真欠账）

| # | 缺口 | 上游出处 | 影响 |
|---|---|---|---|
| 1 | `isInvalidateDate` **只覆盖 `disabledDate`** —— 缺 `generateConfig.isValidate(date)` 与 `showTime.disabledTime` / legacy `disabledHours`… 两支 | `useInvalidate.js`（全 50 行） | `OK` 按钮的禁用态、以及 `useRangeValue` 的提交校验，在「配了 `showTime.disabledTime`」时会与 antd 不一致 |
| 2 | 浮层的 `a` 链接色**靠 `select` 的 CSS 蹭到** —— `DATE_PICKER_RULES`（257 条，机械转换自 antd 产物）里**没有** `a{color:var(--apollo-color-link);…}` 那 7 条 | antd `getResetStyles`（`theme/util/genStyleUtils.js:36`，由 `resetComponent` 注入） | 页面里恰好有 `select` 时**看不出来**（L6 就是这样）；只引 `@apollo-design/ui/date-picker/style.css` 时 `Today` / `Now` **不是蓝色**。⚠️ 归口是 **`BASE_CSS`**（全局规则），不是本组件；改它要重跑全仓 L6 |
| 3 | `PopupPanel` 的 `onCellDblClick`（**双击格子 = 提交**，仅 `needConfirm` 时）未接 | `Popup/PopupPanel.js:38-42` | 双击不会提交 |
| 4 | `hideHeader` 由 `picker === 'time'` 决定（时间面板无表头） | `Popup/PopupPanel.js:44` | 纯 `picker: 'time'` 时本仓会多一个表头；L6 矩阵里没有 `time` 变体 ⇒ 未暴露 |
| 5 | `disableSubmit` 的 `isTimePickerEmptyValue` 分支（`defaultOpenValue` 兜底）未实现 | `Popup/index.js:97-104` | 只影响纯 `picker: 'time'`（本组件的 `picker` 不含 `'time'`） |

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

#### (e) ✅ **已解决**（2026-10-01，G9 L6 首轮抓到）：组件变量声明块**漏挂浮层根**

**症状**：L6 的 21 组里 **18 组红**（0.42%~3.51%）；两侧源图对比 —— React 面板 ~250px、
**Vue 面板铺满 1440px**。

**根因**：面板宽度规则 `.apollo-picker-dropdown .apollo-picker-date-panel{width:calc(var(--apollo-date-picker-cell-width) * 7 + …)}`
里的变量声明块**只挂在 `.apollo-picker`**，而浮层走 **Portal 到 body**、**不在它的子树里**
⇒ `var()` 取不到值 ⇒ `calc` **语法非法** ⇒ 整条 `width` 被**静默丢弃** ⇒ 面板铺满容器。

**修法**（与 `select` 同判）：声明块挂 `.apollo-picker,.apollo-picker-css-var` 两个选择器 +
`.vue` 把 `css-var-root` / `-css-var` 同时加到**根**与**浮层**（类序对齐 antd 实测基线）。
⇒ 差异率 3.51% → **0.25%**。→ PITFALLS **248**（含「为什么前三层都抓不到」）

#### (f) ✅ **已解决**（2026-10-01，G9 L6 二轮）：表头图标 + 浮层缺两层容器

**(f-1) 表头导航图标「偏细偏浅」** —— 归属 **`@apollo-design/picker`**（不在本组件职责面）。
真相与「1px vs 2px 描边」无关：`PickerPanel` **少声明 4 个图标 props** ⇒ `ui` 传的
「空 `<span class="…-prev-icon">`」被归进 `attrs` ⇒ `pickProps` 取不到 ⇒ `PanelHeader`
回退到**字符兜底**（`‹` `«`）⇒ 表头画的是**字形**而不是 CSS 折线。
⇒ 已在 picker 包修复。探针对拍表见 PITFALLS **250**。

**(f-2) 🚨 浮层缺 `-panel-container` / `-panel-layout` 两层**（**功能 bug，不只是像素**）

上游 `@rc-component/picker` 的 `PickerInput/Popup/index.js:120-163` 里，面板外面还有两层；
本仓此前把 `PickerPanel` **直接**当 `Trigger` 的 `popup`。三处后果：

| # | 后果 |
|---|---|
| 1 | 🚨 **面板在真实浏览器里完全点不动** —— 浮层根 `.apollo-picker-dropdown` 是 `pointer-events: none`，**只有 container 把它重置成 `auto`**。Playwright 真点击报 `<div>…</div> intercepts pointer events` 并超时（antd 侧同一点击会把值写进输入框） |
| 2 | 没有 `box-shadow` / 圆角 / `overflow: hidden`（三条规则都挂在 container 上，元素不在 ⇒ 永不匹配） |
| 3 | 语义槽 `classNames.popup.container` / `styles.popup.container` **从没生效**（类型面里早就有，只是没有宿主元素） |

⚠️ **为什么 L1–L5 全绿也抓不到**：jsdom 的 `trigger()` / `dispatchEvent` **绕过
`pointer-events`** ⇒ 交互用例照过；L5 不看像素。→ PITFALLS **251**

**(f-3) `classNames.popup.root`（新 API）静默失效** —— 落点应是**合并后**的
`popup.root`（上游 `SinglePicker.js:464`），此前传的是原始 deprecated prop。
既有用例只覆盖了 deprecated 那两个 ⇒ 新 API 一条都没有。→ PITFALLS **252**
新增 `__tests__/popup-shell.test.ts`（4 条）钉住：层级、`internalMode` 后缀、
`popup.container` 两个语义槽、`popup.root` 新旧两种写法。

**L6 实测（`node tests/visual/run.mjs --component date-picker --mode compare`）**：

| | 修前 | 修后 |
|---|---|---|
| exact | **3 / 21** | **12 / 21** |
| `month` / `year` / `multiple` / `variants` | 0.11%~0.51% | ✅ **0.000% exact** |
| `basic` / `value` | 0.13%~0.52% | 0.22%~0.83% |
| `datetime` | 0.24%~0.47% | 0.33%~0.77% |

⚠️ `basic` / `value` / `datetime` 的差异率**变大**不是回归：它们 antd 侧**有页脚**，
Vue 侧没有；此前 Vue 连阴影都没有 ⇒ 「缺阴影」与「缺页脚」两块差异**恰好抵消了一部分**。
现在阴影对齐了，剩下的差异**纯粹**是缺页脚（+ 阴影绕着一个矮 39px 的盒子）。
⚠️ `month` / `year` / `multiple` 掉到**精确 0** 恰好反证了这一点：它们 antd 侧**没有页脚**，
此前的差异**全部**来自缺阴影。

#### (f′) ✅ **已解决**（2026-10-01，G9 L6 三轮）：补上 `Today` 页脚 ⇒ **21 / 21 exact**

二轮结束后唯一剩下的差异是**面板缺 `Today` 页脚**（容器高 **309** vs antd **348**，差的 39px 就是它）。
归属 **Popup 层**（rc-picker 的 `PickerPanel` 里没有 `showToday` / `-footer`）。

⇒ 新增 `components/Footer.ts` + `getShowNow` + `DatePicker.vue` 接线（见 §5.5 (b)）。
**实测：`node tests/visual/run.mjs --component date-picker --mode compare` ⇒ 21 / 21 exact**。

探针对拍（`tests/visual/debug/probe-datepicker-header.mjs basic`，两侧逐项一致）：

| 项 | React | Vue |
|---|---|---|
| `-footer` 尺寸 | 288×39 | 288×39 |
| `border-top` | `1px solid rgba(5,5,5,0.06)` | 同 |
| 页脚 HTML | `<div class="ant-picker-footer"><ul class="ant-picker-ranges"><li class="ant-picker-now"><a class="ant-picker-now-btn" aria-disabled="false">Today</a></li></ul></div>` | 同构（前缀 `apollo`；Vue 会在 `null` 子节点处留 `<!---->` 注释，**像素无关**） |
| `-now-btn` 色 | `rgb(22, 119, 255)` | 同 |
| `-panel-container` 高 | 348 | 348 |

⚠️ L6 是**硬门禁**（`compare.mjs` 的阈值 0.1% + 邻域判据，`TESTING.md` §9.3 / T17 明确不得放宽，
**没有豁免机制**）⇒ **G9 的 L6 门禁已过**（G12/G13/G14 仍未做）。
⚠️ `test:visual` **不在** `verify:full` 里 ⇒ 它红了不会让日常门禁红，**必须显式跑**。

#### (g) 浮层侧的焦点事件未接

上游把 `onFocus`/`onBlur` 挂在**浮层容器**上（`SinglePicker.js:355-361` 的
`onPanelFocus` / `onBlur`），用于两支行为：
1. 焦点进入面板 ⇒ `onFieldFocus(0,'panel',event)` ⇒ `focusedIndex` 保持 ⇒ `-focused` 不丢；
2. 面板里获得焦点的控件变 `disabled` ⇒ 把焦点抢回输入框
   （`useFocusEvents` 的 `isDisabledTarget` 那一支）。

⚠️ **2026-10-01 更新**：本组件现在**有了** `-panel-container` 这一层（§5.5 (f-2)），
它正是上游挂 `onMouseDown`（`onPanelMouseDown`，保焦点）/ `onFocus` / `onBlur` 的地方
⇒ **宿主元素已就位，只差接线**。本轮**有意没搬**：焦点模型是自建的（`s4-focus`），
接线属行为变更、要单独过门禁，不能混在「补外壳」里。

当前状态：`Trigger` 的浮层 div 没有透传 focus/blur 的位置（`popupProps` 里只有
`onMouseenter` 一类），故这两支**未接**。⚠️ 第 1 支在当前实现下**恰好不影响**
`-focused`：点格子时焦点落到**面板根**（`tabindex="0"`）⇒ 输入的 blur 的
`relatedTarget` 在浮层里 ⇒ 我们不清理 `focusedIndex`。但若焦点是**从外部**进入面板的
（如 Tab 进面板），`-focused` 就不会置位 —— 属边角，登记待补。

#### (h) `theme.test.ts` 实际 **30 条**（README §4 与 PLAN G3 写的是 22 条）

`pnpm vitest run --project theme <date-picker>` 实测 `30 tests`。
§4 / PLAN 里的「22 条」是 G3 当时的数字，后续扩过但文档没跟。以**实测**为准。
