/**
 * `useDelay` —— 用 raf 把高频回调去抖到「一帧一次」。
 *
 * 契约来源：antd 6.6.4 `es/masonry/hooks/useDelay.js`（19 行）——
 * 它同时用了 `@rc-component/util` 的 `raf` 与 `useEvent`。
 *
 * ```js
 * const idRef = useRef(0);
 * const clearRaf = () => raf.cancel(idRef.current);
 * useEffect(() => clearRaf, []);
 * const triggerFn = useEvent(() => { clearRaf(); idRef.current = raf(callback); });
 * return triggerFn;
 * ```
 *
 * ── 两处平台映射 ─────────────────────────────────────────────────────────────
 *
 * 1. **`raf` / `cancelRaf`** 用本仓 `@apollo-design/utils` 的同名实现
 *    （契约与 `@rc-component/util` 的 `raf` 一致：返回包装 id，可重复调度）。
 * 2. **`useEffect(() => clearRaf, [])`** —— 「卸载时清一次」⇒ Vue 的
 *    `onScopeDispose`。⚠️ 上游返回的是 `clearRaf` 本身（清理函数），
 *    本仓同理只在 scope 销毁时清，**不**在每次调度后清（那是 `trigger` 自己的事）。
 * 3. `useEvent` 在 Vue 里没有对应物 —— 本仓返回的函数身份天然稳定
 *    （`setup` 里只创建一次），不需要 ref 包装。
 *
 * ⚠️ **`callback` 不进闭包快照**：上游的 `useEvent` 保证「读到的永远是最新那次
 * render 的 callback」；本仓直接调 `callback` 参数即可 —— 但调用方必须传
 * **同一个函数实例**（`Masonry.vue` 里是 `setup` 期创建的稳定函数）。
 */

import { cancelRaf, raf } from '@apollo-design/utils';
import { onScopeDispose } from 'vue';

/** 返回一个「调度一次」的触发器；重复调用只保留最后一次。 */
export function useDelay(callback: () => void): () => void {
  let id = 0;

  const clearRaf = (): void => {
    cancelRaf(id);
  };

  onScopeDispose(clearRaf);

  return () => {
    clearRaf();
    id = raf(callback);
  };
}
