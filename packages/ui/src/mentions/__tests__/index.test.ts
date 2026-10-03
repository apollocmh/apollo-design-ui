/**
 * L1 / L2 / L3 · Mentions 组件行为（与 antd 6.6.4 的实测行为逐条对照）。
 *
 * ── 本文件里最值钱的三条哨兵 ─────────────────────────────────────────────────
 *
 * 1. **「敲 `@` ⇒ measure 层 + 面板出现」**（`describe('测量态')`）——
 *    这是唯一能抓住「`onKeyUp` 被 hyphenate 成 `key-up` 而永不触发」的断言
 *    （见 `docs/analysis/mentions.md` §4.3；那类 bug **没有报错**）。
 * 2. **「输入后 `mergedValue` 立刻同步」**（`describe('受控值')`）——
 *    抓的是 React `onChange`(input) ↔ Vue `onChange`(change) 的语义差。
 * 3. **「回填基于**当前**文本」**（`describe('选中候选')`）——
 *    它是第 2 条的**效果**断言：只断言「回调传对了」抓不到这条。
 *
 * ── 与 antd 原测试的对应关系 ──────────────────────────────────────────────────
 *
 * `components/mentions/__tests__/index.test.tsx` 的 8 组用例逐条对应：
 * `getMentions` / `focus` / `loading` / `notFoundContent` / `allowClear` /
 * `allowClear.disabled` / `custom clearIcon` / `warning if use Mentions.Option` /
 * `do not lose label when use children Option` / `form disabled` / `Custom Style`。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { MentionsOption } from '../engine/Mentions';
import Mentions from '../index';
import type { MentionsProps } from '../interface';

const OPTIONS = [
  { value: 'afc163', label: 'afc163' },
  { value: 'zombieJ', label: 'zombieJ' },
  { value: 'yesmeck', label: 'yesmeck' },
];

/** 派发一个原生事件（`which` 只能走 `KeyboardEventInit`，见 cascader/menu 的先例）。 */
function fire(
  el: Element,
  type: string,
  init: EventInit & { key?: string; which?: number } = {},
): void {
  if (type.startsWith('key')) {
    el.dispatchEvent(new KeyboardEvent(type, { bubbles: true, cancelable: true, ...init }));
    return;
  }
  el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
}

/** 模拟「敲入 text 并抬起最后一个键」（antd 测试里 `simulateInput` 的等价物）。 */
async function typeInto(wrapper: ReturnType<typeof mount>, text: string): Promise<void> {
  const ta = wrapper.find('textarea').element as HTMLTextAreaElement;
  ta.value = text;
  ta.setSelectionRange(text.length, text.length);
  fire(ta, 'input');
  await nextTick();
  fire(ta, 'keyup', { key: text.slice(-1), which: text.charCodeAt(text.length - 1) });
  await nextTick();
}

