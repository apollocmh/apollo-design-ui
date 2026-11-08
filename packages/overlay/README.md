# @apollo-design/overlay

锚定浮层的 Vue 交互编排：触发动作、受控显隐、延迟、外部点击、子浮层登记与 Esc 顺序。适合创建自己的下拉面板、提示或上下文菜单。

## 安装

```bash
npm install @apollo-design/overlay vue
```

需要带定位和样式的完整组件时，使用 UI 包的 Dropdown、Popover 或 Tooltip。

## 基础触发

```vue
<script setup lang="ts">
import { useOverlay } from '@apollo-design/overlay';

const { open, targetRef, popupRef, targetProps, popupProps } = useOverlay({
  action: 'click',
});
</script>

<template>
  <button ref="targetRef" type="button" v-bind="targetProps" :aria-expanded="open">
    详细信息
  </button>
  <div v-if="open" ref="popupRef" v-bind="popupProps">这里是内容</div>
</template>
```

示例在文档流内展示内容。`targetProps` 与 `popupProps` 应绑定到实际触发和浮层节点，便于内部/外部事件判定。

## 组合方式

- `action`、`showAction`、`hideAction` 选择点击、悬停、焦点或上下文菜单行为。
- `open` 接收值、ref 或 getter；受控状态通过 `onOpenChange` 提出更新请求。非受控使用 `defaultOpen`。
- `mouseEnterDelay`、`mouseLeaveDelay`、`focusDelay`、`blurDelay` 及 `setOpen` 的延迟单位为秒。
- 子浮层使用 `registerSubPopup` 登记实际节点，内部点击不会被误判为外部关闭。
- `inMotion` 用于协调离场中的状态；卸载会释放监听和延迟任务。

定位由 `@apollo-design/position` 提供，容器由 `@apollo-design/portal` 提供，焦点管理使用 `@apollo-design/a11y`，动效使用 `@apollo-design/motion`。本包不输出视觉样式，也不导出名为 `Trigger` 的组件。

## 文档与维护

[公开导出](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/overlay/src/index.ts) · [项目规范](https://github.com/apollocmh/apollo-design-ui/blob/master/AGENTS.md) · [测试要求](https://github.com/apollocmh/apollo-design-ui/blob/master/TESTING.md)
