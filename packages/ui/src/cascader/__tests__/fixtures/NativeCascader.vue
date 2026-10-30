<script setup lang="ts">
import { ref } from 'vue';
import ConfigProvider from '../../../config-provider/ConfigProvider';
import Cascader from '../../Cascader';
import type { CascaderOutputValue, CascaderRef } from '../../interface';

const props = withDefaults(defineProps<{ decorate?: boolean; width?: number }>(), {
  decorate: true,
  width: 261,
});
const value = ref<CascaderOutputValue>([]);
const open = ref(true);
const search = ref('');
const picker = ref<CascaderRef | null>(null);
const options = ref([
  {
    value: 'parent',
    label: 'Parent',
    children: [
      { value: 0, label: 'Zero' },
      { value: '0', label: 'String zero' },
    ],
  },
]);
defineExpose({ picker, value, open, search, options });
</script>

<template>
  <ConfigProvider :theme="{ components: { Cascader: { controlWidth: props.width, controlItemWidth: 137, dropdownHeight: 207, menuPadding: 6, optionPadding: '7px 13px', optionSelectedBg: '#123456', optionSelectedColor: '#fefefe', optionSelectedFontWeight: 700 } } }">
    <Cascader ref="picker" v-model:value="value" v-model:open="open" v-model:searchValue="search" :options="options" show-search aria-label="Native Cascader" class="native-cascader" :class-names="{ popup: { root: 'native-cascader-popup' } }">
      <template #popupRender="{ menu }">
        <section class="native-panel-wrapper">
          <input data-panel-draft aria-label="Panel draft">
          <component :is="menu" />
        </section>
      </template>
      <template v-if="props.decorate" #optionRender="{ option, pathOptions }"><b class="native-option">{{ option.label }}:{{ pathOptions.length }}</b><i>+</i>0</template>
      <template #displayRender="{ labels }"><span class="native-display">{{ labels.join(' > ') }}</span></template>
      <template #searchRender="{ inputValue, pathOptions }"><strong class="native-search">{{ inputValue }}:{{ pathOptions.length }}</strong></template>
    </Cascader>
  </ConfigProvider>
</template>
