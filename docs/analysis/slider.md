# slider 分析（G1）

> 契约来源：antd 6.6.4 `es/slider/`（index.js 232 + SliderTooltip.js 42 + Context.js 3 +
> style/index.js 337）+ rc 内核 `@rc-component/slider@1.1.1`（es 侧 3344 行）。
> ⚠️ rc 包**只读不依赖**（H5）：本文的每条判据都从 `node_modules/.pnpm/@rc-component+slider@1.1.1/…/es/`
> 与 antd 产物逐行读出，不凭记忆（AGENTS §5.0）。
> 分析日期：2026-09-29。**G1 产物必须先于实现存在**（AGENTS §2）。

---

## 1. 结构判定：**antd 薄壳 + rc 内核（无自研中间层）**

```
antd Slider（index.js 232 行）
  ├─ useOrientation(orientation, vertical)       → vertical 归一（orientation 是新写法）
  ├─ useMergeSemantic                            → classNames/styles 5 槽
  ├─ SliderInternalContext（Context.js）          → handleRender 的注入通道（antd 内部用）
  ├─ SliderTooltip（SliderTooltip.js 42 行）      → 给 rc 的 Tooltip 换成 antd 的（带 value 上下文）
  └─ RcSlider（@rc-component/slider）             → **全部行为在这里**
```

与 tour 的「antd 自研 Panel」不同：slider 在 antd 侧**没有自研子组件**，薄壳只做
①vertical/orientation 归一 ②语义合并 ③tooltip 包装 ④RTL 下 reverse 取反 ⑤deprecated 告警。
⇒ 本仓要写的是 **rc-slider 的 Vue 等价物**（≈3344 行 ES 的内核 + 232 行壳）。

rc 内核文件与职责（es 侧行数）：

| 文件 | 行数 | 职责 |
|---|---:|---|
| `Slider.js` | 453 | 状态机：range/step/marks/push/disabled/值域归一/事件与 ref |
| `hooks/useOffset.js` | 282 | **几何与量化**（formatValue / offsetValues / 禁用边界 / pushable 回推） |
| `hooks/useDrag.js` | 219 | 拖拽（pointer 事件、按方向反算、range 的整轨拖拽） |
| `Handles/Handle.js` | 173 | 单个把手：位置 style + **键盘表** + ARIA 全套 |
| `Handles/index.js` | 94 | 把手列表 + 缓存值 + 焦点管理（focus/hideHelp） |
| `Tracks/index.js` + `Track.js` | 78 + 66 | 已选轨道（included / startPoint / 可拖整轨） |
| `Steps/index.js` + `Dot.js` | 44 + 40 | 刻度点（dots / marks 对齐 / 状态态） |
| `Marks/index.js` + `Mark.js` | 28 + 40 | 文字标记（点击改值） |
| `hooks/useRange.js` / `useDisabled.js` / `context.js` / `util.js` | 18/16/16/30 | 小工具 |

---

## 2. 关键 API 语义

### 2.1 `SliderProps`（= `Omit<RcSliderProps,'classNames'|'styles'>` + 语义槽）

壳自身**只加** `classNames` / `styles`（antd 的语义槽形态），其余全部来自 rc：

| 组 | props |
|---|---|
| 值域 | `min`(0) `max`(100) `step`(1，`null` = 只按 marks 走) `value` `defaultValue` `range` `count` |
| 行为 | `reverse` `vertical` `orientation` `included`(true) `allowCross`(true) `pushable`(false) `keyboard`(true) `disabled`(`boolean｜boolean[]`) `autoFocus` `tabIndex`(0) |
| 装饰 | `marks` `dots` `startPoint` |
| 语义槽 | `classNames.{root,tracks,track,rail,handle}` / `styles.{…}` |
| 事件 | `onChange` `onBeforeChange` `onAfterChange`(deprecated) `onChangeComplete` `onFocus` `onBlur` |
| 定制 | `tooltip`(SliderTooltipProps) `handleRender` `track`(`false` 关轨道) |
| a11y | `ariaLabelForHandle` `ariaLabelledByForHandle` `ariaRequired` `ariaValueTextFormatterForHandle`（后三者**可传数组**，按把手索引取） |
| 已废弃 | `handleStyle` `trackStyle` `railStyle`（改走 `styles.*`）、`tooltipPrefixCls` / `getTooltipPopupContainer` / `tipFormatter` / `tooltipPlacement` / `tooltipVisible`（改走 `tooltip.*`） |

