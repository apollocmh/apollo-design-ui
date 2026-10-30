---
category: 导航
title: Tabs
subtitle: 标签页
titleTemplate: '%s - @apollo-design/ui'
description: 选项卡切换组件，提供平级区域的内容切换能力。
---

# Tabs 标签页

选项卡切换组件，提供平级区域的内容切换能力。

## 何时使用

- 提供平级的区域将大块内容进行收纳和展现，保持界面整洁；
- 需要让用户在一个区域内的多个视图间快速切换时。

## 引入

```ts
import { Tabs } from '@apollo-design/ui';
```

## 代码演示

### 基本

<code src="./demo/basic.vue"></code>

### 禁用

<code src="./demo/disabled.vue"></code>

### 带图标

<code src="./demo/icon.vue"></code>

### 尺寸

<code src="./demo/size.vue"></code>

### 位置

<code src="./demo/placement.vue"></code>

### 卡片式

<code src="./demo/card.vue"></code>

### 居中

<code src="./demo/centered.vue"></code>

### 可增删

<code src="./demo/editable-card.vue"></code>

### 自定义新增触发器

<code src="./demo/custom-add-trigger.vue"></code>

### 附加内容

<code src="./demo/extra.vue"></code>

### 自定义指示条

<code src="./demo/custom-indicator.vue"></code>

### 自定义导航区

<code src="./demo/custom-tab-bar.vue"></code>

### 动画

<code src="./demo/animated.vue"></code>

### 自定义溢出列表

<code src="./demo/popup-render.vue"></code>

### 组件 Token

<code src="./demo/component-token.vue"></code>

## API

### Tabs

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| activeKey | 受控激活项，支持 `v-model:activeKey` | `string` | — |
| defaultActiveKey | 非受控初始激活项 | `string` | 首个启用项 |
| items | 页签与面板数据 | `TabsItem[]` | `[]` |
| type | 页签类型 | `'line' \| 'card' \| 'editable-card'` | `'line'` |
| size | 局部尺寸；依次回落到 `components.tabs.size`、全局尺寸 | `'small' \| 'medium' \| 'middle' \| 'large'` | — |
| tabPlacement | 导航位置；start/end 按文字方向映射 | `'top' \| 'end' \| 'bottom' \| 'start'` | `'top'` |
| direction | 文字方向，未传读取当前 Provider | `'ltr' \| 'rtl'` | — |
| centered | 导航居中 | `boolean` | `false` |
| tabBarGutter | 相邻页签的间距，单位 px | `number` | — |
| tabBarStyle | 导航区样式 | `CSSProperties` | — |
| tabBarExtraContent | 附加内容；单节点位于右侧 | `VNodeChild \| { left?: VNodeChild; right?: VNodeChild }` | — |
| addIcon / removeIcon | 新增与关闭按钮图标 | `VNodeChild` | — |
| hideAdd | 隐藏新增按钮，仅用于 editable-card | `boolean` | `false` |
| more | 溢出按钮图标与浮层动效名 | `{ icon?: VNodeChild; transitionName?: string }` | — |
| indicator | 指示条对齐与长度；函数接收原始长度 | `{ align?: 'start' \| 'center' \| 'end'; size?: number \| ((origin: number) => number) }` | `{ align: 'center' }` |
| animated | 指示条与面板动画 | `boolean \| { inkBar?: boolean; tabPane?: boolean }` | `{ inkBar: true, tabPane: false }` |
| destroyOnHidden | 未设置 item 配置时，隐藏面板是否销毁 | `boolean` | `false` |
| locale | 按钮与溢出列表的可访问名称 | `{ dropdownAriaLabel?: string; removeAriaLabel?: string; addAriaLabel?: string }` | 英文默认名称 |
| getPopupContainer | 溢出浮层的挂载容器 | `(trigger: HTMLElement) => HTMLElement` | 当前 Provider / body |
| classNames / styles | 语义区域对象，或 `({ props: TabsProps }) => 对象` | `TabsProps['classNames'] / TabsProps['styles']` | — |
| id | 根 id 与内部 ARIA id 的前缀 | `string` | Vue `useId()` |
| prefixCls | DOM 类名前缀 | `string` | `'apollo-tabs'` |

保留的废弃别名：`tabPosition`（top/right/bottom/left）、`indicatorSize`、`moreIcon`、`popupClassName`、`destroyInactiveTabPane`。优先使用 tabPlacement、indicator.size、more.icon、classNames.popup.root、destroyOnHidden。

### TabsItem

| 字段 | 说明 | 类型 |
| --- | --- | --- |
| key | 唯一数据键；事件始终传回原值 | `string` |
| label / children | 页签标题 / 面板内容，支持完整 Vue 内容和数字 0 | `VNodeChild` |
| icon | 标题图标 | `VNodeChild` |
| disabled | 禁止用户激活与移除 | `boolean` |
| closable | 是否可移除，仅用于 editable-card | `boolean` |
| closeIcon | 当 closable 未设置时，null/false 会关闭该项的移除能力 | `VNodeChild` |
| forceRender | 激活前也渲染该面板 | `boolean` |
| destroyOnHidden | 覆盖组件级隐藏销毁默认值，包括显式 false | `boolean` |
| destroyInactiveTabPane | destroyOnHidden 的废弃别名 | `boolean` |
| className / style | 面板区域的类名 / 样式 | `string / CSSProperties` |

### 事件

| 事件 | 触发与参数 |
| --- | --- |
| update:activeKey | 激活请求不同于当前公开值时，`(key: string)` |
| change | 与 update:activeKey 同次发送，`(key: string)` |
| tabClick | 每次有效页签点击或键盘激活，包括当前项，`(key: string, event: MouseEvent \| KeyboardEvent)` |
| tabScroll | 导航位移变化，`({ direction: 'left' \| 'right' \| 'top' \| 'bottom' })` |
| edit | 新增发送 `(event, 'add')`，移除发送 `(key, 'remove')`；数据由调用方更新 |

