# `picker` 契约文档

> **适用范围**：日期/时间面板引擎。
> 本文档是 `AGENTS.md` §2 步骤 3 的**分析产物**，必须先于实现存在。
>
> ⚠️ **就绪标准**（`registry/foundation.json` 的 `readiness`，源自 `registry/dependencies.json`）：
> `Phase 1 只需确定接口契约，实现可延后到 DatePicker 开发前`。
> ⇒ 本文档的 §5（Vue API 契约）是**本轮的主交付物**；§6 的实现范围按能力止损，
> 未实现的部分在 §6.4 逐条列明，**不谎报完成**。

---

## 1. 这个包解决什么

antd 的 `@rc-component/picker` 把四件性质不同的事揉在一个包里：

| 性质 | 内容 | 框架耦合 | 可测性 |
|---|---|---|---|
| **日期语义** | `isSame(…, 'week')`、`isSameDecade`、`getWeekStartDate`、`isInRange`、`fillTime` | **零** | 纯函数，可穷举 |
| **面板几何** | 6×7 日历网格的 `baseDate` 推导、`rowNum × colNum`、`getCellDate`、cell 状态（in-view / today / in-range / range-start / range-end / selected） | 几何**零**；但代码写在 React 组件里 | 几何可抽成纯函数 |
| **选择状态机** | 单值 / 区间值的 `calendarValue` ↔ `submitValue`、排序、`order`/`allowEmpty` 校验 | **绑 `useSyncState`/`useEffect`/`useControlledState`** | 判定逻辑纯，调度绑 React |
| **渲染与交互** | 面板组件、输入框、浮层、键盘、cellRender | **强绑 React** | Vue 化重写 |

本项目把它们分到两处：**`picker`（本包）** 承担前三项中**可纯函数化**的部分，
**`packages/ui/src/{date-picker,time-picker}`** 承担渲染、输入框与浮层。

⚠️ **包内 README 的一处失真（本次核对发现）**：README 的「必须遵守的契约」写着
「键盘导航（方向键 / PageUp / PageDown / Home / End）与 antd 一致」。
**这在 `@rc-component/picker@1.12.2` 上不成立** —— 见 §3.5：
1.12.2 里没有 PageUp / PageDown / Home / End 的处理，只剩输入框 mask-format
字段级的左右/上下。本轮不修改这条契约（它属于 `scaffold-packages.mjs` 生成的内容，
改动要先改模板），但在 §3.5 记录事实，并在 §7 登记为待裁决 **P1**。

---

## 2. 事实来源

| 来源 | 版本 / 位置 | 用途 |
|---|---|---|
| antd 兼容目标 | **6.6.4** | `registry/components.json` 的 `antdVersion` |
| `@rc-component/picker` | **1.12.2** | 行为判据。本地副本 `/tmp/rc-src/picker/package/`（npm tarball 解包，599 文件） |
| └ `es/utils/dateUtil.js` | 128 行 | §3.1 日期语义。**零 React import** |
| └ `es/utils/miscUtil.js` | 59 行 | §3.2 通用工具。**零 React import** |
| └ `es/generate/dayjs.js` | 186 行 | §3.3 日期库适配层。**零 React import** |
| └ `es/PickerPanel/PanelBody.js` | 147 行 | §3.4 网格与 cell 状态。`import * as React` |
| └ `es/PickerPanel/{Date,Week,Month,Quarter,Year,Decade}Panel/index.js` | — | §3.4 各面板几何参数。`import * as React` |
| └ `es/PickerInput/Selector/Input.js` | 240–269 行 | §3.5 键盘导航。`import * as React` |
| └ `es/PickerInput/hooks/useRangeValue.js` | 245 行 | §3.6 区间状态机。`import * as React` |
| └ `es/PickerPanel/TimePanel/TimePanelBody/util.js` | 30 行 | §3.7 `findValidateTime`。**零 React import** |
| └ `es/generate/index.d.ts` | 33 行 | `GenerateConfig<DateType>` 的类型契約 |
| └ `es/interface.d.ts` | — | `PanelMode` / `PickerMode` / `DisabledDate` / `Locale` |

**禁止**凭记忆描述 antd 行为。本文件每条结论都注明了文件与行号，可回查。

### 2.1 全量 React 耦合扫描（本轮实测）

对 `es/**/*.js` 全量 grep `^import … from 'react'`（120 个文件）：

| 分类 | 文件数 | 代表 |
|---|---|---|
| **零 React**（可对拍） | 约 90 | `utils/dateUtil.js`、`utils/miscUtil.js`、`generate/*.js`、`locale/*.js`（纯数据）、`PickerPanel/TimePanel/TimePanelBody/util.js`、`PickerTrigger/util.js`、`PickerInput/Selector/util.js` |
| **绑 React**（不可对拍） | 约 30 | 全部 `PickerPanel/**` 面板组件、`PickerInput/**` 输入框与 hooks、`hooks/useLocale.js`、`hooks/useSyncState.js` |

⚠️ 一个反直觉的结果：`PickerInput/hooks/{useOpen,useDisabledBoundary,useShowNow,useInvalidate,
useInputReadOnly,useRangeDisabledDate}.js` 与 `hooks/useToggleDates.js`
**没有直接 import react**，但前五个依赖 `@rc-component/util` 的 `useEvent`
或间接依赖 `useDelayState` ⇒ **仍是 React hooks，不可对拍**。
判据不能只看「这个文件有没有写 `from 'react'`」，要看**整条 import 链**（PITFALLS 类比的
「复用前先看语义，不要看名字」，见 PITFALLS 70）。

---

## 3. 上游契约（逐条）

### 3.1 日期语义（`es/utils/dateUtil.js`）

全部是 `generateConfig` 之上的纯函数。关键语义：

