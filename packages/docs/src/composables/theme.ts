/**
 * 站点主题（light / dark / system）。
 *
 * 实现完全复用组件库的令牌作用域机制：`<html data-apollo-theme="dark">`。
 * 站点不引入任何自己的亮暗变量体系 —— 示例与官网同步切换，见 guide/styles。
 */
import { computed, ref, watchEffect } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'apollo-site-theme';
const mode = ref<ThemeMode>('system');
let started = false;

function systemPrefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}

/** 客户端启动时调用一次（SSR 分支不执行）。 */
export function setupTheme(): void {
  if (started) return;
  started = true;
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  if (saved === 'light' || saved === 'dark' || saved === 'system') mode.value = saved;

  const media = matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', () => {
    if (mode.value === 'system') apply();
  });

  watchEffect(apply);
}

function apply(): void {
  const dark = mode.value === 'dark' || (mode.value === 'system' && systemPrefersDark());
  if (dark) {
    document.documentElement.dataset.apolloTheme = 'dark';
  } else {
    delete document.documentElement.dataset.apolloTheme;
  }
  // 内置色块跟随组件库令牌（meta theme-color 让移动端地址栏同色）
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = dark ? '#000000' : '#ffffff';
}

export function useThemeMode() {
  const setMode = (next: ThemeMode): void => {
    mode.value = next;
    if (typeof localStorage === 'object') localStorage.setItem(STORAGE_KEY, next);
  };
  return { mode, setMode };
}

/**
 * 解析后的实际主题（light / dark）。
 *
 * ⚠️ 不读 `document.documentElement.dataset`：iframe 的 `src` 在 SSR / setup
 * 期就要算出来，直接碰 `document` 会在预渲染时炸掉（DOC-04）。这里只用
 * `mode` + 客户端 media query；SSR 下 `matchMedia` 不存在 ⇒ `system` 解析为 light，
 * 客户端水合后再按真实偏好更新。
 */
export function useResolvedTheme() {
  return computed<'light' | 'dark'>(() => {
    if (mode.value === 'system') {
      return typeof matchMedia === 'function' && systemPrefersDark() ? 'dark' : 'light';
    }
    return mode.value;
  });
}

/** 尊重「减少动效」设置（CSS 侧用 media query，JS 动画用这里）。 */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
