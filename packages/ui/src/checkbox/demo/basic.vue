<script setup lang="ts">
// 对齐 antd 的 basic demo（antd 在 onChange 里 console.log ⇒ 我们改为展示状态）
import { Checkbox } from '@apollo-design/ui';
import { ref } from 'vue';

const checked = ref(false);
const onChange = (_event: Event, next: boolean) => {
  checked.value = next;
};
</script>

<template>
  <div>
    <Checkbox @change="onChange">Checkbox</Checkbox>
    <p>checked = {{ checked }}</p>
  </div>
</template>
