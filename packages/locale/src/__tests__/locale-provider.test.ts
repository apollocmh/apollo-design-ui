/**
 * L2 —— `LocaleProvider` 的注入、告警与卸载清理。
 *
 * ⚠️ 两个都是**模块级状态**（告警去重表、confirm locale 栈）⇒ 每个用例都要清。
 */

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, reactive, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import type { Locale, ModalLocale } from '../index';
import {
  ANT_MARK,
  changeConfirmLocale,
  en_US,
  getConfirmLocale,
  LocaleProvider,
  resetConfirmLocale,
  resetLocaleWarned,
  useLocale,
} from '../index';

const DEFAULT_MODAL = en_US.Modal as ModalLocale;

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  resetLocaleWarned();
  resetConfirmLocale();
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
  resetLocaleWarned();
  resetConfirmLocale();
});

function printed(): string {
  return errorSpy.mock.calls.flat().join(' ');
}

/** 挂一个「读 Modal 分片」的子组件，用来观察 context。 */
function mountWithChild(providerProps: Record<string, unknown>): {
  wrapper: ReturnType<typeof mount>;
  read: () => readonly [unknown, string | undefined];
} {
  let result: ReturnType<typeof useLocale<'Modal'>> | undefined;
  const Child = defineComponent({
    setup() {
      result = useLocale('Modal');
      return () => null;
    },
  });

  const wrapper = mount(LocaleProvider, {
    props: providerProps,
    slots: { default: () => h(Child) },
  });

  return {
    wrapper,
    read: () => {
      if (!result) throw new Error('Expected the mounted locale consumer');
      return [result[0].value, result[1].value] as const;
    },
  };
}

describe('LocaleProvider · 注入', () => {
  it('⭐ 子组件通过 useLocale 拿到注入的分片', () => {
    const { wrapper, read } = mountWithChild({
      _ANT_MARK__: ANT_MARK,
      locale: { locale: 'zh-cn', Modal: { okText: '好', cancelText: '取消', justOkText: '知道' } },
    });
    expect(read()[0]).toEqual({ okText: '好', cancelText: '取消', justOkText: '知道' });
    expect(read()[1]).toBe('zh-cn');
    wrapper.unmount();
  });

  it('⭐ 没有 locale prop 时（默认 {}）子组件回退到 en_US，且 localeCode 是 "en"', () => {
    const { wrapper, read } = mountWithChild({ _ANT_MARK__: ANT_MARK });
    expect(read()[0]).toEqual(DEFAULT_MODAL);
    // exist: true 且没有 locale 字段 ⇒ 回退到 'en'
    expect(read()[1]).toBe('en');
    wrapper.unmount();
  });

  it('⭐ exist 标志确实被注入了（这是 localeCode 回退的依据）', () => {
    let seen: unknown;
    const Child = defineComponent({
      setup() {
        // 直接读 context 值来断言 exist
        seen = useLocale('Modal')[1].value;
        return () => null;
      },
    });
    const wrapper = mount(LocaleProvider, {
      props: { _ANT_MARK__: ANT_MARK, locale: { locale: 'de-de' } },
      slots: { default: () => h(Child) },
    });
    expect(seen).toBe('de-de');
    wrapper.unmount();
  });
});

describe('LocaleProvider · 废弃告警', () => {
  it('⭐ 传对了 _ANT_MARK__ ⇒ **不**告警（上游 warning(valid) 的语义）', () => {
    const { wrapper } = mountWithChild({ _ANT_MARK__: ANT_MARK });
    expect(printed()).not.toContain('LocaleProvider');
    wrapper.unmount();
  });

  it('⭐ 没传 _ANT_MARK__ ⇒ 告警', () => {
    const { wrapper } = mountWithChild({});
    expect(printed()).toContain('LocaleProvider');
    expect(printed()).toContain('deprecated');
    wrapper.unmount();
  });

  it('⭐ 传错了标记 ⇒ 也告警', () => {
    const { wrapper } = mountWithChild({ _ANT_MARK__: 'something-else' });
    expect(printed()).toContain('LocaleProvider');
    wrapper.unmount();
  });

  it('⭐ 同一句话只打一次（去重）', () => {
    const first = mountWithChild({});
    first.wrapper.unmount();
    const countAfterFirst = errorSpy.mock.calls.length;

    const second = mountWithChild({});
    second.wrapper.unmount();
    expect(errorSpy.mock.calls.length).toBe(countAfterFirst);
  });

  it('ANT_MARK 的值就是 "internalMark"', () => {
    expect(ANT_MARK).toBe('internalMark');
  });
});

