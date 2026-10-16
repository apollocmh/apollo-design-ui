<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import SiteLayout from './layouts/SiteLayout.vue';

const route = useRoute();
// bare 布局 = 独立示例页（无站点 chrome，供 iframe 与新窗口使用）
const chrome = computed(() => (route.meta.chrome as string) ?? 'site');
</script>

<template>
  <SiteLayout v-if="chrome === 'site'">
    <RouterView />
  </SiteLayout>
  <RouterView v-else />
</template>
