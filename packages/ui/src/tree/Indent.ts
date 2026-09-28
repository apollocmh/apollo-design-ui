/**
 * Indent —— 层级缩进单元（rc `Indent.js` 的逐字移植，React.memo 换 computed 快照）。
 *
 * 每层渲染一个 `-indent-unit`；`isStart`/`isEnd` 是逐层数组（flattenTreeData 产出），
 * 用于连接线（show-line 模式）的 `-{start,end}` 修饰类。
 */

import { defineComponent, h } from 'vue';
import { clsx } from '../notification/engine/util';

export default defineComponent({
  name: 'ATreeIndent',
  props: {
    prefixCls: { type: String, required: true },
    level: { type: Number, required: true },
    isStart: { type: Array as unknown as () => boolean[], required: true },
    isEnd: { type: Array as unknown as () => boolean[], required: true },
  },
  setup(props) {
    return () => {
      const baseClassName = `${props.prefixCls}-indent-unit`;
      const list: ReturnType<typeof h>[] = [];
      for (let i = 0; i < props.level; i += 1) {
        list.push(
          h('span', {
            key: i,
            class: clsx(baseClassName, {
              [`${baseClassName}-start`]: props.isStart[i],
              [`${baseClassName}-end`]: props.isEnd[i],
            }),
          }),
        );
      }
      return h('span', { 'aria-hidden': 'true', class: `${props.prefixCls}-indent` }, list);
    };
  },
});
