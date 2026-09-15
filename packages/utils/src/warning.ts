/**
 * 告警体系。
 *
 * 契约来源：`@rc-component/util/warning`（语义 1:1）+ antd `es/_util/warning.js`（组件名前缀层）。
 *
 * 为什么这一层必须逐字对齐：
 *   测试会断言告警文本（antd 自己的测试就大量这么做）。
 *   如果前缀格式、去重范围、`preMessage` 链的行为有偏差，
 *   所有「警告一致性」测试都会假通过或假失败 —— 这比没有测试更糟。
 *
 * 全部输出都是 dev-only。
 */

import { isDev } from './env';

/* eslint-disable no-console */

export type PreMessageFn = (
  message: string,
  type: 'warning' | 'note',
) => string | null | undefined | number;

/**
 * 告警前处理链。
 *
 * 是**累加**的数组（不是"设置一个"），按注册顺序 reduce。
 * 任一环节返回 falsy（`null` / `''` / `0`）即**阻止输出**。
 */
const preWarningFns: PreMessageFn[] = [];

/** 注册一个告警前处理函数。 */
export function preMessage(fn: PreMessageFn): void {
  preWarningFns.push(fn);
}

/** 已告警过的消息集合（`warningOnce` / `noteOnce` 去重用）。 */
let warned: Record<string, boolean> = {};

/** 清空去重表。测试之间必须调用，否则会互相污染。 */
export function resetWarned(): void {
  warned = {};
}

/**
 * 清空 `preMessage` 链。
 *
 * ⚠️ 这是**内部辅助**，刻意不导出到包的公开入口（`src/index.ts`）。
 *    存在的唯一理由是：`preWarningFns` 是模块级累加数组，测试无法通过其它方式隔离。
 *    rc-util 没有提供这个能力，导致它的 `preMessage` 测试必须依赖执行顺序 —— 我们不接受这种脆弱性。
 */
export function resetPreMessage(): void {
  preWarningFns.length = 0;
}

function applyPreMessage(
  message: string,
  type: 'warning' | 'note',
): string | number | null | undefined {
  return preWarningFns.reduce<string | number | null | undefined>(
    (msg, fn) => fn(String(msg ?? ''), type),
    message,
  );
}

/**
 * 条件不满足时输出 `Warning: <message>`。
 *
 * @example
 * warning(false, 'some error'); // 输出
 * warning(true, 'some error');  // 静默
 */
export function warning(valid: boolean, message: string): void {
  if (!isDev || valid || typeof console === 'undefined') return;
  const finalMessage = applyPreMessage(message, 'warning');
  if (finalMessage) {
    console.error(`Warning: ${finalMessage}`);
  }
}

/** 同 {@link warning}，但输出 `Note: <message>` 到 `console.warn`。 */
export function note(valid: boolean, message: string): void {
  if (!isDev || valid || typeof console === 'undefined') return;
  const finalMessage = applyPreMessage(message, 'note');
  if (finalMessage) {
    console.warn(`Note: ${finalMessage}`);
  }
}

/**
 * 去重调用：同一条 message 只执行一次 `method`。
 *
 * 去重表是**按 message 文本**索引的，与组件无关 —— 所以两条不同组件产生相同文本时只会告警一次。
 * 这是 rc-util 的真实行为，测试会依赖它。
 */
export function call(
  method: (valid: boolean, message: string) => void,
  valid: boolean,
  message: string,
): void {
  if (!valid && !warned[message]) {
    method(false, message);
    warned[message] = true;
  }
}

/** 同 {@link warning}，但同一条消息只告警一次。 */
export function warningOnce(valid: boolean, message: string): void {
  call(warning, valid, message);
}

/** 同 {@link note}，但同一条消息只提示一次。 */
export function noteOnce(valid: boolean, message: string): void {
  call(note, valid, message);
}

/**
 * 默认导出 = `warningOnce`，且必须挂上三个静态属性。
 *
 * 为什么不能省：antd 的 `_util/warning.js` 是这样用的 ——
 *   `import { warning as rcWarning } from '@rc-component/util'`
 *   `const { resetWarned } = rcWarning`
 * 也就是说它读的是**默认导出对象上的静态属性**，不是具名导出。
 * 少一个属性就会在运行时抛 `resetWarned is not a function`。
 */
const warningDefault = warningOnce as typeof warningOnce & {
  preMessage: typeof preMessage;
  resetWarned: typeof resetWarned;
  noteOnce: typeof noteOnce;
};
warningDefault.preMessage = preMessage;
warningDefault.resetWarned = resetWarned;
warningDefault.noteOnce = noteOnce;

export default warningDefault;
