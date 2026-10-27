import { ConfigProvider } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';
import Demo0 from '../../../packages/ui/src/anchor/demo/bounds.vue';
import Demo1 from '../../../packages/ui/src/anchor/demo/component-token.vue';
import Demo2 from '../../../packages/ui/src/auto-complete/demo/custom.vue';
import Demo3 from '../../../packages/ui/src/cascader/demo/component-token.vue';
import Demo4 from '../../../packages/ui/src/cascader/demo/custom-dropdown.vue';
import Demo5 from '../../../packages/ui/src/cascader/demo/custom-trigger.vue';
import Demo6 from '../../../packages/ui/src/cascader/demo/hover.vue';
import Demo7 from '../../../packages/ui/src/cascader/demo/render-panel.vue';
import Demo8 from '../../../packages/ui/src/cascader/demo/show-checked-strategy.vue';
import Demo9 from '../../../packages/ui/src/cascader/demo/style-class.vue';
import Demo10 from '../../../packages/ui/src/cascader/demo/suffix.vue';
import Demo11 from '../../../packages/ui/src/cascader/demo/variant.vue';
import Demo12 from '../../../packages/ui/src/collapse/demo/collapsible.vue';
import Demo13 from '../../../packages/ui/src/collapse/demo/component-token.vue';
import Demo14 from '../../../packages/ui/src/collapse/demo/custom.vue';
import Demo15 from '../../../packages/ui/src/collapse/demo/ghost.vue';
import Demo16 from '../../../packages/ui/src/collapse/demo/size.vue';
import Demo17 from '../../../packages/ui/src/config-provider/demo/component-size.vue';
import Demo18 from '../../../packages/ui/src/config-provider/demo/direction.vue';
import Demo19 from '../../../packages/ui/src/config-provider/demo/use-config.vue';
import Demo20 from '../../../packages/ui/src/listy/demo/group-header.vue';
import Demo21 from '../../../packages/ui/src/listy/demo/rich.vue';
import Demo22 from '../../../packages/ui/src/select/demo/custom-tag-render.vue';
import Demo23 from '../../../packages/ui/src/table/demo/column-defaults.vue';
import Demo24 from '../../../packages/ui/src/table/demo/component-token.vue';
import Demo25 from '../../../packages/ui/src/table/demo/dynamic-settings.vue';
import Demo26 from '../../../packages/ui/src/table/demo/edit-row.vue';
import Demo27 from '../../../packages/ui/src/table/demo/editable-cell.vue';
import Demo28 from '../../../packages/ui/src/table/demo/ellipsis-custom-tooltip.vue';
import Demo29 from '../../../packages/ui/src/table/demo/expand-sticky.vue';
import Demo30 from '../../../packages/ui/src/table/demo/filter-search-tree.vue';
import Demo31 from '../../../packages/ui/src/table/demo/head.vue';
import Demo32 from '../../../packages/ui/src/table/demo/hidden-columns.vue';
import Demo33 from '../../../packages/ui/src/table/demo/nested-table.vue';
import Demo35 from '../../../packages/ui/src/table/demo/pagination.vue';
import Demo34 from '../../../packages/ui/src/table/demo/pagination-placement.vue';
import Demo36 from '../../../packages/ui/src/table/demo/reset-filter.vue';
import Demo37 from '../../../packages/ui/src/table/demo/row-selection-custom.vue';
import Demo38 from '../../../packages/ui/src/table/demo/sticky-container.vue';
import Demo39 from '../../../packages/ui/src/table/demo/style-class.vue';
import Demo40 from '../../../packages/ui/src/table/demo/tree-data.vue';
import Demo41 from '../../../packages/ui/src/table/demo/tree-table-ellipsis.vue';
import Demo42 from '../../../packages/ui/src/tabs/demo/card-top.vue';
import Demo43 from '../../../packages/ui/src/tabs/demo/component-token.vue';
import Demo44 from '../../../packages/ui/src/tree-select/demo/component-token.vue';
import Demo45 from '../../../packages/ui/src/tree-select/demo/label-in-value.vue';
import Demo46 from '../../../packages/ui/src/tree-select/demo/placement.vue';
import Demo47 from '../../../packages/ui/src/tree-select/demo/tree-default-expand-all.vue';

const demos = {
  'anchor/bounds': Demo0,
  'anchor/component-token': Demo1,
  'auto-complete/custom': Demo2,
  'cascader/component-token': Demo3,
  'cascader/custom-dropdown': Demo4,
  'cascader/custom-trigger': Demo5,
  'cascader/hover': Demo6,
  'cascader/render-panel': Demo7,
  'cascader/show-checked-strategy': Demo8,
  'cascader/style-class': Demo9,
  'cascader/suffix': Demo10,
  'cascader/variant': Demo11,
  'collapse/collapsible': Demo12,
  'collapse/component-token': Demo13,
  'collapse/custom': Demo14,
  'collapse/ghost': Demo15,
  'collapse/size': Demo16,
  'config-provider/component-size': Demo17,
  'config-provider/direction': Demo18,
  'config-provider/use-config': Demo19,
  'listy/group-header': Demo20,
  'listy/rich': Demo21,
  'select/custom-tag-render': Demo22,
  'table/column-defaults': Demo23,
  'table/component-token': Demo24,
  'table/dynamic-settings': Demo25,
  'table/edit-row': Demo26,
  'table/editable-cell': Demo27,
  'table/ellipsis-custom-tooltip': Demo28,
  'table/expand-sticky': Demo29,
  'table/filter-search-tree': Demo30,
  'table/head': Demo31,
  'table/hidden-columns': Demo32,
  'table/nested-table': Demo33,
  'table/pagination-placement': Demo34,
  'table/pagination': Demo35,
  'table/reset-filter': Demo36,
  'table/row-selection-custom': Demo37,
  'table/sticky-container': Demo38,
  'table/style-class': Demo39,
  'table/tree-data': Demo40,
  'table/tree-table-ellipsis': Demo41,
  'tabs/card-top': Demo42,
  'tabs/component-token': Demo43,
  'tree-select/component-token': Demo44,
  'tree-select/label-in-value': Demo45,
  'tree-select/placement': Demo46,
  'tree-select/tree-default-expand-all': Demo47,
};
export const consumerNames = Object.keys(demos);
export default defineComponent({
  setup() {
    const name = ref(consumerNames[0]);
    onMounted(() => {
      window.tagConsumers = {
        names: consumerNames,
        async show(value) {
          if (!demos[value]) throw Error(`Unknown consumer ${value}`);
          name.value = value;
          await nextTick();
        },
      };
    });
    return () =>
      h(ConfigProvider, { components: { tag: { className: 'tag-current-consumer' } } }, () =>
        h(
          'main',
          {
            'data-consumer': name.value,
            style: {
              padding: '24px',
              minHeight: '600px',
              background: 'var(--apollo-color-bg-container)',
              color: 'var(--apollo-color-text)',
              fontFamily: 'var(--apollo-font-family)',
            },
          },
          [h('h1', `Tag consumer ${name.value}`), h(demos[name.value], { key: name.value })],
        ),
      );
  },
});