| 函数 | 语义要点 / 坑 |
|---|---|
| `nullableCompare(v1, v2, fn)` | `!v1 && !v2 \|\| v1 === v2 ⇒ true`；只有**一个**空 ⇒ `false`；否则 `fn()` |
| `isSameDecade` | `floor(year/10)` 相等 |
| `isSameYear` / `isSameMonth` / `isSameDate` / `isSameTime` | 逐级收窄；`isSameMonth` = 同年 + 同月，`isSameDate` = 同年月 + 同日 |
| `isSameTimestamp` | `isSameDate` + 同 h/m/s + 同 ms |
| `getQuarter` | `floor(month/3) + 1`（month 是 0-based） |
| `isSameWeek` | 比较 `locale.getWeekFirstDate` 的**年**是否相同 **且** `locale.getWeek` 相等 ⚠️ 年判据用 `isSameYear` 而非「同一天」 |
| `isSame(…, type)` | `switch`：`date/week/month/quarter/year/decade/time`，**default 走 `isSameTimestamp`** |
| `isInRange(start, end, cur)` | 三者任一为空 ⇒ `false`；`isAfter(cur, start) && isAfter(end, cur)` ⇒ **开区间**（端点不算） |
| `isSameOrAfter(…, type)` | `isSame(…, type) \|\| isAfter(d1, d2)` ⚠️ 类型是 `type` 级粒度，不是时刻 |
| `getWeekStartDate(locale, gen, value)` | 见 §3.1.1 |
| `formatValue(value, {generateConfig, locale, format})` | 空值 ⇒ `''`；`format` 是函数 ⇒ `format(value)`；否则 `gen.locale.format(locale.locale, …)` |
| `fillTime(gen, date, time)` | `time` 为空 ⇒ 把 h/m/s/ms **全部置 0**（不是置为当前时间） |
| `WEEK_DAY_COUNT` | `7` |

#### 3.1.1 `getWeekStartDate` 的回退分支（最容易写错的一处）

```js
const weekFirstDay   = gen.locale.getWeekFirstDay(locale);   // 如 zh_CN = 1（周一）
const monthStartDate = gen.setDate(value, 1);
const startDateWeekDay = gen.getWeekDay(monthStartDate);
let alignStartDate = gen.addDate(monthStartDate, weekFirstDay - startDateWeekDay);
if (gen.getMonth(alignStartDate) === gen.getMonth(value) && gen.getDate(alignStartDate) > 1) {
  alignStartDate = gen.addDate(alignStartDate, -7);
}
return alignStartDate;
```

第二个 `if` 的含义：**只有当「对齐后的日期仍落在本月且 > 1 号」时才回退一周**。
判据是 `getMonth(alignStartDate) === getMonth(value)`，用的是 **`value` 的月份**（不是
`monthStartDate` 的）。当 `value` 本身就在 1 号时两者相同，但当调用方传入的是
「已 setDate 到 1 号的月份起始日」（`DatePanel` 第 30–31 行正是这么传的）时也一样。

⚠️ 不要「顺手优化」成 `alignStartDate > monthStartDate` 之类的比较 ——
`addDate(-7)` 只在「本月 1 号本身就是周起始日」之外的情形下不该触发，
而 `> 1` 与「同月」两个条件**缺一不可**（跨月时第一行已经落到上月，不能再退）。

### 3.2 通用工具（`es/utils/miscUtil.js`）

| 函数 | 语义 |
|---|---|
| `leftPad(str, length, fill='0')` | 补到 `length`；**超过 length 不截断** |
| `toArray(val)` | `null`/`undefined` ⇒ `[]`；数组原样；其余包成数组 |
| `fillIndex(ori, index, value)` | 浅拷贝数组后写 `index` |
| `pickProps(props, keys)` | `keys` 为空 ⇒ 取全部；**过滤 `undefined`** |
| `getRowFormat(picker, locale, format)` | `format` 优先；否则按 picker 取 `locale.fieldXxxFormat`；default 走 `fieldDateFormat` |
| `getFromDate(calendarValues, triggeredFields, activeIndex)` | 找 `triggeredFields` 里第一个「有值」的索引；若它就是 `activeIndex` ⇒ `undefined` |

⚠️ `toArray` 与 `@apollo-design/utils` 的 `toArray` **同名不同义**（后者是给 Vue children
设计的，会展平 vnode）。本包另起名字或直接从本包导出，不复用 —— 与 PITFALLS 70 同源。

### 3.3 日期库适配层（`es/generate/dayjs.js`）

`GenerateConfig<DateType>` 的方法面见 `es/generate/index.d.ts`：
get × 8（weekday/ms/s/m/h/date/month/year）+ `getNow`/`getFixedDate`/`getEndDate`、
add × 3、set × 7、`isAfter`/`isValidate`、
`locale.{getWeekFirstDay, getWeekFirstDate, getWeek, format, parse, getShortWeekDays?, getShortMonths?}`。

dayjs 适配的三处关键（`generate/dayjs.js`）：

| 位置 | 行为 | 为什么重要 |
|---|---|---|
| `:106-111` `getUDayjs` | `!dayjs.isDayjs(v) \|\| v instanceof dayjs` ⇒ 原样返回；否则 `dayjs(v.valueOf())` | 跨 dayjs 实例（用户 extend 了别的插件）时**强制换成内部实例**，避免 `isAfter` 拿到不同原型 |
| `:125-127` `getWeekDay` | `clone.locale('en')` 后 `weekday()`，再**加上** `localeData().firstDayOfWeek()` | ⚠️ 先 `weekday()`（相对周日起算）再加首日偏移；**不是** `day()` |
| `:150-155` locale 系列 | `dayjs().locale(parseLocale(locale))`，`parseLocale` 走 `localeMap` 再 fallback `locale.split('_')[0]` | `zh_CN ⇒ 'zh-cn'`、`en_GB ⇒ 'en-gb'`、`by_BY ⇒ 'be'`；映射表是**数据**，照抄 |

