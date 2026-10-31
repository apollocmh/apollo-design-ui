<script setup lang="ts">
import { Popconfirm } from '../../../index';

const ConfirmView = Popconfirm;
defineProps<{
  onConfirm: (event?: MouseEvent) => unknown;
  onCancel: (event?: MouseEvent) => void;
  onOpenChange: (open: boolean) => void;
  onPopupClick: (event: MouseEvent) => void;
}>();
</script>

<template>
  <ConfirmView
    open
    title="Native callbacks"
    :on-confirm="onConfirm"
    :on-cancel="onCancel"
    @open-change="onOpenChange"
    @popup-click="onPopupClick"
  >
    <button>Open confirmation</button>
    <template #okText><b>Proceed</b></template>
  </ConfirmView>
</template>
