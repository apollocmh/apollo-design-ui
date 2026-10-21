<script setup lang="ts">
/**
 * DemoFrame —— iframe 隔离预览（DemoPreview 的备选画布）。
 *
 * 什么时候用：demo 的 frontmatter 声明 `iframe: true`（全局样式注入、
 * 全局状态等场景）。普通示例默认内联渲染，不强制所有 demo 进 iframe。
 *
 * 通信安全（DOC-03）：内嵌页把自身高度 postMessage 给本组件。只校验
 * `origin` 不够 —— 同源页面里可能同时存在多个 iframe，必须同时校验
 * `event.source === iframe.contentWindow` 与 `frameId`，否则一个 iframe 的
 * 高度消息会改掉另一个 iframe 的高度。
 *
 * SSR（DOC-04）：`src` 的计算不能在 setup/computed 里直接读 `document`；
 * 主题走 `useResolvedTheme()`（mode + media query），水合后再跟随真实偏好。
 */
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue';
import { useSiteLocale } from '../../composables/locale';
import { useResolvedTheme } from '../../composables/theme';
import type { DemoMeta } from '../../types/manifest';

const props = defineProps<{ demo: DemoMeta; mode?: 'isolated' | 'viewport' }>();

const { locale, pick } = useSiteLocale();
const resolvedTheme = useResolvedTheme();
const frameId = useId();
const height = ref(160);
const frameEl = ref<HTMLIFrameElement | null>(null);

/** viewport 模式用固定高度（视口内滚动），不跟随内嵌页高度。 */
const isViewport = computed(() => props.mode === 'viewport');
const viewportHeight = computed(() => props.demo.preview.viewportHeight ?? 320);
const frameHeight = computed(() =>
  isViewport.value ? `${viewportHeight.value}px` : `${height.value}px`,
);

const title = computed(() => `demo: ${pick(props.demo.title).text}`);

const src = computed(() => {
  const lang = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US';
  // ⚠️ 必须拼上 base：站点部署在 GitHub Pages 子路径 /apollo-design-ui/ 下，
  //    src 写成 `/components/...` 会指向站点根目录之外的地址 ⇒ iframe 直接 404。
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/components/${props.demo.component}/demo/${props.demo.name}?lang=${lang}&theme=${resolvedTheme.value}&embed=1&frameId=${encodeURIComponent(frameId)}`;
});

function onMessage(e: MessageEvent): void {
  if (isViewport.value) return;
  if (e.origin !== location.origin) return;
  // 同源 ≠ 同一 iframe：必须核对消息来源窗口。
  if (e.source !== frameEl.value?.contentWindow) return;
  const data = e.data as { type?: string; height?: number; frameId?: string };
  if (data?.type !== 'apollo-demo:resize') return;
  if (data.frameId !== frameId) return;
  if (typeof data.height !== 'number' || !Number.isFinite(data.height)) return;
  height.value = Math.max(60, Math.min(data.height, 4000));
}

onMounted(() => window.addEventListener('message', onMessage));
onBeforeUnmount(() => window.removeEventListener('message', onMessage));
</script>

<template>
  <iframe
    ref="frameEl"
    class="demo-frame"
    :class="{ 'demo-frame-viewport': isViewport }"
    :src="src"
    :title="title"
    :style="{ height: frameHeight }"
    loading="lazy"
  />
</template>

<style scoped>
.demo-frame {
  width: 100%;
  border: none;
  display: block;
  background: transparent;
}
</style>
