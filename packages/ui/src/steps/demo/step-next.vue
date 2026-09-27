<script setup lang="ts">
// 对齐 antd demo/step-next.tsx
import { Button, Steps } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const current = ref(0);
const items = [
  { title: '填写订单', content: '请填写收货地址与联系方式' },
  { title: '付款', content: '支持多种支付方式' },
  { title: '发货', content: '付款后 24 小时内发货' },
  { title: '签收', content: '请记得查收商品' },
];
const description = computed(() => (current.value < items.length ? '下一步' : '全部完成'));
const prev = () => {
  current.value = Math.max(0, current.value - 1);
};
const next = () => {
  current.value = Math.min(items.length - 1, current.value + 1);
};
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <Steps :items="items" :current="current" />
    <div style="display: flex; gap: 8px">
      <Button :disabled="current === 0" @click="prev">上一步</Button>
      <Button type="primary" :disabled="current >= items.length - 1" @click="next">
        {{ description }}
      </Button>
    </div>
  </div>
</template>
