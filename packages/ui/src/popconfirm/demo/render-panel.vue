<script setup lang="ts">
// 对齐 antd 的 render-panel demo：PurePanel（调试用面板）
import { Button, ConfigProvider, PopconfirmPurePanel } from '@apollo-design/ui';
import { ref } from 'vue';

const show = ref(false);
const empty = ref(false);
const count = ref(0);
const themed = ref(false);
</script>

<template>
  <div>
    <p style="display: flex; flex-wrap: wrap; gap: 8px">
      <Button @click="show = !show">Toggle popconfirm slots</Button>
      <Button @click="empty = !empty">Empty popconfirm slots</Button>
      <Button @click="count++">Update popconfirm slots</Button>
      <Button @click="themed = !themed">Theme z-index: {{ themed ? 2060 : 'default' }}</Button>
    </p>
    <ConfigProvider :theme="themed ? { components: { Popconfirm: { zIndexPopup: 2060 } } } : undefined">
    <PopconfirmPurePanel data-native-popconfirm-panel title="Delete the task" description="Are you sure to delete this task?" ok-text="Confirm" cancel-text="Cancel" style="max-width: 360px" :styles="{ root: { minHeight: '80px' }, arrow: { opacity: 0.6 } }">
      <template v-if="show" #title><strong v-if="!empty">Native confirmation {{ count }}</strong></template>
      <template v-if="show" #description><span v-if="!empty">Current details {{ count }}</span></template>
      <template v-if="show" #okText><b v-if="!empty">Proceed {{ count }}</b></template>
      <template v-if="show" #cancelText><span v-if="!empty">Back {{ count }}</span></template>
    </PopconfirmPurePanel>
    </ConfigProvider>
  </div>
</template>
