<script setup lang="ts">
import { Steps, type StepsIconRenderSlotProps, type StepsItemRenderSlotProps, type StepsItemWrapperRenderSlotProps, type StepsProgressDotSlotProps } from '../../../index';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const checkIcon = <T>(info: T, ..._check: Equal<T, StepsIconRenderSlotProps> extends true ? [] : [never]) => info;
const checkItem = <T>(info: T, ..._check: Equal<T, StepsItemRenderSlotProps> extends true ? [] : [never]) => info;
const checkWrapper = <T>(info: T, ..._check: Equal<T, StepsItemWrapperRenderSlotProps> extends true ? [] : [never]) => info;
const checkDot = <T>(info: T, ..._check: Equal<T, StepsProgressDotSlotProps> extends true ? [] : [never]) => info;
const items = [{ key: 'a', title: 'Alpha', content: 'Details' }];
</script>

<template>
  <Steps :items="items" type="inline">
    <template #iconRender="info"><b>{{ checkIcon(info).index }}:{{ info.active }}:{{ info.item.title }}</b></template>
    <template #itemRender="info"><component :is="checkItem(info).itemNode" /></template>
    <template #itemWrapperRender="info"><component :is="checkWrapper(info).itemNode" /></template>
  </Steps>
  <Steps :items="items" type="dot">
    <template #progressDot="info"><b>{{ checkDot(info).index }}:{{ info.status }}</b></template>
  </Steps>
</template>
