import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Component, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { MockResizeObserver } from '../../../../../vitest.setup';
import { ConfigProvider } from '../../config-provider';
import { Tour, TourPurePanel } from '../index';
import type { TourProps } from '../interface';

const steps = [{ title: 'Step 0' }, { title: 'Step 1' }, { title: 'Step 2' }];
const wrappers: Array<{ unmount(): void }> = [];
const title = () => document.querySelector('.apollo-tour-title')?.textContent;
const panel = () => document.querySelector<HTMLElement>('.apollo-tour-panel');
const next = () => document.querySelector<HTMLButtonElement>('.apollo-tour-next-btn');
const open = async () => {
  await vi.waitFor(() => expect(panel()).not.toBeNull());
  await nextTick();
};
const mountTour = (props: TourProps = {}) => {
  const wrapper = mount(Tour, {
    props: { open: true, steps, ...props },
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  wrappers.push(wrapper);
  return wrapper;
};
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  document.body.replaceChildren();
});

describe('Tour accepted models', () => {
  it('does not leak a rejected current proposal when control is removed', async () => {
    const wrapper = mountTour({ current: 0 });
    await open();
    next()?.click();
    await nextTick();
    expect(wrapper.emitted('update:current')).toEqual([[1]]);
    expect(title()).toBe('Step 0');
    await wrapper.setProps({ current: undefined });
    expect(title()).toBe('Step 0');
  });

  it('retains an initial accepted current when control is removed', async () => {
    const wrapper = mountTour({ current: 2 });
    await open();
    expect(title()).toBe('Step 2');
    await wrapper.setProps({ current: undefined });
    expect(title()).toBe('Step 2');
  });

  it('retains an accepted closed state when open control is removed', async () => {
    const wrapper = mountTour({ open: false });
    await nextTick();
    await wrapper.setProps({ open: undefined });
    await nextTick();
    expect(panel()).toBeNull();
  });

  it('keeps defaultCurrent when initially empty steps arrive asynchronously', async () => {
    const wrapper = mountTour({ steps: [], defaultCurrent: 1 });
    await nextTick();
    await wrapper.setProps({ steps });
    await open();
    expect(title()).toBe('Step 1');
  });

  it('restores the accepted step after temporary invalidation by the step list', async () => {
    const wrapper = mountTour({ defaultCurrent: 2 });
    await open();
    await wrapper.setProps({ steps: steps.slice(0, 1) });
    await vi.waitFor(() => expect(panel()).toBeNull());
    await wrapper.setProps({ steps });
    await open();
    expect(title()).toBe('Step 2');
  });

  it('does not mutate a controlled current during close and reopen', async () => {
    const wrapper = mountTour({ current: 2 });
    await open();
    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });
    await open();
    await wrapper.setProps({ current: undefined });
    expect(title()).toBe('Step 2');
    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('evaluates control ownership after a batched reopen and current release', async () => {
    const isOpen = ref(false);
    const current = ref<number | undefined>(1);
    const wrapper = mount(() => h(Tour, { open: isOpen.value, current: current.value, steps }), {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    isOpen.value = true;
    current.value = undefined;
    await open();
    expect(title()).toBe('Step 0');
  });
});

describe('Tour native content and Provider', () => {
  it('retains empty button content while naming its actual navigation action', () => {
    const wrapper = mount(TourPurePanel, {
      props: { nextButtonProps: { children: 'Fallback' } },
      slots: { nextButton: () => [] },
    });
    wrappers.push(wrapper);
    expect(wrapper.get('.apollo-tour-next-btn').text()).toBe('');
    expect(wrapper.get('.apollo-tour-next-btn').attributes('aria-label')).toBe('Next');
  });

  it('preserves a numeric close icon in the explicit step configuration', async () => {
    mountTour({ closeIcon: false, steps: [{ title: 'Step 0', closable: { closeIcon: 0 } }] });
    await open();
    expect(document.querySelector('.apollo-tour-close')?.textContent).toBe('0');
  });

  it('preserves the current Provider direction in both the popup and static preview', async () => {
    const direction = ref<'ltr' | 'rtl'>('rtl');
    const wrapper = mount(
      () =>
        h(ConfigProvider, { direction: direction.value }, () => [
          h(Tour, { open: true, steps }),
          h(TourPurePanel, { id: 'direction-preview', title: 'Preview' }),
        ]),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await open();
    expect(document.querySelector('.apollo-tour[role="dialog"]')?.getAttribute('dir')).toBe('rtl');
    expect(wrapper.get('#direction-preview').attributes('dir')).toBe('rtl');
    direction.value = 'ltr';
    await nextTick();
    expect(document.querySelector('.apollo-tour[role="dialog"]')?.getAttribute('dir')).toBe('ltr');
    expect(wrapper.get('#direction-preview').attributes('dir')).toBe('ltr');
  });

  it('reads dynamic closeIcon slot presence during render', async () => {
    const custom = ref(false);
    const wrapper = mount(
      () => h(Tour, { open: true, steps }, custom.value ? { closeIcon: () => 'Custom close' } : {}),
      {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      },
    );
    wrappers.push(wrapper);
    await open();
    custom.value = true;
    await nextTick();
    expect(document.querySelector('.apollo-tour-close')?.textContent).toBe('Custom close');
    custom.value = false;
    await nextTick();
    expect(document.querySelector('.apollo-tour-close')?.textContent).not.toContain('Custom close');
  });

  it('lands native attrs, class and style on the actual popup root', async () => {
    const click = vi.fn();
    const wrapper = mount(Tour, {
      props: { open: true, steps },
      attrs: {
        id: 'tour-native',
        'aria-label': 'Guide',
        class: ['consumer', { active: true }],
        style: [{ width: '310px' }, 'color: red'],
        onClick: click,
      },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await open();
    const root = document.getElementById('tour-native');
    expect(root).toHaveClass('apollo-tour', 'consumer', 'active');
    expect(root?.getAttribute('aria-label')).toBe('Guide');
    expect(root?.getAttribute('style')).toContain('width: 310px');
    root?.click();
    expect(click).toHaveBeenCalledTimes(1);
    expect(
      document.querySelector('.apollo-tour-target-placeholder')?.getAttribute('id'),
    ).toBeNull();
  });

  it('PurePanel forwards all native content and a stable usable originNode component', async () => {
    const origins: Component[] = [];
    const wrapper = mount(TourPurePanel, {
      props: { title: 'Preview', current: 0, total: 2, nextButtonProps: { children: 'Fallback' } },
      slots: {
        nextButton: () => ['Next ', 0],
        indicators: ({ current }: { current: number }) => `Page ${current}`,
        actions: ({ originNode }: { originNode: Component }) => {
          origins.push(originNode);
          return [h('span', 'Custom actions'), h(originNode)];
        },
      },
    });
    wrappers.push(wrapper);
    expect(wrapper.text()).toContain('Next 0');
    expect(wrapper.text()).toContain('Page 0');
    expect(wrapper.text()).toContain('Custom actions');
    const button = wrapper.get('.apollo-tour-next-btn').element;
    await wrapper.setProps({ current: 1 });
    expect(wrapper.text()).toContain('Page 1');
    expect(wrapper.get('.apollo-tour-next-btn').element).toBe(button);
    expect(origins.length).toBeGreaterThan(1);
    expect(origins.every((origin) => origin === origins[0])).toBe(true);
  });

  it('PurePanel consumes current Provider styling and native attributes', async () => {
    const color = ref('red');
    const wrapper = mount(() =>
      h(
        ConfigProvider,
        {
          components: {
            tour: {
              className: 'provider-tour',
              style: { color: color.value },
              styles: { title: { fontSize: '23px' } },
            },
          },
        },
        () => h(TourPurePanel, { id: 'preview-tour', title: 'Preview', class: { native: true } }),
      ),
    );
    wrappers.push(wrapper);
    expect(wrapper.find('#preview-tour').exists()).toBe(true);
    expect(wrapper.get('#preview-tour').classes()).toContain('provider-tour');
    expect(wrapper.get('#preview-tour').attributes('style')).toContain('color: red');
    expect(wrapper.get('.apollo-tour-title').attributes('style')).toContain('font-size: 23px');
    color.value = 'blue';
    await nextTick();
    expect(wrapper.get('#preview-tour').attributes('style')).toContain('color: blue');
  });

  it('can render SSR with open steps without touching browser globals or registering listeners', async () => {
    const add = vi.spyOn(window, 'addEventListener');
    const html = await renderToString(h(Tour, { open: true, steps }));
    expect(html).not.toContain('apollo-tour-panel');
    expect(add.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(0);
    add.mockRestore();
  });
});

describe('Tour current targets and input ownership', () => {
  it('keeps native step actions cancellable without creating a second navigation channel', async () => {
    const action = vi.fn((event: MouseEvent) => event.preventDefault());
    const wrapper = mountTour({
      steps: [{ title: 'Step 0', nextButtonProps: { onClick: action } }, { title: 'Step 1' }],
    });
    await open();
    next()?.click();
    await nextTick();
    expect(action.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(title()).toBe('Step 0');
  });

  it('passes the actual placeholder to both popup and mask container services', async () => {
    const host = document.createElement('section');
    document.body.append(host);
    const getContainer = vi.fn((node: HTMLElement) => {
      expect(node).toBeInstanceOf(HTMLElement);
      expect(node).toHaveClass('apollo-tour-target-placeholder');
      return host;
    });
    mountTour({ getPopupContainer: getContainer });
    await open();
    expect(host.querySelector('.apollo-tour')).not.toBeNull();
    expect(host.querySelector('.apollo-tour-mask')).not.toBeNull();
    expect(getContainer).toHaveBeenCalled();
  });

  it('treats a missing target ref as center and follows the current getter value', async () => {
    const target = ref<HTMLElement | null>(null);
    mountTour({ steps: [{ target: () => target.value }] });
    await open();
    expect(document.querySelector('.apollo-tour-arrow')).toBeNull();
    const button = document.createElement('button');
    button.getBoundingClientRect = () => new DOMRect(20, 30, 100, 50);
    document.body.append(button);
    target.value = button;
    await vi.waitFor(() =>
      expect(document.querySelector('.apollo-tour-placeholder-animated')?.getAttribute('x')).toBe(
        '14',
      ),
    );
    target.value = null;
    await vi.waitFor(() =>
      expect(document.querySelector('.apollo-tour-placeholder-animated')).toBeNull(),
    );
  });

  it('reveals on activation, then observes scrolling without forcing a second scroll', async () => {
    const target = document.createElement('button');
    const measure = vi.fn(() => new DOMRect(10, 9000, 100, 40));
    const scroll = vi.fn();
    target.getBoundingClientRect = measure;
    target.scrollIntoView = scroll;
    document.body.append(target);
    const wrapper = mountTour({ steps: [{ target }] });
    await open();
    expect(scroll).toHaveBeenCalledTimes(1);
    for (const observer of MockResizeObserver.instances) observer.trigger();
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(scroll).toHaveBeenCalledTimes(1);
    for (const observer of MockResizeObserver.instances) observer.trigger();
    await wrapper.setProps({ open: false });
    const closed = measure.mock.calls.length;
    window.dispatchEvent(new Event('resize'));
    document.dispatchEvent(new Event('scroll'));
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(measure).toHaveBeenCalledTimes(closed);
  });

  it('remeasures an accepted step activation even when both steps use the same element', async () => {
    const target = document.createElement('button');
    let rect = new DOMRect(100, 100, 80, 30);
    target.getBoundingClientRect = () => rect;
    document.body.append(target);
    mountTour({
      steps: [
        {
          target,
          nextButtonProps: {
            onClick: () => {
              rect = new DOMRect(100, 300, 80, 30);
            },
          },
        },
        { target },
      ],
    });
    await open();
    next()?.click();
    await vi.waitFor(() =>
      expect(document.querySelector('.apollo-tour-placeholder-animated')?.getAttribute('y')).toBe(
        '294',
      ),
    );
  });

  it('keeps a non-modal mask transparent to interaction and releases the body lock', async () => {
    mountTour({ mask: false });
    await open();
    expect(document.querySelector<HTMLElement>('.apollo-tour-mask')?.style.pointerEvents).toBe(
      'none',
    );
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('uses the native SVG presentation attribute on all four outside hit covers', async () => {
    const target = document.createElement('button');
    target.getBoundingClientRect = () => new DOMRect(100, 100, 80, 30);
    document.body.append(target);
    mountTour({ steps: [{ target }] });
    await open();
    const covers = document.querySelectorAll('.apollo-tour-mask rect[fill="transparent"]');
    expect(covers).toHaveLength(4);
    for (const cover of covers) {
      expect(cover.getAttribute('pointer-events')).toBe('auto');
      expect(cover.hasAttribute('pointerEvents')).toBe(false);
    }
  });

  it('scopes arrows to the actual popup and preserves native cancellation', async () => {
    const cancel = vi.fn((event: KeyboardEvent) => event.preventDefault());
    const wrapper = mount(Tour, {
      props: { open: true, steps },
      attrs: { onKeydownOnce: cancel },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await open();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(wrapper.emitted('change')).toBeUndefined();
    const root = document.querySelector<HTMLElement>('.apollo-tour');
    root?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(wrapper.emitted('change')).toBeUndefined();
    root?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(wrapper.emitted('change')).toEqual([[1]]);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('only lets the top Tour propose Escape closing', async () => {
    const first = mountTour();
    await open();
    const second = mountTour();
    await vi.waitFor(() => expect(document.querySelectorAll('.apollo-tour-panel')).toHaveLength(2));
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(first.emitted('update:open')).toBeUndefined();
    expect(second.emitted('update:open')).toEqual([[false]]);
  });

  it('returns owned focus only after accepted closing, preserving an outside user choice', async () => {
    const opener = document.createElement('button');
    const outside = document.createElement('button');
    document.body.append(opener, outside);
    opener.focus();
    const wrapper = mountTour();
    await open();
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector('.apollo-tour')),
    );
    document.querySelector<HTMLButtonElement>('.apollo-tour-close')?.click();
    await nextTick();
    expect(document.activeElement).toBe(document.querySelector('.apollo-tour'));
    await wrapper.setProps({ open: false });
    expect(document.activeElement).toBe(opener);
    await wrapper.setProps({ open: true });
    await open();
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector('.apollo-tour')),
    );
    outside.focus();
    await wrapper.setProps({ open: false });
    expect(document.activeElement).toBe(outside);
  });
});
