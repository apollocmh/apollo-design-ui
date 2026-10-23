/**
 * 站点界面语言（zh-CN / en-US）。
 *
 * 与组件库 LocaleProvider 是两回事：这里管的是**官网 chrome**（导航、工具栏、提示）
 * 和组件文档内容的选择；组件示例内部文案由示例自己（或用户示例里的 LocaleProvider）决定。
 */
import { type App, computed, type InjectionKey, inject, ref } from 'vue';
import type { Bilingual } from '../types/manifest';

export type SiteLocale = 'zh-CN' | 'en-US';

const STORAGE_KEY = 'apollo-site-locale';
const locale = ref<SiteLocale>('zh-CN');
let initialized = false;

const DICT = {
  'zh-CN': {
    design: '设计',
    docs: '文档',
    components: '组件',
    changelog: '更新日志',
    resources: '资源',
    iconGallery: '图标',
    github: 'GitHub',
    search: '搜索组件…',
    searchShort: '搜索',
    noResults: '没有匹配的结果',
    searchHint: '回车打开第一个结果，↑↓ 选择，Esc 关闭',
    groupComponent: '组件',
    groupDemo: '代码演示',
    groupGuide: '指南',
    overview: '组件总览',
    liveDemo: '实时示例',
    whenToUse: '何时使用',
    api: 'API',
    onThisPage: '本页目录',
    expandCode: '展开代码',
    collapseCode: '收起代码',
    copy: '复制代码',
    copied: '复制成功',
    copyFailed: '复制失败',
    reset: '重置示例',
    openStandalone: '新窗口打开',
    editOnGithub: '在 GitHub 中编辑',
    loading: '加载中…',
    demoError: '示例加载失败',
    retry: '重试',
    fallbackHint: '该内容暂无英文译文，以下为中文原文。',
    backToDoc: '返回文档',
    version: '版本',
    builtAt: '构建时间',
    notFoundTitle: '404',
    notFoundText: '页面不存在或已被移动。',
    backHome: '返回首页',
    menu: '导航菜单',
    mainNav: '主导航',
    componentNav: '组件分类导航',
    mobileNav: '移动端导航',
    theme: '主题',
    themeLight: '亮色',
    themeDark: '暗色',
    themeSystem: '跟随系统',
    switchToEnglish: '切换到英文',
    switchToChinese: '切换到中文',
    searchError: '搜索索引加载失败',
    fullscreen: '单列',
    autoLayout: '自动布局',
    split: '双列',
  },
  'en-US': {
    design: 'Design',
    docs: 'Docs',
    components: 'Components',
    changelog: 'Changelog',
    resources: 'Resources',
    iconGallery: 'Icons',
    github: 'GitHub',
    search: 'Search components…',
    searchShort: 'Search',
    noResults: 'No results',
    searchHint: 'Enter opens the first result, ↑↓ to select, Esc to close',
    groupComponent: 'Components',
    groupDemo: 'Demos',
    groupGuide: 'Guides',
    overview: 'Overview',
    liveDemo: 'Live demo',
    whenToUse: 'When To Use',
    api: 'API',
    onThisPage: 'On this page',
    expandCode: 'Show code',
    collapseCode: 'Hide code',
    copy: 'Copy code',
    copied: 'Copied',
    copyFailed: 'Copy failed',
    reset: 'Reset demo',
    openStandalone: 'Open in new window',
    editOnGithub: 'Edit on GitHub',
    loading: 'Loading…',
    demoError: 'Failed to load demo',
    retry: 'Retry',
    fallbackHint: 'No English translation yet — showing the Chinese original.',
    backToDoc: 'Back to doc',
    version: 'Version',
    builtAt: 'Built at',
    notFoundTitle: '404',
    notFoundText: 'This page does not exist or has been moved.',
    backHome: 'Back home',
    menu: 'Menu',
    mainNav: 'Main navigation',
    componentNav: 'Component navigation',
    mobileNav: 'Mobile navigation',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    switchToEnglish: 'Switch to English',
    switchToChinese: 'Switch to Chinese',
    searchError: 'Failed to load search index',
    fullscreen: 'Single column',
    autoLayout: 'Auto layout',
    split: 'Split',
  },
} as const;

export type SiteTextKey = keyof (typeof DICT)['zh-CN'];

/**
 * 分类名与界面语言解耦：manifest 里的 category 是中文真源（与组件文档
 * frontmatter 一致），英文站按固定词典翻译。新增分类时必须同时补这里。
 */
const CATEGORY_EN: Record<string, string> = {
  通用: 'General',
  布局: 'Layout',
  导航: 'Navigation',
  数据录入: 'Data Entry',
  数据展示: 'Data Display',
  反馈: 'Feedback',
  其他: 'Other',
};

export function categoryLabel(name: string, current: SiteLocale): string {
  return current === 'en-US' ? (CATEGORY_EN[name] ?? name) : name;
}

/** 初始化（客户端启动时；SSR 下保持默认 zh-CN）。 */
export function initSiteLocale(): void {
  if (initialized) return;
  initialized = true;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'zh-CN' || saved === 'en-US') locale.value = saved;
  // URL 带 ?lang=en-US 时优先生效（分享链接场景）
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'zh-CN' || q === 'en-US') {
    locale.value = q;
    localStorage.setItem(STORAGE_KEY, q);
  }
}

const SITE_LOCALE_KEY: InjectionKey<ReturnType<typeof createLocaleState>> = Symbol('site-locale');

function createLocaleState() {
  return {
    locale,
    setLocale(next: SiteLocale): void {
      locale.value = next;
      if (typeof localStorage === 'object') localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
    },
    /** UI 词典。 */
    t(key: SiteTextKey): string {
      return DICT[locale.value][key];
    },
    /** 双语字段取值（缺失侧显式回退，调用方可用 enFallback 提示）。 */
    pick<T extends { zh: string; en: string }>(
      value: T | undefined,
    ): { text: string; fallback: boolean } {
      if (!value) return { text: '', fallback: false };
      return locale.value === 'zh-CN'
        ? { text: value.zh, fallback: false }
        : { text: value.en, fallback: Boolean((value as unknown as Bilingual).enFallback) };
    },
  };
}

export function provideSiteLocale(app: App): void {
  app.provide(SITE_LOCALE_KEY, createLocaleState());
}

export function useSiteLocale() {
  // 测试/独立渲染兜底：无 provider 时创建临时状态
  return inject(SITE_LOCALE_KEY) ?? createLocaleState();
}

/** 当前语言的 computed 便捷读取。 */
export function useLocaleValue() {
  const state = useSiteLocale();
  return computed(() => state.locale.value);
}
