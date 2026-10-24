---
order: 14
title:
  zh-CN: 内容插槽优先级
  en-US: Content slot precedence
---

同名 slot 存在时优先于内容 prop，明确空内容不会回退。移除条件 slot 后恢复 prop。Alert 的 title/description 与 CollapsePanel 的 header 使用同一规则；切换标题不会重建面板中的输入状态。

A present slot overrides its content prop, including intentionally empty content. Removing a conditional slot restores the prop. Alert title/description and CollapsePanel header follow the same rule; header changes preserve panel input state.

```vue
<script setup lang="ts">
import { Alert, Button, Collapse, CollapsePanel, Flex } from '@apollo-design/ui';
import { ref } from 'vue';

const show = ref(true);
const empty = ref(false);
const label = ref('Template content');
</script>

<template>
  <Flex vertical gap="small">
    <Flex gap="small">
      <Button @click="show = !show">切换插槽 / Toggle slots</Button>
      <Button @click="empty = !empty">切换空内容 / Toggle empty</Button>
      <Button @click="label = 'Updated content'">更新内容 / Update content</Button>
    </Flex>
    <Alert title="Prop title" description="Prop description">
      <template v-if="show" #title><strong v-if="!empty">{{ label }}</strong></template>
      <template v-if="show" #description><span v-if="!empty">{{ label }}</span></template>
    </Alert>
    <Collapse :default-active-key="['one']">
      <CollapsePanel key="one" header="Prop header">
        <template v-if="show" #header><strong v-if="!empty">{{ label }}</strong></template>
        <label>Panel state <input aria-label="Panel state" /></label>
      </CollapsePanel>
    </Collapse>
  </Flex>
</template>
```
