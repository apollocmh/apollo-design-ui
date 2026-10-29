import { useLocale } from '@apollo-design/locale';
import { isEmptyVNode, pickAttrs, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  isVNode,
  mergeProps,
  type PropType,
  ref,
  type SlotsType,
  shallowRef,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { resolveClosableConfig } from '../_internal/use-closable';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useColor } from './hooks/use-color';
import { useTagTheme } from './hooks/use-theme';
import type {
  TagConfig,
  TagProps,
  TagSemanticClassNames,
  TagSemanticStyles,
  TagSlots,
  TagVariant,
} from './interface';

/** Config data remains data; native content and the close action own separate hosts. */
function closeContent(value: unknown): VNodeChild {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    isVNode(value)
  )
    return value;
  return Array.isArray(value) ? value.map(closeContent) : undefined;
}
export default defineComponent({
  name: 'ATag',
  inheritAttrs: false,
  expose: ['nativeElement'],
  props: {
    prefixCls: String,
    color: String,
    variant: String as PropType<TagVariant>,
    bordered: { type: Boolean, default: undefined },
    closable: { type: [Boolean, Object] as PropType<TagProps['closable']>, default: undefined },
    href: String,
    target: String,
    disabled: { type: Boolean, default: undefined },
    classNames: Object as PropType<TagSemanticClassNames>,
    styles: Object as PropType<TagSemanticStyles>,
  },
  slots: Object as SlotsType<TagSlots>,
  emits: { close: (_event: MouseEvent) => true },
  setup(props, { slots, attrs, emit }) {
    const context = useComponentConfig<TagConfig>('tag');
    const direction = useDirection();
    const prefix = computed(() => context.getPrefixCls('tag', props.prefixCls));
    const themeStyle = useTagTheme(() => prefix.value);
    const disabled = useDisabled(() => props.disabled);
    const color = useColor(
      () => props,
      () => context.variant,
      () => prefix.value,
    );
    const root = shallowRef<HTMLSpanElement | null>(null),
      visible = ref(true);
    const [locale] = useLocale('global');
    const warning = useDevWarning('Tag');
    watchEffect(() => {
      warning.deprecated(props.bordered !== false, 'bordered={false}', 'variant="filled"');
      warning.deprecated(
        !props.color?.endsWith('-inverse'),
        'color="xxx-inverse"',
        'variant="solid"',
      );
    });
    const semantic = useMergeSemantic<TagProps, TagSemanticClassNames, TagSemanticStyles>(
      [() => context.classNames, () => props.classNames],
      [() => context.styles, () => semanticRootStyle(context.style), () => props.styles],
      props,
    );
    const renderTag = () => {
      const cls = prefix.value,
        classes = semantic.classNames.value,
        styles = semantic.styles.value;
      const icon = slots.icon?.(),
        content = slots.default?.(),
        suppliedClose = slots.closeIcon?.();
      const closing = resolveClosableConfig(
        { closable: props.closable, closeIcon: slots.closeIcon ? suppliedClose : undefined },
        { closable: context.closable, closeIcon: context.closeIcon },
        { closable: false },
      );
      const glyph = slots.closeIcon
        ? suppliedClose
        : closeContent(closing ? closing.closeIcon : undefined);
      const closeDisabled = disabled.value || (closing !== false && Boolean(closing.disabled));
      const close = (event: MouseEvent) => {
        if (closeDisabled) return;
        event.stopPropagation();
        emit('close', event);
        if (!event.defaultPrevented) visible.value = false;
      };
      const linkKeys = new Set([
        'rel',
        'download',
        'hreflang',
        'referrerpolicy',
        'referrerPolicy',
        'tabindex',
        'tabIndex',
        'accesskey',
        'accessKey',
        'aria-label',
        'aria-labelledby',
        'aria-describedby',
        'onFocus',
        'onBlur',
      ]);
      const linkAttrs = props.href
        ? Object.fromEntries(Object.entries(attrs).filter(([key]) => linkKeys.has(key)))
        : {};
      const body = isEmptyVNode(content)
        ? null
        : h(
            'span',
            {
              key: 'content',
              class: [`${cls}-content`, classes.content],
              ...styleAttrs(styles.content),
            },
            props.href
              ? [
                  h(
                    'a',
                    {
                      ...linkAttrs,
                      href: disabled.value ? undefined : props.href,
                      target: props.target,
                      'aria-disabled': disabled.value || undefined,
                      ...(attrs['aria-label'] !== undefined
                        ? { 'aria-label': attrs['aria-label'] }
                        : {}),
                      ...(attrs['aria-labelledby'] !== undefined
                        ? { 'aria-labelledby': attrs['aria-labelledby'] }
                        : {}),
                    },
                    [h(NodeRenderer, { node: content })],
                  ),
                ]
              : [h(NodeRenderer, { node: content })],
          );
      const nativeAttrs = Object.fromEntries(
        Object.entries(attrs).filter(
          ([key]) =>
            key !== 'className' &&
            key !== 'rootClassName' &&
            !(props.href && linkKeys.has(key)) &&
            !(disabled.value && key === 'onClick'),
        ),
      );
      return h(
        'span',
        mergeProps(
          {
            class: [
              cls,
              context.className,
              classes.root,
              `${cls}-${color.value.variant}`,
              {
                [`${cls}-${color.value.color}`]: color.value.isPreset || color.value.isStatus,
                [`${cls}-custom`]: Boolean(
                  color.value.color && !color.value.isPreset && !color.value.isStatus,
                ),
                [`${cls}-has-icon`]: !isEmptyVNode(icon),
                [`${cls}-hidden`]: !visible.value,
                [`${cls}-rtl`]: (attrs.dir ?? direction.value) === 'rtl',
                [`${cls}-disabled`]: disabled.value,
              },
            ],
            ...styleAttrs({
              ...themeStyle.value,
              ...(!disabled.value ? color.value.tagStyle : undefined),
              ...styles.root,
            }),
          },
          nativeAttrs,
          {
            ref: root,
            dir: attrs.dir ?? direction.value,
            onClick: disabled.value ? undefined : nativeAttrs.onClick,
            'aria-disabled': disabled.value || attrs['aria-disabled'],
          },
        ),
        [
          isEmptyVNode(icon)
            ? null
            : h(
                'span',
                { key: 'icon', class: [`${cls}-icon`, classes.icon], ...styleAttrs(styles.icon) },
                [h(NodeRenderer, { node: icon })],
              ),
          body,
          closing && !isEmptyVNode(glyph)
            ? h(
                'button',
                {
                  key: 'close',
                  type: 'button',
                  ...pickAttrs(closing, true),
                  'aria-label': closing['aria-label'] ?? locale.value.close ?? 'Close',
                  disabled: closeDisabled,
                  'aria-disabled': closeDisabled || undefined,
                  class: [`${cls}-close-icon`, classes.close],
                  ...styleAttrs(styles.close),
                  onClick: close,
                  onKeydown: (event: KeyboardEvent) => {
                    // The native button keeps activation; ancestor composite widgets
                    // must not interpret the same key as their own selection command.
                    if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
                  },
                },
                [h(NodeRenderer, { node: glyph })],
              )
            : null,
        ],
      );
    };
    return { nativeElement: root, renderTag };
  },
  render() {
    return this.renderTag();
  },
});
