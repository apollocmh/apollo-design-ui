/**
 * antd 侧的 `Drawer` —— `components/drawer/Drawer.tsx`（369 行）的 Vue 版（壳）。
 *
 * 职责：把 antd 的语义（尺寸预设 / mask 合并 / zIndex / 焦点 / 语义槽 / 9 条 deprecated）
 * 翻译成 rc 内核的 props，并把 `DrawerPanel` 作为 children 传进去。
 *
 * 逐条对齐上游：
 *   1. `defaultSize = 378`（**垂直方位的默认值就是靠它**，rc 的 378 兜底只管水平方位）；
 *   2. `drawerSize`：number 原样；`'large'` ⇒ 736；`'default'` ⇒ 378；
 *      纯数字字符串 ⇒ Number；其他字符串原样；否则取 `width`/`height`（按方位）；
 *   3. `ariaId = isRenderable(title) ? id : undefined`（标题才挂 `aria-labelledby` 的目标）；
 *   4. `getContainer`：`customizeGetContainer === undefined && getPopupContainer`
 *      ⇒ `() => getPopupContainer(document.body)`；否则用用户的（**可能是 `false`**）；
 *   5. `mask` 走 `useMergedMask`（props > `maskClosable` > context > true）；
 *   6. 焦点：`focusable = { ...contextFocusable, ...props.focusable }`，
 *      第二参（是否可聚焦）是 `getContainer !== false && mergedMask`；
 *   7. `zIndex` 走 `useZIndex('Drawer', props.zIndex)`；
 *   8. 根类叠加 `no-mask`（`!mask`）与 `-rtl`（`direction === 'rtl'`）；
 *   9. **9 条 deprecated 告警**（dev）：headerStyle / bodyStyle / footerStyle /
 *      contentWrapperStyle / maskStyle / drawerStyle / destroyInactivePanel / width / height
 *      （+ `classNames.content`/`styles.content` ⇒ `section`、`style.position: absolute` 的 breaking 提示）。
 */
import { useZIndex } from '@apollo-design/portal';
import { isNumber, isRenderable, useId } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, type VNodeChild } from 'vue';

import { useComponentConfig } from '../config-provider/context';
import DrawerPanel from './DrawerPanel';
import RcDrawer from './engine/Drawer';
import { type MaskType, useMergedMask } from './hooks/useMergedMask';
import type {
  DrawerPlacement,
  DrawerResizableConfig,
  DrawerSize,
  FocusableConfig,
  PushState,
} from './interface';

const DEFAULT_SIZE = 378;
const DEFAULT_PUSH_STATE: PushState = { distance: 180 };
const MOTION_CONFIG = {
  motionAppear: true,
  motionEnter: true,
  motionLeave: true,
  motionDeadline: 500,
} as const;

