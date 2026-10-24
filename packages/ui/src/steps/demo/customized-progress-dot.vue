<script setup lang="ts">
import { Steps } from '@apollo-design/ui';

const items = [{ title: '等待中' }, { title: '处理中' }, { title: '已发货' }, { title: '已完成' }];
</script>

<template>
  <Steps :items="items" type="dot" :current="2">
    <template #progressDot="{ index, status }">
      <span :style="{
        display: 'inline-flex', width: '16px', height: '16px', borderRadius: '50%',
        background: status === 'finish' ? '#1677ff' : status === 'process' ? '#91caff' : '#e0e0e0',
        color: '#fff', fontSize: '10px', alignItems: 'center', justifyContent: 'center',
      }">{{ index + 1 }}</span>
    </template>
  </Steps>
</template>
