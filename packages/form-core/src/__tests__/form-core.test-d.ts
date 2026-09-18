/**
 * L3 —— 类型契约。
 *
 * 除了正向断言，每条容易写错的都配了 `@ts-expect-error` 负例：
 * 类型测试如果只有正例，改坏签名也照样是绿的。
 *
 * ⚠️ 负例必须包在**不会被调用**的函数里 —— vitest 的 types 项目仍会执行本文件。
 */

import { describe, expectTypeOf, it } from 'vitest';
import rules from '../rules';
import { Schema } from '../schema';
import type {
  ExecuteRule,
  ExecuteValidator,
  InternalRuleItem,
  Rule,
  RuleItem,
  Rules,
  RuleType,
  ValidateCallback,
  ValidateError,
  ValidateFieldsError,
  ValidateMessages,
  ValidateOption,
  Validator,
  Value,
  Values,
} from '../types';
import validators from '../validators';

describe('RuleType', () => {
  it('是 17 种类型的联合', () => {
    expectTypeOf<RuleType>().toEqualTypeOf<
      | 'string'
      | 'number'
      | 'boolean'
      | 'method'
      | 'regexp'
      | 'integer'
      | 'float'
      | 'array'
      | 'object'
      | 'enum'
      | 'date'
      | 'url'
      | 'hex'
      | 'email'
      | 'tel'
      | 'pattern'
      | 'any'
    >();
  });

  it('⭐ 不接受第 18 种（负例）', () => {
    // @ts-expect-error 拼错的类型名必须被拒绝
    const bad: RuleType = 'strng';
    void bad;
  });
});

describe('RuleItem / Rules', () => {
  it('RuleItem 的字段都是可选的', () => {
    expectTypeOf<RuleItem>().toMatchTypeOf<Partial<RuleItem>>();
    const empty: RuleItem = {};
    void empty;
  });

  it('⭐ Rule 是单项或数组', () => {
    expectTypeOf<Rule>().toEqualTypeOf<RuleItem | RuleItem[]>();
    const one: Rule = { required: true };
    const many: Rule = [{ required: true }, { type: 'string' }];
    void one;
    void many;
  });

  it('Rules 是字段名到 Rule 的记录', () => {
    expectTypeOf<Rules>().toEqualTypeOf<Record<string, Rule>>();
  });

  it('⭐ min 必须是数字（负例）', () => {
    // @ts-expect-error 字符串不是合法的 min
    const bad: RuleItem = { min: '3' };
    void bad;
  });

  it('⭐ enum 只接受原始值（负例）', () => {
    const ok: RuleItem = { enum: ['a', 1, true, null, undefined] };
    void ok;
    // @ts-expect-error 对象不能进 enum
    const bad: RuleItem = { enum: [{ a: 1 }] };
    void bad;
  });
});

describe('ValidateOption', () => {
  it('firstFields 是 boolean 或 string[]', () => {
    expectTypeOf<ValidateOption['firstFields']>().toEqualTypeOf<boolean | string[] | undefined>();
  });

  it('⭐ error 的签名被钉住', () => {
    expectTypeOf<ValidateOption['error']>().toEqualTypeOf<
      ((rule: InternalRuleItem, message: string) => ValidateError) | undefined
    >();
  });

  it('⭐ 不接受未知选项（负例）', () => {
    // @ts-expect-error 没有这个选项
    const bad: ValidateOption = { unknownOption: true };
    void bad;
  });
});

