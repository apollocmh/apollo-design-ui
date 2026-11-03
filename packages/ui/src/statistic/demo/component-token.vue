<script setup lang="ts">
import {
  Button,
  Checkbox,
  ConfigProvider,
  Input,
  Slider,
  Space,
  Statistic,
} from '@apollo-design/ui';
import { computed, ref } from 'vue';

const contentFontSize = ref(36),
  source = ref(true),
  native = ref(false),
  draft = ref('Current theme');
const theme = computed(() =>
  source.value
    ? { components: { Statistic: { titleFontSize: 16, contentFontSize: contentFontSize.value } } }
    : undefined,
);
const tokenStyle = computed(() =>
  native.value
    ? {
        '--apollo-statistic-title-font-size': '19px',
        '--apollo-statistic-content-font-size': '48px',
      }
    : undefined,
);
</script>

<template>
  <div>
    <Space wrap style="margin-bottom: 16px">
      <Button @click="source = !source">Toggle Statistic theme</Button>
    <Checkbox v-model:checked="native" aria-label="Native Statistic token override">Native override</Checkbox>
    </Space>
    <ConfigProvider :theme="theme">
      <Statistic title="Active Users" :value="112893" :style="tokenStyle">
        <template #value="{ text }">
          <span data-token-value>{{ text }}</span>
          <Input v-model:value="draft" aria-label="Statistic token draft" style="display:block;width:160px;max-width:100%;font-size:14px" />
        </template>
      </Statistic>
    </ConfigProvider>
    <div style="max-width:320px;margin-top:24px">
      <span style="color:var(--apollo-color-text-secondary)">数值字号：{{ contentFontSize }}px</span>
      <Slider v-model:value="contentFontSize" :min="20" :max="64" aria-label-for-handle="Statistic content font size" />
    </div>
  </div>
</template>
