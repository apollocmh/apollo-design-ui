import { createHead, renderDOMHead } from '@unhead/vue/client';
import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import { computed, defineComponent, h, nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { setLocaleOverride, useSiteLocale } from '../src/composables/locale';
import { useSeo } from '../src/composables/seo';

it('keeps the real Head language aligned with saved, selected and temporary site locale', async () => {
  const locale = useSiteLocale();
  locale.setLocale('en-US');
  const head = createHead();
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/guide/theming', component: { render: () => null } }],
  });
  await router.push('/guide/theming');
  await router.isReady();
  const Probe = defineComponent({
    setup() {
      useSeo(
        computed(() => locale.locale.value),
        computed(() => 'Theme guide'),
      );
      return () => h('p', locale.locale.value);
    },
  });
  const wrapper = mount(Probe, { global: { plugins: [router, head] } });
  try {
    await renderDOMHead(head);
    expect(wrapper.text()).toBe('en-US');
    expect(document.documentElement.lang).toBe('en-US');
    locale.setLocale('zh-CN');
    await nextTick();
    await renderDOMHead(head);
    expect(document.documentElement.lang).toBe('zh-CN');
    setLocaleOverride('en-US');
    await nextTick();
    await renderDOMHead(head);
    expect(document.documentElement.lang).toBe('en-US');
    expect(localStorage.getItem('apollo-site-locale')).toBe('zh-CN');
    setLocaleOverride(null);
    await nextTick();
    await renderDOMHead(head);
    expect(document.documentElement.lang).toBe('zh-CN');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://apollocmh.github.io/apollo-design-ui/guide/theming',
    );
  } finally {
    wrapper.unmount();
    setLocaleOverride(null);
    locale.setLocale('zh-CN');
    await renderDOMHead(head);
  }
});
