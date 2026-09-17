/**
 * L1/L2 —— `useLocale` 的合并语义。
 *
 * ⚠️ `useLocale` 内部用 `inject`，**必须在组件上下文里调用**。
 *    这里的 helper 统一 mount 一个空组件来提供上下文。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, provide } from 'vue';
import type { Locale, LocaleComponentName, LocaleContextValue } from '../index';
import { en_US, localeContextKey, useLocale } from '../index';

/**
 * ⚠️ **必须父提供、子读取** —— `inject` 只沿父链解析，
 *    组件拿不到自己在同一个 `setup` 里 `provide` 的东西。
 *    第一版 helper 把 provide 与 inject 写在同一个 setup 里，于是 5 个用例全绿不了。
 */
function callUseLocale<C extends LocaleComponentName>(
  componentName: C,
  defaultLocale?: Locale[C] | (() => Locale[C]),
  provided?: LocaleContextValue | (() => LocaleContextValue),
): readonly [Record<string, unknown>, string | undefined] {
  let result: readonly [Record<string, unknown>, string | undefined] | undefined;

  const Child = defineComponent({
    setup() {
      result = useLocale(componentName, defaultLocale as never) as readonly [
        Record<string, unknown>,
        string | undefined,
      ];
      return () => null;
    },
  });

  const Parent = defineComponent({
    setup() {
      if (provided !== undefined) {
        provide(localeContextKey, provided);
      }
      return () => h(Child);
    },
  });

  const wrapper = mount(Parent);
  wrapper.unmount();
  return result as readonly [Record<string, unknown>, string | undefined];
}

describe('useLocale · 没有 Provider 时', () => {
  it('⭐ 回退到 en_US 的对应分片', () => {
    const [locale] = callUseLocale('Modal');
    expect(locale).toEqual(en_US.Modal);
  });

  it('⭐ localeCode 是 undefined（没有 Provider 就没有语言码）', () => {
    const [, code] = callUseLocale('Modal');
    expect(code).toBeUndefined();
  });

  it('传了 defaultLocale 时优先用它', () => {
    const [locale] = callUseLocale('Modal', { okText: 'X', cancelText: 'Y', justOkText: 'Z' });
    expect(locale).toEqual({ okText: 'X', cancelText: 'Y', justOkText: 'Z' });
  });

  it('⭐ defaultLocale 可以是函数（惰性求值）', () => {
    let calls = 0;
    const [locale] = callUseLocale('Modal', () => {
      calls += 1;
      return { okText: 'F', cancelText: 'F', justOkText: 'F' };
    });
    expect(locale).toEqual({ okText: 'F', cancelText: 'F', justOkText: 'F' });
    expect(calls).toBe(1);
  });

  it('⭐ Select 分片在 en_US 里不存在 ⇒ 得到空对象（不是 undefined）', () => {
    const [locale] = callUseLocale('Select');
    expect(locale).toEqual({});
  });
});

describe('useLocale · 有 Provider 时', () => {
  it('⭐ context 的分片覆盖默认值（浅合并）', () => {
    const [locale, code] = callUseLocale('Modal', undefined, {
      locale: 'zh-cn',
      Modal: { okText: '好', cancelText: '取消', justOkText: '知道了' },
    });
    expect(locale).toEqual({ okText: '好', cancelText: '取消', justOkText: '知道了' });
    expect(code).toBe('zh-cn');
  });

  it('⭐ 浅合并：context 只给一个**兄弟**字段时，其余字段保留默认值', () => {
    const [locale] = callUseLocale('Modal', undefined, {
      locale: 'zh-cn',
      Modal: { okText: '好' } as never,
    });
    // 这是「分片级别的浅合并」：{...en_US.Modal, ...{okText:'好'}}
    expect(locale).toEqual({ ...en_US.Modal, okText: '好' });
  });

  it('⭐ 分片里的嵌套对象只能**整体**给出，不能只改其中一个键', () => {
    // en_US.Form.defaultValidateMessages 有 10 个键；想改 required 就必须把整份都写出来
    const [locale] = callUseLocale('Form', undefined, {
      locale: 'zh-cn',
      Form: { defaultValidateMessages: { required: '自定义' } } as never,
    });
    // 整个 defaultValidateMessages 被替换 ⇒ 默认的那 10 个键**不会**补进来
    expect(locale.defaultValidateMessages).toEqual({ required: '自定义' });
    expect(locale.defaultValidateMessages).not.toHaveProperty('enum');
    expect(locale.defaultValidateMessages).not.toHaveProperty('string');
  });

  it('⭐ 对照：不覆盖嵌套对象时，默认的整份都在', () => {
    const [locale] = callUseLocale('Form', undefined, { locale: 'zh-cn' });
    expect(Object.keys(locale.defaultValidateMessages ?? {}).sort()).toEqual(
      Object.keys(en_US.Form?.defaultValidateMessages ?? {}).sort(),
    );
  });

  it('context 没给这个分片 ⇒ 用默认值', () => {
    const [locale] = callUseLocale('Modal', undefined, { locale: 'zh-cn' });
    expect(locale).toEqual(en_US.Modal);
  });

  it('⭐ exist 为真且没有 locale 字段 ⇒ localeCode 回退到 "en"', () => {
    const [, code] = callUseLocale('Modal', undefined, { exist: true });
    expect(code).toBe('en');
  });

  it('⭐ exist 为真但给了 locale 字段 ⇒ 用给的', () => {
    const [, code] = callUseLocale('Modal', undefined, { locale: 'ja-jp', exist: true });
    expect(code).toBe('ja-jp');
  });

  it('⭐ 没有 exist 且没有 locale 字段 ⇒ 仍是 undefined（不是 "en"）', () => {
    const [, code] = callUseLocale('Modal', undefined, {});
    expect(code).toBeUndefined();
  });

  it('⭐ context 是 getter（函数）也能用 —— LocaleProvider 提供的就是 computed', () => {
    const [, code] = callUseLocale('Modal', undefined, () => ({
      locale: 'fr-fr',
      Modal: en_US.Modal,
    }));
    expect(code).toBe('fr-fr');
  });
});
