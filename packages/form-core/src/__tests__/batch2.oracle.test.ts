/**
 * 批次② Oracle 差分 —— 与 `@rc-component/form@1.8.6` 的三个**纯 JS** 文件逐位对比。
 *
 * 为什么能做：`es/utils/{valueUtil,NameMap,messages}.js` **都不 import react**
 * （已 grep 确认）⇒ 可以真的把它们跑起来当参照物。
 *
 * ⚠️ `es/utils/validateUtil.js` 里的 `replaceMessage` **无法 oracle** ——
 * 那个文件 `import * as React from 'react'`，且 `replaceMessage` 本身没导出。
 * 它的断言在 `batch2.test.ts` 里手写（期望值来自读源码，不是照实现反推）。
 */

import { defaultValidateMessages as upstreamMessages } from '@rc-component/form/es/utils/messages';
import UpstreamNameMap from '@rc-component/form/es/utils/NameMap';
import {
  cloneByNamePathList as upstreamCloneByNamePathList,
  containsNamePath as upstreamContainsNamePath,
  defaultGetValueFromEvent as upstreamDefaultGetValueFromEvent,
  getNamePath as upstreamGetNamePath,
  isSimilar as upstreamIsSimilar,
  matchNamePath as upstreamMatchNamePath,
  move as upstreamMove,
} from '@rc-component/form/es/utils/valueUtil';
import { describe, expect, it } from 'vitest';

import { NameMap } from '../name-map';
import { defaultValidateMessages } from '../validate-messages';
import {
  cloneByNamePathList,
  containsNamePath,
  defaultGetValueFromEvent,
  getNamePath,
  isSimilar,
  matchNamePath,
  move,
} from '../value-util';

// ---------------------------------------------------------------------------
// getNamePath
// ---------------------------------------------------------------------------

describe('Oracle · getNamePath', () => {
  const inputs: (string | number | (string | number)[] | undefined | null)[] = [
    'a',
    'a.b',
    0,
    123,
    '',
    ['a'],
    ['a', 'b'],
    ['a', 1],
    [],
    [0],
    undefined,
    null,
  ];

  it(`${inputs.length} 种输入逐位一致`, () => {
    for (const input of inputs) {
      expect(getNamePath(input as never), String(input)).toEqual(
        upstreamGetNamePath(input as never),
      );
    }
  });

  it('⭐ 数组入参**原样返回**（不拷贝）', () => {
    const arr = ['a', 'b'];
    expect(getNamePath(arr)).toBe(arr);
    expect(upstreamGetNamePath(arr)).toBe(arr);
  });
});

// ---------------------------------------------------------------------------
// cloneByNamePathList
// ---------------------------------------------------------------------------

describe('Oracle · cloneByNamePathList', () => {
  const store = { a: { b: 1, c: 2 }, d: 3, e: { f: { g: 4 } } };
  // ⚠️ 三层：外层是「多组用例」，中层是「一个 namePathList」，内层是「一个 namePath」
  const cases: (string | number)[][][] = [
    [['a', 'b']],
    [['a']],
    [['d']],
    [['e', 'f', 'g']],
    [['a', 'b'], ['d']],
    [['missing']],
    [['a', 'missing']],
    [],
  ];

  it(`${cases.length} 组 namePathList 逐位一致`, () => {
    for (const list of cases) {
      expect(cloneByNamePathList(store, list), JSON.stringify(list)).toEqual(
        upstreamCloneByNamePathList(store, list),
      );
    }
  });
});

// ---------------------------------------------------------------------------
// matchNamePath / containsNamePath
// ---------------------------------------------------------------------------

describe('Oracle · matchNamePath', () => {
  const pairs: [(string | number)[] | null | undefined, (string | number)[] | null | undefined][] =
    [
      [['a'], ['a']],
      [['a'], ['b']],
      [['a'], ['a', 'b']],
      [['a', 'b'], ['a']],
      [
        ['a', 'b'],
        ['a', 'b'],
      ],
      [[], []],
      [[], ['a']],
      [null, ['a']],
      [['a'], null],
      [undefined, undefined],
      [
        ['a', 1],
        ['a', 1],
      ],
      [
        ['a', 1],
        ['a', '1'],
      ],
    ];

  it('partialMatch=false 时逐位一致', () => {
    for (const [a, b] of pairs) {
      expect(matchNamePath(a as never, b as never), JSON.stringify([a, b])).toBe(
        upstreamMatchNamePath(a as never, b as never),
      );
    }
  });

  it('partialMatch=true 时逐位一致', () => {
    for (const [a, b] of pairs) {
      expect(matchNamePath(a as never, b as never, true), JSON.stringify([a, b])).toBe(
        upstreamMatchNamePath(a as never, b as never, true),
      );
    }
  });
});