⚠️ 适配层**不改 dayjs 的全局**：`dayjs.extend(...)` 在模块顶层执行（副作用），
我们的实现也要在同一处集中 extend，且 extend 的插件集合必须与上游一致
（`customParseFormat` / `advancedFormat` / `weekday` / `localeData` / `weekOfYear` / `weekYear`），
否则 `getWeek` / `getShortWeekDays` 会抛或返回错误值。

### 3.4 面板几何与 cell 状态（`PanelBody.js` + 各 Panel）

#### 3.4.1 网格生成（`PanelBody.js` 49–137）

```
for row in [0, rowNum):
  for col in [0, colNum):
    offset      = row * colNum + col
    currentDate = getCellDate(baseDate, offset)
    ...
```
⚠️ `getCellDate(baseDate, offset)` 的 `offset` 是**全局线性下标**，不是「本行第 col 个」。
`WeekPanel` 无单元格选择（`cellSelection: false`），改为**整行**选择（`rowClassName`）。

#### 3.4.2 各面板的几何参数（逐文件核对）

| 面板 | `baseDate` | `getCellDate` | row×col | `cellSelection` |
|---|---|---|---|---|
| date | `getWeekStartDate(locale, gen, gen.setDate(pv,1))` | `addDate(d, offset)` | **6×7** | `!isWeek` |
| week | 同 date（`mode:'week'`, `panelName:'week'`） | `addDate(d, offset)` | 6×7 | **false**（`DatePanel` `:174`） |
| month | `gen.setMonth(pv, 0)` | `addMonth(d, offset)` | **4×3** | true |
| quarter | `gen.setMonth(pv, 0)` | `addMonth(d, offset*3)` | **1×4** | true |
| year | `addYear(getStartYear(pv), -1)`，`getStartYear = setYear(d, floor(year/10)*10)` | `addYear(d, offset)` | **4×3** | true |
| decade | `addYear(getStartYear(pv), -10)`，`getStartYear = setYear(d, floor(year/100)*100)` | `addYear(d, offset*10)` | **4×3** | true |

⚠️ year 面板的 `baseDate` 是**起始年 −1**（渲染 12 格 = 上一年 + 十年 + 下一年？实际是
`-1 … +10`，共 12 格，其中 `-1` 与 `+10` 是溢出格）；decade 是**起始世纪 −10 年**
（即上一个十年的起点）。这两个 `-1` / `-10` 是「看得见的怪癖」，必须照抄。

#### 3.4.3 cell 状态（`PanelBody.js` 56–102，`clsx` 的对象键）

| class 后缀 | 条件 |
|---|---|
| `-disabled` | `mergedDisabledDate?.(currentDate, { type })`（面板自己的 `disabledDate` 优先于 context 的） |
| `-hover` | `(hoverValue \|\| []).some(d => isSame(gen, locale, cur, d, type))` |
| `-in-range` | `inRange && !rangeStart && !rangeEnd` |
| `-range-start` | `isSame(gen, locale, cur, hoverStart, type)` |
| `-range-end` | `isSame(gen, locale, cur, hoverEnd, type)` |
| `-cell-selected` | `!hoverRangeValue && type !== 'week' && matchValues(cur)` |
| `-cell-in-view` | 面板自定义（date: `isSameMonth(cur, pv)`；year: 同起/止年或在区间内；month/quarter: 恒 true） |
| `-cell-today` | 面板自定义（date: `isSameDate(cur, now)`） |

⚠️ 两条顺序/优先级规则：
1. `-range-start` / `-range-end` 用 `isSame(…, type)`（`type` 是**面板粒度**），
   所以 week 面板下一整周都算 start/end；
2. `-cell-selected` 只在 `hoverRangeValue` **不存在**时才生效 —— hover 预览期间
   选中标**让位**给 range 标。这不是 CSS 层叠能解决的事情，是状态机的语义。

### 3.5 键盘导航（实测：与 README 的断言不符）

`es/PickerInput/Selector/Input.js` 189–269 行的 `onFormatKeyDown`：

| 键 | 行为 |
|---|---|
| `Enter` | `validateFormat(inputValue)` 通过 ⇒ `onSubmit()` |
| `Backspace` / `Delete` | 清空当前 mask cell |
| `ArrowLeft` / `ArrowRight` | `offsetCellIndex(∓1)`，clamp 到 `[0, maskFormat.size()-1]` |
| `ArrowUp` / `ArrowDown` | `offsetCellValue(±1)`：`rangeStart + (range + num - rangeStart) % range` 环绕 |
| 数字键 | 累加到 `focusCellText`，自动填充 |

`offsetCellValue` 的三态（`Input.js` 219–229）：
当前文本 `Number()` 为 `NaN` ⇒ 返回 `rangeDefault ?? (offset>0 ? rangeStart : rangeEnd)`；
否则取模环绕。`getMaskRange`（`Selector/util.js`）的预设区间：
`YYYY [0,9999,今年]` / `MM [1,12]` / `DD [1,31]` / `HH [0,23]` / `mm,ss [0,59]` / `SSS [0,999]`。

⚠️ **结论**：1.12.2 的键盘导航**全部在输入框的 mask 层**，且**没有** PageUp / PageDown /
Home / End。README 里那条契约来自更早期的 rc-picker（那时面板本体有 `useKeyboard`）。
本包（`picker`）按 README 的边界「不实现输入框」⇒ **键盘导航的 mask 层不属于本包**，
但 `offsetCellValue` 的**数值环绕**是纯逻辑，本包提供（§5.6），供 ui 的输入框复用。

### 3.6 区间选择状态机（`useRangeValue.js`）

可抽成纯逻辑的三块：

1. **`orderDates(dates, gen)`**（`:52-54`）：
   `[...dates].sort((a,b) => gen.isAfter(a,b) ? 1 : -1)`
   ⚠️ 比较函数**只返回 1 或 -1，永不返回 0**（相等时给 -1），且**不保证稳定**时的方向。