### 2.2 `SliderRef`（rc 的 expose，仅两个方法）

```ts
{ focus: () => void;   // → handles.focus(0)
  blur: () => void }   // → 若 activeElement 在容器内则 blur
```

### 2.3 语义槽 5 个

`root` / `tracks`（轨道容器，range 时是多个）/ `track`（每条已选段）/ `rail`（底轨）/
`handle`（把手）—— 类名与 style 都逐节点落 DOM（`Slider.js` 的 render 段逐字）。

### 2.4 事件链（判据：**顺序与时机**）

```
onBeforeChange(拖动/键盘开始前的值)   ← 仅 onStartMove / 点击改值 / 键盘改值
onChange(下一次值)                    ← triggerChange：排序后与当前值 !isEqual 才发
onChangeComplete(最终值)              ← finishChange：拖拽结束 / 键盘 keyup / 点击（无 e 分支）
```

⚠️ 三个易错点：
1. `onChange` 单值模式发 **number**、range 模式发 **number[]**（`getTriggerValue`）；
2. `triggerChange` **先排序再比较**（`[...next].sort()`），乱序输入不会漏发；
3. `onBeforeChange` 的载荷是**新值**（`changeToCloseValue` 里是 `nextValue`，拖拽开始路径里才是当前值），
   且**三条路径都发**（拖拽开始 / 点击 / 键盘）。点击 mark 走的是「无 `e`」分支：**不开始拖拽**、
   同步发 `onChangeComplete`，其余一致 —— ⚠️ G5 实测确认（最初的推断「mark 不发 beforeChange」是错的）。

---

## 3. 值域状态机（`Slider.js` 判据）

### 3.1 range → 五个开关（`useRange`）

| `range` | rangeEnabled | rangeEditable | rangeDraggableTrack | minCount | maxCount |
|---|---|---|---|---|---|
| `true` / 未传 | `!!range` | false | false | 0 | undefined |
| `{editable:true, …}` | true | true | false | `minCount ?? 0` | `maxCount` |
| `{draggableTrack:true}` | true | false | `!editable && draggableTrack` | 同上 | 同上 |

⚠️ `editable` 与 `draggableTrack` 同时给会告警，且 **draggableTrack 被置 false**。
⚠️ `editable` 与 `step === null` 组合：`draggableTrack` 也会被强制 false（另一条告警）。

### 3.2 值归一（`rawValues`）

```
value 为 null ⇒ []（空把手）
value 是数组 ⇒ **只有 `count` 给了、或 value 是 undefined 时**才截断/补齐：
              取前 count+1 个，不足用最后一个值补齐；最后统一 sort 升序
每个值过 formatValue（见 §4.1）
```
⇒ ⚠️ G5 实测：受控传 `{ range: true, value: [50] }` **只有 1 个把手**（rc 的判据是
`if (count || mergedValue === undefined)`）；`{ range: true }` 未传 value 才补到 2 个；
传 `[]` 则一个把手都不渲染。

### 3.3 disabled 两态（`useDisabled`）

```
rawDisabled 是 boolean ⇒ [isHandleDisabled 恒该值, disabled 恒该值]
rawDisabled 是数组     ⇒ disabled = 全部把手都禁用；hasDisabledHandle = 任一禁用
```
⚠️ `effectiveRangeEditable = rangeEditable && !hasDisabledHandle` —— 只要有把手禁用，
「可增删节点」整体关闭。

### 3.4 direction 四值（`util.getDirectionStyle` + 键盘表共用）

```
vertical ? (reverse ? 'ttb' : 'btt') : (reverse ? 'rtl' : 'ltr')
```
⚠️ antd 壳在 **RTL 方向且非 vertical** 时把 `reverse` 取反（`restProps.reverse = !restProps.reverse`），
所以「RTL 页面里的水平 slider」视觉上是反向的。这条在 Vue 侧要照做（否则 RTL 下方向错）。

### 3.5 marks 归一（**过滤 + 排序**）

