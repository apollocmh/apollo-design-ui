<script setup lang="ts">
/**
 * DemoProvider —— 示例运行环境的提供者。
 *
 * 职责：
 *  - 给每个示例一个稳定、唯一的 DOM 标识（多实例互不冲突的选择器锚点）；
 *  - 把示例环境（方向等）下发给示例子树；
 *  - 站点 chrome 不包裹任何组件库 Provider ⇒ 示例内的 ConfigProvider /
 *    Message / Notification 上下文都是示例自建的，天然与官网隔离。
 */
import { provide, ref } from 'vue';
import { DEMO_CONTEXT_KEY } from './context';

const props = defineProps<{ instanceId: string }>();

const resetToken = ref(0);
provide(DEMO_CONTEXT_KEY, {
  instanceId: props.instanceId,
  direction: typeof document === 'object' && document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr',
  resetToken,
});

defineExpose({ reset: () => (resetToken.value += 1) });
</script>

<template>
  <div class="demo-provider" :data-demo-id="instanceId">
    <slot />
  </div>
</template>

<style scoped>
.demo-provider {
  display: contents;
}
</style>
