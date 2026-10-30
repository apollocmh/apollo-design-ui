---
category: 反馈
title: Drawer
subtitle: 抽屉
---

屏幕边缘滑出的浮层面板。

## 何时使用

- 需要从屏幕边缘滑出、承载较多内容或表单的场景。
- 需要在**当前节点内**渲染（`:get-container="false"`）而不是挂到 body。
- 需要可拖拽改尺寸（`resizable`）或多层嵌套（子抽屉推挤父级）。

## 代码演示

见 [`demo/`](./demo)（18 个，覆盖 antd 的主要用户场景）。

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| open | 是否显示 | `boolean` | `false` |
| placement | 方位 | `'top' \| 'right' \| 'bottom' \| 'left'` | `'right'` |
| size | 尺寸预设或数值/字符串 | `'default' \| 'large' \| number \| string` | `'default'`(378) |
| defaultSize | 默认尺寸（**垂直方位的默认值来源**） | `number` | `378` |
| maxSize | 拖拽时允许的最大尺寸 | `number` | — |
| title | 标题（文本；富标题走 `#title` slot，slot 优先） | `string` | — |
| footer | 页脚（⚠️ 已改为 `#footer` slot，空 slot 等价隐藏） | `slot` | — |
| extra | 标题栏右侧（⚠️ 已改为 `#extra` slot） | `slot` | — |
| closable | 关闭按钮。`false` ⇒ 不渲染；对象可给 `placement: 'start' \| 'end'` | `boolean \| null \| {...}` | `true` |
| closeIcon | 自定义关闭图标（⚠️ 已改为 `#closeIcon` slot） | `slot` | — |
| loading | 内容区骨架态 | `boolean` | `false` |
| mask | 遮罩。`false` ⇒ 无遮罩（根类加 `no-mask`） | `boolean \| { enabled?, blur?, closable? }` | `true` |
| maskClosable | 点遮罩关闭（⚠️ deprecated ⇒ `mask.closable`） | `boolean` | `true` |
| push | 推挤：`true` / `{ distance }`（**只有子抽屉会真的推**） | `boolean \| PushState` | `{ distance: 180 }` |
| resizable | 可拖拽改尺寸；通知使用下表的 Vue 事件 | `boolean` | `false` |
| getContainer | 容器；false 为内联渲染，其他值由 Portal 解析 | `GetContainer` | 默认 body 内的容器 |
| destroyOnHidden | 关闭后卸载 | `boolean` | `false` |
| forceRender | 未打开时也挂载正文，不参与活动 Escape 栈 | `boolean` | `false` |
| focusable | 焦点归还和陷阱；显式 trap 优先，默认仅非内联且有遮罩时锁定 | `{ focusTriggerAfterClose?, trap? }` | — |
| focusTriggerAfterClose | 覆盖 focusable 中的关闭后焦点归还开关 | `boolean` | `true` |
| keyboard | ESC 可关 | `boolean` | `true` |
| autoFocus | 打开时自动聚焦面板 | `boolean` | `true` |
| rootStyle | 根样式，原生 style 的优先级更高 | `CSSProperties` | — |
| zIndex | 显式根层级；未传时使用当前主题和嵌套层级 | `number` | — |
| classNames / styles | 12 个语义槽 | — | — |

`open` 是受控开关。关闭按钮、遮罩和 Escape 仅发出关闭请求，父组件在接受后更新 `open`。`destroyOnHidden` 等待真实离场完成后卸载；条件卸载也清理焦点锁、拖拽和推挤登记。

显式 `size`（及当前方位的 width/height 别名）保持受控，拖拽只发出尺寸请求；未传时使用默认尺寸并在本地调整。撤除受控尺寸时保留最后实际接受的值，不应用被拒绝的请求。

### Events

| 事件 | 说明 | 载荷 |
|---|---|---|
| close | 遮罩点击、关闭按钮或活动层的 Escape 请求 | 原始 `Event`（MouseEvent / KeyboardEvent） |
| afterOpenChange | 打开或关闭动效完成 | `open: boolean` |
| resizeStart | 开始拖拽 | `size: number`，像素 |
| resize | 拖拽后的当前尺寸 | `size: number`，像素 |
| resizeEnd | 正常结束拖拽后的实测尺寸 | `size: number`，像素 |

事件支持 Vue 的 `.once` 和监听数组。关闭、禁用拖拽、切换方位或卸载会释放拖拽监听，不伪造正常结束通知。

**deprecated（9 条，dev 告警）**：`headerStyle` / `bodyStyle` / `footerStyle` →
`styles.*`；`contentWrapperStyle` → `styles.wrapper`；`maskStyle` → `styles.mask`；
`drawerStyle` → `styles.section`；`destroyOnClose` → `destroyOnHidden`；
`width` / `height` → `size`。

