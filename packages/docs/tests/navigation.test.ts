import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import SideNav from '../src/components/site/SideNav.vue';
import TopBar from '../src/components/site/TopBar.vue';
import { useSiteLocale } from '../src/composables/locale';
import { sectionForPath } from '../src/composables/navigation';

describe('Issue #87: URL-driven content navigation', () => {
  it.each([
    ['/guide/getting-started', 'docs'],
    ['/guide/themes', 'docs'],
    ['/guide/theming', 'docs'],
    ['/changelog', 'docs'],
    ['/guide/icons', 'icons'],
    ['/guide/icons.html', 'icons'],
    ['/components', 'components'],
    ['/components/button', 'components'],
    ['/components/icon', 'components'],
    ['/components/layout/demo/basic', 'components'],
    ['/unknown', 'docs'],
  ])('%s belongs to %s', (path, expected) => expect(sectionForPath(path)).toBe(expected));

  it('changes desktop and mobile content across direct visits, back/forward and sections', async () => {
    useSiteLocale().setLocale('zh-CN');
    const router = createRouter({
      history: createMemoryHistory('/apollo-design-ui/'),
      routes: [
        { path: '/components', name: 'overview', component: { template: '<div />' } },
        { path: '/components/:name', name: 'component', component: { template: '<div />' } },
        { path: '/guide/:slug', name: 'guide', component: { template: '<div />' } },
        { path: '/changelog', name: 'changelog', component: { template: '<div />' } },
      ],
    });
    await router.push('/components/button');
    const sidebar = mount(SideNav, { global: { plugins: [router] } });
    const mobile = mount(SideNav, { props: { mobile: true }, global: { plugins: [router] } });
    const topbar = mount(TopBar, { global: { plugins: [router] } });
    expect(topbar.findAll('.site-topbar-nav a').map((link) => link.text())).toEqual([
      '文档',
      '组件',
      '图标',
    ]);
    expect(sidebar.find('[href="/apollo-design-ui/guide/getting-started"]').exists()).toBe(false);
    expect(sidebar.find('[href="/apollo-design-ui/components/button"]').classes()).toContain(
      'active',
    );
    await router.push('/guide/themes');
    expect(sidebar.find('[href="/apollo-design-ui/components/button"]').exists()).toBe(false);
    expect(sidebar.find('[href="/apollo-design-ui/changelog"]').exists()).toBe(true);
    expect(sidebar.find('[href="/apollo-design-ui/guide/icons"]').exists()).toBe(false);
    expect(mobile.findAll('.site-mobile-sections a')).toHaveLength(3);
    expect(topbar.find('.site-topbar-nav [aria-current="page"]').text()).toBe('文档');
    await router.push('/guide/icons');
    expect(sidebar.findAll('.site-side-link')).toHaveLength(2);
    expect(topbar.find('.site-topbar-nav [aria-current="page"]').text()).toBe('图标');
    router.back();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextTick();
    expect(topbar.find('.site-topbar-nav [aria-current="page"]').text()).toBe('文档');
    router.forward();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextTick();
    expect(topbar.find('.site-topbar-nav [aria-current="page"]').text()).toBe('图标');
    sidebar.unmount();
    mobile.unmount();
    topbar.unmount();
  });
});
