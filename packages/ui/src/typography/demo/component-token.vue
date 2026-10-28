<script setup lang="ts">
import type { ThemeConfig } from '@apollo-design/theme';
import { ConfigProvider, Paragraph, Text, Title } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const phase = ref(0);
const theme = computed<ThemeConfig | undefined>(() =>
  phase.value === 0
    ? undefined
    : {
        components: {
          Typography:
            phase.value === 1
              ? { titleMarginTop: '2em', titleMarginBottom: '0.8em' }
              : { titleMarginTop: 0, titleMarginBottom: 0 },
        },
      },
);
const headingAliases = {
  '--apollo-font-size-heading-2': '30px',
  '--apollo-font-weight-strong': '700',
};
</script>
<template>
  <section class="demo-typography-token">
    <p><button type="button" @mousedown.prevent @click="phase = (phase + 1) % 3">Cycle title spacing</button> {{ ['Default', 'Custom', 'Zero'][phase] }}</p>
    <ConfigProvider :theme="theme">
      <Title :level="2" :style="headingAliases">组件 Token 标题</Title>
      <Paragraph>正文颜色来自 --apollo-color-text，标题颜色来自 --apollo-color-text-heading。</Paragraph>
      <Title :level="2" data-spacing-title>段落之后的标题间距</Title>
      <Paragraph><Text type="secondary">次要文本使用 --apollo-color-text-secondary。</Text></Paragraph>
    </ConfigProvider>
    <p class="demo-typography-token__hint">切换两个已有组件 Token 的默认、自定义和零值；标题原生变量另示例字号与字重。</p>
  </section>
</template>
<style>
.demo-typography-token__hint { margin: 12px 0 0; color: var(--apollo-color-text); font-size: 12px; }
</style>
