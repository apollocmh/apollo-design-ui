/**
 * L1 · 单元测试 + L2 · 交互测试
 *
 * ── L2 为什么只覆盖挂载与 prop 响应 ─────────────────────────────────────────
 *
 * Flex 是**纯布局容器**：没有事件、没有受控/非受控语义、没有焦点管理、没有禁用态。
 * `TESTING.md` 的 L2 六类（鼠标 / 键盘 / 焦点 / 受控 / 禁用）里唯一适用的是
 * 「props 更新 → DOM 更新」—— 用 L1 的响应式用例承担。其余判 `n/a`
 * （依据写进 `registry/components.json` 的 layerNotes），不写凑数用例（反模式 A1）。
 *
 * ── 本文件的四个重心 ─────────────────────────────────────────────────────────
 *
 * 1. **方向合并表** —— orientation > vertical > context.vertical > 'horizontal'，
 *    与 L4 的 `orientation:*` 用例互补：L4 钉 SSR 的 DOM，这里钉**响应式更新**。
 * 2. **context.vertical 回落**（D21 的 Flex 版）：`vertical` 未传必须保持
 *    `undefined` —— `<ConfigProvider flex={{vertical:true}}>` 才能生效；
 *    显式 `vertical:false` 则压过 context（typeof === 'boolean' 判据）。
 * 3. **gap / flex 的内联样式**：数字补 px（gap）、unitless（flex）、0 的边界。
 *    jsdom 不做布局，所以断言的是**内联样式真的出现**，不是布局效果。
 * 4. **ConfigProvider 合并**：className 拼接、style 前后顺序、rtl。
 *
 * ── 这个文件没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明与 antd 的 DOM 一致（那是 L4，semantic.test.ts）
 *   - 没证明像素一致（L6）
 *   - 没证明 CSS 类真的有样式（B7 + L6 的职责）
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, provide } from 'vue';
import type { ConfigContextValue } from '../../config-provider/context';
import { configContextKey, DEFAULT_CONFIG_CONTEXT } from '../../config-provider/context';
import { Flex } from '../index';

/** 兜底前缀 —— 不传 `prefixCls` 时 `getPrefixCls('flex')` 的结果。 */
const P = 'apollo-flex';

const mountFlex = (props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) =>
  mount(Flex, { props, ...(slots ? { slots } : {}) });

/**
 * style 属性读数。jsdom 走 CSSOM，序列化带空格（`flex: 2 2 100px;`），
 * 且会把简写/无单位值规范化 —— 断言一律用 `toContain` + jsdom 的实际形态。
 */
const styleOf = (w: { attributes: (name: string) => string | undefined }): string =>
  w.attributes('style') ?? '';

const withConfig = (config: Partial<ConfigContextValue>) =>
  defineComponent({
    name: 'AFlexConfigProbe',
    setup(_, { slots }) {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => slots.default?.();
    },
  });

const mountWithConfig = (
  config: Partial<ConfigContextValue>,
  props: Record<string, unknown> = {},
) => {
  const Probe = withConfig(config);
  return mount(Probe, {
    slots: { default: () => h(Flex, props, () => 'Content') },
  });
};

describe('Flex · 方向合并（响应式）', () => {
  it('默认水平：无 -vertical 类', () => {
    const w = mountFlex();
    expect(w.classes()).not.toContain(`${P}-vertical`);
    expect(w.classes()).toContain(P);
  });

  it('vertical:true → -vertical', () => {
    const w = mountFlex({ vertical: true });
    expect(w.classes()).toContain(`${P}-vertical`);
  });

  it('orientation 压过 vertical', () => {
    const w = mountFlex({ vertical: true, orientation: 'horizontal' });
    expect(w.classes()).not.toContain(`${P}-vertical`);
  });

  it('props.vertical 更新 → 类名响应式更新（L2）', async () => {
    const w = mountFlex();
    await w.setProps({ vertical: true });
    expect(w.classes()).toContain(`${P}-vertical`);
    await w.setProps({ vertical: false });
    expect(w.classes()).not.toContain(`${P}-vertical`);
  });

  it('context.vertical 回落：vertical 未传时生效', () => {
    const w = mountWithConfig({ components: { flex: { vertical: true } } }, {});
    expect(w.find(`.${P}-vertical`).exists()).toBe(true);
  });

  it('context.vertical 被显式 vertical:false 压过（布尔判据）', () => {
    const w = mountWithConfig({ components: { flex: { vertical: true } } }, { vertical: false });
    expect(w.find(`.${P}-vertical`).exists()).toBe(false);
  });

  it('context.vertical 被 props.orientation 压过', () => {
    const w = mountWithConfig(
      { components: { flex: { vertical: true } } },
      { orientation: 'horizontal' },
    );
    expect(w.find(`.${P}-vertical`).exists()).toBe(false);
  });
});

