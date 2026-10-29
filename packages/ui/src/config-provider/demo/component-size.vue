<script setup lang="ts">
import type { SizeType } from '@apollo-design/ui';
import { Button, ConfigProvider, Input, Select, Space, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

const componentSize = ref<SizeType>('middle');

const sizeOptions: { value: SizeType; label: string }[] = [
  { value: 'small', label: 'small' },
  { value: 'middle', label: 'middle' },
  { value: 'large', label: 'large' },
];

function onSizeChange(value: unknown): void {
  if (value === 'small' || value === 'medium' || value === 'middle' || value === 'large') {
    componentSize.value = value;
  }
}
</script>

<template>
  <div>
    <Space :size="12" style="margin-bottom: 16px">
      <span>componentSize</span>
      <Select
        aria-label="组件尺寸"
        :value="componentSize"
        :options="sizeOptions"
        style="width: 160px"
        @change="onSizeChange"
      />
      <Tag color="blue">{{ componentSize }}</Tag>
    </Space>

    <ConfigProvider :component-size="componentSize">
      <div class="component-size-demo-panel">
        <Space>
          <Input aria-label="组件尺寸输入框" placeholder="组件尺寸跟随配置" style="width: 220px" />
          <Button>操作按钮</Button>
          <Button>次要按钮</Button>
        </Space>
        <p class="component-size-demo-hint">
          未显式声明 size 的 Input 与 Button 会从 ConfigProvider 的 componentSize 继承尺寸。
        </p>
      </div>
    </ConfigProvider>
  </div>
</template>

<style scoped>
.component-size-demo-panel {
  padding: 16px;
  border: 1px solid var(--apollo-color-border);
  border-radius: var(--apollo-border-radius-lg);
  background: var(--apollo-color-fill-quaternary);
}

.component-size-demo-hint {
  margin: 12px 0 0;
  color: var(--apollo-color-text-secondary);
}
</style>