/** 面板（Portal 到 body）。 */
const panel = (): HTMLElement | null => document.querySelector('.apollo-mentions-dropdown');
const menuItems = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>('.apollo-mentions-dropdown-menu-item'),
];

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('Mentions · 挂载与类名（L2 接线）', () => {
  it('裸形态：根 div + textarea.rc-textarea（**textarea 用 rc-input 的默认前缀**）', () => {
    const wrapper = mount(Mentions, { attachTo: document.body });
    const root = wrapper.element as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root.className).toContain('apollo-mentions');
    expect(root.className).toContain('apollo-mentions-outlined');
    const ta = wrapper.find('textarea');
    expect(ta.attributes('class')).toContain('rc-textarea');
    expect(ta.attributes('rows')).toBe('1');
    wrapper.unmount();
  });

  it('size / status / variant / disabled / rtl 的类名落点', async () => {
    const wrapper = mount(Mentions, { props: { size: 'large', status: 'error' } });
    expect((wrapper.element as HTMLElement).className).toContain('apollo-mentions-lg');
    expect((wrapper.element as HTMLElement).className).toContain('apollo-mentions-status-error');

    await wrapper.setProps({ variant: 'filled' });
    expect((wrapper.element as HTMLElement).className).toContain('apollo-mentions-filled');
    expect((wrapper.element as HTMLElement).className).not.toContain('apollo-mentions-outlined');

    await wrapper.setProps({ disabled: true });
    expect((wrapper.element as HTMLElement).className).toContain('apollo-mentions-disabled');
    expect(wrapper.find('textarea').attributes('class')).toContain('rc-textarea-disabled');
    wrapper.unmount();
  });

  it('readOnly ⇒ textarea 只读（**无类名**，与实测一致）', () => {
    const wrapper = mount(Mentions, { props: { readOnly: true, defaultValue: 'a' } });
    expect(wrapper.find('textarea').element).toHaveProperty('readOnly', true);
    expect((wrapper.element as HTMLElement).className).not.toContain('readonly');
    wrapper.unmount();
  });

  it('allowClear ⇒ 根变成 affix-wrapper（`-has-suffix`）', () => {
    const wrapper = mount(Mentions, {
      props: { allowClear: true, defaultValue: 'a' },
      attachTo: document.body,
    });
    const root = wrapper.element as HTMLElement;
    expect(root.tagName).toBe('SPAN');
    expect(root.className).toContain('apollo-mentions-affix-wrapper');
    expect(root.className).toContain('apollo-mentions-has-suffix');
    expect(wrapper.find('.apollo-mentions-clear-icon').exists()).toBe(true);
    wrapper.unmount();
  });
});

describe('Mentions · 测量态（🚨 抓 onKeyUp 静默失效）', () => {
  it('敲 `@` ⇒ measure 层出现 + 面板打开 + 全部候选 + 第一条高亮', async () => {
    const wrapper = mount(Mentions, { props: { options: OPTIONS }, attachTo: document.body });
    expect(document.querySelector('.apollo-mentions-measure')).toBeNull();

    await typeInto(wrapper, '@');

    // ① measure 层（只在 measuring 时渲染）
    const measure = document.querySelector('.apollo-mentions-measure');
    expect(measure).not.toBeNull();
    expect(measure?.querySelector('span')?.textContent).toBe('@');

    // ② 面板 + 候选（空搜索串 ⇒ 全部命中）
    expect(panel()).not.toBeNull();
    const items = menuItems();
    expect(items).toHaveLength(3);
    expect(items.map((el) => el.textContent)).toEqual(['afc163', 'zombieJ', 'yesmeck']);
    expect(items[0]?.className).toContain('apollo-mentions-dropdown-menu-item-active');

    wrapper.unmount();
  });

  it('一次输入 `@zzz`（无候选）⇒ 不开面板', async () => {
    const wrapper = mount(Mentions, { props: { options: OPTIONS }, attachTo: document.body });
    await typeInto(wrapper, '@zzz');
    expect(document.querySelector('.apollo-mentions-measure')).toBeNull();
    expect(panel()).toBeNull();
    wrapper.unmount();
  });

  it('已有面板后继续打字到无候选 ⇒ 面板保留，只剩 notFound 项', async () => {
    const wrapper = mount(Mentions, { props: { options: OPTIONS }, attachTo: document.body });
    await typeInto(wrapper, '@');
    expect(menuItems()).toHaveLength(3);
    await typeInto(wrapper, '@zzz');
    const items = menuItems();
    expect(items).toHaveLength(1);
    expect(items[0]?.className).toContain('apollo-mentions-dropdown-menu-item-disabled');
    wrapper.unmount();
  });

  it('`filterOption: false` ⇒ 候选全保留（`@zzz` 也开面板）', async () => {
    const wrapper = mount(Mentions, {
      props: { options: OPTIONS, filterOption: false },
      attachTo: document.body,
    });
    await typeInto(wrapper, '@');
    await typeInto(wrapper, '@zzz');
    expect(menuItems()).toHaveLength(3);
    wrapper.unmount();
  });

  it('前缀数组：`#` 也触发，且 `onSearch` 收到命中的前缀', async () => {
    const onSearch = vi.fn();
    const wrapper = mount(Mentions, {
      props: { prefix: ['@', '#'], options: OPTIONS, onSearch },
      attachTo: document.body,
    });
    await typeInto(wrapper, '#');
    expect(panel()).not.toBeNull();
    expect(onSearch).toHaveBeenCalledWith('', '#');
    wrapper.unmount();
  });
});

