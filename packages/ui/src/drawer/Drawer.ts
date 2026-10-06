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
import { isEmptyVNode, isNumber, isRenderable, useId } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType } from 'vue';

import { type MaskType, useMergedMask } from '../_internal/use-merged-mask';
import { useComponentConfig } from '../config-provider/context';
import DrawerPanel from './DrawerPanel';
import RcDrawer from './engine/Drawer';
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
    rootStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    resizable: {
      type: [Boolean, Object] as PropType<boolean | DrawerResizableConfig>,
      default: undefined,
    },
    focusable: { type: Object as PropType<FocusableConfig>, default: undefined },
    zIndex: { type: Number, default: undefined },
    'aria-labelledby': { type: String, default: undefined },
    // 面板侧
    // ⚠️ C8-R2：原 `footer` / `extra` / `closeIcon` 是 React 式 VNode prop，已删除改为
    //    同名 slot（`#footer` / `#extra` / `#closeIcon`，slot 在前，空 slot 等价隐藏）；
    //    `title` 收窄为 String（富标题走 `#title` slot，slot 优先）。内部 `DrawerPanel`
    //    仍收 VNode prop（见其文件头注释），本组件把 slot / prop 归一后透传。
    title: { type: String, default: undefined },
    closable: { type: [Boolean, Object, null] as unknown as PropType<unknown>, default: undefined },
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

    // ============ slot：ReactNode / render prop 的唯一入口（规则 C8-R2）============
    /**
     * 读一个 slot；「提供了但渲染为空」归一为 null（语义：隐藏），「未提供」为
     * undefined。判空必须走 `isEmptyVNode` —— Vue 会把 slot 返回的 null / 空数组
     * 归一成 comment vnode，不能比 `null` / `length`（is.ts §空渲染判据）。
     */
    const readSlot = (name: string): unknown => {
      const fn = (slots as Record<string, unknown>)[name];
      if (typeof fn !== 'function') return undefined;
      const nodes = (fn as (...args: unknown[]) => unknown)();
      if (nodes === undefined) return undefined;
      return isEmptyVNode(nodes) ? null : nodes;
    };

    // title：slot 优先，未提供才回退 String prop
    const mergedTitle = (): unknown => {
      const t = readSlot('title');
      if (t !== undefined) return t;
      return props.title;
    };
    const mergedFooter = (): unknown => readSlot('footer');
    const mergedExtra = (): unknown => readSlot('extra');
    const mergedCloseIcon = (): unknown => readSlot('closeIcon');

    // 标题（来自 slot 或 String prop）存在才挂 aria-labelledby
    const titleSlot = readSlot('title');
    const hasTitle = titleSlot !== undefined ? titleSlot !== null : isRenderable(props.title);
    const ariaId = hasTitle ? id : undefined;

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
      ]
        .filter(Boolean)
        .join(' ');

      // ⚠️ 末尾显式写了 className / style，但展开进来的 `class` / `style` 键仍在
      //    ⇒ 会把它们摘掉，避免 `class` 与 `className` 同时出现（引擎侧会双份）。
      const {
        class: _attrsClass,
        style: _attrsStyle,
        ...restAttrs
      } = attrs as Record<string, unknown>;
      void _attrsClass;
      void _attrsStyle;

      return h(
        RcDrawer,
        {
          ...restAttrs,
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
          // 调用方原生 class / style（位置与原先的 props.className / props.style 一致）
          className: attrs.class,
          style: attrs.style,
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
                title: mergedTitle() as never,
                footer: mergedFooter() as never,
                extra: mergedExtra() as never,
                closable: props.closable as never,
                closeIcon: mergedCloseIcon() as never,
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
