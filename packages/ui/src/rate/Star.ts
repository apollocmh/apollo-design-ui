/**
 * Rate 的星项 —— rc-rate `Star.js`（80 行）的逐字自建。
 *
 * **内部组件**（C8-R2 豁免清单：engine/内部渲染组件允许函数 prop）：
 * `character` / `characterRender` 由 Rate 以函数 prop 下发（闭合读取用户的
 * `#character` / `#characterRender` 插槽），Star 只负责事件与类名三态。
 */

import {
  type ComponentPublicInstance,
  defineComponent,
  h,
  type PropType,
  type VNodeChild,
} from 'vue';
import type { TooltipProps } from '../tooltip/interface';
import Tooltip from '../tooltip/Tooltip';

export interface StarProps {
  prefixCls: string;
  index: number;
  count: number;
  value: number;
  checked: boolean;
  label: string;
  tabIndex: number;
  tooltip?: TooltipProps | string;
  allowHalf?: boolean;
  disabled?: boolean;
  focused?: boolean;
  /** 渲染 character 内容（Rate 侧闭合 `#character` 插槽 / 默认 StarFilled）。 */
  character: (info: { index: number }) => VNodeChild;
  /** 包装整个 li（Rate 侧闭合 tooltips 包装 + `#characterRender`）。 */
  characterRender?: (node: VNodeChild, info: { index: number }) => VNodeChild;
  onInternalClick?: (event: MouseEvent | KeyboardEvent, index: number) => void;
  onInternalHover?: (event: MouseEvent, index: number) => void;
  /** li 元素注册（Rate 的 getStarRef 用，rc 的 useRefs 等价物）。 */
  starRef: (el: Element | null) => void;
}

const StarComponent = defineComponent({
  name: 'ARateStar',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    index: { type: Number, required: true },
    count: { type: Number, required: true },
    value: { type: Number, required: true },
    checked: { type: Boolean, required: true },
    label: { type: String, required: true },
    tabIndex: { type: Number, required: true },
    tooltip: { type: [String, Object] as PropType<StarProps['tooltip']>, default: undefined },
    allowHalf: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    focused: { type: Boolean, default: false },
    character: {
      type: Function as PropType<StarProps['character']>,
      required: true,
    },
    characterRender: {
      type: Function as PropType<StarProps['characterRender']>,
      default: undefined,
    },
    onInternalClick: {
      type: Function as PropType<StarProps['onInternalClick']>,
      default: undefined,
    },
    onInternalHover: {
      type: Function as PropType<StarProps['onInternalHover']>,
      default: undefined,
    },
    starRef: { type: Function as PropType<StarProps['starRef']>, required: true },
  },
  setup(props) {
    const setElement = (element: Element | ComponentPublicInstance | null): void => {
      props.starRef(element instanceof Element ? element : null);
    };

    const onHover = (e: MouseEvent) => {
      if (!props.disabled) props.onInternalHover?.(e, props.index);
    };
    const onClick = (e: MouseEvent | KeyboardEvent) => {
      if (!props.disabled) props.onInternalClick?.(e, props.index);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!props.disabled && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        props.onInternalClick?.(e, props.index);
      }
    };

    return () => {
      const { prefixCls, index, count, value, allowHalf, focused } = props;
      const starValue = index + 1;

      // rc：类名三态（Set 收敛）
      const classNameList = new Set<string>([prefixCls]);
      if (allowHalf && value + 0.5 >= starValue && value < starValue) {
        classNameList.add(`${prefixCls}-half`);
        classNameList.add(`${prefixCls}-active`);
      } else {
        if (starValue <= value) {
          classNameList.add(`${prefixCls}-full`);
        } else {
          classNameList.add(`${prefixCls}-zero`);
        }
      }
      if (focused && (value === 0 ? index === 0 : Math.ceil(value) === starValue)) {
        classNameList.add(`${prefixCls}-focused`);
      }

      const characterNode = props.character({ index });
      const tooltipProps =
        typeof props.tooltip === 'object' ? props.tooltip : { title: props.tooltip };
      const radio = h(
        'div',
        {
          role: 'radio',
          'aria-checked': String(props.checked),
          'aria-label': props.label,
          'aria-posinset': index + 1,
          'aria-setsize': count,
          tabIndex: props.tabIndex,
          onClick,
          onKeydown: onKeyDown,
          onMousemove: onHover,
        },
        [
          h('div', { class: `${prefixCls}-first` }, [characterNode]),
          h('div', { class: `${prefixCls}-second` }, [characterNode]),
        ],
      );

      let start: VNodeChild = h(
        'li',
        {
          class: Array.from(classNameList).join(' '),
          role: 'none',
          ref: setElement,
        },
        // The stable trigger preserves radio DOM/focus when tooltip content changes.
        [h(Tooltip, tooltipProps, { default: () => radio })],
      );

      if (props.characterRender) {
        start = props.characterRender(start, { index }) ?? start;
      }
      return start;
    };
  },
});

export default StarComponent;