describe('Mentions · 键盘', () => {
  it('↓ 跳过 disabled 候选（环形）', async () => {
    const options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
      { value: 'c', label: 'C' },
    ];
    const wrapper = mount(Mentions, { props: { options }, attachTo: document.body });
    await typeInto(wrapper, '@');
    const ta = wrapper.find('textarea').element as HTMLTextAreaElement;

    expect(menuItems()[0]?.className).toContain('-active');
    fire(ta, 'keydown', { which: 40 }); // ArrowDown
    await nextTick();
    expect(menuItems()[2]?.className).toContain('-active');
    fire(ta, 'keydown', { which: 40 });
    await nextTick();
    expect(menuItems()[0]?.className).toContain('-active');
    wrapper.unmount();
  });

  it('ESC 关闭面板并清掉 measure 层', async () => {
    const wrapper = mount(Mentions, { props: { options: OPTIONS }, attachTo: document.body });
    await typeInto(wrapper, '@');
    fire(wrapper.find('textarea').element as HTMLElement, 'keydown', { which: 27 });
    await nextTick();
    expect(document.querySelector('.apollo-mentions-measure')).toBeNull();
    wrapper.unmount();
  });

  it('`silent`（loading）时 Enter **不选中**', async () => {
    const onChange = vi.fn();
    const wrapper = mount(Mentions, {
      props: { options: OPTIONS, loading: true, onChange },
      attachTo: document.body,
    });
    await typeInto(wrapper, '@');
    expect(menuItems()).toHaveLength(1); // 只有「加载中」那一条
    onChange.mockClear();
    fire(wrapper.find('textarea').element as HTMLElement, 'keydown', { which: 13 });
    await nextTick();
    expect(onChange).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});

describe('Mentions · 选中候选（🚨 抓「回填基于旧文本」）', () => {
  it('Enter 选中：回填 + onChange(文本) + onSelect(option, prefix)', async () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    const wrapper = mount(Mentions, {
      props: { options: OPTIONS, onChange, onSelect },
      attachTo: document.body,
    });

    await typeInto(wrapper, 'hi @afc');
    // `@afc` 只匹配 afc163
    expect(menuItems()).toHaveLength(1);
    // ⚠️ 打字本身就会调 onChange（React 语义：每次 input 一次）⇒ 先清掉再断言回填
    onChange.mockClear();
    fire(wrapper.find('textarea').element as HTMLElement, 'keydown', { which: 13 });
    await nextTick();
    await nextTick();

    // 🚨 关键断言：回填基于**当前**文本（若 mergedValue 停在 ''，这里会变成 '@afc163 '）
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('hi @afc163 ');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0]).toMatchObject({ value: 'afc163' });
    expect(onSelect.mock.calls[0]?.[1]).toBe('@');
    wrapper.unmount();
  });

  it('点击候选同样选中', async () => {
    const onChange = vi.fn();
    const wrapper = mount(Mentions, {
      props: { options: OPTIONS, onChange },
      attachTo: document.body,
    });
    await typeInto(wrapper, '@');
    onChange.mockClear();
    menuItems()[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(onChange).toHaveBeenCalledWith('@zombieJ ');
    wrapper.unmount();
  });

  it('disabled 的候选点不动（Enter 也不会选它）', async () => {
    const onChange = vi.fn();
    const options = [
      { value: 'a', label: 'A', disabled: true },
      { value: 'b', label: 'B' },
    ];
    const wrapper = mount(Mentions, { props: { options, onChange }, attachTo: document.body });
    await typeInto(wrapper, '@');
    onChange.mockClear();
    menuItems()[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(onChange).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});

describe('Mentions · 受控值（🚨 抓 onChange 语义差）', () => {
  it('输入后立刻同步（不等失焦）', async () => {
    const wrapper = mount(Mentions, { props: { value: '' }, attachTo: document.body });
    const ta = wrapper.find('textarea').element as HTMLTextAreaElement;
    ta.value = 'abc';
    ta.setSelectionRange(3, 3);
    fire(ta, 'input');
    await nextTick();
    // 受控且父级未回传 ⇒ 值回到 ''（受控语义）；但**内部** state 已同步（下面用非受控验证）
    expect(wrapper.emitted('update:value')?.[0]).toEqual(['abc']);
    wrapper.unmount();
  });

  it('非受控：输入后 measure 层用**当前**文本（`replaceWithMeasure` 的输入源）', async () => {
    const onChange = vi.fn();
    const wrapper = mount(Mentions, {
      props: { defaultValue: '', options: OPTIONS, onChange },
      attachTo: document.body,
    });
    await typeInto(wrapper, 'x @afc');
    fire(wrapper.find('textarea').element as HTMLElement, 'keydown', { which: 13 });
    await nextTick();
    await nextTick();
    // 若 mergedValue 停在 ''，回填会是 '@afc163 '（丢掉 'x '）
    expect(onChange).toHaveBeenCalledWith('x @afc163 ');
    wrapper.unmount();
  });
});

describe('Mentions · loading / notFoundContent', () => {
  it('loading ⇒ 候选项是 Spin，且 filterOption 被整个替换', async () => {
    const wrapper = mount(Mentions, {
      props: { loading: true, options: OPTIONS },
      attachTo: document.body,
    });
    await typeInto(wrapper, '@');
    const items = menuItems();
    expect(items).toHaveLength(1);
    expect(items[0]?.querySelector('.apollo-spin')).not.toBeNull();
    wrapper.unmount();
  });

  it('notFoundContent：自定义内容 + 默认 renderEmpty("Select")', async () => {
    const wrapper = mount(Mentions, {
      props: { options: [], notFoundContent: 'nothing here' },
      attachTo: document.body,
    });
    await typeInto(wrapper, '@');
    expect(menuItems()).toHaveLength(1);
    expect(menuItems()[0]?.textContent).toBe('nothing here');
    wrapper.unmount();

    const wrapper2 = mount(Mentions, { props: { options: [] }, attachTo: document.body });
    await typeInto(wrapper2, '@');
    expect(menuItems()[0]?.querySelector('.apollo-empty')).not.toBeNull();
    wrapper2.unmount();
  });
});

describe('Mentions · allowClear / focus', () => {
  it('点击清除按钮清空值', async () => {
    const onChange = vi.fn();
    const wrapper = mount(Mentions, {
      props: { allowClear: true, defaultValue: '111', onChange },
      attachTo: document.body,
    });
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('111');
    await wrapper.find('.apollo-mentions-clear-icon').trigger('click');
    expect(onChange).toHaveBeenCalledWith('');
    wrapper.unmount();
  });

  it('allowClear.disabled ⇒ clear 按钮带 `-hidden`（**是挂类，不是不渲染**）', () => {
    const wrapper = mount(Mentions, {
      props: { allowClear: { clearIcon: 'clear', disabled: true }, defaultValue: '111' },
      attachTo: document.body,
    });
    expect(wrapper.find('.apollo-mentions-clear-icon').exists()).toBe(true);
    expect(wrapper.find('.apollo-mentions-clear-icon').classes()).toContain(
      'apollo-mentions-clear-icon-hidden',
    );
    wrapper.unmount();
  });

  it('focus / blur ⇒ `-focused` 类（blur 有 0ms 延迟）', async () => {
    vi.useFakeTimers();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const wrapper = mount(Mentions, { props: { onFocus, onBlur }, attachTo: document.body });
    const ta = wrapper.find('textarea');
    await ta.trigger('focus');
    expect((wrapper.element as HTMLElement).className).toContain('apollo-mentions-focused');
    expect(onFocus).toHaveBeenCalledTimes(1);

    await ta.trigger('blur');
    vi.runAllTimers();
    await nextTick();
    expect((wrapper.element as HTMLElement).className).not.toContain('apollo-mentions-focused');
    expect(onBlur).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
    wrapper.unmount();
  });
});

describe('Mentions · getMentions / Mentions.Option', () => {
  it('getMentions 多前缀（antd 原测试用例）', () => {
    expect(Mentions.getMentions('@light #bamboo cat', { prefix: ['@', '#'] })).toEqual([
      { prefix: '@', value: 'light' },
      { prefix: '#', value: 'bamboo' },
    ]);
  });

  it('getMentions：空 value 不收集；split 可自定义', () => {
    expect(Mentions.getMentions('@ #a')).toEqual([]);
    expect(Mentions.getMentions('@a,@b', { split: ',' })).toEqual([
      { prefix: '@', value: 'a' },
      { prefix: '@', value: 'b' },
    ]);
  });

  it('children 形式（`Mentions.Option`）能取到 label 并出现在候选里', async () => {
    const wrapper = mount(Mentions, {
      attachTo: document.body,
      slots: {
        default: () => [
          h(MentionsOption, { value: 'afc163' } as never, { default: () => 'Afc163' }),
          h(MentionsOption, { value: 'zombieJ' } as never, { default: () => 'ZombieJ' }),
        ],
      },
    });
    await typeInto(wrapper, '@');
    expect(menuItems().map((el) => el.textContent)).toEqual(['Afc163', 'ZombieJ']);
    wrapper.unmount();
  });

  it('用 `Mentions.Option` 时发 deprecated 告警（`console.error`）', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const wrapper = mount(Mentions, {
      slots: {
        default: () => [h(MentionsOption, { value: 'a' } as never, { default: () => 'A' })],
      },
    });
    const messages = errorSpy.mock.calls.map((call) => String(call[0]));
    expect(
      messages.some((msg) => msg.includes('Mentions.Option') && msg.includes('deprecated')),
    ).toBe(true);
    wrapper.unmount();
  });
});

describe('Mentions · expose / popupRender / 语义槽', () => {
  it('expose focus / blur / nativeElement', () => {
    const wrapper = mount(Mentions, { props: { options: OPTIONS } });
    const vm = wrapper.vm as unknown as {
      focus: () => void;
      blur: () => void;
      nativeElement: HTMLElement | null;
    };
    expect(typeof vm.focus).toBe('function');
    expect(typeof vm.blur).toBe('function');
    expect(vm.nativeElement).toBeInstanceOf(HTMLElement);
    wrapper.unmount();
  });

  it('popupRender 能改面板内容', async () => {
    const wrapper = mount(Mentions, {
      props: {
        options: OPTIONS,
        popupRender: (menu: unknown) =>
          h('div', { class: 'custom-popup' }, [h('span', null, 'HEADER'), menu as never]),
      },
      attachTo: document.body,
    });
    await typeInto(wrapper, '@');
    expect(document.querySelector('.custom-popup')).not.toBeNull();
    expect(document.querySelector('.custom-popup')?.textContent).toContain('HEADER');
    wrapper.unmount();
  });

  it('classNames / styles 落到 root / textarea / suffix', () => {
    const props: MentionsProps = {
      allowClear: true,
      defaultValue: 'x',
      classNames: { root: 'c-root', textarea: 'c-textarea', suffix: 'c-suffix' },
      styles: { root: { width: '120px' } },
    };
    const wrapper = mount(Mentions, { props, attachTo: document.body });
    expect((wrapper.element as HTMLElement).className).toContain('c-root');
    expect(wrapper.find('textarea').classes()).toContain('c-textarea');
    expect(wrapper.find('.apollo-mentions-suffix').classes()).toContain('c-suffix');
    wrapper.unmount();
  });
});
