/**
 * BaseInput —— rc-input 的三层包裹（engine 自建）。
 *
 * 判据（rc `BaseInput.js`，逐条对齐）：
 *  1. `hasPrefixSuffix(props)` ⇒ 套 `span.{p}-affix-wrapper`（内含 prefix span、
 *     元素本体、suffix span）；suffix 里先 clear 按钮再 suffix 内容。
 *  2. `hasAddon(props)` ⇒ 再套两层：`span.{p}-group-wrapper` > `span.{p}-wrapper.{p}-group`
 *     （addon 是 `span.{p}-group-addon`）。
 *  3. 根元素**恒**带 `className` / `style`（最后合并到最外层）。
 *  4. clear 按钮：`button[type=button].{p}-clear-icon`，`onMousedown` 里
 *     `preventDefault()`（失焦规避，issue 31200），空值/禁用/只读时挂
 *     `-hidden` 而不是不渲染。
 *  5. affixWrapper 上 `onClick` 只在「点击落在容器内」时把焦点交回 input。
 */

import {
  type Component,
  computed,
  defineComponent,
  h,
  isVNode,
  type PropType,
  ref,
  type VNodeChild,
} from 'vue';
import { hasAddon, hasPrefixSuffix } from './common-utils';

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
    onClear: { type: Function as PropType<() => void>, default: undefined },
    /** 焦点交回（rc 的 triggerFocus）。 */
    onTriggerFocus: { type: Function as PropType<() => void>, default: undefined },
    /** nativeElement 暴露（group-wrapper 优先，其次 affix-wrapper）。 */
    onExposeElement: {
      type: Function as PropType<(el: HTMLElement | null) => void>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const containerRef = ref<HTMLElement | null>(null);
    const groupRef = ref<HTMLElement | null>(null);

    const onInputClick = (e: MouseEvent): void => {
      if (containerRef.value?.contains(e.target as Node)) {
        props.onTriggerFocus?.();
      }
    };

    const needClear = computed<boolean>(
      () =>
        !!props.allowClear &&
        !props.disabled &&
        !props.readOnly &&
        !!props.value &&
        !(typeof props.allowClear === 'object' && props.allowClear.disabled),
    );

    /** D42：clearIcon 可能是字符串 / VNode / **组件对象** —— 组件对象必须 h() 包一层。 */
    const asClearIcon = (value: VNodeChild | Component | undefined): VNodeChild | undefined => {
      if (value === null || value === undefined) return undefined;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
        return value;
      if (isVNode(value) || Array.isArray(value)) return value as VNodeChild;
      return h(value as Component);
    };

    const clearIconNode = computed<VNodeChild | undefined>(() => {
      if (!props.allowClear) return undefined;
      const cfg = typeof props.allowClear === 'object' ? props.allowClear : undefined;
      return asClearIcon(cfg?.clearIcon ?? '✖');
    });

    const renderClear = () => {
      if (!props.allowClear) return null;
      const clearIconCls = `${props.prefixCls}-clear-icon`;
      return h(
        'button',
        {
          type: 'button',
          class: [
            clearIconCls,
            {
              [`${clearIconCls}-hidden`]: !needClear.value,
              [`${clearIconCls}-has-suffix`]: !!props.suffix,
            },
            props.classNames?.clear,
          ],
          style: props.styles?.clear,
          onClick: (e: MouseEvent) => {
            props.onReset?.(e);
            props.onClear?.();
          },
          // 点击 clear 不让输入框失焦
          onMousedown: (e: MouseEvent) => e.preventDefault(),
        },
        [clearIconNode.value],
      );
    };

    return () => {
      const children = slots.default?.() ?? [];
      const inner = children[0] as ReturnType<typeof h> | undefined;
      const hasAffix = hasPrefixSuffix(props);
      const hasGroup = hasAddon(props);

      // 根元素的 class / style / hidden 会落到**最外层**那一层（rc 的 cloneElement）
      const rootExtras = {
        class: props.className as string | unknown[] | undefined,
        style: props.style ?? {},
        hidden: props.hidden,
      };

      let element: ReturnType<typeof h> | null = null;
      if (inner) {
        // 裸形态：variant 挂在 input 本体上（rc 判据：!hasAffix）
        element = h(inner.type as never, {
          ...(inner.props ?? {}),
          class: [
            (inner.props as { class?: unknown })?.class,
            !hasAffix ? props.classNames?.variant : undefined,
            ...(hasAffix || hasGroup ? [] : [rootExtras.class]),
          ],
          style: hasAffix || hasGroup ? undefined : { ...rootExtras.style },
          hidden: hasAffix || hasGroup ? undefined : rootExtras.hidden,
        });
      }

      if (hasAffix) {
        const affixWrapperPrefixCls = `${props.prefixCls}-affix-wrapper`;
        const affixWrapperCls = [
          affixWrapperPrefixCls,
          {
            [`${props.prefixCls}-disabled`]: props.disabled,
            [`${affixWrapperPrefixCls}-disabled`]: props.disabled,
            [`${affixWrapperPrefixCls}-focused`]: props.focused,
            [`${affixWrapperPrefixCls}-readonly`]: props.readOnly,
            [`${affixWrapperPrefixCls}-input-with-clear-btn`]:
              props.suffix && props.allowClear && props.value,
          },
          props.classNames?.affixWrapper,
          props.classNames?.variant,
        ];
        const suffixNode =
          props.suffix || props.allowClear
            ? h(
                'span',
                {
                  class: [`${props.prefixCls}-suffix`, props.classNames?.suffix],
                  style: props.styles?.suffix,
                },
                [renderClear(), props.suffix],
              )
            : null;
        element = h(
          'span',
          {
            class: [affixWrapperCls, ...(hasGroup ? [] : [rootExtras.class])],
            style: hasGroup
              ? (props.styles?.affixWrapper ?? {})
              : { ...(props.styles?.affixWrapper ?? {}), ...rootExtras.style },
            onClick: onInputClick,
            ...(props.dataAttrs?.affixWrapper ?? {}),
            ref: containerRef,
            hidden: hasGroup ? undefined : rootExtras.hidden,
          },
          [
            props.prefix
              ? h(
                  'span',
                  {
                    class: [`${props.prefixCls}-prefix`, props.classNames?.prefix],
                    style: props.styles?.prefix,
                  },
                  [props.prefix],
                )
              : null,
            element,
            suffixNode,
          ],
        );
      }

      if (hasGroup) {
        const wrapperCls = `${props.prefixCls}-group`;
        const addonCls = `${wrapperCls}-addon`;
        const groupWrapperCls = `${wrapperCls}-wrapper`;
        element = h(
          'span',
          {
            class: [
              groupWrapperCls,
              { [`${groupWrapperCls}-disabled`]: props.disabled },
              props.classNames?.groupWrapper,
              rootExtras.class,
            ],
            style: rootExtras.style,
            ref: groupRef,
            hidden: rootExtras.hidden,
          },
          [
            h(
              'span',
              {
                class: [`${props.prefixCls}-wrapper`, wrapperCls, props.classNames?.wrapper],
              },
              [
                props.addonBefore ? h('span', { class: addonCls }, [props.addonBefore]) : null,
                element,
                props.addonAfter ? h('span', { class: addonCls }, [props.addonAfter]) : null,
              ],
            ),
          ],
        );
      }

      if (!element) {
        return null;
      }
      props.onExposeElement?.(groupRef.value ?? containerRef.value ?? null);
      return element;
    };
  },
});
