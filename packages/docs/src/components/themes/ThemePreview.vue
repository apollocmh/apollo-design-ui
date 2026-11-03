<script setup lang="ts">
import type { ThemePreset } from '@apollo-design/theme';
import {
  Alert,
  Button,
  ConfigProvider,
  Input,
  Progress,
  Space,
  Switch,
  Tag,
} from '@apollo-design/ui';
import { ref } from 'vue';
import { useSiteLocale } from '../../composables/locale';

defineProps<{ preset: ThemePreset; appearance: 'light' | 'dark'; label: string }>();
const { locale } = useSiteLocale();
const name = ref('Apollo Design');
const enabled = ref(true);
const progress = ref(64);
</script>

<template>
  <ConfigProvider :theme="{ inherit: false, preset, mode: appearance }">
    <section class="theme-preview" :data-preview-preset="preset.name" :data-preview-appearance="appearance">
      <header class="theme-preview-header">
        <h3>{{ label }}</h3>
        <Tag>{{ appearance === 'light' ? (locale === 'zh-CN' ? '亮色' : 'Light') : (locale === 'zh-CN' ? '暗色' : 'Dark') }}</Tag>
      </header>
      <p>{{ locale === 'zh-CN' ? '在同一组组件中比较色彩、圆角和状态。' : 'Compare color, shape and state with the same components.' }}</p>
      <Input v-model:value="name" :aria-label="`${label} ${appearance} ${locale === 'zh-CN' ? '名称' : 'name'}`" />
      <div class="theme-preview-toggle">
        <span>{{ locale === 'zh-CN' ? '接收通知' : 'Notifications' }}</span>
        <Switch v-model:checked="enabled" :aria-label="`${label} ${appearance} ${locale === 'zh-CN' ? '接收通知' : 'notifications'}`" />
      </div>
      <Alert :message="locale === 'zh-CN' ? '所有预览均为可交互的真实组件。' : 'Every preview uses interactive components.'" type="info" show-icon />
      <Progress :percent="progress" />
      <Space wrap>
        <Button type="primary" @click="progress = progress >= 100 ? 0 : Math.min(progress + 12, 100)">{{ locale === 'zh-CN' ? '继续' : 'Continue' }}</Button>
        <Button @click="progress = 64">{{ locale === 'zh-CN' ? '重置' : 'Reset' }}</Button>
        <Button disabled>{{ locale === 'zh-CN' ? '已禁用' : 'Disabled' }}</Button>
      </Space>
    </section>
  </ConfigProvider>
</template>

<style scoped>
.theme-preview {
  height: 100%;
  padding: 20px;
  border: 1px solid var(--apollo-color-border-secondary);
  border-radius: var(--apollo-border-radius-lg);
  background: var(--apollo-color-bg-container);
  color: var(--apollo-color-text);
  font-family: var(--apollo-font-family);
  font-size: var(--apollo-font-size);
}
.theme-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.theme-preview h3 { margin: 0; font-size: var(--apollo-font-size-lg); }
.theme-preview p { color: var(--apollo-color-text-secondary); margin: 12px 0 16px; }
.theme-preview-toggle { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin: 16px 0; }
.theme-preview :deep(.apollo-progress) { margin: 16px 0; }
</style>
