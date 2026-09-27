/**
 * Splitter 的 SplitBar —— 拖拽手柄 + 折叠按钮 + lazy 预览。
 *
 * 契约来源：antd 6.6.4 `es/splitter/SplitBar.js`（235 行，逐行对拍）：
 * - 双击抑制：`DOUBLE_CLICK_TIME_GAP = 300`，300ms 内的 mousedown 不起拖。
 * - 拖拽中在 `window` 上挂 mousemove/mouseup/touchmove/touchend（startPos 非空时）。
 * - lazy：拖动只更新受约束的预览偏移（`getConstrainedOffset` 用 aria 百分比夹取），
 *   松手才 `onOffsetUpdate(…, true)` + `onOffsetEnd(true)`。
 * - 折叠按钮三态显隐：always-visible / always-hidden / hover-only（`@media(hover:none)` 恒显）。
 * - 图标：vertical ⇒ Up/DownOutlined；horizontal ⇒ Left/RightOutlined（可自定义）。
 */

import { DownOutlined, LeftOutlined, RightOutlined, UpOutlined } from '@apollo-design/icons';
import { isNumber } from '@apollo-design/utils';
import {
  defineComponent,
  h,
  onBeforeUnmount,
  type PropType,
  ref,
  type VNodeChild,
  watch,
} from 'vue';
import type {
  ShowCollapsibleIconMode,
  SplitterDraggerClassNames,
  SplitterDraggerStyles,
} from './interface';

const DOUBLE_CLICK_TIME_GAP = 300;

const getValidNumber = (num: number): number =>
  isNumber(num) && Number.isFinite(num) ? Math.round(num) : 0;

export interface SplitBarProps {
  prefixCls: string;
  rootPrefixCls: string;
  vertical: boolean;
  index: number;
  active: boolean;
  ariaNow: number;
  ariaMin: number;
  ariaMax: number;
  resizable: boolean;
  draggerIcon?: VNodeChild;
  draggerStyle?: SplitterDraggerStyles;
  draggerClassName?: SplitterDraggerClassNames;
  collapsibleIcon?: { start?: VNodeChild; end?: VNodeChild };
  startCollapsible: boolean;
  endCollapsible: boolean;
  showStartCollapsibleIcon: ShowCollapsibleIconMode;
  showEndCollapsibleIcon: ShowCollapsibleIconMode;
  lazy: boolean;
  containerSize: number;
}

