/** Floating action list with an optional click/hover disclosure trigger. */
import { CloseOutlined, FileTextOutlined } from '@apollo-design/icons';
import { CSSMotion } from '@apollo-design/motion';
import { useZIndex } from '@apollo-design/portal';
import { mergeDomAttrs, useControlledValue, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  normalizeStyle,
  onMounted,
  type PropType,
  type SlotsType,
  shallowRef,
  useId,
  watch,
  watchEffect,
} from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import Flex from '../flex';
import type { FlexRef } from '../flex/interface';
import { SpaceCompact } from '../space';
import type { SpaceCompactRef } from '../space/interface';
import { FloatButtonGroupProvider, provideFloatButtonGroup } from './context';
import FloatButton, { floatButtonPrefixCls } from './FloatButton';
import type {
  FloatButtonGroupConfig,
  FloatButtonGroupPlacement,
  FloatButtonGroupProps,
  FloatButtonGroupSemanticClassNames,
  FloatButtonGroupSemanticStyles,
  FloatButtonGroupSlots,
  FloatButtonRef,
  FloatButtonShape,
  FloatButtonType,
} from './interface';
import { useFloatButtonTheme } from './use-float-button-theme';

export default defineComponent({
  name: 'AFloatButtonGroup',
  inheritAttrs: false,
  expose: ['nativeElement'],
  slots: Object as SlotsType<FloatButtonGroupSlots>,
  props: {
    prefixCls: { type: String, default: undefined },
    type: { type: String as PropType<FloatButtonType>, default: undefined },
    shape: { type: String as PropType<FloatButtonShape>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    'aria-label': { type: String, default: undefined },
    href: { type: String, default: undefined },
    target: { type: String, default: undefined },
    htmlType: { type: String as PropType<FloatButtonGroupProps['htmlType']>, default: undefined },
    tooltip: {
      type: [Object, String] as PropType<FloatButtonGroupProps['tooltip']>,
      default: undefined,
    },
    badge: { type: Object as PropType<FloatButtonGroupProps['badge']>, default: undefined },
    trigger: { type: String as PropType<FloatButtonGroupProps['trigger']>, default: undefined },
    open: { type: Boolean, default: undefined },
    placement: { type: String as PropType<FloatButtonGroupPlacement>, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<FloatButtonGroupProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<FloatButtonGroupProps['styles']>,
      default: undefined,
    },
  },
  emits: {
    'update:open': (_open: boolean) => true,
    openChange: (_open: boolean) => true,
    click: (_event: MouseEvent) => true,
  },
  setup(props, { slots, attrs, emit }) {
    const warning = useDevWarning('FloatButton.Group');
    const config = useComponentConfig<FloatButtonGroupConfig>('floatButtonGroup');
    const theme = useFloatButtonTheme();
    const contextDisabled = useDisabled();
    const prefix = computed(() => config.getPrefixCls(floatButtonPrefixCls, props.prefixCls));
    const groupPrefix = computed(() => `${prefix.value}-group`);
    const shape = computed(() => props.shape ?? 'circle');
    const disabled = computed(() => props.disabled ?? contextDisabled.value);
    const menu = computed(() => props.trigger === 'click' || props.trigger === 'hover');
    const hover = computed(() => props.trigger === 'hover');
    const placement = computed(() => props.placement ?? 'top');
    watchEffect(() =>
      warning(
        props.open === undefined || Boolean(props.trigger),
        '`open` need to be used together with `trigger`',
      ),
    );

    const [open, setOpen] = useControlledValue<boolean>({
      defaultValue: false,
      getValue: () => props.open,
      onChange: (next) => {
        emit('openChange', next);
        emit('update:open', next);
      },
    });
    const triggerOpen = (next: boolean) => {
      if (!disabled.value && open.value !== next) setOpen(next);
    };
    const rootRef = shallowRef<HTMLDivElement | null>(null);
    const triggerRef = shallowRef<FloatButtonRef | null>(null);
    const listRef = shallowRef<FlexRef | SpaceCompactRef | null>(null);
    const listId = `float-button-list-${useId()}`;
    const inside = (target: EventTarget | null) => {
      const root = rootRef.value;
      const NodeType = root?.ownerDocument.defaultView?.Node;
      return Boolean(root && NodeType && target instanceof NodeType && root.contains(target));
    };
    const focusInside = () => inside(rootRef.value?.ownerDocument.activeElement ?? null);
    let returningFocus = false;
    watch(
      open,
      (next, previous) => {
        const active = rootRef.value?.ownerDocument.activeElement;
        if (previous && !next && active && listRef.value?.nativeElement?.contains(active)) {
          returningFocus = true;
          triggerRef.value?.nativeElement?.focus();
          returningFocus = false;
        }
      },
      { flush: 'pre' },
    );

    // Bind to the actual owner document, after mounting, and release each binding.
    onMounted(() =>
      watch(
        () => props.trigger === 'click',
        (enabled, _old, cleanup) => {
          if (!enabled) return;
          const document = rootRef.value?.ownerDocument;
          const onClick = (event: MouseEvent) => {
            if (!inside(event.target)) triggerOpen(false);
          };
          document?.addEventListener('click', onClick, true);
          cleanup(() => document?.removeEventListener('click', onClick, true));
        },
        { immediate: true, flush: 'post' },
      ),
    );

    const { classNames, styles } = useMergeSemantic<
      FloatButtonGroupProps,
      FloatButtonGroupSemanticClassNames,
      FloatButtonGroupSemanticStyles
    >(
      [() => config.classNames, () => props.classNames],
      [() => config.styles, () => props.styles],
      props,
    );
    const explicitZIndex = () => {
      const style = normalizeStyle([config.style, styles.value.root, attrs.style]);
      if (!style || typeof style === 'string') return undefined;
      let value: string | number | undefined;
      for (const [name, current] of Object.entries(style))
        if (name === 'zIndex' || name === 'z-index') value = current;
      return value;
    };
    const zIndex = useZIndex(
      'FloatButton',
      () => {
        const value = explicitZIndex();
        return value !== undefined && String(value).trim() && Number.isFinite(Number(value))
          ? Number(value)
          : undefined;
      },
      {
        get zIndexPopupBase() {
          return theme.theme.token.value.zIndexPopupBase;
        },
      },
    );
    provideFloatButtonGroup(
      computed(() => ({
        shape: shape.value,
        individual: shape.value === 'circle',
        classNames: {
          root: classNames.value.item,
          icon: classNames.value.itemIcon,
          content: classNames.value.itemContent,
        },
        styles: {
          root: styles.value.item,
          icon: styles.value.itemIcon,
          content: styles.value.itemContent,
        },
      })),
    );
    const triggerContext = computed(() => ({
      shape: shape.value,
      individual: true,
      classNames: {
        root: classNames.value.trigger,
        icon: classNames.value.triggerIcon,
        content: classNames.value.triggerContent,
      },
      styles: {
        root: styles.value.trigger,
        icon: styles.value.triggerIcon,
        content: styles.value.triggerContent,
      },
    }));

    const onTriggerClick = (event: MouseEvent) => {
      // Hover menus also support native button activation for keyboard/touch users.
      triggerOpen(!open.value);
      emit('click', event);
    };
    const onKeydown = (event: KeyboardEvent) => {
      if (menu.value && open.value && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        triggerOpen(false);
      }
    };
    const renderGroup = () => {
      const group = groupPrefix.value;
      const list = `${group}-list`;
      const renderList = (
        motionClass?: string,
        motionStyle?: Record<string, string | number> | null,
      ) => {
        const shared = {
          id: menu.value ? listId : undefined,
          ref: listRef,
          class: [list, classNames.value.list, motionClass],
          style: [styles.value.list, motionStyle],
          inert: menu.value && !open.value ? true : undefined,
          'aria-hidden': menu.value && !open.value ? 'true' : undefined,
          vertical: placement.value === 'top' || placement.value === 'bottom',
        };
        return shape.value === 'circle'
          ? h(Flex, shared, { default: () => slots.default?.() })
          : h(SpaceCompact, shared, { default: () => slots.default?.() });
      };
      const trigger = menu.value
        ? h(
            FloatButtonGroupProvider,
            { value: triggerContext.value },
            {
              default: () =>
                h(
                  FloatButton,
                  {
                    ref: triggerRef,
                    prefixCls: props.prefixCls,
                    type: props.type,
                    shape: shape.value,
                    'aria-label': props['aria-label'] ?? (slots.content ? undefined : 'Actions'),
                    'aria-expanded': open.value,
                    'aria-controls': listId,
                    class: `${group}-trigger`,
                    disabled: disabled.value,
                    href: props.href,
                    target: props.target,
                    htmlType: props.htmlType,
                    tooltip: props.tooltip,
                    badge: props.badge,
                    onClick: onTriggerClick,
                  },
                  {
                    icon: () =>
                      open.value
                        ? slots.closeIcon
                          ? slots.closeIcon()
                          : h(CloseOutlined)
                        : slots.icon
                          ? slots.icon()
                          : h(FileTextOutlined),
                    ...(slots.content ? { content: () => slots.content?.() } : {}),
                  },
                ),
            },
          )
        : null;
      const fallback = explicitZIndex() === undefined ? { zIndex: zIndex.value } : undefined;
      return h(
        'div',
        mergeDomAttrs(
          {
            ref: rootRef,
            class: [
              group,
              config.className,
              classNames.value.root,
              config.direction === 'rtl' && `${group}-rtl`,
              shape.value === 'circle' && `${group}-individual`,
              menu.value && `${group}-${placement.value}`,
              menu.value && `${group}-menu-mode`,
            ],
            style: [theme.style.value, fallback, config.style, styles.value.root],
            onMouseenter: () => {
              if (hover.value) triggerOpen(true);
            },
            onMouseleave: () => {
              if (hover.value && !focusInside()) triggerOpen(false);
            },
            onFocusin: () => {
              if (hover.value && !returningFocus) triggerOpen(true);
            },
            onFocusout: (event: FocusEvent) => {
              if (menu.value && !inside(event.relatedTarget)) triggerOpen(false);
            },
            onKeydown,
          },
          attrs,
        ),
        [
          // DOM order follows keyboard order: trigger, then the disclosed actions.
          trigger,
          menu.value
            ? h(
                CSSMotion,
                {
                  visible: open.value,
                  motionName: theme.motion.value ? `${list}-motion` : undefined,
                },
                {
                  default: ({
                    className,
                    style,
                  }: {
                    className: string;
                    style: Record<string, string | number> | null;
                  }) => renderList(className, style),
                },
              )
            : renderList(),
        ],
      );
    };
    return {
      get nativeElement() {
        return rootRef.value;
      },
      renderGroup,
    };
  },
  render() {
    return this.renderGroup();
  },
});
