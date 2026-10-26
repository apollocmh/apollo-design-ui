<script setup lang="ts">
import { Button, Result, type ResultProps, type ResultStatusType } from '@apollo-design/ui';
import { ref } from 'vue';

const status = ref<ResultStatusType>('success');
const classNamesObject = {
  root: 'demo-result-root',
  title: 'demo-result-title',
  subTitle: 'demo-result-subtitle',
  icon: 'demo-result-icon',
  extra: 'demo-result-extra',
  body: 'demo-result-body',
};
const styles = ({ props }: { props: ResultProps }) => ({
  root: { borderWidth: '2px', borderStyle: 'dashed', padding: '16px' },
  icon: { opacity: props.status === 'success' ? 0.8 : 1 },
  extra: {
    backgroundColor: 'var(--apollo-color-fill-alter)',
    color: 'var(--apollo-color-text)',
    padding: '8px',
  },
});
</script>
<template>
  <Button aria-label="Toggle Result semantic status" @click="status = status === 'success' ? 'warning' : 'success'">切换结果状态</Button>
  <Result :status="status" title="Successfully Purchased Cloud Server ECS!" sub-title="Order number: 2017182818828182881" :class-names="classNamesObject" :styles="styles">
    <template #extra><Button type="primary">Go Console</Button></template>
    <p>六个语义落点均可配置，样式工厂读取当前结果状态。</p>
  </Result>
</template>
