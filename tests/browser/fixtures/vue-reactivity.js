import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
import { Button, Descriptions, DescriptionsItem } from '@apollo-design/ui';
import { createApp, defineComponent, h, ref } from 'vue';
import ContentSlots from '../../../packages/ui/src/alert/demo/content-slots.vue';
import BadgeSlots from '../../../packages/ui/src/badge/demo/content-slots.vue';
import BreadcrumbSlots from '../../../packages/ui/src/breadcrumb/demo/scoped-item.vue';
import PrefixSuffix from '../../../packages/ui/src/input-number/demo/presuffix.vue';
import ListLikes from '../../../packages/ui/src/list/demo/item-extra.vue';
import ListLoadMore from '../../../packages/ui/src/list/demo/loadmore.vue';
import ListPagination from '../../../packages/ui/src/list/demo/pagination.vue';
import ListResponsive from '../../../packages/ui/src/list/demo/responsive.vue';
import MentionsPopup from '../../../packages/ui/src/mentions/demo/popupRender.vue';
import PaginationSlots from '../../../packages/ui/src/pagination/demo/native-slots.vue';
import ConditionalSelect from '../../../packages/ui/src/select/demo/conditional-options.vue';
import StepsNativeSlots from '../../../packages/ui/src/steps/demo/native-slots.vue';
import TableReorder from '../../../packages/ui/src/table/demo/drag-reorder.vue';
import TabsPopup from '../../../packages/ui/src/tabs/demo/popup-render.vue';
import TimelineSlots from '../../../packages/ui/src/timeline/demo/native-slots.vue';
import BreakpointNative from './BreakpointNative.vue';
import DrawerSlots from './DrawerSlots.vue';
import EventEmits from './EventEmits.vue';
import FormPrefix from './FormPrefix.vue';
import ListContent from './ListContent.vue';
import ListItemContent from './ListItemContent.vue';
import MasonryNative from './MasonryNative.vue';
import MentionsBindings from './MentionsBindings.vue';
import MentionsEmpty from './MentionsEmpty.vue';
import MentionsEvents from './MentionsEvents.vue';
import MentionsKeyboard from './MentionsKeyboard.vue';
import MentionsNativeEvents from './MentionsNativeEvents.vue';
import NativeAttrs from './NativeAttrs.vue';
import OverlayAttrs from './OverlayAttrs.vue';
import OverlayContent from './OverlayContent.vue';
import PaginationContainers from './PaginationContainers.vue';
import SwitchEvents from './SwitchEvents.vue';
import TimelineNative from './TimelineNative.vue';
import TypographySlots from './TypographySlots.vue';

const Rows = defineComponent({
  setup() {
    const count = ref(1);
    const vertical = ref(false);
    return () =>
      h('div', [
        h(
          Button,
          {
            onClick: () => {
              count.value = count.value === 1 ? 4 : 1;
            },
          },
          () => 'Toggle rows',
        ),
        h(
          Button,
          {
            onClick: () => {
              vertical.value = !vertical.value;
            },
          },
          () => 'Toggle layout',
        ),
        h(
          Descriptions,
          { column: 3, layout: vertical.value ? 'vertical' : 'horizontal' },
          {
            default: () =>
              Array.from({ length: count.value }, (_, i) =>
                h(DescriptionsItem, { key: i, label: `Label ${i}` }, () => `Content ${i}`),
              ),
          },
        ),
      ]);
  },
});
const name = new URLSearchParams(location.search).get('demo') ?? 'select';
const Demo = {
  select: ConditionalSelect,
  'input-number': PrefixSuffix,
  descriptions: Rows,
  'content-slots': ContentSlots,
  events: EventEmits,
  'switch-events': SwitchEvents,
  'tabs-popup': TabsPopup,
  'breadcrumb-slots': BreadcrumbSlots,
  'pagination-slots': PaginationSlots,
  'pagination-containers': PaginationContainers,
  'masonry-native': MasonryNative,
  'timeline-native': TimelineNative,
  'breakpoint-native': BreakpointNative,
  'timeline-slots': TimelineSlots,
  'steps-native-slots': StepsNativeSlots,
  'overlay-content': OverlayContent,
  'overlay-attrs': OverlayAttrs,
  'mentions-popup': MentionsPopup,
  'mentions-bindings': MentionsBindings,
  'mentions-events': MentionsEvents,
  'mentions-native-events': MentionsNativeEvents,
  'mentions-keyboard': MentionsKeyboard,
  'mentions-empty': MentionsEmpty,
  'typography-slots': TypographySlots,
  'drawer-slots': DrawerSlots,
  'form-prefix': FormPrefix,
  attrs: NativeAttrs,
  'table-reorder': TableReorder,
  badge: BadgeSlots,
  'list-slots': ListContent,
  'list-item-slots': ListItemContent,
  'list-loadmore': ListLoadMore,
  'list-pagination': ListPagination,
  'list-likes': ListLikes,
  'list-responsive': ListResponsive,
}[name];
createApp({ render: () => h('main', { style: 'padding: 32px' }, [h(Demo)]) }).mount('#app');
