# dropdown 分析（G1）

> 契约来源：antd 6.6.4 `components/dropdown/`（dropdown.tsx 404 / dropdown-button.tsx
> 153 / style 442 行）。上游是兼容性规格。参考源：antd 仓库源码（/tmp/ant-design-master）。

## 1. 结构判定：Trigger 的薄包装（本仓第 4 个消费者）

- **浮层协议**：`_internal/trigger.ts`（popup/builtinPlacements/arrow/placement/
  motion/destroyOnHidden/autoDestroy 全复用 —— trigger 的 popup 协议在
  tooltip/popover/menu 里已三度验证）。
- **overlay**：`Menu` 组件 + **OverrideProvider 覆盖**（antd menu/OverrideContext.tsx）：
  `prefixCls={p}-menu`、`mode='vertical'`、`selectable=false`、`onClick=onMenuClick`
  （非多选 ⇒ 关）、`expandIcon={<span>{p}-menu-submenu-arrow>Right/LeftOutlined}`、
  `validator`（mode 警告）。本仓映射：menu/context.ts 增加 `menuOverrideKey`
  注入通道，Menu 装配时合并进 menuContext；SubMenu 消费 expandIcon。
- **menu prop**：`menu?: MenuProps`（items/onClick 等）⇒ 渲染 `<Menu {...menu}>`。
- **popupRender / dropdownRender(deprecated)**：包装 overlayNode。
- **PurePanel**：genPurePanel —— align 参数无关，直接渲染浮层内容（`{p}-dropdown`）。

## 2. 关键 API 语义

- **trigger**：`('click'|'hover'|'contextMenu')[]` 默认 `['hover']`（rc 默认 hover，
  antd props.trigger 默认 undefined ⇒ rc ['hover']）；`alignPoint = trigger 含 contextMenu`。
- **placement**：默认空 ⇒ rtl?'bottomRight':'bottomLeft'；含 'Center' ⇒ 剥离
  （deprecated 告警）。transitionName：top⇒slide-down、left⇒slide-right、
  right⇒slide-left、其余⇒slide-up（可 transitionName 覆盖）。
- **builtinPlacements**：`getPlacements({arrowPointAtCenter, autoAdjustOverflow,
  offset: marginXXS(4), arrowWidth: arrow?sizePopupArrow:0, borderRadius})` —— 无
  limitVerticalRadius（menu 是 true）。
- **延迟**：mouseEnterDelay=0.15 / mouseLeaveDelay=0.1（tooltip 是 0.1/0.1）。
- **open**：useControlledState(false, open)；onInnerOpenChange 先回调
  `onOpenChange(next, {source:'trigger'})` 再 setOpen（C11：prop 回调 + update:open）。
- **菜单点击关闭**：`onMenuClick` ⇒ 非（selectable&&multiple）时
  `onOpenChange(false, {source:'menu'})` + setOpen(false)。
- **zIndex**：useZIndex('Dropdown') ⇒ zIndexPopupBase+40=1040（menu 1050 /
  tooltip 1070）。
- **disabled**：trigger 置空数组；child 透传 disabled。
- **deprecated ×4**：dropdownRender/destroyPopupOnHide/overlayClassName/overlayStyle
  + placement 'Center' 系。

## 3. DropdownButton（153 行）

- 复合组件：`Button`（loading/icon/size/type/danger/disabled...）+ Dropdown 包裹。
- 点击主按钮 = 按钮自身 onClick；箭头区触发下拉（split 模式）或整钮触发。
- `buttonsRender` 自定义两个按钮渲染；`small`⇒size。
- props 透传：menu/placement/... 到 Dropdown；其余到 Button。

## 4. 样式要点（style 442 行）

- Base：`{p}-dropdown`（menuCls=`.ant-dropdown .ant-menu` 层叠覆盖 —— menu 样式
  的暗色/边距重置）、`-trigger`（disabled 光标）、箭头定位（placementArrow 同 menu）。
- **Motion 四向**：slide-up/down/left/right（initSlideMotion）—— menu 样式只有
  slide-up；slide-down/right/left 在 dropdown 产物里补齐。
- Token：zIndexPopup=zIndexPopupBase+40、paddingBlock=5、dropdownArrowDistance、
  dropdownEdgeChildPadding（=colorBgElevated 相关圆角）。

## 5. Vue 化决策

- Trigger 复用 `_internal/trigger.ts`（popup prop 传 overlay vnode）。
- override 通道：`menu/context.ts` + `menuOverrideKey`（Menu 合并 ctx；
  SubMenu 消费 expandIcon）。
- keyPath/事件协议全部由 Menu/Trigger 承担，Dropdown 自身无状态（除 open）。
- DropdownButton 复用 Button + Dropdown。

## 6. 实现顺序

1. `menu/context.ts` 的 override 通道 + Menu/SubMenu 消费（P1 前置）
2. `style/`（token + index，SSR 提取）
3. `Dropdown.ts` + `DropdownButton.ts` + PurePanel
4. demo ×8 → 七层 → registry → G14

## 7. 风险预登记

- Trigger 的 popup slot 与 menu 的 Teleport 嵌套（popup 内 Menu 的子菜单又
  Teleport 到 body —— 两层 portal，VTU stubs.teleport=false 已覆盖）。
- slide-down/right/left keyframes 名稳定化（apollo-dropdown-*？与 menu 产物的
  slide-up 冲突检查 —— menu 用 apollo-menu-slide-up-in；dropdown 的 motion 规则
  由 dropdown 产物自带，动画名 apollo-dropdown-slide-*-in/out）。
- OverlayProvider 在 Vue 无 cloneElement —— Menu 的 ref 不需要（dropdown 不触达
  menu DOM）。