```
marks 的 value 可以是 number / {label, style} 对象 / ReactNode
过滤掉 label 为 falsy 且非 number 的项（label === 0 保留）
按 value 升序排序
```
⚠️ key 是字符串 → `Number(key)`（`'0'` ⇒ 0）；label 为 `0` 必须渲染。

---

## 4. 几何与量化（`useOffset.js`）

### 4.1 `formatValue(value)`

```
clamp 到 [min,max] → 按 step 取整（step===null 时跳过）→ 再按 marks 吸附
```
marks 吸附的判据（源码注释「Format value align with step & marks」）：
在**相邻两个 mark 之间**取出该区间内的 step 对齐值集合（含两端 mark），
再把 value 吸附到最近的候选。⇒ step 与 marks 同时存在时，值落在 mark 上而不是步长网格上。

### 4.2 `offsetValues(values, offset, valueIndex)`

`offset` 三形态（**与 Handle 键盘表一一对应**，见 §5）：
- `'min'` / `'max'` ⇒ 直接取边界；
- 数字 ⇒ **移动 n 个「候选步」**（候选集合 = §4.1 的 step∪marks 网格），不是 ±n×step；
- 返回 `{ value, values }`（新值与新数组，顺序已保证）。

禁用把手的边界：`getDisabledBoundaryValues` 把**禁用的把手当作固定锚点**，
启用把手最多靠到 `锚点 ± pushGap`。

`pushable` 回推（源码尾部两段 for 循环，**顺序不可颠倒**）：
1. 先按「End → Start」把右侧把手往右推（保持与左邻居的最小间距）；
2. 再按「Start → End」把左侧把手往左推，并各自夹到禁用边界内。

⚠️ 这是全组件最容易写错的一段：`pushable === true` 时 `mergedPush = mergedStep`
（`step === null` 时 pushable 退化为 `false`）；`pushable` 是数字时直接用它当间距。

### 4.3 `getClosestEnabledHandleIndex(values, newValue, min, max, pushable, isHandleDisabled)`

点击/拖轨道时决定「这次改哪个把手 / 是否插新节点」，返回 `-1` 表示不可改。

---

## 5. 键盘表（`Handles/Handle.js`，**逐字**）

| 键 | offset | 备注 |
|---|---|---|
| ← / → | `direction ∈ {ltr,btt} ? ∓1 : ±1` | 左减右加（反向/纵向时翻号） |
| ↑ | `direction !== 'ttb' ? +1 : -1` | **Up is plus**（纵向 ttb 时反过来） |
| ↓ | `direction !== 'ttb' ? -1 : +1` | |
| Home / End | `'min'` / `'max'` | |
| PageUp / PageDown | `+2` / `-2` | 单位是「候选步」，不是 2×step |
| Backspace / Delete | —— | 调 `onDelete(index)`（rangeEditable 时才有） |

- `preventDefault` **仅在有 offset 时**调用；
- **keyup** 才发 `onChangeComplete`（移动类按键）—— 拖键盘连续按键不应每帧都 complete；
- 键盘改值后要把焦点移到**新值所在索引**（`useEffect` 里 `indexOf(nextValue)`，找不到则不动）；
- 把手键盘可用的前提：`!mergedDisabled && keyboard`。

---

## 6. 拖拽与点击（`useDrag.js` + `Slider.js`）

- 指针事件：`mousedown/mousemove/mouseup` + `touchstart/touchmove/touchend`（`useDrag` 内）；
- 坐标反算（`onSliderMouseDown`）：
  `ltr → (clientX-left)/width`、`rtl → (right-clientX)/width`、
  `btt → (bottom-clientY)/height`、`ttb → (clientY-top)/height`；
  `percent` → `min + percent*(max-min)` → `formatValue` → `changeToCloseValue`；
- `e.preventDefault()` 在 mousedown 最前面（防文字选择）；
- 拖拽结束（`useDrag` 的 finish）⇒ `handlesRef.hideHelp()` + `finishChange(draggingDelete)`；
- **拖拽删除**（rangeEditable）：把手被拖到邻居另一侧且超过阈值 ⇒ 删除该节点，
  焦点移到 `max(0, index-1)`；
