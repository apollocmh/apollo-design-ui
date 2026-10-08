const t=`<script setup lang="ts">
// 对齐 antd demo/indicator.tsx：#indicators scoped slot
import { Button, Divider, Space, Tour } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);

const ref1 = ref<{ nativeElement: HTMLButtonElement | HTMLAnchorElement | null } | null>(null);
const ref2 = ref<{ nativeElement: HTMLButtonElement | HTMLAnchorElement | null } | null>(null);
const ref3 = ref<{ nativeElement: HTMLButtonElement | HTMLAnchorElement | null } | null>(null);

const target1 = () => (ref1.value?.nativeElement as HTMLElement) ?? null;
const target2 = () => (ref2.value?.nativeElement as HTMLElement) ?? null;
const target3 = () => (ref3.value?.nativeElement as HTMLElement) ?? null;

const steps = [
  { title: 'Upload File', description: 'Put your files here.', target: target1 },
  { title: 'Save', description: 'Save your changes.', target: target2 },
  { title: 'Other Actions', description: 'Click to see other actions.', target: target3 },
];
<\/script>

<template>
  <Button type="primary" @click="open = true">Begin Tour</Button>
  <Divider />
  <Space>
    <Button ref="ref1">Upload</Button>
    <Button ref="ref2" type="primary">Save</Button>
    <Button ref="ref3">...</Button>
  </Space>
  <Tour :open="open" :steps="steps" @close="open = false">
    <template #indicators="{ current, total }">
      <span>{{ current + 1 }} / {{ total }}</span>
    </template>
  </Tour>
</template>
`;export{t as default};
