const n=`<script setup lang="ts">
import { ref } from 'vue';
import { Spin } from '../../index';

const loading = ref(false);

const alertStyle = {
  padding: '8px 12px',
  border: '1px solid #91caff',
  background: '#e6f4ff',
  borderRadius: '6px',
  color: 'rgba(0, 0, 0, 0.88)',
  fontSize: '14px',
};
<\/script>

<template>
  <Spin :spinning="loading">
    <div :style="alertStyle">
      <strong>Alert message title</strong>
      <div>Further details about the context of this alert.</div>
    </div>
  </Spin>
  <p :style="{ marginTop: '16px' }">
    加载状态：
    <label>
      <input v-model="loading" type="checkbox" />
      切换
    </label>
  </p>
</template>
`;export{n as default};