2. **`isSameDates(source, target)`**（`:37-49`）：
   按 `max(len)` 逐位比；`prev !== next && !isSameTimestamp(gen, prev, next)` ⇒ `diffIndex = i; break`。
   返回 `[diffIndex < 0, diffIndex !== 0]` = `[全同, 起止位没变]`。
   第二个返回值决定 `onCalendarChange` 的 `info.range` 是 `'end'` 还是 `'start'`。

3. **`triggerSubmit` 的四道校验**（`:177-208`）：
   - `validateEmptyDateRange`：`allowEmpty` 未给 ⇒ `true`；给了 ⇒ `(start 非空 || allowEmpty[0]) && (end 非空 || allowEmpty[1])`
   - `validateOrder`：`!order || start空 || end空 || isSame(start,end,picker) || isAfter(end,start)`
   - `validateDates`：`(disabled[0] || !start || !isInvalidateDate(start,{activeIndex:0})) && (disabled[1] || !end || !isInvalidateDate(end,{from:start,activeIndex:1}))`
     ⚠️ 校验 end 时会把 `from: start` 传进去 —— 这是 `disabledDate` 的 `info.from` 来源
   - `allPassed`：`isNullValue || (以上三条全真)`
   - `onChange` 只在 `!isSameMergedDates` 时触发；`isNullValue && everyEmpty ⇒ 传 null`

⚠️ `flushSubmit(index, needTriggerChange)` 用 `fillIndex(submitValue(), index, getCalendarValue()[index])`
—— 只同步**一个**槽位。这是「先选 start 再选 end」期间不提交的关键。

### 3.7 时间列校验（`TimePanelBody/util.js`）

`findValidateTime(date, getHourUnits, getMinuteUnits, getSecondUnits, getMillisecondUnits, gen)`：
逐级（h → m → s → ms）对齐；若当前值对应的 unit 不存在**或被 disabled** ⇒
在**未禁用**的 unit 里找**反向第一个 `value <= nextValue`**，找不到则取**第一个可用 unit**。
⚠️ 「反向第一个 ≤」而不是「最近的」—— 前缀偏大时落到**上一个**可用值，不是下一个。

---

## 4. ⭐ Oracle 判据与结论

判据（MEMORY.md）：**上游零框架耦合 ⇒ 可对拍；绑 React 生命周期 ⇒ 不能。**

### 4.1 结论表

| 上游文件 | 框架耦合 | 本轮做法 |
|---|---|---|
| `es/utils/dateUtil.js` | **零** | ✅ **Oracle 逐位差分**（§4.2） |
| `es/utils/miscUtil.js` | **零** | ✅ **Oracle 逐位差分** |
| `es/generate/dayjs.js` | **零**（只 import dayjs） | ✅ **Oracle 逐位差分**（作为 generateConfig 对拍的基准） |
| `es/PickerPanel/TimePanel/TimePanelBody/util.js` | **零** | ✅ **Oracle 逐位差分** |
| `es/PickerPanel/PanelBody.js` + 各 Panel | `import * as React` | ❌ 不能对拍。读源码作规格（§3.4），**行为测试** |
| `es/PickerInput/hooks/useRangeValue.js` | `useSyncState`/`useEffect` | ❌ 不能对拍。抽纯逻辑（§3.6），**行为测试** |
| `es/PickerInput/Selector/Input.js` | React | ❌ 不能对拍，且**不在本包边界内**（§3.5） |

### 4.2 Oracle 怎么做（必须真的两边同时跑）

上游代码固化在 **`packages/picker/oracle/upstream/`**（含 `provenance.json` 记录包名、
锁定版本、每个文件的 sha256 —— 与 `registry/source/locale-rc` 同一套做法）。

⚠️ 深路径 import 的前提：**包没有 `exports` 字段**（有则被路径白名单挡住）。
`@rc-component/picker` **有** `exports`（`./es/generate/*`、`./es/locale/*`、`./es/interface`），
且**不包含** `./es/utils/*` ⇒ 深路径 import 会被拒。
对策：**固化成本仓库的文件**（不走 package 解析），Vite 直接按相对路径加载。已采用。

两侧同时跑的形状：

```
ours  : ourDateUtil.isSameWeek(ourGen, locale, a, b)
up    : upDateUtil.isSameWeek(upGen,   locale, a, b)     // upstream generate/dayjs.js
断言  : toEqual / 逐位比对（含 null / undefined 通道）
```

⚠️ **不谎报**：这样对拍证明的是「**我们的日期语义函数 + 我们的 dayjs 适配层**」这一整条
与上游等价。若出现差异需要**二分**（单独对拍适配层，见 §4.3），否则无法归因。

### 4.3 适配层单独对拍（归因用）

`ourGen.<method>(d)` vs `upGen.<method>(d)`，对同一批 `Dayjs` 输入逐位比。
这一层通过之后，§4.2 的差异才能归因到我们的语义函数。

### 4.4 Oracle 不覆盖什么

- **不覆盖我们自己的 API 面**（PITFALLS 60）：oracle 只对拍「上游也有的函数」。
  本包新增的 API（§5 的 `buildPanelCells` 等）**必须另写行为测试**。
- **不覆盖中间值**：`isSameTimestamp` 在两侧都为 `undefined` 时差异被抹平 ⇒
  oracle 与 units **必须并存**。
- **不做 PoC**（`pocRequired: false`），因此不需要「机械移植」对照物；
  这里的上游副本是**判据**，不是移植源。

---

## 5. Vue API 设计（本轮的主交付物）

设计原则（对齐 `COMPATIBILITY.md` 的映射规则）：
`value + onChange → v-model`（在 ui 层完成，本包只出**受控/非受控无关的纯函数 + 状态机**）、
`render props → slot`（ui 层）、`Context → provide/inject`（ui 层）、
`useXxx → 纯函数 / composable`。

