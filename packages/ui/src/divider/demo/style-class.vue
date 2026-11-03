<script setup lang="ts">
import { ref } from 'vue';
import type { DividerProps } from '../../index';
import { Divider, Select } from '../../index';

const size = ref<DividerProps['size']>('small');

const classNamesObject: DividerProps['classNames'] = {
  root: 'demo-divider-root',
  content: 'demo-divider-content',
  rail: 'demo-divider-rail',
};

const classNamesFn: DividerProps['classNames'] = (info) =>
  info.props.titlePlacement === 'start'
    ? { root: 'demo-divider-root--start' }
    : { root: 'demo-divider-root--default' };

const stylesObject: DividerProps['styles'] = {
  root: { borderWidth: '2px', borderStyle: 'dashed' },
  content: { fontStyle: 'italic' },
  rail: { opacity: 0.85 },
};

const stylesFn: DividerProps['styles'] = (info) =>
  info.props.size === 'small'
    ? { root: { borderColor: 'var(--apollo-color-primary)', paddingBlock: '4px' } }
    : {
        root: {
          backgroundColor: 'var(--apollo-color-fill-alter)',
          borderColor: 'var(--apollo-color-border)',
        },
      };
</script>

<template>
  <div>
    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px">Semantic size <Select v-model:value="size" aria-label="Divider semantic size" style="width: 140px" :options="[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'middle', label: 'Middle' }, { value: 'large', label: 'Large' }]" /></div>
    <Divider :class-names="classNamesObject">classNames Object</Divider>
    <Divider title-placement="start" :class-names="classNamesFn">classNames Function</Divider>
    <Divider :styles="stylesObject">styles Object</Divider>
    <Divider :size="size" :styles="stylesFn">styles Function</Divider>
  </div>
</template>

<style scoped>
.demo-divider-root { border-color: var(--apollo-color-primary); }
:deep(.demo-divider-content) { letter-spacing: 0.03em; }
</style>
