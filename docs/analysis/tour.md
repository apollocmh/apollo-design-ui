# tour 分析（G1）

> 契约来源：antd 6.6.4 `es/tour/`（index 108 / panelRender 128 / PurePanel 55 / interface 73 / style）。
> rc 侧：`@rc-component/tour` 2.4.0（Trigger + Mask + Placeholder + TourStep）。
> **产物是判据，不是代码来源**（H2/H3）。

## 1. 结构判定：rc-tour 的薄包装 + **antd 自研 Panel**

```
antd Tour (index.js 108 行)
  └─ RCTour (@rc-component/tour)          ← 定位 / 蒙层 / 占位 / 步骤状态机
       └─ renderPanel={TourPanel}          ← **antd 自己写的面板**（panelRender.js 128 行）
```

`panelRender.js` 的注释是**上游自述的判据**：

> Due to the independent design of Panel, it will be too coupled to put in rc-tour,
> so a set of Panel logic is implemented separately in antd.

⇒ 本仓要写**两个**东西：① rc-tour 的 Vue 等价物（定位+蒙层+占位）；② antd 侧的自研 Panel。

antd `index.js` 只做六件事（逐条对齐）：
1. `prefixCls` 归一 + `useStyle`（hashId / cssVarCls）
2. `steps` 逐条补类名：`(step.type ?? type) === 'primary'` ⇒ `{p}-primary`
3. 语义化 `classNames`/`styles` 归并（`useMergeSemantic` + `resolveStyleOrClass`；
   `root` 上的 `style` 会被 `useSemanticRootStyle(style, 'mask')` **同时落到 mask**）
4. `builtinPlacements`：`getPlacements({ arrowPointAtCenter: config?.arrowPointAtCenter ?? true,
   autoAdjustOverflow: true, offset: token.marginXXS, arrowWidth: token.sizePopupArrow,
   borderRadius: token.borderRadius })`
5. `renderPanel` 固定为 `TourPanel`
6. 传给 RCTour：`animated: true`、`keyboard`（默认 `true`）、`zIndex`（`useZIndex('Tour')`）、
   `closeIcon ?? contextCloseIcon`、`rootClassName = clsx({[p-rtl]: rtl}, hashId, cssVarCls, rootClassName, ctxClassName, mergedClassNames.root, className)`

## 2. 关键 API 语义

### 2.1 `TourProps`（= `Omit<RCTourProps, 'renderPanel'|'classNames'|'styles'>` + antd 追加）

| prop | 类型 | 默认 | 备注 |
|---|---|---|---|
| `open` / `defaultOpen` | `boolean` | `false` | 受控 / 非受控 |
| `current` / `defaultCurrent` | `number` | `0` | 受控 / 非受控 |
| `onChange` | `(current) => void` | — | 步骤变化 |
| `onClose` | `(current) => void` | — | 关闭（含 ESC / 蒙层点击） |
| `onFinish` | `() => void` | — | 最后一步点「完成」 |
| `steps` | `TourStepProps[]` | — | 见 2.2 |
| `keyboard` | `boolean` | **`true`** | ← antd 显式给默认值 |
| `closeIcon` | `ReactNode` | ConfigProvider 的 `closeIcon` | |
| `closable` | `TourStepProps['closable']` | — | `false` 或 `{ closeIcon, ...aria }` |
| `mask` | `boolean \| { style?, color? }` | `true` | |
| `arrow` | `boolean \| { pointAtCenter }` | — | |
| `placement` | `PlacementType` | `bottom` | |
| `gap` | `Gap` | — | 见 rc `hooks/useTarget` |
| `animated` | `boolean \| { placeholder }` | antd 传 `true` | |
| `scrollIntoViewOptions` | `boolean \| ScrollIntoViewOptions` | — | |
| `zIndex` | `number` | `useZIndex('Tour')` | |
| `getPopupContainer` | `(node) => HTMLElement \| false` | — | |
| `disabledInteraction` | `boolean` | — | 蒙层是否拦截交互 |
| `rootClassName` / `className` / `style` | | | |
| `onPopupAlign` | `TriggerProps['onPopupAlign']` | — | 从 Trigger 透传 |
| `type` | `'default' \| 'primary'` | `'default'` | **antd 追加**；同时是 steps 的兜底 |
| `indicatorsRender` | `(current, total) => ReactNode` | — | **antd 追加** |
| `actionsRender` | `(originNode, { current, total }) => ReactNode` | — | **antd 追加** |
| `classNames` / `styles` | 12 个语义槽（见 2.4） | — | 对象**或函数**（`GenerateSemantic`） |

### 2.2 `TourStepProps`（= rc `TourStepInfo` + 面板回调 + antd 追加）

rc 侧：`arrow` / `target`（`HTMLElement | (() => HTMLElement) | null`）/ `title`（**必填**）/
`description` / `placement` / `mask` / `className` / `style` / `scrollIntoViewOptions` /
`closeIcon` / `closable`；面板回调 `onClose` / `onFinish` / `onPrev` / `onNext`；
渲染注入 `prefixCls` / `total` / `current` / `renderPanel`。

