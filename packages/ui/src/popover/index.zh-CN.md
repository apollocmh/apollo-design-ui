---
category: 数据展示
title: Popover
subtitle: 气泡卡片
---

点击/鼠标移入时弹出气泡卡片。

## 何时使用

- 需要对目标元素做进一步说明时，用带标题/正文的气泡卡片。
- 复用 Tooltip 的触发协议，内容更丰富（标题 + 正文）。

## 代码演示

见 [`demo/`](./demo)（12 个，覆盖 antd 的主要用户场景；Segmented 未落地 ⇒
原生 select 替换，见各文件头）。

## API

### Props

继承 [Tooltip](../tooltip/index.zh-CN.md) 的全部 props，另有：

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| title | 标题数据（`0` 合法）；模板内容使用 `#title` | `TooltipContent`（VNodeChild） | — |
| content | 正文数据（`0` 合法）；模板内容使用 `#content` | `TooltipContent`（VNodeChild） | — |
| classNames / styles | 语义槽 `root / container / arrow / title / content`（含函数式） | — | — |

⚠️ 受控 `open` 时不做 noTitle 压制（antd 口径）：title/content 均空仍会开空浮层。

### 插槽

| 名称 | 说明 |
|---|---|
| default | 触发元素 |
| title / content | 标题 / 正文；存在则覆盖同名 prop，空槽不回退 |

导出 `PopoverSlots`。主组件与 `PopoverPurePanel` 均在当前 render 读取槽，支持条件出现、移除与内容更新。内容函数 prop 已直接移除，见 [迁移记录](../../../../docs/migrations/overlay-content-slots.md)。

### 原生 class/style

Popover 的原生 `class/style` 作用于浮层根，不传到触发元素。style 接受字符串、对象和混合数组，优先于 `styles.root`，移除后恢复语义值。其他原生 attrs 和监听器沿用 Tooltip 的触发元素落点。PopoverPurePanel 的 attrs、class/style 作用于面板根；不把原生 style 重复应用到 container。分区样式使用 `styles.container/arrow` 与对应 classNames。

### 事件

| 事件 | 载荷 | 说明 |
|---|---|---|
| update:open | `boolean` | `v-model:open`；受控值由调用方决定是否接受 |
| open-change | `boolean` | 与模型同时发送开合提议 |
| after-open-change | `boolean` | 实际开合动画完成 |
| popup-click | `MouseEvent` | 浮层内容的原始点击事件 |

通知统一使用 Vue emits，支持 `.once` 和监听器数组；`h()` 使用 `onOpenChange`、`onAfterOpenChange` 和 `onPopupClick`，不再作为函数 prop 手动调用。导出 `PopoverEmits`。旧 `afterOpenChange` 回调 prop 已直接移除。

### Expose

`forceAlign()`、`nativeElement: HTMLElement | null`、`popupElement: HTMLDivElement | null`（`PopoverRef`）。后两者是当前 DOM 属性，关闭卸载后 `popupElement` 为 `null`。

### 当前配置与主题

主组件和 PopoverPurePanel 消费当前 `ConfigProvider.components.popover` 的类名、语义样式及根样式；不会叠加 `components.tooltip` 的专属配置。PurePanel 支持 `title`、`content`、`color`、`placement`、`prefixCls`、`classNames` 和 `styles`，内容槽契约与主组件相同。

`theme.components.Popover` 支持以下数值 Token；主题替换、嵌套和撤除会更新实际浮层与静态面板，不替换正文输入或焦点。原生和语义样式仍可覆盖对应 CSS 变量。

| Token | 默认值 | 说明 |
|---|---|---|
| titleMinWidth | `177` | 标题最小宽度，px |
| zIndexPopup | 全局 `zIndexPopupBase + 30` | 浮层层级；显式 `zIndex` 和父浮层层叠仍有效 |
| innerPadding | `12` | 内容容器内边距，px |
| titleMarginBottom | `8` | 标题下间距，px |

现存 Tooltip 样式别名 `overlayClassName`、`overlayStyle`、`overlayInnerStyle` 和 `destroyTooltipOnHide` 按继承契约生效，优先使用 `classNames.root`、`styles.root/container` 和 `destroyOnHidden`。线框主题仍为已记录缺口。

## 设计说明

- **职责**：Tooltip / `_internal/trigger.ts` 管浮层生命周期与定位，Popover 管自己的内容、事件、Provider 和 Token（[`历史分析`](../../../../docs/analysis/popover.md)）。
- 与 antd 的已知差异见组件 README。

[静态面板原生 style 迁移](../../../../docs/migrations/overlay-native-styles.md)。
