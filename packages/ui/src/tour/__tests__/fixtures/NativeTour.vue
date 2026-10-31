<script setup lang="ts">
import { type Component, h, ref, type StyleValue, shallowRef } from 'vue';
import { ConfigProvider } from '../../../config-provider';
import type { ConfigProviderProps } from '../../../config-provider/interface';
import { Tooltip } from '../../../tooltip';
import { Tour, TourPurePanel } from '../../index';
import type { TourStepProps } from '../../interface';

const open = ref<boolean | undefined>(false);
const current = ref<number | undefined>(0);
const accept = ref(false);
const secondOpen = ref(false);
const mask = ref(true);
const zIndex = ref<number | undefined>(undefined);
const disabledInteraction = ref(false);
const showClose = ref(false);
const showDescriptionSlot = ref(true);
const descriptionContent = ref(true);
const target1 = shallowRef<HTMLButtonElement | null>(null);
const target2 = shallowRef<HTMLButtonElement | null>(null);
const host1 = shallowRef<HTMLElement | null>(null);
const host2 = shallowRef<HTMLElement | null>(null);
const secondContainer = ref(false);
const prefix = ref('apollo');
const style = shallowRef<StyleValue>([
  { width: '340px', maxWidth: 'none' },
  'outline: 1px solid red',
]);
const theme = shallowRef<ConfigProviderProps['theme']>({
  token: { zIndexPopupBase: 2000 },
  components: { Tour: { zIndexPopup: 2600, closeBtnSize: 35 } },
});
const components = shallowRef<NonNullable<ConfigProviderProps['components']>>({
  tour: { className: 'provider-tour', styles: { title: { color: 'rgb(0, 128, 0)' } } },
});
const steps = shallowRef<[TourStepProps, TourStepProps]>([
  {
    title: 'Step zero',
    description: 'Fallback description',
    target: () => target1.value,
    nextButtonProps: { children: 'Continue' },
  },
  { title: 'Step one', description: 'Second description', target: () => target2.value },
]);
const origins: Component[] = [];
const events = {
  current: [] as number[],
  close: [] as number[],
  finish: 0,
  open: [] as boolean[],
  align: 0,
  target: 0,
  outside: 0,
  otherClose: 0,
};
function remember(component: Component) {
  origins.push(component);
  return component;
}
const container = (node: HTMLElement) => {
  if (
    !(node instanceof HTMLElement) ||
    !Array.from(node.classList).some((name) => name.endsWith('-tour-target-placeholder'))
  )
    throw new Error('Tour container service did not receive the current native placeholder');
  return secondContainer.value ? host2.value : host1.value;
};
function updateOpen(value: boolean) {
  events.open.push(value);
  if (accept.value) open.value = value;
}
function updateCurrent(value: number) {
  events.current.push(value);
  if (accept.value) current.value = value;
}
function patch(kind: string) {
  switch (kind) {
    case 'accept':
      accept.value = true;
      break;
    case 'release':
      current.value = undefined;
      open.value = undefined;
      break;
    case 'reopen':
      current.value = undefined;
      open.value = true;
      break;
    case 'close':
      open.value = false;
      break;
    case 'theme':
      theme.value = {
        token: { zIndexPopupBase: 3000, borderRadiusLG: 14, marginXXS: 10 },
        components: { Tour: { zIndexPopup: 4200, closeBtnSize: 44 } },
      };
      break;
    case 'clear-theme':
      zIndex.value = undefined;
      theme.value = {};
      components.value = {};
      break;
    case 'zero':
      zIndex.value = 0;
      break;
    case 'prefix':
      prefix.value = 'orbit';
      break;
    case 'container':
      secondContainer.value = !secondContainer.value;
      break;
    case 'mask':
      mask.value = !mask.value;
      break;
    case 'interaction':
      disabledInteraction.value = !disabledInteraction.value;
      break;
    case 'close-icon':
      showClose.value = !showClose.value;
      break;
    case 'empty-description':
      descriptionContent.value = false;
      break;
    case 'remove-description-slot':
      showDescriptionSlot.value = false;
      break;
    case 'steps':
      steps.value = [
        { ...steps.value[0], title: 'Updated step', target: () => target2.value },
        steps.value[1],
      ];
      break;
    case 'style':
      style.value = 'width: 390px; max-width: none; outline: 2px solid blue';
      break;
    case 'other':
      secondOpen.value = true;
      break;
    default:
      throw new Error(`Unknown Tour fixture action: ${kind}`);
  }
}
defineExpose({
  patch,
  events: () => ({
    ...events,
    current: [...events.current],
    open: [...events.open],
    close: [...events.close],
  }),
  originsStable: () => origins.length > 1 && origins.every((origin) => origin === origins[0]),
});
</script>

<template>
  <ConfigProvider :prefix-cls="prefix" :components="components" :theme="theme">
    <button id="tour-opener" type="button" @click="open = true">Open guide</button>
    <button id="tour-outside" type="button" @click="events.outside++">Outside guide</button>
    <button id="tour-target-one" ref="target1" type="button" @click="events.target++">Target one</button>
    <section id="tour-scroller" style="height: 160px; overflow: auto; margin-top: 60px; width: 280px">
      <div style="height: 45px" />
      <button id="tour-target-two" ref="target2" type="button">Target two</button>
      <div style="height: 600px" />
    </section>
    <section id="tour-host-one" ref="host1" style="position: relative; margin-left: 25px" />
    <section id="tour-host-two" ref="host2" style="position: relative; margin-left: 45px" />
    <Tour
      id="native-tour" :open="open" :current="current" :steps="steps" :mask="mask" :disabled-interaction="disabledInteraction"
      :get-popup-container="container" :scroll-into-view-options="false" :style="style" :z-index="zIndex"
      @update:open="updateOpen" @update:current="updateCurrent" @close="events.close.push($event)" @finish="events.finish++" @popup-align="events.align++"
    >
      <template #title="{ current }"><strong>Guide {{ current }}</strong></template>
      <template v-if="showDescriptionSlot" #description><span v-if="descriptionContent">Dynamic description</span></template>
      <template v-if="showClose" #closeIcon><span>Custom close</span></template>
      <template #actions="{ originNode }"><input aria-label="Tour draft" /><component :is="remember(originNode)" /></template>
      <template #cover><Tooltip prefix-cls="apollo-tooltip" open title="Nested tooltip"><span id="tour-tooltip">Help</span></Tooltip></template>
    </Tour>
    <Tour id="other-tour" :open="secondOpen" :steps="[{ title: 'Other zero' }, { title: 'Other one' }]" :get-popup-container="container" @update:open="secondOpen = $event" @close="events.otherClose++" />
    <TourPurePanel id="tour-preview" title="Preview" style="margin-top: 600px"><template #actions="{ originNode }"><component :is="originNode" /></template></TourPurePanel>
  </ConfigProvider>
</template>
