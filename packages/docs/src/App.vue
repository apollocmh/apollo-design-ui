<script setup lang="ts">
import { ConfigProvider } from '@apollo-design/ui';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useSiteTheme } from './composables/theme';
import SiteLayout from './layouts/SiteLayout.vue';

const route = useRoute();
const ready = ref(false);
const { theme: selectedTheme } = useSiteTheme();
const theme = computed(() => (ready.value ? selectedTheme.value : undefined));
onMounted(() => {
  ready.value = true;
});
// bare 布局 = 独立示例页（无站点 chrome，供 iframe 与新窗口使用）
const chrome = computed(() => (route.meta.chrome as string) ?? 'site');
</script>

<template>
  <ConfigProvider :theme="theme">
    <SiteLayout v-if="chrome === 'site'">
      <RouterView />
    </SiteLayout>
    <RouterView v-else />
  </ConfigProvider>
</template>
