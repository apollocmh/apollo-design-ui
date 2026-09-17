/**
 * 占位元素：把「内容真实总高」撑出来，同时把已渲染的项平移到正确位置。
 *
 * 契约来源：`@rc-component/virtual-list@1.5.1/es/Filler.js`（59 行）。
 *
 * DOM 结构（`offsetY` 有值时）：
 *
 * ```html
 * <div style="height:{height}px; position:relative; overflow:hidden">
 *   <div class="{prefixCls}-holder-inner"
 *        style="display:flex; flex-direction:column; position:absolute; left:0; right:0; top:0;
 *               transform:translateY({offsetY}px)">…</div>
 * </div>
 * ```
 *
 * ⚠️ **不设 `width`** —— 上游注释写得很明确：「Not set `width` since this will break
 *    `sticky: right`」。外层只设高度。
 */

import { useResizeObserver } from '@apollo-design/utils';
import { defineComponent, h, type PropType, ref } from 'vue';

export interface FillerProps {
  prefixCls?: string | undefined;
  /** 内容总高（`scrollHeight`）。`undefined` 时不设高度 */
  height?: number | undefined;
  /** 内层 `translateY`。**`undefined` 表示走「非虚拟」布局**（内层不绝对定位、不平移） */
  offsetY?: number | undefined;
  rtl?: boolean;
  /**
   * 横向内容宽度（`scrollWidth`）。
   *
   * ⚠️ 设了它时外层改成 `overflow: visible` 并给内层显式 `width`，
   *    让横向溢出交给 holder 的原生滚动。**这是与上游的差异**（上游用
   *    `margin-left: -offsetX` 模拟横向滚动，且外层恒为 `overflow: hidden`）——
   *    见 `docs/foundation/virtual-list-contract.md` §5。
   */
  scrollWidth?: number | undefined;
  /** 透传到内层的属性（消费方用它注入 `aria-*`） */
  innerProps?: Record<string, unknown> | undefined;
  /** 内层尺寸变化（上游用它触发 `collectHeight`） */
  onInnerResize?: (() => void) | undefined;
}

/**
 * ⚠️ **必须自己带单位**。Vue 运行时的 `setStyle` 只是 `style[name] = val`，**不做 px 补全**
 *    （React 的 `dangerousStyleValue` 会补；Vue 只在**模板编译期**补）。用 `h()` 在 TS 里写样式
 *    时传裸数字，jsdom 的 cssstyle 与浏览器都会**静默丢掉**这个声明。
 */
function px(value: number | undefined): string | undefined {
  return value === undefined ? undefined : `${value}px`;
}

export interface FillerExposed {
  /** 内层的实测高度。非虚拟路径下 `computeRange` 需要它当 `scrollHeight` */
  getInnerHeight(): number;
}

export const Filler = defineComponent({
  name: 'AVirtualListFiller',
  props: {
    prefixCls: { type: String, default: undefined },
    height: { type: Number, default: undefined },
    offsetY: { type: Number, default: undefined },
    rtl: { type: Boolean, default: false },
    scrollWidth: { type: Number, default: undefined },
    innerProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    onInnerResize: {
      type: Function as PropType<(() => void) | undefined>,
      default: undefined,
    },
  },
  setup(props, { slots, expose }) {
    const innerRef = ref<HTMLElement | null>(null);

    useResizeObserver({
      target: innerRef,
      onResize: (size) => {
        // 上游的判据：`offsetHeight` 为真才回调（0 高没意义）
        if (size.offsetHeight && props.onInnerResize) {
          props.onInnerResize();
        }
      },
    });

    expose({
      getInnerHeight: (): number => innerRef.value?.offsetHeight ?? 0,
    } satisfies FillerExposed);

    return () => {
      const virtual = props.offsetY !== undefined;

      let outerStyle: Record<string, string | number> = {};
      let innerStyle: Record<string, string | number> = {
        display: 'flex',
        flexDirection: 'column',
      };

      if (virtual) {
        outerStyle = {
          height: px(props.height ?? 0) as string,
          position: 'relative',
          // ⚠️ 与上游的差异：设了 scrollWidth 时不能裁剪，否则横向溢出传不到 holder
          overflow: props.scrollWidth ? 'visible' : 'hidden',
        };
        innerStyle = {
          ...innerStyle,
          transform: `translateY(${props.offsetY}px)`,
          position: 'absolute',
          left: '0px',
          top: '0px',
        };
        if (props.scrollWidth) {
          innerStyle.width = px(props.scrollWidth) as string;
        } else {
          innerStyle.right = '0px';
        }
      }

      // ⚠️ 展开顺序**照抄上游**：`Object.assign({style, className, ref}, innerProps)`
      //    ⇒ `innerProps` 里的 `style` / `className` 会**整个覆盖**上面算出来的。
      //    这是个陷阱（传了 `style` 就会破坏虚拟化），但它是可观察行为，不改。
      //    上游对 `innerProps` 的说明是「只在需要传 aria 数据时用」。
      const merged = {
        style: innerStyle as Record<string, string | number> | undefined,
        class: props.prefixCls ? `${props.prefixCls}-holder-inner` : undefined,
        ...(props.innerProps ?? {}),
      };

      return h('div', { style: outerStyle }, [
        h('div', { ...merged, ref: innerRef }, [slots.default?.(), slots.extra?.()]),
      ]);
    };
  },
});
