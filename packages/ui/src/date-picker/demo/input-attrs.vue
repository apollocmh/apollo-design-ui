<script setup lang="ts">
import { DatePicker, Flex, RangePicker } from '@apollo-design/ui';
</script>

<template>
  <Flex gap="small" vertical align="flex-start">
    <label for="demo-date-input">日期 / Date</label>
    <DatePicker id="demo-date-input" name="date" aria-describedby="demo-date-hint" required />
    <span id="demo-date-hint">选择日期，也可以使用键盘输入。 / Pick or type a date.</span>
    <label for="demo-range-start">开始日期 / Start date</label>
    <label for="demo-range-end">结束日期 / End date</label>
    <RangePicker :id="{ start: 'demo-range-start', end: 'demo-range-end' }" />
  </Flex>
</template>
