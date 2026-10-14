/**
 * Tag / CheckableTag(.Group) · Issue #30 回归（3 项，先复现后修）。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { CheckableTag, CheckableTagGroup, Tag } from '../index';

const mountGroup = (props: Record<string, unknown> = {}) =>
  mount(CheckableTagGroup, { props: { options: ['a', 'b'], ...props } as never });

const items = (w: ReturnType<typeof mountGroup>) => w.findAll('.apollo-tag-checkable-group-item');

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('#30.1 CheckableTag.Group 的 onChange 只通知一次', () => {
  it('[A] 单选：点一次 ⇒ 1 次', async () => {
    const onChange = vi.fn();
    const w = mountGroup({ onChange });
    await items(w).at(0)?.trigger('click');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('a');
    w.unmount();
  });

  it('[B] 多选：点三次 ⇒ 3 次（每次 1 次）', async () => {
    const onChange = vi.fn();
    const w = mountGroup({ multiple: true, options: ['a', 'b', 'c'], onChange });
    const list = items(w);
    await list.at(0)?.trigger('click');
    await list.at(1)?.trigger('click');
    await list.at(0)?.trigger('click');
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([['a'], ['a', 'b'], ['b']]);
    w.unmount();
  });

  it('[C] 受控模式同样只 1 次', async () => {
    const onChange = vi.fn();
    const w = mountGroup({ value: null, onChange });
    await items(w).at(1)?.trigger('click');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('b');
    w.unmount();
  });

  it('[D] 守卫：取消选中（单选回到 null）也只 1 次', async () => {
    const onChange = vi.fn();
    const w = mountGroup({ onChange });
    await items(w).at(0)?.trigger('click');
    onChange.mockClear();
    await items(w).at(0)?.trigger('click');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(null);
    w.unmount();
  });
});

describe('#30.2 自定义关闭图标的 onClick 不能执行两次', () => {
  it('[A] 图标自带 onClick ⇒ 点一次只调 1 次，且 onClose 也只 1 次', async () => {
    const spy = vi.fn();
    const onClose = vi.fn();
    // ⚠️ C8-R2：富内容走**插槽** —— `closeIcon` 不是本仓的运行时 prop（只有
    //    ConfigProvider 的程序化上下文用），写成 prop 会落进 attrs 变成
    //    `closeicon="[object Object]"` 属性。
    const w = mount(Tag, {
      props: { closable: true, onClose } as never,
      slots: {
        default: () => 'tag',
        closeIcon: () => h('span', { class: 'custom-close', onClick: spy }, 'x'),
      },
      attachTo: document.body,
    });
    await nextTick();

    const icon = w.find('.custom-close');
    expect(icon.exists()).toBe(true);
    await icon.trigger('click');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('[B] 内置关闭图标 ⇒ onClose 只 1 次', async () => {
    const onClose = vi.fn();
    const w = mount(Tag, {
      props: { closable: true, onClose } as never,
      slots: { default: () => 'tag' },
      attachTo: document.body,
    });
    await nextTick();
    await w.find('.apollo-tag-close-icon').trigger('click');
    expect(onClose).toHaveBeenCalledTimes(1);
    w.unmount();
  });
});

describe('#30.3 动态 disabled（false → true → false）', () => {
  it('[A] Tag：切换后立即生效（类名 + 关闭图标 tabindex）', async () => {
    const disabled = ref(false);
    const Host = defineComponent({
      setup: () => () =>
        h(Tag as never, { closable: true, disabled: disabled.value } as never, {
          default: () => 'tag',
        }),
    });
    const w = mount(Host, { attachTo: document.body });
    await nextTick();
    const root = () => document.querySelector<HTMLElement>('.apollo-tag');
    const icon = () => document.querySelector<HTMLElement>('.apollo-tag-close-icon');

    expect(root()?.classList.contains('apollo-tag-disabled')).toBe(false);
    expect(icon()?.getAttribute('tabindex')).toBe('0');

    disabled.value = true;
    await nextTick();
    expect(root()?.classList.contains('apollo-tag-disabled')).toBe(true);
    expect(icon()?.getAttribute('tabindex')).toBe('-1');

    disabled.value = false;
    await nextTick();
    expect(root()?.classList.contains('apollo-tag-disabled')).toBe(false);
    expect(icon()?.getAttribute('tabindex')).toBe('0');
    w.unmount();
  });

  it('[B] CheckableTag：切换后点击/空格是否触发 onChange', async () => {
    const disabled = ref(false);
    const onChange = vi.fn();
    const Host = defineComponent({
      setup: () => () =>
        h(
          CheckableTag as never,
          {
            disabled: disabled.value,
            checked: false,
            onChange,
          } as never,
        ),
    });
    const w = mount(Host, { attachTo: document.body });
    await nextTick();
    const root = () => document.querySelector<HTMLElement>('.apollo-tag');

    expect(root()?.classList.contains('apollo-tag-checkable-disabled')).toBe(false);

    disabled.value = true;
    await nextTick();
    expect(root()?.classList.contains('apollo-tag-checkable-disabled')).toBe(true);
    root()?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await nextTick();
    expect(onChange).not.toHaveBeenCalled();

    disabled.value = false;
    await nextTick();
    expect(root()?.classList.contains('apollo-tag-checkable-disabled')).toBe(false);
    root()?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await nextTick();
    expect(onChange).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('[C] 守卫：ConfigProvider 的 componentDisabled 回落仍然生效', async () => {
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            // 全局 disabled：组件未显式传 ⇒ 听 Provider
            ConfigProvider as never,
            { componentDisabled: true } as never,
            {
              default: () =>
                h(CheckableTag as never, { checked: false } as never, { default: () => 'c' }),
            },
          ),
      }),
      { attachTo: document.body },
    );
    await nextTick();
    expect(
      document
        .querySelector<HTMLElement>('.apollo-tag')
        ?.classList.contains('apollo-tag-checkable-disabled'),
    ).toBe(true);
    w.unmount();
  });
});