describe('LocaleProvider · confirm locale 的注册与清理', () => {
  it('⭐ 挂载时注册 Modal 分片', () => {
    const { wrapper } = mountWithChild({
      _ANT_MARK__: ANT_MARK,
      locale: { locale: 'zh-cn', Modal: { okText: '好' } as ModalLocale },
    });
    expect(getConfirmLocale()).toEqual({ ...DEFAULT_MODAL, okText: '好' });
    wrapper.unmount();
  });

  it('⭐ 卸载时反注册 ⇒ 回到默认', () => {
    const { wrapper } = mountWithChild({
      _ANT_MARK__: ANT_MARK,
      locale: { locale: 'zh-cn', Modal: { okText: '好' } as ModalLocale },
    });
    wrapper.unmount();
    expect(getConfirmLocale()).toEqual(DEFAULT_MODAL);
  });

  it('⭐ locale prop 变化时会重新注册（旧的先弹出）', async () => {
    const { wrapper } = mountWithChild({
      _ANT_MARK__: ANT_MARK,
      locale: { locale: 'zh-cn', Modal: { okText: 'A' } as ModalLocale },
    });
    expect(getConfirmLocale().okText).toBe('A');

    await wrapper.setProps({
      locale: { locale: 'zh-cn', Modal: { okText: 'B' } as ModalLocale },
    });
    // 旧的那层被弹出，只剩新的 ⇒ 不是 'A' 也不是「A 覆盖 B」之外的残留
    expect(getConfirmLocale().okText).toBe('B');
    wrapper.unmount();
    expect(getConfirmLocale()).toEqual(DEFAULT_MODAL);
  });

  it('a provider without a Modal slice preserves another source registration', () => {
    const clear = changeConfirmLocale({ okText: '别的来源' } as ModalLocale);
    expect(getConfirmLocale().okText).toBe('别的来源');

    const { wrapper } = mountWithChild({ _ANT_MARK__: ANT_MARK, locale: { locale: 'en' } });
    expect(getConfirmLocale()).toEqual({ ...DEFAULT_MODAL, okText: '别的来源' });
    wrapper.unmount();
    expect(getConfirmLocale().okText).toBe('别的来源');
    clear?.();
    expect(getConfirmLocale()).toEqual(DEFAULT_MODAL);
  });
});

describe('LocaleProvider · 渲染', () => {
  it('⭐ 只提供 context，渲染的是 children（不产出任何 DOM）', () => {
    const wrapper = mount(LocaleProvider, {
      props: { _ANT_MARK__: ANT_MARK, locale: {} as Locale },
      slots: { default: () => h('div', { 'data-child': '' }, '内容') },
    });
    expect(wrapper.html()).toBe('<div data-child="">内容</div>');
    wrapper.unmount();
  });

  it('没有默认插槽时渲染空', () => {
    const wrapper = mount(LocaleProvider, { props: { _ANT_MARK__: ANT_MARK } });
    expect(wrapper.html()).toBe('');
    wrapper.unmount();
  });

  it('renders current complete slots without applying provider attrs to their DOM', async () => {
    const locale = shallowRef<Partial<Locale>>({});
    const showSlot = shallowRef(true);
    const click = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            LocaleProvider,
            { locale: locale.value, _ANT_MARK__: ANT_MARK, class: 'provider', onClick: click },
            showSlot.value
              ? { default: () => [0, ' text ', h('input', { key: 'editor', value: 'draft' })] }
              : {},
          ),
      }),
    );
    const input = wrapper.get('input').element;
    expect(input.parentNode?.textContent).toBe('0 text ');
    expect(input.className).toBe('');
    await wrapper.get('input').trigger('click');
    expect(click).not.toHaveBeenCalled();

    locale.value = { locale: 'replacement' };
    await nextTick();
    expect(wrapper.get('input').element).toBe(input);
    showSlot.value = false;
    await nextTick();
    expect(wrapper.html()).toBe('');
    showSlot.value = true;
    await nextTick();
    expect(wrapper.get('input').element.parentNode?.textContent).toBe('0 text ');
    wrapper.unmount();
  });
});

