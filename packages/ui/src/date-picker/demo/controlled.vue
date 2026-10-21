<script setup lang="ts">
// 对齐 antd 的 demo/controlled.tsx（value + open 双受控）
import { Button, DatePicker, Flex, type SingleValue, Space } from '@apollo-design/ui';
import dayjs from 'dayjs';
import { ref } from 'vue';

const value = ref<SingleValue>(null);
const open = ref(false);

const setToday = () => {
  value.value = dayjs();
};
const clear = () => {
  value.value = null;
};
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <Space wrap>
      <DatePicker v-model:value="value" v-model:open="open" placeholder="受控日期" />
      <span class="demo-hint">open = {{ open }}</span>
    </Space>
    <Space wrap>
      <Button size="small" @click="open = true">打开面板</Button>
      <Button size="small" @click="setToday">设为今天</Button>
      <Button size="small" @click="clear">清空</Button>
    </Space>
  </Flex>
</template>
