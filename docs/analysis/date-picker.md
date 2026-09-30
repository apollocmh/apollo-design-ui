# date-picker 分析（G1）

> 交付物：`WORKFLOW.md` G1。**必须先于实现代码存在**。
> 本文所有事实来自**实测**（读 antd 6.6.4 产物 / 源码 / 测试 / demo，或 SSR dump），
> 不是凭记忆。凡未实测的一律标注「待验证」。
>
> 分析日期：2026-09-30 ｜ antd 版本：6.6.4 ｜ rc-picker：`@rc-component/picker@1.12.2`

| 项 | 值 |
|---|---|
| 组件名 | `date-picker` |
| 导出名 | `DatePicker`（+ `DatePicker.RangePicker` 等 5 个静态子入口） |
| 分组 | 数据录入 |
| 优先级 / 复杂度 | P5 ／ **XL** |
| registry | `dagLevel=0`、`unblocks=1`、`antdBuildLineCount=3675`、`antdFileCount=172`、`tokenCount=3` |

---

## 1. 结构判定：antd 是**薄壳**，重的部分一半已在我们的 `picker` 包里

```
antd <DatePicker>            ← 本组件（薄壳：输入框 + 浮层 + 状态类 + locale 归一 + 语义槽）
      └─ @rc-component/picker  ← 输入框内核 + 面板容器（RcPicker / RcRangePicker）
            └─ PickerPanel    ← ★ 已在 @apollo-design/picker 里 Vue 化（裁决 B）
```

**这是我们做过的组件里「上游含量」最低的一个** —— 因为 `picker` foundation 已经把
最难的 7 个面板 + 时间列 + 面板上下文全部 Vue 化了（`foundation 13/13` 全部完成）。

实测证据（`/tmp/antd-src/package/es/date-picker/`，行数为实测）：

| 文件 | 行数 | 职责 |
|---|---|---|
| `generatePicker/generateSinglePicker.js` | 231 | 单值壳：**6 个 picker 出口共用同一实现** |
| `generatePicker/generateRangePicker.js` | 199 | 范围壳 |
| `style/panel.js` | 576 | 面板样式（**cell / 时间列 / 范围高亮**） |
| `style/index.js` | 460 | 输入框侧样式（尺寸 / 变体 / 状态） |
| `style/util.js` | 119 | 变体类（outlined/filled/borderless）的生成器 |
| `style/multiple.js` | 94 | `multiple` 模式的标签样式（**与 Select 同源**） |
| `style/token.js` | 75 | 三类 token 的推导 |
| `util.js` | 68 | `getPlaceholder` / `getRangePlaceholder` / `useIcons` |
| `hooks/useMergedPickerSemantic.js` | 43 | 语义槽归一（`classNames` / `styles`） |
| `style/variants.js` · `generatePicker/index.js` · `useSuffixIcon.js` | 42 · 28 · 24 | 变体 / 出口组装 / 前后缀图标 |
| `useComponents.js` · `PickerButton.js` · `constant.js` | 13 · 9 · 1 | 面板按钮与 5 个 picker 名常量 |
| `locale/*.js` | ~60 个 × 2 行 | 只 re-export `../locale/<lang>`（**不搬**） |

实测口径（逐项数过）：

| 口径 | 行数 |
|---|---|
| 目录总计（.js + .d.ts） | **4454** |
| 其中 `locale/`（139 个文件，全是 2 行 re-export） | 1856 |
| **非 locale** | **2650** |
| 上表这些模块（含它们的 `.d.ts`）合计 | 2347 |

registry 的 3675 行 / 172 文件是 antd 自己的统计口径（含 js + d.ts + 快照）。

### 1.0 ⚠️ 真正的大头在 rc 那一层，而它**没有被 Vue 化**

| 层 | 实测规模 | 我们有没有 |
|---|---|---|
| antd `date-picker` 薄壳 | 2650 行（非 locale） | **本任务要写** |
| rc `PickerInput`（输入框内核：解析 / 掩码 / 键盘 / 分段 / 浮层开合） | **37 个 `.js` / 4290 行** | ❌ **没有** |
| rc `PickerPanel`（面板 / 7 个面板 / 时间列） | 已 Vue 化 | ✅ `@apollo-design/picker` |

⇒ **`PickerInput` 比整个 antd 薄壳还大一倍**，而且它**绑 React**（`useState` + `useEvent`）。
这是本组件真正的成本中心，不是「薄壳」。见 §11.1。

