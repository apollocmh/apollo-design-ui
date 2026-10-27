/** Native static avatars, named/decorative images and owned overflow actions. */

import { mount, type VueWrapper } from '@vue/test-utils';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Avatar, AvatarGroup } from '../index';

const P = 'apollo-avatar';

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** 跑一次 axe，返回 violations。 */
async function runAxe(): Promise<axe.Result[]> {
  const results = await axe.run(document.body, {
    runOnly: { type: 'tag', values: TAGS },
  });
  return results.violations;
}

const mountA11y = async (
  props: Record<string, unknown> = {},
  slots?: Record<string, () => unknown>,
): Promise<VueWrapper> => {
  const wrapper = mount(Avatar, { props, slots, attachTo: document.body });
  await nextTick();
  return wrapper;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Avatar · role / ARIA 契约（L5）', () => {
  it('根是 `<span>` 且**不加 `role` / `aria-*`**', async () => {
    const w = await mountA11y({}, { default: () => 'U' });

    expect(w.element.tagName).toBe('SPAN');
    expect(w.attributes('role')).toBeUndefined();
    expect(w.attributes('aria-label')).toBeUndefined();
    w.unmount();
  });

  it('`-string` span 也是纯 `<span>`（无 role）', async () => {
    const w = await mountA11y({}, { default: () => 'U' });

    const str = w.find(`.${P}-string`);
    expect(str.element.tagName).toBe('SPAN');
    expect(str.attributes('role')).toBeUndefined();
    w.unmount();
  });

  it('🚨 `alt` 落到 `<img>` 上（图片头像的**唯一**可访问名来源）', async () => {
    const w = await mountA11y({ src: 'x.png', alt: '用户头像' });

    expect(w.find('img').attributes('alt')).toBe('用户头像');
    w.unmount();
  });

  it('🚨 不含 `<img>` 时**全树没有任何 `aria-*`**', async () => {
    const w = await mountA11y({}, { default: () => 'U' });

    expect(w.html().match(/aria-[a-z-]+/g) ?? []).toEqual([]);
    w.unmount();
  });

  it('`Avatar.Group` 的根是纯 `<div>`（无 role）', async () => {
    const w = mount(AvatarGroup, {
      slots: { default: () => [h(Avatar, null, { default: () => 'A' })] },
      attachTo: document.body,
    });
    await nextTick();

    expect(w.element.tagName).toBe('DIV');
    expect(w.attributes('role')).toBeUndefined();
    w.unmount();
  });

  it('Avatar 自己**不引入可聚焦元素**（`max` 溢出的触发器除外）', async () => {
    const w = await mountA11y({}, { default: () => 'U' });

    expect(w.findAll('a, button, input, select, textarea, [tabindex]')).toHaveLength(0);
    w.unmount();
  });
});

/** 扫描用例。⚠️ 必须**显式标注类型** —— 各元素的 `props` 形状不同，`it.each([...])` 直接推断会得到 TS7023（`'default' implicitly has return type 'any'`）。 */
interface A11yScanCase {
  name: string;
  props: Record<string, unknown>;
  slots?: Record<string, () => unknown>;
}

const SCAN_CASES: A11yScanCase[] = [
  { name: 'text', props: {}, slots: { default: () => 'U' } },
  { name: 'icon', props: { icon: h('span', { class: 'my-icon' }, 'i') } },
  // 具名头像使用明确alt；装饰默认值另有覆盖。
  { name: 'image', props: { src: 'x.png', alt: '用户头像' } },
  {
    name: 'square-large',
    props: { shape: 'square', size: 'large' },
    slots: { default: () => 'U' },
  },
  { name: 'numeric', props: { size: 40 }, slots: { default: () => 'U' } },
];

describe('Avatar · axe 扫描（L5）', () => {
  it.each(SCAN_CASES)('$name 无 axe violation', async ({ props, slots }) => {
    const w = await mountA11y(props, slots);

    const violations = await runAxe();
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    w.unmount();
  });

  it('`Avatar.Group`（含 `max` 溢出的 `+N`）无 axe violation', async () => {
    const w = mount(AvatarGroup, {
      props: { max: { count: 1 } },
      slots: {
        default: () => [
          h(Avatar, null, { default: () => 'A' }),
          h(Avatar, null, { default: () => 'B' }),
        ],
      },
      attachTo: document.body,
    });
    await nextTick();

    const violations = await runAxe();
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    w.unmount();
  });

  it('RTL 下也无 axe violation', async () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: {
        default: () =>
          h(AvatarGroup, null, { default: () => [h(Avatar, null, { default: () => 'A' })] }),
      },
      attachTo: document.body,
    });
    await nextTick();

    const violations = await runAxe();
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    w.unmount();
  });

  it('默认装饰图像有空alt，无image-alt违规；明确alt仍由原生img消费', async () => {
    const w = await mountA11y({ src: 'x.png' });
    expect(w.get('img').attributes('alt')).toBe('');
    const violations = await runAxe();
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    await w.setProps({ alt: 'Olivia' });
    expect(w.get('img').attributes('alt')).toBe('Olivia');
    w.unmount();
  });
});
