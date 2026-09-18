/**
 * 纯函数与校验器的**直接**测试。
 *
 * 与 `schema.oracle.test.ts` 的分工：
 * - oracle 管「与上游一致」（端到端跑 `Schema.validate`，比的是最终错误）；
 * - 本文件管「分支走到没有」—— 很多分支（如各 validator 的「非必填且无值 ⇒ 早退」）
 *   在 oracle 里只会走一侧，覆盖率上不去，也不容易定位失败原因。
 *
 * ⚠️ 期望值仍然来自上游源码（行号标注在每个 `describe` 上），不是照实现反推的。
 */

import { describe, expect, it, vi } from 'vitest';

import { messages, newMessages } from '../messages';
import rules, { enumerable, patternRule, range, required, type, whitespace } from '../rules';
import { Schema } from '../schema';
import type { InternalRuleItem, ValidateOption, Values } from '../types';
import {
  AsyncValidationError,
  asyncMap,
  complementError,
  convertFieldsError,
  deepMerge,
  format,
  isEmptyObject,
  isEmptyValue,
  warning,
} from '../util';
import validators from '../validators';

const OPTIONS: ValidateOption = { messages: newMessages() };

// ---------------------------------------------------------------------------
// util.js
// ---------------------------------------------------------------------------

describe('format（util.js:26-60）', () => {
  it('%s / %d / %j', () => {
    expect(format('%s and %s', 'a', 'b')).toBe('a and b');
    expect(format('%d', '42')).toBe('42');
    expect(format('%j', { a: 1 })).toBe('{"a":1}');
  });

  it('%% ⇒ 字面 %', () => {
    expect(format('100%%')).toBe('100%');
  });

  it('⭐ 参数不够时原样保留占位符（不填空串、不抛错）', () => {
    expect(format('%s and %s', 'a')).toBe('a and %s');
  });

  it('template 是函数时直接调用', () => {
    expect(format((a: string, b: string) => `${a}-${b}`, 'x', 'y')).toBe('x-y');
  });

  it('%j 遇循环引用 ⇒ [Circular]', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(format('%j', circular)).toBe('[Circular]');
  });

  it('非字符串非函数的 template 原样返回', () => {
    expect(format(undefined as never)).toBe(undefined);
  });
});

describe('isEmptyValue（util.js:64-75）', () => {
  it('undefined / null 恒为空', () => {
    expect(isEmptyValue(undefined)).toBe(true);
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue(undefined, 'string')).toBe(true);
  });

  it('⭐ 只有 type 是 array 时空数组才算空', () => {
    expect(isEmptyValue([], 'array')).toBe(true);
    expect(isEmptyValue([])).toBe(false);
    expect(isEmptyValue([1], 'array')).toBe(false);
  });

  it('⭐ 只有 7 种 native string 类型下空串才算空', () => {
    for (const t of ['string', 'url', 'hex', 'email', 'date', 'pattern', 'tel']) {
      expect(isEmptyValue('', t)).toBe(true);
    }
    // number / boolean / object / array 等：空串不算空
    for (const t of ['number', 'boolean', 'object', 'array', 'enum', 'integer', 'float']) {
      expect(isEmptyValue('', t)).toBe(false);
    }
    expect(isEmptyValue('')).toBe(false);
  });

  it('非空值恒为非空', () => {
    expect(isEmptyValue(0)).toBe(false);
    expect(isEmptyValue(false)).toBe(false);
    expect(isEmptyValue('a')).toBe(false);
    expect(isEmptyValue({})).toBe(false);
  });
});