⚠️ **R4 引擎无视觉**：本包**不**产出 CSS、不定义颜色/圆角/阴影，不产出组件 DOM。
面板的 DOM 结构与 class 名由 `ui` 层按 §3.4.3 的状态渲染。

### 5.1 类型（`types.ts`）

```ts
/** 对齐上游 `PanelMode`，去掉无渲染语义的 'datetime' 归并方式 */
export type PanelMode =
  | 'time' | 'date' | 'week' | 'month' | 'quarter' | 'year' | 'decade';

export type PickerMode = Exclude<PanelMode, 'decade'>;

/** 生成配置：本包对日期库的唯一依赖面（见 §3.3） */
export interface GenerateConfig<DateType> { /* 同 es/generate/index.d.ts 的方法面 */ }

/** 面板 locale 子集：只声明本包真正会读的键（见 §3.1 / §3.4） */
export interface PickerLocale {
  locale: string;
  fieldDateFormat?: string; fieldDateTimeFormat?: string; fieldTimeFormat?: string;
  fieldMonthFormat?: string; fieldYearFormat?: string; fieldWeekFormat?: string;
  fieldQuarterFormat?: string;
  cellDateFormat?: string; cellYearFormat?: string; cellQuarterFormat?: string;
  yearFormat?: string; monthFormat?: string; monthBeforeYear?: boolean;
  shortWeekDays?: readonly string[]; shortMonths?: readonly string[];
  week?: string;
}

export type DisabledDate<DateType> = (
  date: DateType,
  info: { type: PanelMode; from?: DateType },
) => boolean;

/** 一个格子的完整状态。由 `buildPanelCells` 产出，ui 层只做渲染 */
export interface PanelCell<DateType> {
  date: DateType;
  /** 线性下标 row * colNum + col */
  offset: number;
  row: number;
  col: number;
  text: string;
  title?: string;
  disabled: boolean;
  inView: boolean;
  today: boolean;
  selected: boolean;
  hovered: boolean;
  inRange: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
}
```

### 5.2 网格生成（`panel.ts`）

```ts
export interface PanelGeometry<DateType> {
  rowNum: number;
  colNum: number;
  baseDate: DateType;
  /** (baseDate, 线性 offset) => 该格日期 */
  getCellDate: (base: DateType, offset: number) => DateType;
  /** 该格文案（date 用 cellDateFormat，year 用 cellYearFormat …） */
  getCellText: (date: DateType) => string;
  /** 面板自定义状态：in-view / today */
  getCellState?: (date: DateType) => { inView?: boolean; today?: boolean };
  /** week 面板整行选择时启用 */
  cellSelection: boolean;
  titleFormat?: string;
}

/** 六个面板的几何表。key 与 PanelMode 一一对应 */
export function getPanelGeometry<DateType>(
  mode: PanelMode,
  ctx: {
    generateConfig: GenerateConfig<DateType>;
    locale: PickerLocale;
    pickerValue: DateType;
  },
): PanelGeometry<DateType>;

/** 把几何 + 值/hover/disabled 折叠成格子矩阵 */
export function buildPanelCells<DateType>(
  geometry: PanelGeometry<DateType>,
  ctx: {
    generateConfig: GenerateConfig<DateType>;
    locale: PickerLocale;
    mode: PanelMode;
    now: DateType;
    values: readonly (DateType | null | undefined)[];
    hoverValue?: readonly DateType[] | null;
    hoverRangeValue?: readonly [DateType, DateType] | null;
    disabledDate?: DisabledDate<DateType>;
  },
): PanelCell<DateType>[][];
```

⚠️ `buildPanelCells` 返回的是**二维数组**（`rows[row][col]`），与 `PanelBody` 的
`rowNum × colNum` 结构一一对应，便于 ui 层直接 `v-for`。
`prefixColumn`（周号列）**不在**返回值里 —— 它是 date 面板的额外首列，
由 ui 层用 `getWeek` 单独渲染（本包提供 `getWeekNumber`）。

### 5.3 日期语义（`date-util.ts`）

与上游同名的纯函数（签名去掉 `generateConfig` 前置参数的「上下文对象」形态，
改为**首个参数 `generateConfig`**，保持与上游一致以便于 oracle 对拍）：

```ts
export const WEEK_DAY_COUNT = 7;
export function isSameDecade<DateType>(g, a, b): boolean;
export function isSameYear / isSameMonth / isSameDate / isSameTime / isSameTimestamp
export function isSameQuarter(g, a, b): boolean;
export function getQuarter(g, date): number;
export function isSameWeek(g, locale: string, a, b): boolean;
export function isSame(g, locale: PickerLocale, a, b, type: InternalMode): boolean;
export function isInRange(g, start, end, cur): boolean;
export function isSameOrAfter(g, locale, a, b, type: InternalMode): boolean;
export function getWeekStartDate(g, locale: string, value): DateType;
export function formatValue(value, { generateConfig, locale, format }): string;
export function fillTime(g, date, time?): DateType;
```

⚠️ 与上游的两处**签名差异**（有意，记入 §7）：
1. 上游 `isSameWeek(generateConfig, locale, d1, d2)` 的 `locale` 是**裸字符串**
   （`locale.locale`），而 `isSame` 收的是 **Locale 对象**。这个不对称是上游的真实形态，
   我们**照抄**（改对称会让 call site 全错）。
2. `isSame` / `isSameOrAfter` 的 `type` 收 **`InternalMode`**（不是 `PanelMode`）：
   `'datetime'`（以及任何未列出的值）落到 **default = `isSameTimestamp`**，
   收窄成 `PanelMode` 会让这条分支不可达 ⇒ 既丢了行为，也留下无法覆盖的死代码。

### 5.4 通用工具（`misc-util.ts`）

