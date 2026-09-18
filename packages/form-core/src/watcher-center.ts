/**
 * `useWatch` 的通知中心（批次 ③a）。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/hooks/useNotifyWatch.js`（47 行）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.7.9。
 *
 * ⭐ 它解决两个问题：
 *   1. **批量**：一次 store 变更里可能 `notifyWatch` 多次（`updateValue` 一次、
 *      `setFields` 收尾一次…），用「宏任务 + taskId 守卫」合并成**一次**回调；
 *   2. **去重**：同一批里重复的 namePath 用 `matchNamePath` 去重（顺序保留）。
 *
 * ⚠️ 与 React 的关系：上游用 `MessageChannel` 而不是 `setTimeout` —— 宏任务的
 * 投递时机不同（`MessageChannel` 在渲染之后的宏任务队列里更早）。**照抄，不换**。
 */

import type { InternalFormInstance, InternalNamePath, WatchCallBack } from './form-types';
import { matchNamePath } from './value-util';

/**
 * 在**宏任务**里执行 `fn`。
 *
 * ⭐ 为什么用 `MessageChannel` 而不是 `setTimeout(fn, 0)`：`setTimeout` 的最小延迟
 * 在浏览器里是 4ms（嵌套 ≥5 层时），而 `MessageChannel` 没有这个钳制。
 * 上游选它就是为了让 `useWatch` 的更新**尽快**且**仍晚于当前同步批次**。
 */
export const macroTask = (fn: () => void): void => {
  const channel = new MessageChannel();
  channel.port1.onmessage = fn;
  channel.port2.postMessage(null);
};

/**
 * `WatcherCenter` 需要的 form 侧能力。
 *
 * ⚠️ 用最小接口而不是 `FormStore`：避免 `form-store.ts` ↔ `watcher-center.ts`
 * 的**循环导入**（`FormStore` 构造时 `new WatcherCenter(this)`）。
 */
export interface WatchFormProvider {
  getForm: () => InternalFormInstance;
}

export default class WatcherCenter {
  /** 本批次内待通知的路径（去重后）。 */
  namePathList: InternalNamePath[] = [];

  /** 批次号。⭐ 只有「最新批次」的宏任务才会真正执行。 */
  taskId = 0;

  watcherList = new Set<WatchCallBack>();

  form: WatchFormProvider;

  constructor(form: WatchFormProvider) {
    this.form = form;
  }

  /** 注册一个 watcher，返回取消函数。 */
  register(callback: WatchCallBack): () => void {
    this.watcherList.add(callback);
    return () => {
      this.watcherList.delete(callback);
    };
  }

  /** 记下路径（按 `matchNamePath` 去重）并安排一次批量通知。 */
  notify(namePath: InternalNamePath[]): void {
    namePath.forEach((path) => {
      if (this.namePathList.every((exist) => !matchNamePath(exist, path))) {
        this.namePathList.push(path);
      }
    });
    this.doBatch();
  }

  doBatch(): void {
    this.taskId += 1;
    const currentId = this.taskId;
    macroTask(() => {
      // ⭐ 两个守卫：批次已过期（currentId 落后）或没有 watcher 时**什么都不做**。
      //    注意此时 `namePathList` 也**不清空** —— 它会留给下一个有效批次，
      //    与上游一致（上游同样只在成功执行后清空）。
      if (currentId === this.taskId && this.watcherList.size) {
        const formInst = this.form.getForm();
        const values = formInst.getFieldsValue();
        const allValues = formInst.getFieldsValue(true);
        this.watcherList.forEach((callback) => {
          callback(values, allValues, this.namePathList);
        });
        this.namePathList = [];
      }
    });
  }
}
