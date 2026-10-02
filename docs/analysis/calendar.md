# Calendar · G1 分析产物

> **先于实现存在**（`AGENTS.md` §2）。契约来源：antd **6.6.4**
> `components/calendar/`（`generateCalendar.tsx` 445 + `Header.tsx` 201 + `style/index.ts` 275）+
> `es/calendar/` 产物 + `demo/`（10 个用户可见）+ `__tests__/`（853 行 / 4 文件）。
>
> **可复现的实测**：`node tests/visual/debug/extract-calendar-css.mjs [--tokens]`
> —— 本轮新增；输出 26 条 `--ant-calendar-*` 声明、164 个含 `.ant-picker-calendar` 的选择器。

---

## 0. 结论摘要（四句话）

1. **`Calendar` = `CalendarHeader` + `PickerPanel`（`hideHeader`）** —— 它**不是**薄壳
   （有 445 行自己的逻辑），但**复用 `picker` 的类名前缀与面板样式**：
   `prefixCls = getPrefixCls('picker')` ⇒ 根类名是 **`apollo-picker-calendar`**。
2. 🚨 **它没有自己的浮层**：面板是**内联**的 ⇒ SSR 能拿到全量 DOM/CSS
   （与 date-picker 相反，**不需要** `PurePanel` 那套绕过 Portal 的手法）。
3. 🚨 **样式与 `date-picker` 的 panel 强耦合**：`genCalendarStyles` 把
   **`genPanelStyle(token)` 整个 spread 进 `[calendarCls]`** ⇒ 产物里
   **date-picker 的面板规则被整套重作用域到 `.apollo-picker-calendar` 下**
   （164 个选择器里绝大多数是它们）。**这是 G4 最大的工作量与最大的设计问题**（§3.3）。
4. **6 个自有 Component Token**（registry 一致），但 **css-var 块有 26 条声明** ——
   `prepareComponentToken` 里 `...initPanelComponentToken(token)` 把面板 token 也带进来了。

---

## 1. 组件面

### 1.1 上游文件 → 本仓

| 上游 | 行数 | 本仓 | 形态 |
|---|---|---|---|
| `generateCalendar.tsx` | 445 | `Calendar.vue` | `.vue`（有完整 props/emits/slots/expose） |
| `Header.tsx` | 201 | `components/CalendarHeader.ts` | `.ts` 渲染函数（三块内联子组件，见 §1.3） |
| `style/index.ts` | 275 | `style/index.ts` + `style/token.ts` | 见 §3 |
| `locale/*`（68 语言） | — | **已有**：`packages/locale` 的 `Calendar` | 复用 |
| `date-picker/style` 的 `genPanelStyle` / `initPanelComponentToken` / `initPickerPanelToken` | — | ❌ **本仓未导出** | 🚨 **G4 的硬前提**，见 §3.3 |

### 1.2 对外面（`CalendarProps`）

```ts
interface CalendarProps<DateType> {
  prefixCls?; className?; rootClassName?; style?;
  classNames?; styles?;                    // 6 槽（§2.5）
  locale?: typeof enUS;
  validRange?: [DateType, DateType];
  disabledDate?: (date: DateType) => boolean;
  cellRender?: (date, info: CellRenderInfo<DateType>) => ReactNode;
  fullCellRender?: (date, info) => ReactNode;
  headerRender?: (config: { value; type; onChange; onTypeChange }) => ReactNode;
  value?; defaultValue?; mode?: CalendarMode; fullscreen?: boolean; showWeek?: boolean;
  onChange?: (date) => void;
  onPanelChange?: (date, mode) => void;
  onSelect?: (date, info: SelectInfo) => void;
  // 4 个 @deprecated（§2.4）
}
type CalendarMode = 'year' | 'month';
interface SelectInfo { source: 'year' | 'month' | 'date' | 'customize' }
interface CalendarRef { nativeElement: HTMLDivElement }
```

### 1.3 三个内联子组件（都在 `Header.tsx` 里，**不单独导出**）

| 子组件 | 渲染 | 关键判据 |
|---|---|---|
| `YearSelect` | 一个 `Select`，类名 `${calendarPrefixCls}-year-select` | 选项 = `year ± 10`（共 20 个）；`validRange` 时改用范围的起止年；`suffix = locale.year === '年' ? '年' : ''`；`size = fullscreen ? undefined : 'small'`；`getPopupContainer = () => divRef.current` |
| `MonthSelect` | 一个 `Select`，类名 `-month-select` | **只在 `mode === 'month'` 时渲染**；`validRange` 时按当前年收窄起止月 |
| `ModeSwitch` | 一个 `Radio.Group`，类名 `-mode-switch` | 两个 `Radio.Button`（`month` / `year`）；`size` 同上 |

