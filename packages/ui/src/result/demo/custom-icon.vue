<script setup lang="ts">
import { SmileOutlined } from '@apollo-design/icons';
import { Button, Result, type ResultStatusType } from '@apollo-design/ui';
import { ref } from 'vue';

const status = ref<ResultStatusType>('info');
const mode = ref<'custom' | 'empty' | 'default'>('custom');
const draft = ref('Result draft');
</script>
<template>
  <div style="display:flex;gap:16px;flex-wrap:wrap">
    <label>结果状态 <select v-model="status" aria-label="Result demo status"><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="error">Error</option><option value="403">403</option><option value="404">404</option><option value="500">500</option></select></label>
    <label>图标内容 <select v-model="mode" aria-label="Result demo icon"><option value="custom">自定义内容</option><option value="empty">有意留空</option><option value="default">默认图形</option></select></label>
  </div>
  <Result :status="status" title="Great, we have done all the operations!">
    <template v-if="mode !== 'default'" #icon><template v-if="mode === 'custom'"><!-- Complete native content, including the editor. --><SmileOutlined /><div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap"><label>备注 <input v-model="draft" aria-label="Result demo draft" style="width:140px" /></label><span>完整图标内容</span></div></template></template>
    <template #extra><Button type="primary">Next</Button></template>
  </Result>
</template>
