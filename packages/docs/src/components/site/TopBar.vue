<script setup lang="ts">
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
  { value: 'light', labelKey: 'themeLight', icon: '☀' },
  { value: 'dark', labelKey: 'themeDark', icon: '🌙' },
  { value: 'system', labelKey: 'themeSystem', icon: '🖥' },
] as const satisfies ReadonlyArray<{
  value: ThemeMode;
  labelKey: SiteTextKey;
  icon: string;
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
      :aria-label="t('menu')"
      :aria-expanded="menuOpen === true"
      aria-controls="site-mobile-drawer"
      @click="$emit('toggleMenu')"
    >
      ☰
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
      <Button class="site-search-trigger" type="text" @click="openSearch">
        <span aria-hidden="true">⌕</span>
        <span>{{ t('search') }}</span>
        <kbd>/</kbd>
      </Button>

      <Button
        class="site-icon-btn site-lang-toggle"
        type="text"
        :aria-label="locale === 'zh-CN' ? t('switchToEnglish') : t('switchToChinese')"
        :title="locale === 'zh-CN' ? 'English' : '中文'"
        @click="toggleLocale"
      >
        <span style="font-size: 12.5px; font-weight: 600">{{ locale === 'zh-CN' ? 'En' : '中' }}</span>
      </Button>

      <Button
        class="site-icon-btn site-theme-toggle"
        type="text"
        :aria-label="`${t('theme')}: ${t(currentTheme.labelKey)}`"
        :title="t(currentTheme.labelKey)"
        @click="cycleTheme"
      >
        {{ currentTheme.icon }}
      </Button>

      <a
        class="site-icon-btn site-github-link"
        :href="siteManifest.repoUrl"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="t('github')"
        title="GitHub"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
          />
        </svg>
      </a>
    </div>

    <SearchModal v-if="searchOpen" @close="searchOpen = false" @navigate="onSearchNavigate" />
  </header>
</template>