`CalendarHeader` 本身：`<div class="${calendarPrefixCls}-header">`，里面用
**`FormItemInputContext.Provider` 覆盖 `isFormItemInput: false`**（让内嵌的 Select 不认成表单项）。

### 1.4 依赖面核查（照 skill 的对照表逐项查过）

| antd 用的 | 本仓落点 | 结论 |
|---|---|---|
| `@rc-component/picker` 的 `PickerPanel` | `@apollo-design/picker` 的 `PickerPanel` | ✅ 已有（date-picker 在用） |
| `@rc-component/util` 的 `merge` / `useControlledState` | `@apollo-design/utils` / 本仓 hook | ⚠️ 见 §4.1 |
| `../radio` 的 `Button` / `Group` | `ui/src/radio` | ✅ completed |
| `../select` 的 `Select` | `ui/src/select` | ✅ completed |
| `../form/context` 的 `FormItemInputContext` | `ui/src/form/context` | ✅ 已有 |
| `../_util/hooks/useMergeSemantic` | `ui/src/_internal/use-merge-semantic` | ✅ 已有 |
| `../config-provider/context` 的 `useComponentConfig` | `config-provider/context` | ✅ 已有 |
| `../locale` 的 `useLocale` | `packages/locale` | ✅ 已有 |
| `../style` 的 `resetComponent` | `packages/theme` 的 `BASE_CSS` | ✅ 已有 |
| `date-picker/style` 的 `genPanelStyle` 等三个 | ❌ **未导出** | 🚨 **硬前提**，见 §3.3 |

**没有新增 foundation 缺口**（`next-task.mjs` 报的 5 个 foundation 包全部 completed）。

---

## 2. 行为契约（逐条）

### 2.1 状态

```js
mergedValue = useControlledState(() => defaultValue || getNow(), value)   // 默认「今天」
mergedMode  = useControlledState('month', mode)                          // 默认 'month'
panelMode   = mergedMode === 'year' ? 'month' : 'date'
```

⚠️ **`mergedValue` 的默认值 `getNow()` 是运行时求值** ⇒ 视觉/契约用例必须传 `value`
（否则基线随运行日变化 —— 与 date-picker 的 `defaultPickerValue` 同判）。

### 2.2 三个回调的触发条件（**顺序即语义**）

```
triggerChange(date):
  setMergedValue(date)
  if (!isSameDate(date, mergedValue)):            ← 🚨 同一天则**什么都不发**
     if (panelMode==='date' && !isSameMonth(date, mergedValue)) ||
        (panelMode==='month' && !isSameYear(date, mergedValue)):
        triggerPanelChange(date, mergedMode)      ← 跨月/跨年才补发 panelChange
     onChange(date)

triggerModeChange(newMode):
  setMergedMode(newMode)
  triggerPanelChange(mergedValue, newMode)        ← 传的是**当前值**，不是新日期

onInternalSelect(date, source):                   ← Header 与面板都走它
  triggerChange(date)
  onSelect(date, { source })
```

`source` 的四个取值：`'year'`（YearSelect）/ `'month'`（MonthSelect）/
`'date'`（面板，实为 `panelMode`）/ `'customize'`（`headerRender` 里自己调的 `onChange`）。
⚠️ 面板那一支传的是 **`panelMode`**（`'date'` 或 `'month'`），**不是**字面量 `'date'`。

### 2.3 禁用判定

```js
mergedDisabledDate = (date) =>
  (validRange ? isAfter(validRange[0], date) || isAfter(date, validRange[1]) : false)
  || !!disabledDate?.(date)
```

⚠️ **`validRange` 与 `disabledDate` 是「或」**，且 `validRange` 的越界判定用的是
`isAfter`（**不含端点**）。

### 2.4 四个废弃 prop（**判据是 `in props`，不是值**）

| 废弃 | 替代 |
|---|---|
| `dateFullCellRender` | `fullCellRender` |
| `dateCellRender` | `cellRender` |
| `monthFullCellRender` | `fullCellRender` |
| `monthCellRender` | `cellRender` |

⚠️ 命名空间是 **`Calendar`**；⚠️ 与 date-picker 同判：Vue 的 `props` 恒含所有声明过的键
⇒ 判据要改成 `props.x === undefined`（照抄 `in` 会**恒告警**）。

