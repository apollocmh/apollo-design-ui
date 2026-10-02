---
title: Tabs
titleTemplate: '%s - @apollo-design/ui'
description: Tabs make it easy to switch between different views.
---

# Tabs

Tabs make it easy to switch between different views.

## When To Use

- When there is a group of content on the same level.\n- When there is a need to switch between views within a region.

## Import

```ts
import { Tabs } from '@apollo-design/ui';
```

## Examples

### Basic

<code src="./demo/basic.vue"></code>

### Disabled

<code src="./demo/disabled.vue"></code>

### With Icon

<code src="./demo/icon.vue"></code>

### Size

<code src="./demo/size.vue"></code>

### Placement

<code src="./demo/placement.vue"></code>

### Card

<code src="./demo/card.vue"></code>

### Centered

<code src="./demo/centered.vue"></code>

### Editable card

<code src="./demo/editable-card.vue"></code>

### Custom add trigger

<code src="./demo/custom-add-trigger.vue"></code>

### Extra content

<code src="./demo/extra.vue"></code>

### Custom indicator

<code src="./demo/custom-indicator.vue"></code>

### Custom tab bar

<code src="./demo/custom-tab-bar.vue"></code>

### Animated

<code src="./demo/animated.vue"></code>

## API

### Tabs

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| activeKey（`v-model:activeKey`） | 当前激活页签的 key | `string` | —— |
| defaultActiveKey | 非受控初始激活页签 | `string` | 第一项 |
| items | 页签内容（**唯一**的写法） | `TabsItem[]` | `[]` |
| type | 页签类型 | `'line' \| 'card' \| 'editable-card'` | `'line'` |
| size | 尺寸（未传走 ConfigProvider 的 `componentSize`） | `SizeType`（`'small' \| 'medium' \| 'middle' \| 'large'`） | —— |
| tabPlacement | 位置（`start`/`end` 会按 RTL 映射成 `left`/`right`） | `'top' \| 'end' \| 'bottom' \| 'start'` | `'top'` |
| centered | 卡片式页签整体居中 | `boolean` | `false` |
| tabBarGutter | 页签间距 | `number` | —— |
| tabBarStyle | 导航区样式 | `CSSProperties` | —— |
| tabBarExtraContent | 导航区两侧的附加内容 | `VNodeChild \| { left?, right? }` | —— |
| addIcon / removeIcon | 「+」与删除按钮的图标 | `VNodeChild` | —— |
| hideAdd | 隐藏「+」（仅 `editable-card` 有意义） | `boolean` | `false` |
| more | 溢出下拉的配置（`icon` / `popupRender` / 浮层 props） | `TabsMoreProps` | —— |
| indicator | 指示条：`align`（`start`/`center`/`end`）与 `size`（数字 / `(origin) => number`） | `TabsIndicator` | `{ align: 'center' }` |
| animated | 动画：`false` / `true` / 对象 | `boolean \| TabsAnimatedConfig` | `{ inkBar: true, tabPane: false }` |
| destroyOnHidden | 隐藏时销毁面板（**组件级**默认，item 级可覆盖） | `boolean` | `false` |
| locale | 语言包（`dropdownAriaLabel` / `removeAriaLabel` / `addAriaLabel`） | `TabsLocale` | —— |
| getPopupContainer | 溢出下拉的挂载容器 | `(node) => HTMLElement` | —— |
| classNames / styles | 语义化类名 / 样式（**8 个平铺 + 1 个嵌套 `popup`**） | `TabsSemanticAllType` | —— |
| id | 根节点 id，同时是 aria 关联的前缀 | `string` | **异步生成** |
| prefixCls / className / rootClassName / style | 常规外观通道 | —— | —— |

#### `TabsItem`

| Field | Description | Type |
| --- | --- | --- |
| key | **必填** | `string` |
| label | 页签标题 | `VNodeChild` |
| children | 面板内容 | `VNodeChild` |
| icon | 图标（与**字符串** label 同时存在时 label 会被包一层 `<span>`） | `VNodeChild` |
| disabled | 禁用 | `boolean` |
| closable | 是否可删（`false` 时无删除按钮；仅 `editable-card` 有意义） | `boolean` |
| closeIcon | 自定义关闭图标（`null` / `false` + `closable` 未传 ⇒ 不可删） | `VNodeChild` |
| forceRender | 未激活时也渲染面板 | `boolean` |
| destroyOnHidden | 隐藏时销毁该面板 | `boolean` |

