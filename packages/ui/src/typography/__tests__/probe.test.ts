import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Link, Paragraph, Text, Title, Typography } from '../index';

const P = 'apollo-typography';

describe('probe', () => {
  it('Typography 本体', () => {
    const w = mount(Typography, { props: { prefixCls: P }, slots: { default: () => 'hi' } });
    expect(w.html()).toBe('<article class="apollo-typography">hi</article>');
  });

  it('Text 基本', () => {
    const w = mount(Text, { props: { prefixCls: P }, slots: { default: () => 'hello' } });
    expect(w.html()).toBe(`<span class="${P}">hello</span>`);
  });

  it('Text 装饰嵌套顺序', () => {
    const w = mount(Text, {
      props: {
        prefixCls: P,
        delete: true,
        mark: true,
        code: true,
        underline: true,
        strong: true,
        keyboard: true,
        italic: true,
      },
      slots: { default: () => 'deco' },
    });
    expect(w.html()).toBe(
      `<span class="${P}"><i><kbd><mark><code><del><u><strong>deco</strong></u></del></code></mark></kbd></i></span>`,
    );
  });

  it('Text 语义色 + 禁用', () => {
    const w = mount(Text, {
      props: { prefixCls: P, type: 'danger', disabled: true },
      slots: { default: () => 'x' },
    });
    expect(w.html()).toBe(`<span class="${P} ${P}-danger ${P}-disabled">x</span>`);
  });

  it('Title level', () => {
    const w = mount(Title, { props: { prefixCls: P, level: 3 }, slots: { default: () => 'H' } });
    expect(w.html()).toBe(`<h3 class="${P}">H</h3>`);
  });

  it('Paragraph', () => {
    const w = mount(Paragraph, { props: { prefixCls: P }, slots: { default: () => 'P' } });
    expect(w.html()).toBe(`<div class="${P}">P</div>`);
  });

  it('Link rel 兜底', () => {
    const w = mount(Link, {
      props: { prefixCls: P, href: 'https://x', target: '_blank' },
      slots: { default: () => 'Apollo' },
    });
    const a = w.find('a');
    expect(a.attributes()).toEqual({
      class: `${P} ${P}-link`,
      href: 'https://x',
      target: '_blank',
      rel: 'noopener noreferrer',
    });
  });

  it('Text copyable', () => {
    const w = mount(Text, {
      props: { prefixCls: P, copyable: true },
      slots: { default: () => 'copy me' },
    });
    const root = w.find('span');
    // ⚠️ 不能直接断言 `childNodes.length`：Vue 的 Fragment 走「慢路径」时会插入
    //    **空文本节点**当锚点（`<span>` 前后各一串），它们不参与 `outerHTML` 序列化、
    //    不影响渲染，但不是 antd SSR 输出的一部分。所以先把空文本节点滤掉再断言。
    const meaningful = Array.from(root.element.childNodes).filter(
      (node) => !(node.nodeType === Node.TEXT_NODE && node.textContent === ''),
    );
    expect(meaningful.map((node) => node.nodeName)).toEqual(['#text', 'SPAN']);
    expect(meaningful[0]?.textContent).toBe('copy me');

    const actions = root.find(`.${P}-actions`);
    expect(actions.exists()).toBe(true);
    expect(actions.findAll('button').length).toBe(1);
    expect(actions.find('button').attributes('aria-label')).toBe('Copy');
    // 有内容 ⇒ 不是「仅图标」模式
    expect(actions.find('button').classes()).not.toContain(`${P}-copy-icon-only`);
  });

  it('Text copyable 无内容时进入仅图标模式', () => {
    const w = mount(Text, { props: { prefixCls: P, copyable: true } });
    const button = w.find(`.${P}-copy`);
    expect(button.exists()).toBe(true);
    expect(button.classes()).toContain(`${P}-copy-icon-only`);
  });
});
