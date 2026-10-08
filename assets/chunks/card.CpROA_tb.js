const t=`<script setup lang="ts">
// 对齐 antd 的 card demo（components/statistic/demo/card.tsx）
// ⚠️ Card 组件尚未落地（registry 中 card 未实现）—— 用等价的 borderless 卡片
//    div 模拟其布局容器（padding + 无边框），差异登记在 README §5。
import { ArrowDownOutlined, ArrowUpOutlined } from '@apollo-design/icons';
import { Col, Row, Statistic } from '@apollo-design/ui';
<\/script>

<template>
  <Row :gutter="16">
    <Col :span="12">
      <div class="demo-statistic-card">
        <Statistic
          title="Active"
          :value="11.28"
          :precision="2"
          :styles="{ content: { color: '#3f8600' } }"
        >
          <template #prefix>
            <ArrowUpOutlined />
          </template>
          <template #suffix>%</template>
        </Statistic>
      </div>
    </Col>
    <Col :span="12">
      <div class="demo-statistic-card">
        <Statistic
          title="Idle"
          :value="9.3"
          :precision="2"
          :styles="{ content: { color: '#cf1322' } }"
        >
          <template #prefix>
            <ArrowDownOutlined />
          </template>
          <template #suffix>%</template>
        </Statistic>
      </div>
    </Col>
  </Row>
</template>

<style scoped>
.demo-statistic-card {
  padding: 24px;
}
</style>
`;export{t as default};
