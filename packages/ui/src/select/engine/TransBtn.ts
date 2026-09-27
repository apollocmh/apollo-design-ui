/**
 * rc-select `TransBtn.js` 的 Vue 版 —— 清除 / 移除 / 勾选图标的统一外壳。
 *
 * 三件事：`mousedown` 一律 `preventDefault`（否则会抢焦点、移动光标）、
 * `aria-hidden`（图标对读屏无意义）、以及「有 customizeIcon 就用它，否则渲染
 * `<span class="{cls}-icon">{children}</span>` 兜底」。
 */

import { defineComponent, h, type PropType } from 'vue';

export const TransBtn = defineComponent({
  name: 'ASelectTransBtn',
  inheritAttrs: false,
  props: {
    className: { type: String, required: true },
    style: { type: Object as PropType<Record<string, string>>, default: undefined },
    customizeIcon: { type: [Object, Function] as PropType<unknown>, default: undefined },
    customizeIconProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    onMousedown: { type: Function as PropType<(event: MouseEvent) => void>, default: undefined },
    onClick: { type: Function as PropType<(event: MouseEvent) => void>, default: undefined },
  },
  setup(props, { slots }) {
    return () => {
      const icon =
        typeof props.customizeIcon === 'function'
          ? (props.customizeIcon as (p: unknown) => unknown)(props.customizeIconProps ?? {})
          : props.customizeIcon;

      return h(
        'span',
        {
          class: props.className,
          style: { userSelect: 'none', WebkitUserSelect: 'none', ...(props.style ?? {}) },
          unselectable: 'on',
          'aria-hidden': true,
          onMousedown: (event: MouseEvent) => {
            event.preventDefault();
            props.onMousedown?.(event);
          },
          onClick: props.onClick,
        },
        icon !== undefined
          ? (icon as never)
          : h(
              'span',
              {
                class: props.className
                  .split(/\s+/)
                  .map((cls) => `${cls}-icon`)
                  .join(' '),
              },
              slots.default?.(),
            ),
      );
    };
  },
});

export default TransBtn;
