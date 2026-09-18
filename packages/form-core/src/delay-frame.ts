/**
 * 等「一个宏任务 + 一帧」再继续（批次 ③a）。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/utils/delayUtil.js`（11 行）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.7.6。
 *
 * ⭐ 用途只有一个：`triggerDependenciesUpdate` 里对子字段调
 * `validateFields(childrenFields, { delayFrame: true })` —— 上游注释写得很清楚，
 * 「延迟是为了避免 `useWatch` 动态调整的 rules 拿不到最新值」。
 * 即：依赖项变化后，子字段的 `rules` 可能是在**渲染期**由 `useWatch` 算出来的，
 * 必须等这一帧渲染完成，校验才拿得到新规则。
 *
 * ⚠️ 顺序不能反：先宏任务（让同步批次结束）再 `raf`（让渲染帧完成）。
 * 反过来的话 `raf` 可能落在**同一个**渲染帧里，等不到新 rules。
 */

import { raf } from '@apollo-design/utils';

import { macroTask } from './watcher-center';

export default function delayFrame(): Promise<void> {
  return new Promise((resolve) => {
    macroTask(() => {
      raf(() => {
        resolve();
      });
    });
  });
}
