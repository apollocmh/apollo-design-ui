<script setup lang="ts">
import { ref } from 'vue';
import { ConfigProvider, Spin } from '../../index';

const themed = ref(true);
const busy = ref(true);
const draft = ref('Current native draft');
</script>

<template>
  <button type="button" @click="themed = !themed">切换 Spin 主题</button>
  <button type="button" @click="busy = !busy">切换加载状态</button>
  <ConfigProvider :theme="themed ? { components: { Spin: { contentHeight: 96, dotSize: 28, dotSizeSM: 12, dotSizeLG: 44 } } } : undefined">
    <div style="display: flex; align-items: center; gap: 16px; margin-top: 16px">
      <Spin size="small" /><Spin /><Spin size="large" />
    </div>
    <Spin :spinning="busy" description="Updating" style="margin-top: 16px">
      <div style="min-height: 180px; padding: 16px; background: var(--apollo-color-fill-quaternary)">
        <input v-model="draft" aria-label="Spin theme draft" />
      </div>
    </Spin>
  </ConfigProvider>
</template>
