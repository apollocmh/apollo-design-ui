/**
 * 导航两侧的附加内容（rc `TabNavList/ExtraContent.js` 的等价物）。
 *
 * 判据（逐字）：
 *   - `extra` 缺失 ⇒ **返回 `null`**（所以 `-extra-content` 只在真有内容时才进 DOM）；
 *   - `extra` 是「对象但**不是**节点」⇒ 当作 `{ left, right }`；
 *   - 否则（节点 / 字符串 / 数组）⇒ 归到 `right`。
 *
 * ⚠️ 第 2、3 条的区分在 Vue 里**必须换判据**：React 用 `isValidElement`，而 Vue 的 VNode
 *    是普通对象。若照抄 `typeof extra === 'object'`，VNode 会被误判成 `{left,right}` 结构
 *    ⇒ **左槽永远为空**。这里用 Vue 的 `isVNode` + `Array.isArray` 切分，行为与上游一致。
 *
 * ⚠️ 父组件要测它的尺寸（`containerExcludeExtraSize = 容器 − 左 extra − 右 extra`），
 *    所以通过 `expose({ getElement })` 交出一个**函数**而不是 ref 本身 ——
 *    函数形态不存在「被代理解包」的歧义。
 */

import { defineComponent, h, isVNode, type PropType, ref, type VNodeChild } from 'vue';
import type { TabsExtraContent } from './interface';

export default defineComponent({
  name: 'ATabsExtraContent',
  props: {
    prefixCls: { type: String, required: true },
    position: { type: String as PropType<'left' | 'right'>, required: true },
    extra: { type: null as unknown as PropType<TabsExtraContent>, default: undefined },
  },
  setup(props, { expose }) {
    const elementRef = ref<HTMLElement | null>(null);

    // 量尺寸用（rc 用 ref 转发同一个 div）
    expose({ getElement: (): HTMLElement | null => elementRef.value });

    return () => {
      const { extra, position, prefixCls } = props;
      if (!extra) return null;

      let assertExtra: { left?: VNodeChild; right?: VNodeChild } = {};
      if (typeof extra === 'object' && !isVNode(extra) && !Array.isArray(extra)) {
        assertExtra = extra as { left?: VNodeChild; right?: VNodeChild };
      } else {
        assertExtra.right = extra as VNodeChild;
      }

      const content = position === 'right' ? assertExtra.right : assertExtra.left;
      if (!content) return null;

      return h(
        'div',
        {
          class: `${prefixCls}-extra-content`,
          ref: (el: unknown) => {
            elementRef.value = (el as HTMLElement | null) ?? null;
          },
        },
        [content],
      );
    };
  },
});
