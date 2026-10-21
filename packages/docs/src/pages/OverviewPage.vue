<script setup lang="ts">
import { onMounted } from 'vue';
import { categoryLabel, useSiteLocale } from '../composables/locale';
import { siteManifest } from '../composables/manifest';
import { useTocState } from '../composables/toc';

const { pick, locale } = useSiteLocale();
const { setToc } = useTocState();
onMounted(() => setToc([]));
</script>

<template>
  <div>
    <h1 class="overview-title">{{ pick({ zh: '组件总览', en: 'Components', enFallback: true }).text }}</h1>
    <p class="overview-lead">
      {{
        pick({
          zh: `共 ${siteManifest.components.length} 个组件，按分类浏览；点击卡片进入组件文档与实时示例。`,
          en: `${siteManifest.components.length} components in total. Click a card to open its docs with live demos.`,
          enFallback: true,
        }).text
      }}
    </p>

    <section class="overview-group">
      <h2 class="overview-group-title">{{ pick({ zh: '资源', en: 'Resources', enFallback: true }).text }}</h2>
      <div class="overview-grid">
        <RouterLink to="/components/icon" class="overview-card">
          <span class="overview-card-title">
            {{ pick({ zh: '图标', en: 'Icons', enFallback: true }).text }}
            <span class="overview-card-desc">{{ siteManifest.icons.total }}</span>
          </span>
          <span class="overview-card-meta">
            <code>@apollo-design/icons</code>
            <span class="site-badge">{{ siteManifest.icons.byStyle.outlined }} / {{ siteManifest.icons.byStyle.filled }} / {{ siteManifest.icons.byStyle.twoTone }}</span>
          </span>
        </RouterLink>
      </div>
    </section>

    <section v-for="group in siteManifest.categories" :key="group.name" class="overview-group">
      <h2 class="overview-group-title">{{ categoryLabel(group.name, locale) }}</h2>
      <div class="overview-grid">
        <RouterLink
          v-for="c in group.components"
          :key="c.name"
          class="overview-card"
          :to="`/components/${c.name}`"
        >
          <span class="overview-card-title">
            {{ pick(c.title).text }}
            <span v-if="pick(c.subtitle).text" class="overview-card-desc">
              {{ pick(c.subtitle).text }}
            </span>
          </span>
          <span class="overview-card-meta">
            <code>{{ c.name }}</code>
            <span class="site-badge">{{ c.demoCount }}</span>
          </span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.overview-title {
  font-size: 28px;
  font-weight: 600;
  margin: 4px 0 8px;
}

.overview-lead {
  color: var(--site-text-secondary);
  margin-bottom: 28px;
}

.overview-group-title {
  font-size: 18px;
  font-weight: 600;
  margin: 28px 0 12px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
}

.overview-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  padding: 14px 16px;
  color: var(--site-text);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.overview-card:hover {
  border-color: var(--site-brand);
  box-shadow: var(--site-shadow);
}

.overview-card-title {
  font-weight: 600;
  font-size: 14.5px;
}

.overview-card-desc {
  margin-left: 6px;
  font-weight: 400;
  font-size: 12px;
  color: var(--site-text-tertiary);
}

.overview-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.overview-card-meta code {
  font-family: var(--site-font-code);
  font-size: 12px;
  color: var(--site-text-tertiary);
}
</style>
