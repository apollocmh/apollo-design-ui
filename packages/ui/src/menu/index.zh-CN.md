---
category: 导航
title: Menu
subtitle: 导航菜单
---

提供水平、垂直和内嵌导航，以 `items` 数据描述条目、子菜单、分组及分隔线。示例见 [`demo/`](./demo)。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| items | 唯一菜单内容源；数据可含 VNode 与每项图标渲染函数 | `ItemType[]` | — |
| mode / theme | 布局与亮暗主题 | `'horizontal' \| 'vertical' \| 'inline'` / `'light' \| 'dark'` | `'vertical'` / `'light'` |
| selectedKeys / defaultSelectedKeys | 受控选中 / 初始选中；支持 `v-model:selectedKeys` | `string[]` | `[]` |
| openKeys / defaultOpenKeys | 受控展开 / 初始展开；支持 `v-model:openKeys` | `string[]` | `[]` |
| activeKey | 受控活动项；撤控保留最后接收值 | `string` | — |
| selectable / multiple | 是否可选中 / 多选 | `boolean` | `true` / `false` |
| disabled | 菜单禁用；未设置时继承 ConfigProvider | `boolean` | — |
| inlineCollapsed | 折叠为图标条，未设置时跟随 Sider | `boolean` | — |
| tooltip | 折叠项的 Tooltip 配置，`false` 关闭 | `false \| TooltipProps` | — |
| inlineIndent | 内嵌层级缩进，单位 px | `number` | `24` |
| triggerSubMenuAction | 弹出子菜单触发方式；内嵌仍用点击与键盘 | `'hover' \| 'click'` | `'hover'` |
| subMenuOpenDelay / subMenuCloseDelay | 子菜单悬停延迟，单位秒 | `number` | `0.1` / `0.1` |
| forceSubMenuRender | 保留子菜单渲染 | `boolean` | `false` |
| disabledOverflow | 关闭水平溢出折叠 | `boolean` | `false` |
| getPopupContainer | 弹层容器；未设置时继承当前 ConfigProvider | `(node: HTMLElement) => HTMLElement` | — |
| prefixCls / id / role / tabIndex | 当前前缀及根列表属性 | `string` / `string` / `string` / `number` | — / — / `'menu'` / `0` |
| classNames / styles | `root/list/item/itemTitle/itemIcon/itemContent`，嵌套 `popup.root` 与 `subMenu` | `MenuClassNames` / `MenuStyles` | — |

原生 `class`、`style`（含字符串和数组）、`data-*`、ARIA 与原生监听器落到真实根 `ul`，水平 Overflow 使用相同落点。`click` 是菜单业务事件，原生键盘监听用 `@keydown`，`h()` 用 `onKeydown`。根样式优先于 Provider 与语义样式；样式不写到隐藏的路径登记树。

### Emits

| 事件 | 载荷 |
|---|---|
| update:selectedKeys / update:openKeys | `string[]` |
| click | `MenuInfo`，包括 `key/keyPath/itemData/domEvent` |
| select / deselect | `SelectInfo`，另含 `selectedKeys`；deselect 只在多选移除时触发 |
| openChange | 当前提议的 `string[]` |

所有业务通知由 Vue emits 提供，支持监听器数组与 `.once`。`keyPath` 从当前项到根逆序排列；`domEvent` 是原生事件，可用它取消链接默认行为。父组件未接受受控提议时，随后撤控保留最后接收值。

### 数据与插槽

`items[].label/extra/icon/itemIcon` 是数据通道，`icon` 函数接收 `RenderIconInfo`。子菜单的 `expandIcon` 函数与 `onClick/onTitleClick/onTitleMouseEnter/onTitleMouseLeave` 继续属于具体数据项。子菜单可通过 `theme` 为本层及后代弹层选择主题。`type: 'submenu'` 可声明尚无子项的子菜单。

| 组件 | Slot | Scope / 内容 |
|---|---|---|
| Menu | expandIcon | `{ isOpen, isSelected, isSubMenu, disabled }`；每项数据 expandIcon 优先 |
| MenuItem | default / title / extra | 标题与附加内容；文本 title prop 仍可用 |
| MenuItem | icon | `RenderIconInfo` |
| MenuSubMenu | title / icon / expandIcon | 图标 scope 为 `RenderIconInfo` |
| MenuItemGroup | title / default | 分组标题 / 子项 |

插槽在渲染期读取，存在即优先，包含有意为空、文本及多节点。Menu 的默认插槽不是另一棵菜单声明树；保留 items 数据与路径登记的统一来源。静态子组件导出沿用此内部菜单上下文协议。

### Expose

`list: HTMLUListElement | null` 是当前真实根列表，包含水平 Overflow；`focus(options?)` 聚焦首个启用的菜单项；`findItem({ key })` 查找当前实例的实际项（包括弹出子菜单），key 可包含引号等字符。卸载后元素引用清空。

## Provider 与样式

`components.menu` 的 `className/style/classNames/styles`、全局禁用、方向和容器跟随当前配置替换及撤除。`theme.components.Menu` 当前支持公开的十个数字 Token：`dropdownWidth/zIndexPopup/radiusItem/itemBorderRadius/radiusSubMenuItem/subMenuItemBorderRadius/activeBarWidth/activeBarHeight/activeBarBorderWidth/itemMarginInline`。两个旧 radius 别名影响对应圆角，显式的现代字段优先。静态 CSS 的其他变量仍可直接定制，不代表额外组件 Token 已实现。全局 Alias 与这十个 Token 同步投影到根列表、内嵌列表和真实弹出列表；数值弹层层级同步提供给后代。非数值 CSS 层级表达式保留样式，自动数值后代层级仍属延期边界。

## 键盘与原生操作

菜单项自身获得焦点时，Enter 或 Space 激活其中唯一的原生链接或按钮；普通条目单次触发点击/选择。直接聚焦子控件时保留浏览器的激活语义。disabled 条目阻止原生导航，输入与可编辑内容保留自己的按键。菜单项中有多个操作时，应直接聚焦所需控件。

内嵌子菜单普通收起后隐藏列表；切换模式或启用 inlineCollapsed 时，离场结束后移除列表。整棵菜单初次挂载不播放入场动画。悬停计时器及待执行焦点帧在卸载时释放。

## 开发版迁移

顶层 `expandIcon` 渲染 prop 改用 `#expandIcon`，静态项图标改用 `#icon`；数据项渲染函数保留。旧 `onKeyDown` 改用原生 `onKeydown` / `@keydown`。删除从未消费的 `children` 类型字段，菜单内容继续走 `items`。业务监听仍使用 `@click/@select/@deselect/@openChange`，程序化监听保留 `onClick/onSelect/onDeselect/onOpenChange` 名称。
