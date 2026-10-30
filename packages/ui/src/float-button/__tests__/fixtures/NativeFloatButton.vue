<script setup lang="ts">
import { useTemplateRef } from 'vue';
import BackTop from '../../BackTop';
import FloatButton from '../../FloatButton';
import Group from '../../FloatButtonGroup';

const button = useTemplateRef('button');
const group = useTemplateRef('group');
const backTop = useTemplateRef('backTop');
const acceptButton = (value: HTMLButtonElement | HTMLAnchorElement | null | undefined) => value;
const acceptGroup = (value: HTMLDivElement | null | undefined) => value;
</script>

<template>
  <FloatButton ref="button" shape="square" @click="event => event.preventDefault()">
    <template #icon><i /></template>
    <template #content>Action</template>
  </FloatButton>
  <Group ref="group" trigger="click" @open-change="open => open.valueOf()">
    <FloatButton />
    <template #icon><i /></template>
    <template #closeIcon><b /></template>
  </Group>
  <BackTop ref="backTop" :target="() => null" />
  <output>{{ acceptButton(button?.nativeElement) }}{{ acceptGroup(group?.nativeElement) }}{{ acceptButton(backTop?.nativeElement) }}</output>
</template>
