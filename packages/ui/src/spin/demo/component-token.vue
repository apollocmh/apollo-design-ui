<script setup lang="ts">
import { ref } from 'vue';
import { Button, ConfigProvider, Input, Space, Spin } from '../../index';

const themed = ref(true);
const busy = ref(true);
const draft = ref('Current native draft');
</script>

<template>
  <Space wrap>
    <Button @click="themed = !themed">切换 Spin 主题</Button>
    <Button @click="busy = !busy">切换加载状态</Button>
  </Space>
  <ConfigProvider :theme="themed ? { components: { Spin: { contentHeight: 96, dotSize: 28, dotSizeSM: 12, dotSizeLG: 44 } } } : undefined">
    <div style="display: flex; align-items: center; gap: 16px; margin-top: 16px">
      <Spin size="small" /><Spin /><Spin size="large" />
    </div>
    <Spin :spinning="busy" description="Updating" style="margin-top: 16px">
      <div style="min-height: 180px; padding: 16px; background: var(--apollo-color-fill-quaternary)">
        <Input v-model:value="draft" aria-label="Spin theme draft" />
      </div>
    </Spin>
  </ConfigProvider>
</template>
