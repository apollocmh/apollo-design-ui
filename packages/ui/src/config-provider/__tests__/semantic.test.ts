/**
 * L4 · DOM 契约
 *
 * ── 为什么这里没有 React 基线比对 ────────────────────────────────────────────
 *
 * 规则 T11 要求 DOM 契约的基准来自 React 参考实现的实测 DOM。但 `ConfigProvider`
 * **不产任何 DOM**（antd 的实现里只有两个渲染 `null` 的内部件 + `children`），
 * 它没有可采集的 DOM 基线 —— 这不是「没做」，是架构上不适用（`layerNotes` 已登记）。
 *
 * 所以本层改为锁**它对下游产生的 DOM 影响**，也就是它真正的契约面：
 *
 *   1. `prefixCls` 派生出的类名（含嵌套继承）
 *   2. `direction === 'rtl'` 时的 `-rtl` 后缀
 *   3. 组件配置里的 `className` / `style` / `classNames` / `styles` 的落点
 *   4. `theme` 作用域元素的形态（`display: contents`，且只在本层给了 theme 时出现）
 *
 * ── 为什么用 Empty 当「下游」─────────────────────────────────────────────────
 *
 * `empty` 是 registry 里声明的 config-provider **运行时组件依赖**（`dependencies.components`），
 * 也是本仓唯一同时消费 `getPrefixCls` / `direction` / `className` / `style` /
 * `classNames` / `styles` 的已落地组件 —— 用它当探针覆盖面最大，
 * 而这些断言**不需要**额外的 oracle（Empty 自己的 DOM 已由它自己的 L4 与基线锁定）。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { Empty } from '../../empty';
import { ConfigProvider } from '../index';

const P = 'apollo';

describe('ConfigProvider · DOM 契约（本体）', () => {
  it('本体不产 DOM：渲染结果就是 slot 本身', () => {
    const w = mount(ConfigProvider, {
      slots: { default: () => h('span', { class: 'only' }, 'x') },
    });
    // ⚠️ 不能断言 `w.element`：本体的渲染结果是 slots 数组 ⇒ 根节点是 Fragment，
    //    VTU 会给出一个容器 div。断言**产出的 HTML**才是「有没有多包一层」的判据。
    expect(w.html()).toBe('<span class="only">x</span>');
    const span = w.get('span.only');
    expect(span.element.tagName).toBe('SPAN');
  });

  it('theme 作用域元素是 display:contents 的 div（D26）', () => {
    const w = mount(ConfigProvider, {
      props: { theme: { token: {} } },
      slots: { default: () => h('span', { class: 'only' }, 'x') },
    });
    expect(w.element.tagName).toBe('DIV');
    expect(w.element.getAttribute('style')).toContain('display: contents');
    // 它不带任何类名 —— 不污染下游的类名空间
    expect(w.element.className).toBe('');
    expect(w.find('.only').exists()).toBe(true);
  });
});

describe('ConfigProvider · 对下游 DOM 的影响', () => {
  it('prefixCls 派生：子组件的类名整体换前缀', () => {
    const w = mount(ConfigProvider, {
      props: { prefixCls: 'bamboo' },
      slots: { default: () => h(Empty) },
    });
    expect(w.find('.bamboo-empty').exists()).toBe(true);
    expect(w.find('.bamboo-empty-image').exists()).toBe(true);
    expect(w.find('.apollo-empty').exists()).toBe(false);
  });

  it('嵌套：内层没给 prefixCls 时继承外层', () => {
    const w = mount({
      render: () =>
        h(ConfigProvider, { prefixCls: 'bamboo' }, () => h(ConfigProvider, null, () => h(Empty))),
    });
    expect(w.find('.bamboo-empty').exists()).toBe(true);
  });

  it('direction=rtl 时下游多出 -rtl 类名', () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: { default: () => h(Empty) },
    });
    expect(w.find(`.${P}-empty-rtl`).exists()).toBe(true);
  });

  it('direction 未给时**不**多出 -rtl（判据是 undefined，不是默认值 ltr）', () => {
    const w = mount(ConfigProvider, { slots: { default: () => h(Empty) } });
    expect(w.find(`.${P}-empty-rtl`).exists()).toBe(false);
    expect(w.find(`.${P}-empty-ltr`).exists()).toBe(false);
  });

  it('组件配置的 className / style 落在下游根元素上', () => {
    const w = mount(ConfigProvider, {
      props: {
        empty: { className: 'from-cp', style: { color: 'rgb(255, 0, 0)' } },
      },
      slots: { default: () => h(Empty) },
    });
    const root = w.find(`.${P}-empty`);
    expect(root.classes()).toContain('from-cp');
    expect(root.attributes('style')).toContain('color: rgb(255, 0, 0)');
  });

  it('组件配置的 classNames / styles 落在语义槽位上', () => {
    const w = mount(ConfigProvider, {
      props: {
        empty: {
          classNames: { description: 'cp-desc' },
          styles: { description: { color: 'rgb(0, 128, 0)' } },
        },
      },
      slots: { default: () => h(Empty, { description: 'x' }) },
    });
    const desc = w.find(`.${P}-empty-description`);
    expect(desc.classes()).toContain('cp-desc');
    expect(desc.attributes('style')).toContain('color: rgb(0, 128, 0)');
  });

  it('组件自己的 prop 优先于 ConfigProvider 的配置', () => {
    const w = mount(ConfigProvider, {
      props: { empty: { className: 'from-cp' } },
      slots: { default: () => h(Empty, { class: 'from-prop' }) },
    });
    const root = w.find(`.${P}-empty`);
    expect(root.classes()).toContain('from-cp');
    expect(root.classes()).toContain('from-prop');
  });

  it('组件配置的 image 会传导到下游（Empty 的插画）', () => {
    const w = mount(ConfigProvider, {
      props: { empty: { image: 'https://example.com/a.png' } },
      slots: { default: () => h(Empty) },
    });
    expect(w.find('img').attributes('src')).toBe('https://example.com/a.png');
  });
});

describe('ConfigProvider · 嵌套合并对 DOM 的影响', () => {
  it('⭐ 内层只给 spin 时，外层的 empty 配置仍然生效', () => {
    const w = mount({
      render: () =>
        h(ConfigProvider, { empty: { className: 'outer-empty' } }, () =>
          h(ConfigProvider, { spin: { className: 'inner-spin' } }, () => h(Empty)),
        ),
    });
    expect(w.find(`.${P}-empty`).classes()).toContain('outer-empty');
  });

  it('同名组件配置：内层整体替换（外层的 style 不会残留）', () => {
    const w = mount({
      render: () =>
        h(
          ConfigProvider,
          { empty: { className: 'outer', style: { color: 'rgb(255, 0, 0)' } } },
          () => h(ConfigProvider, { empty: { className: 'inner' } }, () => h(Empty)),
        ),
    });
    const root = w.find(`.${P}-empty`);
    expect(root.classes()).toContain('inner');
    expect(root.classes()).not.toContain('outer');
    expect(root.attributes('style') ?? '').not.toContain('255, 0, 0');
  });
});