export default defineComponent({
  name: 'ADrawer',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    open: { type: Boolean, default: false },
    placement: { type: String as PropType<DrawerPlacement>, default: 'right' },
    size: { type: [String, Number] as PropType<DrawerSize>, default: undefined },
    /** ⚠️ 默认 378：**垂直方位的默认值就是它**。 */
    defaultSize: { type: Number, default: DEFAULT_SIZE },
    width: { type: [String, Number] as PropType<string | number>, default: undefined },
    height: { type: [String, Number] as PropType<string | number>, default: undefined },
    mask: { type: [Boolean, Object] as PropType<MaskType>, default: undefined },
    maskClosable: { type: Boolean, default: undefined },
    push: {
      type: [Boolean, Object] as PropType<boolean | PushState>,
      default: DEFAULT_PUSH_STATE,
    },
    afterOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    onClose: { type: Function as PropType<(e: Event) => void>, default: undefined },
    getContainer: {
      type: [String, Boolean, Function, Object] as PropType<unknown>,
      default: undefined,
    },
    panelRef: { type: [Object, Function] as PropType<unknown>, default: null },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    rootStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    resizable: {
      type: [Boolean, Object] as PropType<boolean | DrawerResizableConfig>,
      default: undefined,
    },
    focusable: { type: Object as PropType<FocusableConfig>, default: undefined },
    zIndex: { type: Number, default: undefined },
    'aria-labelledby': { type: String, default: undefined },
    // 面板侧
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    footer: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    extra: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    closable: { type: [Boolean, Object, null] as unknown as PropType<unknown>, default: undefined },
    closeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    loading: { type: Boolean, default: false },
    classNames: {
      type: Object as PropType<Record<string, string | undefined>>,
      default: undefined,
    },
    styles: {
      type: Object as PropType<Record<string, Record<string, unknown> | undefined>>,
      default: undefined,
    },
    // deprecated
    maskStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    drawerStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    contentWrapperStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    headerStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    bodyStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    footerStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    destroyOnClose: { type: Boolean, default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
    keyboard: { type: Boolean, default: true },
    autoFocus: { type: Boolean, default: true },
    focusTriggerAfterClose: { type: Boolean, default: undefined },
    forceRender: { type: Boolean, default: false },
  },
  setup(props, { attrs, slots }) {
    const config = useComponentConfig('drawer');
    const prefixCls = props.prefixCls || config.getPrefixCls('drawer');
    const id = useId();
    const ariaId = isRenderable(props.title) ? id : undefined;

    const getContainer = computed<unknown>(() =>
      props.getContainer === undefined && config.getPopupContainer
        ? () => (config.getPopupContainer as (el: HTMLElement) => HTMLElement)(document.body)
        : props.getContainer,
    );

    // ============================ Size ============================
    const drawerSize = computed<string | number | undefined>(() => {
      const { size, placement } = props;
      if (isNumber(size)) return size;
      if (size === 'large') return 736;
      if (size === 'default') return DEFAULT_SIZE;
      if (typeof size === 'string') {
        return /^\d+(\.\d+)?$/.test(size) ? Number(size) : size;
      }
      const horizontal = !placement || placement === 'left' || placement === 'right';
      return horizontal ? props.width : props.height;
    });

    // ============================ Mask ============================
    const mask = useMergedMask(
      () => props.mask,
      () => (config as { mask?: MaskType }).mask,
      () => prefixCls,
      () => props.maskClosable,
    );

    // =========================== zIndex ===========================
    const zIndex = useZIndex('Drawer', () => props.zIndex);

    // ========================== Focusable =========================
    const mergedFocusable = computed<FocusableConfig>(() => ({
      ...((config as { focusable?: FocusableConfig }).focusable ?? {}),
      ...(props.focusable ?? {}),
    }));
    const focusTrapEnabled = computed(() => getContainer.value !== false && mask.enabled.value);

    // =========================== Motion ===========================
    const maskMotion = { motionName: `${prefixCls}-mask-motion`, ...MOTION_CONFIG };
    const panelMotion = (motionPlacement: string) => ({
      motionName: `${prefixCls}-panel-motion-${motionPlacement}`,
      ...MOTION_CONFIG,
    });

    // ========================== Warning ===========================
    if (process.env.NODE_ENV !== 'production') {
      const deprecated: Array<[unknown, string]> = [
        [props.headerStyle, 'styles.header'],
        [props.bodyStyle, 'styles.body'],
        [props.footerStyle, 'styles.footer'],
        [props.contentWrapperStyle, 'styles.wrapper'],
        [props.maskStyle, 'styles.mask'],
        [props.drawerStyle, 'styles.section'],
        [props.destroyOnClose, 'destroyOnHidden'],
        [props.width, 'size'],
        [props.height, 'size'],
      ];
      for (const [value, replacement] of deprecated) {
        if (value !== undefined) {
          // eslint-disable-next-line no-console
          console.warn(
            `[Apollo Design] \`Drawer\`: \`${String(value)}\` 已废弃，请用 \`${replacement}\`。`,
          );
        }
      }
    }

    return () => {
      const cn = props.classNames ?? {};
      const st = props.styles ?? {};

      const drawerClassName = [
        !mask.enabled.value ? 'no-mask' : undefined,
        config.direction === 'rtl' ? `${prefixCls}-rtl` : undefined,
        props.rootClassName,
      ]
        .filter(Boolean)
        .join(' ');

      return h(
        RcDrawer,
        {
          ...(attrs as Record<string, unknown>),
          prefixCls,
          open: props.open,
          placement: props.placement,
          autoFocus: props.autoFocus,
          keyboard: props.keyboard,
          mask: mask.enabled.value,
          maskClosable: mask.closable.value,
          getContainer: getContainer.value,
          // ⚠️ rc 的判据就是「容器是 false」⇒ 加 `-inline` 类（CSS 里它把 position 从 fixed 改成 absolute）
          inline: getContainer.value === false,
          forceRender: props.forceRender,
          afterOpenChange: props.afterOpenChange,
          destroyOnHidden: props.destroyOnHidden ?? props.destroyOnClose,
          onClose: props.onClose,
          panelRef: props.panelRef,
          zIndex: zIndex.value,
          rootClassName: drawerClassName || undefined,
          rootStyle: { ...props.rootStyle },
          className: props.className,
          style: props.style,
          maskMotion,
          motion: panelMotion,
          resizable: props.resizable,
          size: drawerSize.value,
          defaultSize: props.defaultSize,
          maxSize: undefined,
          classNames: {
            mask: [cn.mask, mask.classNames.value.mask].filter(Boolean).join(' ') || undefined,
            section: cn.section,
            wrapper: cn.wrapper,
            dragger: cn.dragger,
          },
          styles: {
            mask: { ...st.mask, ...props.maskStyle },
            section: st.section,
            wrapper: { ...st.wrapper, ...props.contentWrapperStyle },
            dragger: st.dragger,
          },
          'aria-labelledby': props['aria-labelledby'] ?? ariaId,
          focusTrap: focusTrapEnabled.value,
          focusTriggerAfterClose: mergedFocusable.value.focusTriggerAfterClose,
          autoLock: mask.enabled.value,
        } as never,
        {
          default: () =>
            h(
              DrawerPanel,
              {
                prefixCls,
                ariaId,
                title: props.title,
                footer: props.footer,
                extra: props.extra,
                closable: props.closable as never,
                closeIcon: props.closeIcon,
                onClose: props.onClose,
                classNames: cn,
                styles: st,
                loading: props.loading,
                headerStyle: props.headerStyle,
                bodyStyle: props.bodyStyle,
                footerStyle: props.footerStyle,
              } as never,
              { default: () => slots.default?.() },
            ),
        },
      );
    };
  },
});
