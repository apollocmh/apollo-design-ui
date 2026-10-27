<script lang="ts">
import { LoadingOutlined } from '@apollo-design/icons';
import { isEmptyVNode, mergeDomAttrs, useDevWarning } from '@apollo-design/utils';
import {
  Comment,
  computed,
  defineComponent,
  Fragment,
  h,
  isVNode,
  onMounted,
  onUnmounted,
  type PropType,
  type SlotsType,
  shallowRef,
  toRaw,
  type VNodeChild,
  watch,
  watchEffect,
} from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useSize } from '../config-provider/size-context';
import { useCompactItemContext } from '../space/Compact';
import type {
  ButtonColorType,
  ButtonConfig,
  ButtonIcon,
  ButtonProps,
  ButtonSemanticClassNames,
  ButtonSemanticStyles,
  ButtonSlots,
  ButtonType,
  ButtonVariantType,
} from './interface';
import { useButtonTheme } from './use-button-theme';

function iconNode(value: ButtonIcon): VNodeChild {
  if (value == null || (typeof value !== 'object' && typeof value !== 'function')) return value;
  if (isVNode(value) || Array.isArray(value)) return value;
  return h(toRaw(value));
}

/** Read known text for SSR without rewriting any caller-owned VNode. */
function knownText(value: VNodeChild): string | undefined {
  if (value == null || typeof value === 'boolean') return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    const parts = value.map(knownText);
    return parts.some((part) => part === undefined) ? undefined : parts.join('');
  }
  if (!isVNode(value) || value.type === Comment) return '';
  if (typeof value.type !== 'string' && value.type !== Fragment && typeof value.type !== 'symbol')
    return undefined;
  if (typeof value.children === 'string') return value.children;
  return Array.isArray(value.children) ? knownText(value.children) : undefined;
}
const chinesePair = /^[\u4e00-\u9fa5]{2}$/;
type ResolvedColor = ButtonColorType | 'link';
const typeStyle: Record<ButtonType, readonly [ResolvedColor, ButtonVariantType]> = {
  default: ['default', 'outlined'],
  primary: ['primary', 'solid'],
  dashed: ['default', 'dashed'],
  link: ['link', 'link'],
  text: ['default', 'text'],
};

