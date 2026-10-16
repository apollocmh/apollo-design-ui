<script setup lang="ts">
/**
 * 组件详情页：标题 + 简介 + 何时使用（intro）→ 代码演示 → API / FAQ（rest）。
 * 三栏：分类侧栏（SiteLayout）+ 中央内容 + 本页目录（TocNav，经共享状态挂到布局右栏）。
 * 页面数据（文档 HTML、demo 元数据与源码）按组件懒加载，离开页面即释放。
 */
import { computed, onBeforeUnmount, onServerPrefetch, ref, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import { findComponent, loadComponentPage, siteManifest } from '../composables/manifest';
import { useSiteLocale } from '../composables/locale';
import { useTocState } from '../composables/toc';
import { useSeo } from '../composables/seo';
import type { ComponentPageData, TocItem } from '../types/manifest';
import DocHtml from '../components/docs/DocHtml.vue';
import DemoPreview from '../components/demo/DemoPreview.vue';

const route = useRoute();
const { t, pick, locale } = useSiteLocale();
const { setToc } = useTocState();

const page = shallowRef<ComponentPageData | null>(null);
const state = ref<'loading' | 'ready' | 'error'>('loading');
const fullWidth = ref(false);

async function load(name: string): Promise<void> {
  state.value = 'loading';
  page.value = null;
  try {
    page.value = await loadComponentPage(name);
    state.value = 'ready';
  } catch {
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

/** TOC = intro/rest 标题 + 「代码演示」锚点（demo 区块由本页渲染并占锚 id="demos"）。 */
const toc = computed<TocItem[]>(() => {
  if (!doc.value) return [];
  return [...doc.value.toc, { level: 2 as const, text: t('groupDemo'), id: 'demos' }];
});

watch(
  toc,
  (next) => setToc(next),
  { immediate: true },
);
onBeforeUnmount(() => setToc([]));

const importLine = computed(() => {
  const names = page.value?.imports ?? [];
  return `import { ${names.join(', ')} } from '@apollo-design/ui';`;
});

const titleText = computed(() => (page.value ? pick(page.value.title).text : ''));
const subtitleText = computed(() => (page.value ? pick(page.value.subtitle).text : ''));

useSeo(titleText, computed(() => `${titleText.value} ${subtitleText.value} - Apollo Design 组件文档`));
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
            :href="`https://ant.design/components/${page.name}`"
            target="_blank"
            rel="noopener noreferrer"
          >
            antd {{ siteManifest.antdTarget }} ↗
          </a>
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
        <div class="demos-toolbar" role="group" :aria-label="t('groupDemo')">
          <button
            type="button"
            class="demos-mode-btn"
            :class="{ active: !fullWidth }"
            :aria-pressed="!fullWidth"
            @click="fullWidth = false"
          >
            {{ t('split') }}
          </button>
          <button
            type="button"
            class="demos-mode-btn"
            :class="{ active: fullWidth }"
            :aria-pressed="fullWidth"
            @click="fullWidth = true"
          >
            {{ t('fullscreen') }}
          </button>
        </div>
        <div class="demos-grid" :class="{ 'full-width': fullWidth }">
          <DemoPreview
            v-for="demo in page.demos"
            :key="demo.id"
            :demo="demo"
            :full-width="fullWidth"
          />
        </div>
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
  margin-bottom: 24px;
}

.component-title {
  font-size: 30px;
  font-weight: 600;
  margin: 0 0 12px;
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.component-subtitle {
  font-size: 14px;
  color: var(--site-text-tertiary);
  font-weight: 400;
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
}

.demos-section-title {
  font-size: 22px;
  font-weight: 600;
  margin: 44px 0 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--site-border);
  scroll-margin-top: 76px;
}

.demos-toolbar {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
}

.demos-mode-btn {
  border: 1px solid var(--site-border);
  background: var(--site-bg);
  color: var(--site-text-secondary);
  font-size: 12.5px;
  padding: 3px 12px;
  border-radius: 999px;
  cursor: pointer;
}

.demos-mode-btn.active {
  color: var(--site-brand);
  border-color: var(--site-brand);
  background: color-mix(in srgb, var(--site-brand) 8%, transparent);
}

.demos-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 20px;
}

.demos-grid.full-width {
  grid-template-columns: 1fr;
}

@media (max-width: 1080px) {
  .demos-grid {
    grid-template-columns: 1fr;
  }
}

.page-loading,
.page-error {
  padding: 60px 0;
  text-align: center;
  color: var(--site-text-tertiary);
}
</style>
