const t=`<script setup lang="ts">
// 对齐 antd 的 banner demo
import { Alert } from '@apollo-design/ui';
<\/script>

<template>
  <div>
    <Alert title="Warning text" banner />
    <br />
    <Alert
      title="Very long warning text warning text text text text text text text"
      banner
      closable
    />
    <br />
    <Alert :show-icon="false" title="Warning text without icon" banner />
    <br />
    <Alert type="error" title="Error text" banner />
  </div>
</template>
`;export{t as default};
