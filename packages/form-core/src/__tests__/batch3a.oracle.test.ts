/**
 * 批次③a Oracle 差分 —— 与 `@rc-component/form@1.8.6` 的**两个纯函数**逐位对比。
 *
 * ── ⚠️⚠️ 为什么只有两个函数 ──────────────────────────────────────────────────
 *
 * 判据（契约 §7.0.1）：**上游零框架耦合 ⇒ 可做 Oracle；绑 React 生命周期 ⇒ 不能。**
 * 批次③ 的核心（`hooks/useForm.js` 的 `FormStore`、`hooks/useWatch.js`、`Field.js`、
 * `utils/validateUtil.js`）全部绑在 React 上（`forceUpdate` / `useState` /
 * `useEffect` / `import * as React`）⇒ **本批次绝大部分没有 oracle**，
 * 只能「读源码 + 行为测试」（见 `batch3a.test.ts`）。
 *
 * 真正能对拍的只有 `utils/` 下不 import react 的两个文件：
 *
 * | 文件 | 导出 | 依据 |
 * |---|---|---|
 * | `es/utils/asyncUtil.js` | `allPromiseFinish` | 8 行纯函数 |
 * | `es/utils/typeUtil.js` | `isFormInstance` | 3 行纯函数（`toArray` 已在批次② 对拍） |
 *
 * ⚠️ `es/utils/delayUtil.js` **不**对拍：它依赖 `@rc-component/util` 的 `raf`，
 * 断言会变成「比谁的计时器先跑」而不是「比语义」。
 *
 * ⚠️ 我们**没有**假装对 `FormStore` 做差分。要对拍就得机械移植一份带 React 语义的
 * `FormStore`，那份移植本身会把 React 的调度语义当成规格 —— 差分通过只能说明
 * 「两边都想通了」（`WORKFLOW.md` §1.1.1 给 PoC 定的判据）。
 */

import { allPromiseFinish as upstreamAllPromiseFinish } from '@rc-component/form/es/utils/asyncUtil';
import { isFormInstance as upstreamIsFormInstance } from '@rc-component/form/es/utils/typeUtil';
import { describe, expect, it } from 'vitest';

import { allPromiseFinish } from '../async-util';
import { isFormInstance } from '../form-util';

// ---------------------------------------------------------------------------
// 工具：把一个 promise 的「结局」抽成可比较的普通对象
// ---------------------------------------------------------------------------

type Settled = { status: 'fulfilled' | 'rejected'; value: unknown };

/**
 * ⚠️ 上游 `asyncUtil.d.ts` 把入参声明成 `Promise<FieldError>[]`（**比运行时窄**，
 * 运行时只用到 `.catch`/`.then`，任何 promise 都行）。要对拍就得按它自己的
 * 形参类型断言 —— 这是「上游声明没跟上运行时」的又一处，不是我们在放宽断言。
 */
type UpstreamPromiseList = Parameters<typeof upstreamAllPromiseFinish>[0];

function settle(promise: Promise<unknown>): Promise<Settled> {
  return promise.then(
    (value) => ({ status: 'fulfilled' as const, value }),
    (reason) => ({ status: 'rejected' as const, value: reason }),
  );
}

/**
 * ⚠️ promise 是一次性的，两侧必须各建一份 ⇒ 用例写成**工厂函数**而不是现成数组。
 */
interface FinishCase {
  name: string;
  make: () => Promise<unknown>[];
}

const FINISH_CASES: FinishCase[] = [
  { name: '空列表', make: () => [] },
  { name: '单元素 · 成功', make: () => [Promise.resolve('only')] },
  { name: '单元素 · 失败', make: () => [Promise.reject(new Error('only'))] },
  {
    name: '全部成功 · 同步完成',
    make: () => [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)],
  },
  {
    name: '全部成功 · 乱序完成（结果仍按入参顺序）',
    make: () => [
      new Promise((resolve) => setTimeout(() => resolve('slow'), 20)),
      new Promise((resolve) => setTimeout(() => resolve('fast'), 1)),
      Promise.resolve('sync'),
    ],
  },
  {
    name: '中间一个失败',
    make: () => [Promise.resolve('a'), Promise.reject(new Error('boom')), Promise.resolve('c')],
  },
  {
    name: '多个失败',
    make: () => [Promise.reject('x'), Promise.resolve(2), Promise.reject('y')],
  },
  {
    name: '⭐ 失败值是 undefined（有 hasError 但结果项是 undefined）',
    make: () => [Promise.reject(undefined), Promise.resolve(2)],
  },
  {
    name: '⭐ 失败值是 null',
    make: () => [Promise.resolve(1), Promise.reject(null)],
  },
  {
    name: '⭐ 乱序完成 + 后完成的那个失败',
    make: () => [
      new Promise((_resolve, reject) => setTimeout(() => reject('late-err'), 20)),
      new Promise((resolve) => setTimeout(() => resolve('early-ok'), 1)),
    ],
  },
  {
    name: '⭐ 乱序完成 + 先完成的那个失败',
    make: () => [
      new Promise((_resolve, reject) => setTimeout(() => reject('late-err'), 20)),
      new Promise((_resolve, reject) => setTimeout(() => reject('early-err'), 1)),
    ],
  },
  {
    name: '失败值是对象（验证「rejection 值是全部结果」而不是「第一个错误」）',
    make: () => [
      Promise.reject({ code: 'E1' }),
      Promise.reject({ code: 'E2' }),
      Promise.resolve('ok'),
    ],
  },
];

