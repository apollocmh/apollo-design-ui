<script setup lang="ts">
// 两种轻量卡片布局，突出统计数值与方向。
import { ArrowDownOutlined, ArrowUpOutlined } from '@apollo-design/icons';
import { Col, Row, Statistic } from '@apollo-design/ui';
</script>

<template>
  <Row :gutter="16">
    <Col :span="12">
      <div class="demo-statistic-card">
        <Statistic
          title="Active"
          :value="11.28"
          :precision="2"
          :styles="{ content: { color: '#3f8600', fontWeight: 700 } }"
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
          :styles="{ content: { color: '#cf1322', fontWeight: 700 } }"
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
