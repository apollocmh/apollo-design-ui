import { isEmptyVNode, useControlledValue } from '@apollo-design/utils';
import { computed, defineComponent, h, mergeProps, type SlotsType, shallowRef } from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { styleAttrs } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useTagTheme } from './hooks/use-theme';
import type { CheckableTagSlots, TagConfig } from './interface';

export default defineComponent({
  name: 'ACheckableTag',
  inheritAttrs: false,
  expose: ['nativeElement'],
  props: {
    prefixCls: String,
    checked: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
  },
  emits: {
    'update:checked': (_checked: boolean) => true,
    change: (_checked: boolean) => true,
    click: (_event: MouseEvent) => true,
    keydown: (_event: KeyboardEvent) => true,
  },
  slots: Object as SlotsType<CheckableTagSlots>,
  setup(props, { slots, attrs, emit }) {
    const context = useComponentConfig<TagConfig>('tag'),
      direction = useDirection();
    const prefix = computed(() => context.getPrefixCls('tag', props.prefixCls));
    const disabled = useDisabled(() => props.disabled),
      themeStyle = useTagTheme(() => prefix.value);
    const root = shallowRef<HTMLSpanElement | null>(null);
    const [checked, setChecked] = useControlledValue<boolean>({
      defaultValue: false,
      getValue: () => props.checked,
      onChange: (value) => {
        emit('update:checked', value);
        emit('change', value);
      },
    });
    const onClick = (event: MouseEvent) => {
      if (disabled.value) return;
      emit('click', event);
      if (!event.defaultPrevented) setChecked(!checked.value);
    };
    const onKeydown = (event: KeyboardEvent) => {
      emit('keydown', event);
      if (event.defaultPrevented || disabled.value || event.key !== ' ') return;
      event.preventDefault();
      if (!event.repeat) setChecked(!checked.value);
    };
    const renderCheckable = () => {
      const cls = prefix.value,
        icon = slots.icon?.(),
        content = slots.default?.();
      return h(
        'span',
        mergeProps(
          {
            class: [
              cls,
              `${cls}-checkable`,
              context.className,
              {
                [`${cls}-checkable-checked`]: checked.value,
                [`${cls}-checkable-disabled`]: disabled.value,
                [`${cls}-rtl`]: (attrs.dir ?? direction.value) === 'rtl',
                [`${cls}-has-icon`]: !isEmptyVNode(icon),
              },
            ],
            ...styleAttrs({ ...themeStyle.value, ...context.style }),
          },
          attrs,
          {
            ref: root,
            role: 'checkbox',
            'aria-checked': checked.value,
            'aria-disabled': disabled.value || undefined,
            tabindex: disabled.value ? -1 : (attrs.tabindex ?? 0),
            dir: attrs.dir ?? direction.value,
            onClick,
            onKeydown,
          },
        ),
        [
          isEmptyVNode(icon)
            ? null
            : h('span', { key: 'icon', class: `${cls}-icon` }, [h(NodeRenderer, { node: icon })]),
          isEmptyVNode(content)
            ? null
            : h('span', { key: 'content', class: `${cls}-content` }, [
                h(NodeRenderer, { node: content }),
              ]),
        ],
      );
    };
    return { nativeElement: root, renderCheckable };
  },
  render() {
    return this.renderCheckable();
  },
});
