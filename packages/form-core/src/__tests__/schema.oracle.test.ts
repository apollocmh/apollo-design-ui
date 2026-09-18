/**
 * Oracle 差分 —— 与 `@rc-component/async-validator@6.0.0` **逐位对比**。
 *
 * ── 为什么这个包能做 Oracle，别的包不行 ────────────────────────────────────────
 *
 * 上游是**纯 JS**（无 React 耦合），所以可以真的把它跑起来当参照物 ——
 * 这是比"读源码再手写断言"强得多的验证，与 `position`（5000 组几何差分）、
 * `motion`（种子化帧序列）同档。
 *
 * 见 `docs/foundation/form-core-contract.md` §9 第 1 条：
 * 「没有与真实 React 运行时对拍」这条限制**不适用**于批次 ①。
 *
 * ── 断言方式 ─────────────────────────────────────────────────────────────────
 *
 * 每个用例把两侧的 `(errors, fields)` 归一化成可比较的形状再 `toEqual`。
 * ⚠️ 不比较 `Error` 实例（两侧的类不同），只比较它的 `message` / `errors` / `fields`。
 */

import UpstreamSchema from '@rc-component/async-validator';
import { describe, expect, it } from 'vitest';

import { Schema } from '../schema';
import type { Rules, ValidateError, ValidateOption, Values } from '../types';

// ---------------------------------------------------------------------------
// 归一化
// ---------------------------------------------------------------------------

interface Normalized {
  errors: { message?: string; field?: string; fieldValue?: unknown }[] | null;
  fields: Record<string, { message?: string }[]> | null;
}

/** 错误数组可能带 `fieldValue`（任意值），JSON 化后比较。 */
function normalize(errors: ValidateError[] | null | undefined): Normalized['errors'] {
  if (!errors?.length) {
    return null;
  }
  return errors.map((e) => ({
    message: e.message,
    field: e.field,
    // fieldValue 可能是 undefined —— 显式保留该键，否则两侧的 undefined 处理会掩盖差异
    fieldValue: e.fieldValue === undefined ? '__undefined__' : e.fieldValue,
  }));
}

function normalizeFields(
  fields: Record<string, ValidateError[]> | Values | null | undefined,
): Normalized['fields'] {
  if (!fields) {
    return null;
  }
  const out: Record<string, { message?: string }[]> = {};
  for (const key of Object.keys(fields)) {
    const list = (fields as Record<string, ValidateError[]>)[key];
    out[key] = Array.isArray(list) ? list.map((e) => ({ message: e.message })) : [];
  }
  return out;
}

/**
 * 跑一侧的 validate，把「callback 收到的东西」与「promise 的结局」都取出来。
 *
 * ⭐ 两侧的 `validate` 都是**双通道**（callback + promise），差分要把两边都覆盖到 ——
 * 只比一边会漏掉「promise 该 reject 却没 reject」这类缺陷。
 */
async function runSide(
  schema: { validate: (...args: unknown[]) => Promise<unknown> },
  source: Values,
  options?: ValidateOption,
): Promise<{ cbErrors: Normalized['errors']; cbFields: Normalized['fields']; rejected: boolean }> {
  let cbErrors: Normalized['errors'] = null;
  let cbFields: Normalized['fields'] = null;
  let rejected = false;

  const cb = (errors: ValidateError[] | null, fields: unknown): void => {
    cbErrors = normalize(errors);
    cbFields = normalizeFields(fields as Record<string, ValidateError[]>);
  };

  const promise = options ? schema.validate(source, options, cb) : schema.validate(source, cb);

  await promise.catch(() => {
    rejected = true;
  });

  return { cbErrors, cbFields, rejected };
}

/**
 * 深拷贝，**保留函数 / RegExp / Date**。
 *
 * ⚠️ 不能用 `structuredClone` —— 它遇到函数会抛 `DataCloneError`，
 * 而我们的用例里 `transform` / `validator` / `asyncValidator` / `message` 都是函数。
 * 实测：换成 structuredClone 会让 7 个用例直接炸在克隆这一步（不是实现有问题）。
 *
 * 为什么要拷贝：`Schema.validate` 会**改写规则对象**（加 field/fullField/type/validator），
 * 还会把 `enum` 归一化成数组（`rules/index.ts` 的 `enumerable`）。
 * 两侧共用同一份规则对象会让第二次运行看到被改过的规则。
 */