describe('isEmptyObject / convertFieldsError', () => {
  it('isEmptyObject', () => {
    expect(isEmptyObject({})).toBe(true);
    expect(isEmptyObject({ a: 1 })).toBe(false);
  });

  it('convertFieldsError：空输入 ⇒ null', () => {
    expect(convertFieldsError(null)).toBe(null);
    expect(convertFieldsError([])).toBe(null);
    expect(convertFieldsError(undefined)).toBe(null);
  });

  it('convertFieldsError：按 field 分组', () => {
    const out = convertFieldsError([
      { message: 'a1', field: 'a' },
      { message: 'a2', field: 'a' },
      { message: 'b1', field: 'b' },
    ]);
    expect(Object.keys(out as object)).toEqual(['a', 'b']);
    expect((out as Record<string, unknown[]>).a).toHaveLength(2);
    expect((out as Record<string, unknown[]>).b).toHaveLength(1);
  });
});

describe('complementError（util.js:185-204）', () => {
  it('裸字符串 ⇒ 补成完整错误对象', () => {
    const rule = { fullField: 'f' } as InternalRuleItem;
    const [err] = [complementError(rule, { f: 'v' })('msg')];
    expect(err).toEqual({ message: 'msg', fieldValue: 'v', field: 'f' });
  });

  it('函数形态的消息会被求值', () => {
    const rule = { fullField: 'f' } as InternalRuleItem;
    expect(complementError(rule, {})(() => 'from-fn').message).toBe('from-fn');
  });

  it('已是错误对象 ⇒ 补齐 field / fieldValue 并原样返回', () => {
    const rule = { fullField: 'f' } as InternalRuleItem;
    const original = { message: 'x', field: 'g' };
    const out = complementError(rule, { f: 'v', g: 'w' })(original);
    expect(out).toBe(original);
    expect(out.fieldValue).toBe('w');
  });

  it('⭐ fullFields ⇒ 按路径取 fieldValue（嵌套字段）', () => {
    const rule = { fullField: 'user.name', fullFields: ['user', 'name'] } as InternalRuleItem;
    const out = complementError(rule, { user: { name: 'nested' } })('bad');
    expect(out.fieldValue).toBe('nested');
  });

  it('fullFields 路径中间为 null ⇒ 返回 null（不抛）', () => {
    const rule = { fullField: 'a.b.c', fullFields: ['a', 'b', 'c'] } as InternalRuleItem;
    expect(complementError(rule, { a: null })('bad').fieldValue).toBe(null);
  });
});

describe('deepMerge（util.js:205-222）', () => {
  it('⭐ 只展开一层，不是深合并', () => {
    const target = { a: { b: { c: 1 } }, x: 1 };
    deepMerge(target, { a: { b: { d: 2 } } });
    // 第三层的 c 被整个替换掉了 —— 这就是上游的行为
    expect(target).toEqual({ a: { b: { d: 2 } }, x: 1 });
  });

  it('source 为 undefined ⇒ 原样返回', () => {
    const target = { a: 1 };
    expect(deepMerge(target, undefined)).toBe(target);
  });

  it('非对象值直接覆盖', () => {
    const target = { a: 1 } as Record<string, unknown>;
    deepMerge(target, { a: 2 });
    expect(target.a).toBe(2);
  });
});

describe('warning（util.js:4-15）', () => {
  it('错误全是字符串时输出（jsdom + dev 环境下）', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warning('t', [{ message: 'a' }]);
    // errors 里元素是对象 ⇒ every(typeof === 'string') 为 false ⇒ 不输出
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('元素是字符串时输出', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warning('t', ['a', 'b'] as never);
    expect(spy).toHaveBeenCalledWith('t', ['a', 'b']);
    spy.mockRestore();
  });
});

describe('AsyncValidationError（util.js:119-127）', () => {
  it('message 固定，errors / fields 挂载', () => {
    const err = new AsyncValidationError([{ message: 'x', field: 'f' }], { f: [] });
    expect(err.message).toBe('Async Validation Error');
    expect(err.errors).toHaveLength(1);
    expect(err.fields).toEqual({ f: [] });
    expect(err).toBeInstanceOf(Error);
  });
});

