<script setup lang="ts">
import { darkAlgorithm } from '@apollo-design/theme';
import { Button, ConfigProvider, Modal, Slider, Space, Switch, Timeline } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const disabled = ref(false);
const value = ref(30);
const items = [
  { content: 'Create a service' },
  { content: 'Configure the deployment' },
  { content: 'Complete the operation' },
];
</script>

<template>
  <ConfigProvider :theme="{ algorithm: darkAlgorithm }">
    <Button type="primary" @click="open = true">Open dark modal</Button>
    <Modal title="Dark Modal" :open="open" @ok="open = false" @cancel="open = false">
      <Space wrap style="margin-bottom: 40px">
        <span>Disable slider</span>
        <Switch v-model:checked="disabled" aria-label="Disable dark modal slider" />
      </Space>
      <Slider v-model:value="value" :disabled="disabled" aria-label-for-handle="Dark modal value" />
      <Timeline :items="items" style="margin-top: 24px" />
    </Modal>
  </ConfigProvider>
</template>
