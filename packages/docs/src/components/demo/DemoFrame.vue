<script setup lang="ts">
/** Create the frame with its initial context, then control it without navigation. */
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { type DemoContextMessage, isDemoEnvelope } from '../../composables/demo-context';
import { useSiteLocale } from '../../composables/locale';
import { useSiteTheme } from '../../composables/theme';
import type { DemoMeta } from '../../types/manifest';

const props = defineProps<{ demo: DemoMeta; mode?: 'isolated' | 'viewport' }>();
const { locale, pick } = useSiteLocale();
const { preset, mode: themeMode } = useSiteTheme();
const frameId = useId();
const height = ref(160);
const frameEl = ref<HTMLIFrameElement | null>(null);
const src = ref<string>();
const isViewport = computed(() => props.mode === 'viewport');
const viewportHeight = computed(() => props.demo.preview.viewportHeight ?? 320);
const frameHeight = computed(() =>
  isViewport.value ? `${viewportHeight.value}px` : `${height.value}px`,
);
const title = computed(() => `demo: ${pick(props.demo.title).text}`);
const demoPath = computed(() => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/components/${props.demo.component}/demo/${props.demo.name}`;
});
function sendContext(): void {
  const message: DemoContextMessage = {
    type: 'apollo-demo:context',
    frameId,
    preset: preset.value,
    mode: themeMode.value,
    lang: locale.value,
  };
  frameEl.value?.contentWindow?.postMessage(message, location.origin);
}
function onMessage(event: MessageEvent<unknown>): void {
  if (event.origin !== location.origin || event.source !== frameEl.value?.contentWindow) return;
  const data = event.data;
  if (!isDemoEnvelope(data) || data.frameId !== frameId) return;
  if (data.type === 'apollo-demo:ready') {
    sendContext();
  } else if (
    !isViewport.value &&
    data.type === 'apollo-demo:resize' &&
    'height' in data &&
    typeof data.height === 'number' &&
    Number.isFinite(data.height)
  ) {
    height.value = Math.max(60, Math.min(data.height, 4000));
  }
}
watch([preset, themeMode, locale], sendContext, { flush: 'post' });
onMounted(() => {
  window.addEventListener('message', onMessage);
  // Client-only creation avoids an SSR-default src followed by a preference navigation.
  // Only a real Demo target change creates a new document; theme/language are messages.
  watch(
    demoPath,
    (path) => {
      const query = new URLSearchParams({
        lang: locale.value,
        preset: preset.value,
        theme: themeMode.value,
        embed: '1',
        frameId,
      });
      src.value = `${path}?${query}`;
    },
    { immediate: true },
  );
});
onBeforeUnmount(() => window.removeEventListener('message', onMessage));
</script>

<template>
  <iframe
    v-if="src"
    ref="frameEl"
    class="demo-frame"
    :class="{ 'demo-frame-viewport': isViewport }"
    :src="src"
    :title="title"
    :style="{ height: frameHeight }"
    loading="lazy"
    @load="sendContext"
  />
  <div v-else class="demo-frame-placeholder" :style="{ height: frameHeight }" aria-hidden="true" />
</template>

<style scoped>
.demo-frame {
  width: 100%;
  border: none;
  display: block;
  background: transparent;
}
</style>
