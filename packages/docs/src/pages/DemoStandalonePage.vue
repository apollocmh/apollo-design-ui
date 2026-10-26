<script setup lang="ts">
/**
 * 独立示例页（bare chrome，无站点导航）。
 *
 * 两个用途：
 *  1. 「新窗口打开」—— 干净环境里调试单个示例；
 *  2. DemoFrame（iframe 隔离模式）的内嵌页 —— `?embed=1` 时通过
 *     postMessage 向父页面汇报高度；`?theme=` 与 `?lang=` 让 iframe 内
 *     的主题与语言和宿主一致。
 */
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onServerPrefetch,
  ref,
  shallowRef,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';
import DemoProvider from '../components/demo/DemoProvider.vue';
import DemoRenderer from '../components/demo/DemoRenderer.vue';
import { initSiteLocale, useSiteLocale } from '../composables/locale';
import { loadComponentPage } from '../composables/manifest';
import { setThemeOverride } from '../composables/theme';
import type { ComponentPageData, DemoMeta } from '../types/manifest';

const route = useRoute();
const { t } = useSiteLocale();

const page = shallowRef<ComponentPageData | null>(null);
const state = ref<'loading' | 'ready' | 'error'>('loading');

const embed = computed(() => route.query.embed === '1');

// ── iframe 内的语言/主题对齐（DOC-04）────────────────────────────────────
// 必须在 setup 期（客户端）就应用：等到 onMounted 再切，预渲染的默认主题会先闪一帧。
// SSR 下没有 window，保持文档站默认语言/主题。
if (typeof window !== 'undefined') {
  initSiteLocale();
}

watch(
  () => route.query.theme,
  (theme) => {
    if (typeof window !== 'undefined')
      setThemeOverride(theme === 'dark' || theme === 'light' ? theme : null);
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') setThemeOverride(null);
});

const demo = computed<DemoMeta | null>(
  () => page.value?.demos.find((d) => d.name === route.params.demo) ?? null,
);

watch(
  () => [String(route.params.name ?? ''), String(route.params.demo ?? '')],
  async ([name, demoName]) => {
    state.value = 'loading';
    try {
      page.value = await loadComponentPage(name ?? '');
      state.value = 'ready';
    } catch {
      state.value = 'error';
    }
  },
  { immediate: true },
);

onServerPrefetch(async () => {
  if (route.name === 'standalone-demo') {
    try {
      page.value = await loadComponentPage(String(route.params.name ?? ''));
      state.value = 'ready';
    } catch {
      state.value = 'error';
    }
  }
});

// ── iframe 高度上报 ──────────────────────────────────────────────────────
let observer: ResizeObserver | null = null;
const rootEl = ref<HTMLElement | null>(null);

function reportHeight(): void {
  if (!embed.value || typeof window.parent === 'undefined') return;
  const height = document.documentElement.scrollHeight;
  // frameId 让父页面能区分「哪个 iframe」的消息（DOC-03）。
  const frameId = typeof route.query.frameId === 'string' ? route.query.frameId : undefined;
  window.parent.postMessage(
    { type: 'apollo-demo:resize', height, frameId },
    window.location.origin,
  );
}

onMounted(() => {
  if (typeof ResizeObserver === 'function' && rootEl.value) {
    observer = new ResizeObserver(() => reportHeight());
    observer.observe(rootEl.value);
  }
  reportHeight();
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div class="standalone" :class="{ embed }">
    <div v-if="!embed" class="standalone-bar">
      <RouterLink :to="`/components/${route.params.name}`">← {{ t('backToDoc') }}</RouterLink>
      <span class="standalone-name">{{ route.params.name }} / {{ route.params.demo }}</span>
    </div>
    <div ref="rootEl" class="standalone-body">
      <template v-if="state === 'ready' && demo">
        <DemoProvider :instance-id="`${demo.component}-${demo.name}`">
          <DemoRenderer :component="demo.component" :demo="demo.name" />
        </DemoProvider>
      </template>
      <div v-else-if="state === 'loading'" class="standalone-state">{{ t('loading') }}</div>
      <div v-else class="standalone-state">⚠️ {{ t('demoError') }}</div>
    </div>
  </div>
</template>

<style scoped>
.standalone {
  min-height: 100vh;
  background: var(--site-bg);
  font-family: var(--site-font);
  color: var(--site-text);
}

.standalone.embed {
  background: transparent;
}

.standalone-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--site-border);
  font-size: 13px;
}

.standalone-name {
  color: var(--site-text-tertiary);
  font-family: var(--site-font-code);
  font-size: 12px;
}

.standalone-body {
  padding: 24px;
}

.standalone.embed .standalone-body {
  padding: 12px;
}

.standalone-state {
  color: var(--site-text-tertiary);
  text-align: center;
  padding: 40px 0;
}
</style>
