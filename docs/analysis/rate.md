# rate · G1 分析产物

> 契约来源：antd 6.6.4 `components/rate/`（壳 102 行 + style 171 行）
> + `@rc-component/rate@1.0.1`（es **380 行**：Rate 193 / Star 80 / util 39 / useRefs 12）。
> 上游是**兼容性规格**，不是代码来源。

## 1. 结构判定

内核轻（380 行，2 个组件 + 1 个纯函数），**不需要 engine/**——`Rate.ts`（壳 + 内核融合）
+ `Star.ts`（内部组件，C8-R2 豁免：replaceElement 语义 + ref 注册）。

## 2. rc 内核逐层

### Rate（193 行）

- **value**：`useControlledState(defaultValue || 0, value)` ⇒ 本仓 `useControlledValue`
  （defaultValue 0；emits 只 `update:value`，onChange/onHoverChange 是 props 形态回调）。
- **getStarValue(index, x)**：`allowHalf` 时按 `getOffsetLeft(starEle)` 与 `pageX` 判半星；
  `direction === 'rtl'` 时半星判据反向。
- **changeValue**：setValue + onChange。
- **cleanedValue**：allowClear 点同值 ⇒ 重置 0，并记录 cleanedValue（hover 判据用：
  `nextHoverValue !== cleanedValue` 才更新 hover）。
- **hover**：onHover(event, index) → hoverValue；mouseleave ⇒ hoverValue=null、
  cleanedValue=null、onHoverChange(undefined)（disabled 时不触发）。
- **keyboard**：`keyboard=true` 且非 disabled ⇒ RIGHT/LEFT 增减 step（allowHalf ⇒ 0.5），
  rtl 时 RIGHT 减 LEFT 增；`event.preventDefault()`。
- **focus/blur**（useImperativeHandle ⇒ 本仓 `expose`）：非 disabled 才触发；
  `autoFocus` 挂载即 focus。
- **DOM**：`ul.rc-rate`（tabIndex = disabled ? -1 : tabIndex；disabled 时 focus/blur/
  keydown 绑定置 null）+ `pickAttrs(rest, {aria,data,attr})` ⇒ 本仓 `pickAttrs`
  （event-name-rewrite：onKeyDown → onKeydown）。
- **类名**：`rc-rate` + className + `-disabled` + `-rtl`。
- **starNodes**：count 个 Star；Star 的 `value` = `hoverValue ?? value`；
  `key = index`。

### Star（80 行，内部组件）

- 事件：click / keydown(ENTER ⇒ onClick) / mousemove(onHover)，disabled 时全部置 null。
- **类名三态**（Set 收敛）：
  - `value===0 && index===0 && focused` ⇒ `-focused`；
  - `allowHalf && value+0.5>=starValue && value<starValue` ⇒ `-half -active`（+focused）；
  - 否则 `starValue<=value` ⇒ `-full`，否则 `-zero`；`starValue===value && focused` ⇒ `-focused`。
- **DOM**：`li.{prefix}-star` > `div[role=radio][aria-checked][aria-posinset][aria-setsize][tabIndex]`
  > `div.-first` + `div.-second`（character 各渲染两份，first 绝对定位左半 50%）。
- **characterRender**：`characterRender(start, props)` 包装（fn 形态；antd 壳用它包 Tooltip）。

### util.getOffsetLeft

getClientPosition（boundingRect - clientLeft）+ pageXOffset。本仓逐字移植（jsdom 下
getBoundingClientRect 返回 0 ⇒ 半星测试用 mock 或 0 值路径）。

## 3. antd 壳（102 行）12 件事

1. `character` 默认 `<StarFilled />`（ReactNode prop —— C8-R2：改 `#character` 插槽，默认 StarFilled）。
2. `characterRender`：**tooltips 包装** —— `tooltips[index]` 是 string ⇒ `<Tooltip title>`，
   是 TooltipProps 对象 ⇒ `<Tooltip {...props}>`（isPlainObject 判据）。
   ⚠️ antd 里用户若同时传 characterRender 会**覆盖** tooltip 包装（JSX spread 在后）——
   Vue 侧 slot 组合（先 tooltip 包内部节点，再交 #characterRender）为 INTENDED 改进，
   登记 COMPATIBILITY。
3. `useComponentConfig('rate')`：prefixCls / direction / contextClassName / contextStyle。
4. hashId/cssVarCls ⇒ 本仓静态样式 + `-css-var`。
5. mergedStyle = contextStyle + style。
6. **DisabledContext** 合并：`customDisabled ?? disabled`。
7. **useSize**：`size ?? ctx` ⇒ `-large` / `-small`。
8. tooltips: `(TooltipProps | string)[]` —— 数据 prop（豁免 C8-R2）。
9. rootClassName。
10. direction 透传 rc。
11. 其余 rest 全量转发（value/onChange/tooltips 之外的字段）。
12. displayName（dev）。

## 4. C8-R2 映射

| antd prop | Vue 侧 |
|---|---|
| `character: ReactNode \| (props)=>VNode` | `#character` 插槽（slot props = Star 渲染上下文 `{ index, value, disabled, ... }`）；默认 StarFilled。**不保留 prop** |
| `characterRender: (node, props)=>VNode` | `#characterRender` 作用域插槽 `{ node, index, value, ... }`（tooltips 包装在内部组合，见 §3.2） |
| `tooltips` | 数据 prop 保留（string / TooltipProps 对象） |
| `onChange` / `onHoverChange` / `onFocus` / `onBlur` / `onKeyDown` | props 形态回调（本仓惯例，switch/radio 同判）；v-model 走 `update:value` |

## 5. Token（6 个 ComponentToken + lineWidthFocus alias）

`prepareComponentToken`：`lineWidthFocus = lineWidthFocus===0 ? 0 : lineWidth`（alias），
`starColor = yellow6`，`starSize = controlHeight*0.625`，`starSizeSM = controlHeightSM*0.625`，
`starSizeLG = controlHeightLG*0.625`，`starHoverScale = 'scale(1.1)'`，`starBg = colorFillContent`。

## 6. 样式要点（171 行）

- `-star > div` transition + hover scale + focus-visible outline（dashed starColor，lineWidthFocus）。
- `-first`：absolute、insetInlineStart 0、width 50%、opacity 0；
  `-half` ⇒ first/second opacity 1；`-half -first`、`-full -second` ⇒ color inherit。
- `-disabled`：cursor default、hover 不缩放。`-rtl`：direction rtl。
- 根：inline-block、color starColor、fontSize starSize、lineHeight 1、listStyle none。

## 7. 测试策略

- L1/L2：状态类三态、半星（mock getBoundingClientRect）、allowClear 重置、键盘
  LEFT/RIGHT（含 allowHalf 0.5 步长）、disabled 全抑制、tooltips 包装、
  #character / #characterRender 插槽、expose focus/blur、v-model:value、
  aria（role=radio / aria-checked / aria-posinset / aria-setsize）。
- L6 视觉：basic / half / character 3 variant × 3 viewport。
