import { computed, defineComponent, h, inject, mergeProps, type SlotsType } from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import { useConfigContext } from '../config-provider/context';
import { breadcrumbContextKey } from './context';
import type { BreadcrumbSeparatorSlots } from './interface';

const slots: SlotsType<BreadcrumbSeparatorSlots> = {};
export const BreadcrumbSeparator = defineComponent({
  name: 'ABreadcrumbSeparator',
  inheritAttrs: false,
  slots,
  setup(_, { slots, attrs }) {
    const config = useConfigContext();
    const context = inject(breadcrumbContextKey, undefined);
    const prefixCls = computed(() => context?.prefixCls ?? config.getPrefixCls('breadcrumb'));
    return () =>
      h(
        'li',
        mergeProps(styleAttrs(context?.styles.separator), attrs, {
          class: [`${prefixCls.value}-separator`, context?.classNames.separator],
          'aria-hidden': 'true',
        }),
        [slots.default ? slots.default() : '/'],
      );
  },
});
export default BreadcrumbSeparator;
