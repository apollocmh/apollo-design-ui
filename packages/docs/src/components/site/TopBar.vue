<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { siteManifest } from '../../composables/manifest';
import { useSiteLocale } from '../../composables/locale';
import { useThemeMode, type ThemeMode } from '../../composables/theme';
import SearchModal from './SearchModal.vue';

defineEmits<{ toggleMenu: [] }>();

const router = useRouter();
const { t, locale, setLocale } = useSiteLocale();
const { mode, setMode } = useThemeMode();

const searchOpen = ref(false);
let searchIndexReady = false;

function openSearch(): void {
  searchOpen.value = true;
  if (!searchIndexReady) {
    searchIndexReady = true;
    void useSearchOnce();
  }
}

async function useSearchOnce() {
  const { useSearch } = await import('../../composables/search');
  const { ensureIndex } = useSearch();
  await ensureIndex();
}

onMounted(() => {
  // 快捷键：/ 或 Cmd/Ctrl+K 呼出搜索
  window.addEventListener('keydown', onKeydown);
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

const themeOptions: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { value: 'light', label: '亮色', icon: '☀' },
  { value: 'dark', label: '暗色', icon: '🌙' },
  { value: 'system', label: '跟随系统', icon: '🖥' },
];

function cycleTheme(): void {
  const i = themeOptions.findIndex((o) => o.value === mode.value);
  setMode(themeOptions[(i + 1) % themeOptions.length]!.value);
}

function toggleLocale(): void {
  setLocale(locale.value === 'zh-CN' ? 'en-US' : 'zh-CN');
}
</script>

<template>
  <header class="site-topbar">
    <button class="site-icon-btn site-mobile-toggle" type="button" :aria-label="t('menu')" @click="$emit('toggleMenu')">☰</button>

    <RouterLink to="/" class="site-logo">
      <img src="/logo.svg" alt="" />
      <span>Apollo Design</span>
    </RouterLink>

    <nav class="site-topbar-nav" aria-label="主导航">
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
      <button class="site-search-trigger" type="button" @click="openSearch">
        <span aria-hidden="true">⌕</span>
        <span>{{ t('search') }}</span>
        <kbd>/</kbd>
      </button>

      <button
        class="site-icon-btn site-lang-toggle"
        type="button"
        :aria-label="locale === 'zh-CN' ? 'Switch to English' : '切换到中文'"
        :title="locale === 'zh-CN' ? 'English' : '中文'"
        @click="toggleLocale"
      >
        <span style="font-size: 12.5px; font-weight: 600">{{ locale === 'zh-CN' ? 'En' : '中' }}</span>
      </button>

      <button
        class="site-icon-btn site-theme-toggle"
        type="button"
        :aria-label="`主题：${themeOptions.find((o) => o.value === mode)?.label}`"
        :title="themeOptions.find((o) => o.value === mode)?.label"
        @click="cycleTheme"
      >
        {{ themeOptions.find((o) => o.value === mode)?.icon }}
      </button>

      <a
        class="site-icon-btn"
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