- `dragging` / `draggingDelete` 两个状态会落到把手类名
  （`-dragging` / `-dragging-delete`），antd 壳另外用 `dragging` 给**根**加 `-lock` 类。

---

## 7. tooltip（三态 open，`Slider.js` + `SliderTooltip.js`）

```
lockOpen  = tooltip.open            // 显式 false ⇒ 永不显示
activeOpen = (hoverOpen || focusOpen) && lockOpen !== false
```
- `open = (!!lockOpen || activeOpen) && mergedTipFormatter !== null`；
- `formatter`：`null` ⇒ **不显示 tooltip 内容**（`formatter === null` 时恒不开）；
  未传 ⇒ 默认 `val => isNumber(val) ? val.toString() : ''`；
- 事件：把手 `mouseenter → hoverOpen=true`、`mouseleave → false`；
  `mousedown → focusOpen=true + dragging=true`；`focus → true`；`blur → false`；
  **document 级 mouseup** 延迟 1 帧把 `focusOpen` 置 false（点一下即可隐藏）；
- range 且 `!lockOpen` ⇒ **activeTooltipHandle 模式**：所有把手隐藏自己的 tooltip，
  改由 rc 的 `activeHandleRender` 渲染**一个跟随当前把手**的 tooltip
  （隐藏把手仍是原 DOM + `visibility:hidden` 克隆）；
- placement 默认：横向 `top`；纵向 `isRTL ? 'left' : 'right'`；
- 类名：tooltip 的 `classNames.root = '${sliderPrefixCls}-tooltip'`；
- `getPopupContainer` 落到 antd 的 Tooltip（fallback：ConfigProvider 的 `getPopupContainer`）。

---

## 8. DOM 与类名（`Slider.js` 的 render 段 + `Handles/Handle.js`）

```
div.{p}[-disabled][-vertical|-horizontal][-with-marks](+ rtl/lock 由 antd 壳加)   ← 根，onMousedown=改值
├─ div.{p}-rail                                    （styles.rail / railStyle）
├─ Tracks → div.{p}-tracks > div.{p}-track         （included / startPoint / 可拖整轨）
├─ Steps  → div.{p}-step > div.{p}-dot[-active][-reverse]   （dots / marks）
├─ Handles → div.{p}-handle[-{i+1}][-dragging][-dragging-delete][-disabled]
│              （style 位置 + role=slider + aria-* 全套）
└─ Marks  → div.{p}-mark > span.{p}-mark-text[-active]
               ⚠️ G4 按 **rc 源码**修正：只有 `-mark` > `-mark-text` 两层，
               **没有** `-mark-wrapper` / `-mark-text-label`（那是 antd 早期版本的形态）
```
- `-with-marks` 只在 `markList.length` 为真时加；
- `-handle-{i+1}` 只在 **range** 模式加（单把手没有序号类）；
- 轨道 `track !== false` 才渲染；`rail` 恒渲染。

---

## 9. ComponentToken（18 个，`prepareComponentToken` 逐字）

| token | 派生 |
|---|---|
| `controlSize` | `controlHeightLG / 4`（40/4 = **10**） |
| `handleSize` | = `controlSize` |
| `handleSizeHover` | `controlHeightSM / 2`（24/2 = **12**） |
| `railSize` | `4` |
| `dotSize` | `8` |
| `handleLineWidth` | `lineWidth + 1` |
| `handleLineWidthHover` | `lineWidth + 1.5` |
| `railBg` / `railHoverBg` | `colorFillTertiary` / `colorFillSecondary` |
| `trackBg` / `trackHoverBg` | `colorPrimaryBorder` / `colorPrimaryBorderHover` |
| `handleColor` / `handleActiveColor` | `colorPrimaryBorder` / `colorPrimary` |
| `handleActiveOutlineColor` | `FastColor(colorPrimary).setA(0.2)` |
| `handleColorDisabled` | `FastColor(colorTextDisabled).onBackground(colorBgContainer).toHexString()` |
| `dotBorderColor` / `dotActiveBorderColor` | `colorBorderSecondary` / `colorPrimaryBorder` |
| `trackBgDisabled` | `colorBgContainerDisabled` |

