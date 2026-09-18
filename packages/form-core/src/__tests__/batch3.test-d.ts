/**
 * L3 —— 批次③ 的类型契约。
 *
 * 除了正向断言，每条容易写错的都配了 `@ts-expect-error` 负例：
 * 类型测试如果只有正例，改坏签名也照样是绿的（`TESTING.md` T7）。
 *
 * ⚠️ 负例必须包在**不会被调用**的函数里 —— vitest 的 types 项目仍会执行本文件。
 *
 * ⚠️ 本文件**只**测批次③ 新增的类型面。批次①② 的在 `form-core.test-d.ts`。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { Component, VNodeChild } from 'vue';

import type {
  ChildProps,
  FieldEntity,
  FieldMessage,
  FieldProps,
  FieldSlots,
  FieldValidator,
  FormInstance,
  FormProps,
  FormRule,
  FormRuleType,
  GetFieldsValueConfig,
  InternalFormInstance,
  ListProps,
  Meta,
  NamePath,
  RecursivePartial,
  RuleObject,
  RuleRender,
  Store,
  ValidateMessages,
  WatchDependencies,
} from '../index';

describe('NamePath（深推导）', () => {
  it('⭐ 从 Values 推出合法路径：键 / 单元素元组 / 嵌套元组', () => {
    type Values = { user: { name: string } };
    expectTypeOf<'user'>().toMatchTypeOf<NamePath<Values>>();
    expectTypeOf<['user']>().toMatchTypeOf<NamePath<Values>>();
    expectTypeOf<['user', 'name']>().toMatchTypeOf<NamePath<Values>>();
  });

  it('⭐ 不存在的键被拒绝（负例）', () => {
    // @ts-expect-error 'nope' 不在 Values 的键里
    const bad: NamePath<{ user: string }> = 'nope';
    void bad;
  });

  it('⭐ 不存在的嵌套键被拒绝（负例）', () => {
    // @ts-expect-error user 下没有 nope
    const bad: NamePath<{ user: { name: string } }> = ['user', 'nope'];
    void bad;
  });

  it('不给泛型时是 any（与上游 `NamePath<T = any>` 一致）', () => {
    expectTypeOf<NamePath>().toBeAny();
  });
});

describe('FormRuleType（表单层的 14 个）', () => {
  it('⭐ 与批次① 的 RuleType 不同：**没有** pattern / any / array', () => {
    expectTypeOf<FormRuleType>().toEqualTypeOf<
      | 'string'
      | 'number'
      | 'boolean'
      | 'method'
      | 'regexp'
      | 'integer'
      | 'float'
      | 'object'
      | 'enum'
      | 'date'
      | 'url'
      | 'hex'
      | 'email'
      | 'tel'
    >();
  });

  it('⭐ 拒绝批次① 才有的成员（负例）', () => {
    // @ts-expect-error 'pattern' 只属于批次① 的 RuleType
    const bad: FormRuleType = 'pattern';
    void bad;
  });
});

describe('FormRule / RuleRender / FieldValidator', () => {
  it('⭐ FormRule 是 RuleObject | RuleRender（上游同名 Rule，本包改名）', () => {
    expectTypeOf<FormRule>().toEqualTypeOf<RuleObject | RuleRender>();
  });

  it('RuleRender 收到 FormInstance', () => {
    expectTypeOf<RuleRender>().parameters.toEqualTypeOf<[FormInstance]>();
  });

  it('⭐ FieldValidator 是 callback 式（三参 + callback）', () => {
    const validator: FieldValidator = (_rule, _value, callback) => {
      callback('错了');
      return Promise.resolve();
    };
    void validator;
  });

  it('⭐ FieldValidator 的 callback 只接一个可选字符串（负例：接数组不行）', () => {
    const bad: FieldValidator = (_rule, _value, callback) => {
      // @ts-expect-error callback 的入参是 `string | undefined`，不是 `string[]`
      callback(['a', 'b']);
    };
    void bad;
  });
});

describe('FieldMessage', () => {
  it('⭐ 是 string | VNodeChild（上游声明 string，运行时允许元素）', () => {
    const ok: FieldMessage = '必填';
    void ok;
    const ok2: FieldMessage = null as unknown as VNodeChild;
    void ok2;
  });

  it('Meta.errors 是 FieldMessage[]', () => {
    expectTypeOf<Meta['errors']>().toEqualTypeOf<FieldMessage[]>();
  });

  it('⚠️ 数字**是**合法的 FieldMessage —— 因为 Vue 的 VNodeChild 含 number（比上游宽）', () => {
    // 上游是 `string | ReactElement`；Vue 没有 ReactElement，对应物是 `VNodeChild`，
    // 而 `VNodeChildAtom` 含 `number | boolean | null | undefined | void`。
    // ⇒ 我们的 `FieldMessage` **严格宽于**上游。这是 §6.4.5 差异 1 的必然结果，
    //    显式钉住以免被当成"类型写松了"。
    const ok: FieldMessage = 42;
    void ok;
    const ok2: FieldMessage = true;
    void ok2;
  });

  it('⭐ 普通对象不是合法的 FieldMessage（负例）', () => {
    // @ts-expect-error 对象既不是 string 也不是 VNodeChild 的任一分支
    const bad: FieldMessage = {};
    void bad;
  });
});

describe('FormInstance 的方法签名', () => {
  // ⚠️⚠️ 这一组**必须**包在「永不调用」的函数里。
  //    `null as unknown as FormInstance` 只是**类型层面**的替身；一旦真的执行到
  //    `form.isFieldsTouched()` 就是 `TypeError`（运行时错误，不是类型错误）。
  //    vitest 的 `types` 项目**仍会运行时执行**本文件 —— 2026-09-18 `--verify` 正是
  //    靠这一点抓到这 5 条「只跑 vue-tsc 看不出来」的假绿。
  it('⭐ isFieldsTouched 是两种元数的交集', () => {
    const check = (form: FormInstance<{ a: string }>) => {
      expectTypeOf(form.isFieldsTouched()).toEqualTypeOf<boolean>();
      expectTypeOf(form.isFieldsTouched(true)).toEqualTypeOf<boolean>();
      expectTypeOf(form.isFieldsTouched([['a']])).toEqualTypeOf<boolean>();
      expectTypeOf(form.isFieldsTouched([['a']], true)).toEqualTypeOf<boolean>();
    };
    void check;
  });

  it('⭐ getFieldsValue 的三种入参', () => {
    const check = (form: FormInstance<{ a: string }>) => {
      expectTypeOf(form.getFieldsValue()).toEqualTypeOf<{ a: string }>();
      expectTypeOf(form.getFieldsValue(true)).toBeAny();
      expectTypeOf(form.getFieldsValue([['a']])).toBeAny();
      expectTypeOf(form.getFieldsValue({} as GetFieldsValueConfig)).toBeAny();
    };
    void check;
  });

  it('⭐ setFieldsValue 接受递归可选', () => {
    const check = (form: FormInstance<{ a: { b: string } }>) => {
      form.setFieldsValue({ a: {} });
      form.setFieldsValue({});
    };
    void check;
  });

  it('getFieldsError 的入参是可选的 nameList', () => {
    const check = (form: FormInstance) => {
      expectTypeOf(form.getFieldsError()).toEqualTypeOf<
        { name: (string | number)[]; errors: FieldMessage[]; warnings: FieldMessage[] }[]
      >();
    };
    void check;
  });
});

describe('RecursivePartial', () => {
  it('⭐ 递归可选', () => {
    type T = RecursivePartial<{ a: { b: string }[] }>;
    const ok: T = { a: [{}] };
    void ok;
  });

  it('⭐ 不破坏 Date / RegExp / Function', () => {
    type T = RecursivePartial<{ d: Date }>;
    const ok: T = { d: new Date() };
    void ok;
  });
});

describe('FieldProps / FieldSlots', () => {
  it('⭐ FieldProps 的 name 是**可选**的（可做纯 shouldUpdate 字段）', () => {
    const ok: FieldProps = {};
    void ok;
    const ok2: FieldProps = { name: 'a' };
    void ok2;
  });

  it('⭐ FieldProps **没有** children（Vue 用 scoped slot 取代 cloneElement）', () => {
    // @ts-expect-error children 是 React 的 render prop，Vue 侧不存在
    const bad: FieldProps = { children: () => null };
    void bad;
  });

  it('⭐ validateFirst 是 boolean | "parallel"', () => {
    const ok: FieldProps = { validateFirst: 'parallel' };
    void ok;
    const ok2: FieldProps = { validateFirst: true };
    void ok2;
  });

  it('⭐ FieldSlots.default 收到 (control, meta, form)', () => {
    type Args = Parameters<NonNullable<FieldSlots['default']>>;
    expectTypeOf<Args[0]>().toEqualTypeOf<ChildProps>();
    expectTypeOf<Args[1]>().toEqualTypeOf<Meta>();
    expectTypeOf<Args[2]>().toEqualTypeOf<FormInstance>();
  });
});

describe('FormProps / ListProps', () => {
  it('⭐ component 接受 false | string | Component', () => {
    const a: FormProps = { component: false };
    const b: FormProps = { component: 'form' };
    const c: FormProps = { component: null as unknown as Component };
    void a;
    void b;
    void c;
  });

  it('⭐ ListProps 的 name 是**必填**的（负例：不给 name 不行）', () => {
    // @ts-expect-error Form.List 必须有 name
    const bad: ListProps = {};
    void bad;
  });
});

describe('InternalFormInstance', () => {
  it('⭐ validateFields 换成了内部版本（多 delayFrame 等选项）', () => {
    // ⚠️ 同上：包在永不调用的函数里，否则 `null.validateFields(...)` 是运行时 TypeError。
    const check = (form: InternalFormInstance) => {
      form.validateFields([], { delayFrame: true, triggerName: 'onChange' });
    };
    void check;
  });

  it('⭐ 带 getInternalHooks 与 _init', () => {
    expectTypeOf<InternalFormInstance['_init']>().toEqualTypeOf<boolean | undefined>();
  });
});

describe('WatchDependencies', () => {
  it('⭐ 路径或选择器函数（**没有**「路径数组」这一支）', () => {
    const a: WatchDependencies<{ user: string }> = 'user';
    const b: WatchDependencies<{ user: string }> = ['user'];
    const c: WatchDependencies = (values: Store) => values.anything;
    void a;
    void b;
    void c;
  });
});

describe('ValidateMessages（复用批次①）', () => {
  it('⭐ 表单层的 ValidateMessages 与批次① **同一个类型**（不是第二份定义）', () => {
    const messages: ValidateMessages = { required: '${label} 必填' };
    void messages;
  });
});

describe('FieldEntity（批次③b 的声明订正）', () => {
  it('⭐ `isPreserve()` 按运行时写：`boolean | undefined`（不是上游 .d.ts 的 `boolean`）', () => {
    // 上游 `Field.js:408` 直接返回 `this.props.preserve`，而 `preserve` 未传时是 `undefined`。
    // 若这里压成 `boolean`，`FormStore.isMergedPreserve` 的 `fieldPreserve !== undefined`
    // 判据就失效 —— 字段级会覆盖表单级（契约 §4.7.8.1 ⑦）。
    expectTypeOf<ReturnType<FieldEntity['isPreserve']>>().toEqualTypeOf<boolean | undefined>();
  });

  it('负例：把 `isPreserve()` 的返回值当成纯 boolean 用会报错', () => {
    const bad = (entity: FieldEntity) => {
      // @ts-expect-error `boolean | undefined` 不能赋给 `boolean`
      const value: boolean = entity.isPreserve();
      void value;
    };
    void bad;
  });
});
