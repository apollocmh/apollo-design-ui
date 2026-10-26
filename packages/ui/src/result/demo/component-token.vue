<script setup lang="ts">
import { Button, ConfigProvider, Result } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const enabled = ref(true),
  native = ref(false);
const draft = ref('Result token draft');
const theme = computed(() =>
  enabled.value
    ? {
        components: {
          Result: {
            titleFontSize: 32,
            subtitleFontSize: 18,
            iconFontSize: 96,
            extraMargin: '16px 0 0 0',
          },
        },
      }
    : undefined,
);
</script>
<template>
  <div style="display:flex;gap:12px;flex-wrap:wrap">
    <Button aria-label="Toggle Result theme" @click="enabled = !enabled">{{ enabled ? '移除局部主题' : '恢复局部主题' }}</Button>
    <Button aria-label="Toggle Result native font" @click="native = !native">{{ native ? '移除原生字号' : '原生字号优先' }}</Button>
  </div>
  <ConfigProvider :theme="theme">
    <Result class="demo-result-token" status="success" title="操作成功" sub-title="标题、副标题、图标字号与操作区间距均由 Component Token 控制。" :style="native ? { '--apollo-result-title-font-size': '36px' } : undefined">
      <template #extra><Button type="primary">查看详情</Button></template>
      <label>备注 <input v-model="draft" aria-label="Result token draft" /></label><strong>保留原生内容</strong>
    </Result>
  </ConfigProvider>
</template>
