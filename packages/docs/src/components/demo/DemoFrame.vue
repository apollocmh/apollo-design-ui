<script setup lang="ts">
/**
 * DemoFrame —— iframe 隔离预览（DemoPreview 的备选画布）。
 *
 * 什么时候用：demo 的 frontmatter 显式声明 `iframe: true`（全局样式注入、
 * 全局状态等场景）。普通示例默认内联渲染，不强制所有 demo 进 iframe。
 *
 * 通信：内嵌页是路由 `/components/:name/demo/:demo`（独立 chrome），
 * 它用 ResizeObserver 把自身高度 postMessage 给本组件；
 * origin 校验 = 同源（GitHub Pages 自托管）。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { DemoMeta } from '../../types/manifest';
import { useSiteLocale } from '../../composables/locale';

const props = defineProps<{ demo: DemoMeta }>();

const { locale } = useSiteLocale();
const height = ref(160);

const src = computed(() => {
  const lang = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US';
  const theme = document.documentElement.dataset.apolloTheme === 'dark' ? 'dark' : 'light';
  // ⚠️ 必须拼上 base：站点部署在 GitHub Pages 子路径 /apollo-design-ui/ 下，
  //    src 写成 `/components/...` 会指向站点根目录之外的地址 ⇒ iframe 直接 404。
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/components/${props.demo.component}/demo/${props.demo.name}?lang=${lang}&theme=${theme}&embed=1`;
});

function onMessage(e: MessageEvent): void {
  if (e.origin !== location.origin) return;
  const data = e.data as { type?: string; height?: number };
  if (data?.type === 'apollo-demo:resize' && typeof data.height === 'number') {
    height.value = Math.max(60, Math.min(data.height, 4000));
  }
}

onMounted(() => window.addEventListener('message', onMessage));
onBeforeUnmount(() => window.removeEventListener('message', onMessage));
</script>

<template>
  <iframe
    class="demo-frame"
    :src="src"
    :title="`demo: ${demo.title.zh}`"
    :style="{ height: `${height}px` }"
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