### 2.5 语义槽（**6 槽，两段式归属**）

```
root | header          ← 由 Calendar 自己用（headerCls/headerStyle 传给 CalendarHeader）
body | content | item | itemContent   ← **转交给面板**（panelClassNames/panelStyles → PickerPanel）
```

⚠️ `itemContent` 特殊：它还**单独**被 `dateRender` / `monthRender` 用在
`${calendarPrefixCls}-date-content` 上（`mergedItemContentClassName` / `Style`）。

### 2.6 单元格渲染的三级回退（`dateRender` / `monthRender` 各一遍）

```
fullCellRender → 旧的 dateFullCellRender / monthFullCellRender → 默认实现
默认实现 = <div class="{prefixCls}-cell-inner {calendarPrefixCls}-date [ -date-today ]">
             <div class="{calendarPrefixCls}-date-value">{日 / 月}</div>
             <div class="{calendarPrefixCls}-date-content [ itemContent ]">{cellRender 或旧 prop}</div>
           </div>
```

⚠️ **日期用 `String(getDate(date)).padStart(2, '0')`**（两位补零）；**月份用 `shortMonths`**
（来自 `info.locale.shortMonths || generateConfig.locale.getShortMonths(locale)`）。
⚠️ `dateRender` 判 `isFunction(fullCellRender)`，而 `monthRender` 判 `fullCellRender` 的真值
—— **两处判据不同**（照抄上游，别统一）。

### 2.7 根节点

```
class = {calendarPrefixCls} [ -full | -mini ] [ -rtl ] + contextClassName + className
        + rootClassName + rootCls + hashId + cssVarCls
style = rootStyle            ← 语义槽的 `root`
```

⚠️ `-full` / `-mini` 由 `fullscreen`（默认 **`true`**）决定；`-rtl` 由 ConfigProvider 的
`direction` 决定。⚠️ `prefixCls` 的默认值是 `getPrefixCls('picker')` ⇒ **`apollo-picker`**。

---

## 3. 样式契约

### 3.1 6 个 Component Token（registry 一致）

| token | 默认值来源 | 解析值 |
|---|---|---|
| `fullBg` | `colorBgContainer` | `#ffffff` |
| `fullPanelBg` | `colorBgContainer` | `#ffffff` |
| `itemActiveBg` | `controlItemBgActive` | `#e6f4ff` |
| `yearControlWidth` | 字面量 | `80` ⇒ `80px` |
| `monthControlWidth` | 字面量 | `70` ⇒ `70px` |
| `miniContentHeight` | 字面量 | `256` ⇒ `256px` |

⚠️ `prepareComponentToken` 里 **`...initPanelComponentToken(token)`** ⇒
css-var 块**共 26 条声明**（6 自有 + 20 面板），实测：

```
--ant-calendar-full-bg = #ffffff
--ant-calendar-full-panel-bg = #ffffff
--ant-calendar-item-active-bg = #e6f4ff
--ant-calendar-year-control-width = 80px
--ant-calendar-month-control-width = 70px
--ant-calendar-mini-content-height = 256px
--ant-calendar-cell-hover-bg = rgba(0,0,0,0.04)
…（后面 19 条全是 date-picker 面板的 token，见 `extract-calendar-css.mjs --tokens`）
```

### 3.2 4 个 `mergeToken` 派生（用户**不可**覆盖）

```js
mergeToken(token, initPickerPanelToken(token), {
  calendarCls: `${componentCls}-calendar`,
  pickerCellInnerCls: `${componentCls}-cell-inner`,
  dateValueHeight:  controlHeightSM,                                   // 24
  weekHeight:      calc(controlHeightSM).mul(0.75).equal(),            // 18
  dateContentHeight: calc(calc(fontHeightSM).add(marginXS)).mul(3).add(calc(lineWidth).mul(2)).equal(),
})
```

⇒ 与 time-picker 同判：它们**不进** `ComponentToken`，由 `style/index.ts` 内联消费。

### 3.3 🚨 **与 `date-picker` 的面板样式强耦合**（G4 的硬前提）

```js
export const genCalendarStyles = (token) => ({
  [calendarCls]: {
    ...genPanelStyle(token),          // ← 🚨 date-picker 的**整套面板规则**
    ...resetComponent(token),
    background: fullBg,
    '&-rtl': { direction: 'rtl' },
    [`${calendarCls}-header`]: { … }, // 日历自己的 header 三条
  },
  [`${calendarCls} ${componentCls}-panel`]: { … },   // 覆盖面板
  [`${calendarCls}-mini`]: { … },
  [`${calendarCls}${calendarCls}-full`]: { … },      // 全屏的那一大块
  [`@media (max-width: ${screenXS})`]: { … },
});
```

