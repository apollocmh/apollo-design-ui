/**
 * rc 侧的 `Drawer` —— `@rc-component/drawer@1.4.2` `es/Drawer.js`（129 行）的 Vue 版。
 *
 * 三件上游必做、且容易漏的事：
 *   1. **首帧不开门**：`mergedOpen = mounted ? open : false` —— 上游用
 *      `useLayoutEffect` 置 `mounted`；Vue 侧用 `onMounted`（首次渲染恒 `false`）。
 *      这条是为了避开 SSR / 首帧的 portal 抖动；
 *   2. **焦点还原**：`mergedOpen` 变真时记下 `document.activeElement`；动效结束时
 *      （`afterOpenChange(false)`）若 `focusTriggerAfterClose !== false`
 *      且当前焦点**不在面板内** ⇒ 把焦点还给记下的那个元素（`preventScroll: true`）；
 *   3. **Portal 的三个参数**：`open = mergedOpen || forceRender || animatedVisible`
 *      （动效期间 portal 仍在）、`autoDestroy: false`、`autoLock = mask && (open || animatedVisible)`；
 *      `onEsc` 只在 `top`（自己是最上层）且 `keyboard` 时才关。
 */
import { Portal } from '@apollo-design/portal';
import { defineComponent, h, onMounted, type PropType, provide, ref } from 'vue';

import { drawerRefContextKey } from './context';
import DrawerPopup from './DrawerPopup';

export default defineComponent({
  name: 'ADrawerRc',
  inheritAttrs: false,
  props: {
    open: { type: Boolean, default: false },
    prefixCls: { type: String, default: 'apollo-drawer' },
    placement: { type: String as PropType<'top' | 'right' | 'bottom' | 'left'>, default: 'right' },
    autoFocus: { type: Boolean, default: true },
    keyboard: { type: Boolean, default: true },
    mask: { type: [Boolean, Object] as PropType<unknown>, default: true },
    maskClosable: { type: Boolean, default: true },
    getContainer: {
      type: [String, Boolean, Function, Object] as PropType<unknown>,
      default: undefined,
    },
    forceRender: { type: Boolean, default: false },
    afterOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    destroyOnHidden: { type: Boolean, default: false },
    focusTriggerAfterClose: { type: Boolean, default: undefined },
    onClose: { type: Function as PropType<(e: Event) => void>, default: undefined },
    /** antd 的 `panelRef`（`composeRef(panelRef, innerPanelRef)`）。 */
    panelRef: { type: [Object, Function] as PropType<unknown>, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const mounted = ref(false);
    onMounted(() => {
      mounted.value = true;
    });

    const animatedVisible = ref(false);
    const popupRef = ref<HTMLElement | null>(null);
    const lastActiveRef = ref<HTMLElement | null>(null);

    const internalAfterOpenChange = (nextVisible: boolean): void => {
      animatedVisible.value = nextVisible;
      props.afterOpenChange?.(nextVisible);

      if (
        !nextVisible &&
        props.focusTriggerAfterClose !== false &&
        lastActiveRef.value &&
        !popupRef.value?.contains(lastActiveRef.value)
      ) {
        lastActiveRef.value.focus({ preventScroll: true });
      }
    };

    // ⚠️ `panelRef` 通过 ref-context 透给 DrawerSection（上游的 RefContext）
    provide(drawerRefContextKey, { panel: popupRef });

    return () => {
      const mergedOpen = mounted.value ? props.open : false;

      // 「打开时记下当前焦点」——上游是 useLayoutEffect，Vue 侧在渲染前判一次即可
      if (mergedOpen && typeof document !== 'undefined' && !lastActiveRef.value) {
        lastActiveRef.value = document.activeElement as HTMLElement | null;
      }
      if (!mergedOpen) lastActiveRef.value = null;

      if (!props.forceRender && !animatedVisible.value && !mergedOpen && props.destroyOnHidden) {
        return null;
      }

      return h(
        Portal,
        {
          open: mergedOpen || props.forceRender || animatedVisible.value,
          autoDestroy: false,
          getContainer: props.getContainer as never,
          autoLock: !!props.mask && (mergedOpen || animatedVisible.value),
          onEsc: ({ top, event }: { top: boolean; event: KeyboardEvent }) => {
            if (top && props.keyboard) {
              event.stopPropagation();
              props.onClose?.(event);
            }
          },
        },
        {
          default: () =>
            h(
              DrawerPopup,
              {
                ...(attrs as Record<string, unknown>),
                ...(props as unknown as Record<string, unknown>),
                open: mergedOpen,
                afterOpenChange: internalAfterOpenChange,
                // ⚠️ 组件 vnode 的 ref 拿到的是**实例**不是元素（PITFALLS 174）⇒ 取 $el
                ref: (inst: unknown) => {
                  popupRef.value = ((inst as { $el?: HTMLElement } | null)?.$el ??
                    null) as HTMLElement | null;
                },
              } as never,
              { default: () => slots.default?.() },
            ),
        },
      );
    };
  },
});
