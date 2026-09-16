/**
 * 告警采集与断言。
 *
 * ── 与上游的差异（有意，逐条有理由；见 `test-utils-contract.md` §2.2 / §7）────────
 * antd 的 `tests/shared/excludeWarning.ts` 做两件事：spy `console.error`、
 * 过滤掉**白名单里的 React 警告**：
 *
 *     const list = ['useLayoutEffect does nothing on the server'];
 *     if (all) list.push('is deprecated in StrictMode');
 *
 * 我们**不提供** `isSafeWarning`，因为：
 *   1. 那两条白名单都是 React / StrictMode 专有。本仓库 H1/H4 下既没有
 *      `useLayoutEffect` 也没有 StrictMode —— 这个函数**没有可过滤的对象**。
 *   2. 一个「默认打开、可配置」的静默开关，就是 H8 说的「降低验收标准」的后门。
 *      需要豁免时应当走 `allow`（必须带 `reason`），而不是加一条白名单。
 *
 * 因此本模块的默认行为比上游**严**：采集到的每一条都必须有豁免，否则失败。
 *
 * ── 为什么采集 `console.warn` 而不只 `console.error` ────────────────────────────
 * Vue 自己的 dev 警告（`[Vue warn]: Missing required prop …`）走 `console.warn`，
 * 我们自己的 `note()` 与「废弃属性聚合」也走 `console.warn`。
 * 只盯 `console.error` 会漏掉整整一类真实的用法错误。
 */

import { resetDevWarned, resetWarned } from '@apollo-design/utils';
import { afterAll, beforeAll } from 'vitest';
import { assertAllowances } from './allowance';
import type { WarningAllowance } from './types';

/** 一条被采集到的告警。 */
export interface WarningRecord {
  /** 来自哪个通道。 */
  method: 'error' | 'warn';
  /** 原始实参（保留引用，便于调用方自行断言结构）。 */
  args: readonly unknown[];
  /** 把实参拼成的单行文本，用于匹配与报错。 */
  text: string;
}

/** 采集句柄。 */
export interface WarningCapture {
  /**
   * 已采集到的告警。**是同一个数组引用**，会持续增长 ——
   * 这样可以「先 restore 再断言」，避免断言期间的输出被自己吃掉。
   */
  records: WarningRecord[];
  /** `records` 的文本投影。 */
  texts(): string[];
  /** 还原 `console`。幂等。 */
  restore(): void;
}

/** 把 `console` 的实参转成可读文本。 */
function stringify(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value) ?? String(value);
    } catch {
      // 循环引用 / BigInt 等：`JSON.stringify` 会抛，退化成 String。
      return String(value);
    }
  }
  return String(value);
}

/**
 * 开始采集 `console.error` / `console.warn`。
 *
 * ⚠️ 必须在 `finally` 里 `restore()`。忘记还原会让**后续测试文件的输出全部消失**，
 *    表现为「明明该报错的用例静默通过」—— 这是最难查的一类失败。
 *    `demoTest` 等模块内部已用 `try/finally` 包好，手写时请照做。
 */
export function captureWarnings(): WarningCapture {
  const records: WarningRecord[] = [];
  const origin = { error: console.error, warn: console.warn };
  let restored = false;

  const makeSpy =
    (method: 'error' | 'warn') =>
    (...args: unknown[]): void => {
      records.push({ method, args, text: args.map(stringify).join(' ') });
    };

  console.error = makeSpy('error') as typeof console.error;
  console.warn = makeSpy('warn') as typeof console.warn;

  return {
    records,
    texts: () => records.map((record) => record.text),
    restore: () => {
      if (restored) return;
      restored = true;
      console.error = origin.error;
      console.warn = origin.warn;
    },
  };
}

/** {@link captureWarnings} 的别名 —— 保留上游命名，便于从 antd 迁移时搜索定位。 */
export const excludeWarning = captureWarnings;

