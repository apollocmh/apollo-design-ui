## zh-CN

自动调整溢出。

## en-US

Auto adjust overflow.

```vue
<script setup lang="ts">
// 对齐 antd 的 demo/auto-adjust-overflow.tsx（滚动容器内对比 autoAdjustOverflow）

import { onMounted, ref } from 'vue';
import { Button, Tooltip } from '@apollo-design/ui';

const block1 = ref<HTMLDivElement | null>(null);
const block2 = ref<HTMLDivElement | null>(null);

onMounted(() => {
  if (block1.value) block1.value.scrollLeft = (block1.value.clientWidth || 0) * 0.5;
  if (block2.value) block2.value.scrollLeft = (block2.value.clientWidth || 0) * 0.5;
});

const blockStyle = {
  overflow: 'auto',
  position: 'relative',
  padding: '24px',
  border: '1px solid #e9e9e9',
};
const innerStyle = {
  width: '200%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  rowGap: '16px',
};
</script>

<template>
  <div style="font-family: sans-serif; display: flex; flex-direction: column; row-gap: 16px">
    <Block :get-popup-container="(trigger) => trigger.parentElement as HTMLElement">
      <template #default="{ autoAdjustOverflow }">
        <Tooltip placement="left" title="Prompt Text" :get-popup-container="(t: HTMLElement) => t.parentElement as HTMLElement">
          <Button>Adjust automatically</Button>
        </Tooltip>
        <Tooltip placement="left" title="Prompt Text" :auto-adjust-overflow="false" :get-popup-container="(t: HTMLElement) => t.parentElement as HTMLElement">
          <Button>Ignore</Button>
        </Tooltip>
      </template>
    </Block>
    <div ref="block1" :style="blockStyle">
      <div :style="innerStyle">
        <Tooltip placement="left" title="Prompt Text" :get-popup-container="(t: HTMLElement) => t.parentElement as HTMLElement">
          <Button>Adjust automatically</Button>
        </Tooltip>
        <Tooltip placement="left" title="Prompt Text" :get-popup-container="(t: HTMLElement) => t.parentElement as HTMLElement">
          <Button>Adjust automatically</Button>
        </Tooltip>
      </div>
    </div>
    <div ref="block2" :style="blockStyle">
      <div :style="innerStyle">
        <Tooltip placement="left" title="Prompt Text">
          <Button>Adjust automatically</Button>
        </Tooltip>
        <Tooltip placement="left" title="Prompt Text">
          <Button>Adjust automatically</Button>
        </Tooltip>
      </div>
    </div>
  </div>
</template>

```