### 语义化槽位（12 个）

```
root / mask / wrapper / section / header / title / extra / body / footer / close / dragger
（+ deprecated 的 content ⇒ section）
```

### Slots（C8-R2）

| Slot | 说明 | 参数 |
|---|---|---|
| title | 富标题（文本 `title` prop 等价，slot 优先） | — |
| footer | 页脚（空 slot 等价隐藏） | — |
| extra | 标题栏右侧额外内容 | — |
| closeIcon | 自定义关闭图标 | — |

内容插槽通过 `DrawerSlots` 导出类型；存在即优先（含空内容）。标题在每次 Drawer 渲染中求值一次，面板内容与自动 `aria-labelledby` 共用同一快照；显式 `aria-labelledby` 指向外部标题时保留调用方值。头尾内容显隐不重挂载正文，保留输入状态和 DOM 身份。

`getContainer` 使用 Portal 的完整 `GetContainer` 类型，包括 `false`、选择器、元素与容器函数；Vue 模板可直接传 `:get-container="false"`。Drawer 的原生 `class` / `style`（含数组、对象及字符串）、data 属性与普通 DOM 事件属于外层根；id、role 和 ARIA 属于实际 dialog。面板外观使用 `classNames.section` / `styles.section`。PurePanel 的原生 attrs 全部属于自身根。

### Ref 与开发版迁移

`DrawerRef` 暴露 `nativeElement: HTMLElement | null` 和 `focus(options?: FocusOptions)`，指向当前外层根；销毁前后元素可为空。使用实际模板引用：

```vue
<script setup lang="ts">
import { Drawer, type DrawerRef } from '@apollo-design/ui';
import { ref, useTemplateRef } from 'vue';
const drawer = useTemplateRef<DrawerRef>('drawer');
const open = ref(false);
const completed = (open: boolean) => console.log(open);
</script>
<template>
  <button @click="open = true">Open drawer</button>
  <Drawer ref="drawer" :open="open" resizable @close="open = false" @after-open-change="completed" @resize="size => console.log(size)">
    <button @click="drawer?.focus()">Focus drawer root</button>
  </Drawer>
</template>
```

当前未发布开发版直接将 `:after-open-change="fn"` 迁为 `@after-open-change="fn"`（`h()` 使用 `onAfterOpenChange`），将 `:resizable="{ onResize, onResizeStart, onResizeEnd }"` 迁为 `resizable` 与三个同名事件。删除未消费的 `DrawerResizableConfig`、`panelRef` 和 `destroyInactivePanel`；元素访问改用 `DrawerRef`，销毁使用 `destroyOnHidden`。PurePanel 类型不再声称消费内部 `ariaId`、`size` 或 `contentWrapperStyle`。原先误落面板的原生 class/style 直接移到根，面板定制改用 section 语义字段。本组无兼容层或弃用期；表中的既有样式和销毁别名仍保留。

## Theme（Component Token）

4 个（CSS 变量 `--apollo-drawer-*`）：`zIndexPopup`（= `zIndexPopupBase` = **1000，不加偏移**）/
`footerPaddingBlock`(8) / `footerPaddingInline`(16) / `draggerSize`(4)。

Drawer 和 PurePanel 读取当前 `ConfigProvider.components.drawer` 的 className/style、classNames/styles 及适用的 closable/mask/focusable；实例语义样式覆盖 Provider，原生根 style 最后覆盖。四个 Token 通过 `theme.components.Drawer` 配置，已消费的主题别名、嵌套、整对象替换和撤除都会更新当前根的 CSS 变量；显式 zIndex 仍优先。`component-token` 与 `config-provider` Demo 可直接切换观察。

## 设计说明

### 尺寸轴随方位切换

`left`/`right` 用 **width**，`top`/`bottom` 用 **height**；`size` 预设 `'large'` = 736、
`'default'` = 378。⚠️ rc 的 378 兜底**只对水平方位生效**，垂直方位的默认值来自 `defaultSize`。

### 嵌套抽屉的推挤链

每个打开的子抽屉独立登记推挤；只有全部关闭或卸载后父级复位。父级按方位 `translate`（`push.distance` 默认 180，支持 CSS 长度字符串）。
**顶层抽屉自己不会位移** —— `push` 只决定距离。

### 样式引入

```ts
import '@apollo-design/theme/dist/tokens.css';  // 主题变量，必须先引
import '@apollo-design/ui/drawer/style.css';    // 按需
// 或
import '@apollo-design/ui/style.css';           // 汇总
```
