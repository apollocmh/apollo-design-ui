<script setup lang="ts">
import { compactAlgorithm, darkAlgorithm, useTheme } from '@apollo-design/theme';
import type { ConfigProviderThemeConfig } from '@apollo-design/ui';
import { computed, defineComponent, Fragment, h, ref } from 'vue';
import { Button, ConfigProvider, Input, Select, Space } from '../../index';

const mode = ref<'default' | 'dark' | 'compact' | 'both'>('default');
const modes = [
  { value: 'default', label: '继承外层算法' },
  { value: 'dark', label: '暗色' },
  { value: 'compact', label: '紧凑' },
  { value: 'both', label: '暗色 + 紧凑' },
];
function changeMode(value: unknown) {
  if (value === 'default' || value === 'dark' || value === 'compact' || value === 'both')
    mode.value = value;
}
const theme = computed<ConfigProviderThemeConfig>(() => ({
  token: { colorPrimary: '#006d75' },
  ...(mode.value === 'default'
    ? {}
    : {
        algorithm:
          mode.value === 'dark'
            ? darkAlgorithm
            : mode.value === 'compact'
              ? compactAlgorithm
              : [darkAlgorithm, compactAlgorithm],
      }),
}));
const RuntimeFont = defineComponent({
  setup() {
    const context = useTheme();
    function increase() {
      context.config.value = {
        ...context.config.value,
        token: {
          ...context.config.value.token,
          fontSize: Math.min(24, context.token.value.fontSize + 1),
        },
      };
    }
    return () =>
      h(Fragment, [
        h(Button, { onClick: increase }, () => '运行时字体 +1'),
        h(
          'output',
          { style: { marginInlineStart: '8px' } },
          `fontSize: ${context.token.value.fontSize}`,
        ),
      ]);
  },
});
</script>

<template>
  <div>
    <Space style="margin-bottom: 16px">
      <span>theme.algorithm</span>
      <Select :value="mode" :options="modes" aria-label="主题算法" style="width: 200px" @change="changeMode" />
    </Space>
    <ConfigProvider scope-tag="section" :theme="theme" class="theme-demo-scope" style="display: block">
      <Space wrap>
        <div class="theme-demo-color" aria-label="当前主题主色" role="img" />
        <Input aria-label="主题切换时保留的草稿" placeholder="算法切换保留草稿" style="width: 220px" />
        <RuntimeFont />
      </Space>
    </ConfigProvider>
  </div>
</template>

<style scoped>
.theme-demo-scope {
  display: block;
  padding: 16px;
  border: 1px solid var(--apollo-color-border);
  border-radius: var(--apollo-border-radius-lg);
  background: var(--apollo-color-bg-container);
  color: var(--apollo-color-text);
}
.theme-demo-color {
  width: 40px;
  height: 40px;
  border-radius: var(--apollo-border-radius);
  background: var(--apollo-color-primary);
}
</style>
