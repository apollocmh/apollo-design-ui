/**
 * Drawer owns its Vue events, current configuration, slots and outer root.
 * Historical reference: antd 6.6.4 components/drawer/Drawer.tsx; see docs/analysis/drawer.md.
 */
import { type GetContainer, useZIndex } from '@apollo-design/portal';
import { isEmptyVNode, isNumber, isRenderable, useId } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  type PropType,
  ref,
  type SlotsType,
  type VNodeChild,
} from 'vue';

import { mergeClassNames, mergeStyles } from '../_internal/use-merge-semantic';
import { type MaskType, useMergedMask } from '../_internal/use-merged-mask';
import { type ComponentStyleConfig, useComponentConfig } from '../config-provider/context';
import DrawerPanel from './DrawerPanel';
import RcDrawer from './engine/Drawer';
import type {
  DrawerClosable,
  DrawerPlacement,
  DrawerRef,
  DrawerSemanticType,
  DrawerSize,
  DrawerSlots,
  FocusableConfig,
  PushState,
} from './interface';
import { useDrawerTheme } from './use-drawer-theme';

const DEFAULT_SIZE = 378;
const DEFAULT_PUSH_STATE: PushState = { distance: 180 };
const MOTION_CONFIG = {
  motionAppear: true,
  motionEnter: true,
  motionLeave: true,
  motionDeadline: 500,
};
const contentSlots: SlotsType<DrawerSlots> = {};

type DrawerConfig = DrawerSemanticType &
  ComponentStyleConfig & {
    mask?: MaskType;
    closable?: DrawerClosable;
    focusable?: FocusableConfig;
  };

