/**
 * L1/L2 · 主题矩阵（light / dark / compact / token override）
 *
 * ── 与别的组件的 theme.test.ts 有什么不同 ────────────────────────────────────
 *
 * 别的组件是**消费** token（读 `var(--apollo-*)` 画自己）；`ConfigProvider` 是**产出**
 * token（把 `theme` 变成 CSS 变量写进 DOM）。所以这一层断言的是：
 *
 *   1. 四个状态下作用域元素上都真的写上了变量
 *   2. dark 与 light 的取值**不同**（算法真的跑了）
 *   3. compact 与 light 的取值**不同**
 *   4. `token` 覆盖能逐字盖掉派生结果
 *   5. `algorithm` 可组合（`[darkAlgorithm, compactAlgorithm]`）
 *   6. 切回「没有 theme」时变量被**清干净**（不残留 dark 的值）
 *
 * ⚠️ 这里**不**断言具体色值（`--apollo-color-primary` 是 `#1677ff` 之类）——
 *    那是 `packages/theme` 的 `getDesignToken` 的责任，由它自己的 oracle 测试逐位差分。
 *    本层只证明「ConfigProvider 把 theme 包的输出正确地落到了 DOM 上」。
 */

import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { h, nextTick, ref } from 'vue';
import type { ConfigProviderThemeConfig } from '../index';
import { ConfigProvider } from '../index';

/** 探针：一个空 `<span>`。ConfigProvider 的作用域元素会包在它外面。 */
const probe = () => h('span', { class: 'probe' });

/** 挂载并返回「控制柄」：能读变量、能换 theme、能卸载。 */
function mountTheme(theme: ConfigProviderThemeConfig) {
  const wrapper = mount(ConfigProvider, {
    props: { theme },
    slots: { default: probe },
    attachTo: document.body,
  });
  return wrapper;
}

function varsOf(wrapper: ReturnType<typeof mountTheme>): Record<string, string> {
  const el = wrapper.element as HTMLElement;
  const out: Record<string, string> = {};
  for (const name of el.style) {
    if (name.startsWith('--')) out[name] = el.style.getPropertyValue(name);
  }
  return out;
}

describe('ConfigProvider · 主题矩阵', () => {
  let host: HTMLElement;
  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host?.remove();
  });

  it('light（默认算法）会写满一整套 --apollo-* 变量', async () => {
    const w = mountTheme({});
    await nextTick();
    const vars = varsOf(w);
    expect(Object.keys(vars).length).toBeGreaterThan(100);
    expect(vars['--apollo-color-primary']).toBeTruthy();
    w.unmount();
  });

  it('dark 与 light 的取值不同（算法真的跑了）', async () => {
    const light = mountTheme({});
    await nextTick();
    const lightVars = varsOf(light);
    light.unmount();

    const dark = mountTheme({ algorithm: darkAlgorithm });
    await nextTick();
    const darkVars = varsOf(dark);
    dark.unmount();

    expect(darkVars['--apollo-color-text']).not.toBe(lightVars['--apollo-color-text']);
    expect(darkVars['--apollo-color-bg-base']).not.toBe(lightVars['--apollo-color-bg-base']);
  });

  it('compact 与 light 的取值不同', async () => {
    const light = mountTheme({});
    await nextTick();
    const lightHeight = varsOf(light)['--apollo-control-height'];
    light.unmount();

    const compact = mountTheme({ algorithm: compactAlgorithm });
    await nextTick();
    const compactHeight = varsOf(compact)['--apollo-control-height'];
    compact.unmount();

    expect(compactHeight).toBeTruthy();
    expect(compactHeight).not.toBe(lightHeight);
  });

  it('algorithm 可组合：[dark, compact] 与两者都不同', async () => {
    const dark = mountTheme({ algorithm: darkAlgorithm });
    await nextTick();
    const darkVars = varsOf(dark);
    dark.unmount();

    const both = mountTheme({ algorithm: [darkAlgorithm, compactAlgorithm] });
    await nextTick();
    const bothVars = varsOf(both);
    both.unmount();

    // 组合链的后一个算法在前一个结果上继续派生 ⇒ 与「只跑 dark」至少有 controlHeight 不同
    expect(bothVars['--apollo-control-height']).not.toBe(darkVars['--apollo-control-height']);
    // 且 dark 的底色保留下来
    expect(bothVars['--apollo-color-bg-base']).toBe(darkVars['--apollo-color-bg-base']);
  });

  it('token override 逐字盖掉派生结果', async () => {
    const w = mountTheme({ token: { colorPrimary: '#ff0000' } });
    await nextTick();
    expect(varsOf(w)['--apollo-color-primary']).toBe('#ff0000');
    w.unmount();
  });

  it('cssVarPrefix 可改变量前缀', async () => {
    const w = mountTheme({ cssVarPrefix: 'my', token: { colorPrimary: '#ff0000' } });
    await nextTick();
    expect(varsOf(w)['--my-color-primary']).toBe('#ff0000');
    w.unmount();
  });

  it('L2 · 从 dark 切回默认算法，dark 特有的变量被清掉（不残留）', async () => {
    const theme = ref<ConfigProviderThemeConfig | undefined>({ algorithm: darkAlgorithm });
    const w = mount(ConfigProvider, {
      props: { theme: theme.value },
      slots: { default: probe },
      attachTo: host,
    });
    await nextTick();
    const el = w.element as HTMLElement;
    const darkText = el.style.getPropertyValue('--apollo-color-text');
    expect(darkText).toBeTruthy();

    await w.setProps({ theme: {} });
    const lightText = el.style.getPropertyValue('--apollo-color-text');
    expect(lightText).not.toBe(darkText);
    w.unmount();
  });

  it('L2 · theme 变成 undefined 时变量被全部移除', async () => {
    const w = mount(ConfigProvider, {
      props: { theme: { token: { colorPrimary: '#ff0000' } } },
      slots: { default: probe },
      attachTo: host,
    });
    await nextTick();
    const el = w.element as HTMLElement;
    expect(el.style.getPropertyValue('--apollo-color-primary')).toBe('#ff0000');

    await w.setProps({ theme: undefined });
    expect(el.style.getPropertyValue('--apollo-color-primary')).toBe('');
  });
});
