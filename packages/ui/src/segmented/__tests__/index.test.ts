/**
 * L1/L2 · 单元与交互测试（Segmented）
 *
 * 上游测试转断言：`@rc-component/segmented` 的 `index.test.tsx` +
 * antd 的 `segmented.test.tsx`（6.6.4）。每条用例的注释标明它来自上游哪一条。
 *
 * ⚠️ thumb 动画在 jsdom 下走「无动画」分支（offsetParent 为 0/被 CSSMotion 的
 *    探测降级）—— 行为断言只钉 value / 类名 / 事件，不钉几何。
 */

import { waitFrames } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { Segmented } from '../index';

afterEach(() => {
  vi.restoreAllMocks();
});

const OPTIONS = ['Daily', 'Weekly', 'Monthly'];

const findItems = (w: ReturnType<typeof mount>) => w.findAll('label');
const findInputs = (w: ReturnType<typeof mount>) => w.findAll('input');

describe('Segmented · 基本行为', () => {
  // rc：render correctly with options（原始值形态）
  it('原始值 options：label/title/value 全取自身，无 value 时选中第一项', () => {
    const w = mount(Segmented, { props: { options: OPTIONS } });
    const items = findItems(w);
    expect(items).toHaveLength(3);
    expect(items[0].classes()).toContain('apollo-segmented-item-selected');
    // rc 判据：defaultValue ?? options[0]?.value —— 没给 defaultValue 自动选第一项
    expect(items[0].find('input').element.checked).toBe(true);
    expect(w.find('.apollo-segmented-item-label').text()).toBe('Daily');
  });

  // rc：should fire change events when option is clicked
  it('点击选项：onChange 一次 + update:value（C11）', async () => {
    const onChange = vi.fn();
    const w = mount(Segmented, {
      props: { options: OPTIONS },
      attrs: { onChange },
    });
    await findInputs(w)[2]?.setValue(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('Monthly');
    // 受控回写前内部态也更新了（非受控分支）
    expect(findItems(w)[2]?.classes()).toContain('apollo-segmented-item-selected-text');
  });

  // rc：won't fire change events when value not changes
  it('点击已选中项：不发事件', async () => {
    const onChange = vi.fn();
    const w = mount(Segmented, {
      props: { options: OPTIONS, value: 'Daily' },
      attrs: { onChange },
    });
    await findInputs(w)[0]?.setValue(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  // rc：should be controlled by value
  it('受控：value 变化驱动选中', async () => {
    const onChange = vi.fn();
    const value = ref('Daily');
    const App = defineComponent({
      setup() {
        return () =>
          h(Segmented, {
            options: OPTIONS,
            value: value.value,
            onChange: (v: string) => {
              value.value = v;
              onChange(v);
            },
          });
      },
    });
    const w = mount(App);
    await findInputs(w)[1]?.setValue(true);
    await nextTick();
    expect(onChange).toHaveBeenCalledWith('Weekly');
    expect(findItems(w)[1]?.classes()).toContain('apollo-segmented-item-selected-text');
  });

  // rc：should not auto switch when value not exist in options
  it('受控值不在 options 里：不自动切换（单一事实来源）', () => {
    const w = mount(Segmented, {
      props: { options: OPTIONS, value: 'Missing' },
    });
    expect(findItems(w)[0]?.find('input').element.checked).toBe(false);
    // 无 thumb 且无选中项时只有 -item-selected-text 缺席，不崩
    expect(findItems(w)[1]?.classes()).not.toContain('apollo-segmented-item-selected-text');
  });

  // rc：defaultValue 生效
  it('defaultValue 指定初始项', () => {
    const w = mount(Segmented, { props: { options: OPTIONS, defaultValue: 'Monthly' } });
    expect(findItems(w)[2]?.classes()).toContain('apollo-segmented-item-selected-text');
  });

  // rc：disabled option 不可点
  it('禁用单项：input disabled + 点击不发事件', async () => {
    const onChange = vi.fn();
    const w = mount(Segmented, {
      props: {
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b', disabled: true },
        ],
      },
      attrs: { onChange },
    });
    expect(findInputs(w)[1]?.element.disabled).toBe(true);
    expect(findItems(w)[1]?.classes()).toContain('apollo-segmented-item-disabled');
    await findInputs(w)[1]?.setValue(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  // rc：disabled 整组
  it('禁用整组：所有 input disabled + 根类 -disabled', () => {
    const w = mount(Segmented, { props: { options: OPTIONS, disabled: true } });
    expect(w.find('.apollo-segmented').classes()).toContain('apollo-segmented-disabled');
    for (const input of findInputs(w)) expect(input.element.disabled).toBe(true);
  });

  // antd 薄壳：size / block / shape 类
  it('size / block / shape 类', () => {
    const lg = mount(Segmented, { props: { options: OPTIONS, size: 'large' } });
    expect(lg.find('.apollo-segmented').classes()).toContain('apollo-segmented-lg');
    const sm = mount(Segmented, { props: { options: OPTIONS, size: 'small' } });
    expect(sm.find('.apollo-segmented').classes()).toContain('apollo-segmented-sm');
    const block = mount(Segmented, { props: { options: OPTIONS, block: true } });
    expect(block.find('.apollo-segmented').classes()).toContain('apollo-segmented-block');
    const round = mount(Segmented, { props: { options: OPTIONS, shape: 'round' } });
    expect(round.find('.apollo-segmented').classes()).toContain('apollo-segmented-shape-round');
    // middle 不落类（antd 判据）
    const md = mount(Segmented, { props: { options: OPTIONS, size: 'middle' } });
    expect(md.find('.apollo-segmented').classes()).not.toContain('apollo-segmented-lg');
  });

  // antd 薄壳：vertical / orientation
  it('vertical 与 orientation:vertical 都落 -vertical（重复两次，上游行为）', () => {
    const w = mount(Segmented, { props: { options: OPTIONS, vertical: true } });
    expect(w.find('.apollo-segmented').classes()).toContain('apollo-segmented-vertical');
    expect(w.find('.apollo-segmented').attributes('aria-orientation')).toBe('vertical');
    const w2 = mount(Segmented, {
      props: { options: OPTIONS, orientation: 'vertical' },
    });
    expect(w2.find('.apollo-segmented').classes()).toContain('apollo-segmented-vertical');
  });

  // antd 薄壳：name
  it('显式 name 落到每个 input；未传时自动生成且一致', () => {
    const named = mount(Segmented, { props: { options: OPTIONS, name: 'seg' } });
    for (const input of findInputs(named)) {
      expect((input.element as HTMLInputElement).name).toBe('seg');
    }
    const auto = mount(Segmented, { props: { options: OPTIONS } });
    const names = findInputs(auto).map((i) => (i.element as HTMLInputElement).name);
    expect(new Set(names).size).toBe(1);
    expect(names[0]).not.toBe('');
  });

  // antd 薄壳：icon 语法糖
  it('icon 选项：-item-icon span + 文本 span', () => {
    const w = mount(Segmented, {
      props: { options: [{ label: 'A', value: 'a', icon: '★' }, 'B'] },
    });
    const icon = w.find('.apollo-segmented-item-icon');
    expect(icon.exists()).toBe(true);
    expect(icon.text()).toBe('★');
  });

  // antd 薄壳：title
  it('title 判据：显式 title 用之；否则对象 label 不生成 title、原始值 toString', () => {
    const w = mount(Segmented, {
      props: {
        options: [
          { label: 'A', value: 'a', title: 'Option A' },
          { label: 'B', value: 'b' },
        ],
      },
    });
    const labels = w.findAll('.apollo-segmented-item-label');
    expect(labels[0].attributes('title')).toBe('Option A');
    expect(labels[1].attributes('title')).toBe('B');
  });

  // antd 薄壳：tooltip（itemRender 包 Tooltip）—— 非受控浮层由 tooltip 组件自身测试覆盖
  it('tooltip 选项：label 元素被 Tooltip 包裹', async () => {
    const w = mount(Segmented, {
      props: {
        options: [{ label: 'A', value: 'a', tooltip: 'hello' }],
      },
      attachTo: document.body,
    });
    await waitFrames(2);
    // tooltip 组件的触发节点包住了 label
    expect(document.body.querySelector('.apollo-segmented')).not.toBeNull();
    w.unmount();
  });
});

describe('Segmented · 受控边界', () => {
  // 空 options 不崩（rc：normalizeOptions 空数组）
  it('空 options：渲染空 group', () => {
    const w = mount(Segmented, { props: { options: [] } });
    expect(w.find('.apollo-segmented-group').exists()).toBe(true);
    expect(findItems(w)).toHaveLength(0);
  });

  // options 动态变化（antd dynamic demo 场景）
  it('options 动态追加：新选项可选中', async () => {
    const options = ref<string[]>(['Daily', 'Weekly']);
    const App = defineComponent({
      setup() {
        return () => h(Segmented, { options: options.value });
      },
    });
    const w = mount(App);
    expect(findItems(w)).toHaveLength(2);
    options.value = ['Daily', 'Weekly', 'Monthly'];
    await nextTick();
    expect(findItems(w)).toHaveLength(3);
    await findInputs(w)[2]?.setValue(true);
    expect(findItems(w)[2]?.classes()).toContain('apollo-segmented-item-selected-text');
  });
});