### 1.1 面板侧**不需要**重做（但我们得把契约接上）

实测：`renderToStaticMarkup(<DatePicker open />)` 只有 **889 字节**，与 `open` 未传时**完全相同**，
并打出一条 `Warning: Portal only work in client side`。
⇒ **浮层（含面板）在 SSR 下完全不渲染**。

⇒ 结论（沿用 picker foundation 的裁决）：
- **面板的 DOM/ARIA 契约由 `@apollo-design/picker` 的 L4 基线负责**
  （`tests/compat/baseline/picker.mjs` 打的是 rc 的 `PickerPanel`，37 条逐字一致）。
- 本组件的 L4 只负责**输入框侧 + 浮层容器**，且**必须挂载**（不能用 SSR 取证）。

---

## 2. 出口面（实测 `generateSinglePicker.js` 尾部 + `index.d.ts`）

```js
const DatePicker    = getPicker();                       // picker 默认 'date'
const WeekPicker    = getPicker(WEEK,    'WeekPicker');   // 'week'
const MonthPicker   = getPicker(MONTH,   'MonthPicker');  // 'month'
const YearPicker    = getPicker(YEAR,    'YearPicker');   // 'year'
const QuarterPicker = getPicker(QUARTER, 'QuarterPicker');// 'quarter'
const TimePicker    = getPicker(TIME,    'TimePicker');   // 'time'
```

`constant.js` 的 5 组常量：`['week','WeekPicker']`、`['month','MonthPicker']`、
`['year','YearPicker']`、`['quarter','QuarterPicker']`、`['time','TimePicker']`。

`generatePicker/index.js`（28 行）再把两份壳组装成默认导出：

| 导出 | 形态 | Vue 侧规划 |
|---|---|---|
| `DatePicker` | 单值壳（`picker` 默认 `'date'`，也可传 `week/month/year/quarter/time`） | `DatePicker` 主组件 |
| `DatePicker.RangePicker` | 范围壳 | `RangePicker` + `DatePicker.RangePicker` 别名 |
| `DatePicker.WeekPicker` / `.MonthPicker` / `.YearPicker` / `.QuarterPicker` / `.TimePicker` | 预设 `picker` 的同一实现 | 5 个薄封装 + 静态别名 |
| `DatePicker.generatePicker(generateConfig)` | 传自定义日期库生成器 | **待验证**：本仓只做 dayjs，是否保留这条出口 |
| `_InternalPanelDoNotUseOrYouWillBeFired` / `_InternalRangePanelDoNotUseOrYouWillBeFired` | 只出面板（无输入框） | 由 `picker` 包的 `PickerPanel` 提供；名字带「别用」⇒ 我们出 `PurePanel` 同名导出即可 |

**类型面**（`index.d.ts` 逐字）：

```ts
export type DatePickerProps<ValueType = Dayjs, IsMultiple extends boolean = boolean> =
  PickerPropsWithMultiple<Dayjs, PickerProps<Dayjs>, ValueType, IsMultiple>;
export type MonthPickerProps<ValueType = Dayjs | Dayjs> = Omit<DatePickerProps<ValueType>, 'picker'>;
export type WeekPickerProps<ValueType = Dayjs | Dayjs>  = Omit<DatePickerProps<ValueType>, 'picker'>;
export type RangePickerProps = BaseRangePickerProps<Dayjs>;
```

---

## 3. API 面：**哪些 prop 被 antd 吃掉、哪些透传给 rc**（这是薄壳的核心判据）

实测 `generateSinglePicker.js` 的**解构列表**（解构出来的就不会进 `...restProps`）：

`prefixCls` · `getPopupContainer` · `components` · `style` · `className` · `size` · `bordered` ·
`placement` · `placeholder` · `disabled` · `status` · `variant` · `onCalendarChange` ·
`classNames` · `styles` · `dropdownClassName` · `popupClassName` · `popupStyle` ·
`rootClassName` · `suffixIcon` · `allowClear` · `clearIcon`

**RangePicker 的差异**（实测）：同样一批，外加 `separator`、`picker`（单值壳也解构了 `picker`），
且 `bordered = true` 是**显式默认值**；单值壳没有给 `bordered` 默认值。

### 3.1 antd 自己加的东西（不进 rc）

