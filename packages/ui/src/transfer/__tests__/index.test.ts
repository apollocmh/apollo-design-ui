// @vitest-environment jsdom
/**
 * Transfer 的 L2 组件行为测试（V2 契约：antd 6.6.4 `es/transfer/index.js` 行为对拍）。
 *
 * 覆盖面（与分片计划对齐）：
 *  - T1 结构：根/两个 section/actions 类名、左右标题、计数文案；
 *  - T2 勾选：行点击 → onSelectChange、全选 checkbox 三态、selectAllLabels；
 *  - T3 移动：moveToRight → onChange（过滤禁用项）、oneWay（隐藏向左按钮、删除按钮）；
 *  - T4 搜索：showSearch 过滤 + onSearch 事件、filterOption 自定义、notFoundContent；
 *  - 分页：pagination 模式（内嵌 Pagination、selectCurrent 反选）；
 *  - 受控：selectedKeys 受控（不回写）、targetKeys 拆分。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import Transfer from '../index';
import type { TransferItem } from '../interface';

const DATA_SOURCE: TransferItem[] = Array.from({ length: 8 }, (_, i) => ({
  key: String(i),
  title: `content${i + 1}`,
  disabled: i === 3,
}));

const mountTransfer = (props: Record<string, unknown> = {}) =>
  mount(Transfer, {
    props: { dataSource: DATA_SOURCE, ...props },
    attachTo: document.body,
  });

/** ⚠️ `-list-` 只是类名前缀（没有 `.apollo-transfer-list` 元素本体）—— 按 section 定位。 */
const leftItems = (wrapper: ReturnType<typeof mountTransfer>) =>
  wrapper.findAll('.apollo-transfer-section')[0]!.findAll('.apollo-transfer-list-content-item');
const rightItems = (wrapper: ReturnType<typeof mountTransfer>) =>
  wrapper.findAll('.apollo-transfer-section')[1]!.findAll('.apollo-transfer-list-content-item');
const rightListItems = rightItems;

describe('Transfer · T1 结构', () => {
  it('根类名 + 两个 section + actions', () => {
    const wrapper = mountTransfer();
    expect(wrapper.find('.apollo-transfer').exists()).toBe(true);
    expect(wrapper.findAll('.apollo-transfer-section').length).toBe(2);
    expect(wrapper.find('.apollo-transfer-actions').exists()).toBe(true);
    wrapper.unmount();
  });

  it('默认计数文案与标题', () => {
    const wrapper = mountTransfer({ targetKeys: ['1', '4'] });
    const headers = wrapper.findAll('.apollo-transfer-list-header-selected');
    expect(headers.length).toBe(2);
    // 左列：6 条（8 - 2 个 target）
    expect(headers[0]!.text()).toContain('6 items');
    // 右列：2 条
    expect(headers[1]!.text()).toContain('2 items');
    wrapper.unmount();
  });

  it('titles 覆盖标题', () => {
    const wrapper = mountTransfer({ titles: ['来源', '目标'] });
    const titles = wrapper.findAll('.apollo-transfer-list-header-title');
    expect(titles[0]!.text()).toBe('来源');
    expect(titles[1]!.text()).toBe('目标');
    wrapper.unmount();
  });
});

