<script setup lang="ts">
// 对齐 antd 的 info demo（默认 status = info）

import { Button, Result } from '@apollo-design/ui';
import { h } from 'vue';

// antd 的 extra 是 **prop**（ReactNode），不是插槽（规则 C19 只把 children 映射为插槽）
const extraNode = () => h(Button, { type: 'primary' }, () => 'Go Console');
</script>

<template>
  <Result title="Your operation has been executed" :extra="extraNode()" />
</template>