⇒ **产物里 `date-picker` 的面板规则被整套重作用域到 `.ant-picker-calendar` 之下**
（实测 164 个选择器）。这不是「引用」，是**复制 + 换前缀**。

**本仓的现状**：`date-picker/style/index.ts` 只导出 `genTokenDecls` / `DATE_PICKER_RULES` /
`genDatePickerStyle`，**没有** `genPanelStyle` 的对应物；而 `DATE_PICKER_RULES` 是
**257 条静态规则**、把**触发元素与面板混在一起**。
> ⚠️ 勘误（2026-10-02）：先前这里与 `PLAN.md` 都写成 **254 条**，是**凭记忆**写的；
> 实测 `DATE_PICKER_RULES.split('\n').filter(l => l.trim()).length === 257`
> （`date-picker/__tests__/theme.test.ts` 早就有这条断言）。又一次「记忆 ≠ 事实」。

**候选方案**：

| 方案 | 内容 | 判定 |
|---|---|---|
| **A（✅ 已采用，2026-10-02 落地）** | 把 `DATE_PICKER_RULES` 机械拆成 `TRIGGER_RULES`（174 条）+ `PANEL_RULES`（83 条），导出 `PANEL_RULES` 与 `genPanelRules(scopeCls)`；`calendar/style` 用 `genPanelRules('.apollo-picker-calendar')` 取面板规则 | ✅ 与上游同构（`genPanelStyle` 本就是 date-picker 的东西）；⚠️ 改 `date-picker`（已 completed）⇒ 已单独跑它的 7 层回归 |
| B | `calendar/style` 直接把**整个** `DATE_PICKER_RULES` 换前缀复用 | ❌ 会产出**大量死规则**（日历里没有 `.apollo-picker-input` / `-suffix` / `-clear`）⇒ 产物臃肿、B6 预算与「规则数」类断言会难看；**不是上游行为** |
| C | 手抄面板规则进 calendar 的样式 | ❌ 83 条面板规则抄一遍 = 必然漂移；上游是 **import**，不是抄 |

⚠️ 方案 A 的拆分**必须按产物判据**（哪个选择器属于面板），不能凭推演。

**✅ 实际采用的判据（可复现的双向 oracle）**：`tests/visual/debug/classify-date-picker-rules.mjs`。
上游 `panel.ts` 的 `genPanelStyle` 被**两个**组件复用 ——
`date-picker/index.ts` 的 `'&-dropdown': { ...genPanelStyle(token) }` 与
`calendar/style/index.ts` 的 `[calendarCls]: { ...genPanelStyle(token) }` —— 于是：

```
date-picker 产物里 → `.ant-picker-dropdown <X>`
calendar    产物里 → `.ant-picker-calendar <X>`
⇒ 两边 <X> 的**交集**就是 genPanelStyle 的产物
```

实测：`dpSet = 147` · `calSet = 134` · **交集 = 119 个选择器 / 83 条规则**。
**反向验证**：`dpSet \ calSet` 的 28 条逐条可证**不**来自 `genPanelStyle` ——
它们全部来自 `genPickerPanelStyle`（`-footer` / `-footer-extra` / `-ranges` / `-ok` /
`-now-btn-disabled` / `-preset`）或 `index.ts` 的 `&-dropdown` 段
（`-panel-container*` / `-range-arrow*` / `-range-wrapper` / `-presets*` / `-panels` /
`-panel > -time-panel`）。且 `genPanelStyle` 的 41 个根键里**没有**任何一个这些名字。

**落地形态**：面板块在产物里是**连续**的第 43–125 条 ⇒ 拆成三段
（前段 42 + 面板 83 + 后段 132）**按原顺序拼回**，`DATE_PICKER_RULES` 与拆分前
**逐字节相同**（实测 53284 字节 == 53284 字节）。
不变量钉在 `date-picker/__tests__/theme.test.ts` 的「规则拆分不变量」组（6 条）。

### 3.4 媒体查询

`@media only screen and (max-width: ${screenXS})`（`screenXS` = 480px）：
header 改 `display:block`，`-year-select` 宽 50%，`-month-select` 宽
`calc(50% - paddingXS)`，`-mode-switch` 宽 100% 且 `> label { width:50%; text-align:center }`。

⚠️ 注意媒体查询的**冒号后没有空格**（`(max-width: 480px)`）—— 与 list 的实测同判，
逐字保留（写统一了 L6 会产生假差异）。

