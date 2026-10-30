<script setup lang="ts">
// 对齐 antd 的 component-token demo。
// 本仓零运行时：Table 的 Component Token 就是 `--apollo-table-*` CSS 变量，
// 在容器上覆盖同名变量即可（37 个 token 见 table/style/index.ts）。
import type { TableColumnsType } from '@apollo-design/ui';
import { Select, Space, Table, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

type TokenMode = 'default' | 'custom';

const mode = ref<TokenMode>('custom');
const modeOptions: { value: TokenMode; label: string }[] = [
  { value: 'default', label: '默认 Token' },
  { value: 'custom', label: '自定义 Token' },
];

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 100, align: 'center' },
  { title: 'City', dataIndex: 'city', key: 'city' },
];

const data = [
  { key: '1', name: 'John Brown', age: 32, city: 'New York' },
  { key: '2', name: 'Jim Green', age: 42, city: 'London' },
  { key: '3', name: 'Joe Black', age: 28, city: 'Sydney' },
  { key: '4', name: 'Jim Red', age: 32, city: 'London' },
];

function onModeChange(value: unknown): void {
  mode.value = value as TokenMode;
}
</script>

<template>
  <div class="table-component-token-demo" :class="{ 'is-custom': mode === 'custom' }">
    <Space :size="12" wrap style="margin-bottom: 16px">
      <span>Token 主题</span>
      <Select
        aria-label="组件 Token 主题"
        :value="mode"
        :options="modeOptions"
        style="width: 150px"
        @change="onModeChange"
      />
      <Tag color="blue">{{ mode === 'custom' ? '已覆盖表头 / 行 / 内边距' : '默认主题' }}</Tag>
    </Space>

    <Table
      :columns="columns"
      :data-source="data"
      :pagination="false"
      bordered
    ><template #title>用户列表（Component Token）</template></Table>
  </div>
</template>

<style>
.table-component-token-demo.is-custom .apollo-table.apollo-table {
  --apollo-table-header-bg: #e6f4ff;
  --apollo-table-header-color: #0958d9;
  --apollo-table-row-hover-bg: #f0f7ff;
  --apollo-table-row-selected-bg: #bae0ff;
  --apollo-table-cell-padding-block: 12px;
  --apollo-table-cell-padding-inline: 20px;
  --apollo-table-border-color: #91caff;
  --apollo-table-footer-bg: #fffbe6;
}
</style>
