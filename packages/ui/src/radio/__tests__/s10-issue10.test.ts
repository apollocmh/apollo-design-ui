/**
 * Issue #10 批量修复的回归（radio）。
 *
 * 四项中三项落实、一项**证伪**（#10.3）—— 判据一律来自 antd 6.6.4 的实测
 * （SSR 探针 + `radio.js` 逐行），不凭记忆：
 *
 * 1. [#10.1] `RadioGroupProps.size` 缺 `'medium'` ⇒ 统一到共享 `SizeType`。
 * 2. [#10.2] `-wrapper-in-form-item` 被写成「form 未落地 ⇒ 恒 false」，
 *    而 form 已在 Issue #8 落地 ⇒ 接线 `FormItemInputContext.isFormItemInput`。
 * 3. [#10.3] 「`skipGroup` 未生效」= **误报**。类型是从 `AbstractCheckboxProps`
 *    继承来的，`radio.js` 全文不读 ⇒ 无运行时语义（SSR 实测：组内照样
 *    `-wrapper-checked`，且 React 打印 unrecognized prop 告警）。
 * 4. [#10.4] `useBubbleLock` 收裸 `callbacks.onClick` ⇒ 锁死首帧回调。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { Form, FormItem } from '../../form';
import { Radio, RadioGroup } from '../index';

const ROOT = 'apollo-radio';

describe('Issue #10.1 · Group 尺寸：medium 与 large / small', () => {
  it('★ `size="large"` ⇒ `-large` 类；`size="small"` ⇒ `-small` 类', () => {
    for (const [size, cls] of [
      ['large', `${ROOT}-group-large`],
      ['small', `${ROOT}-group-small`],
    ] as const) {
      const w = mount(RadioGroup, { props: { size }, slots: { default: () => 'x' } });
      expect(w.classes(), `${size} 应有 ${cls}`).toContain(cls);
      w.unmount();
    }
  });

  it('★ `size="medium"` / `size="middle"` 都不产尺寸类名（与 antd 同判）', () => {
    // 上游 `group.js:97-98` 只判 'large' / 'small' —— 'medium' 与 'middle' 同属默认档。
    for (const size of ['medium', 'middle'] as const) {
      const w = mount(RadioGroup, { props: { size }, slots: { default: () => 'x' } });
      const classes = w.classes();
      expect(classes, `${size} 不该产 -large`).not.toContain(`${ROOT}-group-large`);
      expect(classes, `${size} 不该产 -small`).not.toContain(`${ROOT}-group-small`);
      w.unmount();
    }
  });
});

describe('Issue #10.2 · Form.Item 通道（-wrapper-in-form-item）', () => {
  const inFormItem = () =>
    mount(Form, {
      slots: {
        default: () =>
          h(
            FormItem,
            { name: 'r' },
            { default: () => h(Radio, { value: 1 }, { default: () => 'x' }) },
          ),
      },
    });

  it('★ 放进 Form.Item ⇒ label 带 `-wrapper-in-form-item`', () => {
    const w = inFormItem();
    const label = w.find(`label.${ROOT}-wrapper`);
    expect(label.exists(), '应渲染出 radio 的 label').toBe(true);
    expect(label.classes()).toContain(`${ROOT}-wrapper-in-form-item`);
    w.unmount();
  });

  it('★ 反向哨兵：不在 Form.Item 里就没有这个类', () => {
    const w = mount(Radio, { props: { value: 1, checked: true }, attrs: { class: undefined } });
    const label = w.find(`label.${ROOT}-wrapper`);
    expect(label.classes()).not.toContain(`${ROOT}-wrapper-in-form-item`);
    w.unmount();
  });
});

describe('Issue #10.3 · 清理没有真实职责的继承字段', () => {
  it('组内始终按标量 value 管理选中态', () => {
    const w = mount(RadioGroup, {
      props: { value: 1 },
      slots: { default: () => h(Radio, { value: 1 }, { default: () => 'x' }) },
    });
    expect(w.get(`label.${ROOT}-wrapper`).classes()).toContain(`${ROOT}-wrapper-checked`);
    w.unmount();
  });
  it('Radio 的 props 不再声明 skipGroup、optionType 或 type', () => {
    for (const name of ['skipGroup', 'optionType', 'type']) {
      expect(Object.hasOwn(Radio.props, name)).toBe(false);
    }
    const w = mount(Radio, { props: { value: 1 } });
    expect(w.html()).not.toMatch(/skipgroup/i);
    w.unmount();
  });
});

describe('Issue #10.4 · 冒泡锁取最新 onClick', () => {
  it('★ 父级替换 onClick 后，label 点击调的是**新**回调', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const handler = ref<((e: MouseEvent) => void) | undefined>(first);
    const Host = defineComponent({
      setup() {
        return () => h(Radio, { value: 1, onClick: handler.value }, { default: () => 'x' });
      },
    });
    const w = mount(Host);
    await w.find(`label.${ROOT}-wrapper`).trigger('click');
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();

    handler.value = second;
    await nextTick();
    await w.find(`label.${ROOT}-wrapper`).trigger('click');

    expect(second, '替换后应调新回调').toHaveBeenCalledTimes(1);
    expect(first, '替换后不该再调旧回调').toHaveBeenCalledTimes(1);
    w.unmount();
  });
});
