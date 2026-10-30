/**
 * L1 —— `changeConfirmLocale` 的**栈**语义。
 *
 * 静态服务显式共享来源；每个用例结束后清空来源以保持隔离。
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { ModalLocale } from '../index';
import { changeConfirmLocale, en_US, getConfirmLocale, resetConfirmLocale } from '../index';

const DEFAULT = en_US.Modal as ModalLocale;

afterEach(() => {
  resetConfirmLocale();
});

describe('changeConfirmLocale · 基础', () => {
  it('初始就是 en_US.Modal', () => {
    expect(getConfirmLocale()).toEqual(DEFAULT);
  });

  it('⭐ 注册后是「默认 + 注册值」的浅合并', () => {
    changeConfirmLocale({ okText: '好' } as ModalLocale);
    expect(getConfirmLocale()).toEqual({ ...DEFAULT, okText: '好' });
  });

  it('⭐ 无参调用会把当前值重置回默认', () => {
    changeConfirmLocale({ okText: '好' } as ModalLocale);
    expect(getConfirmLocale().okText).toBe('好');

    changeConfirmLocale();
    expect(getConfirmLocale()).toEqual(DEFAULT);
  });

  it('does not revive cleared sources after a new registration or an old cleanup', () => {
    const firstCleanup = changeConfirmLocale({ ...DEFAULT, okText: '幽灵' });
    const secondCleanup = changeConfirmLocale({ ...DEFAULT, okText: '已清理' });
    changeConfirmLocale();
    expect(getConfirmLocale()).toEqual(DEFAULT);
    secondCleanup?.();
    expect(getConfirmLocale()).toEqual(DEFAULT);

    changeConfirmLocale({ ...DEFAULT, cancelText: '新' });
    expect(getConfirmLocale()).toEqual({ ...DEFAULT, cancelText: '新' });
    firstCleanup?.();
    expect(getConfirmLocale()).toEqual({ ...DEFAULT, cancelText: '新' });
  });

  it('resetConfirmLocale also clears all sources', () => {
    changeConfirmLocale({ okText: '幽灵' } as ModalLocale);
    changeConfirmLocale();
    resetConfirmLocale();
    changeConfirmLocale({ cancelText: '新' } as ModalLocale);
    expect(getConfirmLocale()).toEqual({ ...DEFAULT, cancelText: '新' });
  });

  it('反注册后回到默认', () => {
    const clear = changeConfirmLocale({ okText: '好' } as ModalLocale);
    expect(getConfirmLocale().okText).toBe('好');
    clear?.();
    expect(getConfirmLocale()).toEqual(DEFAULT);
  });

  it('⭐ 无参调用返回 undefined（上游的 else 分支没有 cleanup）', () => {
    expect(changeConfirmLocale()).toBeUndefined();
  });
});

describe('changeConfirmLocale · 栈语义', () => {
  it('⭐⭐ 后注册的在上面（不是覆盖式）', () => {
    const clearA = changeConfirmLocale({ okText: 'A' } as ModalLocale);
    const clearB = changeConfirmLocale({ cancelText: 'B' } as ModalLocale);

    // B 只给了 cancelText，A 的 okText 仍在
    expect(getConfirmLocale()).toEqual({ ...DEFAULT, okText: 'A', cancelText: 'B' });

    clearB?.();
    expect(getConfirmLocale()).toEqual({ ...DEFAULT, okText: 'A' });

    clearA?.();
    expect(getConfirmLocale()).toEqual(DEFAULT);
  });

  it('⭐⭐ 两层设了**同一个键**时，后注册的赢（这条抓 push/unshift 的栈序）', () => {
    const clearA = changeConfirmLocale({ okText: 'A' } as ModalLocale);
    const clearB = changeConfirmLocale({ okText: 'B' } as ModalLocale);
    expect(getConfirmLocale().okText).toBe('B');

    clearB?.();
    expect(getConfirmLocale().okText).toBe('A');
    clearA?.();
    expect(getConfirmLocale()).toEqual(DEFAULT);
  });

  it('⭐ 弹出中间那一层（不是最后注册的）也正确重建', () => {
    const clearA = changeConfirmLocale({ okText: 'A' } as ModalLocale);
    const clearB = changeConfirmLocale({ cancelText: 'B' } as ModalLocale);
    const clearC = changeConfirmLocale({ justOkText: 'C' } as ModalLocale);

    expect(getConfirmLocale()).toEqual({
      ...DEFAULT,
      okText: 'A',
      cancelText: 'B',
      justOkText: 'C',
    });

    // 弹出 B —— 剩下的 A 与 C 仍按注册顺序叠加
    clearB?.();
    expect(getConfirmLocale()).toEqual({ ...DEFAULT, okText: 'A', justOkText: 'C' });

    clearC?.();
    clearA?.();
    expect(getConfirmLocale()).toEqual(DEFAULT);
  });

  it('⭐ 同一份对象重复注册会叠加两次（按引用去重，不是按值）', () => {
    const shared = { okText: 'X' } as ModalLocale;
    const clearA = changeConfirmLocale(shared);
    const clearB = changeConfirmLocale(shared);

    clearA?.();
    // B 还留着 ⇒ 仍然生效
    expect(getConfirmLocale().okText).toBe('X');
    clearB?.();
    expect(getConfirmLocale()).toEqual(DEFAULT);
  });
});

describe('changeConfirmLocale · 入栈时会 clone', () => {
  it('⭐ 注册之后再改调用方的对象，不影响已注册的值', () => {
    const mine = { okText: '原值' } as ModalLocale;
    changeConfirmLocale(mine);

    mine.okText = '被改了';
    expect(getConfirmLocale().okText).toBe('原值');
  });

  it('⭐ 但同一个对象注册两次后，两个 clone 是独立的（弹出其中一个不影响另一个）', () => {
    const mine = { okText: 'V' } as ModalLocale;
    const clearA = changeConfirmLocale(mine);
    const clearB = changeConfirmLocale(mine);

    clearA?.();
    expect(getConfirmLocale().okText).toBe('V');
    clearB?.();
    expect(getConfirmLocale()).toEqual(DEFAULT);
  });
});