describe('Transfer · T2 勾选', () => {
  it('行点击 → onSelectChange（左右各报方向）', async () => {
    const onSelectChange = vi.fn();
    const wrapper = mountTransfer({ onSelectChange });
    await wrapper.findAll('.apollo-transfer-list-content-item')[0]!.trigger('click');
    expect(onSelectChange).toHaveBeenCalledWith(['0'], []);
    wrapper.unmount();
  });

  it('disabled 项不可勾选', async () => {
    const onSelectChange = vi.fn();
    const wrapper = mountTransfer({ onSelectChange });
    const items = wrapper.findAll('.apollo-transfer-list-content-item');
    await items[3]!.trigger('click'); // key=3 disabled
    expect(onSelectChange).not.toHaveBeenCalled();
    expect(items[3]!.classes()).toContain('apollo-transfer-list-content-item-disabled');
    wrapper.unmount();
  });

  it('全选 checkbox：无勾选 → 半选 → 全选 → 计数变化', async () => {
    const wrapper = mountTransfer();
    const checkbox = wrapper.find('.apollo-transfer-list-checkbox input');
    // 无勾选：unchecked（disabled 项不参与，也不会有半选）
    expect((checkbox.element as HTMLInputElement).checked).toBe(false);
    // 勾 1 项 → 半选
    const items = wrapper.findAll('.apollo-transfer-list-content-item');
    await items[0]!.trigger('click');
    await nextTick();
    expect((checkbox.element as HTMLInputElement).indeterminate).toBe(true);
    // 全选 → 7/7（disabled 的 key=3 不参与）
    await checkbox.setValue(true);
    await nextTick();
    // ⚠️ 计数分母是 filteredItems.length（含 disabled 项，antd 同判）
    expect(wrapper.find('.apollo-transfer-list-header-selected').text()).toContain('7/8 items');
    wrapper.unmount();
  });

  it('selectAllLabels 覆盖计数文案', () => {
    const wrapper = mountTransfer({
      selectAllLabels: ['左标签', '右标签'],
    });
    const headers = wrapper.findAll('.apollo-transfer-list-header-selected');
    expect(headers[0]!.text()).toBe('左标签');
    expect(headers[1]!.text()).toBe('右标签');
    wrapper.unmount();
  });

  it('下拉菜单 selectInvert：反选当前列表', async () => {
    vi.useFakeTimers();
    const onSelectChange = vi.fn();
    const wrapper = mountTransfer({ onSelectChange });
    // 先勾 1 项 → 反选应换成另外 6 项
    const items = wrapper.findAll('.apollo-transfer-list-content-item');
    await items[0]!.trigger('click');
    // 打开左列下拉（hover 触发，菜单是 Portal 挂 body）
    // 触发器是 Dropdown 给子节点注入的 `.apollo-dropdown-trigger` 元素
    //（antd 的 `<Dropdown className>` 落在浮层上，触发器类名是 `${prefixCls}-trigger`）
    const trigger = wrapper.find('.apollo-transfer-list-header .apollo-dropdown-trigger')
      .element as HTMLElement;
    await trigger.dispatchEvent(new Event('mouseenter'));
    // hover 开启有 0.15s 默认延迟（dropdown 同款）
    await vi.advanceTimersByTimeAsync(150);
    await nextTick();
    const menu = document.querySelector('.apollo-dropdown-menu');
    expect(menu).toBeTruthy();
    const invert = [...menu!.querySelectorAll<HTMLElement>('li')].find((li) =>
      li.textContent!.includes('Invert current page'),
    );
    expect(invert).toBeTruthy();
    invert!.click();
    await nextTick();
    // 反选后：除 key=0 外全部勾选（6 项）→ onSelectChange('left') 以整组替换语义上报
    const lastCall = onSelectChange.mock.calls.at(-1);
    expect([...lastCall![0]].sort()).toEqual(['1', '2', '4', '5', '6', '7']);
    // 第二参数是 target 侧勾选（未动 → 空）
    expect(lastCall![1]).toEqual([]);
    wrapper.unmount();
    vi.useRealTimers();
  });
});

