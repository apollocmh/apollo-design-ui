/** Show the actual Tooltip only for enabled, truncated content. */
import { defineComponent, h, type PropType } from 'vue';

import Tooltip from '../tooltip/Tooltip';
import type { TypographyTooltipProps } from './interface';

export const EllipsisTooltip = defineComponent({
  name: 'ATypographyEllipsisTooltip',
  props: {
    /** `mergedEnableEllipsis`。为假时提示没有意义。 */
    enableEllipsis: { type: Boolean, default: undefined },
    /** `isMergedEllipsis`：原生省略号**真的**截断了。为假时提示不弹出。 */
    isEllipsis: { type: Boolean, default: undefined },
    /** 鼠标停在操作区时为真 ⇒ 提示不弹出（否则会挡住按钮）。 */
    disabled: { type: Boolean, default: undefined },
    /** 已归一化的 Tooltip props（`{ title, ... }`）。 */
    tooltipProps: { type: Object as PropType<TypographyTooltipProps>, default: undefined },
  },
  setup(_props, { slots }) {
    return () => {
      const children = slots.default?.() ?? [];
      const child = children.length === 1 ? children[0] : children;
      const tp = _props.tooltipProps;
      if (
        !tp ||
        tp.title === undefined ||
        tp.title === null ||
        tp.title === false ||
        tp.title === '' ||
        !_props.enableEllipsis
      ) {
        return child;
      }
      return h(
        Tooltip,
        {
          ...tp,
          disabled: !_props.isEllipsis || !!_props.disabled,
        },
        { default: () => child },
      );
    };
  },
});
