import { themeTest } from '@apollo-design/test-utils';
import { darkAlgorithm } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Empty } from '../index';
import { genEmptyStyle } from '../style';

const P = 'apollo';

themeTest('Empty', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Empty · source theme and static CSS', () => {
  it('updates the current artwork palette without replacing either illustration', async () => {
    const dark = ref(false);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              theme: dark.value ? { algorithm: darkAlgorithm } : undefined,
            },
            () => h(Empty),
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    const svg = w.get('svg').element;
    const initial = w.findAll('[fill]').map((n) => n.attributes('fill'));
    dark.value = true;
    await nextTick();
    expect(w.get('svg').element).toBe(svg);
    expect(w.findAll('[fill]').map((n) => n.attributes('fill'))).not.toEqual(initial);
    dark.value = false;
    await nextTick();
    expect(w.get('svg').element).toBe(svg);
    expect(w.findAll('[fill]').map((n) => n.attributes('fill'))).toEqual(initial);
    w.unmount();
  });

  it('★ 样式里没有任何字面视觉值（全部走 var(--apollo-*)）', () => {
    const css = genEmptyStyle(P);
    // 允许出现的字面值只有：结构性关键字与百分比/倍数。
    // 颜色、圆角、字号、间距、阴影一律不允许出现。
    const suspicious = css.match(/#[0-9a-f]{3,8}\b|rgba?\(|\b\d+px\b/g) ?? [];
    expect(suspicious).toEqual([]);
  });

  it('样式里引用的变量名全部是 `--apollo-*` 形态', () => {
    const vars = [...genEmptyStyle(P).matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1] ?? '');
    expect(vars.length).toBeGreaterThan(0);
    for (const name of vars) {
      expect(name.startsWith('--apollo-')).toBe(true);
    }
  });

  it('前缀不同则产物不同（否则 prefixCls 参数是摆设）', () => {
    expect(genEmptyStyle('apollo')).not.toBe(genEmptyStyle('ant'));
    // 2026-09-18 修：原断言写 `.ant-image`，但 Empty 根类名是 `${prefixCls}-empty`，
    // 子类选择器是 `${prefixCls}-empty-image`（与 antd 的 `ant-empty-image` 对齐）。
    expect(genEmptyStyle('ant')).toContain('.ant-empty-image');
  });
});
