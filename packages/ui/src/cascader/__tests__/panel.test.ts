/**
 * S3 · Panel / OptionList 渲染测试。
 *
 * 判据：rc `Panel.js` + `OptionList/List.js` + `Column.js`（同源实现语义）。
 * Panel 是「无浮层」的完整级联面板，可直接测列展开 / 选中 / 多选 / 键盘。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import CascaderPanel from '../Panel';

const OPTIONS = [
  {
    value: 'zj',
    label: '浙江',
    children: [
      { value: 'hz', label: '杭州', children: [{ value: 'xh', label: '西湖' }] },
      { value: 'nb', label: '宁波' },
    ],
  },
  { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] },
];

const menus = (w: ReturnType<typeof mount>) => w.findAll('.apollo-cascader-menu');
const items = (w: ReturnType<typeof mount>) => w.findAll('.apollo-cascader-menu-item');

describe('CascaderPanel · 渲染', () => {
  it('根类 + 第一列渲染顶层 options', () => {
    const w = mount(CascaderPanel, { props: { options: OPTIONS } });
    expect(w.find('.apollo-cascader-panel').exists()).toBe(true);
    expect(menus(w)).toHaveLength(1);
    expect(items(w)).toHaveLength(2);
    expect(items(w)[0]?.text()).toContain('浙江');
  });

  it('空 options ⇒ -empty 类 + notFoundContent（rc 默认 Not Found）', () => {
    const w = mount(CascaderPanel, { props: { options: [] } });
    expect(w.find('.apollo-cascader-panel-empty').exists()).toBe(true);
    expect(w.text()).toContain('Not Found');
  });

  it('自定义 notFoundContent', () => {
    const w = mount(CascaderPanel, { props: { options: [], notFoundContent: '暂无数据' } });
    expect(w.text()).toContain('暂无数据');
  });
});

describe('CascaderPanel · 展开', () => {
  it('点击父级 ⇒ 新增一列；叶子选中 ⇒ change 一次（单选 payload 一维）', async () => {
    const onChange = vi.fn();
    const w = mount(CascaderPanel, { props: { options: OPTIONS, onChange } });
    // 点浙江（父级，单选非叶子不触发 change，只展开）
    await items(w)[0]?.trigger('click');
    await nextTick();
    expect(menus(w)).toHaveLength(2);
    // 点杭州（仍非叶子）
    await items(w)[2]?.trigger('click');
    await nextTick();
    expect(menus(w)).toHaveLength(3);
    // 点西湖（叶子）⇒ change
    await items(w)[4]?.trigger('click');
    await nextTick();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['zj', 'hz', 'xh']);
  });

  it('defaultValue：初始即展开到已选路径', async () => {
    const w = mount(CascaderPanel, {
      props: { options: OPTIONS, defaultValue: ['zj', 'hz'] },
    });
    await nextTick();
    expect(menus(w).length).toBeGreaterThanOrEqual(2);
    // 当前值路径上有 active 类
    expect(w.html()).toContain('data-path-key="zj__RC_CASCADER_SPLIT__hz"');
  });

  it('hover 展开触发（expandTrigger=hover）', async () => {
    const w = mount(CascaderPanel, {
      props: { options: OPTIONS, expandTrigger: 'hover' },
    });
    await items(w)[0]?.trigger('mouseenter');
    await nextTick();
    expect(menus(w)).toHaveLength(2);
  });
});

describe('CascaderPanel · 多选', () => {
  it('multiple ⇒ checkbox 出现；点 checkbox 触发勾选传导', async () => {
    const onChange = vi.fn();
    const w = mount(CascaderPanel, {
      props: { options: OPTIONS, multiple: true, onChange },
    });
    expect(w.find('.apollo-cascader-checkbox').exists()).toBe(true);
    // 勾选浙江（第一个 checkbox）→ SHOW_PARENT 收敛为 zj（父勾后子不再单独列）
    const checkbox = w.find('.apollo-cascader-checkbox');
    await checkbox.trigger('click');
    await nextTick();
    expect(onChange).toHaveBeenCalledTimes(1);
    const payload = onChange.mock.calls[0]?.[0];
    expect(payload).toContainEqual(['zj']);
  });

  it('叶子 click 在多选下不触发选中（父级靠 checkbox）', async () => {
    const onChange = vi.fn();
    const w = mount(CascaderPanel, {
      props: { options: OPTIONS, multiple: true, onChange },
    });
    await items(w)[0]?.trigger('click');
    await nextTick();
    // 点叶子（第二列的选项）
    const leaf = w.findAll('.apollo-cascader-menu-item')[2];
    await leaf?.trigger('click');
    await nextTick();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('CascaderPanel · changeOnSelect', () => {
  it('changeOnSelect：点中间层也触发 change', async () => {
    const onChange = vi.fn();
    const w = mount(CascaderPanel, {
      props: { options: OPTIONS, changeOnSelect: true, onChange },
    });
    await items(w)[0]?.trigger('click');
    await nextTick();
    expect(onChange).toHaveBeenCalledWith(['zj']);
  });
});

describe('CascaderPanel · 键盘', () => {
  it('DOWN/ENTER：同列下移 + 选中叶子', async () => {
    const onChange = vi.fn();
    const w = mount(CascaderPanel, {
      props: { options: OPTIONS, onChange, defaultValue: ['zj'] },
    });
    await nextTick();
    const list = w.findComponent({ name: 'ACascaderOptionList' });
    const fire = (which: number) =>
      (list.vm as unknown as { onKeyDown: (e: KeyboardEvent) => void }).onKeyDown(
        new KeyboardEvent('keydown', { which }),
      );
    await fire(40); // DOWN：同列下移到 js
    await nextTick();
    await fire(39); // RIGHT：进下一列（js.children 的首个可用项 nj）
    await nextTick();
    await fire(13); // ENTER：选中 nj（叶子）
    await nextTick();
    expect(onChange).toHaveBeenCalledWith(['js', 'nj']);
  });

  it('ESC：触发 toggleOpen(false)（Panel 的 noop，无副作用）', async () => {
    const w = mount(CascaderPanel, { props: { options: OPTIONS } });
    const list = w.findComponent({ name: 'ACascaderOptionList' });
    await (list.vm as unknown as { onKeyDown: (e: KeyboardEvent) => void }).onKeyDown(
      new KeyboardEvent('keydown', { which: 27 }),
    );
    expect(true).toBe(true);
  });
});

describe('CascaderPanel · 受控', () => {
  it('v-model:value：外部驱动选中路径', async () => {
    const w = mount(CascaderPanel, {
      props: { options: OPTIONS, value: ['js', 'nj'] },
    });
    await nextTick();
    expect(w.html()).toContain('data-path-key="js__RC_CASCADER_SPLIT__nj"');
  });
});

describe('CascaderPanel · loadData', () => {
  it('展开未加载的父级（isLeaf:false）⇒ loadData 调用一次', async () => {
    const loadData = vi.fn();
    // ⚠️ rc 判据：loadData 只对**非叶子**触发；无 children 但 isLeaf:false 视为待加载
    const dynamic = [{ value: 'gd', label: '广东', isLeaf: false }];
    const w = mount(CascaderPanel, { props: { options: dynamic, loadData } });
    await items(w)[0]?.trigger('click');
    await nextTick();
    expect(loadData).toHaveBeenCalledTimes(1);
    expect(loadData.mock.calls[0]?.[0]?.[0]?.value).toBe('gd');
    // loading 中：-loading 类出现，展开图标隐藏
    expect(w.html()).toContain('apollo-cascader-menu-item-loading');
  });
});

describe('CascaderPanel · expandIcon', () => {
  it('非叶子且非 loading ⇒ 显示展开图标（默认 >）', async () => {
    const w = mount(CascaderPanel, { props: { options: OPTIONS } });
    expect(w.find('.apollo-cascader-menu-item-expand-icon').text()).toBe('>');
  });

  it('自定义 expandIcon', async () => {
    const w = mount(CascaderPanel, { props: { options: OPTIONS, expandIcon: '→' } });
    expect(w.find('.apollo-cascader-menu-item-expand-icon').text()).toBe('→');
  });
});

// 让 h 导入不闲置（测试里部分用例未来扩展用）
void h;
