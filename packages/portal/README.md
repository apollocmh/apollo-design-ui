# @apollo-design/portal

Vue Teleport 容器与浮层基础设施：容器解析、创建与释放、层级计算、文档滚动锁及 Esc 协调。

## 安装

```bash
npm install @apollo-design/portal vue
```

## 挂载内容

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Portal } from '@apollo-design/portal';

const open = ref(false);
</script>

<template>
  <button type="button" @click="open = true">打开内容</button>
  <Portal :open="open">
    <div>
      <p>内容挂载到 Portal 容器。</p>
      <button type="button" @click="open = false">关闭</button>
    </div>
  </Portal>
</template>
```

Portal 只改变挂载位置，不自动提供对话框外观或完整模态交互。业务模态框优先使用 UI 的 Modal 或 Drawer。

## 配置与组合函数

| 入口 | 用途 |
| --- | --- |
| `open` | 请求渲染内容 |
| `autoDestroy` | 关闭后卸载，默认 `true` |
| `getContainer` | 指定元素、选择器或容器函数；`false` 表示原位渲染 |
| `autoLock` | 打开时锁定所属文档滚动 |
| `onEsc` | 接收包含 `top` 标记的 Esc 信息，由宿主决定关闭 |
| `usePortalContainer` | 组合容器生命周期 |
| `useZIndex`、`computeZIndex` | 基于调用方配置计算层级 |
| `useScrollLocker`、`useEscKeyDown` | 独立使用对应文档行为 |

SSR 时在客户端挂载后再打开需要 DOM 容器的 Portal。自建容器由创建方管理，自动容器随自身生命周期释放。容器变化时，资源按实际所属文档协调。

定位、焦点陷阱与过渡样式由其他基础包或宿主承担；`zIndexPopupBase` 等视觉配置由调用方传入。

## 文档与维护

[公开导出](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/portal/src/index.ts) · [项目规范](https://github.com/apollocmh/apollo-design-ui/blob/master/AGENTS.md) · [测试要求](https://github.com/apollocmh/apollo-design-ui/blob/master/TESTING.md)
