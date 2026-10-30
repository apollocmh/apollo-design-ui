/** Vue rating state and typed events; character slots compose with optional tooltips. */

import { StarFilled } from '@apollo-design/icons';
import { mergeDomAttrs, pickAttrs, useControlledValue, useDevWarning } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  onMounted,
  type PropType,
  ref,
  type SlotsType,
  type VNode,
  type VNodeChild,
  watch,
  watchEffect,
} from 'vue';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useSize } from '../config-provider/size-context';
import type { RateProps, RateRef, RateSlots } from './interface';
import StarComponent from './Star';
import { useRateTheme } from './use-rate-theme';
import { getOffsetLeft } from './util';

/** antd 薄壳从 `useComponentConfig('rate')` 读取的组件级配置。 */
export interface RateConfig {
  className?: string;
  style?: CSSProperties;
}

export const ratePropDefs = {
  prefixCls: { type: String, default: undefined },
  value: { type: Number, default: undefined },
  defaultValue: { type: Number, default: undefined },
  count: { type: Number, default: undefined },
  allowHalf: { type: Boolean, default: false },
  allowClear: { type: Boolean, default: true },
  keyboard: { type: Boolean, default: true },
  disabled: { type: Boolean, default: undefined },
  tabIndex: { type: Number, default: undefined },
  autoFocus: { type: Boolean, default: undefined },
  direction: { type: String as PropType<RateProps['direction']>, default: undefined },
  id: { type: String, default: undefined },
  tooltips: {
    type: Array as PropType<RateProps['tooltips']>,
    default: undefined,
  },
  size: { type: String as PropType<RateProps['size']>, default: undefined },
};

