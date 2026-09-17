import { describe, expect, it } from 'vitest';
import {
  getRovingOffset,
  getRovingTabIndex,
  moveRovingIndex,
  NO_ACTIVE_INDEX,
  nextRovingIndex,
  resolveRovingEnd,
  resolveRovingHome,
} from '../index';

describe('nextRovingIndex（rc-menu useAccessibility.js:126-137）', () => {
  it('向后：普通步进', () => {
    expect(nextRovingIndex(0, 1, 3)).toBe(1);
    expect(nextRovingIndex(1, 1, 3)).toBe(2);
  });

  it('⭐ 向后：队尾回到队首', () => {
    expect(nextRovingIndex(2, 1, 3)).toBe(0);
  });

  it('向前：普通步进', () => {
    expect(nextRovingIndex(2, -1, 3)).toBe(1);
    expect(nextRovingIndex(1, -1, 3)).toBe(0);
  });

  it('⭐ 向前：队首回到队尾', () => {
    expect(nextRovingIndex(0, -1, 3)).toBe(2);
  });

  it('⭐ 没有当前项时，向后从**头**开始（-1 + 1 = 0）', () => {
    expect(nextRovingIndex(NO_ACTIVE_INDEX, 1, 3)).toBe(0);
  });

  it('⭐ 没有当前项时，向前从**尾**开始（特判 count - 1）', () => {
    expect(nextRovingIndex(NO_ACTIVE_INDEX, -1, 3)).toBe(2);
  });

  it('offset 为 0 ⇒ 原地（但会做一次规范化）', () => {
    expect(nextRovingIndex(1, 0, 3)).toBe(1);
    // -1 原地：(-1 + 3) % 3 = 2 —— 上游同样如此，不是「保持 -1」
    expect(nextRovingIndex(NO_ACTIVE_INDEX, 0, 3)).toBe(2);
  });

  it('只有一项时无论怎么走都是 0', () => {
    expect(nextRovingIndex(0, 1, 1)).toBe(0);
    expect(nextRovingIndex(0, -1, 1)).toBe(0);
  });

  it('⭐ count 为 0 时返回哨兵而不是 NaN（与上游的有意差异）', () => {
    // 上游：(x + 0) % 0 ⇒ NaN，然后 list[NaN] === undefined
    expect(nextRovingIndex(0, 1, 0)).toBe(NO_ACTIVE_INDEX);
    expect(nextRovingIndex(NO_ACTIVE_INDEX, -1, 0)).toBe(NO_ACTIVE_INDEX);
    expect(Number.isNaN(nextRovingIndex(0, 1, 0))).toBe(false);
  });

  it('⭐ 遍历一整圈能回到原点（保证不漏项）', () => {
    const count = 5;
    let index = NO_ACTIVE_INDEX;
    const visited: number[] = [];
    for (let step = 0; step < count; step += 1) {
      index = nextRovingIndex(index, 1, count);
      visited.push(index);
    }
    expect(visited).toEqual([0, 1, 2, 3, 4]);
    expect(index).toBe(4);
  });
});

describe('resolveRovingHome / resolveRovingEnd（:216-221）', () => {
  it('HOME 跳到第一项', () => {
    expect(resolveRovingHome(3)).toBe(0);
  });

  it('END 跳到最后一项', () => {
    expect(resolveRovingEnd(3)).toBe(2);
  });

  it('空列表返回哨兵（上游会得到 undefined，我们给 -1）', () => {
    expect(resolveRovingHome(0)).toBe(NO_ACTIVE_INDEX);
    expect(resolveRovingEnd(0)).toBe(NO_ACTIVE_INDEX);
  });
});

