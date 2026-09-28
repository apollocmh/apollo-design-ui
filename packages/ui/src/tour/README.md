# Tour 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 `es/tour/`（薄壳 index.js 108 行 + 自研 Panel panelRender.js 128 行 + PurePanel 55 行）
- 内核参照：@rc-component/tour 2.4.0（Trigger + Mask + Placeholder + 步骤状态机；源码缓存 /tmp/rc-tour-src）
- 分析产物：`docs/analysis/tour.md`（§9 V1–V8 是 G4 前置核实的源码级判据）
- 依赖的已收口能力：`Trigger`（_internal）、`@apollo-design/position#getPlacements`、`@apollo-design/portal`（Portal autoLock/onEsc/scrollLocker + useZIndex）、`Button`、`locale.global` + `locale.Tour`、`icons.CloseOutlined`
- 样式：60 条规则机械提取（`tests/visual/debug/extract-tour-css.mjs`），4 个自有 Component Token + 箭头族复用 tooltip

## 2. 与 antd 的行为差异清单（同步 COMPATIBILITY.md §9）

| # | 差异 | 分类 | 说明 |
| --- | --- | --- | --- |
| 1 | `open`/`current` 走 `v-model` + 语义事件（change/close/finish）同发 | INTENDED | C11；`onClose`/`onFinish`/`onChange` 不作为 props |
| 2 | `title`/`description`/`cover`/按钮文案：slot 优先、prop 收窄 string | INTENDED | C8-R2；`cover` 的 img 内容走 `#cover` slot |
| 3 | `indicatorsRender`/`actionsRender` → `#indicators`/`#actions` scoped slot | INTENDED | C8-R2 |
| 4 | `renderPanel`（Tour 与 steps 级）不公开 | 同上游 | antd 已 `Omit`；面板固定为本仓 TourPanel |
| 5 | `closeIcon`（含 steps/closable 级）保留 VNode prop | INTENDED | D111 例外清单（程序化上下文） |
| 6 | rc 的 `getPopupContainer === false`（inline 模式，Mask/Placeholder absolute 定位）不实现 | INTENDED | antd 公开类型也未暴露；v1 不做 |
| 7 | `PurePanel` 的 `total` 默认 6 | 同上游 | antd `PurePanel.js` 怪值逐字保留 |
| 8 | `open` 未传时默认打开（`internalOpen ?? true`） | 同上游 | rc 源码判据（§9-V6），antd 文档口径为 false —— UPSTREAM 文档 vs 源码以源码为准 |
| 9 | `className`/`style` 落在占位元素（Placeholder）而非浮层根 | 同上游 | rc-tour 协议；`style` 另经 useSemanticRootStyle 双落到 mask |
| 10 | PurePanel 的 closable 合并用 `_internal/use-closable`（antd _util 语义）而非 rc 双层版 | 同上游 | 两套 useClosable 在上游就不同源（Tour.ts 内联 rc 版） |

## 3. .vue / .ts 选择

- 主实现 `Tour.ts`（defineComponent + h）：组装 Trigger + Mask + Placeholder 三棵 VNode 子树，状态机（受控合并、hasOpened 渲染门、posInfo 更新）在渲染函数里表达最直接；与 tooltip / drawer / segmented 同范式。
- `panel.ts` 同为 .ts：antd 的 TourPanel 本就是纯渲染函数，保持同构便于 L1 直测。

## 4. Component Token 清单（4 个自有 + 箭头族）

- `zIndexPopup = zIndexPopupBase + 70`（默认 1070；CSS 无单位）
- `closeBtnSize = fontSize × lineHeight`（22px）
- `primaryPrevBtnBg = colorTextLightSolid @ 0.15`（rgba(255,255,255,0.15)）
- `primaryNextBtnHoverBg = colorBgTextHover 合成到 colorWhite`（rgb(240,240,240)，FastColor onBackground 公式）
- 箭头族（arrowOffset* / arrowShadowWidth / arrowPath / arrowPolygon）：复用 `tooltip/style/token`，不重复推导（与 dropdown 同判）
- 内部 token（mergeToken，不进公开面）：indicatorWidth 6 / indicatorHeight 6 / tourBorderRadius = borderRadiusLG

## 5. 实现要点（最容易写错的判据）

1. **rc-tour 确实用 rc-trigger**：触发元素是 Placeholder（Portal div，fixed 定位在 posInfo，pointer-events:none；无 target 时 1×1 居中占位）。本仓 Trigger 对齐 slot 首个 vnode，Placeholder 作为其 child。
2. **Mask 是独立 Portal + SVG 挖洞**（白底 rect + mask 黑洞 + 4 个 transparent cover rect 拦交互）；`pointerEvents = pos && !disabledInteraction ? 'none' : 'auto'`。
3. **`center` 不是 placement 条目**：是 getPlacement 的兜底值（`step ?? global ?? (无target ? 'center' : 'bottom')`）；查表落空 ⇒ 空 align ⇒ position 包 splitPoints 兜底 'c' ⇒ 居中（双方 getAlignPoint 源码对拍过）。
4. **无 target 时箭头恒 false**；有 target 时 antd 在 arrowPointAtCenter/current 变化后 `forceAlign()`（Trigger expose 已有）。
5. **closable 三层合并**（rc useClosable）：`false`（或 closeIcon===false 且无对象图标）⇒ null（不渲染 + Esc 禁用）；step 层不补默认（preset=false）、root 层补（preset=true）；step 非 'empty' 则整段覆盖 root。**永远不会输出 boolean true** —— 布尔在输入面已折叠。
6. **antd 恒传 `animated: true`**；`-placeholder-animated` 类判据是 `typeof animated === 'object' ? animated.placeholder : animated`。
7. **Esc 条件是 `keyboard && mergedClosable !== null`**，走 Mask 的 Portal onEsc（不判 top —— 上游 Mask 的 Portal 是唯一带 onEsc 的栈项）；←/→ 是 window 级 keydown + isEditableTarget 守卫。
8. **重开归零是静默 set**：rc useControlledState 的 setter 不触发 onChange —— 不能用 useControlledValue（它的 setValue 恒走 onChange），手写 ref + watch 同步。
9. **`mask = true` 是 rc 解构默认值**；`total = 1` 是面板解构默认。
10. **steps 逐条补 `-primary`**（`(step.type ?? type) === 'primary'`）拼进 className → 随 popupClassName 落浮层根。

## 6. 已知缺口

- rc 的 inline 模式（`getPopupContainer === false`）不实现（差异 #6）。
- G9 视觉基线 / G10 compat 机械基线待跑（demo 已就绪 9 个）。
- axe demo 扫描已接入 a11y.test.ts（expectCount=9）。

## 7. demo 替换登记

- `gap.vue`：antd 用 `Slider`（未落地）⇒ 原生 `input[type=range]` 等价替换；Row/Col/Typography 已落地照用。
- `style-class.vue`：antd 的 `createStaticStyles(css\`\`)`（antd-style 产物）⇒ 等价普通对象。
- `basic/mask/non-modal/style-class.vue`：antd 第三步的 `EllipsisOutlined` 图标按钮在本 demo 用文本「...」占位（图标组件可作为 `icon` prop 传入，见 basic.vue 的写法——保留 icon 传法的 demo 一份即可，其余用文本避免视觉基线的图标基线差异）。
