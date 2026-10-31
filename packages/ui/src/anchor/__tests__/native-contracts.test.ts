import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider } from '../../config-provider';
import { Anchor, AnchorLink } from '../index';

const item = (href = '#native-a', targetOffset?: number) => ({
  key: 'same',
  href,
  title: 'A',
  targetOffset,
});
const section = (id: string, top: number) => {
  const element = document.createElement('section');
  element.id = id;
  document.body.append(element);
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, top, 100, 50));
  vi.spyOn(element, 'getClientRects').mockImplementation(() => ({
    0: new DOMRect(0, top, 100, 50),
    length: 1,
    item: () => new DOMRect(0, top, 100, 50),
    [Symbol.iterator]: () => [new DOMRect(0, top, 100, 50)].values(),
  }));
  return element;
};
const settle = async () => {
  await nextTick();
  await nextTick();
};

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllTimers();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('Anchor native contracts', () => {
  it('owns click exactly once and cancellation prevents selection, scrolling and history', async () => {
    section('native-a', 200);
    const scroll = document.createElement('div');
    document.body.append(scroll);
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
    const push = vi.spyOn(window.history, 'pushState');
    const wrapper = mount(Anchor, {
      props: { items: [item()], affix: false, getContainer: () => scroll, onClick },
    });
    await settle();
    const changes = wrapper.emitted('change')?.length;
    await wrapper.get('a').trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.emitted('click')?.[0]?.[0]).toBeInstanceOf(MouseEvent);
    expect(wrapper.emitted('click')?.[0]?.[1]).toEqual({ href: '#native-a', title: 'A' });
    expect(wrapper.emitted('change')?.length).toBe(changes);
    await vi.advanceTimersByTimeAsync(500);
    expect(scroll.scrollTop).toBe(0);
    expect(push).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('modified clicks and new browsing targets keep their native navigation', async () => {
    section('native-a', 200);
    const push = vi.spyOn(window.history, 'pushState');
    const wrapper = mount(Anchor, { props: { affix: false, items: [item()] } });
    await settle();
    const changes = wrapper.emitted('change')?.length;
    for (const options of [
      { ctrlKey: true },
      { metaKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
    ]) {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...options });
      wrapper.get('a').element.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    await wrapper.setProps({ items: [{ ...item(), target: '_blank' }] });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    wrapper.get('a').element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(wrapper.emitted('change')?.length).toBe(changes);
    expect(push).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('external paths containing a fragment do not select or scroll a local target', async () => {
    section('native-a', 200);
    const wrapper = mount(Anchor, {
      props: { affix: false, items: [item('https://example.org/other#native-a')] },
    });
    const push = vi.spyOn(window.history, 'pushState');
    await settle();
    const changes = wrapper.emitted('change')?.length;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    wrapper.get('a').element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(wrapper.emitted('change')?.length).toBe(changes);
    expect(push).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('current offset, bounds and same-key per-link offset replacement update highlighting immediately', async () => {
    section('native-a', 80);
    const wrapper = mount(Anchor, { props: { items: [item()], affix: false, bounds: 0 } });
    await settle();
    expect(wrapper.find('.apollo-anchor-link-active').exists()).toBe(false);
    await wrapper.setProps({ targetOffset: 100 });
    await settle();
    expect(wrapper.find('.apollo-anchor-link-active').exists()).toBe(true);
    await wrapper.setProps({ targetOffset: 0 });
    await settle();
    expect(wrapper.find('.apollo-anchor-link-active').exists()).toBe(false);
    await wrapper.setProps({ bounds: 90 });
    await settle();
    expect(wrapper.find('.apollo-anchor-link-active').exists()).toBe(true);
    await wrapper.setProps({ bounds: 0, items: [item('#native-a', 100)] });
    await settle();
    expect(wrapper.find('.apollo-anchor-link-active').exists()).toBe(true);
    await wrapper.setProps({ items: [item('#native-a', 0)] });
    await settle();
    expect(wrapper.find('.apollo-anchor-link-active').exists()).toBe(false);
    wrapper.unmount();
  });

  it('removing the highlight mapper restores the last raw anchor', async () => {
    section('native-a', 0);
    const wrapper = mount(Anchor, {
      props: { affix: false, items: [item()], getCurrentAnchor: () => '#elsewhere' },
    });
    await settle();
    expect(wrapper.find('.apollo-anchor-link-active').exists()).toBe(false);
    await wrapper.setProps({ getCurrentAnchor: undefined });
    await settle();
    expect(wrapper.find('.apollo-anchor-link-active').exists()).toBe(true);
    wrapper.unmount();
  });

  it('unmount cancels the pending scroll animation rather than changing a detached container', async () => {
    section('native-a', 300);
    const scroll = document.createElement('div');
    document.body.append(scroll);
    const wrapper = mount(Anchor, {
      props: { affix: false, items: [item()], getContainer: () => scroll },
    });
    await wrapper.get('a').trigger('click');
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(600);
    expect(scroll.scrollTop).toBe(0);
  });

  it('a duplicate href remains registered when another conditional link disappears', async () => {
    section('native-a', 0);
    const second = ref(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Anchor,
            { affix: false },
            {
              default: () => [
                h(AnchorLink, { href: '#native-a', title: 'first' }),
                second.value ? h(AnchorLink, { href: '#native-a', title: 'second' }) : null,
              ],
            },
          ),
      }),
    );
    await settle();
    second.value = false;
    await settle();
    window.dispatchEvent(new Event('scroll'));
    await settle();
    expect(wrapper.get('a').classes()).toContain('apollo-anchor-link-title-active');
    wrapper.unmount();
  });

  it('default composition is a supported Vue slot and title slots preserve empty and scalar contents', async () => {
    const warn = vi.spyOn(console, 'warn');
    const label = shallowRef<0 | string | null>(0);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Anchor,
            { affix: false },
            {
              default: () =>
                h(
                  AnchorLink,
                  { href: '#native-a', title: 'fallback' },
                  { title: () => label.value },
                ),
            },
          ),
      }),
    );
    expect(wrapper.get('a').text()).toBe('0');
    label.value = null;
    await settle();
    expect(wrapper.get('a').text()).toBe('');
    expect(warn).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('a present empty default slot overrides items and can be removed dynamically', async () => {
    const slot = ref(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Anchor,
            { affix: false, items: [item()] },
            slot.value ? { default: () => [] } : undefined,
          ),
      }),
    );
    expect(wrapper.find('a').exists()).toBe(false);
    slot.value = false;
    await settle();
    expect(wrapper.get('a').text()).toBe('A');
    wrapper.unmount();
  });

  it('Link owns cancellable click and routes focus/keyboard attrs to the native anchor only', async () => {
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
    const onFocus = vi.fn();
    const onKeydown = vi.fn();
    const push = vi.spyOn(window.history, 'pushState');
    const wrapper = mount(AnchorLink, {
      props: { href: '#native-a', title: 0, onClick },
      attrs: {
        id: 'link-wrapper',
        class: ['one', 'two'],
        'data-owner': 'root',
        'aria-label': 'Native link',
        tabindex: 3,
        onFocus,
        onKeydown,
      },
      attachTo: document.body,
    });
    const link = wrapper.get<HTMLAnchorElement>('a');
    expect(wrapper.attributes('id')).toBe('link-wrapper');
    expect(wrapper.attributes('data-owner')).toBe('root');
    expect(wrapper.attributes('tabindex')).toBeUndefined();
    expect(wrapper.attributes('aria-label')).toBeUndefined();
    expect(link.attributes('tabindex')).toBe('3');
    expect(link.attributes('aria-label')).toBe('Native link');
    link.element.focus();
    await link.trigger('keydown', { key: 'Enter' });
    await link.trigger('click');
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onKeydown).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('click')?.[0]?.[1]).toEqual({ title: 0, href: '#native-a' });
    expect(push).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('download and native link metadata reach the anchor and retain the native default action', async () => {
    section('native-a', 200);
    const wrapper = mount(Anchor, {
      props: { affix: false },
      slots: {
        default: () =>
          h(AnchorLink, {
            href: '#native-a',
            title: 'Download',
            download: 'section.html',
            rel: 'nofollow',
            hreflang: 'en',
            referrerpolicy: 'no-referrer',
            type: 'text/html',
            ping: '/ping',
            accesskey: 'd',
          }),
      },
    });
    await settle();
    const link = wrapper.get('a');
    for (const [key, value] of Object.entries({
      download: 'section.html',
      rel: 'nofollow',
      hreflang: 'en',
      referrerpolicy: 'no-referrer',
      type: 'text/html',
      ping: '/ping',
      accesskey: 'd',
    })) {
      expect(link.attributes(key)).toBe(value);
      expect(wrapper.get('.apollo-anchor-link').attributes(key)).toBeUndefined();
    }
    const push = vi.spyOn(window.history, 'pushState');
    const changes = wrapper.emitted('change')?.length;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(wrapper.emitted('change')?.length).toBe(changes);
    expect(push).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('custom Anchor prefix propagates to links and the active indicator', async () => {
    section('native-a', 0);
    const wrapper = mount(Anchor, {
      props: { affix: false, prefixCls: 'custom-anchor', items: [item()] },
    });
    await settle();
    expect(wrapper.get('a').classes()).toContain('custom-anchor-link-title-active');
    expect(wrapper.get<HTMLElement>('.custom-anchor-ink').element.style.height).toBe('0px');
    wrapper.unmount();
  });

  it('current Provider direction reaches native logical layout without replacing links', async () => {
    const direction = ref<'ltr' | 'rtl'>('ltr');
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { direction: direction.value },
            {
              default: () => h(Anchor, { affix: false, items: [item()] }),
            },
          ),
      }),
    );
    const link = wrapper.get('a').element;
    expect(wrapper.get('.apollo-anchor-wrapper').attributes('dir')).toBe('ltr');
    direction.value = 'rtl';
    await settle();
    expect(wrapper.get('.apollo-anchor-wrapper').attributes('dir')).toBe('rtl');
    expect(wrapper.get('a').element).toBe(link);
    wrapper.unmount();
  });

  it('an explicit Link prefix retains its own classes and the registered active indicator', async () => {
    section('native-a', 0);
    const wrapper = mount(Anchor, {
      props: { affix: false, prefixCls: 'parent-anchor' },
      slots: {
        default: () => h(AnchorLink, { prefixCls: 'child-anchor', href: '#native-a', title: 'A' }),
      },
    });
    await settle();
    expect(wrapper.get('a').classes()).toContain('child-anchor-link-title-active');
    expect(wrapper.get<HTMLElement>('.parent-anchor-ink').element.style.height).toBe('0px');
    wrapper.unmount();
  });

  it('current Provider styles and both component Tokens replace and clear', async () => {
    const components = shallowRef({ Anchor: { linkPaddingBlock: 9, linkPaddingInlineStart: 31 } });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { theme: { components: components.value } },
            { default: () => h(Anchor, { affix: false, items: [item()] }) },
          ),
      }),
    );
    expect(
      wrapper
        .get<HTMLElement>('.apollo-anchor')
        .element.style.getPropertyValue('--apollo-anchor-link-padding-block'),
    ).toBe('9px');
    components.value = { Anchor: { linkPaddingBlock: 0, linkPaddingInlineStart: 18 } };
    await settle();
    expect(
      wrapper
        .get<HTMLElement>('.apollo-anchor')
        .element.style.getPropertyValue('--apollo-anchor-link-padding-block'),
    ).toBe('0px');
    wrapper.unmount();
  });

  it('SSR performs no scroll animation or global listener work', async () => {
    const frame = vi.spyOn(window, 'requestAnimationFrame');
    const add = vi.spyOn(window, 'addEventListener');
    const html = await renderToString(
      createSSRApp({ render: () => h(Anchor, { items: [item()] }) }),
    );
    expect(html).toContain('apollo-anchor-link-title');
    expect(frame).not.toHaveBeenCalled();
    expect(add.mock.calls.filter(([type]) => ['scroll', 'resize'].includes(type))).toHaveLength(0);
  });
});
