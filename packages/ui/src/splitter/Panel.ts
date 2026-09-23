/**
 * Splitter 的 Panel（复合组件）。
 *
 * 契约来源：antd 6.6.4 `es/splitter/Panel.js`（逐行对拍）：
 * - `Panel` 本体是 **renderless**（React 的 `Panel = () => null`）—— 它只是把
 *   props 传给 children 收集器；真正的渲染由 `InternalPanel` 承担。
 * - `InternalPanel`：`size===0`（或 '0%'）⇒ `-hidden`；`supportMotion` ⇒
 *   `-transition`；style 强制 `flexBasis: size ?? 'auto'` + `flexGrow: hasSize?0:1`
 *   （SSR 用 auto）。
 */

import { defineComponent, h, type PropType } from 'vue';
import type { SplitterPanelProps } from './interface';

export const SplitterPanel = defineComponent({
  name: 'ASplitterPanel',
  props: {
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    min: { type: [Number, String], default: undefined },
    max: { type: [Number, String], default: undefined },
    size: { type: [Number, String], default: undefined },
    collapsible: {
      type: [Boolean, Object] as PropType<SplitterPanelProps['collapsible']>,
      default: undefined,
    },
    resizable: { type: Boolean, default: undefined },
    defaultSize: { type: [Number, String], default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
  },
  setup() {
    // renderless：antd 的 `Panel = () => null`
    return () => null;
  },
});

/** 内部渲染单元（Splitter 主组件消费）。 */
export const InternalPanel = defineComponent({
  name: 'ASplitterInternalPanel',
  props: {
    prefixCls: { type: String, required: true },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    size: { type: [Number, String], default: undefined },
    destroyOnHidden: { type: Boolean, default: false },
    supportMotion: { type: Boolean, default: undefined },
  },
  setup(props, { slots }) {
    return () => {
      const isCollapsed =
        props.size === 0 || (typeof props.size === 'string' && Number.parseFloat(props.size) === 0);
      const panelClassName = [
        `${props.prefixCls}-panel`,
        { [`${props.prefixCls}-panel-hidden`]: isCollapsed },
        { [`${props.prefixCls}-panel-transition`]: props.supportMotion },
        props.className,
      ];
      const hasSize = props.size !== undefined;
      return h(
        'div',
        {
          class: panelClassName,
          style: {
            ...props.style,
            // Use auto when start from ssr
            // ⚠️ 数字必须补 px（Vue 的 CSSOM 赋值不会自动加单位，CHECKLIST #52 同族）
            flexBasis: hasSize
              ? typeof props.size === 'number'
                ? `${props.size}px`
                : props.size
              : 'auto',
            flexGrow: hasSize ? 0 : 1,
          },
        },
        [!(props.destroyOnHidden && isCollapsed) ? slots.default?.() : null],
      );
    };
  },
});