describe('Oracle · containsNamePath', () => {
  const lists: ((string | number)[][] | null | undefined)[] = [
    [['a', 'b'], ['c']],
    [['a']],
    [],
    null,
    undefined,
  ];
  const targets: (string | number)[][] = [['a'], ['a', 'b'], ['c'], []];

  it('逐位一致（含 partialMatch 两种）', () => {
    for (const list of lists) {
      for (const target of targets) {
        expect(
          containsNamePath(list as never, target),
          `${JSON.stringify(list)} / ${JSON.stringify(target)}`,
        ).toBe(upstreamContainsNamePath(list as never, target));
        expect(
          containsNamePath(list as never, target, true),
          `partial ${JSON.stringify(list)} / ${JSON.stringify(target)}`,
        ).toBe(upstreamContainsNamePath(list as never, target, true));
      }
    }
  });
});

// ---------------------------------------------------------------------------
// isSimilar
// ---------------------------------------------------------------------------

describe('Oracle · isSimilar', () => {
  const fn1 = () => {};
  const fn2 = () => {};
  const pairs: [unknown, unknown][] = [
    [{ a: 1 }, { a: 1 }],
    [{ a: 1 }, { a: 2 }],
    [{ a: 1 }, { a: 1, b: 2 }],
    [{ a: 1, b: 2 }, { a: 1 }],
    [{}, {}],
    [{ a: fn1 }, { a: fn2 }],
    [{ a: fn1 }, { a: 1 }],
    [null, null],
    [null, {}],
    [{}, null],
    [undefined, undefined],
    [1, 1],
    ['a', 'a'],
    [{ a: { b: 1 } }, { a: { b: 1 } }],
    [
      [1, 2],
      [1, 2],
    ],
  ];

  it(`${pairs.length} 组逐位一致`, () => {
    for (const [a, b] of pairs) {
      expect(isSimilar(a as never, b as never), JSON.stringify([a, b])).toBe(
        upstreamIsSimilar(a as never, b as never),
      );
    }
  });

  it('⭐ 两个函数视为相等（不比较引用）', () => {
    const f1 = () => {};
    const f2 = () => {};
    expect(isSimilar({ a: f1 }, { a: f2 })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// defaultGetValueFromEvent
// ---------------------------------------------------------------------------

describe('Oracle · defaultGetValueFromEvent', () => {
  const cases: [string, unknown[]][] = [
    ['value', [{ target: { value: 'v' } }]],
    ['value', [{ target: { value: undefined } }]],
    ['checked', [{ target: { checked: true } }]],
    ['value', [{ target: {} }]],
    ['value', ['plain']],
    ['value', [null]],
    ['value', [undefined]],
    ['value', [123]],
    ['value', []],
    ['value', [{ target: 'not-object' }]],
  ];

  it(`${cases.length} 组逐位一致`, () => {
    for (const [prop, args] of cases) {
      expect(defaultGetValueFromEvent(prop, ...args), `${prop} / ${JSON.stringify(args)}`).toBe(
        upstreamDefaultGetValueFromEvent(prop, ...args),
      );
    }
  });
});

// ---------------------------------------------------------------------------
// move
// ---------------------------------------------------------------------------

describe('Oracle · move', () => {
  const cases: [number, number][] = [
    [0, 1],
    [1, 0],
    [0, 2],
    [2, 0],
    [1, 1],
    [-1, 0],
    [0, -1],
    [3, 0],
    [0, 3],
    [1, 2],
    [2, 1],
  ];

  it(`${cases.length} 组下标逐位一致`, () => {
    for (const [from, to] of cases) {
      const arr = ['a', 'b', 'c'];
      expect(move([...arr], from, to), `move(${from}, ${to})`).toEqual(
        upstreamMove([...arr], from, to),
      );
    }
  });

  it('⭐ 越界与相等时返回**原数组引用**（不是副本）', () => {
    const arr = ['a', 'b'];
    expect(move(arr, 5, 0)).toBe(arr);
    expect(move(arr, 0, 0)).toBe(arr);
    expect(upstreamMove(arr, 5, 0)).toBe(arr);
    expect(upstreamMove(arr, 0, 0)).toBe(arr);
  });

  it('单元素数组', () => {
    expect(move(['a'], 0, 0)).toEqual(upstreamMove(['a'], 0, 0));
  });
});

// ---------------------------------------------------------------------------
// NameMap
// ---------------------------------------------------------------------------

describe('Oracle · NameMap', () => {
  it('set / get 往返', () => {
    const ours = new NameMap<number>();
    const theirs = new UpstreamNameMap<number>();
    for (const key of [['a'], ['a', 'b'], ['a', 1], ['a', '1'], [0], ['']]) {
      ours.set(key as never, 1);
      theirs.set(key as never, 1);
      expect(ours.get(key as never), JSON.stringify(key)).toBe(theirs.get(key as never));
    }
  });

  it('⭐ number 与 string 不撞键（typeof 前缀的作用）', () => {
    const ours = new NameMap<string>();
    const theirs = new UpstreamNameMap<string>();
    ours.set(['a', 1], 'num');
    ours.set(['a', '1'], 'str');
    theirs.set(['a', 1], 'num');
    theirs.set(['a', '1'], 'str');
    expect(ours.get(['a', 1])).toBe(theirs.get(['a', 1]));
    expect(ours.get(['a', '1'])).toBe(theirs.get(['a', '1']));
    expect(ours.get(['a', 1])).not.toBe(ours.get(['a', '1']));
  });

  it('get 未设置的键 ⇒ undefined', () => {
    const ours = new NameMap<number>();
    const theirs = new UpstreamNameMap<number>();
    expect(ours.get(['x'])).toBe(theirs.get(['x']));
  });

  it('getAsPrefix 逐位一致（含「自己也算」与 SPLIT 边界）', () => {
    const keys = [['a'], ['a', 'b'], ['a', 'b', 'c'], ['ab'], ['a', 1]];
    const ours = new NameMap<string>();
    const theirs = new UpstreamNameMap<string>();
    for (const key of keys) {
      ours.set(key as never, JSON.stringify(key));
      theirs.set(key as never, JSON.stringify(key));
    }
    for (const probe of [['a'], ['a', 'b'], ['ab'], ['a', 1], ['z']]) {
      expect(ours.getAsPrefix(probe as never), JSON.stringify(probe)).toEqual(
        theirs.getAsPrefix(probe as never),
      );
    }
  });

  it('update 逐位一致（返回假值 ⇒ 删除）', () => {
    const make = () => {
      const ours = new NameMap<number>();
      const theirs = new UpstreamNameMap<number>();
      ours.set(['a'], 1);
      theirs.set(['a'], 1);
      return { ours, theirs };
    };

    const { ours, theirs } = make();
    ours.update(['a'], (v) => (v ?? 0) + 1);
    theirs.update(['a'], (v) => (v ?? 0) + 1);
    expect(ours.get(['a'])).toBe(theirs.get(['a']));

    // ⚠️ 上游的 `.d.ts` 把 updater 的返回声明成 `V | null`（**比运行时窄** ——
    //    实现里判的是 `if (!next)`，所以 `undefined` / `0` / `''` 同样会走删除分支）。
    //    这里用断言保留「undefined 也删」这个测试意图。
    ours.update(['a'], () => undefined);
    theirs.update(['a'], (() => undefined) as never);
    expect(ours.get(['a'])).toBe(theirs.get(['a']));
  });

  it('delete 逐位一致', () => {
    const ours = new NameMap<number>();
    const theirs = new UpstreamNameMap<number>();
    ours.set(['a'], 1);
    theirs.set(['a'], 1);
    ours.delete(['a']);
    theirs.delete(['a']);
    expect(ours.get(['a'])).toBe(theirs.get(['a']));
  });

  it('map 反解 namePath（number 还原成 number）', () => {
    const ours = new NameMap<number>();
    const theirs = new UpstreamNameMap<number>();
    for (const [key, value] of [
      [['a'], 1],
      [['a', 1], 2],
      [['a', '1'], 3],
    ] as [(string | number)[], number][]) {
      ours.set(key, value);
      theirs.set(key, value);
    }
    expect(ours.map(({ key, value }) => [key, value])).toEqual(
      theirs.map(({ key, value }) => [key, value]),
    );
  });

  it('toJSON 用 `.` 连接', () => {
    const ours = new NameMap<number>();
    const theirs = new UpstreamNameMap<number>();
    ours.set(['a', 'b'], 1);
    theirs.set(['a', 'b'], 1);
    expect(ours.toJSON()).toEqual(theirs.toJSON());
  });
});

// ---------------------------------------------------------------------------
// defaultValidateMessages
// ---------------------------------------------------------------------------

describe('Oracle · defaultValidateMessages', () => {
  it('⭐ 与上游逐字段一致（含单引号与两套模板的差异）', () => {
    expect(defaultValidateMessages).toEqual(upstreamMessages);
  });

  it('types.* 全部共用同一个模板', () => {
    const types = Object.values(defaultValidateMessages.types);
    expect(new Set(types).size).toBe(1);
  });
});
