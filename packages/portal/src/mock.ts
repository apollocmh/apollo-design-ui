/**
 * 测试用的全局内联开关 —— `mock.js` 的机械移植。
 *
 * antd 的测试靠它把浮层渲染在原地（不走 `createPortal`），便于断言。
 * 这是一个**模块级可变状态**，只在测试里被置 true，用完必须置回 false
 * （否则会污染同文件里的其它用例）。
 *
 * ⚠️ 之所以要照抄而不是「让测试自己传 prop」：有些断言发生在组件树深处，
 *    那里拿不到 Portal 的 props。这是 antd 的既有约定，不是我们的设计选择。
 */

let inline = false;

/** 读取当前开关；传 boolean 时顺带设置（与 antd 的 `inlineMock(nextInline)` 同签名） */
export function portalInlineMock(nextInline?: boolean): boolean {
  if (typeof nextInline === 'boolean') {
    inline = nextInline;
  }
  return inline;
}

/** 重置为关闭。测试 `afterEach` 里调用。 */
export function resetPortalInlineMock(): void {
  inline = false;
}