describe('Flex · wrap / justify / align', () => {
  it('wrap:true → -wrap-wrap', () => {
    const w = mountFlex({ wrap: true });
    expect(w.classes()).toContain(`${P}-wrap-wrap`);
  });

  it('wrap:"nowrap" → -wrap-nowrap', () => {
    const w = mountFlex({ wrap: 'nowrap' });
    expect(w.classes()).toContain(`${P}-wrap-nowrap`);
  });

  it('非法 wrap 值不产生类名', () => {
    const w = mountFlex({ wrap: 'invalid' as never });
    expect(w.classes().some((c) => c.startsWith(`${P}-wrap-`))).toBe(false);
  });

  it('justify:center → -justify-center', () => {
    const w = mountFlex({ justify: 'center' });
    expect(w.classes()).toContain(`${P}-justify-center`);
  });

  it('align:center → -align-center', () => {
    const w = mountFlex({ align: 'center' });
    expect(w.classes()).toContain(`${P}-align-center`);
  });

  it('垂直 + 未传 align → -align-stretch（吃 mergedVertical）', () => {
    const w = mountFlex({ vertical: true });
    expect(w.classes()).toContain(`${P}-align-stretch`);
  });

  it('垂直 + 显式 align → 无 -align-stretch', () => {
    const w = mountFlex({ vertical: true, align: 'center' });
    expect(w.classes()).not.toContain(`${P}-align-stretch`);
  });

  it('水平 + 未传 align → 无 -align-stretch', () => {
    const w = mountFlex();
    expect(w.classes()).not.toContain(`${P}-align-stretch`);
  });

  it('justify / wrap / align 不透传 DOM', () => {
    const w = mountFlex({ justify: 'center', wrap: true, align: 'center' });
    expect('justify' in w.attributes()).toBe(false);
    expect('wrap' in w.attributes()).toBe(false);
    expect('align' in w.attributes()).toBe(false);
  });
});

describe('Flex · flex / gap 内联样式', () => {
  it('flex 字符串原样内联', () => {
    const w = mountFlex({ flex: '2 2 100px' });
    expect(styleOf(w)).toContain('flex: 2 2 100px');
  });

  it('flex 数字 unitless（1 → "1"，不是 "1px"；CSSOM 展开为简写）', () => {
    const w = mountFlex({ flex: 1 });
    expect(styleOf(w)).toContain('flex: 1 1 0%');
  });

  it('gap 预设串走类名，不写内联样式', () => {
    const w = mountFlex({ gap: 'small' });
    expect(w.classes()).toContain(`${P}-gap-small`);
    expect(w.attributes('style') ?? '').not.toContain('gap');
  });

  it('gap:middle 与 gap:medium 都命中同一档类名', () => {
    expect(mountFlex({ gap: 'middle' }).classes()).toContain(`${P}-gap-middle`);
    expect(mountFlex({ gap: 'medium' }).classes()).toContain(`${P}-gap-medium`);
  });

  it('gap 数字补 px（Vue patchStyle 不做转换 —— PITFALLS 32）', () => {
    const w = mountFlex({ gap: 16 });
    expect(styleOf(w)).toContain('gap: 16px');
  });

  it('gap:0 也写内联样式（isNonNullable 判据，与 Space 不同；CSSOM 规范化为 0px）', () => {
    const w = mountFlex({ gap: 0 });
    expect(styleOf(w)).toContain('gap: 0px');
  });

  it('gap 字符串原样内联', () => {
    const w = mountFlex({ gap: '10px' });
    expect(styleOf(w)).toContain('gap: 10px');
  });

  it('gap 未传时不写内联样式', () => {
    const w = mountFlex();
    expect(w.attributes('style') ?? '').not.toContain('gap');
  });
});

describe('Flex · ConfigProvider 合并', () => {
  it('ctx className 与组件 className 拼接', () => {
    const w = mountWithConfig(
      { components: { flex: { className: 'ctx-cls' } } },
      { className: 'own-cls' },
    );
    const probe = w.find(`.${P}`);
    expect(probe.classes()).toContain('ctx-cls');
    expect(probe.classes()).toContain('own-cls');
  });

  it('ctx style 在前、prop style 覆盖', () => {
    const w = mountWithConfig(
      { components: { flex: { style: { padding: '8px', margin: '4px' } } } },
      { style: { margin: '2px' } },
    );
    const style = styleOf(w.find(`.${P}`));
    expect(style).toContain('padding: 8px');
    expect(style).toContain('margin: 2px');
  });

  it('direction:rtl → -rtl', () => {
    const w = mountWithConfig({ direction: 'rtl' }, {});
    expect(w.find(`.${P}-rtl`).exists()).toBe(true);
  });
});

describe('Flex · 其它形态', () => {
  it('component 自定义根元素', () => {
    const w = mountFlex({ component: 'section' });
    expect(w.element.tagName).toBe('SECTION');
  });

  it('attrs 透传（id / data-*）', () => {
    const w = mount(Flex, {
      attrs: { id: 'my-flex', 'data-testid': 'x' },
      slots: { default: () => 'x' },
    });
    expect(w.attributes('id')).toBe('my-flex');
    expect(w.attributes('data-testid')).toBe('x');
  });

  it('默认插槽内容渲染', () => {
    const w = mountFlex({}, { default: () => 'Content' });
    expect(w.text()).toBe('Content');
  });

  it('expose.nativeElement 指向根元素', () => {
    const w = mountFlex();
    expect((w.vm as { nativeElement: HTMLElement }).nativeElement).toBe(w.element);
  });
});
