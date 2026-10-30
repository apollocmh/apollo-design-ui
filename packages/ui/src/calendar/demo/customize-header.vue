<script setup lang="ts">
import type { CalendarDate, CalendarMode, RadioValue, SelectValue } from '@apollo-design/ui';
import { Calendar, Flex, RadioButton, RadioGroup, Select } from '@apollo-design/ui';
import dayjs from 'dayjs';

const years = (value: CalendarDate) =>
  Array.from({ length: 20 }, (_, offset) => ({
    label: value.year() - 10 + offset,
    value: value.year() - 10 + offset,
  }));
const months = Array.from({ length: 12 }, (_, month) => ({
  label: dayjs().month(month).format('MMM'),
  value: month,
}));
function selectDate(
  next: SelectValue,
  value: CalendarDate,
  change: (date: CalendarDate) => void,
  unit: 'year' | 'month',
) {
  if (typeof next === 'number') change(unit === 'year' ? value.year(next) : value.month(next));
}
function selectMode(next: RadioValue, change: (mode: CalendarMode) => void) {
  if (next === 'month' || next === 'year') change(next);
}
const onPanelChange = (value: CalendarDate, mode: CalendarMode) =>
  console.log(value.format('YYYY-MM-DD'), mode);
const wrapperStyle = { width: '300px', border: '1px solid #f0f0f0', borderRadius: '8px' };
</script>

<template>
  <div :style="wrapperStyle">
    <Calendar :fullscreen="false" @panel-change="onPanelChange">
      <template #headerRender="{ value, type, onChange, onTypeChange }">
        <div style="padding: 8px">
          <h4 style="margin: 0 0 8px">Custom header</h4>
          <Flex :gap="8">
            <RadioGroup size="small" :value="type" @update:value="next => selectMode(next, onTypeChange)">
              <RadioButton value="month">Month</RadioButton>
              <RadioButton value="year">Year</RadioButton>
            </RadioGroup>
            <Select aria-label="Year" size="small" :value="value.year()" :options="years(value)" @update:value="next => selectDate(next, value, onChange, 'year')" />
            <Select aria-label="Month" size="small" :value="value.month()" :options="months" @update:value="next => selectDate(next, value, onChange, 'month')" />
          </Flex>
        </div>
      </template>
    </Calendar>
  </div>
</template>
