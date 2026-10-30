/** Data-driven native radios; Vue owns their accepted model and notifications. */
import { isRenderable, useControlledValue, useId } from '@apollo-design/utils';
import {
  type ComponentPublicInstance,
  type CSSProperties,
  computed,
  defineComponent,
  h,
  nextTick,
  type PropType,
  shallowRef,
  type VNodeChild,
  watch,
} from 'vue';
import { mergeClassNames, mergeStyles, resolveSemantic } from '../_internal/use-merge-semantic';
import { useOrientation } from '../_internal/use-orientation';
import { useComponentConfig } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useSize } from '../config-provider/size-context';
import { Tooltip } from '../tooltip';
import { MotionThumb } from './components/MotionThumb';
import type {
  SegmentedLabeledOptionWithIcon,
  SegmentedOption,
  SegmentedProps,
  SegmentedSemanticClassNames,
  SegmentedSemanticStyles,
  SegmentedValue,
} from './interface';
import { useSegmentedTheme } from './use-segmented-theme';

type NormalizedSegmentedOption = Omit<SegmentedLabeledOptionWithIcon, 'icon'> & {
  icon?: VNodeChild;
};
function normalizeOption(option: SegmentedOption): NormalizedSegmentedOption {
  if (typeof option === 'object') {
    const label = option.label;
    return {
      ...option,
      label,
      title:
        option.title ??
        (typeof label === 'string' || typeof label === 'number' ? String(label) : undefined),
    };
  }
  return { value: option, label: String(option), title: String(option) };
}

