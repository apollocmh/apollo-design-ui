<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import SideNav from '../components/site/SideNav.vue';
import SiteFooter from '../components/site/SiteFooter.vue';
import TocNav from '../components/site/TocNav.vue';
import TopBar from '../components/site/TopBar.vue';
import { useTocState } from '../composables/toc';

const route = useRoute();
const { items } = useTocState();
const drawerOpen = ref(false);

// 路由变化收起移动端抽屉
watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false;
  },
);

const showNav = computed(() => route.name !== 'home');
</script>

<template>
  <div class="site-shell">
    <TopBar @toggle-menu="drawerOpen = !drawerOpen" />
    <main class="site-main">
      <aside v-if="showNav" class="site-sidebar">
        <SideNav />
      </aside>
      <div class="site-content">
        <slot />
      </div>
      <TocNav :items="items" />
    </main>
    <SiteFooter />

    <!-- 移动端抽屉 -->
    <template v-if="drawerOpen">
      <div class="site-drawer-mask" @click="drawerOpen = false" />
      <nav class="site-drawer" aria-label="移动端导航">
        <SideNav @navigate="drawerOpen = false" />
      </nav>
    </template>
  </div>
</template>
