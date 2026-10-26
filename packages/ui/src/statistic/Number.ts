/** Internal number formatting preserves significant numeric strings and decimal spans. */
import { mergeDomAttrs } from '@apollo-design/utils';
import { defineComponent, h, type PropType } from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import type { StatisticFormatConfig, ValueType } from './interface';

export function numberParts(value: ValueType | undefined, config: StatisticFormatConfig) {
  const text = String(value);
  const cells = text.match(/^(-?)(\d*)(\.(\d+))?$/);
  if (!cells || text === '-') return { integer: null, decimal: '', text };
  const integer = `${cells[1]}${(cells[2] || '0').replace(/\B(?=(\d{3})+(?!\d))/g, () => config.groupSeparator ?? '')}`;
  let decimal = cells[4] || '';
  if (typeof config.precision === 'number' && Number.isFinite(config.precision)) {
    const precision = Math.max(0, Math.trunc(config.precision));
    decimal = decimal.padEnd(precision, '0').slice(0, precision);
  }
  if (decimal) decimal = `${config.decimalSeparator ?? '.'}${decimal}`;
  return { integer, decimal, text: integer + decimal };
}

export default defineComponent({
  name: 'AStatisticNumber',
  inheritAttrs: false,
  props: {
    value: { type: [Number, String] as PropType<ValueType>, default: undefined },
    precision: { type: Number, default: undefined },
    decimalSeparator: { type: String, default: '.' },
    groupSeparator: { type: String, default: '' },
    prefixCls: { type: String, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () => {
      const parts = numberParts(props.value, props);
      const children = slots.default
        ? [h(NodeRenderer, { node: slots.default() })]
        : parts.integer === null
          ? [parts.text]
          : [
              h(
                'span',
                { key: 'int', class: `${props.prefixCls}-content-value-int` },
                parts.integer,
              ),
              parts.decimal
                ? h(
                    'span',
                    { key: 'decimal', class: `${props.prefixCls}-content-value-decimal` },
                    parts.decimal,
                  )
                : null,
            ];
      return h('span', mergeDomAttrs(attrs), children);
    };
  },
});