| 项 | 实测值 | 说明 |
|---|---|---|
| `additionalProps` | `{ showToday: true }` | **只在单值壳**；antd 强制「今天」按钮 |
| 四个导航图标 | `prevIcon` / `nextIcon` / `superPrevIcon` / `superNextIcon` 全部覆盖成 `<span class="${prefixCls}-prev-icon">` 等空 span | 真正的图形由**样式**画（CSS 伪元素），不是图标组件 |
| `transitionName` | `` `${rootPrefixCls}-slide-up` `` | 浮层动效名（注意前缀是 **rootPrefixCls**，与 vue 侧的已知坑一致） |
| `locale` | `merge(contextLocale, props.locale ?? {})`，传给 rc 的是 **`locale.lang`** | 单值用 `useLocale('DatePicker', enUS)`；**范围用 `useLocale('Calendar', enUS)`** |
| `placeholder` | `getPlaceholder(locale, mergedPicker, placeholder)` | 6 个分支的**优先序**见 §3.3 |
| `suffixIcon` | `useSuffixIcon({ picker, hasFeedback, feedbackIcon, suffixIcon })` | 见 §3.4 |
| `components` | `{ button: PickerButton, ...components }` | `PickerButton` = antd `Button` + `size="small" type="primary"` |
| `allowClear` | `mergedAllowClear`（来自 `select/useIcons` 的 `clearIcon`） | **与 Select 共用** |
| `zIndex` | `useZIndex('DatePicker', …)` → 写进 `styles.popup.root.zIndex` | |
| 外层包裹 | `<ContextIsolator space>` | 阻止 Space 的紧凑上下文穿透 |
| `ref` | `useImperativeHandle(ref, () => innerRef.current)` | 直接转发 rc 的 `PickerRef` |

### 3.2 class 组合（实测 SSR 字节）

单值根：`${prefixCls}` ＋ `${prefixCls}-{large|small}` ＋ `${prefixCls}-{variant}`
＋ `getStatusClassNames(...)`（`-status-error` / `-status-warning`）＋ compactItemClassnames
＋ `contextPickerConfig?.className` ＋ `className`。
范围根再加 `${prefixCls}-range` 与 `rangePicker?.className`。

### 3.3 placeholder 优先序（`util.js` 逐字）

`getPlaceholder`：自定义 ⇒ `yearPlaceholder` ⇒ `quarterPlaceholder` ⇒ `monthPlaceholder`
⇒ `weekPlaceholder` ⇒ `time` 用 **`locale.timePickerLocale.placeholder`** ⇒ 兜底 `lang.placeholder`。
`getRangePlaceholder`：同构，用 `range*Placeholder` / `timePickerLocale.rangePlaceholder`。

⚠️ 每条都带 `&& 该字段存在` 的判据 ⇒ **locale 缺字段时会继续往下落**（RangePicker 有专门测试
`should fall back to rangePlaceholder when locale omits range-variant placeholder`）。

### 3.4 suffixIcon（`useSuffixIcon.js` 逐字）

- `suffixIcon === null || false` ⇒ `null`（完全不渲染）
- `undefined || true` ⇒ `picker === 'time' ? <ClockCircleOutlined aria-hidden /> : <CalendarOutlined aria-hidden />`，
  且 `hasFeedback` 时**追加** `feedbackIcon`
- 其他 ⇒ 原样渲染

### 3.5 语义槽（`DatePickerSemanticType`，`useMergedPickerSemantic` 43 行）

```
classNames / styles:
  root, prefix, input, suffix
  popup: root, header, body, content, item, footer, container   ← 7 个子槽
```

⚠️ 这是**两层嵌套**（`popup` 下 7 个），与 tabs 那种平铺 8 个不同 ⇒ 语义槽的合并要**深合并**，
且 `classNames.popup` 可以是 **string**（旧写法）或对象（新写法），`popupClassName` / `dropdownClassName`
是它的 deprecated 别名、`popupStyle` 是 `styles.popup.root` 的别名。

---

## 4. DOM（实测：`tests/visual/debug/dump-datepicker-antd.mjs`）

### 4.1 单值（无值，889 B）

```html
<div class="ant-picker ant-picker-outlined css-dev-only-do-not-override-… css-var-root ant-picker-css-var">
  <div class="ant-picker-input">
    <input aria-invalid="false" autoComplete="off" size="12" placeholder="Select date" value=""/>
    <span class="ant-picker-suffix">
      <span role="img" aria-label="calendar" aria-hidden="true" class="anticon anticon-calendar"><svg …/></span>
    </span>
  </div>
</div>
```

### 4.2 单值（**有值**，1943 B）

在 `-suffix` 之后**多一个清除按钮**：

