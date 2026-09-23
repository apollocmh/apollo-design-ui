# InputNumber（数字输入框）· G1–G3 分析产物

> 步骤 3 的产物先于步骤 5 存在（AGENTS.md §2）。
> 事实来源：antd 6.6.4 `es/input-number/`（index 202 + style 315 + token 19，
> 另消费 `es/input/style/token.js` 的 initComponentToken）+ 仓库源码
> `components/input-number/`（index.tsx 351 + 测试 6 份 + demo 21 组 + 文档）
> + `@rc-component/input-number@1.6.2`（es/ 824 行：InputNumber 647 + StepHandler 83
> + useCursor 67 + useFrame 18 + numberUtil 8）+ `@rc-component/mini-decimal@1.1.4`
>（506 行：BigIntDecimal 175 + numberUtil 161 + NumberDecimal 115 + MiniDecimal 49）。
>
> 依赖替换（registry 已登记）：`@rc-component/input-number` strategy=in-ui ⇒
> `packages/ui/src/input-number/engine/`（单消费者，**含 mini-decimal 等价物** ——
> H5 禁止依赖 rc-*，数值引擎一并自建）。

---

## 1. 组件一句话

数值输入框：`<input role="spinbutton">` + 上下步进按钮（hover 显隐），受控/非受控
双状态（decimalValue + inputValue），precision/formatter/parser 三层格式化，
min/max 钳制（失焦/回车才回正，键入时只标红不回弹），键盘 ↑/↓（shift=×10 步进）。

## 2. 架构与状态机（rc InputNumber.js 逐行）

```
value ?? defaultValue ──getMiniDecimal──> decimalValue（Decimal 对象，受控时不落内部态）
                              │
inputValue（input 文本）<──mergedFormatter── toString(!userTyping) / formatter(value,{userTyping,input})
                              │
collectInputValue(str)：recordCursor → inputValue=str → parse → triggerValueUpdate(decimal, userTyping=true)
                              │
triggerValueUpdate(v, userTyping)：
  键入（userTyping=true）不钳制范围（只判 isInRange 决定是否触发）
  非键入：钳到 [min,max] → precision>=0 时 toFixed（超界再 fallback 到截断位）
  → !equals(decimalValue) ⇒ onChange(getDecimalValue(stringMode, v))；非受控时 setInputValue
flushInputValue（blur / Enter）：parse 失败回退 decimalValue；受控时强制回写受控值
```

- **双状态是核心**：`decimalValue`（真实值）与 `inputValue`（显示文本）分离 ——
  键入 `1.` 不能立刻格式化成 `1`（userTyping 闸门）；受控外部 `value` 变化时，
  若 `newValue.equals(parse(inputValue))` 且在键入中则**不**重写文本。
- **precision**：`userTyping ? undefined : precision>=0 ? precision :
  max(precision(numStr), precision(step))`。
- **parser**：`parser ? parser(str) : (decimalSeparator 替换后).replace(/[^\w.-]+/g,'')`；
  无 parser 时下一帧把 `。` 替换成 `.` 重新收集（中文输入法）。
- **step**：`shift` 按下时 `getDecupleSteps(step)`（`0.1→1`、`1→10`、`1.2→12`）；
  ArrowUp/Down + `Up/Down`（旧键盘码）都拦（`keyboard=false` 关闭）；步进后 `focus()` 输入框。
- **min/max 默认**：rc 不传时 `upDisabled/downDisabled` 恒 false（`!maxDecimal` 短路）——
  即无边界；文档写的 MAX/MIN_SAFE_INTEGER 是「语义上不存在边界」。
- **onStep(info)**：`{ offset, type: 'up'|'down', emitter: 'handler'|'keyboard'|'wheel' }`。
- **wheel**：`changeOnWheel && focus` ⇒ 对 input 挂**非 passive** wheel 监听
  （preventDefault 需要），`deltaY<0` = up；React 的 onWheel 是 passive 所以必须 DOM 监听。
- **cursor 恢复**：formatter 改写文本后按 before/after 锚点恢复光标（useCursor）。
- **空值**：blur 空输入 ⇒ `onChange(null)`（issue 13896）；`-out-of-range` 类只在
  `!isInvalidate() && !isInRange()` 时出现（受控超界也标红但**不回弹**，FAQ 明说）。
- **受控**：`value !== undefined` 时内部态不落盘；`flushInputValue` 受控分支强制
  `setInputValue(decimalValue, false)` 回写显示。

## 3. DOM 契约（rc 渲染 + antd 包装类）

