/**
 * CheckableTag —— 可勾选标签。
 *
 * 契约来源：antd 6.6.4 的 `es/tag/CheckableTag.js`（判据逐条对齐）。
 *
 * 两条最容易写错的判据：
 *   1. **键盘只有空格触发** onChange（Enter 不触发 —— antd 逐字），且 `!e.repeat`。
 *   2. **aria 语义**：`role="checkbox"` + `aria-checked` + tabIndex（禁用 -1）。
 */

import { computed, defineComponent, h, type PropType, shallowRef } from 'vue';
import { useComponentConfig } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';

export default defineComponent({
  name: 'ACheckableTag',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    checked: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
    onChange: { type: Function as PropType<(checked: boolean) => void>, default: undefined },
    onClick: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    onKeyDown: { type: Function as PropType<(e: KeyboardEvent) => void>, default: undefined },
  },
  setup(props, { slots, attrs, expose }) {
    const {
      getPrefixCls,
      className: contextClassName,
      style: contextStyle,
    } = useComponentConfig('tag');

    const rootRef = shallowRef<HTMLElement | null>(null);
    expose({ nativeElement: rootRef });

    const mergedDisabled = useDisabled(props.disabled);

    const prefixCls = computed(() => getPrefixCls('tag', props.prefixCls));

    const handleClick = (e: MouseEvent) => {
      if (mergedDisabled.value) {
        return;
      }
      props.onChange?.(!props.checked);
      props.onClick?.(e);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      props.onKeyDown?.(e);
      if (e.defaultPrevented || mergedDisabled.value) {
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        if (!e.repeat) {
          props.onChange?.(!props.checked);
        }
      }
    };

    return () => {
      const cls = [
        prefixCls.value,
        `${prefixCls.value}-checkable`,
        {
          [`${prefixCls.value}-checkable-checked`]: props.checked,
          [`${prefixCls.value}-checkable-disabled`]: mergedDisabled.value,
        },
        contextClassName,
        // ⚠️ inheritAttrs=false 时 attrs.class 不会自动合并 —— Group 的
        // `-checkable-group-item` 类经 class attr 传入，必须显式并入。
        (attrs.class as string | undefined) ?? null,
      ];

      const icon = slots.icon?.();
      const children = slots.default?.();

      return h(
        'span',
        {
          ref: rootRef,
          ...(() => {
            const rest: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(attrs)) {
              if (key !== 'class' && key !== 'style') rest[key] = value;
            }
            return rest;
          })(),
          role: 'checkbox',
          'aria-checked': props.checked,
          'aria-disabled': mergedDisabled.value || undefined,
          tabindex: mergedDisabled.value ? -1 : 0,
          // 根 `style` 是 Vue 原生 attrs（位置与原先的 props.style 一致）
          style: {
            ...(contextStyle ?? {}),
            ...((attrs.style as Record<string, string | number>) ?? {}),
          },
          class: cls,
          onClick: handleClick,
          onKeydown: handleKeyDown,
        },
        [icon, h('span', null, children)],
      );
    };
  },
});