### Events

| Event | Description | Arguments |
| --- | --- | --- |
| `update:activeKey` | 激活页签变化（`v-model:activeKey`） | `(activeKey: string)` |
| `change` | **真的发生变化**时（反复点同一个不发） | `(activeKey: string)` |
| `tabClick` | 每次点击都发（含重复点击当前页签） | `(key: string, event: MouseEvent \| KeyboardEvent)` |
| `tabScroll` | 导航区滚动 | `({ direction })` |
| `edit` | 增删页签（⚠️ 载荷**被改写**：`add` ⇒ **事件对象**、`remove` ⇒ **key**） | `(target, action)` |

### Slots

| Slot | Description | Arguments |
| --- | --- | --- |
| `tabBar` | 整体替换导航区（替代 `renderTabBar`） | `TabsRenderTabBarProps` |
| `popupRender` | 自定义溢出下拉内容（替代 `more.popupRender`） | `(menu, { restTabs, onClose })` |
| `extra` | 导航区两侧的附加内容（替代 `tabBarExtraContent`） | `({ position: 'left' \| 'right' })` |

### Keyboard

| Key | Behavior |
| --- | --- |
| `←` / `→` | **横向**时在**启用**的页签间环形移动焦点（纵向时**什么都不做**、也不阻止默认行为） |
| `↑` / `↓` | **纵向**时移动焦点；无论方向都先 `preventDefault` |
| `Home` / `End` | 第一个 / 最后一个**启用**页签 |
| `Enter` / `Space` | 激活「当前焦点页签」（没有焦点页签时用 `activeKey`） |
| `Backspace` / `Delete` | 删除「当前焦点页签」（可删时） |
| 溢出触发器的 `↓` / `Space` / `Enter` | 打开下拉 |

> ⚠️ 焦点**只在启用的页签**上停留（`disabled` 页签的 `tabindex` 被移除，方向键会跳过它）。

## Design Token

**26 个** Component Token（与 antd 逐条对齐）：

| Token | Default (light) | Description |
| --- | --- | --- |
| `zIndexPopup` | `1050` | 溢出下拉的 z-index |
| `cardBg` / `cardGutter` | `rgba(0,0,0,0.02)` / `2px` | 卡片背景 / 卡片间距 |
| `cardHeight` / `-SM` / `-LG` | `40` / `32` / `48` | 卡片高度三档（**合并后**的值，可由用户覆盖） |
| `cardPadding` / `-SM` / `-LG` | `8px 16px` / `4px 8px` / `11px 16px` | 卡片内边距（由高度与 `fontHeight` 算出） |
| `titleFontSize` / `-LG` / `-SM` | `14` / `16` / `14` | 标题字号（SM 复用 `fontSize`） |
| `inkBarColor` | `#1677ff` | 指示条颜色 |
| `horizontalMargin` | `0 0 16px 0` | 横向页签外间距 |
| `horizontalItemGutter` | `32`（**固定值**） | 横向页签间距 |
| `horizontalItemMargin` / `-RTL` | `''` | 上游就是**空串**（无规则引用；保留只为逐字对齐） |
| `horizontalItemPadding` / `-SM` / `-LG` | `12px 0` / `8px 0` / `16px 0` | 横向内边距三档 |
| `verticalItemPadding` / `verticalItemMargin` | `8px 24px` / `16px 0 0 0` | 纵向内边距 / 外间距 |
| `itemColor` / `-SelectedColor` / `-HoverColor` / `-ActiveColor` | `rgba(0,0,0,0.88)` / `#1677ff` / `#4096ff` / `#0958d9` | 文字四态 |

⚠️ 另有 **6 个内部 token**（`mergeToken` 的等价物）：`tabsCardPadding`、
`dropdownEdgeChildVerticalPadding`、`tabsDropdownHeight`(200)、`tabsDropdownWidth`(120)、
`tabsHorizontalItemMargin(-RTL)` —— 详见 `style/token.ts`。

主题切换请用 `ConfigProvider` 的 `theme`；组件样式走静态 CSS + CSS 变量（零运行时）。
