---
order: 111
preview:
  mode: viewport
  viewportHeight: 320
  scrollable: true
---
## zh-CN

超出滚动容器时自动移入视口（shift）。示例在独立视口内滚动，不会带动外层文档。

## en-US

Shift into viewport when overflowing the scroll container. The demo scrolls within its own viewport without moving the surrounding document.

```vue
<script setup lang="ts">
// 对齐 antd 的 demo/shift.tsx

import { onMounted } from 'vue';
import { Button, Tooltip } from '@apollo-design/ui';

onMounted(() => {
  window.scrollTo({
    top: document.documentElement.clientHeight,
    left: document.documentElement.clientWidth,
    behavior: 'instant',
  });
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