```html
<span class="ant-picker-suffix">…</span>
<button type="button" aria-label="Clear" class="ant-picker-clear">
  <span role="img" aria-label="close-circle" class="anticon anticon-close-circle"><svg …/></span>
</button>
```

⚠️ 实测：`allowClear={false}` 的 SSR 输出与 `allowClear` 默认值**字节相同**（都是 889 B）
⇒ **`allowClear` 在无值时不可观测**，L4 的 `allowClear` 用例**必须给值**。

### 4.3 范围（1686 B）

```html
<div class="ant-picker ant-picker-range ant-picker-outlined …">
  <div class="ant-picker-input ant-picker-input-start">
    <input aria-invalid="false" autoComplete="off" size="12" placeholder="Start date" date-range="start" value=""/>
  </div>
  <div class="ant-picker-range-separator">
    <span aria-hidden="true" class="ant-picker-separator">
      <span role="img" aria-label="swap-right" class="anticon anticon-swap-right"><svg …/></span>
    </span>
  </div>
  <div class="ant-picker-input ant-picker-input-end">
    <input aria-invalid="false" autoComplete="off" size="12" placeholder="End date" date-range="end" value=""/>
  </div>
  <div class="ant-picker-active-bar" style="position:absolute;width:0"></div>
  <span class="ant-picker-suffix">…calendar…</span>
</div>
```

实测到的**确定性差异**：

| 输入 | 差异 |
|---|---|
| `size="small"` / `"large"` | 根加 `-small` / `-large` |
| `disabled` | 根 `-disabled` + `input[disabled]` |
| `status="error"` | 根 `-status-error`（`input` 的 `aria-invalid` **仍是 `false`** ⚠️） |
| `variant="filled"` | `-outlined` → **`-filled`**（默认是 `-outlined`） |
| `showTime` | `input[size]` 12 → **21** |
| 范围 + `open` | `-input-start` 那个 div **多一个 `-input-active`** |
| 自定义 `separator` | `span.-separator` **不带 `aria-hidden`**（默认带） |

### 4.4 稳定契约（L4 要对齐的部分）

| 项 | 值 |
|---|---|
| 根元素 | `div.${prefixCls}`（单/范围同一个根） |
| 根类名 | `${prefixCls}` · `-range` · `-{size}` · `-{variant}` · `-disabled` · `-status-{error\|warning}` |
| 内部结构 | `-input`(±`-start`/`-end`/`-active`) · `-range-separator` · `-separator` · `-active-bar` · `-suffix` · `-clear` |
| 面板（挂载后） | 由 `picker` 包已对齐的那套（`-panel` / `-header` / `-body` / `-content` / `-footer` / `-time-panel` …） |
| `data-*` | **无**；范围用 `input[date-range="start\|end"]` |
| CSS-in-JS 产物 | `css-dev-only-do-not-override-*` · `css-var-root` · `${prefixCls}-css-var` ⇒ **本仓静态 CSS 不产**，L4 必须过滤（已有 `dom-contract` 的过滤器，见 PITFALLS 183 那条 `^css-var-[\w-]+$`） |

---

## 5. ARIA 与键盘

**实测（SSR）**：

| 元素 | 属性 |
|---|---|
| `input` | `aria-invalid="false"`（**status=error 也不变**）、`autoComplete="off"`、`size`、`disabled` |
| 默认后缀图标 | `role="img"` + `aria-label="calendar\|clock-circle"` + `aria-hidden="true"` |
| 默认清除按钮 | `button[type=button]` + **`aria-label="Clear"`** |
| 默认分隔符 | `span.-separator` + `aria-hidden="true"`（自定义分隔符时**去掉** `aria-hidden`，保留可读名） |
| 面板（picker 包已对齐） | `role="dialog"`? ⇒ **待验证**：以 `picker` 基线的 37 条为准，不在本组件重复钉 |

上游有专门测试：`RangePicker › hides the default separator from the accessibility tree`、
`preserves a custom separator accessible name`
⇒ 这两条**必须**进我们的 L5。

**键盘**：输入框侧的按键（方向键改值、Enter 提交、Escape 关闭、Tab 在范围两端之间走）
都在 **rc 的 `PickerInput`** 里（`@rc-component/picker/lib/PickerInput/hooks/useInputProps.js` 等）
⇒ **待验证**：本仓没有把 rc 的输入框键盘逻辑抠出来（picker foundation 只做了面板），
所以这部分要么自己重写、要么按行为测试对拍。**这是本组件最大的未知量，见 §11。**

---

## 6. 行为规格（状态机）

