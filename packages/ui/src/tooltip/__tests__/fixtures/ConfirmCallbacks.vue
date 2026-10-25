<script setup lang="ts">
import { Popconfirm } from '../../../index';

defineProps<{
  onConfirm: (event?: MouseEvent) => unknown;
  onCancel: (event?: MouseEvent) => void;
  onOpenChange: (open: boolean) => void;
  onPopupClick: (event: MouseEvent) => void;
}>();
</script>

<template>
  <Popconfirm open title="Native callbacks" :on-confirm="onConfirm" :on-cancel="onCancel" :on-open-change="onOpenChange" :on-popup-click="onPopupClick">
    <button>Open confirmation</button>
    <template #okText><b>Proceed</b></template>
  </Popconfirm>
</template>
