/**
 * L5 可访问性 —— Form / Form.Item 的 label 关联与状态通道。
 *
 * 判据（antd 6.6.4）：
 * 1. label `for` = fieldId，控件 `id` = fieldId ⇒ axe 的 `label` 规则可过
 *    （`getFieldId`：namePath.join('_')，Form 有 name 时加前缀）；
 * 2. required ⇒ 控件 `aria-required="true"`；
 * 3. 有错误/help ⇒ 控件 `aria-describedby` 指向 `${fieldId}_help`（引用必须自洽：
 *    被引用的节点真的在文档里）；
 * 4. 有错误 ⇒ 控件 `aria-invalid="true"`（校验链是异步的，这里用 `validateStatus`
 *    显式驱动，避免依赖时序）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import Input from '../../input';
import { Form, FormItem, useForm } from '../index';

a11yDemoTest('Form', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

const mountItem = (itemProps: Record<string, unknown>, formProps: Record<string, unknown> = {}) =>
  mount(
    h(Form as never, { ...formProps } as never, {
      default: () =>
        h(FormItem as never, { label: 'User', name: 'user', ...itemProps } as never, {
          default: () => h(Input as never),
        }),
    }),
  );

describe('Form · label 关联与 ARIA 通道', () => {
  it('label for = 控件 id = fieldId（getFieldId 的 namePath join）', () => {
    const w = mountItem({});
    expect(w.find('label').attributes('for')).toBe('user');
    expect(w.find('input').attributes('id')).toBe('user');
    w.unmount();
  });

  it('Form 有 name 时 fieldId 带前缀', () => {
    const w = mountItem({}, { name: 'login' });
    expect(w.find('label').attributes('for')).toBe('login_user');
    expect(w.find('input').attributes('id')).toBe('login_user');
    w.unmount();
  });

  it('required ⇒ aria-required="true"', async () => {
    const w = mountItem({ required: true });
    await nextTick();
    expect(w.find('input').attributes('aria-required')).toBe('true');
    w.unmount();
  });

  it('校验失败 ⇒ aria-invalid + aria-describedby 指向真实存在的 _help 节点', async () => {
    // ⚠️ `aria-invalid` 的判据是 **mergedErrors.length**（不是 validateStatus），
    //    与 antd 的 FormItem 逐字一致 ⇒ 必须真的跑一遍校验链，不能只给
    //    `validateStatus='error'`（那条只影响状态类名/explain 颜色）。
    const [formRef] = useForm();
    const w = mount(
      h(Form as never, { form: formRef as never } as never, {
        default: () =>
          h(
            FormItem as never,
            {
              label: 'User',
              name: 'user',
              rules: [{ required: true, message: '必填' }],
            } as never,
            { default: () => h(Input as never) },
          ),
      }),
    );
    await nextTick();
    formRef.setFieldsValue({ user: '' });
    try {
      await formRef.validateFields();
    } catch {
      // 预期失败
    }
    await new Promise((r) => setTimeout(r, 60));
    await nextTick();
    await nextTick();
    const input = w.find('input');
    expect(input.attributes('aria-invalid')).toBe('true');
    const describedby = input.attributes('aria-describedby');
    expect(describedby).toBe('user_help');
    // 引用自洽：被引用的节点必须在 DOM 里
    expect(w.find(`#${describedby}`).exists()).toBe(true);
    w.unmount();
  });

  it('extra ⇒ aria-describedby 追加 _extra（多条空格分隔）', async () => {
    const w = mountItem({ validateStatus: 'error', help: '必填', extra: '补充说明' });
    await nextTick();
    await new Promise((r) => setTimeout(r, 60));
    await nextTick();
    const describedby = w.find('input').attributes('aria-describedby') ?? '';
    for (const token of describedby.split(' ').filter(Boolean)) {
      expect(w.find(`#${token}`).exists()).toBe(true);
    }
    expect(describedby.split(' ')).toContain('user_extra');
    w.unmount();
  });

  it('纯布局 Form.Item（无 name）不产生 label/控件关联，也不注入 aria', async () => {
    const w = mount(
      h(Form as never, {} as never, {
        default: () =>
          h(FormItem as never, { label: 'Plain' } as never, {
            default: () => h(Input as never),
          }),
      }),
    );
    await nextTick();
    // label 仍然渲染，但 for 为空（fieldId undefined）
    expect(w.find('label').attributes('for')).toBeUndefined();
    const input = w.find('input');
    expect(input.attributes('aria-required')).toBeUndefined();
    expect(input.attributes('aria-invalid')).toBeUndefined();
    w.unmount();
  });
});
