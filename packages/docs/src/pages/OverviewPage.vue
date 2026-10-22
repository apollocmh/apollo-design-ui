<script setup lang="ts">
import { SearchOutlined } from '@apollo-design/icons';
import { Input } from '@apollo-design/ui';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import ComponentPreview from '../components/docs/ComponentPreview.vue';
import { categoryLabel, useSiteLocale } from '../composables/locale';
import { siteManifest } from '../composables/manifest';
import { useSeo } from '../composables/seo';
import { useTocState } from '../composables/toc';

const { locale, pick } = useSiteLocale();
const { setToc } = useTocState();
const query = ref('');
const isZh = computed(() => locale.value === 'zh-CN');
const title = computed(() => (isZh.value ? '组件总览' : 'Components Overview'));
const description = computed(() =>
  isZh.value
    ? `@apollo-design/ui 提供 ${siteManifest.components.length} 个组件，帮助你构建丰富的用户界面。`
    : `Build rich user interfaces with ${siteManifest.components.length} components from @apollo-design/ui.`,
);
const iconEntry = {
  name: 'icon',
  title: { zh: 'Icon', en: 'Icon', enFallback: false },
  subtitle: { zh: '图标', en: '', enFallback: false },
};
const groups = computed(() => {
  const term = query.value.trim().toLowerCase();
  return siteManifest.categories
    .map((group, index) => ({
      name: group.name,
      id: `category-${index}`,
      components: (group.name === '通用'
        ? [...group.components.slice(0, 1), iconEntry, ...group.components.slice(1)]
        : group.components
      ).filter(
        (item) =>
          item &&
          [item.name, item.title.zh, item.title.en, item.subtitle.zh, item.subtitle.en].some(
            (text) => text.toLowerCase().includes(term),
          ),
      ),
    }))
    .filter((group) => group.components.length > 0);
});
watch(
  [groups, locale],
  () =>
    setToc(
      groups.value.map((group) => ({
        level: 2,
        id: group.id,
        text: categoryLabel(group.name, locale.value),
      })),
    ),
  { immediate: true },
);
onBeforeUnmount(() => setToc([]));
useSeo(title, description);
</script>

<template>
  <div class="overview-page">
    <h1 class="overview-title">{{ title }}</h1>
    <p class="overview-lead">{{ description }}</p>
    <Input
      v-model:value="query"
      class="overview-search"
      variant="borderless"
      type="search"
      :aria-label="isZh ? '搜索组件' : 'Search components'"
      :placeholder="isZh ? '搜索组件…' : 'Search components…'"
    ><template #suffix><SearchOutlined /></template></Input>
    <section v-for="group in groups" :id="group.id" :key="group.name" class="overview-group">
      <h2 class="overview-group-title">{{ categoryLabel(group.name, locale) }} <span>{{ group.components.length }}</span></h2>
      <div class="overview-grid">
        <RouterLink v-for="component in group.components" :key="component.name" class="overview-card" :to="`/components/${component.name}`">
          <div class="overview-card-heading">
            <span>{{ pick(component.title).text }}</span>
            <span v-if="pick(component.subtitle).text" class="overview-card-desc">{{ pick(component.subtitle).text }}</span>
          </div>
          <ComponentPreview :name="component.name" />
        </RouterLink>
      </div>
    </section>
    <p v-if="groups.length === 0" class="overview-empty">{{ isZh ? '没有匹配的组件。' : 'No components match.' }}</p>
  </div>
</template>

<style scoped>
.overview-title {
  font-size: var(--site-title-size);
  font-weight: 600;
  line-height: 1.4;
  margin: 0 0 var(--apollo-margin-lg);
}
.overview-lead {
  line-height: 2;
  margin: 0 0 var(--apollo-margin-lg);
}
.overview-search {
  width: 100%;
  padding: var(--apollo-padding-lg) 0;
  border-block: var(--apollo-line-width) solid var(--site-border);
  border-radius: 0;
  font-size: var(--apollo-font-size-lg);
}
.overview-search :deep(input) {
  font-size: inherit;
}
.overview-search :deep(.apollo-input-suffix) {
  color: var(--site-text-tertiary);
}
.overview-group {
  margin-top: var(--apollo-margin-xl);
  scroll-margin-top: calc(var(--site-header-height) + var(--apollo-margin-lg));
}
.overview-group-title {
  display: flex;
  align-items: baseline;
  gap: var(--apollo-margin-sm);
  font-size: var(--site-section-size);
  font-weight: 500;
  margin: 0 0 var(--apollo-margin-lg);
}
.overview-group-title > span {
  font-size: var(--apollo-font-size-sm);
  font-weight: 400;
  color: var(--site-text-tertiary);
}
.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--site-card-gap);
}
.overview-card {
  display: block;
  overflow: hidden;
  border: var(--apollo-line-width) solid var(--site-border);
  border-radius: var(--apollo-border-radius-lg);
  color: var(--site-text);
  background: var(--site-bg);
  transition:
    border-color var(--apollo-motion-duration-mid),
    box-shadow var(--apollo-motion-duration-mid);
}
.overview-card:hover {
  color: var(--site-text);
  border-color: var(--site-brand);
  box-shadow: var(--apollo-box-shadow-tertiary);
}
.overview-card:focus-visible {
  outline: var(--apollo-line-width-bold) solid var(--site-brand);
  outline-offset: var(--apollo-line-width-bold);
}
.overview-card-heading {
  display: flex;
  align-items: baseline;
  gap: var(--apollo-margin-xs);
  padding: var(--apollo-padding-sm) var(--apollo-padding);
  border-bottom: var(--apollo-line-width) solid var(--site-border);
  font-size: var(--apollo-font-size);
  font-weight: 600;
}
.overview-card-desc {
  font-weight: 400;
  font-size: var(--apollo-font-size-sm);
  color: var(--site-text-secondary);
}
.overview-empty {
  text-align: center;
  color: var(--site-text-tertiary);
  padding-block: var(--apollo-padding-xl);
}
@media (min-width: 1200px) and (max-width: 1350px), (max-width: 900px) {
  .overview-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--apollo-margin-sm);
  }
  .overview-card-heading {
    flex-wrap: wrap;
    padding: var(--apollo-padding-sm);
  }
}
</style>