describe('LocaleProvider · live ownership and SSR', () => {
  it('retains the parent position when its first Modal source arrives after the child mounts', async () => {
    const outer = shallowRef<Partial<Locale>>({});
    const inner = { Modal: { okText: 'Inner', cancelText: 'Cancel', justOkText: 'OK' } };
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(LocaleProvider, { locale: outer.value, _ANT_MARK__: ANT_MARK }, () =>
            h(LocaleProvider, { locale: inner, _ANT_MARK__: ANT_MARK }),
          ),
      }),
    );
    expect(getConfirmLocale().okText).toBe('Inner');
    outer.value = {
      Modal: { okText: 'Late outer', cancelText: 'Cancel', justOkText: 'OK' },
    };
    await nextTick();
    expect(getConfirmLocale().okText).toBe('Inner');
    wrapper.unmount();
    expect(getConfirmLocale()).toEqual(DEFAULT_MODAL);
    outer.value = {
      Modal: { okText: 'Unmounted outer', cancelText: 'Cancel', justOkText: 'OK' },
    };
    await nextTick();
    expect(getConfirmLocale()).toEqual(DEFAULT_MODAL);
  });

  it('preserves the inner source priority when a mounted parent changes or restores Modal', async () => {
    const outer = shallowRef<Locale>({
      locale: 'outer',
      Modal: { okText: 'Outer', cancelText: 'Cancel', justOkText: 'OK' },
    });
    const inner: Locale = {
      locale: 'inner',
      Modal: { okText: 'Inner', cancelText: 'Cancel', justOkText: 'OK' },
    };
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(LocaleProvider, { locale: outer.value, _ANT_MARK__: ANT_MARK }, () =>
            h(LocaleProvider, { locale: inner, _ANT_MARK__: ANT_MARK }),
          ),
      }),
    );
    expect(getConfirmLocale().okText).toBe('Inner');

    outer.value = {
      locale: 'outer-2',
      Modal: { okText: 'Changed outer', cancelText: 'Cancel', justOkText: 'OK' },
    };
    await nextTick();
    expect(getConfirmLocale().okText).toBe('Inner');

    outer.value = { locale: 'outer-3' };
    await nextTick();
    expect(getConfirmLocale().okText).toBe('Inner');
    outer.value = {
      locale: 'outer-4',
      Modal: { okText: 'Restored outer', cancelText: 'Cancel', justOkText: 'OK' },
    };
    await nextTick();
    expect(getConfirmLocale().okText).toBe('Inner');
    wrapper.unmount();
    expect(getConfirmLocale()).toEqual(DEFAULT_MODAL);
  });

  it('keeps two app contexts isolated while static sources retain mount order', async () => {
    const firstLocale = shallowRef<Locale>({
      locale: 'first',
      Modal: { okText: 'First app', cancelText: 'Cancel', justOkText: 'OK' },
    });
    const Consumer = defineComponent({
      setup() {
        const [locale, code] = useLocale('Modal');
        return () => h('p', `${code.value}: ${locale.value.okText}`);
      },
    });
    const first = mount(
      defineComponent({
        setup: () => () =>
          h(LocaleProvider, { locale: firstLocale.value, _ANT_MARK__: ANT_MARK }, () =>
            h(Consumer),
          ),
      }),
    );
    const second = mount(LocaleProvider, {
      props: {
        _ANT_MARK__: ANT_MARK,
        locale: {
          locale: 'second',
          Modal: { okText: 'Second app', cancelText: 'Cancel', justOkText: 'OK' },
        },
      },
      slots: { default: () => h(Consumer) },
    });
    expect(first.text()).toBe('first: First app');
    expect(second.text()).toBe('second: Second app');
    expect(getConfirmLocale().okText).toBe('Second app');

    firstLocale.value = {
      locale: 'first-updated',
      Modal: { okText: 'First updated', cancelText: 'Cancel', justOkText: 'OK' },
    };
    await nextTick();
    expect(first.text()).toBe('first-updated: First updated');
    expect(second.text()).toBe('second: Second app');
    expect(getConfirmLocale().okText).toBe('Second app');
    second.unmount();
    expect(getConfirmLocale().okText).toBe('First updated');
    first.unmount();
    expect(getConfirmLocale()).toEqual(DEFAULT_MODAL);
  });

  it('tracks deep Modal updates and withdraws only its own registration', async () => {
    const other = changeConfirmLocale({ okText: 'Other', cancelText: 'Cancel', justOkText: 'OK' });
    const locale = shallowRef<Locale>(
      reactive({
        locale: 'en',
        Modal: { okText: 'First', cancelText: 'Cancel', justOkText: 'OK' },
      }),
    );
    const wrapper = mount(
      defineComponent({
        setup: () => () => h(LocaleProvider, { locale: locale.value, _ANT_MARK__: ANT_MARK }),
      }),
    );
    expect(getConfirmLocale().okText).toBe('First');
    if (!locale.value.Modal) throw new Error('Expected a Modal slice');
    locale.value.Modal.okText = 'Second';
    await nextTick();
    expect(getConfirmLocale().okText).toBe('Second');
    locale.value = { locale: 'fr' };
    await nextTick();
    expect(getConfirmLocale().okText).toBe('Other');
    wrapper.unmount();
    expect(getConfirmLocale().okText).toBe('Other');
    other?.();
  });

  it('does not register request-local Modal data while rendering on the server', async () => {
    const other = changeConfirmLocale({ okText: 'Other', cancelText: 'Cancel', justOkText: 'OK' });
    await renderToString(
      createSSRApp({
        render: () =>
          h(
            LocaleProvider,
            {
              _ANT_MARK__: ANT_MARK,
              locale: {
                locale: 'ssr',
                Modal: { okText: 'SSR', cancelText: 'Cancel', justOkText: 'OK' },
              },
            },
            () => h('p', 'Server content'),
          ),
      }),
    );
    expect(getConfirmLocale().okText).toBe('Other');
    other?.();
  });

  it('renders concurrent SSR requests from their own contexts without changing the static fallback', async () => {
    const other = changeConfirmLocale({ okText: 'Client', cancelText: 'Cancel', justOkText: 'OK' });
    const Consumer = defineComponent({
      setup() {
        const [locale, code] = useLocale('Modal');
        return () => h('p', `${code.value}: ${locale.value.okText}`);
      },
    });
    const renderRequest = (code: string) =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              LocaleProvider,
              {
                _ANT_MARK__: ANT_MARK,
                locale: {
                  locale: code,
                  Modal: { okText: code, cancelText: 'Cancel', justOkText: 'OK' },
                },
              },
              () => h(Consumer),
            ),
        }),
      );
    const rendered = await Promise.all([renderRequest('first'), renderRequest('second')]);
    expect(rendered[0]).toContain('<p>first: first</p>');
    expect(rendered[1]).toContain('<p>second: second</p>');
    expect(getConfirmLocale().okText).toBe('Client');
    other?.();
  });
});
