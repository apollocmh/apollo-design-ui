<script setup lang="ts">
// 对齐 antd 的 render-panel demo：popupRender 包装整个级联面板
import { Button, Cascader, Tag } from '@apollo-design/ui';
import { computed, h, ref, type VNodeChild } from 'vue';

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

const labels: Record<string, string> = {
  zhejiang: '浙江',
  hangzhou: '杭州',
  ningbo: '宁波',
  jiangsu: '江苏',
  nanjing: '南京',
};

const display = computed(() =>
  value.value.length ? value.value.map((item) => labels[item] ?? item).join(' / ') : '尚未选择',
);

const popupRender = (menu: unknown) =>
  h('div', { class: 'cascader-render-panel' }, [
    h('div', { class: 'cascader-render-panel-header' }, [
      h('strong', null, '区域选择面板'),
      h('span', null, 'popupRender 自定义包装层'),
    ]),
    menu as VNodeChild,
    h('div', { class: 'cascader-render-panel-footer' }, [
      h('span', null, display.value ? `当前：${display.value}` : '尚未选择'),
      h(
        Button,
        {
          size: 'small',
          type: 'link',
          disabled: !value.value.length,
          onClick: () => {
            value.value = [];
          },
        },
        () => '清空选择',
      ),
    ]),
  ]);
</script>

<template>
  <div>
    <Cascader
      v-model:value="value"
      :options="options"
      :popup-render="popupRender"
      placeholder="打开面板查看自定义包装层"
    />

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
  min-width: 320px;
  background: #ffffff;
}

.cascader-render-panel-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.cascader-render-panel-header span {
  color: #8c8c8c;
  font-size: 12px;
}

.cascader-render-panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-top: 1px solid #f0f0f0;
  color: #595959;
  font-size: 12px;
}
</style>
