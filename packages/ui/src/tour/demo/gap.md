---
order: 6
title:
  zh-CN: 高亮边距
  en-US: Custom highlight area
---

## zh-CN

使用 `gap` 参数来控制高亮区域的边距和圆角。

- 支持 `gap.offset` 传数组类型，单独设置两个方向上的边距。

## en-US

Using `gap` to control the radius of highlight area and the offset between highlight area and the element.

- Setting offset in two directions individually and `offset` with array type is supported.

```vue
<script setup lang="ts">
// 对齐 antd demo/gap.tsx
import { Button, Col, Row, Slider, Space, Tour, Typography } from '@apollo-design/ui';
import { ref } from 'vue';

const { Text } = Typography;

const tourNode = ref<HTMLElement | null>(null);
const radius = ref(8);
const offsetX = ref(2);
const offsetY = ref(2);
const offset = ref(2);
const open = ref(false);
const offsetDirection = ref<'both' | 'individual'>('individual');

const steps = [
  {
    title: 'Upload File',
    description: 'Put your files here.',
    target: () => tourNode.value,
  },
];
</script>

<template>
  <div ref="tourNode">
    <Button type="primary" @click="open = true">Begin Tour</Button>
    <Space style="display: flex; margin-top: 12px" orientation="vertical">
      <Row :gutter="[8, 8]" align="middle">
        <Col :xs="24" :sm="8"><Text>Radius:</Text></Col>
        <Col :xs="24" :sm="16">
          <Slider v-model:value="radius" :min="0" :max="50" aria-label-for-handle="Radius" />
        </Col>
      </Row>
      <Row :gutter="[8, 8]" align="middle">
        <Col :xs="24" :sm="8"><Text>offset:</Text></Col>
        <Col :xs="24" :sm="16">
          <Slider v-model:value="offset" :min="0" :max="50" aria-label-for-handle="Offset" @focusin="offsetDirection = 'both'" @change="offsetDirection = 'both'" />
        </Col>
      </Row>
      <Row :gutter="[8, 8]" align="middle">
        <Col :xs="24" :sm="8"><Text>Horizontal offset:</Text></Col>
        <Col :xs="24" :sm="16">
          <Slider v-model:value="offsetX" :min="0" :max="50" aria-label-for-handle="Horizontal offset" @focusin="offsetDirection = 'individual'" @change="offsetDirection = 'individual'" />
        </Col>
      </Row>
      <Row :gutter="[8, 8]" align="middle">
        <Col :xs="24" :sm="8"><Text>Vertical offset:</Text></Col>
        <Col :xs="24" :sm="16">
          <Slider v-model:value="offsetY" :min="0" :max="50" aria-label-for-handle="Vertical offset" @focusin="offsetDirection = 'individual'" @change="offsetDirection = 'individual'" />
        </Col>
      </Row>
    </Space>
    <Tour
      :open="open"
      :steps="steps"
      :gap="
        offsetDirection === 'both'
          ? { offset, radius }
          : { offset: [offsetX, offsetY], radius }
      "
      @close="open = false"
    />
  </div>
</template>
```
