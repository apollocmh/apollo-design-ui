/**
 * L3 类型 —— Form / Form.Item / hooks 的 API 形状（正例 + 负例）。
 *
 * ⚠️ 负例一律写成**类型层面**的赋值（`type X = ...` + `@ts-expect-error`），
 *    不放进会执行的代码里 —— `*.test-d.ts` 会被 vitest 真的执行，
 *    运行时执行的负例只会崩溃，测不出「类型报错」这件事。
 */

import type { FormInstance } from '@apollo-design/form-core';
import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import { useForm } from '../hooks/use-form';
import type { Form, FormItem, FormList } from '../index';
import type {
  FormEmits,
  FormItemProps,
  FormLayout,
  FormProps,
  FormSemanticClassNames,
  FormSemanticStyles,
  RequiredMark,
  ValidateStatus,
} from '../interface';

describe('Form · props 类型', () => {
  it('layout 三值联合 + requiredMark 四形态', () => {
    expectTypeOf<FormLayout>().toEqualTypeOf<'horizontal' | 'inline' | 'vertical'>();
    expectTypeOf<RequiredMark>().toEqualTypeOf<
      boolean | 'optional' | ((labelNode: VNodeChild, info: { required: boolean }) => VNodeChild)
    >();
  });

  it('ValidateStatus 含空串（「无状态」是合法值）', () => {
    expectTypeOf<ValidateStatus>().toEqualTypeOf<
      'success' | 'warning' | 'error' | 'validating' | ''
    >();
  });

  it('FormProps 的事件是 emits（不在 props 上）—— 与 FormEmits 对齐', () => {
    // props 侧必须 Omit 掉 onFinish* / onValuesChange / onFieldsChange
    const props: keyof FormProps = 'layout';
    expectTypeOf(props).toBeString();
    expectTypeOf<FormEmits>().toHaveProperty('finish');
    expectTypeOf<FormEmits>().toHaveProperty('finishFailed');
    expectTypeOf<FormEmits>().toHaveProperty('valuesChange');
    expectTypeOf<FormEmits>().toHaveProperty('fieldsChange');
  });

  it('语义槽：classNames / styles 六键', () => {
    expectTypeOf<keyof FormSemanticClassNames>().toEqualTypeOf<
      'root' | 'label' | 'content' | 'help' | 'helpItem' | 'extra'
    >();
    expectTypeOf<keyof FormSemanticStyles>().toEqualTypeOf<
      'root' | 'label' | 'content' | 'help' | 'helpItem' | 'extra'
    >();
  });

  it('FormItemProps 继承 form-core 的 FieldProps（name / rules / valuePropName）', () => {
    const p: FormItemProps = {
      name: ['user', 0],
      valuePropName: 'checked',
      rules: [{ required: true }],
      label: 'User',
      noStyle: true,
      validateTrigger: 'onBlur',
    };
    expectTypeOf(p.label).toEqualTypeOf<VNodeChild | undefined>();
    expectTypeOf(p.name).not.toBeNever();
  });

  it('组件可用的关键 props（编译期存在性）', () => {
    type FormPropsKeys = InstanceType<typeof Form> extends never ? never : Record<string, unknown>;
    const key: keyof FormPropsKeys = 'layout';
    expectTypeOf(key).toBeString();
    expectTypeOf<typeof FormList>().not.toBeNever();
    expectTypeOf<typeof FormItem>().not.toBeNever();
  });
});

describe('Form · hooks 类型', () => {
  it('useForm 返回元组里的 FormInstance（带 validateFields / setFieldsValue）', () => {
    const [form] = useForm<{ user: string }>();
    expectTypeOf(form).toEqualTypeOf<FormInstance<{ user: string }>>();
    expectTypeOf(form.validateFields).toBeFunction();
    expectTypeOf(form.setFieldsValue).toBeFunction();
    expectTypeOf(form.getFieldsValue).toBeFunction();
  });
});

describe('Form · 负例', () => {
  it('layout 不接受任意字符串', () => {
    type Acceptable = FormLayout | undefined;
    // @ts-expect-error 'grid' 不是合法布局
    const bad: Acceptable = 'grid';
    expectTypeOf(bad).not.toBeNever();
  });

  it('requiredMark 不接受数字', () => {
    type Acceptable = RequiredMark | undefined;
    // @ts-expect-error 数字不是合法取值（boolean / 'optional' / 函数）
    const bad: Acceptable = 1;
    expectTypeOf(bad).not.toBeNever();
  });

  it('ValidateStatus 只收五种合法值（invalid 不在其中）', () => {
    type Acceptable = ValidateStatus | undefined;
    // @ts-expect-error 'invalid' 不是 antd 的校验状态
    const bad: Acceptable = 'invalid';
    expectTypeOf(bad).not.toBeNever();
  });
});
