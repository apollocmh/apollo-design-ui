/**
 * DropIndicator —— 拖拽落点指示线（rc `DropIndicator.js` 逐字移植）。
 *
 * 注意 rc 原文样式 `backgroundColor: 'red'` 是**产物字面量**（测试依赖它），
 * 不走 token（与 image 的 100px 同判，E10 豁免记录在 README）。
 */

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
        right: 0,
        backgroundColor: 'red',
        height: 2,
      };
      switch (props.dropPosition) {
        case -1:
          style.top = 0;
          style.left = `${-props.dropLevelOffset * props.indent}px`;
          break;
        case 1:
          style.bottom = 0;
          style.left = `${-props.dropLevelOffset * props.indent}px`;
          break;
        case 0:
          style.bottom = 0;
          style.left = `${props.indent}px`;
          break;
      }
      return h('div', { style });
    };
  },
});
