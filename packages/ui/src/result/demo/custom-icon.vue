<script setup lang="ts">
import { SmileOutlined } from '@apollo-design/icons';
import { Button, Input, Result, type ResultStatusType, Select } from '@apollo-design/ui';
import { ref } from 'vue';

const status = ref<ResultStatusType>('info');
const mode = ref<'custom' | 'empty' | 'default'>('custom');
const draft = ref('Result draft');
</script>
<template>
  <div style="display:flex;gap:16px;flex-wrap:wrap">
    <label style="display: flex; align-items: center; gap: 8px">结果状态 <Select v-model:value="status" aria-label="Result demo status" style="width: 120px" :options="['info', 'success', 'warning', 'error', '403', '404', '500'].map(value => ({ value, label: value }))" /></label>
    <label style="display: flex; align-items: center; gap: 8px">图标内容 <Select v-model:value="mode" aria-label="Result demo icon" style="width: 140px" :options="[{ value: 'custom', label: '自定义内容' }, { value: 'empty', label: '有意留空' }, { value: 'default', label: '默认图形' }]" /></label>
  </div>
  <Result :status="status" title="Great, we have done all the operations!">
    <template v-if="mode !== 'default'" #icon><template v-if="mode === 'custom'"><!-- Complete native content, including the editor. --><SmileOutlined /><div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap"><label>备注 <Input v-model:value="draft" aria-label="Result demo draft" style="width:140px" /></label><span>完整图标内容</span></div></template></template>
    <template #extra><Button type="primary">Next</Button></template>
  </Result>
</template>