```
div.{p}-input-number [-mode-input|-mode-spinner] [-focused|-disabled|-readonly]
                     [-not-a-number] [-out-of-range] [-{variant}] [-lg|-sm] [-rtl]
                     [-in-form-item] [-without-controls] [-status-error|-status-warning]
                     [compact-item 类] [+className+rootClassName+semantic root]
 │（mode=spinner 时：down action 在最前，up action 在最后）
 ├─ (prefix!==undefined) div.{p}-prefix
 ├─ input.{p}-input  role="spinbutton" autoComplete="off"
 │    aria-valuemin/max = min/max 原样   aria-valuenow = invalidate?null:toString()
 │    step = step（原生 attr 透传）
 ├─ (suffix) div.{p}-suffix  > suffix + (hasFeedback && feedbackIcon)
 └─ (mode=input && controls) div.{p}-actions
      ├─ span.{p}-action.{p}-action-up [-action-up-disabled] role="button"
      │    unselectable="on" aria-label="Increase Value" aria-disabled
      └─ span.{p}-action.{p}-action-down [-action-down-disabled] …"Decrease Value"
```

- **controls**：`controls=false` ⇒ 无 actions 且根有 `-without-controls`；
  `disabled||readOnly` ⇒ mergedControls=false（antd 层）且 rc 层 `-disabled`/`-readonly`
  时 actions `display:none`；对象形态自定义 upIcon/downIcon（spinner 默认
  Plus/Minus，input 默认 Up/Down）。
- **StepHandler**：mousedown ⇒ preventDefault + onStep 一次；600ms 后每 200ms 连发；
  mouseup/mouseleave 停（raf 包一层，防 Safari 事件乱序）；点击非 input 区域 ⇒
  focus input + preventDefault（mousedown 落在根上）。
- **antd 包装层**：`addonBefore/addonAfter`（deprecated）⇒ 根升为 `Compact` 包裹，
  addon 用 `SpaceAddon`（`{p}-input-number-addon` 类）+ ContextIsolator(form)；
  此时 rootClassName 不落在 InputNumber 根而是 Compact 上。
- **status**：`getMergedStatus(formContext.status, props.status)` ⇒ `-status-*` 类；
  `hasFeedback` ⇒ suffix 追加 feedbackIcon（form 未落地 ⇒ 本轮 context 恒默认）。
- **size**：`customizeSize ?? compactSize ?? useSize(ctx)` ⇒ `-lg/-sm`。
- attrs 透传：rc 把 `restProps` 全部落到 **input** 上（`type="number"` 由此而来）。

## 4. Props / Events（antd 文档 + d.ts 全量）

props：`autoFocus`、`changeOnBlur(true)`、`changeOnWheel(false)`、`className/rootClassName`、
`classNames/styles`（语义五键 root/prefix/suffix/input/actions，支持函数式）、
`controls(true|{upIcon,downIcon})`、`decimalSeparator`、`defaultValue/value`、
`disabled`、`formatter(value,{userTyping,input})`、`keyboard(true)`、`max/min`、
`mode('input'|'spinner')`、`parser`、`placeholder`、`precision`、`prefix/suffix`、
`readOnly`、`size`、`status('error'|'warning')`、`step(1)`、`stringMode(false)`、
`variant('outlined')`、deprecated：`addonBefore/addonAfter`（→Space.Compact）、
`bordered`（→variant）。
events：`onChange(value: number|string|null)`、`onPressEnter(e)`、
`onStep(value, info)`、`onInput(str)`（rc 透传，文档未列）。
ref：`focus({preventScroll, cursor:'start'|'end'|'all'})`、`blur()`、`nativeElement`。

## 5. 样式契约（9 个 Component Token + input 基础 token）

| Token | 值 |
|---|---|
| controlWidth | `90`（固定） |
| handleWidth | `controlHeightSM - lineWidth*2` |
| handleFontSize | `fontSize / 2` |
| handleVisible | `'auto'`（true ⇒ handleOpacity=1 / handleVisibleWidth=handleWidth） |
| handleActiveBg | `colorFillAlter` |
| handleBg | `colorBgContainer` |
| filledHandleBg | `FastColor(colorFillSecondary).onBackground(colorBgContainer)` |
| handleHoverColor | `colorPrimary` |
| handleBorderColor | `colorBorder` |

派生：`handleOpacity = handleVisible===true ? 1 : 0`、`handleVisibleWidth =
handleVisible===true ? handleWidth : 0`（unitless: handleOpacity）。
基础（input initComponentToken）：`paddingBlock = round((controlHeight -
fontSize*lineHeight)/2*10)/10 - lineWidth`（SM/LG 同式；LG 用 ceil + lineHeightLG）、
`paddingInline = paddingSM - lineWidth`、`paddingInlineSM/LG = controlPaddingHorizontal(SM) - lineWidth`、
`inputFontSize(SM/LG)`、`inputAffixPadding = paddingXXS`。

