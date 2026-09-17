/**
 * L5 · 无障碍测试
 *
 * ── 为什么 Empty 的 L5 内容很少 ──────────────────────────────────────────────
 *
 * antd 的 `Empty` **没有任何显式 `aria-*`**（它的 `a11y.test.ts` 对 Empty 只做通用检查）。
 * 唯一与无障碍相关的是插画 SVG 里的 `<title>` —— 给图形一个可访问名。
 *
 * 所以这一层的落点是：
 *   1. axe 自动扫描（对全部 demo，0 violation）
 *   2. 断言 `<title>` 的**文本回退规则**（`locale.description || 'Empty'`）
 *   3. 断言字符串插画的 `<img alt>` 计算规则
 *
 * ⚠️ 这个测试**没有**证明键盘可达性 —— Empty 没有任何可聚焦元素，也就没有键盘路径。
 *    这是「架构上不适用」，不是「没测」。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { Empty, PRESENTED_IMAGE_DEFAULT, PRESENTED_IMAGE_SIMPLE } from '../index';

const P = 'apollo';

a11yDemoTest('Empty', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Empty · 可访问名', () => {
  it('默认插画的 <title> 取自 locale 的 description', () => {
    const title = mount(Empty, { props: { prefixCls: P } }).find('svg title');
    expect(title.exists()).toBe(true);
    expect(title.text()).toBe('No data');
  });

  it('简洁插画同样带 <title>', () => {
    const w = mount(Empty, {
      props: { prefixCls: P, image: PRESENTED_IMAGE_SIMPLE },
    });
    expect(w.find('svg title').text()).toBe('No data');
  });

  it('默认插画与简洁插画是**两个不同**的图形（title 相同，但 viewBox 不同）', () => {
    const a = mount(Empty, {
      props: { prefixCls: P, image: PRESENTED_IMAGE_DEFAULT },
    });
    const b = mount(Empty, {
      props: { prefixCls: P, image: PRESENTED_IMAGE_SIMPLE },
    });
    expect(a.find('svg').attributes('viewBox')).toBe('0 0 184 152');
    expect(b.find('svg').attributes('viewBox')).toBe('0 0 64 41');
  });

  it('字符串插画：<img> 必须有非空 alt（可访问名不能丢）', () => {
    const img = mount(Empty, {
      props: { prefixCls: P, image: 'https://example.com/a.png' },
    }).find('img');
    expect(img.attributes('alt')).toBe('No data');
  });

  it('传节点 description 时 <img> 的 alt 回退为 `empty`（不为空）', () => {
    const img = mount(Empty, {
      props: {
        prefixCls: P,
        description: h('span', null, 'x'),
        image: 'https://e.com/a.png',
      },
    }).find('img');
    expect(img.attributes('alt')).toBe('empty');
  });
});

describe('Empty · 结构语义', () => {
  it('根元素是普通 div —— 它不承担 landmark 角色，也不该假装承担', () => {
    const w = mount(Empty, { props: { prefixCls: P } });
    expect(w.element.tagName).toBe('DIV');
    // 断言「没有」也是断言：给纯装饰性容器乱加 role 反而会污染屏幕阅读器的结构导航。
    expect(w.attributes('role')).toBeUndefined();
    expect(w.attributes('aria-label')).toBeUndefined();
  });
});
