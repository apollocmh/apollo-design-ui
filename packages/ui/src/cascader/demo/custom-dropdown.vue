<script setup lang="ts">
// 对齐 antd 的 custom-dropdown demo：popupClassName + popupStyle
import { Cascader, Switch, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const enhanced = ref(true);
const value = ref<string[]>([]);

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

const popupClassName = computed(() =>
  enhanced.value ? 'cascader-custom-dropdown-popup' : undefined,
);

const popupStyle = computed<Record<string, string | number> | undefined>(() =>
  enhanced.value
    ? {
        borderRadius: '14px',
        border: '1px solid #95de64',
        boxShadow: '0 12px 28px rgba(82, 196, 26, 0.18)',
      }
    : undefined,
);

const columnStyle = computed<Record<string, string | number> | undefined>(() =>
  enhanced.value ? { backgroundColor: '#f6ffed' } : undefined,
);

const selectedText = computed(() => (value.value.length ? value.value.join(' / ') : '尚未选择'));
</script>

<template>
  <div>
    <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px">
      <Switch v-model:checked="enhanced" aria-label="启用自定义浮层样式" />
      <span>自定义浮层</span>
      <Tag color="green">{{ enhanced ? '圆角 / 阴影 / 列背景' : '默认浮层' }}</Tag>
    </div>

    <Cascader
      v-model:value="value"
      :options="options"
      :popup-class-name="popupClassName"
      :popup-style="popupStyle"
      :popup-menu-column-style="columnStyle"
      placeholder="请选择地区"
    />

    <p style="margin-bottom: 0">当前选择：{{ selectedText }}</p>
  </div>
</template>

<style>
.apollo-cascader-dropdown.cascader-custom-dropdown-popup {
  padding: 8px;
}

.cascader-custom-dropdown-popup .apollo-cascader-menu {
  border-radius: 10px;
}

.cascader-custom-dropdown-popup .apollo-cascader-menu:not(:last-child) {
  border-inline-end-color: #b7eb8f;
}
</style>