export default defineComponent({
  name: 'AButton',
  inheritAttrs: false,
  expose: ['nativeElement'],
  props: {
    type: String as PropType<ButtonProps['type']>,
    color: String as PropType<ButtonProps['color']>,
    variant: String as PropType<ButtonProps['variant']>,
    icon: {
      type: [String, Number, Boolean, Object, Array, Function] as PropType<ButtonIcon>,
      default: undefined,
    },
    iconPosition: String as PropType<ButtonProps['iconPosition']>,
    iconPlacement: String as PropType<ButtonProps['iconPlacement']>,
    shape: String as PropType<ButtonProps['shape']>,
    size: String as PropType<ButtonProps['size']>,
    disabled: { type: Boolean, default: undefined },
    loading: { type: [Boolean, Object] as PropType<ButtonProps['loading']>, default: false },
    prefixCls: String,
    ghost: { type: Boolean, default: undefined },
    danger: { type: Boolean, default: undefined },
    block: { type: Boolean, default: undefined },
    href: String,
    htmlType: { type: String as PropType<ButtonProps['htmlType']>, default: 'button' },
    autoInsertSpace: { type: Boolean, default: undefined },
    classNames: Object as PropType<ButtonSemanticClassNames>,
    styles: Object as PropType<ButtonSemanticStyles>,
  },
  emits: { click: (_event: MouseEvent) => true },
  slots: Object as SlotsType<ButtonSlots>,
  setup(props, { attrs, slots, emit }) {
    const context = useComponentConfig<ButtonConfig>('button');
    const direction = useDirection();
    const prefix = computed(() => context.getPrefixCls('btn', props.prefixCls));
    const themeStyle = useButtonTheme(() => prefix.value);
    const disabled = useDisabled(() => props.disabled);
    const { compactSize, compactItemClassnames } = useCompactItemContext(
      () => prefix.value,
      () => direction.value,
    );
    const size = useSize((provider) => props.size ?? compactSize?.value ?? provider);
    const semantic = useMergeSemantic<ButtonProps, ButtonSemanticClassNames, ButtonSemanticStyles>(
      [() => context.classNames, () => props.classNames],
      [() => context.styles, () => semanticRootStyle(context.style), () => props.styles],
      props,
    );
    const appearance = computed(() => {
      const variant =
        props.variant ?? (props.type ? typeStyle[props.type]?.[1] : context.variant) ?? 'outlined';
      const color =
        props.color ??
        (props.danger ? 'danger' : props.type ? typeStyle[props.type]?.[0] : context.color) ??
        (variant === 'solid' ? 'primary' : 'default');
      return { color, variant: props.ghost && variant === 'solid' ? 'outlined' : variant };
    });
    const requestedLoading = computed(() => Boolean(props.loading));
    const delay = computed(() => {
      const value = props.loading && typeof props.loading === 'object' ? props.loading.delay : 0;
      return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
    });
    const visibleLoading = shallowRef(requestedLoading.value && delay.value === 0);
    let mounted = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cancelDelay = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };
    const updateLoading = () => {
      cancelDelay();
      if (!requestedLoading.value) visibleLoading.value = false;
      else if (delay.value === 0) visibleLoading.value = true;
      else if (mounted && !visibleLoading.value) {
        timer = setTimeout(() => {
          visibleLoading.value = true;
          timer = undefined;
        }, delay.value);
      }
    };
    watch([requestedLoading, delay], updateLoading, { flush: 'sync' });
    const root = shallowRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
    const contentRoot = shallowRef<HTMLElement | null>(null);
    const observedText = shallowRef('');
    let observer: MutationObserver | undefined;
    watch(
      contentRoot,
      (element) => {
        observer?.disconnect();
        if (!element) {
          observedText.value = '';
          return;
        }
        const read = () => {
          observedText.value = element.textContent ?? '';
        };
        read();
        if (typeof MutationObserver !== 'undefined') {
          observer = new MutationObserver(read);
          observer.observe(element, { childList: true, characterData: true, subtree: true });
        }
      },
      { flush: 'post' },
    );
    onMounted(() => {
      mounted = true;
      updateLoading();
    });
    onUnmounted(() => {
      mounted = false;
      cancelDelay();
      observer?.disconnect();
    });
    const warning = useDevWarning('Button');
    watchEffect(() => {
      warning(
        !(
          props.ghost &&
          (appearance.value.variant === 'link' || appearance.value.variant === 'text')
        ),
        "`link` or `text` button can't be a `ghost` button.",
      );
      warning.deprecated(props.iconPosition === undefined, 'iconPosition', 'iconPlacement');
    });
    const onClick = (event: MouseEvent) => {
      if (requestedLoading.value || disabled.value) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      emit('click', event);
    };
    const renderButton = () => {
      const cls = prefix.value;
      const content = slots.default?.();
      const slotIcon = slots.icon?.();
      const normalIcon = slots.icon ? slotIcon : iconNode(props.icon);
      const loadingValue =
        props.loading && typeof props.loading === 'object' && props.loading.icon !== undefined
          ? props.loading.icon
          : context.loadingIcon;
      const displayedIcon = visibleLoading.value
        ? loadingValue === undefined
          ? h(LoadingOutlined, { 'aria-hidden': 'true', focusable: 'false' })
          : iconNode(loadingValue)
        : normalIcon;
      const hasIcon = !isEmptyVNode(displayedIcon);
      const hasContent = !isEmptyVNode(content);
      const { color, variant } = appearance.value;
      const insertSpace = props.autoInsertSpace ?? context.autoInsertSpace ?? true;
      const text = knownText(content) ?? observedText.value;
      const spaced =
        insertSpace &&
        !hasIcon &&
        !requestedLoading.value &&
        variant !== 'link' &&
        variant !== 'text' &&
        chinesePair.test(text);
      const shape = props.shape ?? context.shape ?? 'default';
      const classes = semantic.classNames.value;
      const styles = semantic.styles.value;
      const anchor = props.href !== undefined;
      return h(
        anchor ? 'a' : 'button',
        mergeDomAttrs(
          {
            ref: root,
            class: [
              cls,
              context.className,
              classes.root,
              `${cls}-${props.type ?? 'default'}`,
              `${cls}-color-${color === 'danger' ? 'dangerous' : color}`,
              `${cls}-variant-${variant}`,
              compactItemClassnames?.value,
              {
                [`${cls}-${shape}`]: shape !== 'default',
                [`${cls}-dangerous`]: props.danger,
                [`${cls}-sm`]: size.value === 'small',
                [`${cls}-lg`]: size.value === 'large',
                [`${cls}-two-chinese-chars`]: spaced,
                [`${cls}-icon-only`]: hasIcon && !hasContent,
                [`${cls}-loading`]: visibleLoading.value,
                [`${cls}-block`]: props.block,
                [`${cls}-rtl`]: direction.value === 'rtl',
                [`${cls}-icon-end`]: (props.iconPlacement ?? props.iconPosition) === 'end',
                [`${cls}-background-ghost`]:
                  props.ghost && variant !== 'text' && variant !== 'link',
                [`${cls}-disabled`]: anchor && disabled.value,
              },
            ],
            style: [themeStyle.value, styles.root],
          },
          attrs,
          {
            ...(anchor
              ? {
                  href: disabled.value || requestedLoading.value ? undefined : props.href,
                  tabindex: disabled.value ? -1 : (attrs.tabindex ?? 0),
                }
              : { type: props.htmlType, disabled: disabled.value }),
            ...(anchor && (disabled.value || requestedLoading.value)
              ? { role: attrs.role ?? 'link' }
              : {}),
            dir: attrs.dir ?? direction.value,
            'aria-busy': requestedLoading.value || undefined,
            'aria-disabled': requestedLoading.value || (anchor ? disabled.value : undefined),
            onClick,
          },
        ),
        [
          hasIcon
            ? h(
                'span',
                {
                  key: 'icon',
                  class: [
                    `${cls}-icon`,
                    classes.icon,
                    { [`${cls}-loading-icon`]: visibleLoading.value && loadingValue === undefined },
                  ],
                  style: styles.icon,
                },
                [h(NodeRenderer, { node: displayedIcon })],
              )
            : null,
          hasContent
            ? h(
                'span',
                {
                  key: 'content',
                  ref: contentRoot,
                  class: [`${cls}-content`, classes.content],
                  style: styles.content,
                },
                [h(NodeRenderer, { node: content })],
              )
            : null,
        ],
      );
    };
    return { nativeElement: root, renderButton };
  },
  render() {
    return this.renderButton();
  },
});
</script>
