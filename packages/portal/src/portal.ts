/**
 * Vue Teleport wrapper with explicit inline/container semantics, scroll locking and ESC handling.
 * Historical source analysis: docs/foundation/portal-contract.md.
 * Inline rendering leaves no unused default container in document.body.
 */

import { canUseDom, devUseWarning, isDev } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, Teleport } from 'vue';

import type { GetContainer } from './container';
import { portalInlineMock } from './mock';
import { type EscInfo, useWindowEscKeyDown } from './use-esc-key-down';
import { usePortalContainer } from './use-portal';
import { usePortalDocument } from './use-portal-document';
import { useDocumentScrollLocker } from './use-scroll-locker';

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
    /**
     * 锁 body 滚动（`useScrollLocker`）。rc-drawer / rc-dialog 用它：
     * `autoLock = mask && (open || animatedVisible)`。
     */
    autoLock: { type: Boolean, default: false },
    /**
     * ESC 回调（全局层栈，`useEscKeyDown`）。
     * 回调参数带 `top`：自己是不是最上层 —— 多层浮层同时打开时只有最上层该响应。
     */
    onEsc: { type: Function as PropType<(info: EscInfo) => void>, default: undefined },
  },
  setup(props, { slots }) {
    if (isDev) {
      // `Portal.js:40-42`
      devUseWarning('Portal')(
        canUseDom() || !props.open,
        'Portal requires a client-side container. Open it after onMounted() when using SSR.',
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
    const ownerDocument = usePortalDocument(
      () => container.value,
      () => inline.value,
      () => props.open && (props.autoLock || !!props.onEsc),
    );
    useDocumentScrollLocker(() => props.autoLock && props.open, ownerDocument);
    useWindowEscKeyDown(
      () => props.open && !!props.onEsc,
      (info) => props.onEsc?.(info),
      () => ownerDocument.value?.defaultView ?? null,
    );

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