describe('Transfer · T3 移动', () => {
  it('moveToRight：onChange 携带过滤禁用后的 keys + 方向', async () => {
    const onChange = vi.fn();
    const wrapper = mountTransfer({ onChange });
    // 勾 key=0,1,3(disabled)
    const items = wrapper.findAll('.apollo-transfer-list-content-item');
    await items[0]!.trigger('click');
    await items[1]!.trigger('click');
    await items[3]!.trigger('click');
    // 右移按钮可用
    const buttons = wrapper.findAll('.apollo-transfer-actions button');
    await buttons[0]!.trigger('click');
    expect(onChange).toHaveBeenCalledWith(['0', '1'], 'right', ['0', '1']);
    wrapper.unmount();
  });

  it('无勾选时按钮禁用', () => {
    const wrapper = mountTransfer();
    const buttons = wrapper.findAll('.apollo-transfer-actions button');
    expect(buttons[0]!.attributes('disabled')).toBeDefined();
    expect(buttons[1]!.attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });

  it('oneWay：隐藏向左按钮 + 右列渲染删除按钮', async () => {
    const onChange = vi.fn();
    const wrapper = mountTransfer({
      oneWay: true,
      targetKeys: ['1', '4'],
      onChange,
    });
    const buttons = wrapper.findAll('.apollo-transfer-actions button');
    expect(buttons.length).toBe(1);
    // 右列删除按钮
    const remove = wrapper
      .findAll('.apollo-transfer-section')[1]!
      .find('.apollo-transfer-list-content-item-remove');
    expect(remove.exists()).toBe(true);
    await remove.trigger('click');
    expect(onChange).toHaveBeenCalledWith(['4'], 'left', ['1']);
    wrapper.unmount();
  });

  it('actions 自定义按钮文案', () => {
    const wrapper = mountTransfer({ actions: ['去右边', '去左边'] });
    const buttons = wrapper.findAll('.apollo-transfer-actions button');
    expect(buttons[0]!.text()).toBe('去右边');
    expect(buttons[1]!.text()).toBe('去左边');
    wrapper.unmount();
  });
});

describe('Transfer · T4 搜索', () => {
  it('showSearch 过滤 + onSearch', async () => {
    const onSearch = vi.fn();
    const wrapper = mountTransfer({ showSearch: true, onSearch });
    const input = wrapper.find('.apollo-transfer-list-search input');
    expect(input.exists()).toBe(true);
    (input.element as HTMLInputElement).value = 'content2';
    await input.trigger('input');
    await nextTick();
    const items = leftItems(wrapper);
    expect(items.length).toBe(1);
    expect(onSearch).toHaveBeenCalledWith('left', 'content2');
    wrapper.unmount();
  });

  it('搜索无结果 → not-found 占位', async () => {
    const wrapper = mountTransfer({ showSearch: true });
    const input = wrapper.find('.apollo-transfer-list-search input');
    (input.element as HTMLInputElement).value = '不存在';
    await input.trigger('input');
    await nextTick();
    expect(wrapper.find('.apollo-transfer-list-body-not-found').exists()).toBe(true);
    wrapper.unmount();
  });

  it('filterOption 自定义过滤', async () => {
    const wrapper = mountTransfer({
      showSearch: true,
      filterOption: (inputValue: string, item: TransferItem) => String(item.key) === inputValue,
    });
    const input = wrapper.find('.apollo-transfer-list-search input');
    (input.element as HTMLInputElement).value = '2';
    await input.trigger('input');
    await nextTick();
    const items = leftItems(wrapper);
    expect(items.length).toBe(1);
    // 无 render 时文本由 title 承载
    expect(items[0]!.attributes('title')).toBe('content3');
    wrapper.unmount();
  });
});

describe('Transfer · 分页', () => {
  it('pagination 模式：内嵌分页器 + 面板加宽类', () => {
    const wrapper = mountTransfer({ pagination: { pageSize: 3 } });
    expect(wrapper.find('.apollo-transfer-section-with-pagination').exists()).toBe(true);
    expect(wrapper.find('.apollo-transfer-list-pagination').exists()).toBe(true);
    // 第一页只有 3 条
    expect(leftItems(wrapper).length).toBe(3);
    wrapper.unmount();
  });
});

describe('Transfer · 受控', () => {
  it('selectedKeys 受控：勾选只发通知不回写', async () => {
    const onSelectChange = vi.fn();
    const wrapper = mountTransfer({
      selectedKeys: ['2'],
      onSelectChange,
    });
    const items = wrapper.findAll('.apollo-transfer-list-content-item');
    expect(items[2]!.classes()).toContain('apollo-transfer-list-content-item-checked');
    await items[0]!.trigger('click');
    expect(onSelectChange).toHaveBeenCalledWith(['2', '0'], []);
    // 受控：仍只勾 key=2
    expect(items[0]!.classes()).not.toContain('apollo-transfer-list-content-item-checked');
    expect(items[2]!.classes()).toContain('apollo-transfer-list-content-item-checked');
    wrapper.unmount();
  });

  it('targetKeys 拆分 + 右列按 targetKeys 排序', () => {
    const wrapper = mountTransfer({ targetKeys: ['5', '1'] });
    const rightItems = rightListItems(wrapper);
    expect(rightItems.length).toBe(2);
    // ⚠️ antd 6 无 render 时条目 text span 为空，文本由 li 的 title 属性承载
    expect(rightItems[0]!.attributes('title')).toBe('content6');
    expect(rightItems[1]!.attributes('title')).toBe('content2');
    wrapper.unmount();
  });

  it('status → 状态类名；disabled 全局禁用', () => {
    const wrapper = mountTransfer({ status: 'error', disabled: true });
    expect(wrapper.find('.apollo-transfer-status-error').exists()).toBe(true);
    expect(wrapper.find('.apollo-transfer-disabled').exists()).toBe(true);
    wrapper.unmount();
  });

  it('rowKey 重算 key', async () => {
    const onSelectChange = vi.fn();
    const wrapper = mountTransfer({
      dataSource: [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B' },
      ] as unknown as TransferItem[],
      rowKey: (record: TransferItem) => String(record.id),
      onSelectChange,
    });
    await wrapper.findAll('.apollo-transfer-list-content-item')[0]!.trigger('click');
    expect(onSelectChange).toHaveBeenCalledWith(['a'], []);
    wrapper.unmount();
  });

  it('render 定制行文本（搜索按 value 匹配）', async () => {
    const wrapper = mountTransfer({
      showSearch: true,
      render: (item: TransferItem) => ({ label: `${item.title}！`, value: String(item.title) }),
    });
    const items = leftItems(wrapper);
    expect(items[0]!.attributes('title')).toBe('content1');
    const input = wrapper.find(
      'input.apollo-transfer-list-search, .apollo-transfer-list-search input',
    );
    (input.element as HTMLInputElement).value = 'content1';
    await input.trigger('input');
    await nextTick();
    expect(leftItems(wrapper).length).toBe(1);
    wrapper.unmount();
  });

  it('footer 渲染', () => {
    const wrapper = mountTransfer({
      footer: () => 'footer-content',
    });
    expect(wrapper.find('.apollo-transfer-list-footer').text()).toContain('footer-content');
    wrapper.unmount();
  });
});
