---
category: 其他
title: FloatButton
subtitle: 悬浮按钮
---

固定在页面边缘的操作按钮，可组合为操作列表或回到顶部按钮。

## 何时使用

- 提供回到顶部、客服、反馈等全局操作。
- 使用 `FloatButtonGroup` 收纳一组相关操作。

## 代码演示

全部 14 个示例见 [`demo/`](./demo)。

## API

### FloatButton

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| type | 按钮类型 | `'default' \| 'primary'` | `'default'` |
| shape | 按钮形状；Group 内跟随组形状 | `'circle' \| 'square'` | `'circle'` |
| disabled | 禁用，未指定时继承 ConfigProvider | `boolean` | `false` |
| href / target | 链接地址与打开目标，指定 href 时渲染为 a | `string` | — |
| htmlType | 原生 button 类型 | `'button' \| 'submit' \| 'reset'` | `'button'` |
| aria-label | 按钮的可访问名称 | `string` | — |
| tooltip | Tooltip 内容或配置对象 | `string \| TooltipProps` | — |
| badge | Badge 配置，不含 status、text、title、children | `FloatButtonBadgeProps` | — |
| description | 已废弃，使用 `#content` | `string` | — |
| prefixCls | 完整类名前缀 | `string` | `'apollo-float-btn'` |
| classNames / styles | root、icon、content 语义区域，支持 `({ props }) => ...` | `FloatButtonProps['classNames' / 'styles']` | — |

`#icon` 自定义完整图标内容；没有图标槽且内容为空时使用默认图标。`#content` 提供完整内容，文字建议搭配 `shape="square"`。插槽存在即优先，包含有意返回空内容的情况；动态增删、文本、数组和 Fragment 均随当前渲染更新。FloatButton 没有默认插槽和 v-model。

`@click` 只发出一次真实 `MouseEvent`。禁用状态遵循原生 Button 的交互规则。

根 `class`、`style`、id、ARIA 和原生监听器落在真实 button/a 上；style 支持 Vue 字符串、对象和数组。样式优先级为当前主题、Provider 根 style、语义 root style、原生 style；显式 zIndex（包括 0）保留。

### FloatButtonGroup

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| trigger | click/hover 菜单；省略时始终显示列表 | `'click' \| 'hover'` | — |
| open | 受控开合，支持 `v-model:open` | `boolean` | 非受控初始关闭 |
| placement | 列表展开方向 | `'top' \| 'left' \| 'right' \| 'bottom'` | `'top'` |
| shape | 列表和触发按钮的形状；circle 使用 Flex，square 使用 Space.Compact | `'circle' \| 'square'` | `'circle'` |
| type / disabled / href / target / htmlType / tooltip / badge / aria-label | 触发按钮配置；子按钮各自声明对应属性 | 同 FloatButton | — |
| prefixCls | 完整类名前缀 | `string` | `'apollo-float-btn'` |
| classNames / styles | root、list、item、itemIcon、itemContent、trigger、triggerIcon、triggerContent | 对象或 `({ props }) => 对象` | — |

| 事件 | 载荷 | 说明 |
|---|---|---|
| update:open | `boolean` | 开合提议，供 `v-model:open` 使用 |
| openChange | `boolean` | 与 update:open 同源、同次发出 |
| click | `MouseEvent` | 触发按钮的真实点击 |

`#default` 提供列表；`#icon`、`#closeIcon`、`#content` 分别提供触发按钮的关闭时图标、展开时图标和文字内容。触发按钮与列表按钮分别消费 trigger 和 item 语义区域。

Group 的原生 attrs 只落在外层 div，触发按钮属性使用上表字段和 trigger 语义区域。受控状态仅在父级接受后改变；撤销受控保留最后接受值。click 支持外部点击关闭；hover 同时支持焦点进入和原生按钮激活。Escape 请求关闭，焦点位于列表内且关闭已接受时返回触发按钮；关闭被拒绝或焦点已移到外部时保留当前焦点。

### FloatButtonBackTop

继承 FloatButton 的属性、`#icon` / `#content` 和 `@click`，其中 target 改为滚动容器 getter。

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| visibilityHeight | 滚动到该高度时可见 | `number` | `400` |
| duration | 回顶动画时长，毫秒；小于等于 0 立即回顶 | `number` | `450` |
| showProgress | 显示滚动进度环 | `boolean` | `false` |
| target | 当前滚动容器，待绑定的 ref 可返回 null | `() => HTMLElement \| Window \| Document \| null` | 按钮所属 document |

目标、阈值、进度开关响应动态变化。重复点击、目标切换和卸载取消当前滚动动画；减少动态效果偏好和主题 `motion: false` 使用即时回顶。滚动和 resize 监听随目标及所属 window 释放。

### Provider 与主题

`ConfigProvider.components.floatButton` 和 `floatButtonGroup` 分别提供 `className`、`style`、`classNames`、`styles`。配置替换、移除、嵌套作用域以及 prefixCls/direction 跟随当前值。FloatButton 没有组件 Token；尺寸、边距、颜色、阴影和动画读取当前全局 Alias Token。

### Expose

FloatButton 和 FloatButtonBackTop 公开只读 `nativeElement: HTMLButtonElement | HTMLAnchorElement | null`；Group 为 `HTMLDivElement | null`。隐藏或卸载的 BackTop 可以为 null。没有额外的命令式方法。
