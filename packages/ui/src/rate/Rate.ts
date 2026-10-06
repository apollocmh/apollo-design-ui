/**
 * Rate 评分 —— rc-rate `Rate.js`（193 行）的逐字自建 + antd `index.tsx`（102 行）壳。
 *
 * 上游是**兼容性规格**，不是代码来源（H2/H3）。
 *
 * ## 文件头判据（实现期踩坑沉淀）
 *
 * 1. **onChange 等是 props 形态回调**，不声明 emits（PITFALLS 35：声明了会被 Vue
 *    从 attrs 摘掉）；v-model 走 `update:value`（COMPATIBILITY.md 规则 C11：两者同时发出）。
 * 2. **hover 展示值**：Star 的 `value` = `hoverValue ?? value`（rc 逐字）——hover 时
 *    整条星星按 hoverValue 重算类名，移出回落。
 * 3. **cleanedValue**：allowClear 点击同值重置 0 后记录被清的值；hover 更新判据是
 *    `nextHoverValue !== cleanedValue`（防止清零后 hover 回同一值闪烁）。
 * 4. **C8-R2**：antd `character`（ReactNode）→ `#character` 插槽（默认 StarFilled）；
 *    `characterRender`（fn）→ `#characterRender` 作用域插槽。tooltips 是数据 prop
 *    （string / TooltipProps 对象），在内部经 characterRender 通道包装 —— antd 里
 *    用户 characterRender 会**覆盖** tooltip 包装（JSX spread 在后），本仓为 slot
 *    **组合**（先 tooltip 再用户插槽），登记 INTENDED（COMPATIBILITY.md）。
 * 5. **tooltips 的 TooltipProps 对象形态**：`isPlainObject` 判据 ⇒ `<Tooltip {...props}>`；
 *    string ⇒ `<Tooltip title>`。
 */

import { StarFilled } from '@apollo-design/icons';
import {
  isPlainObject,
  KeyCode,
  pickAttrs,
  useControlledValue,
  useDevWarning,
} from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  onMounted,
  type PropType,
  ref,
  type VNode,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useSize } from '../config-provider/size-context';
