/** F05: template content is separate from animated numeric counts. */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Badge } from '../index';

describe('F05: Badge content slots', () => {
  it('text slot overrides the prop in standalone status and wrapper branches', () => {
    for (const wrapped of [false, true]) {
      const w = mount(Badge, {
        props: { status: 'success', text: 'fallback' },
        slots: {
          text: () => h('strong', 'Ready'),
          ...(wrapped ? { default: () => h('i', 'Child') } : {}),
        },
      });
      expect(w.get('.apollo-badge-status-text strong').text()).toBe('Ready');
      expect(w.text()).not.toContain('fallback');
      w.unmount();
    }
  });

  it('count slot preserves indicator semantics and multiple roots without number rolling', () => {
    const w = mount(Badge, {
      props: {
        count: 100,
        overflowCount: 9,
        offset: [8, 4],
        classNames: { indicator: 'custom-indicator' },
        styles: { indicator: { backgroundColor: 'red', borderRadius: '4px' } },
      },
      slots: {
        default: () => h('i', 'Child'),
        count: () => [h('strong', 'New'), h('em', 'Items')],
      },
    });
    const indicator = w.get('.apollo-badge-count');
    expect(indicator.classes()).toContain('custom-indicator');
    expect(indicator.text()).toBe('NewItems');
    expect(indicator.find('strong').exists()).toBe(true);
    expect(indicator.find('em').exists()).toBe(true);
    expect(indicator.attributes('style')).toContain('inset-inline-end: -8px');
    expect(indicator.attributes('style')).toContain('margin-top: 4px');
    expect(indicator.attributes('style')).toContain('background-color: red');
    expect(indicator.attributes('style')).toContain('border-radius: 4px');
    expect(indicator.find('bdi').exists()).toBe(false);
    expect(indicator.attributes('title')).toBeUndefined();
    w.unmount();
  });

  it('explicitly empty slots suppress count/text props', () => {
    const w = mount(Badge, {
      props: { count: 5, text: 'fallback', status: 'success' },
      slots: { count: () => [], text: () => [] },
    });
    expect(w.find('.apollo-badge-count').exists()).toBe(false);
    expect(w.find('.apollo-badge-status-text').exists()).toBe(false);
    expect(w.find('.apollo-badge-status-dot').exists()).toBe(true);
    w.unmount();
  });

  it('empty count suppresses its indicator while independent text remains visible', () => {
    const w = mount(Badge, { props: { count: 5, text: 'Caption' }, slots: { count: () => [] } });
    expect(w.find('.apollo-badge-count').exists()).toBe(false);
    expect(w.get('.apollo-badge-status-text').text()).toBe('Caption');
    w.unmount();
  });

  it('conditional slots update content and restore numeric count behavior without remounting the child', async () => {
    const custom = ref(false);
    const label = ref('New');
    const count = ref(0);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            Badge,
            { count: count.value, overflowCount: 9, text: 'fallback' },
            {
              default: () => h('input', { value: 'Child state' }),
              ...(custom.value
                ? { count: () => h('strong', label.value), text: () => h('b', label.value) }
                : {}),
            },
          ),
      }),
    );
    const child = w.get('input').element;
    expect(w.find('.apollo-badge-count').exists()).toBe(false);
    custom.value = true;
    await w.vm.$nextTick();
    expect(w.get('.apollo-badge-count').text()).toBe('New');
    label.value = 'Updated';
    await w.vm.$nextTick();
    expect(w.get('.apollo-badge-count').text()).toBe('Updated');
    expect(w.get('.apollo-badge-status-text').text()).toBe('Updated');
    custom.value = false;
    count.value = 15;
    await w.vm.$nextTick();
    expect(w.get('.apollo-badge-count').text()).toBe('9+');
    expect(w.get('.apollo-badge-status-text').text()).toBe('fallback');
    count.value = 5;
    await w.vm.$nextTick();
    expect(w.find('.apollo-badge-count bdi').exists()).toBe(true);
    expect(w.get('input').element).toBe(child);
    w.unmount();
  });

  it('rich count zero is static content, while dot mode takes display precedence', async () => {
    const w = mount(Badge, { props: { count: 0 }, slots: { count: () => '0' } });
    expect(w.get('.apollo-badge-count').text()).toBe('0');
    expect(w.find('bdi').exists()).toBe(false);
    await w.setProps({ dot: true });
    expect(w.get('.apollo-badge-dot').text()).toBe('');
    w.unmount();
  });

  it('numeric text zero does not hide an independent rich count', () => {
    const w = mount(Badge, {
      props: { count: 0, text: 0, status: 'success' },
      slots: { count: () => h('strong', 'New') },
    });
    expect(w.get('.apollo-badge-count').text()).toBe('New');
    expect(w.find('.apollo-badge-status-text').exists()).toBe(false);
    w.unmount();
  });

  it('SSR hydrates current rich content without digit animation nodes or replacing content', async () => {
    const App = {
      render: () =>
        h(
          Badge,
          { count: 50, text: 'fallback' },
          {
            count: () => h('strong', 'New'),
            text: () => h('em', 'Ready'),
            default: () => h('span', 'Child'),
          },
        ),
    };
    const html = await renderToString(createSSRApp(App));
    expect(html).toContain('<strong>New</strong>');
    expect(html).toContain('<em>Ready</em>');
    expect(html).not.toContain('fallback');
    expect(html).not.toContain('<bdi>');
    const host = document.createElement('div');
    host.innerHTML = html;
    const content = host.querySelector('strong');
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const app = createSSRApp(App);
    try {
      app.mount(host);
      expect(host.querySelector('strong')).toBe(content);
      expect(warnings).not.toHaveBeenCalled();
    } finally {
      app.unmount();
      warnings.mockRestore();
    }
  });

  it('conditional default slot updates status/wrapper classes and attribute targets', async () => {
    const wrapped = ref(false);
    const id = ref('before');
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            Badge,
            { status: 'success', text: 'Ready', id: id.value },
            wrapped.value ? { default: () => h('span', 'Child') } : {},
          ),
      }),
    );
    expect(w.classes()).toContain('apollo-badge-not-a-wrapper');
    wrapped.value = true;
    id.value = 'after';
    await w.vm.$nextTick();
    expect(w.classes()).not.toContain('apollo-badge-not-a-wrapper');
    expect(w.attributes('id')).toBe('after');
    expect(w.text()).toContain('Child');
    wrapped.value = false;
    await w.vm.$nextTick();
    expect(w.classes()).toContain('apollo-badge-not-a-wrapper');
    w.unmount();
  });
});
