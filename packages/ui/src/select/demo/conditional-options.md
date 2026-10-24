---
order: 35
title:
  zh-CN: 条件与动态选项
  en-US: Conditional and dynamic options
---

默认插槽可通过 `v-if` 出现/移除，`SelectOption` 支持 `v-for`、分组与动态 label/disabled。已选条目暂时移除时保留标签；重新出现时使用最新内容。无需通过 key 重建组件。

The default option slot supports conditional insertion/removal, loops, groups and reactive labels/disabled state. Selected labels remain cached when options disappear and refresh when they return. No component key or remount is needed.

```vue
<script setup lang="ts">
import { AutoComplete, Button, Flex, Select, SelectOption, SelectOptGroup } from '@apollo-design/ui';
import { ref } from 'vue';

const show = ref(false);
const value = ref<string>('a');
const suggestion = ref<string>();
const choices = ref([
  { value: 'a', label: 'Alpha', disabled: false },
  { value: 'b', label: 'Beta', disabled: false },
]);
const update = () => {
  choices.value = [
    { value: 'a', label: 'Updated Alpha', disabled: false },
    { value: 'b', label: 'Disabled Beta', disabled: true },
    { value: 'c', label: 'Gamma', disabled: false },
  ];
};
</script>

<template>
  <Flex vertical gap="small" align="flex-start">
    <Flex gap="small">
      <Button @click="show = !show">显示/隐藏选项 / Toggle options</Button>
      <Button :disabled="!show" @click="update">更新选项 / Update options</Button>
    </Flex>
    <label for="conditional-select">选择 / Select</label>
    <Select id="conditional-select" v-model:value="value" show-search option-filter-prop="children" style="width: 240px">
      <template v-if="show" #default>
        <SelectOptGroup label="Group">
          <SelectOption v-for="choice in choices" :key="choice.value" :value="choice.value" :disabled="choice.disabled">{{ choice.label }}</SelectOption>
        </SelectOptGroup>
      </template>
    </Select>
    <output aria-live="polite">{{ value }}</output>
    <label for="conditional-autocomplete">自动补全 / AutoComplete</label>
    <AutoComplete id="conditional-autocomplete" v-model:value="suggestion" style="width: 240px">
      <template v-if="show" #default>
        <SelectOptGroup label="Group">
          <SelectOption v-for="choice in choices" :key="choice.value" :value="choice.value" :disabled="choice.disabled">{{ choice.label }}</SelectOption>
        </SelectOptGroup>
      </template>
    </AutoComplete>
  </Flex>
</template>
```
