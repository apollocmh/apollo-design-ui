/**
 * TourMask —— rc-tour 2.4.0 `es/Mask.js` 的 Vue 版（G4 前置核实 §9-R2 逐条对齐）。
 *
 * 结构：独立 **Portal**（不在 Trigger 内）> `. {p}-mask` wrapper > **SVG 挖洞**：
 *   1. `<defs><mask>` 里白底 rect（`100vw/100vh`；Safari 用 `100%`）+ 黑洞 rect
 *      （`pos.left/top/width/height + rx=radius`，动画类 `{p}-placeholder-animated`）；
 *   2. `fill` 色大 rect 引用该 mask（默认 `rgba(0,0,0,0.5)`）；
 *   3. 洞外 **4 个 `fill:transparent` + `pointer-events:auto` 的 cover rect** 负责
 *      拦截交互。
 *
 * 交互协议（wrapper 的 `pointerEvents`）：
 *   - `pos && !disabledInteraction` ⇒ `'none'`：洞内点穿到页面（与目标交互），
 *     洞外被 4 个 cover 拦；
 *   - 其余（无洞 / `disabledInteraction`）⇒ `'auto'`：整体拦截。
 *   `showMask=false` 时无 SVG 但 wrapper 仍在（拦截语义不变）。
 *
 * Esc：Portal 的 `onEsc`（全局层栈 + IME 保护），回调由 Tour.ts 提供。
 */

import type { GetContainer } from '@apollo-design/portal';
import { Portal } from '@apollo-design/portal';
import { useId } from '@apollo-design/utils';
import { type CSSProperties, defineComponent, h, type PropType } from 'vue';

/** rc `useTarget` 产出的挖洞位（视口坐标 + gap 外扩后的结果）。 */
export interface TourMaskPos {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
}

/** rc `COVER_PROPS`。 */
const COVER_PROPS = {
  fill: 'transparent',
  pointerEvents: 'auto',
} as const;

const TourMask = defineComponent({
  name: 'ATourMask',
  props: {
    prefixCls: { type: String, required: true },
    pos: { type: Object as PropType<TourMaskPos | null>, default: null },
    showMask: { type: Boolean, default: undefined },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
    fill: { type: String, default: undefined },
    open: { type: Boolean, default: undefined },
    /** `-placeholder-animated` 类的判据（`animated.placeholder`，antd 恒 true）。 */
    placeholderAnimated: { type: Boolean, default: undefined },
    zIndex: { type: Number, default: undefined },
    disabledInteraction: { type: Boolean, default: undefined },
    /** 透传到 wrapper 的类名（rootClassName + classNames.mask）。 */
    maskClassName: { type: String, default: undefined },
    maskStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    getContainer: {
      type: [String, Boolean, Function, Object] as PropType<GetContainer>,
      default: undefined,
    },
    onEsc: {
      type: Function as PropType<(info: { top: boolean; event: KeyboardEvent }) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const id = useId();
    return () => {
      const {
        prefixCls,
        pos,
        showMask,
        style,
        fill = 'rgba(0,0,0,0.5)',
        open,
        placeholderAnimated,
        zIndex,
        disabledInteraction,
        maskClassName,
        maskStyle,
        getContainer,
        onEsc,
      } = props;

      const maskId = `${prefixCls}-mask-${id}`;
      // rc：Safari 的 SVG mask 在 100vw/vh 下有已知渲染缺陷，用 100% 规避
      const isSafari =
        typeof navigator !== 'undefined' &&
        /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const maskRectSize = isSafari
        ? { width: '100%', height: '100%' }
        : { width: '100vw', height: '100vh' };

      return h(
        Portal,
        {
          open: open ?? false,
          // rc：Mask 的 Portal 恒 autoLock（滚动锁）
          autoLock: true,
          ...(getContainer !== undefined ? { getContainer } : {}),
          ...(onEsc ? { onEsc } : {}),
        },
        {
          default: () =>
            h(
              'div',
              {
                class: [`${prefixCls}-mask`, maskClassName],
                style: {
                  position: 'fixed',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  zIndex,
                  pointerEvents: pos && !disabledInteraction ? 'none' : 'auto',
                  ...style,
                  ...maskStyle,
                } as CSSProperties,
              },
              showMask
                ? [
                    h('svg', { style: { width: '100%', height: '100%' } }, [
                      h('defs', [
                        h('mask', { id: maskId }, [
                          h('rect', { x: '0', y: '0', ...maskRectSize, fill: 'white' }),
                          pos
                            ? h('rect', {
                                x: pos.left,
                                y: pos.top,
                                rx: pos.radius,
                                width: pos.width,
                                height: pos.height,
                                fill: 'black',
                                class: placeholderAnimated
                                  ? `${prefixCls}-placeholder-animated`
                                  : '',
                              })
                            : null,
                        ]),
                      ]),
                      h('rect', {
                        x: '0',
                        y: '0',
                        width: '100%',
                        height: '100%',
                        fill,
                        mask: `url(#${maskId})`,
                      }),
                      pos
                        ? [
                            // 4 个洞外 cover：拦截交互（fill transparent + pointer-events auto）
                            h('rect', {
                              ...COVER_PROPS,
                              x: '0',
                              y: '0',
                              width: '100%',
                              height: Math.max(pos.top, 0),
                            }),
                            h('rect', {
                              ...COVER_PROPS,
                              x: '0',
                              y: '0',
                              width: Math.max(pos.left, 0),
                              height: '100%',
                            }),
                            h('rect', {
                              ...COVER_PROPS,
                              x: '0',
                              y: pos.top + pos.height,
                              width: '100%',
                              height: `calc(100% - ${pos.top + pos.height}px)`,
                            }),
                            h('rect', {
                              ...COVER_PROPS,
                              x: pos.left + pos.width,
                              y: '0',
                              width: `calc(100% - ${pos.left + pos.width}px)`,
                              height: '100%',
                            }),
                          ]
                        : null,
                    ]),
                  ]
                : [],
            ),
        },
      );
    };
  },
});

export default TourMask;