```ts
export function leftPad(str: string | number, length: number, fill?: string): string;
export function toArray<T>(val: T | readonly T[] | null | undefined): T[];
export function fillIndex<T>(ori: readonly T[], index: number, value: T): T[];
export function pickProps<T extends object>(props: T, keys?: readonly (keyof T)[]): Partial<T>;
/**
 * ⚠️ 返回 `string | undefined` —— locale 的 `fieldXxxFormat` 全是可选键，
 * 缺键时返回 `undefined` 是**合法结果**，不是错误。
 */
export function getRowFormat(
  picker: PickerMode, locale: PickerLocale, format?: string,
): string | undefined;
export function getFromDate<T>(calendarValues: readonly (T|null|undefined)[],
                               triggeredFields: readonly number[], activeIndex: number): T | undefined;
```

### 5.5 区间状态机（`range.ts`）

只导出**纯判定**，不导出 hook（hook 属于 ui 层，因为它要接 `v-model`）：

```ts
export interface RangeSubmitInput<DateType> {
  generateConfig: GenerateConfig<DateType>;
  locale: PickerLocale;
  picker: PickerMode;
  /** `[允许 start 为空, 允许 end 为空]`。未给 ⇒ 两个都必须有值 */
  allowEmpty?: readonly [boolean, boolean];
  order: boolean;
  /** 两个输入框各自的 disabled 状态 */
  disabled: readonly [boolean, boolean];
  /** 点的是「清除」按钮（上游 `nextValue === null`）⇒ 直接放行 */
  nullValue: boolean;
}

export function orderDates<DateType>(dates: readonly DateType[], g): DateType[];

/** [全同, 起止位没变] —— 第二个值决定 onCalendarChange 的 info.range */
export function isSameDates<DateType>(g, source, target): [boolean, boolean];

export interface RangeValidateResult {
  passed: boolean; emptyOk: boolean; orderOk: boolean; datesOk: boolean;
}
export function validateRangeSubmit<DateType>(
  input: RangeSubmitInput<DateType>,
  start: DateType | null | undefined,
  end: DateType | null | undefined,
  isInvalidateDate: (date: DateType, info: { from?: DateType; activeIndex: number }) => boolean,
): RangeValidateResult;
```

⚠️ `isInvalidateDate` 由调用方注入（它是 `disabledDate` + `showTime.disabledTime` 的合并，
属 ui 层的配置语义），本包不持有。

⚠️ `nullValue` 是**必填**而不是可选：`passed = nullValue || (三条校验全过)`，
做成可选参数会多出一条永远走不到的分支（见 §8.2 的分支覆盖纪律）。

### 5.6 键盘数值（`keyboard.ts`，只出纯数值部分）

```ts
/** 对齐 `Selector/util.js` 的 PresetRange */
export function getMaskRange(key: string): readonly number[] | undefined;
/** 对齐 `Input.js:219-229` 的三态环绕 */
export function offsetCellValue(
  currentText: string, cellFormat: string, offset: number,
): string | undefined;
```

### 5.7 时间列（`time-util.ts`）

```ts
export interface TimeUnit { readonly value: number; readonly disabled: boolean; }
export function findValidateTime<DateType>(
  date: DateType,
  getHourUnits: () => TimeUnit[],
  getMinuteUnits: (hour: number) => TimeUnit[],
  getSecondUnits: (hour: number, minute: number) => TimeUnit[],
  getMillisecondUnits: (hour: number, minute: number, second: number) => TimeUnit[],
  g: GenerateConfig<DateType>,
): DateType;
```

### 5.8 dayjs 适配层（`generate/dayjs.ts`）

`export const dayjsGenerateConfig: GenerateConfig<Dayjs>`。
⚠️ 模块顶层 `dayjs.extend(...)`（与上游同集合），**有副作用**但只影响本包拿到的 dayjs 实例。

### 5.9 索引（`index.ts`）

导出 §5.1–§5.8 的全部类型与函数。**不**导出任何 Vue 组件。

---

## 6. 实现范围（本轮实际落地）

### 6.1 已实现

| 模块 | 行数 | Oracle | 行为测试 |
|---|---|---|---|
| `src/types.ts` | 138 | — | — |
| `src/generate/dayjs.ts` | 164 | ✅ §4.3（9 例） | ✅ |
| `src/date-util.ts` | 325 | ✅ §4.2（13 例） | ✅ |
| `src/misc-util.ts` | 101 | ✅（7 例） | ✅ |
| `src/panel.ts`（`getPanelGeometry` + `buildPanelCells`） | 307 | ❌（React 绑） | ✅ |
| `src/range.ts` | 119 | ❌ | ✅ |
| `src/keyboard.ts` | 77 | ❌ | ✅ |
| `src/time-util.ts` | 98 | ✅（4 例） | ✅ |
| `src/index.ts` | 78 | — | — |
| `src/__tests__/*.test.ts` × 8 | 1452 | — | — |
| `src/__tests__/picker.test-d.ts` | 326 | — | L3 |

**实测**（2026-09-19，本机）：
`vitest run --project unit packages/picker/src/__tests__` ⇒ **9 文件 / 114 用例 / 0 失败**；
加 `--project types` 的 `picker.test-d.ts` **25 用例** ⇒ unit + types 合计 **139**。
覆盖率（单包聚合）**语句 99.29 / 分支 97.00 / 函数 99.08 / 行 99.27**（阈值 95/90/95 ⇒ met）。

### 6.2 明确**未**实现（不谎报）

| 未实现 | 归属 / 理由 |
|---|---|
| 面板 **Vue 组件**（DatePanel/MonthPanel/…） | 属 `ui` 层；R4 引擎无视觉，本包只出 `buildPanelCells` |
| `useRangeValue` / `useInnerValue` 这类 hook | 绑 `v-model` 与组件生命周期，属 `ui` 层 |
| 输入框 + mask-format 键盘导航 | README 的 `notDo` 第 1 条明确排除 |
| `cellRender` / `showTime` / `presets` / `disabledTime` 的配置合并 | 属 `ui` 层的 props 语义 |
| `useLocale` 对接 | 等 `@apollo-design/locale` 被真实组件消费后再联调（MEMORY 未决事项 4） |

