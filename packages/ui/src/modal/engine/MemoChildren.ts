/**
 * `MemoChildren` —— `@rc-component/dialog@1.10.0` `es/Dialog/Content/MemoChildren.js` 的 Vue 版。
 *
 * 上游：
 * ```js
 * React.memo(({ children }) => children, (_, { shouldUpdate }) => !shouldUpdate)
 * ```
 * 即：**`shouldUpdate` 为假时跳过重渲染**（`visible || forceRender` 为真才更新）。
 *
 * Vue 侧的实现是「缓存 slot 的求值结果」：`!shouldUpdate` 时返回**同一个 vnode 对象**。
 * 这不是取巧 —— Vue 的 `patch` 第一行就是 `if (n1 === n2) return`，
 * 同一个 vnode 引用会被直接跳过，语义与 React 的 memo 一致。
 *
 * ⚠️ 与上游一样，这是**性能**优化，不改变任何可观察的 DOM 契约
 *    （抽屉内核没有这一步，也没有差异）。
 */
import { defineComponent, type VNodeChild } from 'vue';

export default defineComponent({
  name: 'ADialogMemoChildren',
  props: {
    shouldUpdate: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    let cached: VNodeChild = null;

    return () => {
      if (props.shouldUpdate || cached === null) {
        cached = slots.default?.();
      }
      return cached;
    };
  },
});
