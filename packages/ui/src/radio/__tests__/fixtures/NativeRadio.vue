<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import ConfigProvider from '../../../config-provider/ConfigProvider';
import { Radio, RadioButton, RadioGroup } from '../../index';
import type { RadioGroupRef, RadioOptionItem, RadioRef, RadioValue } from '../../interface';

const radio = ref<RadioRef | null>(null);
const button = ref<RadioRef | null>(null);
const group = ref<RadioGroupRef | null>(null);
const checked = ref(false);
const value = ref<RadioValue>('a');
const accept = ref(false);
const configured = ref(false);
const shown = ref(true);
const changeCount = ref(0);
const eventIsNative = ref(false);
const requested = ref(false);
const options = shallowRef<RadioOptionItem[]>([
  { value: 'a', label: 'a' },
  { value: 'b', label: 'b' },
  { value: 'disabled', label: 'disabled', disabled: true },
]);
const updateChecked = (next: boolean) => {
  if (accept.value) checked.value = next;
};
const updateValue = (next: RadioValue) => {
  if (accept.value) value.value = next;
};
const onChange = (event: Event, next: boolean) => {
  changeCount.value += 1;
  eventIsNative.value = event instanceof Event && event.target === radio.value?.input;
  requested.value = next;
};
const focusRadio = () => radio.value?.focus();
const focusButton = () => button.value?.focus();
const blurButton = () => button.value?.blur();
const onGroupChange = (next: RadioValue, event: Event) => {
  eventIsNative.value = event instanceof Event;
  if (typeof next === 'boolean') requested.value = next;
};
</script>

<template>
  <ConfigProvider
    :theme="configured ? { token: { fontSizeLG: 24, wireframe: true }, components: { Radio: { buttonPaddingInline: 21, buttonSolidCheckedBg: '#123456' } } } : {}"
  >
    <button data-action="accept" @click="accept = !accept">Toggle acceptance</button>
    <button data-action="theme" @click="configured = !configured">Toggle theme</button>
    <button data-action="focus-radio" @click="focusRadio">Focus radio</button>
    <button data-action="focus-button" @click="focusButton">Focus button</button>
    <button data-action="blur-button" @click="blurButton">Blur button</button>
    <button data-action="unmount" @click="shown = false">Unmount controls</button>
    <button data-action="reorder" @click="options = [...options].reverse()">Reverse options</button>
    <section v-if="shown">
      <Radio ref="radio" data-case="single" :checked="checked" @update:checked="updateChecked" @change="onChange">Standalone</Radio>
      <RadioButton ref="button" data-case="button" :checked="checked" @update:checked="updateChecked">Button</RadioButton>
      <RadioGroup ref="group" data-case="group" name="native-radio-contract" :value="value" :options="options" @update:value="updateValue" @change="onGroupChange" />
      <RadioGroup data-case="button-group" name="native-radio-buttons" option-type="button" button-style="solid" default-value="a" :options="['a', 'b']" />
      <RadioGroup data-case="independent" default-value="a" :options="['a', 'b']" />
    </section>
    <output data-state="value">{{ value }}</output>
    <output data-state="change">{{ changeCount }}:{{ eventIsNative }}:{{ requested }}</output>
    <output data-state="refs">{{ radio?.input?.tagName ?? 'none' }}:{{ button?.nativeElement?.tagName ?? 'none' }}:{{ group?.nativeElement?.tagName ?? 'none' }}</output>
  </ConfigProvider>
</template>
