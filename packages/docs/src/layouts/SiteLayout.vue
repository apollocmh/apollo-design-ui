<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import SideNav from '../components/site/SideNav.vue';
import SiteFooter from '../components/site/SiteFooter.vue';
import TocNav from '../components/site/TocNav.vue';
import TopBar from '../components/site/TopBar.vue';
import { useSiteLocale } from '../composables/locale';
import { useTocState } from '../composables/toc';

const route = useRoute();
const { t } = useSiteLocale();
const { items } = useTocState();
const drawerOpen = ref(false);
const drawer = ref<HTMLElement | null>(null);
let restoreFocus: HTMLElement | null = null;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(): HTMLElement[] {
  return drawer.value ? Array.from(drawer.value.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
}

function onDrawerKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault();
    drawerOpen.value = false;
    return;
  }
  if (e.key !== 'Tab') return;
  const list = focusables();
  if (list.length === 0) return;
  const first = list[0];
  const last = list[list.length - 1];
  if (!first || !last) return;
  const active = document.activeElement as HTMLElement | null;
  const inside = active ? drawer.value?.contains(active) : false;
  if (e.shiftKey && (active === first || !inside)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

watch(drawerOpen, async (open) => {
  if (open) {
    restoreFocus = document.activeElement as HTMLElement | null;
    document.addEventListener('keydown', onDrawerKeydown);
    await nextTick();
    focusables()[0]?.focus();
    return;
  }
  document.removeEventListener('keydown', onDrawerKeydown);
  restoreFocus?.focus();
  restoreFocus = null;
});

// 路由变化收起移动端抽屉
watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false;
  },
);

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onDrawerKeydown);
});

const showNav = computed(() => route.name !== 'home');
</script>

<template>
  <div class="site-shell">
    <TopBar :menu-open="drawerOpen" @toggle-menu="drawerOpen = !drawerOpen" />
    <main class="site-main">
      <aside v-if="showNav" class="site-sidebar">
        <SideNav />
      </aside>
      <div class="site-content">
        <slot />
      </div>
      <TocNav :items="items" />
      <aside v-if="showNav && items.length === 0" class="site-toc site-toc-placeholder" aria-hidden="true" />
    </main>
    <SiteFooter />

    <!-- 移动端抽屉 -->
    <template v-if="drawerOpen">
      <div class="site-drawer-mask" @click="drawerOpen = false" />
      <nav
        id="site-mobile-drawer"
        ref="drawer"
        class="site-drawer"
        role="dialog"
        aria-modal="true"
        :aria-label="t('mobileNav')"
      >
        <SideNav @navigate="drawerOpen = false" />
      </nav>
    </template>
  </div>
</template>