export const SegmentedComponent = defineComponent({
  name: 'ASegmented',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    options: { type: Array as PropType<SegmentedProps['options']>, default: () => [] },
    disabled: { type: Boolean, default: undefined },
    defaultValue: { type: [String, Number] as PropType<SegmentedValue>, default: undefined },
    value: { type: [String, Number] as PropType<SegmentedValue>, default: undefined },
    name: { type: String, default: undefined },
    block: { type: Boolean, default: false },
    size: { type: String as PropType<SegmentedProps['size']>, default: undefined },
    vertical: { type: Boolean, default: undefined },
    orientation: { type: String as PropType<SegmentedProps['orientation']>, default: undefined },
    shape: { type: String as PropType<SegmentedProps['shape']>, default: 'default' },
    classNames: {
      type: [Object, Function] as PropType<SegmentedProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<SegmentedProps['styles']>, default: undefined },
  },
  emits: {
    'update:value': (_value: SegmentedValue) => true,
    change: (_value: SegmentedValue) => true,
    keydown: (_event: KeyboardEvent) => true,
  },
  setup(props, { attrs, emit, expose }) {
    const context = useComponentConfig<{
      className?: string;
      style?: CSSProperties;
      classNames?: SegmentedProps['classNames'];
      styles?: SegmentedProps['styles'];
    }>('segmented');
    const rootRef = shallowRef<HTMLDivElement | null>(null);
    const inputRefs = new Map<SegmentedValue, HTMLInputElement>();
    const prefixCls = computed(() => context.getPrefixCls('segmented', props.prefixCls));
    const themeStyles = useSegmentedTheme(() => prefixCls.value);
    const disabled = useDisabled(() => props.disabled);
    const size = useSize((contextSize) => props.size ?? contextSize);
    const defaultName = useId();
    const name = computed(() => props.name ?? defaultName);
    const orientation = useOrientation(
      () => props.orientation,
      () => props.vertical,
      undefined,
    );
    const vertical = computed(() => orientation.value[1]);
    const options = computed(() => props.options.map(normalizeOption));
    const [value, setValue] = useControlledValue<SegmentedValue | undefined>({
      defaultValue: () => props.defaultValue,
      getValue: () => props.value,
    });
    // Initialization is not a user change. Keep this accepted choice across later
    // reordering/removal, including when the initial options arrive asynchronously.
    watch(
      options,
      (current) => {
        if (value.value === undefined && props.value === undefined && current[0])
          setValue(current[0].value);
      },
      { immediate: true },
    );
    const enabledOptions = computed(() => options.value.filter((option) => !option.disabled));
    const tabValue = computed(
      () =>
        enabledOptions.value.find((option) => option.value === value.value)?.value ??
        enabledOptions.value[0]?.value,
    );
    const syncNativeState = () => {
      for (const [key, input] of inputRefs) input.checked = key === value.value;
    };
    const triggerChange = (next: SegmentedValue) => {
      if (!disabled.value && next !== value.value) {
        setValue(next);
        emit('update:value', next);
        emit('change', next);
      }
      // A browser changes radio.checked before change, even when a controlled
      // parent refuses the proposal and Vue has no changed prop to patch.
      void nextTick(syncNativeState);
    };
    const keyboardFocus = shallowRef(false);
    const focusedValue = shallowRef<SegmentedValue | undefined>();
    const handleKeydown = (event: KeyboardEvent) => {
      emit('keydown', event);
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || disabled.value)
        return;
      if (
        event.target !== rootRef.value &&
        ![...inputRefs.values()].some((input) => input === event.target)
      )
        return;
      let offset: number;
      switch (event.key) {
        case 'ArrowLeft':
          offset = context.direction === 'rtl' && !vertical.value ? 1 : -1;
          break;
        case 'ArrowRight':
          offset = context.direction === 'rtl' && !vertical.value ? -1 : 1;
          break;
        case 'ArrowUp':
          offset = -1;
          break;
        case 'ArrowDown':
          offset = 1;
          break;
        default:
          return;
      }
      event.preventDefault();
      keyboardFocus.value = true;
      const current = enabledOptions.value;
      const index = current.findIndex((option) => option.value === value.value);
      const nextIndex =
        index < 0
          ? offset > 0
            ? 0
            : current.length - 1
          : (index + offset + current.length) % current.length;
      const next = current[nextIndex];
      if (!next) return;
      triggerChange(next.value);
      void nextTick(() => {
        if (value.value === next.value && !disabled.value) inputRefs.get(next.value)?.focus();
      });
    };
    const thumbShow = shallowRef(false);
    const getValueIndex = (key: SegmentedValue | undefined) =>
      options.value.findIndex((option) => option.value === key);
    const semanticProps = computed<SegmentedProps>(() => ({
      ...props,
      value: value.value,
      disabled: disabled.value,
      size: size.value,
    }));
    const info = computed(() => ({ props: semanticProps.value }));
    const classes = computed(() =>
      mergeClassNames<SegmentedSemanticClassNames>(
        resolveSemantic(context.classNames, info.value),
        resolveSemantic(props.classNames, info.value),
      ),
    );
    const styles = computed(() =>
      mergeStyles<SegmentedSemanticStyles>(
        resolveSemantic(context.styles, info.value),
        context.style ? { root: context.style } : undefined,
        resolveSemantic(props.styles, info.value),
      ),
    );
    expose({
      get nativeElement() {
        return rootRef.value;
      },
    });

    return () => {
      const cls = prefixCls.value;
      const { class: nativeClass, style: nativeStyle, ...rootAttrs } = attrs;
      const items = options.value.map((option) => {
        const checked = option.value === value.value;
        const optionDisabled = disabled.value || !!option.disabled;
        const icon = option.icon;
        const labelContents: VNodeChild = isRenderable(icon)
          ? [
              h(
                'span',
                {
                  key: 'icon',
                  class: [`${cls}-item-icon`, classes.value.icon],
                  style: styles.value.icon,
                },
                [icon],
              ),
              isRenderable(option.label) ? h('span', { key: 'label' }, [option.label]) : null,
            ]
          : option.label;
        const label = h(
          'label',
          {
            key: option.value,
            id: option.id,
            class: [
              option.className,
              `${cls}-item`,
              classes.value.item,
              {
                [`${cls}-item-selected`]: checked && !thumbShow.value,
                [`${cls}-item-selected-text`]: checked,
                [`${cls}-item-focused`]: focusedValue.value === option.value && keyboardFocus.value,
                [`${cls}-item-disabled`]: optionDisabled,
              },
            ],
            style: styles.value.item,
            onMousedown: () => {
              keyboardFocus.value = false;
            },
          },
          [
            h('input', {
              type: 'radio',
              value: option.value,
              'aria-label': isRenderable(option.label)
                ? undefined
                : (option.title ?? String(option.value)),
              name: name.value,
              class: `${cls}-item-input`,
              disabled: optionDisabled,
              checked,
              tabindex: !optionDisabled && option.value === tabValue.value ? 0 : -1,
              ref: (element: Element | ComponentPublicInstance | null) => {
                if (element instanceof HTMLInputElement) inputRefs.set(option.value, element);
                else inputRefs.delete(option.value);
              },
              onChange: () => {
                if (!optionDisabled) triggerChange(option.value);
                else void nextTick(syncNativeState);
              },
              onFocus: () => {
                focusedValue.value = option.value;
              },
              onBlur: () => {
                focusedValue.value = undefined;
              },
              onKeyup: (event: KeyboardEvent) => {
                if (event.key === 'Tab') keyboardFocus.value = true;
              },
            }),
            h(
              'div',
              {
                class: [`${cls}-item-label`, classes.value.label],
                title: option.title,
                style: styles.value.label,
              },
              [labelContents],
            ),
          ],
        );
        const tooltip = option.tooltip;
        return tooltip
          ? h(
              Tooltip,
              {
                key: option.value,
                ...(typeof tooltip === 'string' ? { title: tooltip } : tooltip),
              },
              { default: () => label },
            )
          : label;
      });
      return h(
        'div',
        {
          role: 'radiogroup',
          'aria-label': 'segmented control',
          'aria-orientation': vertical.value ? 'vertical' : 'horizontal',
          ...rootAttrs,
          onKeydown: handleKeydown,
          class: [
            cls,
            context.className,
            classes.value.root,
            nativeClass,
            {
              [`${cls}-block`]: props.block,
              [`${cls}-sm`]: size.value === 'small',
              [`${cls}-lg`]: size.value === 'large',
              [`${cls}-vertical`]: vertical.value,
              [`${cls}-rtl`]: context.direction === 'rtl',
              [`${cls}-disabled`]: disabled.value,
              [`${cls}-shape-round`]: props.shape === 'round',
            },
            { [`${cls}-vertical`]: vertical.value },
          ],
          style: [themeStyles.value, styles.value.root, nativeStyle],
          ref: rootRef,
        },
        [
          h('div', { class: `${cls}-group` }, [
            h(MotionThumb, {
              prefixCls: cls,
              containerRef: rootRef,
              value: value.value,
              getValueIndex,
              motionName: `${cls}-thumb-motion`,
              vertical: vertical.value,
              direction: context.direction,
              onMotionStart: () => {
                thumbShow.value = true;
              },
              onMotionEnd: () => {
                thumbShow.value = false;
              },
            }),
            ...items,
          ]),
        ],
      );
    };
  },
});

export const Segmented = SegmentedComponent;
export default SegmentedComponent;
