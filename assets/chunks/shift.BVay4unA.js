const n=`<script setup lang="ts">
// 对齐 antd 的 demo/shift.tsx

import { Button, Tooltip } from '@apollo-design/ui';
import { onMounted } from 'vue';

onMounted(() => {
  document.documentElement.scrollTop = document.documentElement.clientHeight;
  document.documentElement.scrollLeft = document.documentElement.clientWidth;
});

const style = {
  width: '300vw',
  height: '300vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
<\/script>

<template>
  <div :style="style">
    <Tooltip title="Thanks for using antd. Have a nice day !" open>
      <Button type="primary">Scroll The Window</Button>
    </Tooltip>
  </div>
</template>
`;export{n as default};
