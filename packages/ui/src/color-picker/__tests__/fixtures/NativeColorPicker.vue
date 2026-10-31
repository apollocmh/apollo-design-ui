<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import ConfigProvider from '../../../config-provider/ConfigProvider';
import type { ConfigProviderProps } from '../../../config-provider/interface';
import { ColorPicker, ColorPickerPurePanel } from '../../index';
import type { ColorValueType } from '../../interface';

const controls = { ConfigProvider, ColorPicker, ColorPickerPurePanel };
const open = ref(false);
const value = shallowRef<ColorValueType>('#1677ff');
const pureValue = shallowRef<ColorValueType>('#ff0000');
const custom = ref(true);
const configured = ref(true);
const darkText = ref(false);
const mounted = ref(true);
const changes = ref<string[]>([]);
const completes = ref(0);
const clears = ref(0);
const components = computed((): NonNullable<ConfigProviderProps['components']> => {
  if (!configured.value) return {};
  return { 'color-picker': { styles: { popupOverlayInner: { width: '320px', padding: '12px' } } } };
});
const theme = computed(() => ({ token: { colorText: darkText.value ? '#654321' : '#234567' } }));
const presets = [{ label: 'Colors', colors: ['rgba(255,0,0,0.2)', '#0000ff'] }];
function patch(kind: 'text' | 'styles' | 'theme' | 'unmount') {
  if (kind === 'text') custom.value = !custom.value;
  if (kind === 'styles') configured.value = !configured.value;
  if (kind === 'theme') darkText.value = !darkText.value;
  if (kind === 'unmount') mounted.value = false;
}
defineExpose({
  patch,
  events: () => ({ changes: changes.value, completes: completes.value, clears: clears.value }),
});
</script>

<template>
  <controls.ConfigProvider :components="components" :theme="theme">
    <controls.ColorPicker
      v-if="mounted"
      id="native-color"
      v-model:open="open"
      v-model:value="value"
      aria-label="Native color picker"
      :class-names="{ popup: { root: 'fixture-color-popup' } }"
      allow-clear
      disabled-alpha
      :presets="presets"
      @change="(_color, css) => changes.push(css)"
      @change-complete="completes++"
      @clear="clears++"
    >
      <template v-if="custom" #showText="{ color }">Color <b>{{ color.toHexString() }}</b>0</template>
      <template #panelRender="{ panel }"><section class="fixture-custom-panel"><component :is="panel" /></section></template>
    </controls.ColorPicker>
    <controls.ColorPickerPurePanel
      v-if="mounted"
      class="fixture-static-color"
      style="color: rgb(35, 69, 103)"
      :color-picker-props="{ value: pureValue }"
      @change="next => pureValue = next"
    />
  </controls.ConfigProvider>
</template>
