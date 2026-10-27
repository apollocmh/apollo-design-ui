<script setup lang="ts">
// iconPlacement：图标在文字之前或之后
import { SearchOutlined } from '@apollo-design/icons';
import { Button, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const last = ref('');
</script>

<template>
  <div style="font-family: sans-serif">
    <Space wrap>
      <Button
        type="primary"
        :icon="SearchOutlined"
        icon-placement="start"
        @click="last = 'start'"
      >
        搜索
      </Button>
      <Button type="primary" :icon="SearchOutlined" icon-placement="end" @click="last = 'end'">搜索</Button>
      <Button :icon="SearchOutlined" icon-placement="end" @click="last = 'default-end'">设置</Button>
      <Button
        type="primary"
        :icon="SearchOutlined"
        shape="circle"
        aria-label="搜索"
        @click="last = 'circle'"
      />
    </Space>
    <div style="margin-top: 12px; font-size: 12px; color: var(--apollo-color-text-secondary)">
      最近点击的图标位置：{{ last || '-' }}
    </div>
  </div>
</template>
