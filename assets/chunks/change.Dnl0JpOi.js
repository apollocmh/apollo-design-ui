const n=`<script setup lang="ts">
// 对齐 antd 的 change demo（Button/Icon 用原生 button 等价替换）

import { Badge, Button } from '@apollo-design/ui';
import { ref } from 'vue';

const count = ref(5);
<\/script>

<template>
  <div>
    <Badge :count="count">
      <div style="width: 40px; height: 40px; background: #f0f0f0; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center" />
    </Badge>
    <Button :disabled="count === 0" @click="count = Math.max(count - 1, 0)">-</Button>
    <Button @click="count = count + 1">+</Button>
  </div>
</template>
`;export{n as default};
