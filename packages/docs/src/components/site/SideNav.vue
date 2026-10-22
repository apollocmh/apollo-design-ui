<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { categoryLabel, useSiteLocale } from '../../composables/locale';
import { siteManifest } from '../../composables/manifest';

defineEmits<{ navigate: [] }>();

const route = useRoute();
const { pick, t, locale } = useSiteLocale();

const activeName = computed(() =>
  route.name === 'component' || route.name === 'standalone-demo'
    ? String(route.params.name ?? '')
    : '',
);
</script>

<template>
  <nav :aria-label="t('componentNav')">
    <RouterLink class="site-side-link" :class="{ active: route.name === 'overview' }" to="/components" @click="$emit('navigate')">
      {{ t('overview') }}
    </RouterLink>
    <RouterLink class="site-side-link" :class="{ active: route.name === 'changelog' }" to="/changelog" @click="$emit('navigate')">
      {{ t('changelog') }}
    </RouterLink>
    <div v-for="group in siteManifest.categories" :key="group.name" class="site-side-group">
      <div class="site-side-group-title">{{ categoryLabel(group.name, locale) }}</div>
      <RouterLink
        v-for="item in group.components"
        :key="item.name"
        class="site-side-link"
        :class="{ active: item.name === activeName }"
        :to="`/components/${item.name}`"
        @click="$emit('navigate')"
      >
        <span class="site-side-link-name">{{ pick(item.title).text }}</span>
        <span v-if="pick(item.subtitle).text" class="site-side-link-desc">
          {{ pick(item.subtitle).text }}
        </span>
      </RouterLink>
      <RouterLink v-if="group.name === '通用'" class="site-side-link" :class="{ active: route.name === 'icon' }" to="/components/icon" @click="$emit('navigate')">
        <span class="site-side-link-name">Icon</span>
        <span class="site-side-link-desc">{{ locale === 'zh-CN' ? '图标' : '' }}</span>
      </RouterLink>
    </div>

    <div class="site-side-group">
      <div class="site-side-group-title">{{ t('docs') }}</div>
      <RouterLink
        v-for="g in siteManifest.guides"
        :key="g.slug"
        class="site-side-link"
        :class="{ active: route.params.slug === g.slug }"
        :to="`/guide/${g.slug}`"
        @click="$emit('navigate')"
      >
        <span class="site-side-link-name">{{ pick(g.title).text }}</span>
      </RouterLink>
    </div>
  </nav>
</template>