import Tooltip from '../tooltip/Tooltip';
import type { RateProps } from './interface';
import StarComponent from './Star';
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
  /**
   * ⚠️ 只声明 `update:value`（供 `v-model:value`），**不**声明 `change` ——
   * antd 的 `onChange` 是 props 形态回调，声明成 emits 会被 Vue 从 attrs 摘掉
   * （PITFALLS 35）。两者同时发出（COMPATIBILITY.md 规则 C11）。
   */
  emits: ['update:value'],
  setup(props, { attrs, emit, expose, slots }) {
    const callbacks = attrs as unknown as Pick<
      RateProps,
      'onChange' | 'onHoverChange' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'onMouseLeave'
    >;

    const context = useComponentConfig<RateConfig>('rate');
    const { getPrefixCls } = context;
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
    const prefixCls = computed(() => getPrefixCls('rate', props.prefixCls));

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
        callbacks.onChange?.(next);
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

    const triggerFocus = (): void => {
      if (!mergedDisabled.value) {
        rootRef.value?.focus();
      }
    };

    const onInternalFocus = (): void => {
      focused.value = true;
      callbacks.onFocus?.();
    };
    const onInternalBlur = (): void => {
      focused.value = false;
      callbacks.onBlur?.();
    };

    // =========================== Hover ============================
    const hoverValue = ref<number | null>(null);

    const onHover = (event: MouseEvent, index: number): void => {
      const nextHoverValue = getStarValue(index, event.pageX);
      if (nextHoverValue !== cleanedValue.value) {
        hoverValue.value = nextHoverValue;
        cleanedValue.value = null;
      }
      callbacks.onHoverChange?.(nextHoverValue);
    };

    const onMouseLeaveCallback = (event?: MouseEvent): void => {
      if (!mergedDisabled.value) {
        hoverValue.value = null;
        cleanedValue.value = null;
        callbacks.onHoverChange?.(undefined);
      }
      if (event) {
        callbacks.onMouseLeave?.(event);
      }
    };

    // =========================== Click ============================
    const onClick = (event: MouseEvent | KeyboardEvent, index: number): void => {
      const newValue = getStarValue(index, (event as MouseEvent).pageX ?? 0);
      let isReset = false;
      if (props.allowClear) {
        isReset = newValue === mergedValue.value;
      }
      onMouseLeaveCallback();
      changeValue(isReset ? 0 : newValue);
      cleanedValue.value = isReset ? newValue : null;
    };

    const onInternalKeyDown = (event: KeyboardEvent): void => {
      const { keyCode } = event;
      const reverse = (props.direction ?? directionContext.value) === 'rtl';
      const step = props.allowHalf ? 0.5 : 1;
      if (props.keyboard) {
        if (keyCode === KeyCode.RIGHT && mergedValue.value < (props.count ?? 5) && !reverse) {
          changeValue(mergedValue.value + step);
          event.preventDefault();
        } else if (keyCode === KeyCode.LEFT && mergedValue.value > 0 && !reverse) {
          changeValue(mergedValue.value - step);
          event.preventDefault();
        } else if (keyCode === KeyCode.RIGHT && mergedValue.value > 0 && reverse) {
          changeValue(mergedValue.value - step);
          event.preventDefault();
        } else if (keyCode === KeyCode.LEFT && mergedValue.value < (props.count ?? 5) && reverse) {
          changeValue(mergedValue.value + step);
          event.preventDefault();
        }
      }
      callbacks.onKeyDown?.(event);
    };

    // =========================== Ref =============================
    const starEls: (Element | null)[] = [];
    const setStarRef = (index: number) => (el: Element | null) => {
      starEls[index] = el;
    };

    expose({
      focus: triggerFocus,
      blur: () => {
        if (!mergedDisabled.value) {
          rootRef.value?.blur();
        }
      },
    });

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
          value: mergedValue.value,
          allowHalf: props.allowHalf === true,
          disabled: mergedDisabled.value,
          count: props.count ?? 5,
          focused: focused.value,
        }) as VNodeChild;
      }
      return h(StarFilled);
    };

    // antd 壳的 characterRender：tooltips 包装。C8-R2 下与用户 `#characterRender`
    // 插槽**组合**（antd 是覆盖 —— JSX spread 在后，用户传了 tooltips 就断）。
    const wrapTooltip = (node: VNodeChild, index: number): VNodeChild => {
      const tooltipsItem = props.tooltips?.[index];
      if (tooltipsItem === undefined || tooltipsItem === null) {
        return node;
      }
      if (isPlainObject(tooltipsItem)) {
        return h(Tooltip, tooltipsItem as never, { default: () => node });
      }
      // isPlainObject 不收窄类型（boolean 返回）—— 此处已是 string 分支
      return h(Tooltip, { title: tooltipsItem as string }, { default: () => node });
    };

    const renderCharacterWrapped = (node: VNodeChild, info: { index: number }): VNodeChild => {
      const index = info.index;
      const withTooltip = wrapTooltip(node, index);
      const userRender = slots.characterRender;
      if (typeof userRender === 'function') {
        return (userRender({ node: withTooltip, index }) as VNodeChild) ?? withTooltip;
      }
      return withTooltip;
    };

    return () => {
      const cls = prefixCls.value;
      const count = props.count ?? 5;
      const displayValue = hoverValue.value === null ? mergedValue.value : hoverValue.value;

      const starNodes: VNode[] = Array.from({ length: count }, (_, index) =>
        h(StarComponent, {
          key: index,
          index,
          count,
          value: displayValue,
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

      // antd：restProps 经 pickAttrs({aria,data,attr}) 落根 ul。本仓的手工回调
      // （onFocus/onBlur/onKeyDown/onMouseLeave/onChange/onHoverChange）已内联处理，
      // 从 attrs 剔除避免重复绑定。
      const {
        onFocus: _f,
        onBlur: _b,
        onKeydown: _k,
        onKeyDown: _k2,
        onMouseleave: _ml,
        onMouseLeave: _ml2,
        onChange: _c,
        onHoverChange: _h,
        ...restAttrs
      } = attrs as Record<string, unknown>;
      void _f;
      void _b;
      void _k;
      void _k2;
      void _ml;
      void _ml2;
      void _c;
      void _h;

      // 根 `style` 是 Vue 原生 attrs（位置与原先的 props.style 一致：最后胜出）
      const rootStyle = {
        ...(context.style as CSSProperties),
        ...((attrs.style as CSSProperties) ?? {}),
      };

      return h(
        'ul',
        {
          ...pickAttrs(restAttrs, { aria: true, data: true, attr: true }),
          class: classString,
          style: rootStyle,
          id: props.id,
          tabIndex: mergedDisabled.value ? -1 : (props.tabIndex ?? 0),
          onFocus: mergedDisabled.value ? null : onInternalFocus,
          onBlur: mergedDisabled.value ? null : onInternalBlur,
          onKeydown: mergedDisabled.value ? null : onInternalKeyDown,
          onMouseleave: onMouseLeaveCallback,
          ref: rootRef,
        },
        starNodes,
      );
    };
  },
});

export default RateComponent;