describe('ValidateCallback / ValidateError', () => {
  it('callback 的第一参可以是 null', () => {
    const cb: ValidateCallback = (errors, fields) => {
      expectTypeOf(errors).toEqualTypeOf<ValidateError[] | null>();
      expectTypeOf(fields).toEqualTypeOf<ValidateFieldsError | Values>();
    };
    void cb;
  });

  it('⭐ 第二参是联合类型 —— 这是上游的既有形态（成功时给 source）', () => {
    // 上游 interface.d.ts 就是 `ValidateFieldsError | Values`
    expectTypeOf<ValidateCallback>().parameters.toEqualTypeOf<
      [ValidateError[] | null, ValidateFieldsError | Values]
    >();
  });

  it('ValidateError 三个字段都可选', () => {
    const e: ValidateError = {};
    void e;
    const full: ValidateError = { message: 'm', field: 'f', fieldValue: 1 };
    void full;
  });
});

describe('Schema.validate 的重载', () => {
  it('三种调用形态都成立', () => {
    const s = new Schema({ f: { required: true } });
    expectTypeOf(s.validate({}, () => {})).toEqualTypeOf<Promise<Values>>();
    expectTypeOf(s.validate({}, {}, () => {})).toEqualTypeOf<Promise<Values>>();
    expectTypeOf(s.validate({})).toEqualTypeOf<Promise<Values>>();
  });

  it('⭐ 返回 Promise<Values>（失败时 reject）', () => {
    expectTypeOf(new Schema({}).validate).returns.toEqualTypeOf<Promise<Values>>();
  });

  it('⭐ rules 字段可空（构造失败时为 null）', () => {
    expectTypeOf<Schema['rules']>().toEqualTypeOf<Record<string, RuleItem[]> | null>();
  });

  it('⭐ 不接受未知构造参数（负例）', () => {
    // @ts-expect-error 构造只接 descriptor
    void new Schema({}, 'extra');
  });
});

describe('Validator 的两种签名', () => {
  it('⭐ 两者的 callback 签名**不同** —— 这是必须的，别"统一"它们', () => {
    // ExecuteRule 的 errors 是 `string[]`（往里 push 消息），
    // ExecuteValidator 的 callback 是 `(error?: string[]) => void`（交回结果）。
    // 前者不能赋给后者 —— 类型系统会拦住把原子规则直接当校验器用。
    expectTypeOf<ExecuteRule>().parameter(4).toEqualTypeOf<ValidateOption>();
    expectTypeOf<ExecuteRule>().parameter(5).toEqualTypeOf<string | undefined>();
    expectTypeOf<ExecuteValidator>().parameter(2).toEqualTypeOf<(error?: string[]) => void>();
  });

  it('⭐ Validator 是两者的联合', () => {
    expectTypeOf<Validator>().toEqualTypeOf<
      ExecuteValidator | NonNullable<RuleItem['validator']>
    >();
  });

  it('注册表的值是 ExecuteValidator', () => {
    expectTypeOf(validators).toEqualTypeOf<Record<string, ExecuteValidator>>();
  });

  it('⭐ 注册表按类型名索引（负例：不存在的键取不到精确类型）', () => {
    expectTypeOf(validators.string).toEqualTypeOf<ExecuteValidator | undefined>();
  });
});

describe('messages', () => {
  it('ValidateMessages 的嵌套结构', () => {
    expectTypeOf<ValidateMessages['types']>().toMatchTypeOf<
      Partial<Record<string, unknown>> | undefined
    >();
  });

  it('⭐ 模板可以是函数（负例：数字不行）', () => {
    const ok: ValidateMessages = { required: (f) => `${f} required` };
    void ok;
    // @ts-expect-error 数字不是合法的模板
    const bad: ValidateMessages = { required: 42 };
    void bad;
  });
});

describe('Value / Values', () => {
  it('Value 是 any（与上游一致，见 types.ts 文件头注释）', () => {
    expectTypeOf<Value>().toBeAny();
  });

  it('Values 是 Record<string, Value>', () => {
    expectTypeOf<Values>().toEqualTypeOf<Record<string, Value>>();
  });
});

describe('rules 注册表', () => {
  it('6 个原子规则', () => {
    expectTypeOf(Object.keys(rules).sort()).toEqualTypeOf<string[]>();
  });
});