function cloneDeep<T>(value: T): T {
  if (typeof value === 'function') {
    return value;
  }
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as T;
  }
  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => cloneDeep(v)) as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      out[key] = cloneDeep((value as Record<string, unknown>)[key]);
    }
    return out as T;
  }
  return value;
}

/** 两侧同时跑，断言完全一致。 */
async function expectSame(rules: Rules, source: Values, options?: ValidateOption): Promise<void> {
  const ours = new Schema(cloneDeep(rules));
  const theirs = new UpstreamSchema(cloneDeep(rules) as never);

  const a = await runSide(ours as never, cloneDeep(source), options);
  const b = await runSide(theirs as never, cloneDeep(source), options);

  expect(a).toEqual(b);
}

// ---------------------------------------------------------------------------
// 用例矩阵
// ---------------------------------------------------------------------------

/** 每个 `type` 各来一遍「通过 / 不通过」。 */
const TYPE_CASES: [string, unknown, unknown][] = [
  ['string', 'abc', 123],
  ['number', 42, 'abc'],
  ['boolean', true, 'yes'],
  ['method', () => {}, 'not-a-fn'],
  ['regexp', /abc/, 'not-regexp'],
  ['integer', 42, 4.2],
  ['float', 4.2, 42],
  ['array', [1, 2], 'not-array'],
  ['object', { a: 1 }, 'not-object'],
  ['enum', 'a', 'z'],
  ['date', new Date(0), 'not-a-date'],
  ['url', 'https://example.com', 'not a url'],
  ['hex', '#fff', 'zzz'],
  ['email', 'a@b.co', 'not-an-email'],
  ['tel', '+8613800138000', 'not-a-tel'],
  ['any', 1, 2],
];

describe('Oracle · 各 type 的通过 / 不通过', () => {
  for (const [type, good, bad] of TYPE_CASES) {
    it(`type: ${type}`, async () => {
      await expectSame({ f: { type: type as never } }, { f: good });
      await expectSame({ f: { type: type as never } }, { f: bad });
    });
  }
});

describe('Oracle · required 的各种边界', () => {
  const cases: [string, Values][] = [
    ['undefined', { f: undefined }],
    ['null', { f: null }],
    ['空串', { f: '' }],
    ['0', { f: 0 }],
    ['false', { f: false }],
    ['空数组', { f: [] }],
    ['空对象', { f: {} }],
    ['⭐ 键不存在', {}],
  ];

  for (const [name, source] of cases) {
    it(`required + ${name}`, async () => {
      await expectSame({ f: { required: true } }, source);
      await expectSame({ f: { required: true, type: 'string' } }, source);
      await expectSame({ f: { required: true, type: 'number' } }, source);
      await expectSame({ f: { required: true, type: 'array' } }, source);
    });
  }

  it('⭐ required 用的是 **truthy** 判断（required: 1 也生效）', async () => {
    // 变异验证发现：把 `Boolean(rule.required)` 改成 `rule.required === true` 时，
    // 全部 152 个用例仍然通过 —— 说明这条没被覆盖。上游是 truthy 判断
    // （`rule.required || (!rule.required && ...)`），必须钉住。
    await expectSame({ f: { required: 1 as never } }, {});
    await expectSame({ f: { required: 1 as never, type: 'string' } }, {});
    await expectSame({ f: { required: 'yes' as never } }, {});
  });

  it('非必填 + 各种空值（应全部通过）', async () => {
    for (const [, source] of cases) {
      await expectSame({ f: { type: 'string' } }, source);
      await expectSame({ f: { type: 'number' } }, source);
    }
  });
});

describe('Oracle · range（len / min / max / 组合）', () => {
  const rules: [string, Record<string, unknown>][] = [
    ['len', { len: 3 }],
    ['min', { min: 3 }],
    ['max', { max: 3 }],
    ['min+max', { min: 2, max: 4 }],
  ];
  const values: unknown[] = [
    'a',
    'abc',
    'abcd',
    'abcde',
    1,
    3,
    5,
    [1],
    [1, 2, 3],
    [1, 2, 3, 4, 5],
    true,
    null,
    undefined,
    { a: 1 },
    // ⭐ 补充平面：'𠮷𠮷𠮷' 的 .length 是 6，但应按 3 个字符算
    '𠮷𠮷𠮷',
    '𠮷𠮷',
  ];

  for (const [name, rule] of rules) {
    it(`range ${name} × ${values.length} 个值`, async () => {
      for (const value of values) {
        await expectSame({ f: rule as never }, { f: value });
      }
    });
  }
});

