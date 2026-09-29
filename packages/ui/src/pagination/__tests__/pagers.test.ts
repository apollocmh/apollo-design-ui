/**
 * L1 单元 —— Pagination 的**几何与列表算法**（不挂组件，所以很轻）。
 *
 * ── 为什么与 `index.test.ts` 分开 ─────────────────────────────────────────────
 *
 * 这里对拍 `tests/compat/baselines/pagination.pagers.json` 的 **224 行判定表**
 * （用 antd 自身的 SSR 产物穷举生成：total × current × showLessItems × showPrevNextJumpers）。
 * 实测把它与「几十处组件挂载」放进同一个文件时，vitest 的 worker 会在 60s 内起不来
 * （`Failed to start threads worker`）—— 拆开既避开该问题，也让「纯函数层」能独立快跑。
 *
 * 重新生成判定表：`node tests/compat/baseline/pagination-pagers.mjs`
 */

import { describe, expect, it } from 'vitest';

import pagersBaseline from '../../../../../tests/compat/baselines/pagination.pagers.json';
import { calculatePage, getPagerList, type PagerListItem } from '../getPagerList';
import { useShowSizeChanger } from '../useShowSizeChanger';

/** 把实现输出归一成基线形状，便于逐行对拍。 */
const normalize = (items: PagerListItem[]) =>
  items.map((item) =>
    item.kind === 'page'
      ? {
          kind: 'page',
          page: item.page,
          ...(item.active ? { active: true } : {}),
          ...(item.disabled ? { disabled: true } : {}),
          ...(item.extraClass === 'item-after-jump-prev' ? { afterJumpPrev: true } : {}),
          ...(item.extraClass === 'item-before-jump-next' ? { beforeJumpNext: true } : {}),
        }
      : { kind: item.kind },
  );

// ---------------------------------------------------------------------------
// L1 · 页码列表判定表（对拍 antd 产物）
// ---------------------------------------------------------------------------

describe('Pagination · getPagerList 判定表（对拍 antd 产物）', () => {
  it('基线覆盖 224 行（矩阵完整性）', () => {
    expect(pagersBaseline.cases.length).toBe(224);
  });

  for (const testCase of pagersBaseline.cases) {
    const {
      total,
      current,
      effectiveCurrent,
      showLessItems,
      showPrevNextJumpers,
      allPages,
      items,
    } = testCase;
    it(`total=${total} current=${current} lessItems=${showLessItems} jumpers=${showPrevNextJumpers}`, () => {
      expect(calculatePage(10, total)).toBe(allPages);
      // ⚠️ 纯函数不做钳制（钳制在状态机里）⇒ 用基线里记录的有效页；
      //    同一条用例也顺带钉住「钳制规则 = max(1, min(current, allPages))」。
      expect(Math.max(1, Math.min(current, allPages))).toBe(effectiveCurrent);
      const actual = getPagerList({
        allPages,
        current: effectiveCurrent,
        showLessItems,
        showPrevNextJumpers,
      });
      expect(normalize(actual)).toEqual(items);
    });
  }
});

describe('Pagination · calculatePage（L1）', () => {
  it('floor((total - 1) / pageSize) + 1；total=0 ⇒ 0', () => {
    expect(calculatePage(10, 0)).toBe(0);
    expect(calculatePage(10, 1)).toBe(1);
    expect(calculatePage(10, 10)).toBe(1);
    expect(calculatePage(10, 11)).toBe(2);
    expect(calculatePage(10, 500)).toBe(50);
    expect(calculatePage(200, 1001)).toBe(6);
  });
});

describe('Pagination · useShowSizeChanger（L1）', () => {
  it('布尔 ⇒ [布尔, {}]；对象 ⇒ [true, 对象]；未传 ⇒ [undefined, undefined]', () => {
    expect(useShowSizeChanger(true)).toEqual([true, {}]);
    expect(useShowSizeChanger(false)).toEqual([false, {}]);
    expect(useShowSizeChanger({ showSearch: false })).toEqual([true, { showSearch: false }]);
    expect(useShowSizeChanger(undefined)).toEqual([undefined, undefined]);
  });
});
