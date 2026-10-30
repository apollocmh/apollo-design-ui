/** Drop geometry is local; color and line height belong to Tree's static CSS. */

import { type CSSProperties, defineComponent, h } from 'vue';

export interface DropIndicatorProps {
  dropPosition: -1 | 0 | 1;
  dropLevelOffset: number;
  indent: number;
  prefixCls: string;
  direction?: 'ltr' | 'rtl';
}

export default defineComponent({
  name: 'ATreeDropIndicator',
  props: {
    dropPosition: { type: Number as unknown as () => -1 | 0 | 1, required: true },
    dropLevelOffset: { type: Number, required: true },
    indent: { type: Number, required: true },
    prefixCls: { type: String, required: true },
    direction: { type: String as () => 'ltr' | 'rtl' | undefined, default: undefined },
  },
  setup(props) {
    return () => {
      const style: CSSProperties & Record<string, unknown> = {
        pointerEvents: 'none',
        position: 'absolute',
        insetInlineEnd: 0,
      };
      switch (props.dropPosition) {
        case -1:
          style.top = 0;
          style.insetInlineStart = `${-props.dropLevelOffset * props.indent}px`;
          break;
        case 1:
          style.bottom = 0;
          style.insetInlineStart = `${-props.dropLevelOffset * props.indent}px`;
          break;
        case 0:
          style.bottom = 0;
          style.insetInlineStart = `${props.indent}px`;
          break;
      }
      return h('div', { class: `${props.prefixCls}-drop-indicator`, style });
    };
  },
});