事件统一由 Vue emits 发送，不另调用监听器 prop。受控请求须由父级接受才改变公开值；activeKey 变为 undefined 时保留最后一次实际接受的值。默认值只初始化一次。非受控激活项被移除时，按原索引选择附近的启用项；数据整理本身不发送用户激活事件。

### 插槽与实例

| 插槽 | 作用域 |
| --- | --- |
| tabBar | `TabsRenderTabBarProps`：当前 id、prefixCls、tabs、activeKey、方向、位置、动画、样式及导航回调；整体替换导航 |
| popupRender | `{ originNode, restTabs, onClose }`：原始溢出列表、当前隐藏项与关闭方法 |
| extra | `{ position: 'left' \| 'right' }`：两侧附加内容 |

插槽在渲染时读取。extra 插槽存在时优先于 tabBarExtraContent，空槽也会压住默认内容；popupRender 同样支持条件出现、空内容和撤除。tabBar 自定义导航负责自己的键盘与 ARIA；editable.onEdit 的 remove 命令必须提供 `{ key, event }`，add 命令提供 `{ event }`。

模板 ref 的 `nativeElement` 是实际根 `HTMLElement | null` 属性：`tabsRef.value?.nativeElement`。不调用 nativeElement()。

### 原生属性、语义与焦点

class、style、data-*、ARIA 和未声明的原生事件落在根 div。根 style 支持对象、数组与字符串，优先于组件语义根样式。语义区域为 root、header、item、remove、indicator、body、content，以及嵌套的 popup.root；Provider 样式先合并，再由局部语义样式和原生根 style 覆盖。函数式语义样式收到当前解析后的 props。

页签与关闭按钮各自拥有交互，tablist 通过 aria-owns 只拥有 tab；溢出 listbox 只拥有 option，移除按钮是独立控件。数据 key 的 id 片段会编码，避免空白或标点破坏 ARIA 关联。未显式传 id 时，SSR 与水合使用 Vue 的确定 id。相同 key 的面板在重排时保留输入和组件状态。

| 按键 | 行为 |
| --- | --- |
| 左 / 右 | 横向导航，在启用项间循环，RTL 反转方向；阻止已处理的默认滚动 |
| 上 / 下 | 纵向导航；横向时保留页面默认行为 |
| Home / End | 首个 / 最后一个启用项 |
| Enter / Space | 激活焦点项 |
| Backspace / Delete | 对可移除的焦点项发送 edit；只有数据实际移除后才移动焦点 |
| 溢出按钮的上 / 下 / Enter / Space | 打开并聚焦溢出列表；上键从最后一项开始 |
| 溢出列表的上 / 下、Home / End | 跳过禁用项移动当前选项 |
| 溢出列表的 Enter / Space、Escape | 选择并关闭 / 关闭，焦点返回溢出按钮 |

溢出按钮支持鼠标悬停与点击，点击外部关闭。关闭图标与自定义插槽中的表单控件保留自己的键盘操作。禁用的当前项不会取消其他启用项的 Tab 入口。触摸移动、惯性、观察器与浮层监听在取消、换目标和卸载时清理。

## 设计 Token

24 个组件 Token 读取当前 `ConfigProvider.theme.components.Tabs`，支持嵌套、替换、撤除和全局派生。数值长度使用 px，zIndexPopup 为无单位数值；浮层使用同一套当前 Token。

| Token | 默认值 / 派生 |
| --- | --- |
| zIndexPopup | 1050 |
| cardBg / cardGutter | colorFillAlter / 2 |
| cardHeight / cardHeightSM / cardHeightLG | 40 / 32 / 48；控制新增按钮最小尺寸与默认 padding 派生 |
| cardPadding / cardPaddingSM / cardPaddingLG | 8px 16px / 4px 8px / 11px 16px；高度覆盖后重新派生，显式 padding 优先 |
| titleFontSize / titleFontSizeLG / titleFontSizeSM | 14 / 16 / 14 |
| inkBarColor | colorPrimary |
| horizontalMargin | 0 0 16px 0 |
| horizontalItemGutter | 32，可覆盖 |
| horizontalItemPadding / horizontalItemPaddingSM / horizontalItemPaddingLG | 12px 0 / 8px 0 / 16px 0 |
| verticalItemPadding / verticalItemMargin | 8px 24px / 16px 0 0 0 |
| itemColor | colorText |
| itemSelectedColor / itemHoverColor / itemActiveColor | 亮背景取 colorPrimaryTextActive，暗背景取 colorPrimaryTextHover |

默认文字三状态复用当前主题中已有的可读主色；背景明暗分类与 Button 相同，不生成新色值。显式 item*Color、原生样式、透明或自定义背景由调用方保证实际色对可读。样式仍由静态 CSS 与 CSS 变量消费；自定义 prefixCls 需要配套静态选择器。

### 开发版直接迁移

移除无实现的顶层 children，使用 items[].children。移除从未消费的 horizontalItemMargin / horizontalItemMarginRTL，使用 horizontalItemGutter。已声明为属性的 nativeElement 修正为真实元素，旧函数调用改为属性读取；id 在 SSR 首帧即生效，key 片段编码。item.destroyOnHidden 现在按既有文档覆盖组件默认值。以上没有兼容层或弃用期。

既有 popupRender 单对象与条件插槽迁移保留，见 [2026-10-24 迁移记录](../../../../docs/migrations/tabs-popup-slots.md)。原始 DOM/视觉参考保留；本阶段验证不等同于冻结版本的整库最终验收。
