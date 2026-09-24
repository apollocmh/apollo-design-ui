<script setup lang="ts">
// 对齐 antd demo/shift.tsx（滚动容器：窗口滚动后浮层跟随）

import { Button, Popover } from '@apollo-design/ui';
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
</script>

<template>
  <div :style="style">
    <Popover title="Title" content="Thanks for using apollo. Have a nice day !" open>
      <Button type="primary">Scroll The Window</Button>
    </Popover>
  </div>
</template>