antd 追加：
- `cover?: ReactNode`
- `nextButtonProps?: { children?, onClick?, className?, style? }`
- `prevButtonProps?: 同上`
- `type?: 'default' | 'primary'`
- `classNames` / `styles`（步骤级，非函数形态）

### 2.3 语义槽（12 个）

`root` / `cover` / `close` / `mask` / `section` / `footer` / `actions` / `indicator` /
`indicators` / `header` / `title` / `description`

⚠️ `mask` 槽是**特殊**的：antd 把 `style`（顶层）与 `styles.root` 都经
`useSemanticRootStyle(..., 'mask')` 落到蒙层上 —— 4 处（ctx 的 styles.root / ctx.style /
props 的 styles.root / props.style）都参与。

### 2.4 事件与受控

`open`/`current` 各自受控；`onChange` 与 `onClose` 收 `current`；`onFinish` 无参。
面板按钮：`prevBtnClick = () => { onPrev?.(); prevButtonProps?.onClick?.(); }`，
`nextBtnClick` 在**最后一步**调 `onFinish()` 否则 `onNext()`，之后**总是**调
`nextButtonProps?.onClick?.()`。

## 3. 自研 Panel（`panelRender.js`）— DOM 与行为契约

```
.{p}-panel                                  ← 固定类，不吃语义槽
└─ .{p}-section                             (classNames.section / styles.section)
   ├─ button.{p}-close                      (classNames.close / styles.close)
   │    aria-label = locale.global.close    ← **不是** Tour locale
   │    {...pickAttrs(closable, true)}      ← closable 上的 aria-* / data-* 透传
   │    └─ closable.closeIcon ?? <CloseOutlined class="{p}-close-icon" />
   ├─ .{p}-cover        (仅 cover 可渲染时)  (classNames.cover / styles.cover)
   ├─ .{p}-header       (仅 title 可渲染时)  (classNames.header / styles.header)
   │    └─ .{p}-title                        (classNames.title / styles.title)
   ├─ .{p}-description  (仅 description 可渲染时) (classNames.description / styles.description)
   └─ .{p}-footer       (classNames.footer / styles.footer)
      ├─ .{p}-indicators (仅 total > 1)      (classNames.indicators / styles.indicators)
      │    └─ span.{p}-indicator [.{p}-indicator-active]  × total
      └─ .{p}-actions    (classNames.actions / styles.actions)
           └─ actionsRender?.(defaultActionsNode, { current, total }) ?? defaultActionsNode
```

`defaultActionsNode`（Fragment）：
- `current !== 0` 才渲染**上一步**：`<Button size="small" type="default" ghost={primary} ...prevButtonProps>`
  类名 `{p}-prev-btn {prevButtonProps.className}`，文案 `prevButtonProps.children ?? locale.Tour.Previous`
- **下一步**恒渲染：`<Button size="small" type={primary ? 'default' : 'primary'} ...nextButtonProps>`
  类名 `{p}-next-btn {nextButtonProps.className}`，
  文案 `nextButtonProps.children ?? (isLastStep ? locale.Tour.Finish : locale.Tour.Next)`

⚠️ `isLastStep = current === total - 1`；`total` 默认 **1**。
⚠️ `mergedType = stepType ?? type`（**步骤级覆盖全局**）。
⚠️ `closable` 为假值时**不渲染**关闭按钮（`closable && mergedCloseIcon`）。

## 4. PurePanel（`_InternalPanelDoNotUseOrYouWillBeFired`）

`PurePanel.js` 55 行：把 `TourStepProps` 直接喂给 `TourPanel`，并补
`prefixCls` / `current` / `total` 等注入位（debug-only，上游标 `istanbul ignore`）。
本仓按既有惯例导出为 `TourPurePanel`。

## 5. 样式要点

### 5.1 ComponentToken（`style/index.d.ts` 的 `ComponentToken`）

```ts
interface ComponentToken extends ArrowOffsetToken, ArrowToken {
  zIndexPopup: number;            // zIndexPopupBase + 70
  closeBtnSize: number;           // fontSize × lineHeight = 14 × 1.5714… = 22
  primaryPrevBtnBg: string;       // colorTextLightSolid @ 0.15 alpha
  primaryNextBtnHoverBg: string;  // colorBgTextHover 叠在 colorWhite 上的合成色
}
```

⇒ **4 个自有字段**（registry 的 `tokenCount: 4`）+ 箭头族
（`ArrowOffsetToken` / `ArrowToken`，与 tooltip / popover / dropdown 共享 —— G3 要确认本仓
既有箭头 token 的落位，避免重复声明）。

`mergeToken` 注入的**内部**值（不进 ComponentToken 面）：
`indicatorWidth: 6` / `indicatorHeight: 6` / `tourBorderRadius: borderRadiusLG`。

### 5.2 样式实现要点

