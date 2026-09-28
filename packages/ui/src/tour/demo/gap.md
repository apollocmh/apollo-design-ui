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

> ⚠️ 本仓 demo 用原生 `input[type=range]` 替换 antd 的 `Slider`（未落地，README §2 登记）。

```vue
<script setup lang="ts">
import { Button, Col, Row, Space, Tour, Typography } from '@apollo-design/ui';
import { ref } from 'vue';

const { Text } = Typography;

const tourNode = ref<HTMLElement | null>(null);
const radius = ref(8);
const offsetX = ref(2);
const offsetY = ref(2);
const offset = ref(2);
const open = ref(false);
const offsetDirection = ref<'both' | 'individual'>('individual');

const steps = [{ title: 'Upload File', description: 'Put your files here.', target: () => tourNode.value }];
</script>

<template>
  <div ref="tourNode">
    <Button type="primary" @click="open = true">Begin Tour</Button>
    <Space style="display: flex; margin-top: 12px" direction="vertical">
      <Row>
        <Col :span="6"><Text>Radius:</Text></Col>
        <Col :span="12"><input v-model.number="radius" type="range" min="0" max="50" /></Col>
      </Row>
      <Row>
        <Col :span="6"><Text>offset:</Text></Col>
        <Col :span="12">
          <input v-model.number="offset" type="range" min="0" max="50" @focus="offsetDirection = 'both'" />
        </Col>
      </Row>
      <Row>
        <Col :span="6"><Text>Horizontal offset:</Text></Col>
        <Col :span="12">
          <input v-model.number="offsetX" type="range" min="0" max="50" @focus="offsetDirection = 'individual'" />
        </Col>
      </Row>
      <Row>
        <Col :span="6"><Text>Vertical offset:</Text></Col>
        <Col :span="12">
          <input v-model.number="offsetY" type="range" min="0" max="50" @focus="offsetDirection = 'individual'" />
        </Col>
      </Row>
    </Space>
    <Tour
      :open="open"
      :steps="steps"
      :gap="offsetDirection === 'both' ? { offset, radius } : { offset: [offsetX, offsetY], radius }"
      @close="open = false"
    />
  </div>
</template>
```
