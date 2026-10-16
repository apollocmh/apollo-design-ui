<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { siteManifest } from '../../composables/manifest';
import { useSiteLocale } from '../../composables/locale';

defineEmits<{ navigate: [] }>();

const route = useRoute();
const { pick, t } = useSiteLocale();

const activeName = computed(() =>
  route.name === 'component' || route.name === 'standalone-demo'
    ? String(route.params.name ?? '')
    : '',
);
</script>

<template>
  <nav aria-label="组件分类导航">
    <div v-for="group in siteManifest.categories" :key="group.name" class="site-side-group">
      <div class="site-side-group-title">{{ group.name }}</div>
      <RouterLink
        v-for="item in group.components"
        :key="item.name"
        class="site-side-link"
        :class="{ active: item.name === activeName }"
        :to="`/components/${item.name}`"
        @click="$emit('navigate')"
      >
        <span class="zh">{{ pick(item.title).text }}</span>
        <span class="en">{{ item.subtitle ? pick(item.subtitle).text : '' }}</span>
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
        <span class="zh">{{ pick(g.title).text }}</span>
      </RouterLink>
    </div>
  </nav>
</template>
