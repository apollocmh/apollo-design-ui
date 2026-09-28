<script setup lang="ts">
// 对齐 antd demo/gap.tsx
// ⚠️ 替换登记（demo-replacement 约定，README §2 同步）：antd 用 Slider（未落地），
//    本 demo 用原生 input[type=range] 等价替换；Row/Col/Typography 已落地，照用。
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

const steps = [
  {
    title: 'Upload File',
    description: 'Put your files here.',
    target: () => tourNode.value as HTMLElement, // 挂载后恒存在
  },
];
</script>

<template>
  <div ref="tourNode">
    <Button type="primary" @click="open = true">Begin Tour</Button>
    <Space style="display: flex; margin-top: 12px" orientation="vertical">
      <Row>
        <Col :span="6"><Text>Radius:</Text></Col>
        <Col :span="12">
          <input
            v-model.number="radius"
            type="range"
            min="0"
            max="50"
            aria-label="Radius"
          />
        </Col>
      </Row>
      <Row>
        <Col :span="6"><Text>offset:</Text></Col>
        <Col :span="12">
          <input
            v-model.number="offset"
            type="range"
            min="0"
            max="50"
            aria-label="Offset"
            @focus="offsetDirection = 'both'"
          />
        </Col>
      </Row>
      <Row>
        <Col :span="6"><Text>Horizontal offset:</Text></Col>
        <Col :span="12">
          <input
            v-model.number="offsetX"
            type="range"
            min="0"
            max="50"
            aria-label="Horizontal offset"
            @focus="offsetDirection = 'individual'"
          />
        </Col>
      </Row>
      <Row>
        <Col :span="6"><Text>Vertical offset:</Text></Col>
        <Col :span="12">
          <input
            v-model.number="offsetY"
            type="range"
            min="0"
            max="50"
            aria-label="Vertical offset"
            @focus="offsetDirection = 'individual'"
          />
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
