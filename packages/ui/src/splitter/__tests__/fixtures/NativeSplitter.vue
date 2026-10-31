<script setup lang="ts">
import type { ThemeConfig } from '@apollo-design/theme';
import { computed, ref, shallowRef } from 'vue';
import { ConfigProvider } from '../../../config-provider';
import {
  Splitter as SplitterComponent,
  SplitterPanel as SplitterPanelComponent,
} from '../../index';

const Splitter = SplitterComponent;
const SplitterPanel = SplitterPanelComponent;

const order = ref(['a', 'b', 'c']);
const shown = ref(false);
const defaults: Record<string, string> = { a: '25%', b: '25%', c: '50%' };
const root = ref<InstanceType<typeof Splitter> | null>(null);
const controlled = ref<number[] | undefined>([200, 400]);
const accept = ref(false);
const disabled = ref(false);
const vertical = ref(true);
const lazyShown = ref(true);
const theme = shallowRef<ThemeConfig | undefined>({
  components: { Splitter: { splitBarSize: 4, splitTriggerSize: 12, resizeSpinnerSize: 28 } },
});
const attrs = ref(false);
const style = computed(() =>
  attrs.value ? ['padding-top:3px', { paddingTop: '7px' }] : 'padding-top:2px',
);
const mainEvents = ref<{
  start: number[][];
  resize: number[][];
  end: number[][];
  collapse: boolean[][];
  double: number[];
}>({ start: [], resize: [], end: [], collapse: [], double: [] });
const controlEvents = ref<number[][]>([]);
const lazyEvents = ref<number[][]>([]);
const onControl = (sizes: number[]) => {
  controlEvents.value.push(sizes);
  if (accept.value) controlled.value = sizes;
};
const panelA = ref<InstanceType<typeof SplitterPanel>[]>([]);
const panelB = ref<InstanceType<typeof SplitterPanel>[]>([]);
const panelC = ref<InstanceType<typeof SplitterPanel>[]>([]);
const patch = (kind: string) => {
  if (kind === 'reorder') order.value = ['c', 'a', 'b'];
  if (kind === 'show') shown.value = !shown.value;
  if (kind === 'attrs') attrs.value = !attrs.value;
  if (kind === 'release') controlled.value = undefined;
  if (kind === 'accept') accept.value = true;
  if (kind === 'control') controlled.value = [200, 400];
  if (kind === 'disable') disabled.value = !disabled.value;
  if (kind === 'axis') vertical.value = !vertical.value;
  if (kind === 'removeLazy') lazyShown.value = false;
  if (kind === 'theme')
    theme.value = {
      components: {
        Splitter: {
          splitBarSize: 5,
          splitTriggerSize: 16,
          resizeSpinnerSize: 30,
          splitBarDraggableSize: 14,
        },
      },
    };
  if (kind === 'clearTheme') theme.value = undefined;
};
defineExpose({
  patch,
  state: () => ({ main: mainEvents.value, control: controlEvents.value, lazy: lazyEvents.value }),
  refsValid: () =>
    root.value?.nativeElement instanceof HTMLDivElement &&
    panelA.value[0]?.nativeElement?.dataset.panel === 'a' &&
    panelB.value[0]?.nativeElement?.dataset.panel === 'b' &&
    panelC.value[0]?.nativeElement?.dataset.panel === 'c',
});
</script>

<template>
  <ConfigProvider :theme="theme">
    <Splitter ref="root" class="main-splitter" :class="{ second: attrs }" :data-current="attrs ? 'second' : 'first'" style="width:800px;height:180px" :collapsible="{ motion: true }" @resize-start="sizes => mainEvents.start.push(sizes)" @resize="sizes => mainEvents.resize.push(sizes)" @resize-end="sizes => mainEvents.end.push(sizes)" @collapse="collapsed => mainEvents.collapse.push(collapsed)" @dragger-double-click="index => mainEvents.double.push(index)">
      <template v-for="key in order" :key="key">
        <SplitterPanel v-if="key === 'a'" ref="panelA" key="a" data-panel="a" :class="{ second: attrs }" :style="style" :default-size="defaults[key]" :min="'10%'" collapsible>
          <span v-if="shown">Current heading</span><input aria-label="Draft a" /><span>{{ 0 }}</span>
        </SplitterPanel>
        <SplitterPanel v-else-if="key === 'b'" ref="panelB" key="b" data-panel="b" :default-size="defaults[key]" collapsible><input aria-label="Draft b" /></SplitterPanel>
        <SplitterPanel v-else ref="panelC" key="c" data-panel="c" :default-size="defaults[key]" collapsible><input aria-label="Draft c" /></SplitterPanel>
      </template>
      <template #draggerIcon><b v-if="shown">Grip</b></template>
    </Splitter>
    <Splitter class="controlled-splitter" style="width:600px;height:150px" @resize="onControl">
      <SplitterPanel :size="controlled?.[0]" :default-size="120" /><SplitterPanel :size="controlled?.[1]" :default-size="480" />
    </Splitter>
    <ConfigProvider direction="rtl">
      <Splitter v-if="lazyShown" class="lazy-splitter" lazy style="width:600px;height:150px" @resize="sizes => lazyEvents.push(sizes)">
        <SplitterPanel default-size="40%" min="20%" :resizable="!disabled" collapsible /><SplitterPanel min="20%" collapsible />
      </Splitter>
    </ConfigProvider>
    <Splitter class="axis-splitter" :vertical="vertical" style="width:600px;height:240px">
      <SplitterPanel default-size="40%" min="20%" /><SplitterPanel min="20%" />
    </Splitter>
  </ConfigProvider>
</template>
