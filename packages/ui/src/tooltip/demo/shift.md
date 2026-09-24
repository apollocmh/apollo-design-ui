## zh-CN

超出滚动容器时自动移入视口（shift）。

## en-US

Shift into viewport when overflowing the scroll container.

```vue
<script setup lang="ts">
// 对齐 antd 的 demo/shift.tsx

import { onMounted } from 'vue';
import { Button, Tooltip } from '@apollo-design/ui';

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
    <Tooltip title="Thanks for using antd. Have a nice day !" open>
      <Button type="primary">Scroll The Window</Button>
    </Tooltip>
  </div>
</template>

```
