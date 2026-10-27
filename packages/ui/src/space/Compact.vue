<script lang="ts">
import { toArray, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  inject,
  mergeProps,
  type PropType,
  ref,
  type SlotsType,
  type VNode,
  watchEffect,
} from 'vue';
import { useConfigContext, useDirection } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import { CompactItem, spaceCompactItemContextKey } from './Compact';
import type { SpaceCompactProps, SpaceSlot } from './interface';
import { useOrientation } from './useOrientation';

export default defineComponent({
  name: 'ASpaceCompact',
  inheritAttrs: false,
  expose: ['nativeElement'],
  props: {
    prefixCls: { type: String, default: undefined },
    size: { type: String as PropType<SpaceCompactProps['size']>, default: undefined },
    direction: { type: String as PropType<SpaceCompactProps['direction']>, default: undefined },
    orientation: { type: String as PropType<SpaceCompactProps['orientation']>, default: undefined },
    // Preserve absence: explicit false overrides the deprecated direction prop.
    vertical: { type: Boolean, default: undefined },
    block: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{ default?: SpaceSlot }>,
  setup(props, { slots, attrs }) {
    const { getPrefixCls } = useConfigContext();
    const direction = useDirection();
    const prefixCls = computed(() => getPrefixCls('space-compact', props.prefixCls));
    const outerContext = inject(spaceCompactItemContextKey, undefined);
    const orientation = useOrientation(
      () => props.orientation,
      () => props.vertical,
      () => props.direction,
    );
    const mergedSize = useSize((contextSize) => props.size ?? contextSize);
    const rootRef = ref<HTMLDivElement | null>(null);

    const warning = useDevWarning('Space.Compact');
    watchEffect(() => {
      warning.deprecated(props.direction === undefined, 'direction', 'orientation');
    });

    const renderCompact = () => {
      // Compiled slots can replace their VNodes without changing a computed dependency.
      const children: VNode[] = toArray(() => slots.default?.());
      if (!children.length) return null;
      const prefix = prefixCls.value;
      const outer = outerContext?.value;
      const [compactDirection, vertical] = orientation.value;
      return h(
        'div',
        mergeProps(
          {
            ref: rootRef,
            class: [
              prefix,
              {
                [`${prefix}-rtl`]: direction.value === 'rtl',
                [`${prefix}-block`]: props.block,
                [`${prefix}-vertical`]: vertical,
              },
            ],
          },
          attrs,
        ),
        children.map((child, index) =>
          h(CompactItem, {
            key:
              typeof child.key === 'string' || typeof child.key === 'number'
                ? child.key
                : `${prefix}-item-${index}`,
            compactSize: mergedSize.value,
            compactDirection,
            isFirstItem: index === 0 && (!outer || !!outer.isFirstItem),
            isLastItem: index === children.length - 1 && (!outer || !!outer.isLastItem),
            node: child,
          }),
        ),
      );
    };
    return { nativeElement: rootRef, renderCompact };
  },
  render() {
    return this.renderCompact();
  },
});
</script>