/**
 * 在整个测试文件内接管（并采集）告警。
 *
 * ⚠️ 它**只接管与还原，不判断**。这是有意的：`afterAll` 里拿不到 `expect` 的用例上下文，
 *    在那里失败会让归属指向错误的用例；而只「打印」又等于一个不会红的报告 ——
 *    比不做更糟，因为它会让人以为检查过了。
 *
 *    需要判定时请显式使用 {@link captureWarnings} + {@link assertNoUnexpectedWarnings}，
 *    或者直接用 `demoTest` / `rtlTest` / `themeTest` / `mountTest` —— 它们内部已经接好了。
 *
 * @returns 句柄。`capture` 在 `beforeAll` 之后才可用（在那之前为 `undefined`）。
 */
export function excludeAllWarning(): { readonly capture: WarningCapture | undefined } {
  let capture: WarningCapture | undefined;
  const handle = {
    get capture(): WarningCapture | undefined {
      return capture;
    },
  };

  beforeAll(() => {
    capture = captureWarnings();
  });

  afterAll(() => {
    capture?.restore();
  });

  return handle;
}

/**
 * 同时提供默认导出 —— 上游 `tests/shared/excludeWarning.ts` 是默认导出，
 * 保留它可以让「从 antd 迁移」时按原样 `import excludeAllWarning from '…'` 继续工作。
 */
export default excludeAllWarning;

/**
 * 把采集到的告警按豁免切分成「未豁免的」与「用到的豁免」。
 *
 * **纯函数**，不依赖任何测试框架 —— 这样「判定逻辑」本身可以被单测覆盖，
 * 而不是只能在某个组件的 `demoTest` 失败时才被执行到。
 *
 * @param records  采集到的告警。
 * @param allowances 允许的告警。**可以为空数组**（表示一条都不允许）。
 */
export function partitionWarnings(
  records: readonly WarningRecord[],
  allowances: readonly WarningAllowance[],
): { unexpected: string[]; used: WarningAllowance[] } {
  const used = new Set<WarningAllowance>();
  const unexpected: string[] = [];

  for (const record of records) {
    const hit = allowances.find((allowance) => record.text.includes(allowance.match));
    if (hit) used.add(hit);
    else unexpected.push(`[${record.method}] ${record.text}`);
  }

  // 保持 allowances 的原始顺序（`used` 是 Set，顺序按插入）。
  return { unexpected, used: allowances.filter((allowance) => used.has(allowance)) };
}

/**
 * 断言「采集到的告警全部被豁免覆盖」，且「每条豁免都被用到了」。
 *
 * 第二条同样重要：**没人用的豁免会腐烂**。它当初对应的告警一旦消失，
 * 豁免就变成了一张无期限的通行证，日后同样的告警再出现时会被静默放过。
 * 让「未使用的豁免」失败，等于让豁免带上保质期。
 *
 * @param records  采集到的告警。
 * @param allowances 允许的告警。
 * @param context  出错信息里的定位串。
 */
export function assertNoUnexpectedWarnings(
  records: readonly WarningRecord[],
  allowances: readonly WarningAllowance[] | undefined,
  context: string,
): void {
  assertAllowances(allowances, context);
  const list = allowances ?? [];
  const { unexpected, used } = partitionWarnings(records, list);

  if (unexpected.length > 0) {
    throw new Error(
      `[test-utils] ${context}：出现 ${unexpected.length} 条未豁免的告警。\n` +
        unexpected.map((text) => `  · ${text}`).join('\n') +
        '\n  处理顺序（TESTING.md §4.2）：修实现 → 修 Token → 修测试 → 登记差异。' +
        '\n  确实需要放过时，走 allow: [{ match, reason, deviationId? }]，且 reason 不得为空。',
    );
  }

  const stale = list.filter((allowance) => !used.includes(allowance));
  if (stale.length > 0) {
    throw new Error(
      `[test-utils] ${context}：有 ${stale.length} 条豁免**没有被任何告警命中**。\n` +
        stale.map((allowance) => `  · match="${allowance.match}"`).join('\n') +
        '\n  未使用的豁免会腐烂成通行证：对应的告警消失后它仍然放行，' +
        '日后同样的告警再出现时会被静默放过。请删除它，或修正 match。',
    );
  }
}

export { resetDevWarned, resetWarned };