describe('Oracle · allPromiseFinish（逐位差分）', () => {
  it.each(FINISH_CASES)('$name', async ({ make }) => {
    const ours = await settle(allPromiseFinish(make()));
    const upstream = await settle(upstreamAllPromiseFinish(make() as UpstreamPromiseList));

    // ⭐ 先比「结局」，再比「值」—— 分开断言才能在失败时说清是哪一层不一致。
    expect(ours.status).toBe(upstream.status);
    expect(ours.value).toEqual(upstream.value);
  });

  it('空列表返回**新数组**（不是同一个引用）', async () => {
    const a = await allPromiseFinish([]);
    const b = await allPromiseFinish([]);
    expect(a).toEqual([]);
    expect(b).toEqual([]);
    expect(a).not.toBe(b);

    const upstreamA = await upstreamAllPromiseFinish([]);
    const upstreamB = await upstreamAllPromiseFinish([]);
    expect(upstreamA).not.toBe(upstreamB);
  });

  it('⭐ 「reject 之后没有 return」的语义被钉住：最终一定是 rejected', async () => {
    // 上游 `if (hasError) reject(results); resolve(results);` —— 那句 resolve 是空操作。
    // 若有人「顺手修」成 `return reject(...)` 或把 resolve 提到前面，这条会红。
    const ours = await settle(allPromiseFinish([Promise.reject('e'), Promise.resolve('ok')]));
    const upstream = await settle(
      upstreamAllPromiseFinish([
        Promise.reject('e'),
        Promise.resolve('ok'),
      ] as unknown as UpstreamPromiseList),
    );
    expect(ours.status).toBe('rejected');
    expect(upstream.status).toBe('rejected');
    expect(ours.value).toEqual(['e', 'ok']);
    expect(upstream.value).toEqual(['e', 'ok']);
  });

  it('⭐ 失败时 rejection 值是**全部结果**，不是第一个错误', async () => {
    const ours = await settle(
      allPromiseFinish([Promise.resolve('a'), Promise.reject('first'), Promise.resolve('c')]),
    );
    expect(ours.value).toEqual(['a', 'first', 'c']);
  });

  it('⭐ 全部成功时结果按**入参顺序**写位（不是完成顺序）', async () => {
    const ours = await settle(
      allPromiseFinish([
        new Promise((resolve) => setTimeout(() => resolve(1), 20)),
        Promise.resolve(2),
        new Promise((resolve) => setTimeout(() => resolve(3), 5)),
      ]),
    );
    expect(ours.value).toEqual([1, 2, 3]);
  });

  it('非 promise 的 thenable 也按原样处理（上游用 `.catch`/`.then` 鸭子类型）', async () => {
    // ⚠️ 上游 `.d.ts` 把入参声明成 `Promise<FieldError>[]`（比运行时窄），
    //    所以这里按**上游自己的形参类型**断言，而不是按我们的 `Promise<unknown>[]`。
    type UpstreamPromiseList = Parameters<typeof upstreamAllPromiseFinish>[0];
    // biome-ignore lint/suspicious/noThenProperty: **这就是被测对象** —— 上游 `allPromiseFinish` 用 `.catch`/`.then` 鸭子类型判定，本用例专门验证「非 Promise 的 thenable 也按原样处理」。改名会让这个用例失去意义。
    const thenable = { then: (resolve: (v: unknown) => void) => resolve('thenable') };
    const ours = await settle(allPromiseFinish([thenable as unknown as Promise<unknown>]));
    const upstream = await settle(
      upstreamAllPromiseFinish([thenable] as unknown as UpstreamPromiseList),
    );
    expect(ours).toEqual(upstream);
  });
});

// ---------------------------------------------------------------------------
// isFormInstance
// ---------------------------------------------------------------------------

const INSTANCE_INPUTS: unknown[] = [
  null,
  undefined,
  0,
  1,
  '',
  'x',
  false,
  true,
  {},
  [],
  { _init: true },
  { _init: false },
  { _init: 1 },
  { _init: 0 },
  { _init: '' },
  { _init: 'yes' },
  { _init: null },
  { _init: undefined },
  { notInit: true },
  Object.create(null),
];

describe('Oracle · isFormInstance（真值一致）', () => {
  it.each(INSTANCE_INPUTS.map((input, index) => ({ index, input })))(
    '输入 #$index 的真值判定一致',
    ({ input }) => {
      expect(Boolean(isFormInstance(input))).toBe(Boolean(upstreamIsFormInstance(input)));
    },
  );

  it('⭐ 已知且**有意**的差异：上游短路返回 null / 0，我们归一成 false', () => {
    // 上游：`return form && !!form._init;` ⇒ 假值输入原样返回（null / 0 / '' / false）。
    // 我们：`Boolean(...)` ⇒ 一律 false。
    // 判定：**不是放宽标准** —— 上游 `.d.ts` 声明的返回类型就是 `boolean`，
    // 运行时却给 null/0，是声明没跟上实现。调用点（`useWatch`）只用真值语境，
    // 两者可观测行为一致；这里把差异显式钉住，避免后人以为是漏抄。
    expect(upstreamIsFormInstance(null)).toBe(null);
    expect(isFormInstance(null)).toBe(false);

    expect(upstreamIsFormInstance(0)).toBe(0);
    expect(isFormInstance(0)).toBe(false);

    expect(upstreamIsFormInstance('')).toBe('');
    expect(isFormInstance('')).toBe(false);

    // 真值输入两侧一致。
    expect(upstreamIsFormInstance({ _init: true })).toBe(true);
    expect(isFormInstance({ _init: true })).toBe(true);
  });
});
