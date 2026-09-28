# Popconfirm 实现说明

## 1. 契约来源

- 薄壳：antd 6.6.4 `components/popconfirm/index.tsx`（208 行）+ `PurePanel.tsx`（148 行）
- 依赖的已收口能力：`Popover`（开合/portal/motion/trigger 全协议）、`Button`、`locale.Popconfirm`、`icons.ExclamationCircleFilled`
- 样式：`es/popconfirm/style/index.js`（`genStyleHooks(..., { resetStyle: false })`，1 个 Component Token）
- DOM 基线：`tests/compat/baselines/popconfirm.dom.json`（14 用例，机械 oracle）

## 2. 与 antd 的行为差异清单（同步 COMPATIBILITY.md §9）

| # | 差异 | 分类 | 说明 |
| --- | --- | --- | --- |
| 1 | `onConfirm` / `onCancel` / `onOpenChange` / `onPopupClick` 走 attrs 不进 emits | INTENDED | PITFALLS 35（Vue 会把 props 回调摘进 emits） |
| 2 | `open` 支持 `v-model:open` | INTENDED | 与 `onOpenChange` 同时发出（规则 C11） |
| 3 | `data-popover-inject` 不渲染 | INTENDED | React 注入标记（D85，与 popover 同判） |
| 4 | `onOpenChange` 第二参数告警不移植 | INTENDED | Vue 回调本就单参，无 usage 语义 |
| 5 | `PurePanel` 不消费 `classNames` / `styles`（只接受 `className` / `style`） | 同上游 | antd `PurePanel.tsx` 的解构里没有 classNames/styles；语义槽是 `Popconfirm` 本体的能力 |

## 3. 为什么主实现是 `.ts`（defineComponent + h）

`Popconfirm` 是 Popover 的薄包装：content 通道是**运行时构造的 VNode 树**（Overlay 四层 + 按钮组合），且 `omit(attrs, ['title'])` 这类透传在渲染函数里表达最直接；与 popover / radio 同范式（COMPONENT-RULES §2 条件 1/2）。

## 4. 实现要点（最容易写错的判据）

1. **默认参数与 Popover 不同**：`placement=top`、`trigger=click`（Popover 是 hover）、`okType=primary`、`icon=ExclamationCircleFilled`、`showCancel=true`、`mouseEnter/LeaveDelay=0.1`。
2. **`disabled` 拦在 `settingOpen` 之前** —— 连 `onOpenChange` 都不发。
3. **`onConfirm` 必须隐式返回 actionFn 的返回值**（上游单行箭头）：写成 `{ …; }` 会吞掉 Promise，表现为「点 OK 立刻关闭」而不是等 resolve。
4. **`onCancel` 先关后回调**。
5. **`title` 不进 Popover 的 restProps**（`omit(restProps, ['title'])`），否则 Popover 会把它当自己的 title 再渲染一遍。
6. **description 的语义槽是 `content`**（上游 `classNames?.content` / `styles?.content`）。
7. **okText / cancelText falsy（含空串）回退 locale**；`title` 为 `0` 仍渲染。
8. **`useLocale` 返回普通对象不是 ref** —— 别写 `.value`（empty 同判）。
9. **`Popover.PurePanel` 的 `content` prop 按 C8-R2 收窄为 String** → Overlay 必须走 `content` **slot** 传，不能走 prop。

## 5. ActionButton 的提升（2026-09-28）

`_util/ActionButton` 在 antd 是共享件；本仓原先只有 modal 在用（`modal/components/ActionButton.ts`）。Popconfirm 是**第二个消费者**，为避免 `popconfirm → modal` 的组件间横向依赖，实现搬到 `_internal/action-button.ts`，`modal/components/ActionButton.ts` 降级为 re-export 垫片（modal 的 import 点不动，`useOrientation` 提升时的同一套做法）。

## 6. Component Token（1 个）

`zIndexPopup = zIndexPopupBase + 60`。其余视觉量（colorWarning / marginXS / marginXXS / fontWeightStrong / colorTextHeading / fontSize）全部走 alias token。

## 7. 测试环境已知边界

- 浮层内容只有 `PurePanel` 在静态渲染期可达（portal 在 SSR 不可达）；测试必须 `global.stubs.teleport = false`，否则浮层渲染在原地、根节点数与基线不符。