export default defineComponent({
  name: 'ADrawer',
  inheritAttrs: false,
  expose: ['nativeElement', 'focus'],
  slots: contentSlots,
  props: {
    prefixCls: { type: String, default: undefined },
    open: { type: Boolean, default: false },
    placement: { type: String as PropType<DrawerPlacement>, default: 'right' },
    size: { type: [String, Number] as PropType<DrawerSize>, default: undefined },
    defaultSize: { type: Number, default: DEFAULT_SIZE },
    width: { type: [String, Number] as PropType<string | number>, default: undefined },
    height: { type: [String, Number] as PropType<string | number>, default: undefined },
    maxSize: { type: Number, default: undefined },
    mask: { type: [Boolean, Object] as PropType<MaskType>, default: undefined },
    maskClosable: { type: Boolean, default: undefined },
    push: {
      type: [Boolean, Object] as PropType<boolean | PushState>,
      default: () => DEFAULT_PUSH_STATE,
    },
    getContainer: {
      type: [String, Boolean, Function, Object] as PropType<GetContainer>,
      default: undefined,
    },
    rootStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    resizable: { type: Boolean, default: false },
    focusable: { type: Object as PropType<FocusableConfig>, default: undefined },
    zIndex: { type: Number, default: undefined },
    ariaLabelledby: { type: String, default: undefined },
    title: { type: String, default: undefined },
    closable: { type: [Boolean, Object] as PropType<DrawerClosable>, default: undefined },
    loading: { type: Boolean, default: false },
    classNames: { type: Object as PropType<DrawerSemanticType['classNames']>, default: undefined },
    styles: { type: Object as PropType<DrawerSemanticType['styles']>, default: undefined },
    // Documented style and destruction aliases retain their existing precedence.
    maskStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    drawerStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    contentWrapperStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    headerStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    bodyStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    footerStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    destroyOnClose: { type: Boolean, default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
    keyboard: { type: Boolean, default: true },
    autoFocus: { type: Boolean, default: true },
    focusTriggerAfterClose: { type: Boolean, default: undefined },
    forceRender: { type: Boolean, default: false },
  },
  emits: {
    close: (_event: Event) => true,
    afterOpenChange: (_open: boolean) => true,
    resize: (_size: number) => true,
    resizeStart: (_size: number) => true,
    resizeEnd: (_size: number) => true,
  },
  setup(props, { attrs, slots, emit }) {
    const config = useComponentConfig<DrawerConfig>('drawer');
    const prefixCls = computed(() => props.prefixCls || config.getPrefixCls('drawer'));
    const id = useId();
    const engine = ref<DrawerRef | null>(null);
    const theme = useDrawerTheme();
    const nativeElement = computed(() => engine.value?.nativeElement ?? null);
    const focus = (options?: FocusOptions): void => {
      engine.value?.focus(options);
    };

    const readSlot = (name: keyof DrawerSlots): VNodeChild => {
      const slot = slots[name];
      if (!slot) return undefined;
      const nodes = slot();
      return isEmptyVNode(nodes) ? null : nodes;
    };
    const getContainer = computed<GetContainer>(() => {
      const getPopupContainer = config.getPopupContainer;
      return props.getContainer === undefined && getPopupContainer
        ? () => getPopupContainer(document.body)
        : props.getContainer;
    });
    const drawerSize = computed(() => {
      const { size, placement } = props;
      if (isNumber(size)) return size;
      if (size === 'large') return 736;
      if (size === 'default') return DEFAULT_SIZE;
      if (typeof size === 'string') return /^\d+(\.\d+)?$/.test(size) ? Number(size) : size;
      return placement === 'left' || placement === 'right' ? props.width : props.height;
    });
    const mask = useMergedMask(
      () => props.mask,
      () => config.mask,
      () => prefixCls.value,
      () => props.maskClosable,
    );
    const zIndex = useZIndex('Drawer', () => props.zIndex, {
      get zIndexPopupBase() {
        return theme.componentToken.value.zIndexPopup;
      },
    });
    const focusable = computed(() => ({ ...config.focusable, ...props.focusable }));
    const onClose = (event: Event) => emit('close', event);
    const onAfterOpenChange = (open: boolean) => emit('afterOpenChange', open);

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
        if (value !== undefined)
          console.warn(
            `[Apollo Design] Drawer: use ${replacement} instead of the deprecated alias.`,
          );
      }
    }

    const renderDrawer = () => {
      const cn = mergeClassNames(config.classNames, props.classNames);
      const st = mergeStyles(config.styles, props.styles);
      const title = slots.title ? readSlot('title') : props.title;
      const ariaId = isRenderable(title) ? id : undefined;
      const { class: nativeClass, style: nativeStyle, ...restAttrs } = attrs;
      const sectionClass = [cn.content, cn.section].filter(Boolean).join(' ');
      return h(
        RcDrawer,
        {
          ...restAttrs,
          ref: engine,
          prefixCls: prefixCls.value,
          open: props.open,
          placement: props.placement,
          autoFocus: props.autoFocus,
          keyboard: props.keyboard,
          mask: mask.enabled.value,
          maskClosable: mask.closable.value,
          push: props.push,
          getContainer: getContainer.value,
          inline: getContainer.value === false,
          forceRender: props.forceRender,
          afterOpenChange: onAfterOpenChange,
          destroyOnHidden: props.destroyOnHidden ?? props.destroyOnClose,
          onClose,
          zIndex: zIndex.value,
          class: [
            config.className,
            cn.root,
            nativeClass,
            !mask.enabled.value && 'no-mask',
            config.direction === 'rtl' && `${prefixCls.value}-rtl`,
          ],
          style: [theme.style.value, config.style, st.root, props.rootStyle, nativeStyle],
          maskMotion: { motionName: `${prefixCls.value}-mask-motion`, ...MOTION_CONFIG },
          motion: {
            motionName: `${prefixCls.value}-panel-motion-${props.placement}`,
            ...MOTION_CONFIG,
          },
          resizable: props.resizable,
          onResize: (size: number) => emit('resize', size),
          onResizeStart: (size: number) => emit('resizeStart', size),
          onResizeEnd: (size: number) => emit('resizeEnd', size),
          size: drawerSize.value,
          defaultSize: props.defaultSize,
          maxSize: props.maxSize,
          classNames: {
            mask: [cn.mask, mask.classNames.value.mask].filter(Boolean).join(' '),
            section: sectionClass,
            wrapper: cn.wrapper,
            dragger: cn.dragger,
          },
          styles: {
            mask: { ...st.mask, ...props.maskStyle },
            section: { ...st.content, ...st.section, ...props.drawerStyle },
            wrapper: { ...st.wrapper, ...props.contentWrapperStyle },
            dragger: st.dragger,
          },
          'aria-labelledby': props.ariaLabelledby ?? ariaId,
          focusTrap: focusable.value.trap ?? (getContainer.value !== false && mask.enabled.value),
          focusTriggerAfterClose:
            props.focusTriggerAfterClose ?? focusable.value.focusTriggerAfterClose,
        },
        {
          default: () =>
            h(
              DrawerPanel,
              {
                prefixCls: prefixCls.value,
                ariaId,
                title,
                footer: readSlot('footer'),
                extra: readSlot('extra'),
                closable: props.closable,
                closeIcon: readSlot('closeIcon'),
                onClose,
                classNames: cn,
                styles: st,
                loading: props.loading,
                headerStyle: props.headerStyle,
                bodyStyle: props.bodyStyle,
                footerStyle: props.footerStyle,
              },
              { default: () => slots.default?.() },
            ),
        },
      );
    };
    return { nativeElement, focus, renderDrawer };
  },
  render() {
    return this.renderDrawer();
  },
});
