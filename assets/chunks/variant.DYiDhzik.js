const e=`<script setup lang="ts">
// 对齐 antd 的 variant demo。
import { Flex, TimePicker, TimeRangePicker } from '@apollo-design/ui';
<\/script>

<template>
  <Flex vertical :gap="12">
    <Flex :gap="8">
      <TimePicker placeholder="Outlined" />
      <TimeRangePicker :placeholder="['Outlined Start', 'Outlined End']" />
    </Flex>
    <Flex :gap="8">
      <TimePicker variant="filled" placeholder="Filled" />
      <TimeRangePicker variant="filled" :placeholder="['Filled Start', 'Filled End']" />
    </Flex>
    <Flex :gap="8">
      <TimePicker variant="borderless" placeholder="Borderless" />
      <TimeRangePicker variant="borderless" :placeholder="['Borderless Start', 'Borderless End']" />
    </Flex>
    <Flex :gap="8">
      <TimePicker variant="underlined" placeholder="Underlined" />
      <TimeRangePicker variant="underlined" :placeholder="['Underlined Start', 'Underlined End']" />
    </Flex>
  </Flex>
</template>
`;export{e as default};
