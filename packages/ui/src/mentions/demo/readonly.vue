<script setup lang="ts">
// 对齐 antd demo/readonly.tsx
import { Mentions } from '@apollo-design/ui';

const options = ['afc163', 'zombiej', 'yesmeck'].map((value) => ({
  value,
  key: value,
  label: value,
}));
</script>

<template>
  <div>
    <div style="margin-bottom: 10px">
      <Mentions style="width: 100%" placeholder="this is disabled Mentions" disabled :options="options" />
    </div>
    <Mentions style="width: 100%" placeholder="this is readOnly Mentions" read-only :options="options" />
  </div>
</template>