```
                 ┌── open=false ──┐
  focus / click ─┤                ├─ Escape / 外点 / 选完 ─┐
                 └── open=true ───┘                        │
                        │                                  │
                   值未确定（range）                        │
                        ▼                                  │
                activeBar 出现（-input-active）              │
                        │                                  │
                    两值齐 ──► 触发 onChange ───────────────┘
```

| 状态 | 触发 | 目标 | 副作用 |
|---|---|---|---|
| 关闭 | `focus` / 点输入框 | 打开 | Portal 挂浮层、`-input-active`（范围） |
| 打开 | `Escape` / 外部点击 | 关闭 | 卸载浮层（**异步**：动效走完，见 PITFALLS 179） |
| 选择前 | | | 面板已打开但 `pickerValue` 未变 |
| 日期已选（范围） | 第二次点击 | 关闭 | `onChange(values, strings)`；`onCalendarChange` 每次变化都发 |
| `needConfirm` | 点「确定」 | 关闭 | 只有 `showTime`/`needConfirm` 时才有 `-footer` |
| 清除 | 点 `-clear` | 保持 | `onClear()`（测试：`should trigger onClear when click clear button`） |

### 6.1 受控 / 非受控

上游把 `value` / `defaultValue` 的比较与同步交给 rc 的 `PickerInput`。
⚠️ **我们已经在 `picker` foundation 踩过同一个坑**（PITFALLS 207：React 闭包快照 vs Vue `computed`
活引用 ⇒ `triggerChange` 的比较恒为假）⇒ 本组件的受控同步必须**先取快照再写**，
并且要**单独测非受控路径**（`defaultValue`）。

### 6.2 边界（实测/上游测试标题）

| 场景 | 行为 | 依据 |
|---|---|---|
| `value` 传 **字符串** | **抛错**：`getUDayjs(…).isValid is not a function` | 实测（本仓 SSR dump 时踩到）⇒ `value` / `defaultValue` **必须是 Dayjs 实例** |
| `value` 重置为 `undefined` | 不抛错（有专门测试 `should not throw error when value is reset`） | RangePicker.test |
| `allowClear` | 无值时不渲染清除按钮（SSR 字节相同） | 实测 |
| `status="error"` | 加类名，但 `input[aria-invalid]` **不变** | 实测 |
| `showTime` 的 `format` 是**函数 / 数组** | 支持 | DatePicker.test 标题 |
| `format` 是 `kk:mm`（ISO 周） | 有专门测试 | DatePicker.test 标题 |
| locale **深合并**（partial 字段） | `merge(contextLocale, props.locale)` | DatePicker.test 标题 |

### 6.3 废弃告警（G2 要逐条实现，实测 `generateSinglePicker.js`）

| 旧 prop | 新位置 | 备注 |
|---|---|---|
| `dropdownClassName` | `classNames.popup.root` | |
| `popupClassName` | 同上 | |
| `popupStyle` | `styles.popup.root` | |
| `bordered` | `variant` | |
| `onSelect` | `onCalendarChange` | 只对 `picker==='time' && !multiple` 走兼容转发 |
| `DatePicker.WeekPicker` 等 **legacy 用法** | `DatePicker[picker='week']` | 实测判据是 `warning(picker !== 'quarter', …)` ⇒ ⚠️ **判据看起来是反的**，**待验证**（可能上游 bug，登记 UPSTREAM） |

---

## 7. Component Token

实测 `style/token.d.ts` —— **三类接口**。
⚠️ registry 的 `tokenCount=3` **不是**这三个接口，而是实测
`registry/source/antd-6.6.4.raw.json` 的 `componentTokens['date-picker']`：

```json
["presetsWidth", "presetsMaxWidth", "zIndexPopup"]
```

即**该组件直接声明的那 3 个自有用户面 token**（从 input / select / roundedArrow 继承来的不计）。
下面三类接口的完整面：

```ts
// ① 面板侧的自有 token（12 个），另 extends Select 的 MultipleSelectorToken
interface PanelComponentToken extends MultipleSelectorToken {
  cellHoverBg; cellActiveWithRangeBg; cellHoverWithRangeBg;
  cellBgDisabled; cellRangeBorderColor;
  timeColumnWidth; timeColumnHeight; timeCellHeight;
  cellHeight; cellWidth; textHeight; withoutTimeCellHeight;
}
// ② 用户可覆盖的 ComponentToken = 输入框侧 + 面板侧 + 箭头 + 3 个自有
interface ComponentToken extends Exclude<SharedComponentToken,'addonBg'>, PanelComponentToken, ArrowToken {
  presetsWidth; presetsMaxWidth; zIndexPopup;
}
// ③ 内务 token（10 个，不是用户面）
type PickerPanelToken = { pickerCellCls; pickerCellInnerCls; pickerDatePanelPaddingHorizontal; … };

prepareComponentToken = GetDefaultToken<'DatePicker'>;   // ⇒ 注册名是 'DatePicker'
```

