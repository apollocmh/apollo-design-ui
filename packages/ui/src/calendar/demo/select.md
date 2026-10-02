---
order: 5
title:
  zh-CN: 选择日期
  en-US: Select
---

受控用法：`@select` 记录选中日期，`@panel-change` 记录面板浏览值。

```vue
<script setup lang="ts">
// 对齐 antd 的 select demo：受控 `value` + `onSelect` / `onPanelChange`。
//
// ⚠️ 本仓把回调放在 **emits** 里（`@select` / `@panel-change`），`value` 走
//    `v-model:value` 的通道（C11：`update:value` 与 `change` 双发）。

import type { CalendarDate } from '@apollo-design/ui';
import { Alert, Calendar } from '@apollo-design/ui';
import dayjs from 'dayjs';
import { computed, ref } from 'vue';

const value = ref<CalendarDate>(dayjs('2017-01-25'));
const selectedValue = ref<CalendarDate>(dayjs('2017-01-25'));

const onSelect = (newValue: CalendarDate) => {
  value.value = newValue;
  selectedValue.value = newValue;
};

const onPanelChange = (newValue: CalendarDate) => {
  value.value = newValue;
};

const title = computed(() => `You selected date: ${selectedValue.value?.format('YYYY-MM-DD')}`);
</script>

<template>
  <Alert :title="title" />
  <Calendar v-model:value="value" @select="onSelect" @panel-change="onPanelChange" />
</template>
```
