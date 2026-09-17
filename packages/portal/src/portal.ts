/**
 * `Portal` 组件 —— `Portal.js` 的 Vue 版。
 *
 * 与 React 版的差异只有两处，且都是「同一个语义的另一种写法」：
 *
 * | React | Vue |
 * |---|---|
 * | `renderInline ? children : createPortal(children, container)` | `<Teleport :to="container" :disabled="inline">` |
 * | `OrderContext.Provider` 包在 createPortal 外面 | provide 在 `usePortalContainer` 里，组件不需要额外包一层 |
 *
 * ⚠️ 有一处是**照抄噪音、不要顺手优化**：`innerContainer === false` 时
 * `useDom` 的 render 判据是 `mergedRender && !innerContainer`，`!false` 为真
 * ⇒ antd 仍然会创建一个空的默认容器并 append 到 body，尽管此时走的是内联渲染、
 * 那个容器根本不会被用到。我们没有改它（改了就是与上游的 DOM 差异），
 * 但用 `portal.test.ts` 里的用例钉住，避免后人当 bug 修掉。
 */

import { canUseDom, devUseWarning, isDev } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, Teleport } from 'vue';

import type { GetContainer } from './container';
import { portalInlineMock } from './mock';
import { usePortalContainer } from './use-portal';

export const Portal = defineComponent({
  name: 'Portal',
  props: {
    /** 是否显示。`false` 时内容依 `autoDestroy` 决定是否卸载 */
    open: { type: Boolean, default: false },
    /** 关闭后是否卸载内容 */
    autoDestroy: { type: Boolean, default: true },
    /**
     * 容器来源。见 `GetContainer` 的四种形态。
     *
     * ⚠️ 这里接受的是 **spec 本体**（antd 的写法，最常见的形态就是 `() => el`），
     *    不是「返回 spec 的 getter」—— 传给 `usePortalContainer` 时才包那层 getter，
     *    这样每次 update 都能读到最新的 prop。
     */
    getContainer: {
      type: [String, Boolean, Function, Object] as PropType<GetContainer>,
      default: undefined,
    },
    /** dev 下给默认容器打 `data-debug` */
    debug: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    if (isDev) {
      // `Portal.js:40-42`
      devUseWarning('Portal')(
        canUseDom() || !props.open,
        "Portal only work in client side. Please call 'useEffect' to show Portal instead default render in SSR.",
      );
    }

    const { container, shouldRender } = usePortalContainer({
      open: () => props.open,
      autoDestroy: props.autoDestroy,
      // 始终传 getter —— 让 `reResolveContainer` 每次都能读到最新的 prop。
      // ⚠️ 不能写成 `getContainer: props.getContainer`：那会把 spec（可能是一个函数）
      //    在 setup 时就固化下来。
      getContainer: () => props.getContainer,
      ...(props.debug !== undefined ? { debug: props.debug } : {}),
    });

    /** `Portal.js:83` —— `mergedContainer === false || inlineMock()` */
    const inline = computed(() => container.value === false || portalInlineMock());

    /**
     * Vue 的 `to` 声明为 `RendererElement`（DOM 下即 `Element`），但 Teleport 在运行时
     * 对 ShadowRoot 同样有效（`resolveTarget` 只对 string 做特殊处理）。
     * 这里把 `Element | ShadowRoot` 收窄到其中一个成员 —— 是联合收窄，不是 `as any`。
     */
    const teleportTo = computed<Element | null>(() => {
      const c = container.value;
      if (inline.value || c === null || c === false) return null;
      return c as Element;
    });

    return () => {
      // `Portal.js:78-80`
      if (!shouldRender.value) return null;
      // `h` 对 `typeof Teleport` 有专门重载，children 是**必填**参数 ⇒ 没有 slot 时传 `[]`
      return h(Teleport, { to: teleportTo.value, disabled: inline.value }, slots.default?.() ?? []);
    };
  },
});
