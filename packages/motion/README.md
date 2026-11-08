# @apollo-design/motion

Vue 组件动效编排：`CSSMotion` 管理单个根节点的进入、离开和完成，`MotionList` 管理带键列表的增删过渡。包负责阶段、类名和测量时序，动效 CSS 由消费方提供。

## 安装

```bash
npm install @apollo-design/motion vue
```

## 单节点过渡

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CSSMotion } from '@apollo-design/motion';

const visible = ref(false);
</script>

<template>
  <button type="button" @click="visible = !visible">切换</button>
  <CSSMotion :visible="visible" motion-name="demo-fade" :motion-deadline="250">
    <template #default="{ className, style }">
      <div :class="className" :style="style">内容</div>
    </template>
  </CSSMotion>
</template>

<style>
.demo-fade-enter, .demo-fade-appear { opacity: 0; }
.demo-fade-enter-active, .demo-fade-appear-active { opacity: 1; transition: opacity .2s; }
.demo-fade-leave { opacity: 1; }
.demo-fade-leave-active { opacity: 0; transition: opacity .2s; }
</style>
```

默认槽接收 `{ className, style, visible, status, step }`，把类名与样式绑定到单个实际根节点。完成通知使用 `@visibleChanged`。`motionDeadline` 单位为毫秒，供无法收到结束事件的场景收尾。

## 生命周期与列表

`motionAppear`、`motionEnter`、`motionLeave` 控制各阶段；`removeOnLeave`、`forceRender` 与 `leavedClassName` 控制保留内容。`hooks` 的 prepare/start/active/end 回调用于参与阶段处理；prepare 可返回 Promise。卸载、快速反向切换和根节点更换会清理或转移对应资源。

`MotionList` 使用稳定 `keys`，默认槽除动效字段外包含 `itemKey`、`index` 和业务数据。离场期间保留项，重新加入同键项可取消待完成的移除；全部移除后触发 `allRemoved`。`component` 配置外层容器，`false` 或 `null` 表示无容器。

高级宿主可使用 `useMotionStatus` 或框架无关的 `createMotionDriver`。本包不选择主题、动画曲线或系统减弱动效策略；这些由应用/组件配置与 CSS 决定。

## 文档与维护

[公开导出](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/motion/src/index.ts) · [项目规范](https://github.com/apollocmh/apollo-design-ui/blob/master/AGENTS.md) · [测试要求](https://github.com/apollocmh/apollo-design-ui/blob/master/TESTING.md)
