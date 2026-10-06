/**
 * 动态注入 / 移除 CSS —— `@rc-component/util` 的 `Dom/dynamicCSS.ts`（`updateCSS` / `removeCSS`）
 * 的**最小可用子集**。
 *
 * 契约来源：`@rc-component/util@1.13.0` `es/Dom/dynamicCSS.js`。
 * 消费方：`@apollo-design/portal` 的 `useScrollLocker`（drawer / modal 的滚动锁）。
 *
 * ⚠️ 与上游的**有意差异**（登记为 deviation，类型 INTENDED）：
 *   rc-util 的版本还带 `data-rc-order` / `data-rc-priority` 排序、CSP nonce 注入、
 *   `containerCache`（按容器缓存）与 shadow-root 兼容 —— 那是为 cssinjs 的**大量**
 *   动态样式准备的。本仓是零运行时架构（组件样式是构建期静态 CSS），运行期只需要
 *   「按 key 注入一条规则、用完删掉」这一件事。
 *   ⇒ 这里只实现：**按 key 幂等注入 + 内容覆盖 + 按 key 移除**，行为与上游在这三件事上一致。
 *
 * 关键行为（与上游逐条对齐，测试钉住）：
 *   1. 同 key 重复调用 ⇒ **同一个 `<style>` 元素**，内容被覆盖（不追加新的）；
 *   2. 移除后再注入 ⇒ 新建元素（缓存里已删）；
 *   3. 元素被外部从 DOM 摘掉后再更新 ⇒ 重新挂上（不抛错）。
 */

/** key ⇒ 已注入的 `<style>` 元素。 */
const styleCache = new Map<string, HTMLStyleElement>();

/**
 * 注入（或更新）一段 CSS。
 *
 * @param css 样式文本
 * @param key 幂等键（同 key 覆盖）
 * @param container 挂载点，默认 `document.head`
 */
export function updateCSS(
  css: string,
  key: string,
  container?: HTMLElement,
): HTMLStyleElement | null {
  if (typeof document === 'undefined') return null;

  const target = container ?? document.head;
  let style = styleCache.get(key);

  // 元素被外部摘掉（或从没建过）⇒ 重建，保证「注入后一定在 DOM 里」
  if (!style?.isConnected) {
    style = document.createElement('style');
    style.setAttribute('data-apollo-css-key', key);
    styleCache.set(key, style);
  }

  if (style.textContent !== css) {
    style.textContent = css;
  }
  if (!style.isConnected) {
    target.appendChild(style);
  }

  return style;
}

/** 按 key 移除（不存在时静默返回 —— 上游同样不抛）。 */
export function removeCSS(key: string): void {
  const style = styleCache.get(key);
  if (!style) return;

  style.parentNode?.removeChild(style);
  styleCache.delete(key);
}

/** 测试辅助：清空缓存（⚠️ 只给测试用 —— 生产里会留下未移除的样式元素）。 */
export function resetCSSCache(): void {
  styleCache.clear();
}
