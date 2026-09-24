## zh-CN

我们添加了多种预设色彩的文字提示样式，用作不同场景使用。

## en-US

We preset a series of colorful Tooltip styles for use in different situations.

```vue
<script setup lang="ts">
// 对齐 antd 的 demo/colorful.tsx

import { Button, Divider, Space, Tooltip } from '@apollo-design/ui';

const colors = [
  'pink',
  'red',
  'yellow',
  'orange',
  'cyan',
  'green',
  'blue',
  'purple',
  'geekblue',
  'magenta',
  'volcano',
  'gold',
  'lime',
];
const customColors = ['#f50', '#2db7f5', '#87d068', '#108ee9'];
</script>

<template>
  <div style="font-family: sans-serif">
    <Divider title-placement="start">Presets</Divider>
    <Space wrap>
      <Tooltip v-for="color in colors" :key="color" title="prompt text" :color="color">
        <Button>{{ color }}</Button>
      </Tooltip>
    </Space>
    <Divider title-placement="start">Custom</Divider>
    <Space wrap>
      <Tooltip v-for="color in customColors" :key="color" title="prompt text" :color="color">
        <Button>{{ color }}</Button>
      </Tooltip>
    </Space>
  </div>
</template>

```
