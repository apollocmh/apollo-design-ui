/**
 * L1/L2 —— `useLocale` 的合并语义。
 *
 * ⚠️ `useLocale` 内部用 `inject`，**必须在组件上下文里调用**。
 *    这里的 helper 统一 mount 一个空组件来提供上下文。
 */

import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type ComputedRef, defineComponent, h, nextTick, provide, shallowRef } from 'vue';
import type { Locale, LocaleComponentName, LocaleContextValue } from '../index';
import { en_US, localeContextKey, useLocale, useLocaleReactive } from '../index';

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

// ===========================================================================
// useLocaleReactive —— 响应式变体（2026-10-04 加，empty D24 的落点）
// ===========================================================================

/**
 * ⚠️ 2026-10-04 补：这个变体**此前一个测试都没有**，而它的 9 条分支全在
 *    `packages/locale/src/use-locale.ts` 里 ⇒ locale 的分支覆盖率从 91.67% 掉到 75%，
 *    低于 foundation 档 95/90/95（`--verify` 刷新数字后 E16 直接红）。
 *
 * 它与 `useLocale` **逐字同语义**（浅合并 / context 侧赢 / `exist` 回退 `'en'`），
 * 差别只在求值时机 —— 所以下面刻意用**同一组输入**再跑一遍，外加一条真正的响应性用例。
 */
function mountUseLocaleReactive<C extends LocaleComponentName>(
  componentName: C,
  defaultLocale?: Locale[C] | (() => Locale[C]),
  // ⚠️ 用**结构类型**而不是 `Ref<LocaleContextValue>`：后者会触发 `UnwrapRef` 的深递归
  //    （`LocaleContextValue` 是嵌套类型）⇒ `vue-tsc` 报 TS2589「类型实例化过深」。
  provided?: LocaleContextValue | (() => LocaleContextValue) | { value: LocaleContextValue },
): {
  wrapper: VueWrapper;
  merged: ComputedRef<Record<string, unknown>>;
  code: ComputedRef<string | undefined>;
} {
  let merged: ComputedRef<Record<string, unknown>> | undefined;
  let code: ComputedRef<string | undefined> | undefined;

  const Child = defineComponent({
    setup() {
      const [m, c] = useLocaleReactive(componentName, defaultLocale as never);
      merged = m as ComputedRef<Record<string, unknown>>;
      code = c;
      return () => null;
    },
  });

  const Parent = defineComponent({
    setup() {
      if (provided !== undefined) {
        provide(localeContextKey, provided as never);
      }
      return () => h(Child);
    },
  });

  const wrapper = mount(Parent);
  return {
    wrapper,
    merged: merged as ComputedRef<Record<string, unknown>>,
    code: code as ComputedRef<string | undefined>,
  };
}

describe('useLocaleReactive · 与 useLocale 同语义', () => {
  it('没有 Provider ⇒ 回退 en_US 分片，code 是 undefined', () => {
    const { merged, code, wrapper } = mountUseLocaleReactive('Modal');
    expect(merged.value).toEqual(en_US.Modal);
    expect(code.value).toBeUndefined();
    wrapper.unmount();
  });

  it('分片不存在 ⇒ 空对象（不是 undefined）', () => {
    const { merged, code, wrapper } = mountUseLocaleReactive('Select');
    expect(merged.value).toEqual({});
    expect(code.value).toBeUndefined();
    wrapper.unmount();
  });

  it('defaultLocale 可以是函数（惰性求值）', () => {
    let calls = 0;
    const { merged, wrapper } = mountUseLocaleReactive('Modal', () => {
      calls += 1;
      return { okText: 'F', cancelText: 'F', justOkText: 'F' };
    });
    expect(merged.value).toEqual({ okText: 'F', cancelText: 'F', justOkText: 'F' });
    expect(calls).toBe(1);
    wrapper.unmount();
  });

  it('有 Provider ⇒ context 分片覆盖默认值（浅合并），code 取 locale', () => {
    const { merged, code, wrapper } = mountUseLocaleReactive('Modal', undefined, {
      locale: 'zh-cn',
      Modal: { okText: '好' },
    } as never);
    expect(merged.value).toEqual({ ...en_US.Modal, okText: '好' });
    expect(code.value).toBe('zh-cn');
    wrapper.unmount();
  });

  it('context 没给这个分片 ⇒ 用默认值', () => {
    const { merged, wrapper } = mountUseLocaleReactive('Modal', undefined, {
      locale: 'zh-cn',
    });
    expect(merged.value).toEqual(en_US.Modal);
    wrapper.unmount();
  });

  it('⭐ exist 为真且没有 locale ⇒ code 回退 "en"', () => {
    const { code, wrapper } = mountUseLocaleReactive('Modal', undefined, { exist: true });
    expect(code.value).toBe('en');
    wrapper.unmount();
  });

  it('⭐ 没有 exist 且没有 locale ⇒ 仍是 undefined（不是 "en"）', () => {
    const { code, wrapper } = mountUseLocaleReactive('Modal', undefined, {});
    expect(code.value).toBeUndefined();
    wrapper.unmount();
  });

  it('⭐ 响应式：Provider 的 locale 变了，merged / code 都跟着重算（它存在的理由）', async () => {
    // ⚠️ `shallowRef` 而非 `ref`：同上，避免 `UnwrapRef` 的深递归（TS2589）。
    const provided = shallowRef<LocaleContextValue>({
      locale: 'zh-cn',
      Modal: { okText: '好' },
    } as never);
    const { merged, code, wrapper } = mountUseLocaleReactive('Modal', undefined, provided);
    expect(merged.value.okText).toBe('好');
    expect(code.value).toBe('zh-cn');

    provided.value = { locale: 'ja-jp', Modal: { okText: 'はい' } } as never;
    await nextTick();
    expect(merged.value.okText).toBe('はい');
    expect(code.value).toBe('ja-jp');
    wrapper.unmount();
  });
});
