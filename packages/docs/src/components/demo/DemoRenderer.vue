<script setup lang="ts">
/**
 * DemoRenderer —— 示例组件的加载与生命周期。
 *
 * 加载策略（与 vite-ssg SSR 兼容的关键）：
 *  - `import.meta.glob` 是**懒加载**清单，构建期不执行任何示例模块；
 *  - 真正的模块加载只在客户端 onMounted 里发生 ⇒ 浏览器 API / window 访问
 *    不会进入 SSR 渲染路径（这是旧 VitePress DemoPreview 的设计约束，原样继承）；
 *  - 加载失败（chunk 404 / 模块抛错）进入 error 态，可重试。
 *
 * 卸载策略：示例组件随本组件卸载而卸载（Vue 自动断开其 effect / 监听）；
 * 「离开视口」不销毁实例 ⇒ 用户在示例里的操作状态（表单输入、展开的面板）保留。
 */

import type { Component } from 'vue';
import { onMounted, ref, shallowRef, watch } from 'vue';
import { useSiteLocale } from '../../composables/locale';
import { createRequestGuard } from '../../composables/request-guard';

const props = defineProps<{
  component: string;
  demo: string;
  /** 变化 ⇒ 强制重建组件子树（重置语义，由 DemoPreview 递增）。 */
  resetToken?: number;
}>();

// 仅 .vue 源文件；.md 说明不进客户端
const loaders = import.meta.glob<{ default: Component }>('../../../../ui/src/*/demo/*.vue');

const Comp = shallowRef<Component | null>(null);
const state = ref<'loading' | 'ready' | 'error'>('loading');
const { t } = useSiteLocale();
const requestGuard = createRequestGuard();
let mounted = false;

async function load(): Promise<void> {
  const token = requestGuard.next();
  state.value = 'loading';
  Comp.value = null;
  const key = `../../../../ui/src/${props.component}/demo/${props.demo}.vue`;
  const loader = loaders[key];
  if (!loader) {
    if (requestGuard.isCurrent(token)) state.value = 'error';
    return;
  }
  try {
    const mod = await loader();
    if (!requestGuard.isCurrent(token)) return;
    Comp.value = mod.default;
    state.value = 'ready';
  } catch {
    if (!requestGuard.isCurrent(token)) return;
    state.value = 'error';
  }
}

onMounted(() => {
  mounted = true;
  void load();
});

watch(
  () => [props.component, props.demo, props.resetToken],
  () => {
    if (mounted) void load();
  },
);

defineExpose({ state });
</script>

<template>
  <div class="demo-renderer" :data-demo="`${component}-${demo}`">
    <template v-if="state === 'ready' && Comp">
      <component :is="Comp" />
    </template>
    <div v-else-if="state === 'loading'" class="demo-renderer-loading" aria-busy="true">
      <span class="demo-renderer-spinner" aria-hidden="true" />
      {{ t('loading') }}
    </div>
    <div v-else class="demo-renderer-error" role="alert">
      ⚠️ {{ t('demoError') }} ({{ component }}/{{ demo }})
      <button type="button" @click="load">{{ t('retry') }}</button>
    </div>
  </div>
</template>

<style scoped>
.demo-renderer-loading,
.demo-renderer-error {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--site-text-tertiary);
  font-size: 13px;
  padding: 8px 0;
}

.demo-renderer-error button {
  border: 1px solid var(--site-border-strong);
  background: transparent;
  color: var(--site-brand);
  border-radius: 6px;
  padding: 2px 10px;
  cursor: pointer;
}

.demo-renderer-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--site-border-strong);
  border-top-color: var(--site-brand);
  border-radius: 50%;
  animation: demo-spin 0.8s linear infinite;
}

@keyframes demo-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .demo-renderer-spinner {
    animation: none;
  }
}
</style>
