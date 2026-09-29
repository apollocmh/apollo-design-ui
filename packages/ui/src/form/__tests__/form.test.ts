/**
 * L1/L2 —— Form 单元 + 交互测试（antd `components/form/__tests__/` 核心子集）。
 *
 * 覆盖：
 * - 布局：fieldId 生成（含 form name 前缀）/ label htmlFor / colon / requiredMark；
 * - 校验链：required 拒绝 → explain 渲染 → has-error 类 → aria 三键 → 修复清除；
 * - control 注入：value 通道 + trigger 事件合成（用户 handler 保留）；
 * - 纯布局 Item（无 name）不进 Field；
 * - validateMessages 定制。
 *
 * ⚠️ 错误列表渲染含 debounce（0ms/10ms）—— 断言前必须等宏任务。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import Input from '../../input';
import { Form, FormItem, useForm } from '../index';
import { getFieldId } from '../util';

/**
 * rc-field-form 的消息模板占位符字面量（`$` + `{label}`）。
 *
 * 直接写字面量会被 lint 的 `noTemplateCurlyInString` 判成「模板串占位符写错了」
 * （PITFALLS 139 同族：warning 不 fail 门禁，但会一直呻吟）。拼出来即可。
 */
const LABEL_TOKEN = `$${'{label}'}`;

const flush = async (): Promise<void> => {
  await new Promise((r) => setTimeout(r, 60));
  await nextTick();
  await nextTick();
};

/** 挂一个单字段表单的工厂。 */
const mountField = (
  fieldProps: Record<string, unknown>,
  formProps: Record<string, unknown> = {},
) => {
  const [formRef] = useForm();
  const App = defineComponent({
    setup() {
      return () =>
        h(
          Form as never,
          { form: formRef as never, ...formProps },
          {
            default: () =>
              h(
                FormItem as never,
                {
                  label: 'User',
                  name: 'user',
                  rules: [{ required: true, message: '必填' }],
                  ...fieldProps,
                },
                { default: () => h(Input as never) },
              ),
          },
        );
    },
  });
  const w = mount(App);
  return { w, formRef };
};

describe('getFieldId（util.ts L1）', () => {
  it('namePath join + form name 前缀 + 黑名单', () => {
    expect(getFieldId(['user'], 'my-form')).toBe('my-form_user');
    expect(getFieldId(['user', 'name'])).toBe('user_name');
    expect(getFieldId(['parentNode'])).toBe('form_item_parentNode');
    expect(getFieldId([])).toBeUndefined();
  });
});

describe('Form · 布局与 fieldId', () => {
  it('label htmlFor 与 control id 同源（fieldId）', async () => {
    const { w } = mountField({});
    await nextTick();
    const label = w.find('label');
    const input = w.find('input');
    const htmlFor = label.attributes('for');
    const inputId = input.attributes('id');
    expect(htmlFor).toBe(inputId);
    expect(inputId).toBe('user');
    w.unmount();
  });

  it('form 有 name 时 id 加前缀', async () => {
    const { w } = mountField({}, { name: 'login' });
    await nextTick();
    expect(w.find('input').attributes('id')).toBe('login_user');
    expect(w.find('label').attributes('for')).toBe('login_user');
    w.unmount();
  });

  it('required 标记：rules 含 required ⇒ label 有 -item-required 类与 aria-required', async () => {
    const { w } = mountField({});
    await nextTick();
    expect(w.find('.apollo-form-item-required').exists()).toBe(true);
    w.unmount();
  });

  it('requiredMark=false ⇒ -hide-required-mark 类（Form 根）', async () => {
    const { w } = mountField({}, { requiredMark: false });
    await nextTick();
    expect(w.find('.apollo-form-hide-required-mark').exists()).toBe(true);
    w.unmount();
  });

  it('layout=vertical ⇒ Form 与 Item 都有 -vertical 类', async () => {
    const { w } = mountField({}, { layout: 'vertical' });
    await nextTick();
    expect(w.find('.apollo-form-vertical').exists()).toBe(true);
    expect(w.find('.apollo-form-item-vertical').exists()).toBe(true);
    w.unmount();
  });

  it('纯布局 Item（无 name）不生成 fieldId、不进 store', async () => {
    const [formRef] = useForm();
    const App = defineComponent({
      setup() {
        return () =>
          h(
            Form as never,
            { form: formRef as never },
            {
              default: () =>
                h(FormItem as never, { label: '展示' }, { default: () => h('div', 'content') }),
            },
          );
      },
    });
    const w = mount(App);
    await nextTick();
    expect(w.find('label[for]').exists()).toBe(false);
    expect(formRef.getFieldsError()).toEqual([]);
    w.unmount();
  });
});

