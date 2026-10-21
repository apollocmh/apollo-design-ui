<script setup lang="ts">
import type { SizeType } from '@apollo-design/ui';
import {
  Button,
  ConfigProvider,
  Input,
  Select,
  Space,
  Switch,
  Tag,
  useConfig,
} from '@apollo-design/ui';
import { h, ref } from 'vue';

const componentSize = ref<SizeType>('middle');
const componentDisabled = ref(false);

const sizeOptions: { value: SizeType; label: string }[] = [
  { value: 'small', label: 'small' },
  { value: 'middle', label: 'middle' },
  { value: 'large', label: 'large' },
];

function onSizeChange(value: unknown): void {
  componentSize.value = value as SizeType;
}

/**
 * 探针必须定义在 ConfigProvider 内部：inject 只沿父链解析。
 * 用渲染函数读取 useConfig() 返回的 ComputedRef，配置变化时探针会同步刷新。
 */
const ConfigProbe = {
  name: 'AUseConfigProbe',
  setup() {
    const { componentSize: size, componentDisabled: disabled } = useConfig();

    return () =>
      h('div', { class: 'use-config-demo-probe' }, [
        h('div', { class: 'use-config-demo-values' }, [
          h('span', null, 'useConfig() 读取到：'),
          h(Tag, { color: 'blue' }, () => `componentSize: ${size.value ?? 'undefined'}`),
          h(
            Tag,
            { color: disabled.value ? 'red' : 'green' },
            () => `componentDisabled: ${String(disabled.value)}`,
          ),
        ]),
        h(Space, { style: { marginTop: '12px' } }, () => [
          h(Input, {
            'aria-label': '尺寸与禁用状态示例',
            placeholder: '尺寸与禁用状态跟随配置',
            style: { width: '240px' },
          }),
          h(Button, { type: 'primary' }, () => '提交'),
          h(Button, null, () => '取消'),
        ]),
      ]);
  },
};
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <span>componentSize</span>
      <Select
        aria-label="组件尺寸"
        :value="componentSize"
        :options="sizeOptions"
        style="width: 140px"
        @change="onSizeChange"
      />
      <span>componentDisabled</span>
      <Switch v-model:checked="componentDisabled" aria-label="禁用全部组件" />
      <Tag color="blue">{{ componentDisabled ? '全局禁用' : '正常可用' }}</Tag>
    </Space>

    <ConfigProvider :component-size="componentSize" :component-disabled="componentDisabled">
      <ConfigProbe />
    </ConfigProvider>
  </div>
</template>

<style>
.use-config-demo-probe {
  padding: 16px;
  border: 1px solid var(--apollo-color-border);
  border-radius: var(--apollo-border-radius-lg);
  background: var(--apollo-color-fill-quaternary);
}

.use-config-demo-values {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
