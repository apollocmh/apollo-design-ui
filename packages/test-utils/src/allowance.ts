/**
 * 豁免校验 —— 本包的反静默机制。
 *
 * 为什么单独一个文件：本包有 4 处「允许不达标」的入口（`demoTest` / `a11yDemoTest` /
 * `domContractTest` / `themeTest`），如果各写一遍校验，迟早在某一处漏掉。
 * 集中在一处后，「不允许沉默的例外」这条规则有**唯一**的实现点。
 */

import type { Allowance } from './types';

/** 豁免缺少理由时抛出的错误。单独立类型是为了让调用方能精确捕获。 */
export class AllowanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AllowanceError';
  }
}

/**
 * 校验一条豁免是否给出了**非空理由**。
 *
 * ⚠️ 这里只校验「有没有写」，不校验「写得对不对」——
 *    后者是 code review 的事，工具能做的到此为止。但「没写」是可以机器判定的，
 *    而恰恰是「没写」会让半年后的维护者无法判断这是有意还是 bug。
 *
 * @param allow   待校验的豁免。`undefined` 表示没有豁免，直接放行。
 * @param context 出错信息里的定位串（模块名 + 用例名）。
 */
export function assertAllowance(allow: Allowance | undefined, context: string): void {
  if (allow === undefined) return;

  if (typeof allow.reason !== 'string' || allow.reason.trim() === '') {
    throw new AllowanceError(
      `[test-utils] ${context}：豁免必须给出非空 reason。\n` +
        '  依据：AGENTS.md H8（禁止降低验收标准以换取进度）、TESTING.md T16（白名单必须写明理由）。\n' +
        '  若差异确实存在且已被接受，先登记到 COMPATIBILITY.md §9 并把编号填进 deviationId。',
    );
  }
}

/** 批量校验，出错信息带上条目下标。 */
export function assertAllowances(
  allowances: readonly Allowance[] | undefined,
  context: string,
): void {
  if (!allowances) return;
  for (const [index, allowance] of allowances.entries()) {
    assertAllowance(allowance, `${context}[${index}]`);
  }
}
