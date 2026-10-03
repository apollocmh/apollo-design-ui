/**
 * L1 单元 + L2 交互（G5 / G6）。
 *
 * 判据来源（全部可在 `docs/analysis/select.md` 里对到行号）：
 *   - DOM / ARIA：antd `__snapshots__/index.test.tsx.snap:3-46`
 *   - 键盘 / 事件顺序 / 过滤 / 多选：rc-select 源码（antd 自测不断言这些）
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import Select from '../Select';

const OPTIONS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry', disabled: true },
];

/** 关闭下拉是**宏任务延迟**的（PITFALLS 179）⇒ 断言前必须冲一次宏任务。 */
const flush = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

const mountSelect = (props: Record<string, unknown> = {}, options: Record<string, unknown> = {}) =>
  mount(Select, {
    props: { options: OPTIONS, id: 'test-id', ...props },
    attachTo: document.body,
    ...options,
  });

const body = (): HTMLElement => document.body;

describe('Select · DOM 契约（对拍 antd v6 快照）', () => {
  it('根元素类名与结构：无 -selector 包裹层', () => {
    const wrapper = mountSelect();
    const root = wrapper.find('.apollo-select');
    expect(root.exists()).toBe(true);
    expect(root.classes()).toContain('apollo-select-single');
    expect(root.classes()).toContain('apollo-select-show-arrow');
    expect(root.find('.apollo-select-content').exists()).toBe(true);
    expect(root.find('.apollo-select-placeholder').exists()).toBe(true);
    expect(root.find('input.apollo-select-input').exists()).toBe(true);
    expect(root.find('.apollo-select-selector').exists()).toBe(false);
  });

  it('唯一的 input 承载全部 ARIA（关闭态）', () => {
    const wrapper = mountSelect();
    const input = wrapper.find('input');
    expect(input.attributes('role')).toBe('combobox');
    expect(input.attributes('aria-autocomplete')).toBe('list');
    expect(input.attributes('aria-haspopup')).toBe('listbox');
    expect(input.attributes('aria-expanded')).toBe('false');
    expect(input.attributes('aria-controls')).toBeUndefined();
    expect(input.attributes('aria-activedescendant')).toBeUndefined();
    expect(input.attributes('readonly')).toBeDefined();
  });

  it('打开态：aria-expanded=true + controls/owns/activedescendant 指向 list', async () => {
    const wrapper = mountSelect({ open: true });
    await flush();
    const input = wrapper.find('input');
    expect(input.attributes('aria-expanded')).toBe('true');
    expect(input.attributes('aria-controls')).toBe('test-id_list');
    expect(input.attributes('aria-owns')).toBe('test-id_list');
    expect(input.attributes('aria-activedescendant')).toBe('test-id_list_0');
    wrapper.unmount();
  });

  it('下拉结构：dropdown > wrapper > [影子 listbox, -dropdown-list]', async () => {
    const wrapper = mountSelect({ open: true });
    await flush();
    const dropdown = body().querySelector('.apollo-select-dropdown');
    expect(dropdown).toBeTruthy();
    expect(dropdown?.classList.contains('apollo-select-dropdown-placement-bottomLeft')).toBe(true);
    expect(dropdown?.querySelector('[role="listbox"]')?.id).toBe('test-id_list');
    expect(body().querySelector('.apollo-select-dropdown-list')).toBeTruthy();
    expect(body().querySelector('.apollo-select-dropdown-list-holder')).toBeTruthy();
    expect(body().querySelector('.apollo-select-dropdown-list-holder-inner')).toBeTruthy();
    wrapper.unmount();
  });

  // ⚠️ KNOWN-ISSUES §1.7b：antd 给 useMergeSemantic 的第四参是
  //    `{ popup: { _default: 'root' } }` —— 字符串形态 `classNames.popup = 'x'`
  //    落到 `popup.root`。没有 schema 时「字符串 + 对象混用」会产垃圾键
  //    （`Object.keys('x')` ⇒ 类名里出现 `0` / `1`）。
  it('classNames.popup 字符串形态 ⇒ 落到 popup.root 并挂到下拉根（§1.7b）', async () => {
    const wrapper = mountSelect({ open: true, classNames: { popup: 'my-popup' } });
    await flush();
    const dropdown = body().querySelector('.apollo-select-dropdown');
    expect(dropdown).toBeTruthy();
    expect(dropdown?.classList.contains('my-popup')).toBe(true);
    // 垃圾键哨兵：schema 缺失时 `Object.keys('my-popup')` 会给出 '0'..'8' 这类键
    expect(dropdown?.className).not.toMatch(/\b[0-9]\b/);
    wrapper.unmount();
  });

  it('classNames.popup 对象形态 + popupClassName prop ⇒ 两者拼接（§1.7b）', async () => {
    const wrapper = mountSelect({
      open: true,
      classNames: { popup: { root: 'obj-popup' } },
      popupClassName: 'legacy-popup',
    });
    await flush();
    const dropdown = body().querySelector('.apollo-select-dropdown');
    expect(dropdown?.classList.contains('obj-popup')).toBe(true);
    expect(dropdown?.classList.contains('legacy-popup')).toBe(true);
    wrapper.unmount();
  });

  it('选项结构：-item-option > [-option-content] + [-option-state]', async () => {
    const wrapper = mountSelect({ open: true });
    await flush();
    const items = body().querySelectorAll('.apollo-select-item-option');
    expect(items.length).toBe(3);
    expect(items[0]?.querySelector('.apollo-select-item-option-content')?.textContent).toBe(
      'Apple',
    );
    // 首项自动激活（defaultActiveFirstOption 默认 true）
    expect(items[0]?.className).toContain('apollo-select-item-option-active');
    // disabled 项
    expect(items[2]?.className).toContain('apollo-select-item-option-disabled');
    expect(items[2]?.getAttribute('aria-disabled')).toBe('true');
    wrapper.unmount();
  });
});

