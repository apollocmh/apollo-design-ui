const n=`<script setup lang="ts">
// 形态变体与校验状态
import { Input } from '@apollo-design/ui';
<\/script>

<template>
  <div style="font-family: sans-serif; display: flex; flex-direction: column; gap: 8px; width: 240px">
    <Input placeholder="filled" variant="filled" />
    <Input placeholder="borderless" variant="borderless" />
    <Input placeholder="underlined" variant="underlined" />
    <Input placeholder="error" status="error" />
    <Input placeholder="warning" status="warning" />
  </div>
</template>
`;export{n as default};