### 6.3 为什么到这条线就停

`readiness` 原文允许「实现延后到 DatePicker 开发前」。继续往下写的每一步
（面板组件 → 输入框 → 浮层）都需要 `ui` 层的 `config-provider` 与 `overlay`/`position`
先落地，而现在**这两者都还没被真实消费过**（MEMORY 未决事项 4/6）。
在空地基上堆面板组件只会产出无法验证的半成品 —— 按要求「不要为了看起来完整而堆半成品」。

### 6.4 与「置 completed」的差距

`dimensions.impl` 保持非 `done`（面板组件未实现）⇒ `status` 保持 `implementing`，
**不**置 `completed`。§6.2 的每一项都会同步写进 `foundation.json` 的 `notes`。

---

## 7. 与 antd 的差异

**本轮不新增 `D<n>`。** 判据同 `position` 契约 §6：`D<n>` 只登记**行为差异**，
内部架构拆分（如「把 `PanelBody` 的 JSX 拆成 `buildPanelCells` 纯函数」）不是行为差异。

§5.3 记录的两处签名差异是**上游形态的照抄**，不是我方有意偏离 ⇒ 不登记 `D<n>`。

⚠️ 若后续实现面板组件时发现**真实**的行为偏差，必须在 `COMPATIBILITY.md` §9.2 追加一行
并在 §9.3 登记决策。

---

## 8. 测试策略

| 层 | 内容 | 载体 |
|---|---|---|
| L1 单元 | §5 全部纯函数；`getWeekStartDate` 的回退分支（§3.1.1）、`buildPanelCells` 的 7 个状态位 | `src/__tests__/*.test.ts` |
| L1 Oracle | `date-util` / `misc-util` / `generate-dayjs` / `time-util` 对上游逐位差分 | `src/__tests__/*.oracle.test.ts` |
| L2 交互 | **n/a** —— 本包无 DOM 产物（R4），交互在 ui 层 | `layerNotes` 写明 |
| L3 类型 | `*.test-d.ts`（含负例） | `src/__tests__/*.test-d.ts` |
| L4 DOM 契约 | **n/a** —— 无 DOM 产物 | 同上 |
| L5 无障碍 | **n/a** —— 键盘导航在输入框（ui 层），本包只出数值环绕 | 同上 |
| L6 视觉 | **n/a**（L2 不产组件样式，R4） | 同上 |
| L7 构建 | `tests/build/run.mjs` | 门禁 |

⚠️ `L2/L4/L5` 的 `n/a` **不是免死金牌**：E16 要求每个 `n/a` 都有 `layerNotes`。
三条的依据都是 R4（引擎无视觉、无 DOM 产物），已写进 `foundation.json`。

### 8.1 覆盖率

阈值 **95 / 90 / 95**（L2 档，见 `vitest.config.ts`）。
⚠️ 两个测法坑（PITFALLS 63）：① 别从 `'..'`（index.ts）导入；
② 在根跑单包覆盖率要加 `--coverage.include='packages/picker/src/**'`。

### 8.2 变异验证（实测 25 组，**25 杀 / 0 等价**）

一个变异体一次 Bash 调用，流程固定为「应用 → 跑必要测试文件 → 还原 → sha256 比对」
（PITFALLS 62 的纪律）。

| # | 文件 | 变异 | 结果 |
|---|---|---|---|
| 1 | `date-util` | `getWeekStartDate` 的回退 `-7` → `-6` | 杀（oracle） |
| 2 | `date-util` | `isInRange` 的 `&&` → `\|\|` | 杀（oracle） |
| 3 | `date-util` | `getQuarter` 去掉 `+1` | 杀（oracle） |
| 4 | `date-util` | `fillTime` 的 hour 恒置 0 | 杀（oracle） |
| 5 | `misc-util` | `leftPad` 的 `while` 恒假 | 杀 |
| 6 | `misc-util` | `pickProps` 去掉「过滤 undefined」 | **首轮存活** → 见下 |
| 7 | `misc-util` | `getFromDate` 的 `activeIndex !==` → `true` | 杀 |
| 8 | `panel` | `selected` 去掉 `!hoverRange &&` | 杀 |
| 9 | `panel` | year 面板 `-1` → `0` | 杀 |
| 10 | `panel` | decade 面板 `offset * 10` → `offset` | 杀 |
| 11 | `panel` | `inRange` 去掉「不是端点」 | 杀 |
| 12 | `range` | `orderDates` 的 `1 : -1` 反向 | 杀 |
| 13 | `range` | 去掉 `nullValue` 短路 | 杀 |
| 14 | `range` | `diffIndex < 0` → `true` | 杀 |
| 15 | `range` | start 的 `activeIndex: 0` → `1` | 杀 |
| 16 | `range` | 去掉 `from: start` | 杀 |
| 17 | `keyboard` | 去掉取模环绕 | 杀 |
| 18 | `keyboard` | `Number.isNaN` → `false` | 杀 |
| 19 | `keyboard` | 去掉 `rangeDefault` 分支 | 杀 |
| 20 | `time-util` | 去掉 `.reverse()` | 杀（oracle） |
| 21 | `time-util` | `<=` → `>=` | 杀（oracle） |
| 22 | `time-util` | 去掉「档位不存在或被禁用」守卫 | 杀（oracle） |
| 23 | `generate/dayjs` | 去掉 `+ firstDayOfWeek()` | **首轮存活** → 见下 |
| 24 | `generate/dayjs` | 去掉 `parseLocale` 的 fallback | **首轮存活** → 见下 |
| 25 | `generate/dayjs` | `toLocalDayjs` 直接返回原值 | 杀（oracle） |

