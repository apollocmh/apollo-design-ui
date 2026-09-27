/**
 * Rate 的星项 —— rc-rate `Star.js`（80 行）的逐字自建。
 *
 * **内部组件**（C8-R2 豁免清单：engine/内部渲染组件允许函数 prop）：
 * `character` / `characterRender` 由 Rate 以函数 prop 下发（闭合读取用户的
 * `#character` / `#characterRender` 插槽），Star 只负责事件与类名三态。
 */

import { KeyCode } from '@apollo-design/utils';
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  type VNodeChild,
} from 'vue';

export interface StarProps {
  prefixCls: string;
  index: number;
  count: number;
  value: number;
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
    // li 元素注册：不用 Vue 函数 ref（vue-tsc 对 h() 的 ref 联合有误报），改走
    // mounted/unmount 生命周期回调 —— 对 Rate 侧的 starEls 表等价。
    const liRef = ref<HTMLElement | null>(null);
    onMounted(() => props.starRef(liRef.value));
    onBeforeUnmount(() => props.starRef(null));

    const onHover = (e: MouseEvent) => {
      if (!props.disabled) props.onInternalHover?.(e, props.index);
    };
    const onClick = (e: MouseEvent | KeyboardEvent) => {
      if (!props.disabled) props.onInternalClick?.(e, props.index);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!props.disabled && e.keyCode === KeyCode.ENTER) {
        props.onInternalClick?.(e, props.index);
      }
    };

    return () => {
      const { prefixCls, index, count, value, allowHalf, focused } = props;
      const starValue = index + 1;

      // rc：类名三态（Set 收敛）
      const classNameList = new Set<string>([prefixCls]);
      if (value === 0 && index === 0 && focused) {
        classNameList.add(`${prefixCls}-focused`);
      } else if (allowHalf && value + 0.5 >= starValue && value < starValue) {
        classNameList.add(`${prefixCls}-half`);
        classNameList.add(`${prefixCls}-active`);
        if (focused) {
          classNameList.add(`${prefixCls}-focused`);
        }
      } else {
        if (starValue <= value) {
          classNameList.add(`${prefixCls}-full`);
        } else {
          classNameList.add(`${prefixCls}-zero`);
        }
        if (starValue === value && focused) {
          classNameList.add(`${prefixCls}-focused`);
        }
      }

      const characterNode = props.character({ index });

      let start: VNodeChild = h(
        'li',
        {
          class: Array.from(classNameList).join(' '),
          ref: liRef,
        },
        [
          h(
            'div',
            {
              role: 'radio',
              'aria-checked': value > index ? 'true' : 'false',
              'aria-posinset': index + 1,
              'aria-setsize': count,
              tabIndex: props.disabled ? -1 : 0,
              onClick,
              onKeydown: onKeyDown,
              onMousemove: onHover,
            },
            [
              h('div', { class: `${prefixCls}-first` }, [characterNode]),
              h('div', { class: `${prefixCls}-second` }, [characterNode]),
            ],
          ),
        ],
      );

      if (props.characterRender) {
        start = props.characterRender(start, { index }) ?? start;
      }
      return start;
    };
  },
});

export default StarComponent;
