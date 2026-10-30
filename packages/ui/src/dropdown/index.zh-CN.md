---
category: 导航
title: Dropdown
subtitle: 下拉菜单
---

将一组操作收纳到触发元素下的菜单。菜单的数据、选择与键盘导航由 Menu 提供；自定义浮层使用具名槽。

## 代码演示

见 demo/ 中的现有示例。DropdownButton 是 Apollo 当前支持的按钮组合。

## Dropdown Props

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| menu | 当前 MenuProps；items、选择与事件继续由 Menu 拥有 | — |
| open / defaultOpen | `v-model:open` 受控值 / 非受控初值 | false |
| trigger | click、hover、contextMenu 的数组；优先于 Provider | hover |
| disabled | 禁止触发；未指定时读取全局 disabled，显式 false 可覆盖 | — |
| placement | DropdownPlacement；Center 旧值归一为 top/bottom | bottomLeft，RTL 为 bottomRight |
| arrow | boolean 或 `{ pointAtCenter }` | false |
| mouseEnterDelay / mouseLeaveDelay | 当前延迟，单位秒 | 0.15 / 0.1 |
| autoAdjustOverflow | 自动调整溢出 | true |
| getPopupContainer | 实际浮层容器，支持 HTMLElement / ShadowRoot；未指定时使用 Provider | body |
| destroyOnHidden / forceRender | 离场完成后销毁 / 预渲染 | false |
| transitionName | 覆盖已有方向动画名 | 按 placement 选择 |
| zIndex | 显式数值层级，0 合法 | 当前组件 Token 或父层级加偏移 |
| classNames / styles | root、item、itemTitle、itemIcon、itemContent；静态对象或 `({ props }) => 对象` | — |
| rootClassName / overlayClassName / overlayStyle / destroyPopupOnHide | 保留已有别名；优先使用语义字段与 destroyOnHidden | — |

函数式语义字段读取当前解析后的配置与开合状态。root 属于真正的浮层根；四个 item 字段传到真实 Menu 区域，与 menu.classNames/styles 合并，Dropdown 字段覆盖同名样式。样式值使用 Vue CSSProperties，包括 undefined 和自定义 CSS 属性。

原生 class/style、id、ARIA 与原生事件属于触发元素。单个元素或组件保持原节点；文本、多节点和 Fragment 内容由稳定 span 承载。浮层外观使用 styles.root/classNames.root。Provider 的 class/style/语义配置、arrow、trigger、延迟与全局容器读取当前值。

## 事件

| 事件 | 载荷 |
| --- | --- |
| update:open | `(open: boolean)` |
| openChange | `(open: boolean, info: { source: 'trigger' 或 'menu' })` |
| afterOpenChange | `(open: boolean)`，实际显隐动画结束后 |

支持 Vue listener 数组、替换与 `.once`。菜单选择时每个通知只发一次；selectable 且 multiple 的菜单保留打开。受控关闭是提议，父级拒绝后仍保持当前值，撤控保留最后接受值。旧 `:after-open-change="fn"` 直接改为 `@after-open-change="fn"`（h/JSX 使用 onAfterOpenChange），无兼容回调通道。

## 插槽与引用

| 插槽 | 参数 / 行为 |
| --- | --- |
| default | 完整触发内容 |
| popupRender | `{ originNode: VNodeChild }`；当前槽存在则优先，空内容不恢复菜单 |

DropdownRef 保留 `forceAlign()`、`nativeElement()`、`popupElement()`。后两者返回当前实际 HTMLElement 或 null；关闭后的保留 DOM 由 destroyOnHidden 决定。

## DropdownButton

保留 split、type、size、loading、danger、disabled、href、target、menu、placement、trigger、arrow、open、容器和层级配置。非 split 时主钮是触发器；split 时主钮只发 click，右钮独立开菜单。target 作用于主链接，原生 class/style/其他 attrs 作用于组根。

事件为 click(MouseEvent)、openChange(open, info) 和 update:open；支持 v-model:open。默认槽承载完整主钮内容；icon 槽在当前 render 读取并保留所有节点，存在但为空时隐藏默认图标。buttonsRender 接收 `{ buttons: [主钮 VNode, 触发钮 VNode] }`，输出两个对应的 Vue 子节点；popupRender 与 Dropdown 同型。DropdownButtonRef 保留 nativeElement()，指向实际下拉触发元素。

旧 icon 函数/prop 通道已迁为 #icon；类型不再保留未消费的 icon 字段。Dropdown.Button 与 Dropdown._InternalPanelDoNotUseOrYouWillBeFired 继续是具备实际组件类型的静态别名。

## PurePanel 与主题

DropdownPurePanel 在文档流中展示同一 Menu，接受 menu、classNames/styles、popupRender 槽与原生 class/style。原生样式支持字符串、对象和数组，优先于语义根样式；当前 Provider 与主题同步作用于面板。

已有七个 CSS 字段包括 zIndexPopup（默认 1050）、paddingBlock（默认 5）以及 arrowOffsetHorizontal、arrowOffsetVertical、arrowShadowWidth、arrowPath、arrowPolygon。当前主题的 marginXXS、sizePopupArrow 和 borderRadius 同时供 CSS 与定位使用。嵌套和显式层级使用已有数值协议；非数值 CSS 表达式保留样式，但不参与自动后代数值层级计算。
