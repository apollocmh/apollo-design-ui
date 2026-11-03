<script setup lang="ts">
import { computed, onBeforeUnmount, onServerPrefetch, ref, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import DocHtml from '../components/docs/DocHtml.vue';
import ThemeGallery from '../components/themes/ThemeGallery.vue';
import { useSiteLocale } from '../composables/locale';
import { loadGuidePage } from '../composables/manifest';
import { createRequestGuard } from '../composables/request-guard';
import { useSeo } from '../composables/seo';
import { useTocState } from '../composables/toc';
import type { GuidePageData } from '../types/manifest';

const route = useRoute();
const { t, pick, locale } = useSiteLocale();
const { setToc } = useTocState();

const page = shallowRef<GuidePageData | null>(null);
const state = ref<'loading' | 'ready' | 'error'>('loading');
const requestGuard = createRequestGuard();

async function load(slug: string): Promise<void> {
  const token = requestGuard.next();
  state.value = 'loading';
  page.value = null;
  try {
    const data = await loadGuidePage(slug);
    if (!requestGuard.isCurrent(token)) return;
    page.value = data;
    state.value = 'ready';
  } catch {
    if (!requestGuard.isCurrent(token)) return;
    state.value = 'error';
  }
}

watch(
  () => String(route.params.slug ?? ''),
  (slug) => {
    if (slug && route.name === 'guide') void load(slug);
  },
  { immediate: true },
);

// SSR：await 数据 ⇒ 指南正文进入预渲染 HTML
onServerPrefetch(async () => {
  if (route.name === 'guide') await load(String(route.params.slug ?? ''));
});

const doc = computed(() =>
  page.value ? page.value.doc[locale.value === 'zh-CN' ? 'zh' : 'en'] : null,
);
const titleText = computed(() => (page.value ? pick(page.value.title).text : ''));
useSeo(
  titleText,
  computed(
    () => `${titleText.value} · Apollo Design ${locale.value === 'zh-CN' ? '使用指南' : 'guide'}`,
  ),
);

watch(
  () => doc.value?.toc ?? [],
  (next) =>
    setToc(
      page.value?.slug === 'themes'
        ? [
            ...next,
            {
              level: 2,
              text: locale.value === 'zh-CN' ? '亮暗预览' : 'Light and dark previews',
              id: 'theme-previews',
            },
          ]
        : next,
    ),
  { immediate: true },
);
onBeforeUnmount(() => setToc([]));
</script>

<template>
  <div class="guide-page">
    <template v-if="state === 'ready' && page">
      <h1 class="guide-title">{{ titleText }}</h1>
      <DocHtml :html="doc?.html ?? ''" />
      <ThemeGallery v-if="page.slug === 'themes'" />
    </template>
    <div v-else-if="state === 'loading'" class="page-loading">{{ t('loading') }}</div>
    <div v-else class="page-loading">⚠️ {{ route.params.slug }} — {{ t('demoError') }}</div>
  </div>
</template>

<style scoped>
.guide-title {
  font-size: var(--site-title-size);
  font-weight: 600;
  margin: 4px 0 24px;
}

.page-loading {
  padding: 60px 0;
  text-align: center;
  color: var(--site-text-tertiary);
}
</style>
