<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { categoryLabel, useSiteLocale } from '../../composables/locale';
import { siteManifest } from '../../composables/manifest';
import { sectionForPath, sectionLinks } from '../../composables/navigation';

defineProps<{ mobile?: boolean }>();
defineEmits<{ navigate: [] }>();
const route = useRoute();
const { pick, t, locale } = useSiteLocale();
const section = computed(() => sectionForPath(route.path));
const guides = computed(() =>
  siteManifest.guides
    .filter((guide) => guide.slug !== 'icons')
    .sort(
      (first, second) =>
        (first.slug === 'audit-progress' ? Number.MAX_SAFE_INTEGER : first.order) -
        (second.slug === 'audit-progress' ? Number.MAX_SAFE_INTEGER : second.order),
    ),
);
const activeName = computed(() =>
  route.name === 'component' || route.name === 'standalone-demo'
    ? String(route.params.name ?? '')
    : '',
);
</script>

<template>
  <nav :aria-label="t(section === 'components' ? 'componentNav' : section === 'icons' ? 'iconGallery' : 'docs')">
    <div v-if="mobile" class="site-mobile-sections">
      <RouterLink
        v-for="link in sectionLinks" :key="link.section" :to="link.to"
        :class="{ active: section === link.section }"
        :aria-current="section === link.section ? 'page' : undefined"
        @click="$emit('navigate')"
      >{{ t(link.key) }}</RouterLink>
    </div>
    <template v-if="section === 'components'">
      <RouterLink class="site-side-link" :class="{ active: route.name === 'overview' }" to="/components" @click="$emit('navigate')">{{ t('overview') }}</RouterLink>
      <div v-for="group in siteManifest.categories" :key="group.name" class="site-side-group">
        <div class="site-side-group-title">{{ categoryLabel(group.name, locale) }}</div>
        <RouterLink v-for="item in group.components" :key="item.name" class="site-side-link"
          :class="{ active: item.name === activeName }" :to="`/components/${item.name}`"
          :aria-current="item.name === activeName ? 'page' : undefined" @click="$emit('navigate')">
          <span class="site-side-link-name">{{ pick(item.title).text }}</span>
          <span v-if="pick(item.subtitle).text" class="site-side-link-desc">{{ pick(item.subtitle).text }}</span>
        </RouterLink>
        <RouterLink v-if="group.name === '通用'" class="site-side-link" :class="{ active: route.name === 'icon' }"
          :aria-current="route.name === 'icon' ? 'page' : undefined" to="/components/icon" @click="$emit('navigate')">
          <span class="site-side-link-name">Icon</span><span class="site-side-link-desc">{{ t('iconGallery') }}</span>
        </RouterLink>
      </div>
    </template>
    <template v-else-if="section === 'icons'">
      <div class="site-side-group-title">{{ t('iconGallery') }}</div>
      <RouterLink class="site-side-link active" aria-current="page" to="/guide/icons" @click="$emit('navigate')">{{ locale === 'zh-CN' ? '图标指南' : 'Icon guide' }}</RouterLink>
      <RouterLink class="site-side-link" to="/components/icon" @click="$emit('navigate')">{{ locale === 'zh-CN' ? '图标目录与 API' : 'Icon catalog and API' }}</RouterLink>
    </template>
    <template v-else>
      <div class="site-side-group-title">{{ t('docs') }}</div>
      <RouterLink v-for="guide in guides" :key="guide.slug" class="site-side-link"
        :class="{ active: route.params.slug === guide.slug }"
        :aria-current="route.params.slug === guide.slug ? 'page' : undefined"
        :to="`/guide/${guide.slug}`" @click="$emit('navigate')">
        <span class="site-side-link-name">{{ pick(guide.title).text }}</span>
      </RouterLink>
      <RouterLink class="site-side-link" :class="{ active: route.name === 'changelog' }"
        :aria-current="route.name === 'changelog' ? 'page' : undefined" to="/changelog" @click="$emit('navigate')">{{ t('changelog') }}</RouterLink>
    </template>
  </nav>
</template>
