<script setup lang="ts">
// 对齐 antd 的 render-panel demo：popupRender 包装整个级联面板
import { Button, Cascader, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';
import type { CascaderOutputValue } from '../interface';

const value = ref<CascaderOutputValue>([]);

const options = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      { value: 'hangzhou', label: '杭州' },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [{ value: 'nanjing', label: '南京' }],
  },
];

const labels: Record<string, string> = {
  zhejiang: '浙江',
  hangzhou: '杭州',
  ningbo: '宁波',
  jiangsu: '江苏',
  nanjing: '南京',
};

const display = computed(() =>
  value.value.length
    ? value.value.map((item) => labels[String(item)] ?? item).join(' / ')
    : '尚未选择',
);
</script>

<template>
  <div>
    <Cascader
      v-model:value="value"
      :options="options"
      placeholder="打开面板查看自定义包装层"
    >
      <template #popupRender="{ menu }">
        <div class="cascader-render-panel">
          <div class="cascader-render-panel-header">
            <strong>区域选择面板</strong><span>popupRender 自定义包装层</span>
          </div>
          <component :is="menu" />
          <div class="cascader-render-panel-footer">
            <span>当前：{{ display }}</span>
            <Button size="small" type="link" :disabled="!value.length" @click="value = []">清空选择</Button>
          </div>
        </div>
      </template>
    </Cascader>

    <div style="margin-top: 16px">
      <Tag color="blue">当前选择</Tag>
      <span>{{ display }}</span>
    </div>

    <p style="margin-bottom: 0">
      面板顶部与底部由 `popupRender` 注入，底部按钮可以直接清空当前选择。
    </p>
  </div>
</template>

<style>
.cascader-render-panel {
  width: 320px;
  max-width: calc(100vw - 32px);
  background: var(--apollo-color-bg-elevated);
  color: var(--apollo-color-text);
}

.cascader-render-panel-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--apollo-color-border-secondary);
}

.cascader-render-panel-header span {
  color: var(--apollo-color-text-tertiary);
  font-size: 12px;
}

.cascader-render-panel-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-top: 1px solid var(--apollo-color-border-secondary);
  color: var(--apollo-color-text-secondary);
  font-size: 12px;
}
</style>
