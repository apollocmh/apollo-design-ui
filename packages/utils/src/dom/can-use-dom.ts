/**
 * `canUseDom` —— 当前是否有一个可用的 DOM。
 *
 * 契约来源：`@rc-component/util/Dom/canUseDom`。
 *
 * 判定要**同时**满足三件事：有 `window`、有 `window.document`、`document` 能 `createElement`。
 * 只判 `typeof window !== 'undefined'` 是不够的 —— SSR 框架常注入一个残缺的 `window` 全局，
 * 那时 `document` 可能不存在，后续 DOM 操作会抛错。
 */
export default function canUseDom(): boolean {
  return !!(typeof window !== 'undefined' && window.document && window.document.createElement);
}