**默认值推导**（`style/token.js` 逐字，凡 `calc`/`FastColor`/`Math` 的必须照抄语义）：

| Token | 推导 |
|---|---|
| `cellHoverBg` | `controlItemBgHover` |
| `cellActiveWithRangeBg` | `controlItemBgActive` |
| `cellHoverWithRangeBg` | `new FastColor(colorPrimary).lighten(35).toHexString()` |
| `cellRangeBorderColor` | `new FastColor(colorPrimary).lighten(20).toHexString()` |
| `cellBgDisabled` | `colorBgContainerDisabled` |
| `timeColumnWidth` | `controlHeightLG * 1.4` |
| `timeColumnHeight` | `28 * 8` |
| `timeCellHeight` | `28` |
| `cellWidth` | `controlHeightSM * 1.5` |
| `cellHeight` | `controlHeightSM` |
| `textHeight` | `controlHeightLG` |
| `withoutTimeCellHeight` | `controlHeightLG * 1.65` |
| `presetsWidth` / `presetsMaxWidth` | `120` / `200` |
| `zIndexPopup` | `zIndexPopupBase + 50` |
| `INTERNAL_FIXED_ITEM_MARGIN` | `Math.floor(paddingXXS / 2)` |

⚠️ **`lighten()` 的产出色** —— 本仓已有收敛物 `_internal/color-composite.ts`（tour + input-number + slider），
它返回 **`Color` 实例**而不是字符串（因为调用方要 `toRgbString()` / `toHexString()` 二选一）。
这里要的是 `toHexString()` ⇒ **直接复用，不要另起一份**。

⚠️ `PanelComponentToken extends MultipleSelectorToken` ⇒ `multiple` 模式的标签样式**与 Select 同源**，
token 面必须并入 Select 那一套（本仓 `select` 已收口）。

---

## 8. 依赖面

| 类型 | 内容 |
|---|---|
| rc 包 | `@rc-component/picker`（**唯一真依赖**）、`@rc-component/util`（`merge` / `isNonNullable`） |
| antd 生态 | `@ant-design/fast-color`（token 推导）、`@ant-design/icons`、`@ant-design/cssinjs`（**我们不用**） |
| 叶子模块 | **`button/Button`**（`PickerButton`）、**`select/useIcons`**（`clearIcon` / `allowClear`） |
| 运行时依赖的组件 | `Button`（面板按钮）、`Select` 的 `useIcons`（图标复用） |
| 需要的 foundation | `icons` · `locale` · `overlay` · `picker` · `portal` · `position` · `theme` · `utils`（**8 个全部 completed** ✅） |

### 8.1 叶子模块 → `packages/ui/src/_internal/`

| antd 叶子 | 我们的位置 | 说明 |
|---|---|---|
| `button/Button` | 直接用 `../button`（已收口） | `PickerButton` = `<Button size="small" type="primary">` |
| `select/useIcons` | **待定**：抽 `_internal/picker-icons.ts` 还是复用 select 的 hooks？ | ⚠️ 检查 `select` 收口时把 `useIcons` 放在哪了；若只在 select 内部，这里需要**提升到 `_internal/`**（第三次法则：select + date-picker + time-picker 三个消费者） |
| `config-provider/context` · `DisabledContext` · `useSize` | `_internal/` 里已有的等价物（context / 尺寸） | 按 `config-provider` 收口时的落位 |
| `form/context` · `useVariant` | 同上（`form` 已收口） | |
| `space/Compact` 的 `useCompactItemContext` | 同上（`space` 已收口） | |

---

## 9. 复用本仓资产（**先 grep 再用，别重写**）

