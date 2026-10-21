<script setup lang="ts">
import type { DirectionType } from '@apollo-design/ui';
import { Button, ConfigProvider, Input, Select, Space, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

const direction = ref<DirectionType>('ltr');

const directionOptions = [
  { value: 'ltr', label: 'LTR（从左到右）' },
  { value: 'rtl', label: 'RTL（从右到左）' },
];

function onDirectionChange(value: unknown): void {
  direction.value = value as DirectionType;
}
</script>

<template>
  <div>
    <Space :size="12" style="margin-bottom: 16px">
      <span>direction</span>
      <Select
        aria-label="文字方向"
        :value="direction"
        :options="directionOptions"
        style="width: 200px"
        @change="onDirectionChange"
      />
      <Tag color="blue">{{ direction }}</Tag>
    </Space>

    <ConfigProvider :direction="direction">
      <div class="direction-demo-panel">
        <Space>
          <Input aria-label="姓名" placeholder="请输入姓名" style="width: 180px" />
          <Button type="primary">提交</Button>
          <Button>取消</Button>
        </Space>
        <p class="direction-demo-hint">
          子树内的输入框、按钮与间距都由 ConfigProvider 的 direction 属性控制排列方向。
        </p>
      </div>
    </ConfigProvider>
  </div>
</template>

<style scoped>
.direction-demo-panel {
  padding: 16px;
  border: 1px solid var(--apollo-color-border);
  border-radius: var(--apollo-border-radius-lg);
  background: var(--apollo-color-fill-quaternary);
}

.direction-demo-hint {
  margin: 12px 0 0;
  color: var(--apollo-color-text-secondary);
}
</style>
