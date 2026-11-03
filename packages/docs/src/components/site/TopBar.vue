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
import { useRoute, useRouter } from 'vue-router';
import { type SiteTextKey, useSiteLocale } from '../../composables/locale';
import { siteManifest } from '../../composables/manifest';
import { sectionForPath, sectionLinks } from '../../composables/navigation';
import { useSearch } from '../../composables/search';
import {
  type SitePreset,
  type ThemeMode,
  useThemeMode,
  useThemePreset,
} from '../../composables/theme';
import SearchModal from './SearchModal.vue';

defineProps<{ menuOpen?: boolean }>();
defineEmits<{ toggleMenu: [] }>();

const router = useRouter();
const route = useRoute();
const section = computed(() => sectionForPath(route.path));
const { t, locale, setLocale } = useSiteLocale();
const { mode, setMode } = useThemeMode();
const { preset, setPreset } = useThemePreset();
const themeReady = ref(false);
const themePicker = ref<HTMLDetailsElement | null>(null);
const themeTrigger = ref<HTMLElement | null>(null);
const modeValue = computed<ThemeMode>({
  get: () => (themeReady.value ? mode.value : 'system'),
  set: setMode,
});
const presetValue = computed<SitePreset>({
  get: () => (themeReady.value ? preset.value : 'default'),
  set: setPreset,
});

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
    await useSearch().ensureIndex();
    searchIndexReady = true;
  } catch {
    searchIndexReady = false;
  } finally {
    searchIndexLoading = false;
  }
}

onMounted(() => {
  themeReady.value = true;
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
  () => themeOptions.find((o) => o.value === modeValue.value) ?? themeOptions[0],
);

function closeThemePicker(): void {
  if (themePicker.value) themePicker.value.open = false;
  themeTrigger.value?.focus();
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

    <RouterLink to="/" class="site-logo" aria-label="Apollo Design">
      <img :src="logoSrc" alt="" />
      <span>Apollo Design</span>
    </RouterLink>

    <Button class="site-search-trigger" type="text" @click="openSearch">
      <template #icon><SearchOutlined /></template>
      <span class="site-search-label">{{ t('search') }}</span>
      <kbd>/</kbd>
    </Button>

    <nav class="site-topbar-nav" :aria-label="t('mainNav')">
      <RouterLink
        v-for="link in sectionLinks"
        :key="link.section"
        :to="link.to"
        :class="{ 'router-link-active': section === link.section }"
        :aria-current="section === link.section ? 'page' : undefined"
      >
        {{ t(link.key) }}
      </RouterLink>
    </nav>

    <div class="site-topbar-actions">
      <span class="site-version">v{{ siteManifest.apolloVersion }}</span>

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

      <details ref="themePicker" class="site-theme-picker" @keydown.esc.stop.prevent="closeThemePicker">
        <summary
          ref="themeTrigger"
          class="site-icon-btn site-theme-toggle"
          :aria-label="`${t('theme')}: ${presetValue}, ${t(currentTheme.labelKey)}`"
          :title="t('theme')"
        >
          <component :is="currentTheme.icon" />
        </summary>
        <div class="site-theme-options">
          <label>
            {{ t('themePreset') }}
            <select v-model="presetValue" class="site-preset-select">
              <option value="default">{{ t('themeDefault') }}</option>
              <option value="mono">{{ t('themeMono') }}</option>
              <option value="material3">{{ t('themeMaterial') }}</option>
            </select>
          </label>
          <label>
            {{ t('themeAppearance') }}
            <select v-model="modeValue" class="site-mode-select">
              <option v-for="option in themeOptions" :key="option.value" :value="option.value">
                {{ t(option.labelKey) }}
              </option>
            </select>
          </label>
        </div>
      </details>

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