---

## 4. Vue 对应（平台差异与关键设计）

### 4.1 `useControlledState` → 本仓的受控/非受控归一

上游用 `@rc-component/util` 的 `useControlledState(defaultValue, value)`。
本仓的对应物是 `_internal/use-merged-mask.ts` 同族的做法 —— ⚠️ **动手前先 grep
`packages/ui/src/_internal/` 与 `date-picker/hooks/`**，别另起一份（PITFALLS 254 的教训）。

### 4.2 `headerRender` 是**函数 prop**，不是插槽

上游签名 `(config: {value, type, onChange, onTypeChange}) => ReactNode`。
本仓按「函数 prop + 插槽等价物」双轨（与 date-picker 的 `renderExtraFooter` 同判）。

### 4.3 `cellRender` / `fullCellRender` 也是函数 prop

⚠️ 参数是 `(date, info)`，`info.type` 是 `'date' | 'month'`（由 `mergedCellRender` 分派）。
本仓的类型要**保留 `info` 的形状**（`CellRenderInfo<DateType>`）。

### 4.4 平台差异预判

| # | 差异 | 分类 |
|---|---|---|
| 1 | `CalendarRef` = `{ nativeElement: HTMLDivElement }` —— 本仓用 `defineExpose`（⚠️ 但 date-picker 至今**没有** `defineExpose`，见 §5） | PLATFORM |
| 2 | 无 `hashId`（D2）；`-css-var` 直接拼（D5 家族） | PLATFORM |
| 3 | `FormItemInputContext.Provider` 覆盖 `isFormItemInput:false` —— Vue 侧走 `provide` | PLATFORM |
| 4 | `getPopupContainer={() => divRef.current}` 指 **header 的 div**（不是 root） | 与上游一致 |
| 5 | `useStyle(prefixCls, calendarPrefixCls)` 传**两个**前缀（date-picker 只传一个） | 与上游一致 |

---

## 5. 预判差异与缺口

| # | 事项 | 分类 | 处置 |
|---|---|---|---|
| 1 | 🚨 `date-picker/style` 未导出 `genPanelStyle` 等价物 | **硬前提** | G4 走方案 A（拆 `DATE_PICKER_RULES`）+ 跑 date-picker 的 7 层回归 |
| 2 | `lunar` demo 需要 `lunar-typescript`（未安装的第三方） | 缺口 | 不移植，登记 README §5 |
| 3 | `component-token` demo（`theme.components.Calendar` 调试） | 缺口 | 与全仓 10+ 组件同判（零运行时架构下 token 是构建期产物） |
| 4 | 继承 date-picker 的 `classNames.root` / `ref` 缺口？ | 待验证 | ⚠️ Calendar **自己**实现 `rootCls`（不经过 date-picker 的 `Selector`）⇒ 这条**可能不继承**，G4 要实测 |
| 5 | `-cell-inner` 的类名由 `pickerCellInnerCls` token 注入 | 与上游一致 | 面板侧的样式归属 |

**可移植的 demo：8 个**（`basic` / `card` / `customize-header` / `event-range` /
`notice-calendar` / `select` / `style-class` / `week`）。

---

## 6. 本分析没有证明什么

1. ~~没证明方案 A 的拆分是对的~~ —— ✅ **已证（2026-10-02）**：判据 = 两侧产物取交集
   （`classify-date-picker-rules.mjs`）⇒ TRIGGER **174** + PANEL **83**，且反向检查
   `dpSet \ calSet` 的 28 条逐条可证不来自 `genPanelStyle`。不变量钉在
   `date-picker/__tests__/theme.test.ts`（6 条）。**更关键的一条**：面板规则换到
   calendar 后与产物 **83/83 逐条逐字节一致**（含 `--apollo-date-picker-*` →
   `--apollo-calendar-*` 的命名空间替换 —— 漏了这一步会「声明 A、引用 B」静默回退）。
2. **没证明 Calendar 的 CSS 规则数**。本轮只拿到「164 个含 `.ant-picker-calendar` 的选择器」
   这个**粗口径**；G4 要逐条提取成规则表（与 date-picker 的 `DATE_PICKER_RULES` 同法）。
3. **没证明 `classNames.root` 在本组件是否也失效**（§5 第 4 条）—— 需实测。
4. **没证明视觉正确**（L6 逐像素负责）。
5. **没证明 `useControlledState` 的本仓对应物存在且同构** —— §4.1 要先 grep 再动手。
