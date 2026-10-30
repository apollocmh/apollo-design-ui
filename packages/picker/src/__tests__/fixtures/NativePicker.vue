<script setup lang="ts">
import dayjs from 'dayjs';
import { ref } from 'vue';
import { dayjsGenerateConfig } from '../../generate/dayjs';
import type { PickerPanelRef } from '../../picker-panel';
import { PickerPanel } from '../../picker-panel';
import type { PanelMode } from '../../types';

const initial = dayjs('2026-10-20 10:15:00');
const value = ref([initial]);
const pickerValue = ref(initial);
const mode = ref<PanelMode>('time');
const panel = ref<PickerPanelRef | null>(null);
const custom = ref(true);
const changeOnScroll = ref(false);
const visible = ref(true);
const selections = ref(0);
</script>

<template>
  <button id="zero" @click="value = [initial.hour(0)]">Set first hour</button>
  <button id="late" @click="value = [initial.hour(18)]">Set later hour</button>
  <button id="slot" @click="custom = !custom">Toggle slot</button>
  <button id="scroll-on" @click="changeOnScroll = true">Enable scroll selection</button>
  <button id="scroll-off" @click="changeOnScroll = false">Disable scroll selection</button>
  <button id="unmount" @click="visible = false">Unmount</button>
  <PickerPanel
    v-if="visible"
    ref="panel"
    v-model:value="value"
    v-model:picker-value="pickerValue"
    v-model:mode="mode"
    picker="time"
    :locale="{ locale: 'en_US' }"
    :generate-config="dayjsGenerateConfig"
    format="HH:mm"
    :change-on-scroll="changeOnScroll"
    @select="selections += 1"
  >
    <template v-if="custom" #cellRender="{ current, info }">
      <span class="native-cell" :data-kind="info.subType">{{ current }}</span>
    </template>
  </PickerPanel>
  <output
    id="state"
    :data-selections="selections"
    :data-value="value[0]?.format('HH:mm')"
    :data-element="panel?.nativeElement?.classList.contains('apollo-picker-panel') ?? false"
  />
</template>
