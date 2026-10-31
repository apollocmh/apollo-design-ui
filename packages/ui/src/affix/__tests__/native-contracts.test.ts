import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider } from '../../config-provider';
import Affix from '../Affix.vue';

const settle = async () => {
  await nextTick();
  await vi.advanceTimersByTimeAsync(40);
  await nextTick();
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 10, 150, 40),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllTimers();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('Affix current native contract', () => {
  it('keeps natural fixed content height and updates its spacer on both growth and shrinkage', async () => {
    let height = 40;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(0, 10, 150, height),
    );
    const wrapper = mount(Affix, {
      props: { offsetTop: 30 },
      slots: { default: () => h('div', 'variable content') },
    });
    await settle();
    const fixed = wrapper.get<HTMLElement>('.apollo-affix');
    expect(fixed.element.style.height).toBe('');
    for (const nextHeight of [95, 25]) {
      height = nextHeight;
      wrapper.vm.updatePosition();
      await settle();
      expect(wrapper.get<HTMLElement>('[aria-hidden="true"]').element.style.height).toBe(
        `${nextHeight}px`,
      );
      expect(wrapper.get('.apollo-affix').element).toBe(fixed.element);
    }
    wrapper.unmount();
  });

  it('both offsets retain top priority only when its geometric condition is met', async () => {
    let top = 10;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(0, top, 150, 40),
    );
    const wrapper = mount(Affix, { props: { offsetTop: 30, offsetBottom: 20 } });
    await settle();
    expect(wrapper.get<HTMLElement>('.apollo-affix').element.style.top).toBe('30px');
    top = window.innerHeight + 100;
    wrapper.vm.updatePosition();
    await settle();
    expect(wrapper.get<HTMLElement>('.apollo-affix').element.style.top).toBe('');
    expect(wrapper.get<HTMLElement>('.apollo-affix').element.style.bottom).toBe('20px');
    wrapper.unmount();
  });

  it('target removal releases its listeners and clears fixed positioning once', async () => {
    const element = document.createElement('div');
    const target = shallowRef<HTMLElement | null>(element);
    const add = vi.spyOn(element, 'addEventListener');
    const remove = vi.spyOn(element, 'removeEventListener');
    const wrapper = mount(Affix, { props: { target: () => target.value, offsetTop: 30 } });
    await settle();
    expect(wrapper.find('.apollo-affix').exists()).toBe(true);
    target.value = null;
    await settle();
    expect(wrapper.find('.apollo-affix').exists()).toBe(false);
    expect(remove.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(1);
    expect(wrapper.emitted('change')).toEqual([[true], [false]]);
    target.value = element;
    await settle();
    expect(add.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(2);
    expect(wrapper.find('.apollo-affix').exists()).toBe(true);
    wrapper.unmount();
  });

  it('Provider replacement changes the actual fixed prefix and current z-index token', async () => {
    const prefix = shallowRef('apollo');
    const zIndex = shallowRef(41);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              prefixCls: prefix.value,
              theme: { components: { Affix: { zIndexPopup: zIndex.value } } },
            },
            { default: () => h(Affix, { offsetTop: 30 }, { default: () => h('input') }) },
          ),
      }),
    );
    await settle();
    const input = wrapper.get('input').element;
    expect(wrapper.get<HTMLElement>('.apollo-affix').element.style.zIndex).toBe('41');
    prefix.value = 'orbit';
    zIndex.value = 0;
    await settle();
    expect(wrapper.find('.apollo-affix').exists()).toBe(false);
    expect(wrapper.get<HTMLElement>('.orbit-affix').element.style.zIndex).toBe('0');
    expect(wrapper.get('input').element).toBe(input);
    wrapper.unmount();
  });

  it('SSR does not schedule measurements or attach native listeners', async () => {
    const frame = vi.spyOn(window, 'requestAnimationFrame');
    const add = vi.spyOn(window, 'addEventListener');
    const html = await renderToString(
      createSSRApp({ render: () => h(Affix, { offsetTop: 30 }, { default: () => 'ssr' }) }),
    );
    expect(html).toContain('ssr');
    expect(frame).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });
});
