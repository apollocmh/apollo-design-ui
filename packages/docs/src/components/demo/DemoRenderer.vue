<script setup lang="ts">
/**
 * DemoRenderer —— 示例组件的加载与生命周期。
 *
 * 加载策略（与 vite-ssg SSR 兼容的关键）：
 *  - `import.meta.glob` 是**懒加载**清单，构建期不执行任何示例模块；
 *  - 真正的模块加载在客户端进入视口附近后发生 ⇒ 浏览器 API / window 访问
 *    不会进入 SSR 渲染路径（这是旧 VitePress DemoPreview 的设计约束，原样继承）；
 *  - 加载失败（chunk 404 / 模块抛错）进入 error 态，可重试。
 *
 * 卸载策略：示例组件随本组件卸载而卸载（Vue 自动断开其 effect / 监听）；
 * 「离开视口」不销毁实例 ⇒ 用户在示例里的操作状态（表单输入、展开的面板）保留。
 */

import { Button } from '@apollo-design/ui';
import type { Component } from 'vue';
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
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
const target = shallowRef<HTMLElement | null>(null);
let mounted = false;
let activated = false;
let observer: IntersectionObserver | null = null;

function activate(): void {
  if (!mounted || activated) return;
  activated = true;
  observer?.disconnect();
  observer = null;
  void load();
}

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
  if (typeof IntersectionObserver === 'undefined' || !target.value) {
    activate();
    return;
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) activate();
    },
    { rootMargin: '200px 0px' },
  );
  observer.observe(target.value);
});

onBeforeUnmount(() => {
  mounted = false;
  observer?.disconnect();
  observer = null;
  requestGuard.next();
});

watch(
  () => [props.component, props.demo, props.resetToken],
  () => {
    if (mounted && activated) void load();
  },
);

defineExpose({ state });
</script>

<template>
  <div ref="target" class="demo-renderer" :data-demo="`${component}-${demo}`">
    <template v-if="state === 'ready' && Comp">
      <component :is="Comp" />
    </template>
    <div v-else-if="state === 'loading'" class="demo-renderer-loading" aria-busy="true">
      <span class="demo-renderer-spinner" aria-hidden="true" />
      {{ t('loading') }}
    </div>
    <div v-else class="demo-renderer-error" role="alert">
      ⚠️ {{ t('demoError') }} ({{ component }}/{{ demo }})
      <Button size="small" @click="load">{{ t('retry') }}</Button>
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
