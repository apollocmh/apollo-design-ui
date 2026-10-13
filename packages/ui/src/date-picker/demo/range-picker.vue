<script setup lang="ts">
// 对齐 antd 的 range-picker demo（DatePicker.RangePicker 的两种取用方式）。

import type { NoUndefinedRangeValue } from '@apollo-design/ui';
import { DatePicker, Flex, RangePicker } from '@apollo-design/ui';

// ⚠️ 必须按 `RangePickerEmits['change']` 的真实签名写：第一参**可为 `null`**
//    （受控清空），第二参是**定长二元组**（不是 `string | string[] | null`）。
//    此前写成 `(RangeValue, string | string[] | null)` ⇒ 与 emits 不兼容，
//    在 `test:types` 里是一条「unhandled source error」（会让门禁失真）。
const onChange = (value: NoUndefinedRangeValue | null, dateString: [string, string]) => {
  console.log(value, dateString);
};
</script>

<template>
  <Flex gap="small" vertical align="flex-start">
    <DatePicker.RangePicker @change="onChange" />
    <RangePicker @change="onChange" />
  </Flex>
</template>