const RateComponent = defineComponent({
  name: 'ARate',
  inheritAttrs: false,
  props: ratePropDefs,
  slots: Object as SlotsType<RateSlots>,
  emits: {
    'update:value': (_value: number) => true,
    change: (_value: number) => true,
    hoverChange: (_value: number | undefined) => true,
    focus: (_event: FocusEvent) => true,
    blur: (_event: FocusEvent) => true,
  },
  setup(props, { attrs, emit, expose, slots }) {
    const context = useComponentConfig<RateConfig>('rate');
    const directionContext = useDirection();

    // ============================ Warning ==============================
    const devWarning = useDevWarning('Rate');
    watchEffect(() => {
      devWarning(
        props.value === undefined || Number.isInteger(props.value) || props.allowHalf === true,
        '`value` is not an integer when `allowHalf` is false.',
      );
    });

    // ============================ Prefix ==============================
    const prefixCls = computed(() => context.getPrefixCls('rate', props.prefixCls));
    const themeStyle = useRateTheme(() => prefixCls.value);

    // =========================== Disabled =============================
    const contextDisabled = useDisabled();
    const mergedDisabled = computed(() => props.disabled ?? contextDisabled.value);

    // ============================= Size ===============================
    const mergedSize = useSize((ctx) => props.size ?? ctx);

    // ============================= Value ==============================
    const [mergedValue, setValue] = useControlledValue<number>({
      defaultValue: props.defaultValue ?? 0,
      getValue: () => props.value,
      onChange: (next) => {
        emit('change', next);
        emit('update:value', next);
      },
    });

    const cleanedValue = ref<number | null>(null);

    const getStarValue = (index: number, x: number): number => {
      const reverse = (props.direction ?? directionContext.value) === 'rtl';
      let starValue = index + 1;
      if (props.allowHalf) {
        const starEle = starEls[index];
        const leftDis = starEle ? getOffsetLeft(starEle) : 0;
        const width = starEle?.clientWidth ?? 0;
        if (reverse && x - leftDis > width / 2) {
          starValue -= 0.5;
        } else if (!reverse && x - leftDis < width / 2) {
          starValue -= 0.5;
        }
      }
      return starValue;
    };

    // >>>>> Change
    const changeValue = (nextValue: number): void => {
      setValue(nextValue);
    };

    // =========================== Focus ============================
    const rootRef = ref<HTMLUListElement | null>(null);
    const focused = ref(false);
    const activeIndex = computed(() =>
      Math.min(Math.max(Math.ceil(mergedValue.value) - 1, 0), (props.count ?? 5) - 1),
    );

    const focusCurrentStar = (): void => {
      starEls[activeIndex.value]?.querySelector<HTMLElement>('[role="radio"]')?.focus();
    };

    const triggerFocus = (): void => {
      if (!mergedDisabled.value) focusCurrentStar();
    };

    const onInternalFocus = (event: FocusEvent): void => {
      if (!focused.value && !mergedDisabled.value) {
        focused.value = true;
        emit('focus', event);
      }
    };
    const onInternalBlur = (event: FocusEvent): void => {
      if (event.relatedTarget instanceof Node && rootRef.value?.contains(event.relatedTarget))
        return;
      if (!focused.value) return;
      focused.value = false;
      emit('blur', event);
    };

    // =========================== Hover ============================
    const hoverValue = ref<number | null>(null);

    watch(mergedDisabled, (disabled) => {
      if (disabled) {
        hoverValue.value = null;
        cleanedValue.value = null;
      }
    });

    watch(
      activeIndex,
      () => {
        if (focused.value && !mergedDisabled.value) focusCurrentStar();
      },
      { flush: 'post' },
    );

    const onHover = (event: MouseEvent, index: number): void => {
      const nextHoverValue = getStarValue(index, event.pageX);
      if (nextHoverValue !== cleanedValue.value) {
        hoverValue.value = nextHoverValue;
        cleanedValue.value = null;
      }
      emit('hoverChange', nextHoverValue);
    };

    const onMouseLeaveCallback = (): void => {
      if (!mergedDisabled.value) {
        hoverValue.value = null;
        cleanedValue.value = null;
        emit('hoverChange', undefined);
      }
    };

    // =========================== Click ============================
    const onClick = (event: MouseEvent | KeyboardEvent, index: number): void => {
      if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus();
      const newValue =
        event instanceof KeyboardEvent ? index + 1 : getStarValue(index, event.pageX);
      let isReset = false;
      if (props.allowClear) {
        isReset = newValue === mergedValue.value;
      }
      onMouseLeaveCallback();
      changeValue(isReset ? 0 : newValue);
      cleanedValue.value = isReset ? newValue : null;
    };

    const onInternalKeyDown = (event: KeyboardEvent): void => {
      const { key } = event;
      const reverse = (props.direction ?? directionContext.value) === 'rtl';
      const step = props.allowHalf ? 0.5 : 1;
      if (props.keyboard) {
        if (key === 'ArrowRight' && mergedValue.value < (props.count ?? 5) && !reverse) {
          changeValue(mergedValue.value + step);
          event.preventDefault();
        } else if (key === 'ArrowLeft' && mergedValue.value > 0 && !reverse) {
          changeValue(mergedValue.value - step);
          event.preventDefault();
        } else if (key === 'ArrowRight' && mergedValue.value > 0 && reverse) {
          changeValue(mergedValue.value - step);
          event.preventDefault();
        } else if (key === 'ArrowLeft' && mergedValue.value < (props.count ?? 5) && reverse) {
          changeValue(mergedValue.value + step);
          event.preventDefault();
        }
      }
    };

    // =========================== Ref =============================
    const starEls: (Element | null)[] = [];
    const setStarRef = (index: number) => (el: Element | null) => {
      starEls[index] = el;
    };

    const blur = (): void => {
      const active = rootRef.value?.ownerDocument.activeElement;
      if (
        !mergedDisabled.value &&
        active instanceof HTMLElement &&
        rootRef.value?.contains(active)
      ) {
        active.blur();
      }
    };
    expose({ focus: triggerFocus, blur } satisfies RateRef);

    onMounted(() => {
      if (props.autoFocus && !mergedDisabled.value) {
        triggerFocus();
      }
    });

    // =========================== Render ===========================
    // rc 的 character：fn(props) → VNode；本仓 `#character` 插槽（slot props =
    // StarRenderInfo），默认 StarFilled（antd 壳的默认值）。
    const renderCharacter = (info: { index: number }): VNodeChild => {
      const fn = slots.character;
      if (typeof fn === 'function') {
        return fn({
          index: info.index,
          value: hoverValue.value ?? mergedValue.value,
          allowHalf: props.allowHalf === true,
          disabled: mergedDisabled.value,
          count: props.count ?? 5,
          focused: focused.value,
        });
      }
      return h(StarFilled);
    };

    const renderCharacterWrapped = (node: VNodeChild, info: { index: number }): VNodeChild => {
      const index = info.index;
      const userRender = slots.characterRender;
      if (typeof userRender === 'function') {
        return userRender({ node, index });
      }
      return node;
    };

    const renderRate = () => {
      const cls = prefixCls.value;
      const count = props.count ?? 5;
      const displayValue = hoverValue.value === null ? mergedValue.value : hoverValue.value;

      const starNodes: VNode[] = Array.from({ length: count }, (_, index) =>
        h(StarComponent, {
          key: index,
          index,
          count,
          value: displayValue,
          tooltip: props.tooltips?.[index],
          checked: Math.ceil(mergedValue.value) === index + 1,
          label: String(Math.ceil(mergedValue.value) === index + 1 ? mergedValue.value : index + 1),
          tabIndex:
            mergedDisabled.value || activeIndex.value !== index ? -1 : (props.tabIndex ?? 0),
          allowHalf: props.allowHalf === true,
          disabled: mergedDisabled.value,
          focused: focused.value,
          prefixCls: `${cls}-star`,
          character: renderCharacter,
          characterRender: renderCharacterWrapped,
          onInternalClick: onClick,
          onInternalHover: onHover,
          starRef: setStarRef(index),
        }),
      );

      const classString = [
        cls,
        // 调用方原生 `class`（位置与原先的 props.className 一致）
        attrs.class as string | undefined,
        mergedDisabled.value ? `${cls}-disabled` : '',
        (props.direction ?? directionContext.value) === 'rtl' ? `${cls}-rtl` : '',
        mergedSize.value === 'large' ? `${cls}-large` : '',
        mergedSize.value === 'small' ? `${cls}-small` : '',
        context.className,
        `${cls}-css-var`,
      ]
        .filter(Boolean)
        .join(' ');

      // Native style values stay intact until mergeDomAttrs combines them with context style.
      const domAttrs = mergeDomAttrs(pickAttrs(attrs, { aria: true, data: true, attr: true }));
      if (mergedDisabled.value) {
        for (const key of Object.keys(domAttrs)) {
          if (/^onKeydown(?:Once|Passive|Capture)*$/.test(key)) delete domAttrs[key];
        }
      }

      return h(
        'ul',
        mergeDomAttrs(
          {
            class: classString,
            style: [themeStyle.value, context.style],
            onFocusin: onInternalFocus,
            onFocusout: onInternalBlur,
            onKeydown: mergedDisabled.value ? null : onInternalKeyDown,
            onMouseleave: onMouseLeaveCallback,
          },
          domAttrs,
          {
            id: props.id,
            role: 'radiogroup',
            'aria-disabled': mergedDisabled.value || undefined,
            tabIndex: -1,
            ref: rootRef,
          },
        ),
        starNodes,
      );
    };
    return { focus: triggerFocus, blur, renderRate };
  },
  render() {
    return this.renderRate();
  },
});

export default RateComponent;