| 需求 | 已有资产 |
|---|---|
| 面板 / 面板上下文 / 时间列 | `@apollo-design/picker`（`PickerPanel` / `PanelHeader` / `7 个面板` / `TimeColumn` / `providePanelInfoFromProps`） |
| 浮层 / Portal | `@apollo-design/overlay` + `@apollo-design/portal` |
| 定位 | `@apollo-design/position` |
| `lighten(35)` 的颜色合成 | `packages/ui/src/_internal/color-composite.ts` |
| 尺寸 → CSS 值 | `_internal/to-css-size.ts`（**进 `style` 的尺寸必须走它**，PITFALLS 170） |
| `mask` 相关 | `_internal/use-merged-mask.ts`（不适用，登记为「不涉及」） |
| locale 结构 | `@apollo-design/locale`（`lang` + `timePickerLocale` 需要补 `placeholder*` 字段，见 §3.3） |
| 图标 | `@apollo-design/icons`（`CalendarOutlined` / `ClockCircleOutlined` / `SwapRightOutlined` / `CloseCircleOutlined`） |

⚠️ `packages/ui/src/index.ts` 是**手工维护**的：只动自己的 export 块、按字母序追加（MEMORY 判据 4）。

---

## 10. Vue 化决策（按 `COMPATIBILITY.md` 映射）

| React | Vue | 分类 |
|---|---|---|
| `value` + `onChange(date, dateString)` | `v-model:value` + `@change` | **INTENDED**（`onChange` 仍要发，C11） |
| `defaultValue` | 同名 | 直接 |
| `open` + `onOpenChange` | `v-model:open` + `@openChange` | **INTENDED** |
| `ref` → `PickerRef` | `defineExpose` + `useDatePicker()` 命令面 | **INTENDED**（参照 `modal` / `message` 的三件套先例） |
| `PanelComponentToken` 的 token 注入 | 静态 CSS 变量（`defineComponentToken` 家族） | **PLATFORM** |
| `css-dev-only-do-not-override-*` / `css-var-root` / `-css-var` | **不产** | **PLATFORM**（L4 过滤，已有过滤器） |
| `transitionName = ${rootPrefixCls}-slide-up` | `apollo-slide-up` | **PLATFORM**（⚠️ 前缀是 **rootPrefixCls**，写错会**静默失效**，PITFALLS 180） |
| `prefixIcon` 那几个空 span | 保留同样类名（图形由样式画） | **PLATFORM** |
| `renderExtraFooter` / `panelRender` / `cellRender` | 插槽 + 函数 prop 双支持 | **INTENDED** |

---

## 11. 风险预登记（动手前逐条核实）

1. 🚨 **输入框侧的键盘逻辑没有现成的 Vue 实现。** `picker` foundation 只 Vue 化了**面板**；
   rc 的 `PickerInput`（方向键改值 / Enter / Tab 跨段 / 输入解析 / 通过 `-input-active` 切换活动段）
   全在 `@rc-component/picker/lib/PickerInput/` 里，**绑 React**（`useState` + `useEvent`）。
   ⇒ 这是本组件**最大的一块自研量**。动手前必须先决定：**重写** vs **只做受控展示 + 键盘最小集**。
   建议做法：先读 `PickerInput/hooks/useInputProps.js` 与 `useFieldFormat.js`，用**行为测试**钉，
   不追求逐位对拍（它没有 SSR 可锚定的确定性输出 —— 输入框内容取决于交互历史）。
2. 🚨 **`format` 要支持函数/数组**（上游测试标题为证）⇒ 必须把
   `picker` 包的 `PickerFormat` **加回 `DateType` 泛型 + `CustomFormat<DateType>`**
   （现在是无泛型的 `string | readonly string[] | { format }`，见 PITFALLS 214 的欠账）。
   ⇒ 这是**跨包改动**（`packages/picker`），要单独跑它的 L1/L3。
3. ⚠️ **面板与输入框的 `prefixCls` 传递链**：`picker` 包的 `PickerPanel` 默认 `apollo`，
   而本组件会接管 `prefixCls`（`apollo-picker`）⇒ 面板的所有类名会整体换前缀。
   `picker` 的 L4 基线是 `ant-picker-*`（rc 侧），换前缀后**不能直接复用它的基线做比较**，
   要按「类名替换后的同构」比对。（`picker` 的 `prefixCls` 是 prop，支持换。）
4. ⚠️ **`-status-error` 不设 `input[aria-invalid]`**，但 Form 的反馈图标会挂到 `-suffix` 上；
   两件事的类名/ARIA 要分开钉。
5. ⚠️ **`open` 的浮层卸载是异步的**（PITFALLS 179）⇒ L2 断言卸载必须**轮询**。
6. ⚠️ **`MonthPicker` / `WeekPicker` 的 `ValueType = Dayjs | Dayjs`**（上游类型里这个写法很怪）
   ⇒ 定型面时**待验证**：是不是要表达 `DateType | DateType[]` 的残留。
