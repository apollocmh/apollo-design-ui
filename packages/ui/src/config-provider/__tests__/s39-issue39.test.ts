/**
 * Issue #39 · [ConfigProvider] 子级默认 `virtual=true` 覆盖父级 `false`
 *
 * `virtual` 的 prop 声明是 `{ type: Boolean, default: true }` ⇒ `props.virtual`
 * **恒为 boolean**（永不 `undefined`），而合并逻辑是「本层值 `!== undefined` 就覆盖
 * 父级」⇒ 内层 Provider 即使没写 `virtual`，也会把父级的 `virtual=false` 顶成
 * `true`（Issue #39.1）。
 *
 * 上游（antd 6.6.4，React SSR 实测）：
 *   1. 无 Provider                       ⇒ RAW（false）
 *   2. 父 false + 子 Provider 不传       ⇒ RAW（继承 false）
 *   3. 父 true  + 子 Provider 不传       ⇒ VIRTUAL（继承 true）
 *   4. 父 true  + 子 Provider false      ⇒ RAW（子覆盖）
 *
 * 本仓的既有裁决是「**无父级时兜底 `true`**」（antd 文档的 `@default true`，
 * `index.test.ts` 已钉住）⇒ 修法只动**继承**这一层：未传 = `undefined` = 继承父级，
 * 父级也没有时才用 `true`。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick, ref } from 'vue';
import { Listy } from '../../listy';
import { ConfigProvider } from '../ConfigProvider';
import { createProbe } from './probe';

/** 嵌套两层 Provider，把内层注入结果抓出来。 */
const nested = (
  parentProps: Record<string, unknown>,
  childProps: Record<string, unknown> | (() => Record<string, unknown>),
) => {
  const { Probe, captured } = createProbe();
  const child = () => (typeof childProps === 'function' ? childProps() : childProps);
  const w = mount(ConfigProvider, {
    props: parentProps as never,
    slots: { default: () => h(ConfigProvider, child() as never, { default: () => h(Probe) }) },
    attachTo: document.body,
  });
  return { w, captured };
};

const ITEMS = Array.from({ length: 30 }, (_, i) => ({ key: i, content: `Item ${i}` }));
type Item = (typeof ITEMS)[number];

/** 实际消费验证：Listy 在给定上下文下走 Raw（根直接出项）还是 Virtual（有 -holder）。 */
const listyMode = (parentProps: Record<string, unknown>, childProps: Record<string, unknown>) => {
  const w = mount(ConfigProvider, {
    props: parentProps as never,
    slots: {
      default: () =>
        h(ConfigProvider, childProps as never, {
          default: () =>
            h(
              Listy<Item>,
              { items: ITEMS, rowKey: 'key', height: 120 },
              { default: ({ item }: { item: Item; index: number }) => item.content },
            ),
        }),
    },
    attachTo: document.body,
  });
  const mode = w.find('.apollo-listy-holder').exists() ? 'virtual' : 'raw';
  w.unmount();
  return mode;
};

describe('ConfigProvider · Issue #39 virtual 的继承语义', () => {
  it('[A] 守卫：无父级时兜底 true（既有裁决，antd 文档 @default true）', () => {
    const { Probe, captured } = createProbe();
    const w = mount(ConfigProvider, {
      slots: { default: () => h(Probe) },
      attachTo: document.body,
    });
    expect(captured.config.virtual).toBe(true);
    w.unmount();
  });

  it('[B] 父 false + 子不传 ⇒ false（核心回归）', () => {
    const { w, captured } = nested({ virtual: false }, {});
    expect(captured.config.virtual).toBe(false);
    w.unmount();
  });

  it('[C] 父 true + 子不传 ⇒ true（守卫：继承而非恒真）', () => {
    const { w, captured } = nested({ virtual: true }, {});
    expect(captured.config.virtual).toBe(true);
    w.unmount();
  });

  it('[D] 子级显式值覆盖父级（两个方向）', () => {
    const t2f = nested({ virtual: true }, { virtual: false });
    expect(t2f.captured.config.virtual).toBe(false);
    t2f.w.unmount();

    const f2t = nested({ virtual: false }, { virtual: true });
    expect(f2t.captured.config.virtual).toBe(true);
    f2t.w.unmount();
  });

  it('[E] 动态移除子级显式值 ⇒ 回到父级值（不是残留旧值）', async () => {
    const childVirtual = ref<boolean | undefined>(false);
    const { w, captured } = nested({ virtual: true }, () => ({ virtual: childVirtual.value }));
    expect(captured.config.virtual).toBe(false);

    childVirtual.value = undefined;
    await nextTick();
    expect(captured.config.virtual).toBe(true);

    childVirtual.value = false;
    await nextTick();
    expect(captured.config.virtual).toBe(false);
    w.unmount();
  });

  it('[F] 实际消费：Listy 的 Raw/Virtual 跟随继承后的 virtual', () => {
    expect(listyMode({ virtual: false }, {})).toBe('raw');
    expect(listyMode({ virtual: true }, {})).toBe('virtual');
    expect(listyMode({ virtual: true }, { virtual: false })).toBe('raw');
    expect(listyMode({ virtual: false }, { virtual: true })).toBe('virtual');
  });
});
