<script setup lang="ts">
import { ref } from 'vue';
import ConfigProvider from '../../../config-provider/ConfigProvider';
import { Slider } from '../../index';
import type { SliderRef, SliderValue } from '../../interface';

const slider = ref<SliderRef | null>(null);
const shown = ref(true);
const accepted = ref(false);
const disabled = ref(false);
const cancelKeys = ref(false);
const themed = ref(false);
const rangeMode = ref(false);
const single = ref<SliderValue | null>(30);
const range = ref<SliderValue>([20, 60]);
const track = ref<SliderValue>([10, 40]);
const editable = ref<SliderValue>([20, 60]);
const custom = ref<SliderValue>(30);
const complete = ref('');
const before = ref('');
const changes = ref(0);
const nativeKey = (event: KeyboardEvent, index: number) => {
  if (cancelKeys.value) event.preventDefault();
  if (index < 0) throw new Error('Keyboard notification requires an actual handle');
};
const updateSingle = (value: SliderValue) => {
  if (accepted.value) single.value = value;
};
const updateRange = (value: SliderValue) => {
  if (accepted.value) range.value = value;
};
const onComplete = (value: SliderValue) => {
  complete.value = JSON.stringify(value);
};
const onBefore = (value: SliderValue) => {
  before.value = JSON.stringify(value);
};
const onChange = () => {
  changes.value += 1;
};
</script>

<template>
  <ConfigProvider :theme="themed ? { components: { Slider: { controlSize: 16, handleSize: 18, handleSizeHover: 22, railSize: 6, trackBg: '#123456' } } } : {}">
    <button data-action="accept" @click="accepted = !accepted">Toggle acceptance</button>
    <button data-action="disable" @click="disabled = !disabled">Toggle disabled</button>
    <button data-action="cancel" @click="cancelKeys = !cancelKeys">Toggle keyboard cancellation</button>
    <button data-action="mode" @click="rangeMode = !rangeMode">Toggle mode</button>
    <button data-action="theme" @click="themed = !themed">Toggle theme</button>
    <button data-action="focus" @click="slider?.focus()">Focus custom handle</button>
    <button data-action="blur" @click="slider?.blur()">Blur custom handle</button>
    <button data-action="unmount" @click="shown = false">Unmount controls</button>
    <section v-if="shown" style="display: grid; gap: 42px; width: 400px; padding: 35px">
      <Slider data-case="single" :value="single" :range="rangeMode" :disabled="disabled" aria-label="Volume" :tooltip="{ open: false }" @keydown="nativeKey" @update:value="updateSingle" @before-change="onBefore" @change="onChange" @change-complete="onComplete" />
      <Slider data-case="range" range :value="range" :disabled="disabled" :aria-label-for-handle="['Start', 'End']" :tooltip="{ formatter: value => `range:${value}` }" @update:value="updateRange" @before-change="onBefore" @change="onChange" @change-complete="onComplete" />
      <Slider data-case="track" v-model:value="track" :range="{ draggableTrack: true }" :aria-label-for-handle="['Track start', 'Track end']" :tooltip="{ open: false }" @change-complete="onComplete" />
      <Slider data-case="editable" v-model:value="editable" :range="{ editable: true, minCount: 1, maxCount: 3 }" :aria-label-for-handle="['First', 'Second', 'Third']" :tooltip="{ open: false }" @change-complete="onComplete" />
      <Slider ref="slider" data-case="custom" v-model:value="custom" aria-label="Custom control" :tooltip="{ open: false }" @keydown="nativeKey" @change-complete="onComplete">
        <template #handle="{ nodeProps, className, style, value, index }">
          <div v-bind="nodeProps" :class="[className, 'native-custom-handle']" :style="style" :data-index="index" :data-value="value" />
        </template>
      </Slider>
    </section>
    <output data-state="single">{{ JSON.stringify(single) }}</output>
    <output data-state="range">{{ JSON.stringify(range) }}</output>
    <output data-state="editable">{{ JSON.stringify(editable) }}</output>
    <output data-state="complete">{{ complete }}</output>
    <output data-state="before">{{ before }}</output>
    <output data-state="changes">{{ changes }}</output>
    <output data-state="ref">{{ slider ? 'ready' : 'none' }}</output>
  </ConfigProvider>
</template>