describe('Oracle · pattern / whitespace / enum', () => {
  it('pattern 的 RegExp 与字符串两种形态', async () => {
    await expectSame({ f: { pattern: /^a+$/ } }, { f: 'aaa' });
    await expectSame({ f: { pattern: /^a+$/ } }, { f: 'bbb' });
    await expectSame({ f: { pattern: '^a+$' } }, { f: 'aaa' });
    await expectSame({ f: { pattern: '^a+$' } }, { f: 'bbb' });
    // ⭐ 带 g 标志的正则（会暴露 lastIndex 未重置的缺陷）
    await expectSame({ f: { pattern: /a/g } }, { f: 'aaa' });
    await expectSame({ f: { pattern: /a/g } }, { f: 'aaa' });
  });

  it('pattern 单独出现时 type 被推成 pattern', async () => {
    await expectSame({ f: { pattern: /^a+$/ } }, { f: 'aaa' });
  });

  it('whitespace', async () => {
    await expectSame({ f: { type: 'string', whitespace: true } }, { f: '   ' });
    await expectSame({ f: { type: 'string', whitespace: true } }, { f: '' });
    await expectSame({ f: { type: 'string', whitespace: true } }, { f: 'a' });
    // whitespace 不是 true 时不检查
    await expectSame({ f: { type: 'string', whitespace: false } }, { f: '   ' });
    await expectSame({ f: { type: 'string' } }, { f: '   ' });
  });

  it('enum', async () => {
    await expectSame({ f: { enum: ['a', 'b'] } }, { f: 'a' });
    await expectSame({ f: { enum: ['a', 'b'] } }, { f: 'z' });
    await expectSame({ f: { enum: [] } }, { f: 'a' });
    await expectSame({ f: { type: 'enum', enum: [1, 2] } }, { f: 2 });
  });
});

describe('Oracle · message 覆盖', () => {
  it('自定义 message 覆盖校验器产出的消息', async () => {
    await expectSame({ f: { required: true, message: '自定义必填' } }, {});
    await expectSame({ f: { type: 'string', message: '必须是字符串' } }, { f: 1 });
    await expectSame({ f: { type: 'string', min: 5, message: '太短' } }, { f: 'ab' });
  });

  it('message 为函数', async () => {
    await expectSame({ f: { required: true, message: () => '函数式消息' } }, {});
  });

  it('validateMessages 局部覆盖（options.messages）', async () => {
    await expectSame({ f: { required: true } }, {}, { messages: { required: '请填写 %s' } });
    await expectSame(
      { f: { type: 'string', min: 5 } },
      { f: 'ab' },
      { messages: { string: { min: '至少 %s 个字符' } } },
    );
  });
});

describe('Oracle · 多条规则 / 多字段', () => {
  it('同一字段多条规则', async () => {
    await expectSame(
      { f: [{ required: true }, { type: 'string', min: 3 }, { pattern: /^a/ }] },
      { f: 'ab' },
    );
    await expectSame(
      { f: [{ required: true }, { type: 'string', min: 3 }, { pattern: /^a/ }] },
      { f: 'bbb' },
    );
    await expectSame({ f: [{ required: true }, { type: 'string', min: 3 }] }, {});
  });

  it('多字段并行', async () => {
    await expectSame(
      { a: { required: true }, b: { type: 'number' }, c: { type: 'string', min: 2 } },
      { b: 'x', c: 'y' },
    );
  });
});

describe('Oracle · first / firstFields', () => {
  it('first: 遇第一个错误即停', async () => {
    await expectSame(
      { a: { required: true }, b: { required: true }, c: { required: true } },
      {},
      { first: true },
    );
    await expectSame({ f: [{ required: true }, { type: 'string', min: 5 }] }, {}, { first: true });
  });

  it('firstFields: 列出的字段串行、其余并行', async () => {
    await expectSame(
      { a: [{ required: true }, { type: 'string', min: 5 }], b: { required: true } },
      {},
      { firstFields: ['a'] },
    );
    await expectSame(
      { a: [{ required: true }, { type: 'string', min: 5 }], b: { required: true } },
      {},
      { firstFields: true },
    );
  });

  it('keys: 只校验列出的字段', async () => {
    await expectSame({ a: { required: true }, b: { required: true } }, {}, { keys: ['a'] });
  });
});

