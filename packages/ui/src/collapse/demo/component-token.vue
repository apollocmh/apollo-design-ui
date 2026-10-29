<script setup lang="ts">
import { useTheme } from '@apollo-design/theme';
import type { CollapseItemType } from '@apollo-design/ui';
import { Collapse, ConfigProvider } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const source = useTheme();
const spacious = ref(false);
const theme = computed(() => ({
  components: {
    Collapse: {
      headerPadding: spacious.value ? '20px 24px' : '12px 16px',
      headerPaddingSM: spacious.value ? '14px 18px' : '8px 12px',
      headerPaddingLG: spacious.value ? '24px 28px' : '16px 24px',
      headerBg: source.token.value.colorFillSecondary,
      contentPadding: spacious.value ? '24px' : '16px',
      contentPaddingSM: spacious.value ? '18px' : '12px',
      contentPaddingLG: spacious.value ? '28px' : '24px',
      contentBg: source.token.value.colorBgContainer,
      borderlessContentPadding: spacious.value ? '12px 24px 20px' : '4px 16px 16px',
      borderlessContentBg: source.token.value.colorFillAlter,
    },
  },
}));
const items: CollapseItemType[] = [
  {
    key: '1',
    label: '当前 Provider 的组件 Token',
    children: '切换间距配置会实时更新这十个组件 Token；颜色沿用当前主题。',
  },
  {
    key: '2',
    label: '无边框内容背景',
    children: 'borderlessContentBg 同样由 theme.components.Collapse 消费。',
  },
];
</script>

<template>
  <div>
    <label><input v-model="spacious" type="checkbox" /> 宽松间距</label>
    <ConfigProvider :theme="theme">
      <Collapse :items="items" default-active-key="1" style="margin-block: 16px" />
      <Collapse :items="items" :bordered="false" size="small" default-active-key="2" />
    </ConfigProvider>
  </div>
</template>