⚠️ 两处构建期算式需要本仓自己实现：
- `handleActiveOutlineColor`：`setA(0.2)` —— theme 的 `Color` 有 alpha 合成路径可走；
- `handleColorDisabled`：**`onBackground`** —— 本仓 `Color` **没有** `onBackground`
  （只有 `mix`，语义不同）⇒ 按 tour 的先例在 token.ts 内实现 FastColor 的合成公式
  `alpha = fg.a + bg.a×(1−fg.a)`（tour 的 `primaryPrevBtnBg` 同判）。
另外样式侧还有一个**派生 token**（不在 prepareComponentToken 里）：
`marginPart = (controlHeight − controlSize) / 2`，被 rail/handle 的居中规则消费。

---

## 10. Vue 化决策（按 COMPATIBILITY.md 映射）

| React | Vue | 分类 |
|---|---|---|
| `value` + `onChange` | `v-model:value`（同时发 `update:value` 与 `change`，规则 C11） | INTENDED |
| `onChangeComplete` / `onBeforeChange` | `changeComplete` / `beforeChange` emits | INTENDED |
| `onFocus` / `onBlur` | `focus` / `blur` emits（原生事件经 `$attrs` 透传的规则要让位给「必须带 index 参数」） | INTENDED |
| `handleRender` / `activeHandleRender` | **scoped slot**（`#handle` / `#activeHandle`，槽参数 `{index, value, dragging, draggingDelete, prefixCls}`） | INTENDED（C8） |
| `SliderRef`（focus/blur） | `expose({ focus, blur })` | INTENDED |
| `marks` 的 value 是 ReactNode | `VNodeChild` | PLATFORM |
| `SliderInternalContext` | `provide/inject`（antd 内部给 `icon-slider` demo 用） | INTENDED |
| `Vertical`/`orientation` 双写法 | 同上游（`orientation` 优先，`vertical` 仍接受 + 告警） | 同上游 |

⚠️ `disabled` 的数组形态在 Vue 的 Boolean prop 下会踩到转换坑（PITFALLS 2）：
`type: [Boolean, Array]` + `default: false` 要显式声明。

---

## 11. 风险预登记（G4 动手前逐条核实）

| # | 风险 | 处置 |
|---|---|---|
| R1 | rc-slider 是 **3344 行**内核，Vue 化后行数只会更多 ⇒ 必须拆文件（Slider.vue + Handles/Tracks/Steps/Marks/hooks） | G4 按 §1 的文件表落地 |
| R2 | Tooltip 依赖：`SliderTooltip` 要包 antd 的 Tooltip（本仓 `tooltip` 已收口） | 复用 `tooltip` 组件；`value` 上下文要经 context 传（槽参数） |
| R3 | `useDrag` 的指针事件在 jsdom 不可测 ⇒ L2 只能用「合成事件 + mock getBoundingClientRect」 | 对齐 tree-select 的拖拽测试手法（`trigger` + 手写 rect） |
| R4 | `onBackground`（`handleColorDisabled`）与 `setA` 的构建期算式 | token.ts 内自实现（tour 先例），并 L7 断言判定值 |
| R5 | 拖拽依赖真实布局（`getBoundingClientRect`）⇒ L6 视觉只能钉**静态**形态；拖拽中的帧不进像素比对 | matrix 的 `LIMITATIONS` 登记（同其他组件） |
| R6 | `orientation` 是新 API（antd 6），`vertical` 是旧写法 ⇒ 两套都要支持并告警 | interface.ts 双 prop + L2 告警断言 |
| R7 | W4 波次里 slider 与 mentions/color-picker **同批**，都碰 `COMPONENT_STYLES`（CF-STYLE-GLOBAL 的兄弟） | 只追加自己的行，按字母序 |

---

## 12. 不做什么（明确边界）

- 不实现 rc 的 `SliderTooltip` 里的 `value` 上下文以外的东西（eg. `draggingDelete` 透传照做）；
- 不引 `@rc-component/*`（H5）；不引 cssinjs（H6）；
- 不做 antd **未导出**的 rc 内部 API（`SliderInternalContext` 只按 antd 的用法落 provide/inject）；
- `react` 专属的 `React.isValidElement` 判据 → 用 `isVNode`。