#### ⭐ 三个首轮存活 —— 全是**真断言缺口**，处置是补强断言，不是删断言

| # | 存活的根因 | 处方 |
|---|---|---|
| 6 | 用 `toEqual` 比 `pickProps` 的结果时，`{b: undefined}` 与「没有 b 键」**相等** ⇒ 「忘了过滤 undefined」看不出来 | 改用**键集合**断言 `Object.keys(...)`，并显式断言 `null` 要保留 |
| 23 | `getWeekDay` 内部强制 `.locale('en')`，而内置 `en` 的 `weekStart` 是 0 ⇒ `+ firstDayOfWeek()` 恒等于 `+ 0` | 用例里 `updateLocale('en', { weekStart: 2 })` 之后再比对（用 `dayjs/plugin/updateLocale`）。**并把这条写进 §10.8** |
| 24 | 测试只加载了 `zh-cn`，而 `fr_FR` 的 fallback 目标 `fr` **没加载** ⇒ 两侧都回退到 en，无差异 | 多加载一个 `dayjs/locale/fr`，并显式断言 `fr_FR` 的周起始日确实是 1（周一）而不是 0 |

⚠️ 三处都是**加断言 / 加数据**，没有删任何一条既有断言，也没有 `skip`。

---

## 9. 待裁决

### P1 · README 的键盘导航契约已过时

`packages/picker/README.md` 的「必须遵守的契约」写「键盘导航（方向键 / PageUp /
PageDown / Home / End）与 antd 一致」，但 `@rc-component/picker@1.12.2` 里
**没有** PageUp / PageDown / Home / End（§3.5 实测）。

- **选项 A**：订正 README，改成「mask 字段级方向键 + 数字输入」。
- **选项 B**：保持 README 原样，等 DatePicker 开发时再定。
- **建议**：**A**。README 由 `scaffold-packages.mjs` 生成，改它要**同时改模板**
  （`--force` 才会覆盖，否则下次生成会冲回来）。本轮只改 `packages/picker/README.md`，
  **不动模板**（`registry/tools/**` 是 `CF-REGISTRY-TOOLS` 独占集），
  把模板改动留给整合会话。

### P2 · 是否需要 `GenerateConfig` 抽象

上游有它是为了同时支持 dayjs / moment / date-fns / luxon。我们只锁 dayjs
（`package.json` 的 `peerDependencies`）。

- **选项 A**：保留 `GenerateConfig`（现状）。好处：oracle 可以逐位对拍（§4.2）；
  坏处：多一层间接。
- **选项 B**：直接 `import dayjs`，函数签名收 `Dayjs`。好处：更直接；
  坏处：oracle 需要一层 shim，且「本包强绑 dayjs」这个决策被固化进每个签名。
- **建议**：**A**，理由是可对拍性（这是本包唯一能得到的强证据）。

---

## 10. 这个包**没有**证明什么

1. **没有证明面板 DOM / class 名与 antd 一致。** `buildPanelCells` 只产出**状态位**
   （§5.1 `PanelCell`），class 名的拼接在 ui 层。§3.4.3 的表格是**读源码**得来的，
   没有 L4 DOM 契约测试钉住它 —— 要等 `date-picker` 组件落地后补。
2. **没有证明 `getCellText` 在各 locale 下与 antd 一致。**
   oracle 覆盖了 `generateConfig.locale.format`，但 `cellDateFormat` 等
   **locale 数据**来自 `@apollo-design/locale`（未联调，MEMORY 未决事项 4）。
3. **没有证明区间状态机与 antd 等价。** §5.5 的三个纯判定是**按 §3.6 读源码**重写的，
   上游 `useRangeValue` 绑 React ⇒ **没有对拍**。`flushSubmit` 的时序
   （只同步一个槽位、`needTriggerChange` 的门控）**完全没有测试**。
4. **没有证明 `findValidateTime` 在真实 units 下正确。** oracle 用的是**手工构造**的
   units 数组；「units 是怎么算出来的」（`disabledTime` → units）属 ui 层，未验证。
5. **没有证明 `getWeekStartDate` 在所有 locale 下正确。**
   oracle 覆盖的 locale 集合取自测试里显式传入的字符串；`parseLocale` 的
   `localeMap`（§3.3）是**照抄的数据**，每个映射项都被覆盖，但
   「dayjs 有没有这个 locale」未在全部 73 个语言上验证。
6. **没有证明 §3.4.2 的 `-1` / `-10` 溢出格在真实面板上视觉正确** —— 那是 L6，且属 ui 层。
7. **没有做 PoC**（`pocRequired: false`），所以没有「与参考实现在千级用例上差分」的
   强度。oracle 覆盖的是**函数级**逐位比对，不是端到端。
8. ⭐ **`getWeekDay` 的 `+ firstDayOfWeek()` 在默认配置下恒等于 `+ 0`。**
   它内部强制 `.locale('en')`，而内置 `en` 的 `weekStart = 0`。
   ⇒ 变异验证里「去掉这一项」首轮**存活**（§8.2 #23）。
   我们保留它（上游有，且 `en` 被 `updateLocale` 定制后就有意义），
   但**没有任何测试能证明默认配置下它与 antd 有差别** —— 因为确实没有差别。
   这是「照抄上游」与「可证伪」之间的一处真实张力，如实记录。
9. **dayjs 的 locale 数据不是本包加载的。**
   上游 `generate/dayjs.js` 只 `extend` 插件、**不** `import` 任何 `dayjs/locale/*`；
   antd 在别处加载。所以「未加载的 locale 静默回退 en」是**上游行为**，
   我们照抄；测试里为了让它可观测，额外加载了 `zh-cn` 与 `fr`。
   「73 个语言包是不是都能被正确解析」没有被验证。
