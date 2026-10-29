import { defaultLocale, useLocale } from '@apollo-design/locale';
import {
  type Component,
  cloneVNode,
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  isVNode,
  onBeforeUnmount,
  type PropType,
  ref,
  type VNodeChild,
  watchPostEffect,
} from 'vue';
import { hasAddon, hasContent, hasPrefixSuffix } from './common-utils';

export interface ClearConfig {
  clearIcon?: VNodeChild | Component;
  disabled?: boolean;
}

export const BaseInput = defineComponent({
  name: 'AInputBase',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    prefix: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    suffix: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    addonBefore: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    addonAfter: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    className: { type: [String, Array, Object] as PropType<unknown>, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    themeStyle: { type: Object as PropType<Record<string, string>>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    readOnly: { type: Boolean, default: undefined },
    focused: { type: Boolean, default: undefined },
    value: { type: String, default: '' },
    allowClear: { type: [Boolean, Object] as PropType<boolean | ClearConfig>, default: undefined },
    showCount: { type: [Boolean, Object] as PropType<unknown>, default: undefined },
    hidden: { type: Boolean, default: undefined },
    classNames: {
      type: Object as PropType<Record<string, string | undefined>>,
      default: undefined,
    },
    styles: {
      type: Object as PropType<Record<string, Record<string, string | number> | undefined>>,
      default: undefined,
    },
    dataAttrs: {
      type: Object as PropType<Record<string, Record<string, string> | undefined>>,
      default: undefined,
    },
    /** 清空回调（rc 的 handleReset）。 */
    onReset: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    /** 清空后的用户回调（rc 的 onClear）。 */
    onClear: { type: Function as PropType<(event: MouseEvent) => void>, default: undefined },
    /** 焦点交回（rc 的 triggerFocus）。 */
    onTriggerFocus: { type: Function as PropType<() => void>, default: undefined },
    /** nativeElement 暴露（group-wrapper 优先，其次 affix-wrapper）。 */
    onExposeElement: {
      type: Function as PropType<(el: HTMLElement | null) => void>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const instance = getCurrentInstance();
    const containerRef = ref<HTMLElement | null>(null);
    const groupRef = ref<HTMLElement | null>(null);
    const [globalLocale] = useLocale('global');
    const hasAffix = computed(() => hasPrefixSuffix(props));
    const hasGroup = computed(() => hasAddon(props));
    const needClear = computed(
      () =>
        !!props.allowClear &&
        !props.disabled &&
        !props.readOnly &&
        !!props.value &&
        !(typeof props.allowClear === 'object' && props.allowClear.disabled),
    );

    watchPostEffect(() =>
      props.onExposeElement?.(
        hasGroup.value ? groupRef.value : hasAffix.value ? containerRef.value : null,
      ),
    );
    onBeforeUnmount(() => props.onExposeElement?.(null));

    const asClearIcon = (value: VNodeChild | Component | undefined): VNodeChild => {
      if (
        value === null ||
        value === undefined ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      )
        return value;
      if (isVNode(value) || Array.isArray(value)) return value as VNodeChild;
      return h(value as Component);
    };
    function renderClear(): VNodeChild {
      if (!props.allowClear) return null;
      const config = typeof props.allowClear === 'object' ? props.allowClear : undefined;
      const icon = config?.clearIcon === undefined ? '✖' : config.clearIcon;
      return h(
        'button',
        {
          type: 'button',
          class: [
            `${props.prefixCls}-clear-icon`,
            {
              [`${props.prefixCls}-clear-icon-hidden`]: !needClear.value,
              [`${props.prefixCls}-clear-icon-has-suffix`]: hasContent(props.suffix),
            },
            props.classNames?.clear,
          ],
          style: props.styles?.clear,
          disabled: !needClear.value,
          'aria-label': globalLocale.value.clear?.trim() || defaultLocale.global?.clear,
          onMousedown: (event: MouseEvent) => event.preventDefault(),
          onClick: (event: MouseEvent) => {
            if (!needClear.value) return;
            props.onReset?.(event);
            props.onTriggerFocus?.();
            props.onClear?.(event);
          },
        },
        [asClearIcon(icon)],
      );
    }

    return () => {
      const inner = slots.default?.()[0];
      if (!isVNode(inner)) return null;
      const p = props.prefixCls;
      const affix = hasAffix.value;
      const group = hasGroup.value;
      const bare = !affix && !group;
      // Vue applies parent scoped IDs to the rendered root. Forward those same IDs
      // to our logical root, stopping at the first non-root component boundary.
      const scopeIds = new Set<string>();
      for (let current = instance; current; current = current.parent) {
        if (current.vnode.scopeId) scopeIds.add(current.vnode.scopeId);
        if ('slotScopeIds' in current.vnode && Array.isArray(current.vnode.slotScopeIds)) {
          for (const id of current.vnode.slotScopeIds) if (typeof id === 'string') scopeIds.add(id);
        }
        if (!current.parent || current.parent.subTree !== current.vnode) break;
      }
      const scopeAttrs = Object.fromEntries([...scopeIds].map((id) => [id, '']));
      const input = cloneVNode(inner, {
        class: [!affix ? props.classNames?.variant : undefined, bare ? props.className : undefined],
        style: bare
          ? [
              props.themeStyle,
              inner.props?.style,
              props.style,
              props.hidden ? { display: 'none' } : undefined,
            ]
          : undefined,
        hidden: bare ? props.hidden : undefined,
        ...(bare ? scopeAttrs : {}),
      });
      // The editor always occupies the same VNode path. Inactive hosts have no layout box.
      const affixNode = h(
        'span',
        {
          ...(affix && !group ? scopeAttrs : {}),
          ref: containerRef,
          'data-apollo-input-host': 'affix',
          class: affix
            ? [
                `${p}-affix-wrapper`,
                {
                  [`${p}-disabled`]: props.disabled,
                  [`${p}-affix-wrapper-disabled`]: props.disabled,
                  [`${p}-affix-wrapper-focused`]: props.focused,
                  [`${p}-affix-wrapper-readonly`]: props.readOnly,
                  [`${p}-affix-wrapper-input-with-clear-btn`]:
                    hasContent(props.suffix) && !!props.allowClear && !!props.value,
                },
                props.classNames?.affixWrapper,
                props.classNames?.variant,
                !group ? props.className : undefined,
              ]
            : `${p}-affix-host`,
          style: affix
            ? [
                props.themeStyle,
                props.styles?.affixWrapper,
                !group ? props.style : undefined,
                !group && props.hidden ? { display: 'none' } : undefined,
              ]
            : { display: 'contents' },
          hidden: affix && !group ? props.hidden : undefined,
          ...(affix ? props.dataAttrs?.affixWrapper : {}),
          onClick: (event: MouseEvent) => {
            if (!affix || props.disabled || !(event.target instanceof Node)) return;
            // Interactive suffixes own their activation; focusing them must not be undone.
            if (event.target instanceof Element && event.target.closest('button,a,[role="button"]'))
              return;
            if (containerRef.value?.contains(event.target)) props.onTriggerFocus?.();
          },
        },
        [
          hasContent(props.prefix)
            ? h(
                'span',
                {
                  key: 'prefix',
                  class: [`${p}-prefix`, props.classNames?.prefix],
                  style: props.styles?.prefix,
                },
                [props.prefix],
              )
            : null,
          input,
          hasContent(props.suffix) || props.allowClear
            ? h(
                'span',
                {
                  key: 'suffix',
                  class: [`${p}-suffix`, props.classNames?.suffix],
                  style: props.styles?.suffix,
                },
                [renderClear(), props.suffix],
              )
            : null,
        ],
      );
      return h(
        'span',
        {
          ...(group ? scopeAttrs : {}),
          ref: groupRef,
          'data-apollo-input-host': 'group',
          class: group
            ? [
                `${p}-group-wrapper`,
                { [`${p}-group-wrapper-disabled`]: props.disabled },
                props.classNames?.groupWrapper,
                props.className,
              ]
            : undefined,
          style: group
            ? [props.themeStyle, props.style, props.hidden ? { display: 'none' } : undefined]
            : { display: 'contents' },
          hidden: group ? props.hidden : undefined,
        },
        [
          h(
            'span',
            {
              'data-apollo-input-host': 'wrapper',
              class: group ? [`${p}-wrapper`, `${p}-group`, props.classNames?.wrapper] : undefined,
              style: group ? props.styles?.wrapper : { display: 'contents' },
            },
            [
              hasContent(props.addonBefore)
                ? h('span', { key: 'before', class: `${p}-group-addon` }, [props.addonBefore])
                : null,
              affixNode,
              hasContent(props.addonAfter)
                ? h('span', { key: 'after', class: `${p}-group-addon` }, [props.addonAfter])
                : null,
            ],
          ),
        ],
      );
    };
  },
});
