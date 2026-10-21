/**
 * 站点外壳：主题三态、语言切换、示例与站点的样式隔离、无障碍与移动端。
 *
 * 隔离是这里最容易被悄悄破坏的一条：站点一旦用 ConfigProvider / LocaleProvider
 * 把自己的偏好「下发」给整棵树，示例里自己的 Provider 就失效了 —— 用户看到的
 * 示例行为和他们复制回去跑出来的不一样。所以这里用静态源码约束把它钉住。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createApp, nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import TopBar from '../src/components/site/TopBar.vue';
import { categoryLabel, provideSiteLocale, useSiteLocale } from '../src/composables/locale';
import { setupTheme, useThemeMode } from '../src/composables/theme';
import SiteLayout from '../src/layouts/SiteLayout.vue';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, '../src');
const readSrc = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');

describe('主题：三态切换与持久化', () => {
  it('light / dark / system 都落到 <html data-apollo-theme>', async () => {
    setupTheme();
    const { setMode } = useThemeMode();

    setMode('light');
    await nextTick();
    expect(document.documentElement.dataset.apolloTheme).toBeUndefined();

    setMode('dark');
    await nextTick();
    expect(document.documentElement.dataset.apolloTheme).toBe('dark');

    setMode('system');
    await nextTick();
    // jsdom 的 matchMedia 恒为 false ⇒ system 解析为亮色
    expect(document.documentElement.dataset.apolloTheme).toBeUndefined();
  });

  it('选择被持久化（刷新后不回弹）', () => {
    useThemeMode().setMode('dark');
    expect(localStorage.getItem('apollo-site-theme')).toBe('dark');
  });

  it('同步 theme-color meta（移动端地址栏跟随）', async () => {
    // ⚠️ 必须先切到 light 再切 dark：watchEffect 只在**值变化**时重跑，
    //    连续两次 setMode('dark') 不会触发 apply，meta 也就不会被重建。
    useThemeMode().setMode('light');
    await nextTick();
    useThemeMode().setMode('dark');
    await nextTick();
    expect(document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content).toBe(
      '#000000',
    );
    useThemeMode().setMode('light');
    await nextTick();
    expect(document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content).toBe(
      '#ffffff',
    );
  });

  it('切换按钮在 DOM 上可定位（不依赖会变的 title 文案）', async () => {
    const wrapper = await mountTopBar();
    expect(wrapper.find('.site-theme-toggle').exists()).toBe(true);
    expect(wrapper.find('.site-lang-toggle').exists()).toBe(true);
    expect(wrapper.find('.site-mobile-toggle').exists()).toBe(true);
    wrapper.unmount();
  });
});

describe('语言：站点 chrome 与组件库 LocaleProvider 是两回事', () => {
  it('setLocale 同步 <html lang> 并持久化', () => {
    const app = createApp({});
    provideSiteLocale(app);
    const state = useSiteLocale();
    state.setLocale('en-US');
    expect(document.documentElement.lang).toBe('en-US');
    expect(localStorage.getItem('apollo-site-locale')).toBe('en-US');
    state.setLocale('zh-CN');
    expect(document.documentElement.lang).toBe('zh-CN');
  });

  it('pick 在缺英文时给出中文并标记 fallback（调用方据此提示）', () => {
    const state = useSiteLocale();
    state.setLocale('en-US');
    expect(state.pick({ zh: '按钮', en: '按钮', enFallback: true })).toEqual({
      text: '按钮',
      fallback: true,
    });
    expect(state.pick({ zh: '按钮', en: 'Button', enFallback: false })).toEqual({
      text: 'Button',
      fallback: false,
    });
  });
});

describe('样式隔离：站点令牌不得污染示例', () => {
  it('站点样式只定义 --site-* 令牌，不重新定义 --apollo-*', () => {
    const css = readSrc('styles/site.css');
    expect(css).toMatch(/--site-/);
    // 允许**读取**组件令牌（画布要跟随组件库的文本色），但不允许**声明**它
    const declarations = css.match(/^\s*--apollo-[a-z0-9-]+\s*:/gim) ?? [];
    expect(declarations).toEqual([]);
  });

  it('示例画布走组件库令牌（--apollo-*），与发布产物视觉一致', () => {
    const preview = readSrc('components/demo/DemoPreview.vue');
    expect(preview).toMatch(/demo-canvas[\s\S]{0,400}--apollo-/);
  });

  it('站点入口不引入 ConfigProvider / LocaleProvider（不向示例下发偏好）', () => {
    for (const rel of ['App.vue', 'main.ts']) {
      const src = readSrc(rel);
      expect(src, rel).not.toMatch(/ConfigProvider|LocaleProvider/);
    }
  });

  it('尊重 prefers-reduced-motion', () => {
    expect(readSrc('styles/site.css')).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });
});

describe('无障碍与移动端', () => {
  it('顶栏导航有 aria-label，移动端抽屉按钮有可访问名', async () => {
    const wrapper = await mountTopBar();
    expect(wrapper.find('nav').attributes('aria-label')).toBeTruthy();
    expect(wrapper.find('.site-mobile-toggle').attributes('aria-label')).toBeTruthy();
    expect(wrapper.find('.site-mobile-toggle').attributes('aria-label')).not.toBe('');
    wrapper.unmount();
  });

  it('搜索触发按钮给出快捷键提示（kbd）', async () => {
    const wrapper = await mountTopBar();
    expect(wrapper.find('.site-search-trigger kbd').text()).toBe('/');
    wrapper.unmount();
  });

  it('抽屉按钮点击上报 toggleMenu（移动端展开由外层布局接管）', async () => {
    const wrapper = await mountTopBar();
    await wrapper.find('.site-mobile-toggle').trigger('click');
    expect(wrapper.emitted('toggleMenu')).toBeTruthy();
    wrapper.unmount();
  });

  it('抽屉按钮暴露展开态与受控目标（aria-expanded / aria-controls）', async () => {
    const wrapper = await mountTopBar({ menuOpen: true });
    const btn = wrapper.find('.site-mobile-toggle');
    expect(btn.attributes('aria-expanded')).toBe('true');
    expect(btn.attributes('aria-controls')).toBe('site-mobile-drawer');
    wrapper.unmount();
  });

  it('移动抽屉：Escape 关闭并把焦点归还给触发元素', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    });
    router.push('/');
    await router.isReady();
    const trigger = document.createElement('button');
    trigger.textContent = 'open';
    document.body.appendChild(trigger);
    trigger.focus();

    const wrapper = mount(SiteLayout, {
      global: { plugins: [router] },
      slots: { default: '<div>content</div>' },
      attachTo: document.body,
    });
    await nextTick();
    await wrapper.find('.site-mobile-toggle').trigger('click');
    await nextTick();
    expect(wrapper.find('#site-mobile-drawer').exists()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();
    expect(wrapper.find('#site-mobile-drawer').exists()).toBe(false);
    expect(document.activeElement).toBe(trigger);

    wrapper.unmount();
    trigger.remove();
  });
});

describe('站点 chrome 的国际化（2026-10-21 审计 A09）', () => {
  it('英文站分类名走英文词典，未知分类原样保留', () => {
    expect(categoryLabel('数据录入', 'en-US')).toBe('Data Entry');
    expect(categoryLabel('数据展示', 'en-US')).toBe('Data Display');
    expect(categoryLabel('数据录入', 'zh-CN')).toBe('数据录入');
    expect(categoryLabel('未知分类', 'en-US')).toBe('未知分类');
  });

  it('主题按钮的 aria-label 随语言切换（不再写死中文）', async () => {
    const state = useSiteLocale();
    state.setLocale('en-US');
    const wrapper = await mountTopBar();
    expect(wrapper.find('.site-theme-toggle').attributes('aria-label')).toContain('Theme');
    wrapper.unmount();
    state.setLocale('zh-CN');
  });
});

/** TopBar 用 useRouter / RouterLink，必须有**真** router（provide 假对象会炸在模板里）。 */
async function mountTopBar(props: Record<string, unknown> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  });
  router.push('/');
  await router.isReady();
  const wrapper = mount(TopBar, { props, global: { plugins: [router] } });
  await nextTick();
  return wrapper;
}
