<script setup lang="ts">
import {
  DesktopOutlined,
  GithubOutlined,
  MenuOutlined,
  MoonOutlined,
  SearchOutlined,
  SunOutlined,
} from '@apollo-design/icons';
import { Button } from '@apollo-design/ui';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { type SiteTextKey, useSiteLocale } from '../../composables/locale';
import { siteManifest } from '../../composables/manifest';
import { type ThemeMode, useThemeMode } from '../../composables/theme';
import SearchModal from './SearchModal.vue';

defineProps<{ menuOpen?: boolean }>();
defineEmits<{ toggleMenu: [] }>();

const router = useRouter();
const { t, locale, setLocale } = useSiteLocale();
const { mode, setMode } = useThemeMode();

const searchOpen = ref(false);
const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;
let searchIndexReady = false;
let searchIndexLoading = false;

function openSearch(): void {
  searchOpen.value = true;
  void useSearchOnce();
}

async function useSearchOnce(): Promise<void> {
  // 失败时不能把「已就绪」永久置 true —— 否则一次网络抖动之后，
  // 搜索面板再也不会重新加载索引（2026-10-21 审计 A10）。
  if (searchIndexReady || searchIndexLoading) return;
  searchIndexLoading = true;
  try {
    const { useSearch } = await import('../../composables/search');
    await useSearch().ensureIndex();
    searchIndexReady = true;
  } catch {
    searchIndexReady = false;
  } finally {
    searchIndexLoading = false;
  }
}

onMounted(() => {
  // 快捷键：/ 或 Cmd/Ctrl+K 呼出搜索
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
});

function onKeydown(e: KeyboardEvent): void {
  const target = e.target as HTMLElement | null;
  const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
  if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
    e.preventDefault();
    openSearch();
  }
}

function onSearchNavigate(path: string): void {
  searchOpen.value = false;
  void router.push(path);
}

const themeOptions = [
  { value: 'light', labelKey: 'themeLight', icon: SunOutlined },
  { value: 'dark', labelKey: 'themeDark', icon: MoonOutlined },
  { value: 'system', labelKey: 'themeSystem', icon: DesktopOutlined },
] as const satisfies ReadonlyArray<{
  value: ThemeMode;
  labelKey: SiteTextKey;
  icon: unknown;
}>;

const currentTheme = computed(
  () => themeOptions.find((o) => o.value === mode.value) ?? themeOptions[0],
);

function cycleTheme(): void {
  const i = themeOptions.findIndex((o) => o.value === mode.value);
  const next = themeOptions[(i + 1) % themeOptions.length] ?? themeOptions[0];
  setMode(next.value);
}

function toggleLocale(): void {
  setLocale(locale.value === 'zh-CN' ? 'en-US' : 'zh-CN');
}
</script>

<template>
  <header class="site-topbar">
    <Button
      class="site-icon-btn site-mobile-toggle"
      type="text"
      shape="circle"
      :aria-label="t('menu')"
      :aria-expanded="menuOpen === true"
      aria-controls="site-mobile-drawer"
      @click="$emit('toggleMenu')"
    >
      <template #icon><MenuOutlined /></template>
    </Button>

    <RouterLink to="/" class="site-logo">
      <img :src="logoSrc" alt="" />
      <span>Apollo Design</span>
    </RouterLink>

    <nav class="site-topbar-nav" :aria-label="t('mainNav')">
      <RouterLink to="/components" :class="{ 'router-link-active': $route.path.startsWith('/components') }">
        {{ t('components') }}
      </RouterLink>
      <RouterLink to="/guide/getting-started" :class="{ 'router-link-active': $route.path.startsWith('/guide') }">
        {{ t('docs') }}
      </RouterLink>
      <RouterLink to="/changelog">{{ t('changelog') }}</RouterLink>
      <a :href="siteManifest.repoUrl" target="_blank" rel="noopener noreferrer">{{ t('github') }}</a>
    </nav>

    <div class="site-topbar-actions">
      <Button class="site-search-trigger" type="default" @click="openSearch">
        <template #icon><SearchOutlined /></template>
        <span class="site-search-label">{{ t('search') }}</span>
        <kbd>/</kbd>
      </Button>

      <Button
        class="site-icon-btn site-lang-toggle"
        type="text"
        shape="circle"
        :aria-label="locale === 'zh-CN' ? t('switchToEnglish') : t('switchToChinese')"
        :title="locale === 'zh-CN' ? 'English' : '中文'"
        @click="toggleLocale"
      >
        <span class="site-lang-text">{{ locale === 'zh-CN' ? 'En' : '中' }}</span>
      </Button>

      <Button
        class="site-icon-btn site-theme-toggle"
        type="text"
        shape="circle"
        :aria-label="`${t('theme')}: ${t(currentTheme.labelKey)}`"
        :title="t(currentTheme.labelKey)"
        @click="cycleTheme"
      >
        <template #icon>
          <component :is="currentTheme.icon" />
        </template>
      </Button>

      <Button
        class="site-icon-btn site-github-link"
        type="text"
        shape="circle"
        :href="siteManifest.repoUrl"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="t('github')"
        title="GitHub"
      >
        <template #icon><GithubOutlined /></template>
      </Button>
    </div>

    <SearchModal v-if="searchOpen" @close="searchOpen = false" @navigate="onSearchNavigate" />
  </header>
</template>
