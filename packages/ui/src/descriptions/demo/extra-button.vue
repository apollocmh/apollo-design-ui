<script setup lang="ts">
// 对齐 antd 的 extra demo：title / extra 插槽承载富内容
import { Button, Descriptions, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const count = ref(0);

const items = [
  { key: '1', label: '产品', children: '云数据库' },
  { key: '2', label: '计费方式', children: '预付费' },
  { key: '3', label: '到期时间', children: '2026-12-31' },
  { key: '4', label: '状态', children: '运行中' },
];

const onEdit = () => {
  count.value += 1;
};
</script>

<template>
  <Descriptions :items="items">
    <template #title>
      <Space size="small">
        <span>订单详情</span>
        <span style="color: #999">#20261021</span>
      </Space>
    </template>
    <template #extra>
      <Button type="primary" size="small" @click="onEdit">编辑（{{ count }}）</Button>
    </template>
  </Descriptions>
  <p>点击「编辑」累计次数：{{ count }}</p>
</template>
