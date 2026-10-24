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
