/**
 * `updateCSS` / `removeCSS` —— 动态样式的幂等注入与移除。
 *
 * 契约（`@rc-component/util` `es/Dom/dynamicCSS.js` 的**最小可用子集**，
 * 差异已登记在源码文件头）：
 *   1. 同 key 重复调用 ⇒ **同一个** `<style>` 元素，内容被覆盖；
 *   2. 不同 key ⇒ 各自一个元素；
 *   3. 移除后再注入 ⇒ 新建元素；
 *   4. 元素被外部从 DOM 摘掉后再更新 ⇒ 重新挂上（不抛错）；
 *   5. 移除不存在的 key ⇒ 静默返回。
 */
import { afterEach, describe, expect, it } from 'vitest';

import { removeCSS, resetCSSCache, updateCSS } from '../update-css';

const styles = () => Array.from(document.head.querySelectorAll('style[data-apollo-css-key]'));

afterEach(() => {
  for (const el of styles()) el.remove();
  resetCSSCache();
});

describe('updateCSS / removeCSS', () => {
  it('同 key 幂等：同一个元素，内容覆盖', () => {
    updateCSS('html body { overflow-y: hidden; }', 'k1');
    const first = styles();
    expect(first).toHaveLength(1);
    expect(first[0]!.textContent).toContain('overflow-y: hidden');

    updateCSS('html body { overflow-y: hidden; width: 10px; }', 'k1');
    const second = styles();
    expect(second).toHaveLength(1);
    expect(second[0]).toBe(first[0]);
    expect(second[0]!.textContent).toContain('width: 10px');
  });

  it('不同 key ⇒ 两个元素；移除一个不影响另一个', () => {
    updateCSS('a{}', 'k1');
    updateCSS('b{}', 'k2');
    expect(styles()).toHaveLength(2);

    removeCSS('k1');
    expect(styles()).toHaveLength(1);
    expect(styles()[0]!.textContent).toBe('b{}');
  });

  it('移除后再注入 ⇒ 新建元素', () => {
    updateCSS('a{}', 'k1');
    const first = styles()[0]!;
    removeCSS('k1');
    updateCSS('a{}', 'k1');
    expect(styles()[0]).not.toBe(first);
  });

  it('元素被外部摘掉后再更新 ⇒ 重新挂上', () => {
    updateCSS('a{}', 'k1');
    styles()[0]!.remove();
    expect(styles()).toHaveLength(0);

    updateCSS('b{}', 'k1');
    expect(styles()).toHaveLength(1);
    expect(styles()[0]!.textContent).toBe('b{}');
  });

  it('移除不存在的 key ⇒ 静默返回', () => {
    expect(() => removeCSS('nope')).not.toThrow();
  });

  it('可指定容器', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    updateCSS('a{}', 'k1', container);
    expect(container.querySelector('style[data-apollo-css-key]')).not.toBeNull();
    container.remove();
  });
});