- `resetComponent(token)` 打底；`position: absolute; z-index: zIndexPopup`
- 箭头复用 `style/placementArrow` + `style/roundedArrow`（与 tooltip/popover 同源）
- `genCssVar(antCls, 'tooltip')` —— **Tour 的箭头变量借用 tooltip 组**（上游如此）
- `genFocusStyle`（关闭按钮的焦点环）
- `-primary` 形态：`primaryPrevBtnBg` / `primaryNextBtnHoverBg` 两个专用色

## 6. Vue 化决策（按 COMPATIBILITY.md 映射）

| React | Vue | 依据 |
|---|---|---|
| `open` + `onChange`/`onClose` | `v-model:open` + `update:open` + `change`/`close` | C11：v-model 与语义事件**同时**发出（全仓 `update:*` 缺口 PITFALLS 162 要一并补） |
| `current` + `onChange` | `v-model:current` + `update:current` + `change` | 同上 |
| `title`/`description`/`cover` | **slot 优先**，同名 prop 收窄为 `string` 兜底 | C8-R2 |
| `nextButtonProps.children` / `prevButtonProps.children` | 同上（slot 优先） | C8-R2 |
| `indicatorsRender` | scoped slot `#indicators="{ current, total }"` | C8-R2 |
| `actionsRender` | scoped slot `#actions="{ current, total, originNode }"` | C8-R2 |
| `renderPanel` | 不公开（antd 也只用它注入自家 Panel）；`steps[].renderPanel` 亦不公开 | 上游 `Omit<..., 'renderPanel'>` |
| `closeIcon` / `steps[].closeIcon` / `closable.closeIcon` | 保留 VNode prop（程序化上下文，同 D111 的例外清单） | D111 |
| `classNames` / `styles` | 保留（含**函数形态**） | 与 modal/drawer 同判 |
| `getPopupContainer` | 保留 | 同 select/dropdown |
| `_InternalPanelDoNotUseOrYouWillBeFired` | `TourPurePanel`（`Tour._Internal*` 同时挂） | 既有惯例 |

⚠️ `steps` 是**数组 prop**（不是 slot）——与 antd 一致；步骤里的 title/description/cover
按对象形态收窄为 `string`，需要 VNode 时用 `steps[].title` 之外的通道？**待 G2 定**
（候选：保留 `steps[].title` 为 `VNodeChild`，因为它是「程序化上下文」的数据结构，
同 D111 对「对象形态子字段」的豁免）。

## 7. 实现顺序

1. `interface.ts` —— 类型面（`TourProps` / `TourStepProps` / 语义槽 / locale）
2. `panel.ts` —— 自研 Panel（纯函数式，最容易单测）
3. `Tour.ts` —— rc-tour 的 Vue 等价物：`Trigger`（复用 `_internal/trigger.ts`）
   + `Mask` + `Placeholder` + 步骤状态机 + `provide` 上下文
4. `PurePanel.ts`
5. `style/token.ts` + `style/index.ts`（从 antd 产物**机械提取**，`extract-tour-css.mjs`）
6. 七层测试 → docs → registry → build

## 8. 风险预登记（2026-09-28 当日已逐条核实）

| # | 风险 | 核实结论 |
|---|---|---|
| R1 | rc-tour 的 `getPlacements`（6 组 placement + 箭头偏移）本仓是否齐备 | ✅ **已具备**：`getPlacements` 由 `@apollo-design/position` 导出，`dropdown/Dropdown.ts:149` 已在用；本仓 Trigger 的 `builtinPlacements` 是**必填** prop（`_internal/trigger.ts:153`） |
| R2 | `Mask` 的 div 结构与 `disabledInteraction` 的交互拦截 | ⏳ 待读 rc `Mask.js`（G4 前） |
| R3 | `Placeholder`（`animated.placeholder`）的挖洞动画承载 | ⏳ 待读 rc `Placeholder.js`（G4 前） |
| R4 | 箭头 token 与 tooltip 重复声明（上游 `genCssVar(antCls,'tooltip')` 借了 tooltip 组） | ✅ **已解决**：本仓箭头 token 就是 `../../tooltip/style/token` 的 `getArrowOffsetToken` / `getArrowToken`，`dropdown/style/token.ts:12` 已是同样做法 ⇒ 照抄 |
| R5 | `onPopupAlign` 从 Trigger 透传 | ✅ **已支持**：`_internal/trigger.ts:177`（prop）+ `:325`（调用点） |
| R6 | locale 的 `Tour` 组（Next/Previous/Finish） | ✅ **已具备**：`@apollo-design/locale` 已有 `TourLocale`（`types.ts:195`）并在 locale 形态里声明 `Tour?`（`types.ts:331`）+ `index.ts` 已导出 |
| R7 | `steps[].title` 的 VNode 收窄决策（见 §6） | ⏳ G2 定，登记 COMPATIBILITY |

⚠️ 结论：**没有阻塞项**，G2/G3 可以直接开工。
