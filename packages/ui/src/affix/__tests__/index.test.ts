/**
 * L1 · Affix 组件的帧节流快路径。
 *
 * jsdom 没有真实布局；这里显式提供 rect，只验证「位置未变时不重复测量」与
 * 「组件初次测量不向消费者控制台输出诊断信息」。几何判据本身仍由 utils.test.ts 覆盖。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, provide } from 'vue';
import { configContextKey, DEFAULT_CONFIG_CONTEXT } from '../../config-provider/context';
import Affix from '../Affix.vue';

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

const ConfiguredHost = defineComponent({
  setup(_props, { slots }) {
    provide(configContextKey, {
      ...DEFAULT_CONFIG_CONTEXT,
      components: {
        affix: { className: 'config-class', style: { color: 'red', marginTop: '2px' } },
      },
    });
    return () => slots.default?.();
  },
});

const MutableAttrsHost = defineComponent({
  props: {
    rootClass: { type: String, required: true },
    color: { type: String, required: true },
  },
  setup(props) {
    return () =>
      h(
        Affix,
        { class: props.rootClass, style: { color: props.color } },
        {
          default: () => h('span', 'content'),
        },
      );
  },
});

describe('Affix · Vue inline style 位置快路径', () => {
  it('测量写入 px 字符串后，滚动到同一位置只测量一次且不输出调试日志', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const getBoundingClientRect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue(new DOMRect(0, 20, 100, 20));

    const wrapper = mount(Affix, {
      props: { offsetTop: 64 },
      slots: { default: () => h('span', 'content') },
    });

    try {
      await nextFrame();
      await nextTick();

      const fixed = wrapper.find('.apollo-affix');
      expect(fixed.exists()).toBe(true);
      expect((fixed.element as HTMLElement).style.top).toBe('64px');

      getBoundingClientRect.mockClear();
      window.dispatchEvent(new Event('scroll'));
      await nextFrame();
      await nextTick();

      // 一次来自 lazyUpdatePosition 的位置检查；若快路径失效，完整 measure 会再读一次。
      expect(getBoundingClientRect).toHaveBeenCalledTimes(1);
      expect(log).not.toHaveBeenCalled();
    } finally {
      wrapper.unmount();
      getBoundingClientRect.mockRestore();
      log.mockRestore();
    }
  });
});

describe('Affix · Vue 原生根 attrs', () => {
  it('原生 class/style 落在占位测量层并与 ConfigProvider 配置合并', async () => {
    const onClick = vi.fn();
    const wrapper = mount(ConfiguredHost, {
      slots: {
        default: () =>
          h(
            Affix,
            {
              id: 'affix-root',
              class: ['native-class', { active: true }],
              style: { color: 'blue', paddingTop: '4px' },
              onClick,
            },
            { default: () => h('span', 'content') },
          ),
      },
    });

    const root = wrapper.get('#affix-root');
    expect(root.classes()).toContain('config-class');
    expect(root.classes()).toContain('native-class');
    expect(root.classes()).toContain('active');
    expect((root.element as HTMLElement).style.color).toBe('blue');
    expect((root.element as HTMLElement).style.marginTop).toBe('2px');
    expect((root.element as HTMLElement).style.paddingTop).toBe('4px');

    await root.trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('父组件更新时重新读取 class/style attrs，不缓存 useAttrs 快照', async () => {
    const wrapper = mount(MutableAttrsHost, {
      props: { rootClass: 'first-class', color: 'red' },
    });

    expect(wrapper.element.classList.contains('first-class')).toBe(true);
    expect((wrapper.element as HTMLElement).style.color).toBe('red');

    await wrapper.setProps({ rootClass: 'second-class', color: 'blue' });

    expect(wrapper.element.classList.contains('first-class')).toBe(false);
    expect(wrapper.element.classList.contains('second-class')).toBe(true);
    expect((wrapper.element as HTMLElement).style.color).toBe('blue');
  });
});