describe('getRovingTabIndex', () => {
  it('只有当前项是 0，其余全 -1 —— 整组只占一个 Tab 停靠点', () => {
    expect(getRovingTabIndex(2, 2)).toBe(0);
    expect(getRovingTabIndex(2, 0)).toBe(-1);
    expect(getRovingTabIndex(2, 1)).toBe(-1);
    expect(getRovingTabIndex(2, 3)).toBe(-1);
  });

  it('没有当前项时全组都是 -1（整组暂时不可 Tab 进入）', () => {
    expect(getRovingTabIndex(NO_ACTIVE_INDEX, 0)).toBe(-1);
    expect(getRovingTabIndex(NO_ACTIVE_INDEX, 1)).toBe(-1);
  });

  it('返回值是字面量 0 | -1，不是 number（类型层由 test-d 钉住）', () => {
    expect(typeof getRovingTabIndex(0, 0)).toBe('number');
  });
});

describe('moveRovingIndex（不环绕的那一半）', () => {
  it('loop=true 时与 nextRovingIndex 完全一致', () => {
    for (let current = -1; current < 4; current += 1) {
      for (const offset of [-1, 0, 1]) {
        expect(moveRovingIndex(current, offset, 3, true)).toBe(nextRovingIndex(current, offset, 3));
      }
    }
  });

  it('⭐ loop=false 时停在边界，不绕回', () => {
    expect(moveRovingIndex(2, 1, 3, false)).toBe(2);
    expect(moveRovingIndex(0, -1, 3, false)).toBe(0);
  });

  it('loop=false 且还没有当前项时，向后取第一项、向前取最后一项', () => {
    expect(moveRovingIndex(NO_ACTIVE_INDEX, 1, 3, false)).toBe(0);
    expect(moveRovingIndex(NO_ACTIVE_INDEX, -1, 3, false)).toBe(2);
  });

  it('中间位置照常移动', () => {
    expect(moveRovingIndex(1, 1, 3, false)).toBe(2);
    expect(moveRovingIndex(1, -1, 3, false)).toBe(0);
  });

  it('count 为 0 时返回哨兵', () => {
    expect(moveRovingIndex(0, 1, 0, false)).toBe(NO_ACTIVE_INDEX);
    expect(moveRovingIndex(0, 1, 0, true)).toBe(NO_ACTIVE_INDEX);
  });

  it('offset 为 0 时原地不动', () => {
    expect(moveRovingIndex(1, 0, 3, false)).toBe(1);
  });
});

describe('getRovingOffset（APG 的通用映射，不是 rc-menu 的分派表）', () => {
  it('vertical：上下移动，左右不管', () => {
    expect(getRovingOffset('vertical', false, 'ArrowDown')).toBe(1);
    expect(getRovingOffset('vertical', false, 'ArrowUp')).toBe(-1);
    expect(getRovingOffset('vertical', false, 'ArrowLeft')).toBeNull();
    expect(getRovingOffset('vertical', false, 'ArrowRight')).toBeNull();
  });

  it('horizontal：左右移动，上下不管', () => {
    expect(getRovingOffset('horizontal', false, 'ArrowRight')).toBe(1);
    expect(getRovingOffset('horizontal', false, 'ArrowLeft')).toBe(-1);
    expect(getRovingOffset('horizontal', false, 'ArrowDown')).toBeNull();
    expect(getRovingOffset('horizontal', false, 'ArrowUp')).toBeNull();
  });

  it('both：四个方向都移动', () => {
    expect(getRovingOffset('both', false, 'ArrowDown')).toBe(1);
    expect(getRovingOffset('both', false, 'ArrowUp')).toBe(-1);
    expect(getRovingOffset('both', false, 'ArrowRight')).toBe(1);
    expect(getRovingOffset('both', false, 'ArrowLeft')).toBe(-1);
  });

  it('⭐ RTL 只影响水平方向', () => {
    expect(getRovingOffset('horizontal', true, 'ArrowRight')).toBe(-1);
    expect(getRovingOffset('horizontal', true, 'ArrowLeft')).toBe(1);
    expect(getRovingOffset('vertical', true, 'ArrowDown')).toBe(1);
  });

  it('非方向键返回 null', () => {
    for (const key of ['Enter', 'Home', 'End', 'a', 'Tab']) {
      expect(getRovingOffset('both', false, key)).toBeNull();
    }
  });
});
