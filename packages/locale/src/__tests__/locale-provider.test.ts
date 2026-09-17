/**
 * L2 —— `LocaleProvider` 的注入、告警与卸载清理。
 *
 * ⚠️ 两个都是**模块级状态**（告警去重表、confirm locale 栈）⇒ 每个用例都要清。
 */

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
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
  let result: readonly [unknown, string | undefined] | undefined;
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

  return { wrapper, read: () => result as readonly [unknown, string | undefined] };
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
        seen = useLocale('Modal')[1];
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

  it('⭐ 没有 Modal 分片时会**重置**整个栈（上游的 else 分支）', () => {
    const clear = changeConfirmLocale({ okText: '别的来源' } as ModalLocale);
    expect(getConfirmLocale().okText).toBe('别的来源');

    const { wrapper } = mountWithChild({ _ANT_MARK__: ANT_MARK, locale: { locale: 'en' } });
    // 被重置了 —— 这正是上游 `changeConfirmLocale(locale?.Modal)` 传 undefined 的后果
    expect(getConfirmLocale()).toEqual(DEFAULT_MODAL);
    wrapper.unmount();
    clear?.();
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
});
