/** The Docs app explicitly loads its three public presets; library consumers need only one. */
import type { ThemeConfig, ThemeMode } from '@apollo-design/theme';
import { defaultPreset } from '@apollo-design/theme/presets/default';
import { material3Preset } from '@apollo-design/theme/presets/material3';
import { monoPreset } from '@apollo-design/theme/presets/mono';
import { computed, ref, watchEffect } from 'vue';

export type { ThemeMode };
export type SitePreset = 'default' | 'mono' | 'material3';
export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}
export function isSitePreset(value: unknown): value is SitePreset {
  return value === 'default' || value === 'mono' || value === 'material3';
}
const presets = { default: defaultPreset, mono: monoPreset, material3: material3Preset };
const mode = ref<ThemeMode>('system');
const preset = ref<SitePreset>('default');
const systemDark = ref(false);
const themeOverride = ref<ThemeMode | null>(null);
const presetOverride = ref<SitePreset | null>(null);
const selectedMode = computed(() => themeOverride.value ?? mode.value);
const selectedPreset = computed(() => presetOverride.value ?? preset.value);
const resolvedTheme = computed<'light' | 'dark'>(() =>
  selectedMode.value === 'system' ? (systemDark.value ? 'dark' : 'light') : selectedMode.value,
);
const theme = computed<ThemeConfig>(() => ({
  preset: presets[selectedPreset.value],
  mode: selectedMode.value,
}));
let started = false;

/** Storage may be unavailable in embedded/private browsing; in-memory selection still works. */
function readSaved(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function save(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Apollo Docs could not persist the theme preference.', error);
  }
}
/** Called once by the client entry; SSR never reads browser preferences. */
export function setupTheme(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  const savedMode = readSaved('apollo-site-theme');
  const savedPreset = readSaved('apollo-site-preset');
  if (isThemeMode(savedMode)) mode.value = savedMode;
  if (isSitePreset(savedPreset)) preset.value = savedPreset;
  // Match index.html's pre-paint selection. Standalone query values are temporary.
  if (/\/components\/[^/]+\/demo\/[^/]+/.test(location.pathname)) {
    const query = new URLSearchParams(location.search);
    const queryMode = query.get('theme');
    const queryPreset = query.get('preset');
    if (isThemeMode(queryMode)) themeOverride.value = queryMode;
    if (isSitePreset(queryPreset)) presetOverride.value = queryPreset;
  }
  const media = matchMedia('(prefers-color-scheme: dark)');
  systemDark.value = media.matches;
  media.addEventListener('change', () => {
    systemDark.value = media.matches;
  });
  window.addEventListener('storage', (event) => {
    if (event.key === 'apollo-site-theme')
      mode.value = isThemeMode(event.newValue) ? event.newValue : 'system';
    if (event.key === 'apollo-site-preset')
      preset.value = isSitePreset(event.newValue) ? event.newValue : 'default';
  });
  watchEffect(apply, { flush: 'sync' });
}
function apply(): void {
  const root = document.documentElement;
  root.dataset.apolloPreset = selectedPreset.value;
  root.dataset.apolloTheme = selectedMode.value;
  // Internal resolved state for syntax highlighting; public theme mode remains system.
  root.dataset.apolloAppearance = resolvedTheme.value;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = resolvedTheme.value === 'dark' ? '#000000' : '#ffffff';
}
export function useThemeMode() {
  const setMode = (next: ThemeMode): void => {
    mode.value = next;
    save('apollo-site-theme', next);
  };
  return { mode, setMode };
}
export function useThemePreset() {
  const setPreset = (next: SitePreset): void => {
    preset.value = next;
    save('apollo-site-preset', next);
  };
  return { preset, setPreset };
}
/** Shared source configuration for the site, inline demos and frame messages. */
export function useSiteTheme() {
  return { preset: selectedPreset, mode: selectedMode, theme };
}
export function useResolvedTheme() {
  return resolvedTheme;
}
/** Query/frame control does not replace the user's saved selection. */
export function setThemeOverride(next: ThemeMode | null): void {
  themeOverride.value = next;
}
export function setPresetOverride(next: SitePreset | null): void {
  presetOverride.value = next;
}
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
