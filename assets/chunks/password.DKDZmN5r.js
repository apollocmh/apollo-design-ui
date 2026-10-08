const n=`<script setup lang="ts">
// 对齐 antd 的 demo/password.tsx

import { InputPassword } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('');
<\/script>

<template>
  <div style="font-family: sans-serif; width: 240px">
    <InputPassword v-model:value="value" placeholder="input password" />
  </div>
</template>
`;export{n as default};
