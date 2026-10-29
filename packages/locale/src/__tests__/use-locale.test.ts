/**
 * L1/L2 —— `useLocale` 的合并语义。
 *
 * ⚠️ `useLocale` 内部用 `inject`，**必须在组件上下文里调用**。
 *    这里的 helper 统一 mount 一个空组件来提供上下文。
 */

import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type ComputedRef, defineComponent, h, nextTick, provide, shallowRef } from 'vue';
import type {
  Locale,
  LocaleComponentName,
  LocaleContextSource,
  LocaleContextValue,
} from '../index';
import { en_US, localeContextKey, useLocale, zh_CN } from '../index';

/**
 * ⚠️ **必须父提供、子读取** —— `inject` 只沿父链解析，
 *    组件拿不到自己在同一个 `setup` 里 `provide` 的东西。
 *    第一版 helper 把 provide 与 inject 写在同一个 setup 里，于是 5 个用例全绿不了。
 */
function callUseLocale<C extends LocaleComponentName>(
  componentName: C,
  defaultLocale?: Locale[C] | (() => Locale[C]),
  provided?: LocaleContextSource,
): readonly [NonNullable<Locale[C]>, string | undefined] {
  let current: ReturnType<typeof useLocale<C>> | undefined;
  const Child = defineComponent({
    setup() {
      current = useLocale(componentName, defaultLocale);
      return () => null;
    },
  });
  const Parent = defineComponent({
    setup() {
      if (provided !== undefined) provide(localeContextKey, provided);
      return () => h(Child);
    },
  });
  const wrapper = mount(Parent);
  if (!current) throw new Error('Expected the mounted locale consumer');
  const result = [current[0].value, current[1].value] as const;
  wrapper.unmount();
  return result;
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

/** Keep the consumer mounted to assert replacement and current computed refs. */
function mountUseLocale<C extends LocaleComponentName>(
  componentName: C,
  defaultLocale?: Locale[C] | (() => Locale[C]),
  provided?: LocaleContextSource,
): {
  wrapper: VueWrapper;
  merged: ComputedRef<NonNullable<Locale[C]>>;
  code: ComputedRef<string | undefined>;
} {
  let current: ReturnType<typeof useLocale<C>> | undefined;
  const Child = defineComponent({
    setup() {
      current = useLocale(componentName, defaultLocale);
      return () => null;
    },
  });
  const Parent = defineComponent({
    setup() {
      if (provided !== undefined) provide(localeContextKey, provided);
      return () => h(Child);
    },
  });
  const wrapper = mount(Parent);
  if (!current) throw new Error('Expected the mounted locale consumer');
  return { wrapper, merged: current[0], code: current[1] };
}

describe('useLocale · computed refs and mounted consumers', () => {
  it('没有 Provider ⇒ 回退 en_US 分片，code 是 undefined', () => {
    const { merged, code, wrapper } = mountUseLocale('Modal');
    expect(merged.value).toEqual(en_US.Modal);
    expect(code.value).toBeUndefined();
    wrapper.unmount();
  });

  it('分片不存在 ⇒ 空对象（不是 undefined）', () => {
    const { merged, code, wrapper } = mountUseLocale('Select');
    expect(merged.value).toEqual({});
    expect(code.value).toBeUndefined();
    wrapper.unmount();
  });

  it('defaultLocale 可以是函数（惰性求值）', () => {
    let calls = 0;
    const { merged, wrapper } = mountUseLocale('Modal', () => {
      calls += 1;
      return { okText: 'F', cancelText: 'F', justOkText: 'F' };
    });
    expect(merged.value).toEqual({ okText: 'F', cancelText: 'F', justOkText: 'F' });
    expect(calls).toBe(1);
    wrapper.unmount();
  });

  it('有 Provider ⇒ context 分片覆盖默认值（浅合并），code 取 locale', () => {
    const { merged, code, wrapper } = mountUseLocale('Modal', undefined, {
      locale: 'zh-cn',
      Modal: { okText: '好' },
    } as never);
    expect(merged.value).toEqual({ ...en_US.Modal, okText: '好' });
    expect(code.value).toBe('zh-cn');
    wrapper.unmount();
  });

  it('context 没给这个分片 ⇒ 用默认值', () => {
    const { merged, wrapper } = mountUseLocale('Modal', undefined, {
      locale: 'zh-cn',
    });
    expect(merged.value).toEqual(en_US.Modal);
    wrapper.unmount();
  });

  it('⭐ exist 为真且没有 locale ⇒ code 回退 "en"', () => {
    const { code, wrapper } = mountUseLocale('Modal', undefined, { exist: true });
    expect(code.value).toBe('en');
    wrapper.unmount();
  });

  it('⭐ 没有 exist 且没有 locale ⇒ 仍是 undefined（不是 "en"）', () => {
    const { code, wrapper } = mountUseLocale('Modal', undefined, {});
    expect(code.value).toBeUndefined();
    wrapper.unmount();
  });

  it('⭐ 响应式：Provider 的 locale 变了，merged / code 都跟着重算（它存在的理由）', async () => {
    // ⚠️ `shallowRef` 而非 `ref`：同上，避免 `UnwrapRef` 的深递归（TS2589）。
    const provided = shallowRef<LocaleContextValue>({
      locale: 'zh-cn',
      Modal: { okText: '好' },
    } as never);
    const { merged, code, wrapper } = mountUseLocale('Modal', undefined, provided);
    expect(merged.value.okText).toBe('好');
    expect(code.value).toBe('zh-cn');

    provided.value = { locale: 'ja-jp', Modal: { okText: 'はい' } } as never;
    await nextTick();
    expect(merged.value.okText).toBe('はい');
    expect(code.value).toBe('ja-jp');
    wrapper.unmount();
  });
});

it('global.clear supports zh_CN and en_US, with an English fallback for other fragments', () => {
  expect(callUseLocale('global', undefined, en_US)[0].clear).toBe('Clear input');
  expect(callUseLocale('global', undefined, zh_CN)[0].clear).toBe('清空输入');
  expect(
    callUseLocale('global', undefined, { locale: 'fr', global: { close: 'Fermer' } })[0],
  ).toMatchObject({ close: 'Fermer', clear: 'Clear input' });
});