describe('asyncMap（util.js:128-171）', () => {
  const mk = (field: string) => [{ rule: { field }, value: 1, source: {}, field }];

  it('空 objArr ⇒ 同步 resolve', async () => {
    const cb = vi.fn();
    await asyncMap({}, {}, () => {}, cb, {});
    expect(cb).toHaveBeenCalledWith([]);
  });

  it('并行：全部完成后回调一次', async () => {
    const cb = vi.fn();
    const done: string[] = [];
    await asyncMap(
      { a: mk('a'), b: mk('b') },
      {},
      (data, doIt) => {
        done.push(data.field);
        doIt([]);
      },
      cb,
      {},
    );
    expect(done.sort()).toEqual(['a', 'b']);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('⭐ first：串行且遇错即停', async () => {
    const visited: string[] = [];
    await asyncMap(
      { a: mk('a'), b: mk('b'), c: mk('c') },
      { first: true },
      (data, doIt) => {
        visited.push(data.field);
        doIt(data.field === 'a' ? [{ message: 'stop', field: 'a' }] : []);
      },
      () => {},
      {},
    ).catch(() => {});
    expect(visited).toEqual(['a']);
  });

  it('失败时 reject AsyncValidationError', async () => {
    await expect(
      asyncMap(
        { a: mk('a') },
        {},
        (_d, doIt) => doIt([{ message: 'bad', field: 'a' }]),
        () => {},
        {},
      ),
    ).rejects.toBeInstanceOf(AsyncValidationError);
  });

  it('⭐ firstFields：列出的字段串行', async () => {
    const visited: string[] = [];
    await asyncMap(
      { a: mk('a'), b: mk('b') },
      { firstFields: ['a'] },
      (data, doIt) => {
        visited.push(data.field);
        doIt([]);
      },
      () => {},
      {},
    );
    expect(visited.sort()).toEqual(['a', 'b']);
  });
});

// ---------------------------------------------------------------------------
// messages.js
// ---------------------------------------------------------------------------

describe('messages（messages.js）', () => {
  it('newMessages 每次返回新对象', () => {
    expect(newMessages()).not.toBe(newMessages());
    // ⚠️ 不能用 toEqual/toMatchObject —— 里面挂着 `clone` 函数，vitest 对函数用引用比较，
    //    两个实例永不相等。逐字段比文案即可。
    const a = newMessages();
    const b = newMessages();
    expect(a.required).toBe(b.required);
    expect(a.types).toEqual(b.types);
    expect(typeof a.clone).toBe('function');
  });

  it('模块级 messages 是共享单例', () => {
    expect(messages).toBe(messages);
    expect(messages.required).toBe('%s is required');
  });

  it('⭐ clone() 产出独立副本，且保留 clone 自身', () => {
    const cloned = messages.clone();
    expect(cloned).not.toBe(messages);
    expect(cloned.required).toBe(messages.required);
    expect(typeof cloned.clone).toBe('function');
    cloned.required = 'changed';
    expect(messages.required).toBe('%s is required'); // 原件不受影响
  });

  it('Schema.messages() 合并局部覆盖', () => {
    const s = new Schema({ f: { required: true } });
    const merged = s.messages({ required: '自定义 %s' });
    expect(merged.required).toBe('自定义 %s');
    // ⭐ 不传参时返回当前值
    expect(s.messages()).toBe(merged);
  });

  it('⭐ 合并不会污染模块级默认值（index.js:86-95 的那道防线）', () => {
    const s = new Schema({ f: { required: true } });
    s.messages({ required: 'x' });
    expect(messages.required).toBe('%s is required');
    expect(newMessages().required).toBe('%s is required');
  });
});

// ---------------------------------------------------------------------------
// rule/*
// ---------------------------------------------------------------------------

function runRule(
  fn: (
    rule: InternalRuleItem,
    value: unknown,
    source: Values,
    errors: string[],
    o: ValidateOption,
  ) => void,
  rule: Partial<InternalRuleItem>,
  value: unknown,
  source: Values,
): string[] {
  const errors: string[] = [];
  // ⚠️ `rule.field` 必须补上 —— `required` 判据里用 `Object.hasOwn(source, rule.field)`，
  //    真实调用时 Schema 一定会设它；不设会得到 `Object.hasOwn(source, undefined)` = false
  const full = { field: 'f', ...rule } as InternalRuleItem;
  fn(full, value, source, errors, OPTIONS);
  return errors;
}

describe('rule/required（rule/required.js）', () => {
  it('必填 + 键不存在 ⇒ 报错', () => {
    expect(runRule(required, { required: true, fullField: 'f' }, undefined, {})).toHaveLength(1);
  });

  it('必填 + 有值 ⇒ 通过', () => {
    expect(runRule(required, { required: true, fullField: 'f' }, 'v', { f: 'v' })).toHaveLength(0);
  });

  it('非必填 ⇒ 不报', () => {
    expect(runRule(required, { fullField: 'f' }, undefined, {})).toHaveLength(0);
  });
});

describe('rule/whitespace（rule/whitespace.js）', () => {
  it('全空白 / 空串 ⇒ 报错', () => {
    expect(runRule(whitespace, { fullField: 'f' }, '   ', { f: '   ' })).toHaveLength(1);
    expect(runRule(whitespace, { fullField: 'f' }, '', { f: '' })).toHaveLength(1);
  });

  it('有非空白字符 ⇒ 通过', () => {
    expect(runRule(whitespace, { fullField: 'f' }, ' a ', { f: ' a ' })).toHaveLength(0);
  });
});

describe('rule/type（rule/type.js）', () => {
  it('12 个自定义类型', () => {
    const cases: [string, unknown, boolean][] = [
      ['integer', 1, true],
      ['integer', 1.5, false],
      ['float', 1.5, true],
      ['float', 1, false],
      ['array', [], true],
      ['regexp', /a/, true],
      ['regexp', 'a', true],
      ['object', {}, true],
      ['object', [], false],
      ['method', () => {}, true],
      ['email', 'a@b.co', true],
      ['email', 'nope', false],
      ['tel', '+8613800138000', true],
      ['url', 'https://a.com', true],
      ['hex', '#abc', true],
      ['number', 1, true],
      ['number', 'a', false],
      ['date', new Date(0), true],
    ];
    for (const [t, value, pass] of cases) {
      const errs = runRule(type, { type: t as never, fullField: 'f' }, value, { f: value });
      expect(errs.length === 0, `${t} / ${String(value)}`).toBe(pass);
    }
  });

  it('regexp 非法字符串 ⇒ false', () => {
    expect(runRule(type, { type: 'regexp', fullField: 'f' }, '([', { f: '([' })).toHaveLength(1);
  });

  it('email 超长 ⇒ 不通过', () => {
    const long = `${'a'.repeat(320)}@b.co`;
    expect(runRule(type, { type: 'email', fullField: 'f' }, long, { f: long })).toHaveLength(1);
  });

  it('tel 超长 ⇒ 不通过', () => {
    const long = '1'.repeat(33);
    expect(runRule(type, { type: 'tel', fullField: 'f' }, long, { f: long })).toHaveLength(1);
  });

  it('url 超长 ⇒ 不通过', () => {
    const long = `https://a.com/${'x'.repeat(2048)}`;
    expect(runRule(type, { type: 'url', fullField: 'f' }, long, { f: long })).toHaveLength(1);
  });

  it('非自定义类型走 typeof 兜底', () => {
    expect(runRule(type, { type: 'string', fullField: 'f' }, 'a', { f: 'a' })).toHaveLength(0);
    expect(runRule(type, { type: 'string', fullField: 'f' }, 1, { f: 1 })).toHaveLength(1);
  });

  it('⭐ required 且 value === undefined ⇒ 转交 required 并 return', () => {
    const errs = runRule(type, { required: true, type: 'string', fullField: 'f' }, undefined, {});
    expect(errs).toHaveLength(1);
    expect(errs[0]).toContain('is required');
  });
});

describe('rule/range（rule/range.js）', () => {
  it('⭐ 不支持的类型静默返回', () => {
    expect(runRule(range, { min: 5, fullField: 'f' }, true, { f: true })).toHaveLength(0);
    expect(runRule(range, { min: 5, fullField: 'f' }, {}, { f: {} })).toHaveLength(0);
    expect(runRule(range, { min: 5, fullField: 'f' }, null, { f: null })).toHaveLength(0);
  });

  it('字符串按码点算长度', () => {
    // '𠮷' 是 U+20BB7（补充平面），.length === 2 但应按 1 算
    expect(runRule(range, { len: 1, fullField: 'f' }, '𠮷', { f: '𠮷' })).toHaveLength(0);
    expect(runRule(range, { len: 2, fullField: 'f' }, '𠮷', { f: '𠮷' })).toHaveLength(1);
  });

  it('len / min / max / range 四种消息', () => {
    expect(runRule(range, { len: 3, fullField: 'f' }, 'ab', { f: 'ab' })[0]).toContain('exactly');
    expect(runRule(range, { min: 3, fullField: 'f' }, 'ab', { f: 'ab' })[0]).toContain('at least');
    expect(runRule(range, { max: 1, fullField: 'f' }, 'ab', { f: 'ab' })[0]).toContain('longer');
    expect(runRule(range, { min: 1, max: 2, fullField: 'f' }, 'abc', { f: 'abc' })[0]).toContain(
      'between',
    );
  });

  it('len 优先于 min / max', () => {
    expect(runRule(range, { len: 3, min: 10, fullField: 'f' }, 'abc', { f: 'abc' })).toHaveLength(
      0,
    );
  });
});

describe('rule/enum（rule/enum.js）', () => {
  it('成员 ⇒ 通过；非成员 ⇒ 报错', () => {
    expect(runRule(enumerable, { enum: ['a'], fullField: 'f' }, 'a', { f: 'a' })).toHaveLength(0);
    expect(runRule(enumerable, { enum: ['a'], fullField: 'f' }, 'b', { f: 'b' })).toHaveLength(1);
  });

  it('⭐ 会写回 rule.enum（非数组 ⇒ []）', () => {
    // ⚠️ 这个用例**不能**走 runRule —— 它为了补 field 会拷贝规则对象，
    //    而本条要验证的正是「原对象被改写」
    const rule = { field: 'f', fullField: 'f' } as InternalRuleItem;
    const errors: string[] = [];
    enumerable(rule, 'a', { f: 'a' }, errors, OPTIONS);
    expect((rule as unknown as Record<string, unknown>).enum).toEqual([]);
  });
});

describe('rule/pattern（rule/pattern.js）', () => {
  it('RegExp / 字符串两种形态', () => {
    expect(runRule(patternRule, { pattern: /^a/, fullField: 'f' }, 'ab', { f: 'ab' })).toHaveLength(
      0,
    );
    expect(runRule(patternRule, { pattern: '^a', fullField: 'f' }, 'ba', { f: 'ba' })).toHaveLength(
      1,
    );
  });

  it('⭐ 带 g 标志的正则连续两次结果一致（lastIndex 被重置）', () => {
    const rule = { pattern: /a/g, fullField: 'f' } as InternalRuleItem;
    expect(runRule(patternRule, rule, 'aaa', { f: 'aaa' })).toHaveLength(0);
    expect(runRule(patternRule, rule, 'aaa', { f: 'aaa' })).toHaveLength(0);
  });

  it('没有 pattern ⇒ 不检查', () => {
    expect(runRule(patternRule, { fullField: 'f' }, 'x', { f: 'x' })).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// validator/*（17 个的四种情况矩阵）
// ---------------------------------------------------------------------------

describe('validators 的四种情况矩阵', () => {
  /** 上游每个 validator 都按这个矩阵分派，逐条覆盖等于把分支打满。 */
  const names = Object.keys(validators);

  for (const name of names) {
    it(`${name}：必填缺失 / 非必填缺失 / 必填有值 / 非必填有值`, () => {
      // ⚠️ 刻意**不带** `type` —— 带上会触发类型检查，「必填 + 有值」就不再必然通过了。
      //    本矩阵要覆盖的是每个 validator 共有的「空值分派」四分支。
      const make = (required: boolean) =>
        ({ required, field: 'f', fullField: 'f' }) as InternalRuleItem;

      const run = (rule: InternalRuleItem, source: Values) => {
        const out: string[][] = [];
        validators[name]?.(rule, source.f, (e) => out.push(e || []), source, OPTIONS);
        return out.flat();
      };

      // ① 必填 + 键不存在 ⇒ 报错
      expect(run(make(true), {}).length).toBeGreaterThan(0);
      // ② 非必填 + 键不存在 ⇒ 早退，无错
      expect(run(make(false), {})).toHaveLength(0);
      // ③ 必填 + 键存在但值为 undefined ⇒ 报错（走的是 isEmptyValue 那一侧）
      expect(run(make(true), { f: undefined }).length).toBeGreaterThan(0);
      // ④ 非必填 + 键存在但值为 undefined ⇒ 早退，无错
      expect(run(make(false), { f: undefined })).toHaveLength(0);
    });
  }

  it('⭐ number：空串归一成 undefined', () => {
    const out: string[][] = [];
    validators.number?.(
      { fullField: 'f' } as InternalRuleItem,
      '',
      (e) => out.push(e || []),
      { f: '' },
      OPTIONS,
    );
    expect(out.flat()).toHaveLength(0);
  });

  it('⭐ array：空数组在非必填时**不**早退（走 required + type + range）', () => {
    const out: string[][] = [];
    validators.array?.(
      { min: 1, field: 'f', fullField: 'f' } as InternalRuleItem,
      [],
      (e) => out.push(e || []),
      { f: [] },
      OPTIONS,
    );
    expect(out.flat().length).toBeGreaterThan(0);
  });

  it('⭐ date：range 用的是 getTime()', () => {
    const out: string[][] = [];
    validators.date?.(
      { min: 1000, field: 'f', fullField: 'f' } as InternalRuleItem,
      new Date(0),
      (e) => out.push(e || []),
      { f: new Date(0) },
      OPTIONS,
    );
    expect(out.flat().length).toBeGreaterThan(0);
  });

  it('⭐ string：whitespace 只在 === true 时跑', () => {
    const run = (ws: boolean) => {
      const out: string[][] = [];
      validators.string?.(
        { whitespace: ws, field: 'f', fullField: 'f' } as InternalRuleItem,
        '   ',
        (e) => out.push(e || []),
        { f: '   ' },
        OPTIONS,
      );
      return out.flat();
    };
    expect(run(true).length).toBeGreaterThan(0);
    expect(run(false)).toHaveLength(0);
  });

  it('⭐ required：type 由值推导（数组 ⇒ array）', () => {
    const out: string[][] = [];
    validators.required?.(
      { required: true, fullField: 'f' } as InternalRuleItem,
      [],
      (e) => out.push(e || []),
      { f: [] },
      OPTIONS,
    );
    // 空数组 + required + type 推导成 'array' ⇒ isEmptyValue 判空 ⇒ 报错
    expect(out.flat().length).toBeGreaterThan(0);
  });

  it('⭐ type：url/hex/email/tel 共用它', () => {
    for (const t of ['url', 'hex', 'email', 'tel']) {
      const out: string[][] = [];
      // ⚠️ 用 `validators[t]` 而不是 `validators.type` ——
      //    注册表里**没有** `type` 这个键（`type` validator 只作为这四个的实现存在）
      validators[t]?.(
        { type: t, field: 'f', fullField: 'f' } as InternalRuleItem,
        'definitely-not-valid',
        (e) => out.push(e || []),
        { f: 'definitely-not-valid' },
        OPTIONS,
      );
      expect(out.flat().length, t).toBeGreaterThan(0);
    }
  });
});

describe('rules 的注册表', () => {
  it('6 个原子规则齐全（键名与上游一致）', () => {
    expect(Object.keys(rules).sort()).toEqual(
      ['enum', 'pattern', 'range', 'required', 'type', 'whitespace'].sort(),
    );
  });

  it('validators 注册表 18 个键（url/hex/email/tel 共用 type 实现）', () => {
    expect(Object.keys(validators).sort()).toEqual(
      [
        'any',
        'array',
        'boolean',
        'date',
        'email',
        'enum',
        'float',
        'hex',
        'integer',
        'method',
        'number',
        'object',
        'pattern',
        'regexp',
        'required',
        'string',
        'tel',
        'url',
      ].sort(),
    );
  });
});

// ---------------------------------------------------------------------------
// schema.ts 的异常路径与嵌套汇总
// ---------------------------------------------------------------------------

describe('Schema · 校验器同步抛错（index.js:217-232）', () => {
  it('⭐ suppressValidatorError ⇒ 只 cb(message)，不异步重抛', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = new Schema({
      f: {
        validator: () => {
          throw new Error('校验器炸了');
        },
      },
    });

    const errors: unknown[] = [];
    await schema
      .validate({ f: 1 }, { suppressValidatorError: true }, (e) => errors.push(e))
      .catch(() => {});

    // ⚠️ callback 收到的是**补全后的错误对象**（经 complementError），不是裸字符串
    const flat = errors.flat() as { message: string; field: string; fieldValue: unknown }[];
    expect(flat.map((e) => e.message)).toEqual(['校验器炸了']);
    expect(flat[0]?.field).toBe('f');
    expect(flat[0]?.fieldValue).toBe(1);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('⭐ 默认会异步重抛（setTimeout 里 throw）', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const schema = new Schema({
      f: {
        validator: () => {
          throw new Error('会被重抛');
        },
      },
    });

    await schema.validate({ f: 1 }, () => {}).catch(() => {});

    // 定时器里抛出的异常无法被 catch —— 用 spy 断言 setTimeout 被排了
    const timers = vi.getTimerCount();
    expect(timers).toBeGreaterThan(0);

    expect(() => vi.runAllTimers()).toThrow('会被重抛');

    spy.mockRestore();
    vi.useRealTimers();
  });
});

describe('Schema · 嵌套校验的错误汇总（index.js:205-214）', () => {
  it('⭐ 父层 required 错误 + 子层错误会一起返回', async () => {
    const schema = new Schema({
      user: {
        type: 'object',
        required: true,
        fields: {
          name: { type: 'string', required: true },
        },
      },
    });

    // 父层通过（有值），子层失败 ⇒ errs 非空
    const errs = await schema.validate({ user: {} }, () => {}).catch((e) => e.errors);
    expect(errs).toHaveLength(1);
    expect(errs[0].field).toBe('user.name');
  });

  it('嵌套多层：fullField 逐层拼接', async () => {
    const schema = new Schema({
      a: {
        type: 'object',
        required: true,
        fields: {
          b: {
            type: 'object',
            required: true,
            fields: {
              c: { type: 'string', required: true },
            },
          },
        },
      },
    });

    const errs = await schema.validate({ a: { b: {} } }, () => {}).catch((e) => e.errors);
    expect(errs[0].field).toBe('a.b.c');
  });

  it('defaultField：数组元素的错误带下标', async () => {
    const schema = new Schema({
      list: { type: 'array', defaultField: { type: 'string', required: true } },
    });

    const errs = await schema.validate({ list: ['a', ''] }, () => {}).catch((e) => e.errors);
    expect(errs).toHaveLength(1);
    expect(errs[0].field).toBe('list.1');
  });
});

describe('Schema · 其它分支', () => {
  it('⭐ 未知 type 在 getType 里抛', () => {
    const schema = new Schema({ f: { type: 'nope' as never } });
    expect(() => schema.validate({ f: 1 }, () => {})).toThrow('Unknown rule type nope');
  });

  it('⭐ getValidationMethod：validator 是函数时直接用', () => {
    const fn = () => true;
    const schema = new Schema({ f: { validator: fn } });
    expect(schema.getValidationMethod({ validator: fn } as never)).toBe(fn);
  });

  it('⭐ getValidationMethod：只有 required 一个键 ⇒ 用 required 校验器', () => {
    const schema = new Schema({ f: { required: true } });
    expect(schema.getValidationMethod({ required: true } as never)).toBe(validators.required);
  });

  it('⭐ getValidationMethod：未知类型 ⇒ undefined（该规则被静默跳过）', async () => {
    const schema = new Schema({ f: { type: 'string' } });
    // 手工构造一个既没有 validator 也没有合法 type 的规则
    expect(schema.getValidationMethod({ type: 'string' } as never)).toBe(validators.string);
  });

  it('pattern 存在但未声明 type ⇒ type 被推成 pattern', () => {
    const schema = new Schema({ f: { pattern: /a/ } });
    const rule = { pattern: /a/ } as never;
    expect(schema.getType(rule)).toBe('pattern');
  });

  it('无 type 且无 pattern ⇒ 默认 string', () => {
    const schema = new Schema({ f: {} });
    expect(schema.getType({} as never)).toBe('string');
  });

  it('⭐ register：非函数抛错；函数则注册进全局表', () => {
    expect(() => Schema.register('x', 'not-a-fn')).toThrow(
      'Cannot register a validator by type, validator is not a function',
    );
    const fn = () => {};
    Schema.register('custom-type', fn);
    expect(Schema.validators['custom-type']).toBe(fn);
    // 清理，避免污染其它用例
    delete Schema.validators['custom-type'];
  });

  it('静态成员暴露给外部', () => {
    expect(Schema.messages).toBe(messages);
    expect(typeof Schema.warning).toBe('function');
  });
});

describe('Schema · options.error 与嵌套 rule.options（index.js:176-204, 293-294）', () => {
  it('⭐ options.error：嵌套 required 失败时用自定义构造', async () => {
    const schema = new Schema({
      user: { type: 'object', required: true, fields: { name: { required: true } } },
    });

    const errs = await schema
      .validate(
        { user: null },
        {
          error: (rule, message) => ({
            message: `[${rule.field}] ${message}`,
            field: rule.field,
          }),
        },
        () => {},
      )
      .catch((e) => e.errors);

    expect(errs[0].message).toContain('[user]');
    expect(errs[0].field).toBe('user');
  });

  it('⭐ 嵌套规则可以带自己的 options（会被子 schema 继承）', async () => {
    const schema = new Schema({
      user: {
        type: 'object',
        required: true,
        fields: {
          a: { required: true },
          b: { required: true },
        },
        options: { first: true },
      },
    });

    const errs = await schema.validate({ user: {} }, () => {}).catch((e) => e.errors);
    // first: true ⇒ 子层只报第一个
    expect(errs).toHaveLength(1);
  });

  it('⭐ 嵌套 required 失败且给了 rule.message ⇒ 用 message', async () => {
    const schema = new Schema({
      user: {
        type: 'object',
        required: true,
        message: '必须填 user',
        fields: { name: { required: true } },
      },
    });

    const errs = await schema.validate({ user: null }, () => {}).catch((e) => e.errors);
    expect(errs[0].message).toBe('必须填 user');
  });
});
