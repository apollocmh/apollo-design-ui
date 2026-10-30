<script setup lang="ts">
import { computed, h, ref, shallowRef } from 'vue';
import { ConfigProvider, type ConfigProviderProps } from '../../../config-provider';
import { Tooltip } from '../../../tooltip';
import { type ItemType, Menu, type MenuRef } from '../../index';

const menu = shallowRef<MenuRef | null>(null);
const overflow = shallowRef<MenuRef | null>(null);
const selected = ref<string[]>([]);
const open = ref<string[]>(['sub']);
const changed = ref(false);
const empty = ref(false);
const narrow = ref(true);
const events = ref<string[]>([]);
const theme = computed(() =>
  changed.value
    ? {}
    : {
        token: { colorText: '#234567' },
        components: {
          Menu: {
            dropdownWidth: 230,
            zIndexPopup: 2800,
            itemBorderRadius: 12,
            activeBarHeight: 5,
            itemMarginInline: 6,
          },
        },
      },
);
const config = computed(
  (): NonNullable<ConfigProviderProps['components']> =>
    changed.value
      ? {}
      : { menu: { className: 'provided-menu', styles: { itemContent: { letterSpacing: '1px' } } } },
);
const items = computed<ItemType[]>(() => [
  { key: 'off', label: 'Disabled', disabled: true },
  {
    key: "a'[]",
    label: 'First item',
    icon: ({ isSelected }) => h('b', isSelected ? 'Selected' : 'Ready'),
  },
  {
    key: 'sub',
    label: 'Parent',
    theme: 'dark',
    children: [
      {
        key: 'draft',
        label: h('input', { id: 'menu-draft', 'aria-label': 'Menu draft', placeholder: 'Draft' }),
      },
      {
        key: 'hint',
        label: h(
          Tooltip,
          { open: true, title: 'Layer child', classNames: { root: 'menu-child-tooltip' } },
          () => h('button', { type: 'button' }, 'Child hint'),
        ),
      },
      { key: 'inner', label: 'Nested', children: [{ key: 'leaf', label: 'Leaf' }] },
    ],
  },
]);
const horizontal: ItemType[] = Array.from({ length: 6 }, (_, index) => ({
  key: `h${index}`,
  label: `Navigation ${index + 1}`,
}));
function patch(kind: 'theme' | 'icon' | 'width') {
  if (kind === 'theme') changed.value = !changed.value;
  else if (kind === 'icon') empty.value = !empty.value;
  else narrow.value = !narrow.value;
}
function refsValid() {
  return (
    menu.value?.list?.getAttribute('data-native-menu') === 'vertical' &&
    overflow.value?.list?.getAttribute('data-native-menu') === 'horizontal' &&
    menu.value.findItem({ key: "a'[]" })?.textContent?.includes('First item') &&
    overflow.value.findItem({ key: 'h0' })?.textContent?.includes('Navigation 1')
  );
}
function focusHorizontal() {
  overflow.value?.focus();
}
defineExpose({ patch, refsValid, events: () => events.value, focusHorizontal });
</script>
<template>
  <ConfigProvider :theme="theme" :components="config">
    <Menu ref="menu" v-model:selectedKeys="selected" v-model:openKeys="open" :items="items" multiple trigger-sub-menu-action="click" data-native-menu="vertical" :class="['native-menu',{changed}]" :style="['width:240px',{'--native-menu':'yes'}]" @click="info=>events.push(`click:${info.key}`)" @select="info=>events.push(`select:${info.key}`)" @deselect="info=>events.push(`deselect:${info.key}`)" @open-change="keys=>events.push(`open:${keys.join(',')}`)">
      <template #expandIcon="{isOpen}"><template v-if="!empty"><b>{{isOpen?'Open':'Closed'}}</b><i>Tail</i></template></template>
    </Menu>
    <Menu ref="overflow" class="horizontal-menu" data-native-menu="horizontal" :style="{width:narrow?'310px':'1100px',marginTop:'300px'}" mode="horizontal" :items="horizontal" @click="info=>events.push(`horizontal:${info.key}`)" />
  </ConfigProvider>
</template>