describe('Oracle · transform', () => {
  it('transform 改写值并推断 type', async () => {
    await expectSame({ f: { transform: (v: unknown) => String(v) } }, { f: 123 });
    await expectSame({ f: { transform: (v: unknown) => String(v), min: 5 } }, { f: 123 });
    await expectSame(
      { f: { transform: (v: unknown) => (Array.isArray(v) ? v : [v]), type: 'array', min: 2 } },
      { f: 'x' },
    );
  });

  it('transform 不影响原始入参对象', async () => {
    const source = { f: 1 };
    const schema = new Schema({ f: { transform: (v: unknown) => String(v) } });
    await schema.validate(source, () => {});
    // ⭐ 我们的实现与上游一样会浅拷贝后再写
    expect(source.f).toBe(1);
  });
});

describe('Oracle · 自定义 validator', () => {
  it('返回 true / false / 数组 / Error', async () => {
    await expectSame({ f: { validator: () => true } }, { f: 1 });
    await expectSame({ f: { validator: () => false } }, { f: 1 });
    await expectSame({ f: { validator: () => ['e1', 'e2'] } }, { f: 1 });
    await expectSame({ f: { validator: () => new Error('boom') } }, { f: 1 });
  });

  it('返回 false 且带 message', async () => {
    await expectSame({ f: { validator: () => false, message: '自定义失败' } }, { f: 1 });
  });

  it('通过 callback 报错', async () => {
    await expectSame(
      {
        f: {
          validator: (_r: unknown, _v: unknown, cb: (e?: string) => void) => {
            cb('cb 错误');
          },
        },
      },
      { f: 1 },
    );
  });

  it('asyncValidator 返回 Promise', async () => {
    await expectSame(
      {
        f: {
          asyncValidator: () => Promise.reject(new Error('异步失败')),
        },
      },
      { f: 1 },
    );
    await expectSame(
      {
        f: {
          asyncValidator: () => Promise.resolve(),
        },
      },
      { f: 1 },
    );
  });
});

describe('Oracle · 嵌套 fields / defaultField', () => {
  it('fields：对象嵌套', async () => {
    await expectSame(
      {
        user: {
          type: 'object',
          required: true,
          fields: {
            name: { type: 'string', required: true },
            age: { type: 'number', min: 18 },
          },
        },
      },
      { user: { name: 'a', age: 10 } },
    );
    await expectSame(
      {
        user: {
          type: 'object',
          required: true,
          fields: { name: { type: 'string', required: true } },
        },
      },
      { user: {} },
    );
  });

  it('defaultField：数组元素', async () => {
    await expectSame(
      { list: { type: 'array', defaultField: { type: 'string', required: true } } },
      { list: ['a', '', 'c'] },
    );
  });

  it('required 且值为空 ⇒ 不再往下递归', async () => {
    await expectSame(
      {
        user: {
          type: 'object',
          required: true,
          fields: { name: { type: 'string', required: true } },
        },
      },
      {},
    );
  });
});

describe('Oracle · 边界与异常', () => {
  it('空规则 ⇒ 直接通过', async () => {
    await expectSame({}, { f: 1 });
  });

  it('未知 type ⇒ 两侧都抛', () => {
    expect(() => new Schema({ f: { type: 'nope' as never } }).validate({ f: 1 })).toThrow();
    expect(() => new UpstreamSchema({ f: { type: 'nope' } } as never).validate({ f: 1 })).toThrow();
  });

  it('define 的三种非法输入', () => {
    expect(() => new Schema(undefined as never)).toThrow('Cannot configure a schema with no rules');
    expect(() => new Schema([] as never)).toThrow('Rules must be an object');
  });

  it('只有 required 一个键 ⇒ 不做类型检查', async () => {
    await expectSame({ f: { required: true } }, { f: 123 });
  });

  it('source 上有值但规则只声明 type', async () => {
    await expectSame({ f: { type: 'string' } }, { f: 'abc' });
    await expectSame({ f: { type: 'string' } }, { f: 123 });
  });
});
