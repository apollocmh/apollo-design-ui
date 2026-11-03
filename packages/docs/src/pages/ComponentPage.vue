<script setup lang="ts">
/**
 * 组件详情页：标题 + 简介 + 何时使用（intro）→ 代码演示 → API / FAQ（rest）。
 * 三栏：分类侧栏（SiteLayout）+ 中央内容 + 本页目录（TocNav，经共享状态挂到布局右栏）。
 * 页面数据（文档 HTML、demo 元数据与源码）按组件懒加载，离开页面即释放。
 */
import { Segmented } from '@apollo-design/ui';
import { computed, nextTick, onBeforeUnmount, onServerPrefetch, ref, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import DemoMasonry from '../components/demo/DemoMasonry.vue';
import DocHtml from '../components/docs/DocHtml.vue';
import { useSiteLocale } from '../composables/locale';
import { findComponent, loadComponentPage } from '../composables/manifest';
import { createRequestGuard } from '../composables/request-guard';
import { useSeo } from '../composables/seo';
import { useTocState, withDemoAnchor } from '../composables/toc';
import type { ComponentPageData, TocItem } from '../types/manifest';

const route = useRoute();
const { t, pick, locale } = useSiteLocale();
const { setToc } = useTocState();

const page = shallowRef<ComponentPageData | null>(null);
const state = ref<'loading' | 'ready' | 'error'>('loading');
/** V3：默认按容器宽度自动排布；仅保留「单列」这一真正有价值的模式。 */
const layoutMode = ref<string>('auto');
const layoutOptions = computed(() => [
  { label: t('autoLayout'), value: 'auto' },
  { label: t('fullscreen'), value: 'full' },
]);
const fullWidth = computed(() => layoutMode.value === 'full');
const requestGuard = createRequestGuard();

async function positionInitialAnchor(): Promise<void> {
  const hash = route.hash;
  if (!hash) return;
  // The page JSON and first masonry geometry are asynchronous. Router scroll
  // can run before either exists; locate deep links once both are committed.
  await nextTick();
  if (hash !== route.hash) return;
  document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'auto' });
}

async function load(name: string): Promise<void> {
  const token = requestGuard.next();
  state.value = 'loading';
  page.value = null;
  try {
    const data = await loadComponentPage(name);
    if (!requestGuard.isCurrent(token)) return;
    page.value = data;
    state.value = 'ready';
  } catch {
    if (!requestGuard.isCurrent(token)) return;
    state.value = 'error';
  }
}

watch(
  () => String(route.params.name ?? ''),
  (name) => {
    if (name && route.name === 'component') void load(name);
  },
  { immediate: true },
);

// SSR（vite-ssg）：await 页面数据 ⇒ 组件文档正文进入预渲染 HTML（SEO 与首屏）
onServerPrefetch(async () => {
  if (route.name === 'component') await load(String(route.params.name ?? ''));
});

const meta = computed(() => findComponent(String(route.params.name ?? '')));
const langKey = computed(() => (locale.value === 'zh-CN' ? 'zh' : 'en'));

const doc = computed(() => (page.value ? page.value.doc[langKey.value] : null));

/** The content pipeline retains the intro/rest boundary, including pages without an API heading. */
const toc = computed<TocItem[]>(() => {
  if (!doc.value) return [];
  return withDemoAnchor(
    doc.value.toc,
    t('groupDemo'),
    doc.value.demoTocIndex,
    (page.value?.demos ?? []).map((demo) => ({
      level: 3,
      text: pick(demo.title).text,
      id: `demo-${demo.name}`,
    })),
  );
});

watch(toc, (next) => setToc(next), { immediate: true });
onBeforeUnmount(() => setToc([]));

const importLine = computed(() => {
  const names = page.value?.imports ?? [];
  return `import { ${names.join(', ')} } from '@apollo-design/ui';`;
});

const titleText = computed(() => (page.value ? pick(page.value.title).text : ''));
const subtitleText = computed(() => (page.value ? pick(page.value.subtitle).text : ''));

useSeo(
  titleText,
  computed(() => `${titleText.value} ${subtitleText.value} - Apollo Design 组件文档`),
);
</script>

<template>
  <div class="component-page">
    <template v-if="state === 'ready' && page">
      <header class="component-header">
        <h1 class="component-title">
          {{ titleText }}
          <span v-if="subtitleText" class="component-subtitle">{{ subtitleText }}</span>
        </h1>
        <div class="component-import">
          <span class="component-import-label">{{ locale === 'zh-CN' ? '引入' : 'Import' }}</span>
          <code>{{ importLine }}</code>
        </div>
        <div class="component-links">
          <a :href="page.githubDir" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <a
            :href="`https://github.com/apollocmh/apollo-design-ui/tree/master/packages/ui/src/${page.name}#readme`"
            target="_blank"
            rel="noopener noreferrer"
          >
            README ↗
          </a>
        </div>
      </header>

      <DocHtml :html="doc?.introHtml ?? ''" />

      <section id="demos" class="demos-section">
        <h2 class="demos-section-title">{{ t('groupDemo') }}</h2>
        <div class="demos-toolbar">
          <Segmented v-model:value="layoutMode" :options="layoutOptions" size="small" />
        </div>
        <DemoMasonry :demos="page.demos" :full-width="fullWidth" @ready="positionInitialAnchor" />
      </section>

      <DocHtml :html="doc?.restHtml ?? ''" />
    </template>

    <div v-else-if="state === 'loading'" class="page-loading">{{ t('loading') }}</div>
    <div v-else class="page-error">
      ⚠️ {{ route.params.name }}：{{ t('demoError') }}
      <RouterLink to="/components">{{ t('overview') }}</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.component-header {
  margin-bottom: 32px;
}

.component-title {
  font-size: var(--site-title-size);
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0 0 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 12px;
}

.component-subtitle {
  font-size: inherit;
  color: inherit;
  font-weight: inherit;
}

.component-import {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.component-import-label {
  font-size: 12.5px;
  color: var(--site-text-tertiary);
}

.component-import code {
  max-width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  font-family: var(--site-font-code);
  font-size: 13px;
  background: var(--site-code-bg);
  border: 1px solid var(--site-border);
  border-radius: 6px;
  padding: 4px 10px;
}

.component-links {
  display: flex;
  gap: 14px;
  font-size: 12.5px;
  color: var(--site-text-tertiary);
}

.component-links a {
  color: var(--site-text-tertiary);
}

.component-links a:hover {
  color: var(--site-brand);
}

.demos-section-title {
  font-size: var(--site-section-size);
  font-weight: 500;
  margin: var(--apollo-margin-xxl) 0 var(--apollo-margin-lg);
  scroll-margin-top: 76px;
}

.demos-toolbar {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
}

.page-loading,
.page-error {
  padding: 60px 0;
  text-align: center;
  color: var(--site-text-tertiary);
}
</style>
