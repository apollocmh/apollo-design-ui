/**
 * Modal `confirm` 的模块级 locale。
 *
 * 契约来源：antd 6.6.4 的 `es/modal/locale.js`（**机械移植**，保留 `localeList` 的栈语义）。
 *
 * ⚠️ 这是**栈式**（不是覆盖式）的：多个 `LocaleProvider` 同时存在时后注册的在上面，
 *    卸载时按注册顺序逐个弹出，每次都从 `defaultLocale.Modal` 重新 `reduce` 重建。
 *
 * ⚠️ `changeConfirmLocale()` **无参调用会重置整个栈** —— 上游的 `else` 分支就是这样。
 *    测试里靠它清理，生产代码不应调用。
 *
 * ⚠️ 数据源是本包的 `en_US.Modal`，但**消费方是 Modal 的运行时**
 *    （`Modal.confirm` 读 `getConfirmLocale()`）。本包只提供数据与这个栈。
 */

import enUS from './locales/en_US';
import type { ModalLocale } from './types';

const defaultModalLocale = enUS.Modal as ModalLocale;

let runtimeLocale: ModalLocale = { ...defaultModalLocale };
let localeList: ModalLocale[] = [];

/**
 * 从栈底往上叠加。
 *
 * ⚠️ 这里的 `reduce + 展开` 是**照抄上游**的写法（`modal/locale.js:8-11`）。
 *    biome 的 `noAccumulatingSpread` 会把它标成性能问题，但：
 *      1. 栈的长度等于「同时挂载的 LocaleProvider 数量」，实际是 1~2；
 *      2. 改成 `Object.assign` 会让「每次重建」的语义变得不那么显式。
 *    所以按 `// biome-ignore` 保留，并在这里写明理由。
 */
function generateLocale(): ModalLocale {
  // biome-ignore lint/performance/noAccumulatingSpread: 照抄上游的栈式重建，栈长度实际是 1~2
  return localeList.reduce<ModalLocale>((merged, locale) => ({ ...merged, ...locale }), {
    ...defaultModalLocale,
  });
}

/**
 * 注册一份 Modal locale。
 *
 * @param newLocale `undefined` 时**重置整个栈**（上游行为）
 * @returns 反注册函数；`newLocale` 为空时返回 `undefined`
 */
export function changeConfirmLocale(newLocale?: ModalLocale): (() => void) | undefined {
  if (newLocale) {
    // 上游会先 clone 一份再入栈 —— 这样调用方后续改动自己的对象不会影响已注册的
    const cloneLocale = { ...newLocale };
    localeList.push(cloneLocale);
    runtimeLocale = generateLocale();

    return () => {
      localeList = localeList.filter((locale) => locale !== cloneLocale);
      runtimeLocale = generateLocale();
    };
  }

  runtimeLocale = { ...defaultModalLocale };
  return undefined;
}

/** 取当前生效的 Modal locale（`Modal.confirm` 用它）。 */
export function getConfirmLocale(): ModalLocale {
  return runtimeLocale;
}

/**
 * 测试辅助：连**栈**一起清空。生产代码不应调用。
 *
 * ⚠️ 为什么需要它（这是一个**跟随的上游缺陷**，登记为 `COMPATIBILITY.md` §9.2.1 的 U 项）：
 *    上游的 `changeConfirmLocale()` 无参分支**只重置 `runtimeLocale`，不动 `localeList`**。
 *    后果是「重置」并不彻底 —— 之后再注册任何一层，`generateLocale()` 会把之前
 *    留在栈里的那些**重新叠加回来**。在 antd 自己的用法里这个分支几乎没被依赖，
 *    但栈会随着挂载/卸载单调增长（内存泄漏 + 语言串台）。
 *
 *    我们**照抄**这个行为（否则与上游分叉），只用这个函数给测试一个干净的起点。
 */
export function resetConfirmLocale(): void {
  localeList = [];
  runtimeLocale = { ...defaultModalLocale };
}
