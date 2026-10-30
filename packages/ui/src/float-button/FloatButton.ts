/** Floating action control composed with Button, Badge and Tooltip. */
import { FileTextOutlined } from '@apollo-design/icons';
import { useZIndex } from '@apollo-design/portal';
import { isEmptyVNode, mergeDomAttrs, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  normalizeStyle,
  type PropType,
  type SlotsType,
  shallowRef,
} from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import Badge from '../badge';
import type { BadgeProps } from '../badge/interface';
import Button from '../button/Button.vue';
import type { ButtonRef } from '../button/interface';
import { useComponentConfig } from '../config-provider/context';
import Tooltip from '../tooltip/Tooltip';
import {
  type FloatButtonGroupContextValue,
  provideFloatButtonGroup,
  useFloatButtonGroup,
} from './context';
import type {
  FloatButtonBadgeProps,
  FloatButtonConfig,
  FloatButtonProps,
  FloatButtonSemanticClassNames,
  FloatButtonSemanticStyles,
  FloatButtonShape,
  FloatButtonSlots,
  FloatButtonType,
} from './interface';
import { useFloatButtonTheme } from './use-float-button-theme';

export const floatButtonPrefixCls = 'float-btn';

const FloatButtonComponent = defineComponent({
  name: 'AFloatButton',
  inheritAttrs: false,
  expose: ['nativeElement'],
  slots: Object as SlotsType<FloatButtonSlots>,
  props: {
    prefixCls: { type: String, default: undefined },
    type: { type: String as PropType<FloatButtonType>, default: undefined },
    shape: { type: String as PropType<FloatButtonShape>, default: undefined },
    description: { type: String, default: undefined },
    href: { type: String, default: undefined },
    target: { type: String, default: undefined },
    htmlType: { type: String as PropType<FloatButtonProps['htmlType']>, default: undefined },
    'aria-label': { type: String, default: undefined },
    disabled: { type: Boolean, default: undefined },
    tooltip: {
      type: [Object, String] as PropType<FloatButtonProps['tooltip']>,
      default: undefined,
    },
    badge: { type: Object as PropType<FloatButtonBadgeProps>, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<FloatButtonProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<FloatButtonProps['styles']>,
      default: undefined,
    },
  },
  emits: { click: (_event: MouseEvent) => true },
  setup(props, { slots, attrs, emit }) {
    const warning = useDevWarning('FloatButton');
    const config = useComponentConfig<FloatButtonConfig>('floatButton');
    const theme = useFloatButtonTheme();
    const group = useFloatButtonGroup();
    const prefixCls = computed(() => config.getPrefixCls(floatButtonPrefixCls, props.prefixCls));
    const shape = computed(() => group?.value?.shape ?? props.shape ?? 'circle');
    const individual = computed(() => group?.value?.individual ?? true);
    const type = computed(() => props.type ?? 'default');
    const { classNames, styles } = useMergeSemantic<
      FloatButtonProps,
      FloatButtonSemanticClassNames,
      FloatButtonSemanticStyles
    >(
      [
        () => ({ icon: `${prefixCls.value}-icon`, content: `${prefixCls.value}-content` }),
        () => config.classNames,
        () => group?.value?.classNames,
        () => props.classNames,
      ],
      [() => config.styles, () => group?.value?.styles, () => props.styles],
      props,
    );

    // Preserve the already delivered native style/zIndex precedence on Button's root.
    const explicitZIndex = (): string | number | undefined => {
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
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value)))
          return Number(value);
        return undefined;
      },
      {
        get zIndexPopupBase() {
          return theme.theme.token.value.zIndexPopupBase;
        },
      },
    );

    const buttonRef = shallowRef<ButtonRef | null>(null);
    const renderFloatButton = () => {
      // Slot presence is authoritative, including an intentional empty result.
      const content = slots.content ? slots.content() : props.description;
      const iconOnly = isEmptyVNode(content);
      const icon = slots.icon ? slots.icon() : iconOnly ? h(FileTextOutlined) : null;
      warning(
        !(shape.value === 'circle' && !iconOnly),
        'supported only when `shape` is `square`. Due to narrow space for text, short sentence is recommended.',
      );
      warning.deprecated(props.description === undefined, 'description', 'content');
      const badge: (BadgeProps & { children?: unknown }) | undefined =
        props.badge === undefined ? undefined : { ...props.badge };
      if (badge) {
        delete badge.title;
        delete badge.text;
        delete badge.status;
        delete badge.children;
      }

      const fallback =
        explicitZIndex() === undefined && zIndex.value !== undefined
          ? { zIndex: zIndex.value }
          : undefined;
      const buttonNode = h(
        Button,
        mergeDomAttrs(
          { style: [theme.style.value, fallback, config.style, styles.value.root] },
          attrs,
          {
            ref: buttonRef,
            type: type.value,
            shape: shape.value === 'circle' ? 'circle' : 'default',
            size: 'large',
            href: props.href,
            target: props.target,
            htmlType: props.htmlType,
            disabled: props.disabled,
            'aria-label': props['aria-label'],
            onClick: (event: MouseEvent) => emit('click', event),
            classNames: { root: classNames.value.root, icon: classNames.value.icon },
            styles: { icon: styles.value.icon },
            class: [
              prefixCls.value,
              `${prefixCls.value}-${type.value}`,
              `${prefixCls.value}-${shape.value}`,
              config.className,
              config.direction === 'rtl' && `${prefixCls.value}-rtl`,
              individual.value && `${prefixCls.value}-individual`,
              iconOnly && `${prefixCls.value}-icon-only`,
            ],
          },
        ),
        {
          icon: () => icon,
          default: () =>
            [
              !iconOnly
                ? h('span', { class: classNames.value.content, style: styles.value.content }, [
                    h(NodeRenderer, { node: content }),
                  ])
                : null,
              badge === undefined
                ? null
                : h(Badge, {
                    ...badge,
                    class: [
                      `${prefixCls.value}-badge`,
                      badge.dot && `${prefixCls.value}-badge-dot`,
                    ],
                  }),
            ].filter((node) => node !== null),
        },
      );
      const tooltip = props.tooltip;
      return tooltip === undefined
        ? buttonNode
        : h(Tooltip, typeof tooltip === 'string' ? { title: tooltip } : tooltip, {
            default: () => buttonNode,
          });
    };
    return {
      get nativeElement() {
        return buttonRef.value?.nativeElement ?? null;
      },
      renderFloatButton,
    };
  },
  render() {
    return this.renderFloatButton();
  },
});

export type { FloatButtonGroupContextValue };
export { provideFloatButtonGroup };
export default FloatButtonComponent;