export const SplitBar = defineComponent({
  name: 'ASplitterSplitBar',
  props: {
    prefixCls: { type: String, required: true },
    rootPrefixCls: { type: String, required: true },
    vertical: { type: Boolean, default: false },
    index: { type: Number, required: true },
    active: { type: Boolean, default: false },
    ariaNow: { type: Number, default: 0 },
    ariaMin: { type: Number, default: 0 },
    ariaMax: { type: Number, default: 100 },
    resizable: { type: Boolean, default: false },
    // 内部：由父组件程序化传递/无模板上下文，VNode prop 合法（源自 Splitter 的 #draggerIcon slot）
    draggerIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    draggerStyle: { type: Object as PropType<SplitterDraggerStyles>, default: undefined },
    draggerClassName: { type: Object as PropType<SplitterDraggerClassNames>, default: undefined },
    collapsibleIcon: {
      type: Object as PropType<{ start?: VNodeChild; end?: VNodeChild }>,
      default: undefined,
    },
    startCollapsible: { type: Boolean, default: false },
    endCollapsible: { type: Boolean, default: false },
    showStartCollapsibleIcon: {
      type: [Boolean, String] as PropType<ShowCollapsibleIconMode>,
      default: 'auto',
    },
    showEndCollapsibleIcon: {
      type: [Boolean, String] as PropType<ShowCollapsibleIconMode>,
      default: 'auto',
    },
    lazy: { type: Boolean, default: false },
    containerSize: { type: Number, default: 0 },
    onOffsetStart: {
      type: Function as PropType<(index: number) => void>,
      required: true,
    },
    onOffsetUpdate: {
      type: Function as PropType<
        (index: number, offsetX: number, offsetY: number, lazyEnd?: boolean) => void
      >,
      required: true,
    },
    onOffsetEnd: { type: Function as PropType<(lazyEnd?: boolean) => void>, required: true },
    onCollapse: {
      type: Function as PropType<(index: number, type: 'start' | 'end') => void>,
      required: true,
    },
    onDraggerDoubleClick: {
      type: Function as PropType<(index: number) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const splitBarPrefixCls = `${props.prefixCls}-bar`;
    const lastClickTime = ref(0);

    // ======================== Resize ========================
    const startPos = ref<[number, number] | null>(null);
    const constrainedOffset = ref(0);

    const onMouseDown = (e: MouseEvent): void => {
      e.stopPropagation();
      const currentTime = Date.now();
      const timeGap = currentTime - lastClickTime.value;
      if (timeGap > 0 && timeGap < DOUBLE_CLICK_TIME_GAP) {
        // Prevent drag start if it's a double-click action
        return;
      }
      lastClickTime.value = currentTime;
      if (props.resizable) {
        startPos.value = [e.pageX, e.pageY];
        props.onOffsetStart(props.index);
      }
    };

    const onTouchStart = (e: TouchEvent): void => {
      if (props.resizable && e.touches.length === 1) {
        const touch = e.touches[0] as Touch;
        startPos.value = [touch.pageX, touch.pageY];
        props.onOffsetStart(props.index);
      }
    };

    // Updated constraint calculation
    const getConstrainedOffset = (rawOffset: number): number => {
      const currentPos = (props.containerSize * props.ariaNow) / 100;
      const newPos = currentPos + rawOffset;
      // Calculate available space
      const minAllowed = Math.max(0, (props.containerSize * props.ariaMin) / 100);
      const maxAllowed = Math.min(props.containerSize, (props.containerSize * props.ariaMax) / 100);
      // Constrain new position within bounds
      const clampedPos = Math.max(minAllowed, Math.min(maxAllowed, newPos));
      return clampedPos - currentPos;
    };

    const handleLazyMove = (offsetX: number, offsetY: number): void => {
      constrainedOffset.value = getConstrainedOffset(props.vertical ? offsetY : offsetX);
    };

    const handleLazyEnd = (): void => {
      props.onOffsetUpdate(
        props.index,
        props.vertical ? 0 : constrainedOffset.value,
        props.vertical ? constrainedOffset.value : 0,
        true,
      );
      constrainedOffset.value = 0;
      props.onOffsetEnd(true);
    };

    const onCollapseKeyDown = (e: KeyboardEvent, type: 'start' | 'end'): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        props.onCollapse(props.index, type);
      }
    };

    const getVisibilityClass = (mode: ShowCollapsibleIconMode): string => {
      switch (mode) {
        case true:
          return `${splitBarPrefixCls}-collapse-bar-always-visible`;
        case false:
          return `${splitBarPrefixCls}-collapse-bar-always-hidden`;
        case 'auto':
          return `${splitBarPrefixCls}-collapse-bar-hover-only`;
        default:
          return '';
      }
    };

    // 拖拽中的 window 监听（antd 的 useLayoutEffect on startPos）
    const cleanups: Array<() => void> = [];
    const bindWindow = (start: [number, number] | null): void => {
      while (cleanups.length) {
        cleanups.pop()?.();
      }
      if (!start) {
        return;
      }
      const onMouseMove = (e: MouseEvent): void => {
        const offsetX = e.pageX - start[0];
        const offsetY = e.pageY - start[1];
        if (props.lazy) {
          handleLazyMove(offsetX, offsetY);
        } else {
          props.onOffsetUpdate(props.index, offsetX, offsetY);
        }
      };
      const onMouseUp = (): void => {
        if (props.lazy) {
          handleLazyEnd();
        } else {
          props.onOffsetEnd();
        }
        startPos.value = null;
      };
      const handleTouchMove = (e: TouchEvent): void => {
        if (e.touches.length === 1) {
          const touch = e.touches[0] as Touch;
          const offsetX = touch.pageX - start[0];
          const offsetY = touch.pageY - start[1];
          if (props.lazy) {
            handleLazyMove(offsetX, offsetY);
          } else {
            props.onOffsetUpdate(props.index, offsetX, offsetY);
          }
        }
      };
      const handleTouchEnd = (): void => {
        if (props.lazy) {
          handleLazyEnd();
        } else {
          props.onOffsetEnd();
        }
        startPos.value = null;
      };
      const map: Record<string, (e: Event) => void> = {
        mousemove: onMouseMove as (e: Event) => void,
        mouseup: onMouseUp as (e: Event) => void,
        touchmove: handleTouchMove as (e: Event) => void,
        touchend: handleTouchEnd as (e: Event) => void,
      };
      for (const [event, handler] of Object.entries(map)) {
        window.addEventListener(event, handler);
        cleanups.push(() => window.removeEventListener(event, handler));
      }
    };
    watch(startPos, bindWindow);
    onBeforeUnmount(() => {
      while (cleanups.length) {
        cleanups.pop()?.();
      }
    });

    return () => {
      const bar = splitBarPrefixCls;

      // ---- 折叠图标 ----
      const startCustomize = props.collapsibleIcon?.start !== undefined;
      const endCustomize = props.collapsibleIcon?.end !== undefined;
      const startIcon = props.vertical
        ? startCustomize
          ? props.collapsibleIcon?.start
          : h(UpOutlined)
        : startCustomize
          ? props.collapsibleIcon?.start
          : h(LeftOutlined);
      const endIcon = props.vertical
        ? endCustomize
          ? props.collapsibleIcon?.end
          : h(DownOutlined)
        : endCustomize
          ? props.collapsibleIcon?.end
          : h(RightOutlined);

      const nodes: VNodeChild[] = [];

      // lazy 预览
      if (props.lazy) {
        nodes.push(
          h('div', {
            key: 'preview',
            class: [`${bar}-preview`, { [`${bar}-preview-active`]: !!constrainedOffset.value }],
            style: {
              // 组件作用域 CSS 变量（antd genCssVar(root,'splitter') 同名覆盖）
              [`--${props.rootPrefixCls}-splitter-bar-preview-offset`]: `${constrainedOffset.value}px`,
            },
          }),
        );
      }

      // dragger
      nodes.push(
        h(
          'div',
          {
            key: 'dragger',
            style: props.draggerStyle?.default,
            class: [
              `${bar}-dragger`,
              {
                [`${bar}-dragger-disabled`]: !props.resizable,
                [`${bar}-dragger-active`]: props.active,
                [`${bar}-dragger-customize`]: props.draggerIcon !== undefined,
              },
              props.draggerClassName?.default,
              props.active && props.draggerClassName?.active,
            ],
            onMousedown: onMouseDown,
            onTouchstart: onTouchStart,
            onDblclick: () => props.onDraggerDoubleClick?.(props.index),
            role: 'separator',
            'aria-disabled': !props.resizable,
            'aria-orientation': props.vertical ? 'horizontal' : 'vertical',
            'aria-valuenow': getValidNumber(props.ariaNow),
            'aria-valuemin': getValidNumber(props.ariaMin),
            'aria-valuemax': getValidNumber(props.ariaMax),
          },
          [
            props.draggerIcon !== undefined
              ? h('div', { class: `${bar}-dragger-icon` }, [props.draggerIcon])
              : null,
          ],
        ),
      );

      // collapse bars
      const renderCollapseBar = (
        type: 'start' | 'end',
        visible: boolean,
        showIcon: ShowCollapsibleIconMode,
        customize: boolean,
        icon: VNodeChild,
      ): VNodeChild => {
        if (!visible) {
          return null;
        }
        return h(
          'div',
          {
            key: `collapse-${type}`,
            class: [
              `${bar}-collapse-bar`,
              `${bar}-collapse-bar-${type}`,
              { [`${bar}-collapse-bar-customize`]: customize },
              getVisibilityClass(showIcon),
            ],
            role: 'button',
            tabindex: 0,
            'aria-label': `Toggle ${type} panel`,
            onClick: () => props.onCollapse(props.index, type),
            onKeydown: (e: KeyboardEvent) => onCollapseKeyDown(e, type),
          },
          [h('span', { class: [`${bar}-collapse-icon`, `${bar}-collapse-${type}`] }, [icon])],
        );
      };

      nodes.push(
        renderCollapseBar(
          'start',
          props.startCollapsible,
          props.showStartCollapsibleIcon,
          startCustomize,
          startIcon,
        ),
      );
      nodes.push(
        renderCollapseBar(
          'end',
          props.endCollapsible,
          props.showEndCollapsibleIcon,
          endCustomize,
          endIcon,
        ),
      );

      return h('div', { class: splitBarPrefixCls }, nodes);
    };
  },
});

export default SplitBar;