7. ⚠️ **`.vue` 还是 `.tsx`**：面板层在 `picker` 包用的是 `.ts` + `defineComponent`
   （因为要出 DOM 无视觉、且 TS 可复用）。本组件有样式与大量插槽 ⇒ 建议 **`.vue`**（仓内多数组件如此），
   但要在 `COMPONENT-RULES.md` §2 的框架下论证。

---

## 12. 测试矩阵（计划）

| 维度 | 取值 | 预计用例 |
|---|---|---|
| picker | date / week / month / quarter / year / time | 6 |
| 尺寸 | 默认 / small / large | 3 |
| 变体 | outlined / filled / borderless | 3 |
| 状态 | 默认 / error / warning / disabled | 4 |
| 值 | 无 / 有 / 受控 / 非受控 / multiple | 5 |
| 范围专属 | separator（默认/自定义）/ activeBar / 两端占位符 | 4 |
| 时间 | showTime 若干组合 / 12 小时制 / 毫秒 | 6 |
| 槽 | 7 个 popup 子槽 + root/prefix/input/suffix | 8 |
| 面板 | cellRender / panelRender / renderExtraFooter / presets | 4 |

| 层 | 文件 | 计划 | 关键断言 |
|---|---|---|---|
| L1 Unit | `index.test.ts` | ~60 | 纯函数（placeholder 优先序 / variant 类 / token 推导） |
| L2 Interaction | `index.test.ts` / `keyboard.test.ts` | ~80 | 开合、选择、清除、受控同步、键盘 |
| L3 Type | `type.test-d.ts` | ~15 | `picker` 与 `ValueType` 的联动、`v-model:value` |
| L4 DOM Contract | `semantic.test.ts` | ~35 | **挂载后**的输入框 DOM（SSR 拿不到浮层） |
| L5 A11y | `a11y.test.ts` | ~25 | axe + `aria-label="Clear"` + separator 的 aria 两条 |
| L6 Visual | `tests/visual/` | ~40 | 状态 × 主题 × viewport；**面板侧已有 picker 的覆盖** |
| L7 Build | — | — | 走既有门禁 |

⚠️ L4 的基线**必须挂载渲染**（`open: true` 的 SSR 只有 889 B，浮层完全不渲染）。

---

## 13. 不做什么（明确边界）

- **不搬 locale**：antd 的 60 个 `date-picker/locale/*.js` 只是 re-export `../locale/<lang>`，
  本仓的 `@apollo-design/locale` 已有同等结构；只在**缺字段时**补
  （`yearPlaceholder` / `quarterPlaceholder` / `weekPlaceholder` / `range*Placeholder` / `timePickerLocale.*`）。
- **不产 CSS-in-JS 类名**（`css-dev-only-*` / `css-var-root` / `-css-var`）。
- **不重做面板**（已由 `picker` 包提供）。
- **不实现 `generatePicker(customGenerateConfig)`**：本仓只支持 dayjs（**待验证**是否需要保留出口）。
- **不跟随 `bordered` 的 deprecated 语义**（只发告警 + 转发到 `variant`）。

---

## 14. 待验证问题

- [ ] rc 的 `PickerInput` 键盘/输入逻辑到底有多少行、能否用「最小集」覆盖（`lib/PickerInput/` 实测行数）
- [ ] `DatePicker.WeekPicker` 的 legacy 告警判据 `picker !== 'quarter'` 是不是上游 bug（≈ UPSTREAM）
- [ ] `MonthPickerProps<ValueType = Dayjs | Dayjs>` 这个 `Dayjs | Dayjs` 的意图
- [ ] `select/useIcons` 在本仓的落位；是否要提升到 `_internal/`
- [ ] 面板换 `prefixCls` 后，`picker` 的 37 条基线的可复用程度（类名替换是否足够）
- [ ] `@apollo-design/locale` 的 `lang` / `timePickerLocale` 是否已含全部 `*Placeholder`
- [ ] L4 挂载渲染时浮层走 Portal ⇒ `dom-contract` 工具是否能吃到 Portal 出来的节点（`picker` 已解决，复用其做法）

---

**分析完成标志**：以上字段全部填写完毕，且 API 面与 DOM 结构来自实测。
下一步（G2）：定型 Vue API（Props / Emits / Slots / Expose / Types），
并把 `registry/components.json` 的 `antdApi` 置 `done`、`status` 推进到 `analyzing`。
