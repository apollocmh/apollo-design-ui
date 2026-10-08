const e=`<script setup lang="ts">
// 对齐 antd 的 range-picker demo（DatePicker.RangePicker 的两种取用方式）。

import type { RangeValue } from '@apollo-design/ui';
import { DatePicker, Flex, RangePicker } from '@apollo-design/ui';

const onChange = (value: RangeValue, dateString: string | string[] | null) => {
  console.log(value, dateString);
};
<\/script>

<template>
  <Flex gap="small" vertical align="flex-start">
    <DatePicker.RangePicker @change="onChange" />
    <RangePicker @change="onChange" />
  </Flex>
</template>
`;export{e as default};