describe('Select · 值语义', () => {
  it('受控：点击选项 ⇒ change + update:value 同时发出（PITFALLS 162）', async () => {
    const onChange = vi.fn();
    const wrapper = mountSelect({ value: undefined, onChange, open: true });
    await flush();
    await body().querySelector<HTMLElement>('.apollo-select-item-option')?.click();
    await flush();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toBe('a');
    expect(onChange.mock.calls[0]?.[1]).toMatchObject({ value: 'a', label: 'Apple' });
    expect(wrapper.emitted('update:value')?.[0]).toEqual(['a']);
    wrapper.unmount();
  });

  it('非受控：defaultValue', () => {
    const wrapper = mountSelect({ defaultValue: 'b' });
    expect(wrapper.find('.apollo-select-content').text()).toContain('Banana');
  });

  it('labelInValue：输出 { label, value }', async () => {
    const onChange = vi.fn();
    const wrapper = mountSelect({ labelInValue: true, onChange, open: true });
    await flush();
    await body().querySelector<HTMLElement>('.apollo-select-item-option')?.click();
    await flush();
    expect(onChange.mock.calls[0]?.[0]).toMatchObject({ label: 'Apple', value: 'a' });
    wrapper.unmount();
  });

  it('optionLabelProp：回填取指定字段', () => {
    const options = [{ value: 'a', label: 'Apple', nick: 'A+' }];
    const wrapper = mount(Select, {
      props: { options, defaultValue: 'a', optionLabelProp: 'nick' },
    });
    expect(wrapper.find('.apollo-select-content').text()).toContain('A+');
  });

  it('值不在 options 里也能显示（缓存 label）', () => {
    const wrapper = mountSelect({ value: 'zzz' });
    expect(wrapper.find('.apollo-select-content').text()).toContain('zzz');
  });

  it('多选：返回数组 + 触发 select 事件', async () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    const wrapper = mountSelect({ mode: 'multiple', onChange, onSelect, open: true });
    await flush();
    const items = body().querySelectorAll<HTMLElement>('.apollo-select-item-option');
    await items[0]?.click();
    await flush();
    await body().querySelectorAll<HTMLElement>('.apollo-select-item-option')[1]?.click();
    await flush();
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual(['a', 'b']);
    expect(onSelect).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it('多选回填渲染 -selection-item + -selection-item-remove', () => {
    const wrapper = mountSelect({ mode: 'multiple', value: ['a', 'b'] });
    const items = wrapper.findAll('.apollo-select-selection-item');
    expect(items.length).toBe(2);
    expect(items[0]?.find('.apollo-select-selection-item-content').text()).toBe('Apple');
    expect(items[0]?.find('.apollo-select-selection-item-remove').exists()).toBe(true);
  });

  it('移除 tag ⇒ deselect + change', () => {
    const onDeselect = vi.fn();
    const onChange = vi.fn();
    const wrapper = mountSelect({ mode: 'multiple', value: ['a', 'b'], onDeselect, onChange });
    wrapper.find('.apollo-select-selection-item-remove').trigger('click');
    expect(onDeselect).toHaveBeenCalledTimes(1);
    expect(onDeselect.mock.calls[0]?.[0]).toBe('a');
    expect(onChange.mock.calls[0]?.[0]).toEqual(['b']);
  });

  it('maxTagCount 折叠出 +N ...', () => {
    const wrapper = mountSelect({ mode: 'multiple', value: ['a', 'b'], maxTagCount: 1 });
    // 1 个真实 tag + 1 个 rest 节点
    expect(wrapper.findAll('.apollo-select-selection-item').length).toBe(2);
    expect(wrapper.text()).toContain('+ 1 ...');
  });
});

describe('Select · 打开 / 关闭', () => {
  it('mousedown 切换：openChange 与 update:open 同发', async () => {
    const onOpenChange = vi.fn();
    const wrapper = mountSelect({ onOpenChange });
    await wrapper.find('.apollo-select').trigger('mousedown');
    await flush();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(wrapper.emitted('update:open')?.[0]).toEqual([true]);
    wrapper.unmount();
  });

  it('关闭是异步的（宏任务延迟）', async () => {
    // ⚠️ 用 defaultOpen（非受控）：受控 `open` 时组件不自行关闭，与 rc 一致
    const wrapper = mountSelect({ defaultOpen: true });
    await flush();
    await wrapper.find('.apollo-select').trigger('mousedown');
    // 同步时刻仍开着 —— rc 的既定行为，不是 bug
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('true');
    await flush();
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  it('disabled ⇒ 打不开', async () => {
    const wrapper = mountSelect({ disabled: true });
    await wrapper.find('.apollo-select').trigger('mousedown');
    await flush();
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('false');
  });

  it('notFoundContent 为空且无选项 ⇒ 不允许打开', async () => {
    const wrapper = mount(Select, {
      // notFoundContent 已迁到 slot（规则 C8-R2）：空渲染 ⇒ null ⇒ 不允许打开
      props: { options: [], open: false, id: 'x' },
      slots: { notFoundContent: () => [] },
      attachTo: document.body,
    });
    await wrapper.find('.apollo-select').trigger('mousedown');
    await flush();
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });
});

describe('Select · 键盘', () => {
  const openSelect = async (props: Record<string, unknown> = {}) => {
    const wrapper = mountSelect({ open: true, ...props });
    await flush();
    return wrapper;
  };

  it('ArrowDown 移动激活项（跳过 disabled）', async () => {
    const wrapper = await openSelect();
    const activeValue = () => wrapper.find('input').attributes('aria-activedescendant');
    expect(activeValue()).toBe('test-id_list_0');
    await wrapper.find('input').trigger('keydown', { key: 'ArrowDown', keyCode: 40 });
    expect(activeValue()).toBe('test-id_list_1');
    // 再往下：c 是 disabled ⇒ 回到 0（循环）
    await wrapper.find('input').trigger('keydown', { key: 'ArrowDown', keyCode: 40 });
    expect(activeValue()).toBe('test-id_list_0');
    wrapper.unmount();
  });

  it('Enter 选中激活项（单选）', async () => {
    const onChange = vi.fn();
    const wrapper = await openSelect({ onChange });
    const input = wrapper.find('input');
    await input.trigger('keydown', { key: 'ArrowDown', keyCode: 40 });
    await input.trigger('keydown', { key: 'Enter', keyCode: 13 });
    await flush();
    expect(onChange.mock.calls[0]?.[0]).toBe('b');
    wrapper.unmount();
  });

  it('Esc 关闭但不清值', async () => {
    const onOpenChange = vi.fn();
    const wrapper = await openSelect({ defaultValue: 'a', onOpenChange });
    await wrapper.find('input').trigger('keydown', { key: 'Escape', keyCode: 27 });
    await flush();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    wrapper.unmount();
  });

  it('Backspace 删除最后一个未禁用 tag（多选）', async () => {
    const onChange = vi.fn();
    const wrapper = await openSelect({ mode: 'multiple', value: ['a', 'b'], onChange });
    await wrapper.find('input').trigger('keydown', { key: 'Backspace', keyCode: 8 });
    await flush();
    expect(onChange.mock.calls[0]?.[0]).toEqual(['a']);
    wrapper.unmount();
  });

  it('Space 打开下拉但不选中', async () => {
    const onChange = vi.fn();
    const wrapper = mountSelect({ onChange });
    await wrapper.find('input').trigger('keydown', { key: ' ', keyCode: 32 });
    await flush();
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('true');
    expect(onChange).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});

describe('Select · 搜索与过滤', () => {
  // ⚠️ antd 的 `optionFilterProp` 默认 `value`（不是 label！）—— 见
  //    components/select/index.zh-CN.md 的 FAQ「搜索不到」条目；rc 的
  //    useFilterOptions：叶子项按 `value` 匹配，只有分组项才按 label 匹配。
  it('showSearch：输入触发 search，默认按 value 过滤（大小写不敏感）', async () => {
    const onSearch = vi.fn();
    const wrapper = mountSelect({ showSearch: true, onSearch, open: true });
    await flush();
    const input = wrapper.find('input');
    expect(input.attributes('readonly')).toBeUndefined();
    await input.setValue('b');
    await flush();
    expect(onSearch).toHaveBeenCalledWith('b');
    const items = body().querySelectorAll('.apollo-select-item-option');
    expect(items.length).toBe(1);
    expect(items[0]?.textContent).toContain('Banana');
    // 大小写不敏感：'B' 同样命中 value='b'
    await input.setValue('B');
    await flush();
    expect(body().querySelectorAll('.apollo-select-item-option').length).toBe(1);
    // 按 label 搜不到（默认按 value）
    await input.setValue('Banana');
    await flush();
    expect(body().querySelectorAll('.apollo-select-item-option').length).toBe(0);
    wrapper.unmount();
  });

  it('filterOption=false ⇒ 不过滤', async () => {
    const wrapper = mountSelect({ showSearch: true, filterOption: false, open: true });
    await flush();
    await wrapper.find('input').setValue('zzz');
    await flush();
    expect(body().querySelectorAll('.apollo-select-item-option').length).toBe(3);
    wrapper.unmount();
  });

  it('自定义 filterOption', async () => {
    const filterOption = (input: string, option?: { value?: string }): boolean =>
      String(option?.value).includes(input);
    const wrapper = mountSelect({ showSearch: true, filterOption, open: true });
    await flush();
    await wrapper.find('input').setValue('c');
    await flush();
    const items = body().querySelectorAll('.apollo-select-item-option');
    expect(items.length).toBe(1);
    expect(items[0]?.textContent).toContain('Cherry');
    wrapper.unmount();
  });

  it('optionFilterProp 指定匹配字段', async () => {
    const options = [
      { value: 'a', label: 'Apple', code: 'AP' },
      { value: 'b', label: 'Banana', code: 'BN' },
    ];
    const wrapper = mount(Select, {
      props: { options, showSearch: true, optionFilterProp: 'code', open: true, id: 'x' },
      attachTo: document.body,
    });
    await flush();
    await wrapper.find('input').setValue('bn');
    await flush();
    const items = body().querySelectorAll('.apollo-select-item-option');
    expect(items.length).toBe(1);
    expect(items[0]?.textContent).toContain('Banana');
    wrapper.unmount();
  });

  it('无匹配 ⇒ -item-empty', async () => {
    const wrapper = mountSelect({ open: true, options: [] });
    await flush();
    expect(body().querySelector('.apollo-select-item-empty')).toBeTruthy();
    wrapper.unmount();
  });
});

describe('Select · 清除 / tags / 分组', () => {
  it('allowClear：清除按钮 + clear 事件 + change(undefined)', () => {
    const onClear = vi.fn();
    const onChange = vi.fn();
    const wrapper = mountSelect({ allowClear: true, value: 'a', onClear, onChange });
    const clear = wrapper.find('button.apollo-select-clear');
    expect(clear.exists()).toBe(true);
    expect(clear.attributes('aria-label')).toBe('Clear');
    clear.trigger('click');
    expect(onClear).toHaveBeenCalled();
    expect(onChange.mock.calls[0]?.[0]).toBeUndefined();
  });

  it('无值时 allowClear 不渲染', () => {
    const wrapper = mountSelect({ allowClear: true });
    expect(wrapper.find('.apollo-select-clear').exists()).toBe(false);
  });

  it('tags：搜索词提交成新值', async () => {
    const onChange = vi.fn();
    const wrapper = mountSelect({ mode: 'tags', onChange });
    const input = wrapper.find('input');
    await input.setValue('new-tag');
    await input.trigger('keydown', { key: 'Enter', keyCode: 13 });
    await flush();
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual(['new-tag']);
    wrapper.unmount();
  });

  it('分组：渲染 -item-group 且子项标 -grouped', async () => {
    const options = [{ label: 'Fruit', options: [{ value: 'a', label: 'Apple' }] }];
    const wrapper = mount(Select, {
      props: { options, open: true, id: 'x' },
      attachTo: document.body,
    });
    await flush();
    expect(body().querySelector('.apollo-select-item-group')?.textContent).toBe('Fruit');
    expect(body().querySelector('.apollo-select-item-option-grouped')).toBeTruthy();
    wrapper.unmount();
  });
});

describe('Select · 实例句柄', () => {
  it('expose：focus / blur / nativeElement / scrollTo', () => {
    const wrapper = mountSelect();
    const vm = wrapper.vm as unknown as {
      focus: () => void;
      blur: () => void;
      nativeElement: HTMLElement | null;
      scrollTo: (arg?: unknown) => void;
    };
    expect(typeof vm.focus).toBe('function');
    expect(typeof vm.blur).toBe('function');
    expect(typeof vm.scrollTo).toBe('function');
    expect(vm.nativeElement).toBeTruthy();
  });
});
