import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import isEqual from '../is-equal';
import mergeProps from '../merge-props';
import get, { merge, mergeWith, set } from '../object';
import omit from '../omit';
import { resetWarned } from '../warning';

describe('omit', () => {
  it('删除指定键并返回浅拷贝', () => {
    const src = { a: 1, b: 2, c: 3 };
    const out = omit(src, ['b']);
    expect(out).toEqual({ a: 1, c: 3 });
    expect(out).not.toBe(src);
    expect(src).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('是浅拷贝：嵌套对象仍是同一引用', () => {
    const nested = { x: 1 };
    const src = { a: nested, b: 2 };
    const out = omit(src, ['b']);
    expect(out.a).toBe(nested);
  });

  it('fields 不是数组时只做浅拷贝，不删任何键', () => {
    const src = { a: 1, b: 2 };
    // 宽容入参：这一分支在 rc-util 里存在，必须保留。
    // 故意传非数组来走 `Array.isArray` 守卫 —— 签名上只能断言成 `never[]`
    // （K 推成 never ⇒ 返回 Omit<T, never> = T，正好对应"什么都没删"）。
    const out = omit(src, 'a' as unknown as never[]);
    expect(out).toEqual({ a: 1, b: 2 });
    expect(out).not.toBe(src);
  });

  it('空 fields 数组返回等值的新对象', () => {
    const src = { a: 1 };
    const out = omit(src, []);
    expect(out).toEqual(src);
    expect(out).not.toBe(src);
  });

  it('删除不存在的键不报错', () => {
    expect(omit({ a: 1 }, ['zzz' as 'a'])).toEqual({ a: 1 });
  });
});

describe('mergeProps', () => {
  it('从左到右覆盖', () => {
    expect(mergeProps({ a: 1, b: 1 }, { b: 2, c: 2 })).toEqual({ a: 1, b: 2, c: 2 });
  });

  it('★ 跳过值为 undefined 的键（与 Object.assign 的关键差异）', () => {
    const result = mergeProps({ a: 1 }, { a: undefined, b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
    // 对照：Object.assign 会用 undefined 覆盖
    expect(Object.assign({}, { a: 1 }, { a: undefined })).toEqual({ a: undefined });
  });

  it('null / 0 / "" / false 会覆盖（只有 undefined 被跳过）', () => {
    expect(mergeProps({ a: 1 }, { a: null })).toEqual({ a: null });
    expect(mergeProps({ a: 1 }, { a: 0 })).toEqual({ a: 0 });
    expect(mergeProps({ a: 1 }, { a: '' })).toEqual({ a: '' });
    expect(mergeProps({ a: 1 }, { a: false })).toEqual({ a: false });
  });

  it('跳过 falsy 的入参对象', () => {
    expect(mergeProps({ a: 1 }, null, undefined, { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it('支持 4 个重载以内的任意个数', () => {
    expect(mergeProps({ a: 1 }, { b: 2 }, { c: 3 }, { d: 4 })).toEqual({ a: 1, b: 2, c: 3, d: 4 });
  });

  it('只遍历自身可枚举字符串键（不含原型链）', () => {
    const withProto = Object.create({ inherited: 1 }) as Record<string, unknown>;
    withProto.own = 2;
    // ⚠️ 上游 mergeProps 的重载只有 2 / 3 / 4 参，**没有 1 参重载** —— 我们的声明与它逐字一致。
    //    运行时 `for...of items` 其实接受任意个数，但类型上不接受。所以这里补一个空对象。
    expect(mergeProps(withProto, {})).toEqual({ own: 2 });
  });
});

describe('isEqual', () => {
  beforeEach(() => resetWarned());
  afterEach(() => resetWarned());

  it('原始值', () => {
    expect(isEqual(1, 1)).toBe(true);
    expect(isEqual(1, 2)).toBe(false);
    expect(isEqual('a', 'a')).toBe(true);
    expect(isEqual(null, null)).toBe(true);
    expect(isEqual(undefined, undefined)).toBe(true);
  });

  it('NaN 不等于自身（走不到 a === b 分支）', () => {
    expect(isEqual(Number.NaN, Number.NaN)).toBe(false);
  });

  it('★ Date / RegExp / Map 结构相同判「相等」—— 因为它们没有自身可枚举键', () => {
    // 这不是笔误。`Object.keys(new Date(0))` 与 `Object.keys(/a/)` 都是 `[]`，
    // 于是「键数量相等 + 每键递归」的空遍历返回 true。
    // rc-util 的真实行为就是这样，必须保留（见 docs/foundation/rc-util-contract.md §6.2）。
    expect(isEqual(new Date(0), new Date(0))).toBe(true);
    expect(isEqual(/a/, /a/)).toBe(true);
    expect(isEqual(new Map([['a', 1]]), new Map())).toBe(true);
  });

  it('函数之间判不等（typeof 不是 object，落到最后的 false）', () => {
    const f = () => {};
    expect(isEqual(f, f)).toBe(true); // 同一引用走 a === b
    expect(
      isEqual(
        () => {},
        () => {},
      ),
    ).toBe(false);
  });

  it('数组：长度与逐项比较', () => {
    expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(isEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(isEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    expect(isEqual([1], { 0: 1 })).toBe(false);
  });

  it('对象：键数量与逐键比较', () => {
    expect(isEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
    expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('shallow 只比一层', () => {
    expect(isEqual({ a: { b: 1 } }, { a: { b: 1 } }, true)).toBe(false);
    expect(isEqual({ a: 1 }, { a: 1 }, true)).toBe(true);
  });

  it('★ 共享引用 quirk：同一个对象在一棵树里出现两次会被判不等', () => {
    // 这是 rc-util 的真实行为，必须保留（见 docs/foundation/rc-util-contract.md §6.2）。
    // 若"修正"成按路径追踪环，某些主题配置会从"不等"变成"相等"，
    // 从而少触发一次主题重算 —— 那是更难排查的问题。
    const shared = { x: 1 };
    expect(isEqual({ a: shared, b: shared }, { a: { x: 1 }, b: { x: 1 } })).toBe(false);
  });

  it('结构相同但对象不同的深层值判相等', () => {
    expect(isEqual({ a: { x: 1 }, b: { x: 1 } }, { a: { x: 1 }, b: { x: 1 } })).toBe(true);
  });

  it('检测到环时告警并返回 false', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const a: Record<string, unknown> = { name: 'a' };
    a.self = a;
    const b: Record<string, unknown> = { name: 'a' };
    b.self = b;

    expect(isEqual(a, b)).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith('Warning: Warning: There may be circular references');
    errorSpy.mockRestore();
  });
});

describe('get', () => {
  it('按路径逐级取值', () => {
    expect(get({ a: { b: { c: 1 } } }, ['a', 'b', 'c'])).toBe(1);
    expect(get({ a: [10, 20] }, ['a', 1])).toBe(20);
  });

  it('中途遇 null / undefined 返回 undefined，不抛错', () => {
    expect(get({ a: null }, ['a', 'b'])).toBeUndefined();
    expect(get(undefined, ['a'])).toBeUndefined();
    expect(get({}, ['missing', 'deeper'])).toBeUndefined();
  });

  it('空路径返回原对象', () => {
    const obj = { a: 1 };
    expect(get(obj, [])).toBe(obj);
  });
});

describe('set', () => {
  it('返回新对象，原对象不变', () => {
    const src = { a: { b: 1 } };
    const out = set(src, ['a', 'b'], 2);
    expect(out).toEqual({ a: { b: 2 } });
    expect(src).toEqual({ a: { b: 1 } });
    expect(out).not.toBe(src);
  });

  it('空路径整体替换', () => {
    expect(set({ a: 1 }, [], { b: 2 })).toEqual({ b: 2 });
  });

  it('数字路径在无父对象时创建数组', () => {
    expect(set(undefined, [0, 'x'], 1)).toEqual([{ x: 1 }]);
  });

  it('已有数组时保持数组类型', () => {
    expect(set({ list: [1, 2] }, ['list', 0], 9)).toEqual({ list: [9, 2] });
  });

  it('removeIfUndefined：写 undefined 等价于删除键', () => {
    expect(set({ a: { b: 1, c: 2 } }, ['a', 'b'], undefined, true)).toEqual({ a: { c: 2 } });
  });

  it('removeIfUndefined：父路径不存在时原样返回入参', () => {
    const src = { a: 1 };
    // 不凭空创建中间层级
    expect(set(src, ['missing', 'deep'], undefined, true)).toBe(src);
  });

  it('不传 removeIfUndefined 时写 undefined 会保留键', () => {
    expect(set({ a: { b: 1 } }, ['a', 'b'], undefined)).toEqual({ a: { b: undefined } });
  });
});

describe('merge / mergeWith', () => {
  it('递归合并纯对象', () => {
    expect(merge({ a: { x: 1 } }, { a: { y: 2 } })).toEqual({ a: { x: 1, y: 2 } });
  });

  it('★ 数组默认整体替换（不是逐项合并）', () => {
    expect(merge({ list: [1, 2, 3] }, { list: [9] })).toEqual({ list: [9] });
  });

  it('值覆盖', () => {
    expect(merge({ a: 1, b: 2 }, { b: 3 })).toEqual({ a: 1, b: 3 });
  });
  it('不修改任何入参', () => {
    // ⚠️ 上游签名是 `merge<T extends object>(...sources: T[])` —— **同一个 T**。
    //    所以 `{nested:{x}}` 与 `{nested:{y}}` 放在一起是类型错误（上游同样报错，不是我们更严）。
    //    要测"不改入参"就得显式放宽成同一个宽类型。
    const a: Record<string, unknown> = { nested: { x: 1 } };
    const b: Record<string, unknown> = { nested: { y: 2 } };
    merge(a, b);
    expect(a).toEqual({ nested: { x: 1 } });
    expect(b).toEqual({ nested: { y: 2 } });
  });

  it('createEmpty 跟随第一个源的容器类型', () => {
    expect(merge([1, 2] as unknown as object, [3] as unknown as object)).toEqual([3]);
  });

  it('★ mergeWith 的 prepareArray 只决定「超出 next 长度」的尾部（quirk）', () => {
    // 真实执行顺序：
    //   1. clone = prepareArray(origin, next)          ← [1,2,3]
    //   2. 逐 key 递归（数组的 index 也是可枚举键）      ← list[0] := 3
    // 净效果：[3,2,3] —— concat 型 prepareArray 会被 index 覆盖冲掉。
    // 这是 rc-util 的真实行为（antd 只用 `merge`，没用过 `mergeWith`），保留并锁定。
    const calls: Array<[unknown, unknown]> = [];
    const result = mergeWith([{ list: [1, 2] }, { list: [3] }], {
      prepareArray: (current, next) => {
        calls.push([current, next]);
        return [...((current as unknown[]) ?? []), ...(next as unknown[])];
      },
    });

    expect(calls).toEqual([
      [undefined, [1, 2]],
      [[1, 2], [3]],
    ]);
    expect(result).toEqual({ list: [3, 2, 3] });
  });

  it('默认 prepareArray 返回 [] → 数组整体替换', () => {
    expect(merge({ list: [1, 2, 3] }, { list: [9] })).toEqual({ list: [9] });
    expect(merge({ list: [1, 2, 3] }, { list: [] })).toEqual({ list: [] });
  });

  it('环检测：自引用对象不会导致栈溢出，且环本身被跳过', () => {
    const cyclic: Record<string, unknown> = { name: 'x' };
    cyclic.self = cyclic;

    const result = merge({} as Record<string, unknown>, cyclic) as Record<string, unknown>;

    expect(result.name).toBe('x');
    // `self` 指向的正是根对象，已在 loopSet 中 → 整棵子树被跳过
    expect(result.self).toBeUndefined();
  });

  it('只递归进纯对象，class 实例按值覆盖', () => {
    class Box {
      constructor(public v: number) {}
    }
    // 同样受 `...sources: T[]` 约束，两个源必须统一到一个宽类型
    const result = merge(
      { a: { keep: 1 } } as Record<string, unknown>,
      { a: new Box(1) } as Record<string, unknown>,
    );
    expect(result.a).toBeInstanceOf(Box);
  });

  it('空源数组返回空对象', () => {
    expect(merge()).toEqual({});
  });
});
