/**
 * StatisticNumber —— Statistic 的内部数值渲染（antd 的 `es/statistic/Number.js`）。
 *
 * 契约来源逐条（G1 §2.2–2.4）：
 *
 * 1. **formatter 是函数 ⇒ 整个 valueNode = formatter(value)**（content-value 里
 *    不再有 int/decimal 子 span）。
 * 2. 内部格式化：`String(value)` → 正则 `^(-?)(\d*)(\.(\d+))?$`；不匹配（含
 *    `'-'`、`'bamboo'`）⇒ 原样字符串。
 * 3. 匹配 ⇒ 负号 + int（千分位正则 `/\B(?=(\d{3})+(?!\d))/g` 插 groupSeparator）+
 *    decimal；**int 兜底 `'0'`**（`'.5'` ⇒ `0.5`）。
 * 4. precision：`padEnd(p,'0').slice(0, max(p,0))` —— **负 precision ⇒ decimal
 *    为空串**（不渲染 decimal span）。
 * 5. ⚠️ **本组件的 groupSeparator 默认空串**（不是 Statistic 的 `','`）——
 *    antd 的解构默认逐字保留（fallback 测试钉住：直连 Number 时 `1128` 不分组）。
 *
 * 为什么是渲染函数：children 是「int span + 条件 decimal span」的数组，
 * 模板写条件子节点反而更绕（与 Tag 同判）。
 */

import { isFunction, isNumber } from '@apollo-design/utils';
import { defineComponent, h, type PropType, type VNodeChild } from 'vue';
import type { StatisticFormatter, ValueType } from './interface';

export default defineComponent({
  name: 'AStatisticNumber',
  inheritAttrs: false,
  props: {
    value: { type: [Number, String] as PropType<ValueType>, default: undefined },
    formatter: {
      type: [Boolean, String, Function] as PropType<StatisticFormatter>,
      default: undefined,
    },
    precision: { type: Number, default: undefined },
    decimalSeparator: { type: String, default: undefined },
    groupSeparator: { type: String, default: '' },
    prefixCls: { type: String, default: undefined },
    className: {
      type: [String, Array] as PropType<string | string[]>,
      default: undefined,
    },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
  },
  setup(props) {
    return () => {
      let valueNode: VNodeChild;
      if (isFunction(props.formatter)) {
        // Customize formatter
        valueNode = props.formatter(props.value as ValueType);
      } else {
        // Internal formatter
        const val = String(props.value);
        const cells = val.match(/^(-?)(\d*)(\.(\d+))?$/);
        // Process if illegal number
        if (!cells || val === '-') {
          valueNode = val;
        } else {
          const negative = cells[1];
          let int = cells[2] || '0';
          let decimal = cells[4] || '';
          int = int.replace(/\B(?=(\d{3})+(?!\d))/g, props.groupSeparator);
          if (isNumber(props.precision)) {
            decimal = decimal
              .padEnd(props.precision, '0')
              .slice(0, props.precision > 0 ? props.precision : 0);
          }
          if (decimal) {
            decimal = `${props.decimalSeparator}${decimal}`;
          }
          valueNode = [
            h('span', { key: 'int', class: `${props.prefixCls}-content-value-int` }, [
              negative,
              int,
            ]),
            decimal
              ? h('span', { key: 'decimal', class: `${props.prefixCls}-content-value-decimal` }, [
                  decimal,
                ])
              : null,
          ];
        }
      }
      return h(
        'span',
        {
          class: props.className,
          style: props.style as never,
        },
        valueNode as never,
      );
    };
  },
});