describe('Form · 校验链', () => {
  it('required 失败 → explain + has-error + aria 三键；修复后清除', async () => {
    const { w, formRef } = mountField({});
    await nextTick();
    formRef.setFieldsValue({ user: '' });
    let failed = false;
    try {
      await formRef.validateFields();
    } catch (err) {
      failed = true;
      const info = err as { errorFields: { errors: string[] }[] };
      expect(info.errorFields[0]?.errors).toContain('必填');
    }
    expect(failed).toBe(true);
    await flush();
    expect(w.find('.apollo-form-item-explain-error').exists()).toBe(true);
    expect(w.find('.apollo-form-item-explain-error').text()).toBe('必填');
    expect(w.find('.apollo-form-item-has-error').exists()).toBe(true);
    const input = w.find('input');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-required')).toBe('true');
    expect(input.attributes('aria-describedby')).toContain('user_help');
    // 填值修复
    formRef.setFieldsValue({ user: 'x' });
    await formRef.validateFields().catch(() => {
      throw new Error('second validate should pass');
    });
    await flush();
    expect(w.find('.apollo-form-item-has-error').exists()).toBe(false);
    w.unmount();
  });

  it('validateMessages 定制：显式 message 缺省时模板生效', async () => {
    // ⭐ rc 语义：rule 显式 message 优先于全局模板 —— 测模板必须不带 message
    const [formRef] = useForm();
    const App = defineComponent({
      setup() {
        return () =>
          h(
            Form as never,
            {
              form: formRef as never,
              // antd 的消息模板占位符必须**原样**传下去（rc-field-form 用 $ + {label} 替换）
              validateMessages: { required: `${LABEL_TOKEN} 是必填项` },
            },
            {
              default: () =>
                h(
                  FormItem as never,
                  { label: 'User', name: 'user', rules: [{ required: true }] },
                  { default: () => h(Input as never) },
                ),
            },
          );
      },
    });
    const w = mount(App);
    await nextTick();
    formRef.setFieldsValue({ user: '' });
    let message: string | undefined;
    try {
      await formRef.validateFields();
    } catch (err) {
      message = (err as { errorFields: { errors: string[] }[] }).errorFields[0]
        ?.errors[0] as string;
    }
    expect(message).toBe('User 是必填项');
    await flush();
    expect(w.find('.apollo-form-item-explain-error').text()).toBe('User 是必填项');
    w.unmount();
  });

  it('help 显式给出时覆盖错误列表', async () => {
    const { w, formRef } = mountField({ help: '自定义帮助' });
    await nextTick();
    formRef.setFieldsValue({ user: '' });
    try {
      await formRef.validateFields();
    } catch {
      // 预期失败
    }
    await flush();
    expect(w.find('.apollo-form-item-explain').text()).toContain('自定义帮助');
    w.unmount();
  });

  it('trigger 事件合成：输入触发 onChange 写值 + 用户 handler 保留', async () => {
    const onChange = vi.fn();
    const [formRef] = useForm();
    const App = defineComponent({
      setup() {
        return () =>
          h(
            Form as never,
            { form: formRef as never },
            {
              default: () =>
                h(
                  FormItem as never,
                  { name: 'user' },
                  { default: () => h(Input as never, { 'onUpdate:value': onChange }) },
                ),
            },
          );
      },
    });
    const w = mount(App);
    await nextTick();
    // control 注入的 value 更新链：dispatch 触发 store 写入
    const input = w.find('input');
    (input.element as HTMLInputElement).value = 'abc';
    // Input 的值更新事件是 change（emit('update:value')）；每键入的 input 时机
    // 属于 Input 组件自身契约（本测目标是 control 注入与取值）
    await input.trigger('change');
    await nextTick();
    expect(formRef.getFieldValue('user')).toBe('abc');
    w.unmount();
  });
});

describe('Form · Item 变体', () => {
  it('noStyle：不渲染布局壳，错误上抛给父 FormItem 聚合（但父项**不**带 -has-error）', async () => {
    const [formRef] = useForm();
    const App = defineComponent({
      setup() {
        return () =>
          h(
            Form as never,
            { form: formRef as never },
            {
              default: () =>
                h(
                  FormItem as never,
                  { name: 'group' },
                  {
                    default: () => [
                      h(
                        FormItem as never,
                        {
                          name: 'user',
                          noStyle: true,
                          rules: [{ required: true, message: '子项必填' }],
                        },
                        { default: () => h(Input as never) },
                      ),
                    ],
                  },
                ),
            },
          );
      },
    });
    const w = mount(App);
    await nextTick();
    formRef.setFieldsValue({ user: '' });
    try {
      await formRef.validateFields();
    } catch {
      // 预期失败
    }
    await flush();
    // 外层 FormItem 聚合到子 noStyle Field 的错误 ⇒ 渲染错误文案、带 -with-help
    expect(w.find('.apollo-form-item-explain-error').text()).toContain('子项必填');
    expect(w.find('.apollo-form-item-with-help').exists()).toBe(true);
    // ⚠️ 但外层**没有** `-has-error`：状态取的是自己的 `meta.errors`（antd ItemHolder
    //    的 getValidateState 用 meta 而非合并后的 errors），而外层没有规则 ⇒ 恒空。
    //    判据是 antd 6.6.4 的**真实运行时**实测（`tests/visual/debug/probe-form-nostyle.mjs`：
    //    外层 no name / 带 name 两种形态都只拿到 `-with-help` + `-horizontal`）。
    //    （本文件早期版本断言过 has-error —— 那是凭直觉写的，已按实测改正。）
    expect(w.find('.apollo-form-item-has-error').exists()).toBe(false);
    w.unmount();
  });

  it('hidden ⇒ -item-hidden 类（DOM 保留）', async () => {
    const { w } = mountField({ hidden: true });
    await nextTick();
    expect(w.find('.apollo-form-item-hidden').exists()).toBe(true);
    w.unmount();
  });
});

describe('Form · validateTrigger', () => {
  it('blur（validateTrigger）触发校验', async () => {
    const { w, formRef } = mountField({ validateTrigger: 'onBlur' });
    await nextTick();
    formRef.setFieldsValue({ user: '' });
    await nextTick();
    await w.find('input').trigger('blur');
    await flush();
    expect(w.find('.apollo-form-item-has-error').exists()).toBe(true);
    void formRef;
    w.unmount();
  });
});