五段样式：Base（inline-flex、width:controlWidth、resetComponent+genBasicInputStyle、
四 variant、`-out-of-range` input 红、placeholder、webkit spinner 去除、
`&:hover -handler-wrap`） / Action（bold、hover 变 handleHoverColor、active 变
handleActiveBg、hover 高度 50%→60%） / mode-input（actions 绝对定位 inset-block-start:0
inset-inline-end:0、width=handleVisibleWidth、opacity=handleOpacity、action flex:auto
height 40%、`&:hover/-focused -actions` 展开；disabled/readonly display:none）/ 
mode-spinner（width auto、up 左 border、down 右 border、input 居中）/ Size（lg/sm 的
padding var + fontSize）+ Pre/Suffix（marginInline affixPadding、hover 非
without-controls 时 suffix marginInlineEnd=handleWidth）+ `-addon`（`:has(select)`
去边框）+ compact-item。

cssinjs 注意（CHECKLIST #71 同族）：`-action` 的规则嵌在 `${componentCls}` 下 ⇒
展平后是**后代选择器**；`&-mode-input` 是复合。genCssVar('input-number') 的
`input-padding-block/inline` 是组件根上的 CSS 变量（size/borderless 只改变量值）。

## 6. Vue API 设计（INTENDED）

| # | 差异 | 分类 |
|---|---|---|
| I1 | `value+onChange` ⇒ `v-model:value`（`update:value`）**与** `change` emit 同时发（C11） | INTENDED |
| I2 | `onPressEnter` ⇒ `press-enter` emit；`onStep` ⇒ `step` emit；`onInput` 不暴露（文档未列，rc 内部） | INTENDED |
| I3 | `ref` ⇒ `expose({ focus, blur, nativeElement })`（proxyObject 语义：focus 传 option） | INTENDED |
| I4 | `prefix/suffix/addonBefore/addonAfter/controls.upIcon/downIcon` ⇒ `VNodeChild` prop（D42：组件对象 normalizeNode 渲染） | PLATFORM |
| I5 | engine 自建：`engine/decimal.ts`（BigIntDecimal 等价，无 BigInt 环境 fallback NumberDecimal）+ `engine/number-util.ts` + `engine/use-cursor.ts` + `engine/StepHandler.ts`；**不复制源码，按行为规格重写**（H2/H3） | — |
| I6 | `form/context`（FormItemInputContext）与 `form/hooks/useVariants` 落**最小叶子模块**（form 组件本体未到，empty→config-provider 先例） | — |
| I7 | `ContextIsolator(form)` 不复刻：本仓 Compact 不含 form 上下文注入，addon 场景无隔离需求 | INTENDED |
| I8 | `getMergedStatus` 不复用 space/statusUtils（那边只落了 getStatusClassNames）——合并逻辑一行（`props.status ?? ctx.status`），写在 form/context 叶子内 | — |
| I9 | `_InternalPanelDoNotUseOrYouWillBeFired`（PureInputNumber）**暂不导出**：它靠 ConfigProvider 组件级 token（handleVisible=true）实现，本仓静态 CSS 无运行时主题覆盖面 —— 等 ConfigProvider token 覆盖落地后补（INTENDED 登记进 COMPATIBILITY） | INTENDED |
| I10 | wheel 监听挂 `onMounted/集中 effect`，`{ passive:false }`；SSR 不订阅 | — |

## 7. 测试策略

- L1：空输入 blur ⇒ change(null)；onStep（handler/keyboard/wheel 三 emitter、
  shift ×10、步进后 focus）；受控超界不回弹但 `-out-of-range`；键入 `1.` 不被
  立即格式化；formatter/parser/precision/stringMode；min/max 钳制（键入不回弹、
  blur 回正、toFixed 四舍五入双向）；controls 三形态；mode=spinner 图标与顺序；
  deprecated×3 告警；changeOnWheel/changeOnBlur；cursor 恢复（formatter 场景）。
- L4（SSR 契约）：basic / controls=false（-without-controls）/ spinner / prefix+suffix /
  size-lg+sm / variant 四形态 / status / rtl / 受控 aria-valuenow / disabled。
- L3：props 面负例（step 非法、precision<0 类型、controls 对象多余键）。
- L5：role=spinbutton + aria-valuemin/max/now、action 的 role=button +
  aria-label（Increase/Decrease Value）+ aria-disabled、disabled 键盘吞、axe 全 demo。
- L6：variant×status×size 组合基线。
- L7：theme 链 + token 声明（9 个 + handleOpacity unitless）。
