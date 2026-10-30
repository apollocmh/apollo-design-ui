<script setup lang="ts">
import dayjs from 'dayjs';
import { ref } from 'vue';
import { Calendar } from '../../index';
import type { CalendarExpose, CalendarMode } from '../../interface';

const value = ref(dayjs('2026-09-15'));
const mode = ref<CalendarMode>('month');
const CalendarView = Calendar;
const calendar = ref<InstanceType<typeof CalendarView> | null>(null);
const expected: CalendarExpose | null = calendar.value;
const currentRoot = () => calendar.value?.nativeElement;
void expected;
void currentRoot;
</script>

<template>
  <CalendarView ref="calendar" v-model:value="value" v-model:mode="mode" :valid-range="[value.startOf('month'), value.endOf('month')]" id="native-calendar" aria-label="Choose a date" @change="date => date.format('YYYY-MM-DD')" @panel-change="(date, next) => `${date.year()}-${next}`">
    <template #headerRender="{ value: current, type, onChange, onTypeChange }">
      <button type="button" @click="onChange(current.add(1, 'month'))">{{ current.format('YYYY-MM') }}</button>
      <button type="button" @click="onTypeChange(type === 'month' ? 'year' : 'month')">{{ type }}</button>
    </template>
    <template #cellRender="{ current, info }">
      <span :data-type="info.type">{{ current.date() }}</span>
    </template>
    <template #fullCellRender="{ current, info }">
      <span :data-cell="info.prefixCls">{{ current.format('DD') }}</span>
    </template>
  </CalendarView>
  <!-- @vue-expect-error Calendar only supports year/month models. -->
  <CalendarView mode="date" />
</template>
