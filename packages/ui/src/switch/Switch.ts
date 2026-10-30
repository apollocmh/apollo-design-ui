/**
 * Vue native Switch: semantic change/update carry state, click carries the native
 * MouseEvent. Arrow keys use KeyboardEvent.key; Space/Enter use button activation.
 * DOM class structure and static theme styles remain independent of event payloads.
 */

import { LoadingOutlined } from '@apollo-design/icons';
import { mergeDomAttrs, useControlledValue, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  normalizeStyle,
  type PropType,
  type SlotsType,
  shallowRef,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useSize } from '../config-provider/size-context';
import type {
  SwitchConfig,
  SwitchEvent,
  SwitchProps,
  SwitchSemanticClassNames,
  SwitchSemanticStyles,
  SwitchSlots,
} from './interface';

export const SwitchComponent = defineComponent({
  name: 'ASwitch',
  inheritAttrs: false,
  expose: ['nativeElement', 'focus', 'blur'],
  props: {
    prefixCls: { type: String, default: undefined },
    size: { type: String as PropType<SwitchProps['size']>, default: undefined },
    checked: { type: Boolean, default: undefined },
    defaultChecked: { type: Boolean, default: undefined },
    value: { type: Boolean, default: undefined },
    defaultValue: { type: Boolean, default: undefined },
    /**
     * 选中 / 未选中时的内容。
     *
     * 🚨 **必须 `type: null`**（Issue #11.2）：公开类型是 `VNodeChild`
     * （`interface.ts` 逐字对齐上游 `React.ReactNode`），而运行时此前写成
     * `String` ⇒ 传 VNode 时 Vue 报 `Invalid prop: type check failed`。
     * `interface.ts` 的文件头注释**自己**写着该用这一形态（规则 D21），代码却没照做。
     *
     * ⚠️ 同名 slot（`#checkedChildren` / `#unCheckedChildren`）优先，见渲染处。
     */
    checkedChildren: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    unCheckedChildren: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    loading: { type: Boolean, default: false },
    autoFocus: { type: Boolean, default: undefined },
    title: { type: String, default: undefined },
    tabIndex: { type: Number, default: undefined },
    id: { type: String, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<SwitchProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<SwitchProps['styles']>, default: undefined },
  },
  slots: Object as SlotsType<SwitchSlots>,
  // Native click and semantic change use distinct, typed Vue events.
  emits: {
    click: (event: MouseEvent) => !!event,
    'update:checked': (checked: boolean) => typeof checked === 'boolean',
    'update:value': (checked: boolean) => typeof checked === 'boolean',
    change: (checked: boolean, event: SwitchEvent) => typeof checked === 'boolean' && !!event,
  },
  setup(props, { attrs, emit, slots }) {
    const context = useComponentConfig<SwitchConfig>('switch');
    const contextDisabled = useDisabled();
    const devWarning = useDevWarning('Switch');

    // ============================= Warning ==============================
    watchEffect(() => {
      devWarning.deprecated(props.size !== 'default', 'size="default"', 'size="medium"');
    });

    // ============================ Controlled ============================
    const [innerChecked, setInnerChecked] = useControlledValue<boolean>({
      defaultValue: () => props.defaultChecked ?? props.defaultValue ?? false,
      getValue: () => props.checked ?? props.value,
    });

    // ============================= Disabled =============================
    /** ⚠️ `||` 判据：`loading` 强制 disabled（判据 2）。 */
    const mergedDisabled = computed<boolean>(
      () => (props.disabled ?? contextDisabled.value) || props.loading,
    );

    const prefixCls = computed(() => context.getPrefixCls('switch', props.prefixCls));
    const contextSize = useSize<undefined>();
    // Switch has two visual sizes; the global large size uses its regular size.
    const mergedSize = computed(
      () => props.size ?? (contextSize.value === 'large' ? 'medium' : contextSize.value),
    );

    // ============================ Semantic ==============================
    const mergedProps = computed<SwitchProps>(() => ({
      ...props,
      size: mergedSize.value,
      disabled: mergedDisabled.value,
    }));
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      SwitchProps,
      SwitchSemanticClassNames,
      SwitchSemanticStyles
    >(
      [() => context.classNames, () => props.classNames],
      [() => context.styles, () => semanticRootStyle(context.style), () => props.styles],
      mergedProps,
    );

    // ============================== Events ==============================
    /** rc-switch 的 `triggerChange`：disabled 时不改状态、不发 onChange。 */
    const triggerChange = (newChecked: boolean, event: SwitchEvent): boolean => {
      let merged = innerChecked.value;
      if (!mergedDisabled.value) {
        merged = newChecked;
        setInnerChecked(merged);
        emit('update:checked', merged);
        emit('update:value', merged);
        emit('change', merged, event);
      }
      return merged;
    };

    const onInternalKeyDown = (event: KeyboardEvent) => {
      if (mergedDisabled.value || event.defaultPrevented) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        triggerChange(event.key === 'ArrowRight', event);
      }
    };

    const onInternalClick = (event: MouseEvent) => {
      triggerChange(!innerChecked.value, event);
      emit('click', event);
    };

    // ============================== Refs ===============================
    const buttonRef = shallowRef<HTMLButtonElement | null>(null);

    const renderSwitch = () => {
      const cls = prefixCls.value;

      // ⚠️ 顺序逐字对齐 antd：`clsx(prefixCls, contextClassName, {small,loading,rtl},
      //    className, rootClassName, 语义 root, {checked,disabled})`
      const classString = [
        cls,
        context.className,
        {
          [`${cls}-small`]: mergedSize.value === 'small',
          [`${cls}-loading`]: props.loading,
          [`${cls}-rtl`]: context.direction === 'rtl',
        },
        // 调用方原生 `class`（位置与原先的 props.className/rootClassName 一致）
        attrs.class,
        mergedClassNames.value.root,
        {
          [`${cls}-checked`]: innerChecked.value,
          [`${cls}-disabled`]: mergedDisabled.value,
        },
      ];

      const { class: _attrClass, style: attrStyle, ...restAttrs } = attrs;
      // Merge native listeners rather than replacing or manually invoking attrs.
      const rootAttrs = mergeDomAttrs({ onKeydown: onInternalKeyDown }, restAttrs);
      const rootStyle = normalizeStyle([mergedStyles.value.root, attrStyle]);

      return h(
        'button',
        {
          ...rootAttrs,
          type: 'button',
          role: 'switch',
          'aria-checked': String(innerChecked.value),
          disabled: mergedDisabled.value,
          class: classString,
          ...(typeof rootStyle === 'string' ? { style: rootStyle } : styleAttrs(rootStyle)),
          ref: buttonRef,
          // Declared native props need explicit routing; preserve native lowercase attrs too.
          title: props.title,
          id: props.id,
          tabindex: props.tabIndex ?? attrs.tabindex,
          autofocus: props.autoFocus ?? attrs.autofocus,
          onClick: onInternalClick,
        },
        [
          // ⚠️ 判据 7：`-handle` 恒存在，只有图标是条件渲染
          h(
            'div',
            {
              class: [`${cls}-handle`, mergedClassNames.value.indicator],
              ...styleAttrs(mergedStyles.value.indicator),
            },
            props.loading ? [h(LoadingOutlined, { class: `${cls}-loading-icon` })] : [],
          ),
          h('span', { class: `${cls}-inner` }, [
            h(
              'span',
              {
                class: [`${cls}-inner-checked`, mergedClassNames.value.content],
                ...styleAttrs(mergedStyles.value.content),
              },
              [slots.checkedChildren?.() ?? props.checkedChildren],
            ),
            h(
              'span',
              {
                class: [`${cls}-inner-unchecked`, mergedClassNames.value.content],
                ...styleAttrs(mergedStyles.value.content),
              },
              [slots.unCheckedChildren?.() ?? props.unCheckedChildren],
            ),
          ]),
        ],
      );
    };
    return {
      nativeElement: buttonRef,
      focus: (options?: FocusOptions): void => buttonRef.value?.focus(options),
      blur: (): void => buttonRef.value?.blur(),
      renderSwitch,
    };
  },
  render() {
    return this.renderSwitch();
  },
});

export const Switch = SwitchComponent;
export default Switch;
