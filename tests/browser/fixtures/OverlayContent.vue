<script setup lang="ts">
import { Popconfirm, Popover, Tooltip } from '@apollo-design/ui';
import { ref } from 'vue';
import ConfirmPanel from '../../../packages/ui/src/popconfirm/demo/render-panel.vue';
import PopoverPanel from '../../../packages/ui/src/popover/demo/render-panel.vue';
import TooltipPanel from '../../../packages/ui/src/tooltip/demo/render-panel.vue';

const show = ref(false);
const empty = ref(false);
const count = ref(0);
const confirmOpen = ref(true);
const confirms = ref(0);
const pending = ref(false);
let finishPending: (() => void) | undefined;
const confirm = () => {
  confirms.value++;
  pending.value = true;
  return new Promise<void>((resolve) => { finishPending = resolve; });
};
const onConfirmOpenChange = (next: boolean) => {
  if (confirms.value > 0) confirmOpen.value = next;
};
</script>

<template>
  <div>
    <button @click="show = !show">Toggle popup slots</button>
    <button @click="empty = !empty">Empty popup slots</button>
    <button @click="count++">Update popup slots</button>
    <output data-confirm-count>{{ confirms }}</output>
    <div style="display: flex; gap: 80px; margin: 150px 0">
      <Tooltip open id="native-tooltip-main" title="Tooltip fallback">
        <button>Tooltip target</button>
        <template v-if="show" #title><strong v-if="!empty">Tooltip {{ count }}</strong></template>
      </Tooltip>
      <Popover open id="native-popover-main" title="Popover fallback">
        <button>Popover target</button>
        <template v-if="show" #title><strong v-if="!empty">Popover {{ count }}</strong></template>
        <template #content><input aria-label="Popover popup note" /></template>
      </Popover>
      <Popconfirm :open="confirmOpen" :on-open-change="onConfirmOpenChange" id="native-confirm-main" title="Confirm fallback" description="Description fallback" ok-text="Confirm prop" cancel-text="Cancel prop" :on-confirm="confirm">
        <button>Confirm target</button>
        <template v-if="show" #title><strong v-if="!empty">Confirm {{ count }}</strong></template>
        <template v-if="show" #description>
          <span v-if="!empty">Description {{ count }}</span>
          <button v-if="pending" @click.stop="finishPending?.()">Finish pending confirmation</button>
        </template>
        <template v-if="show" #okText><b v-if="!empty">Proceed {{ count }}</b></template>
        <template v-if="show" #cancelText><span v-if="!empty">Back {{ count }}</span></template>
      </Popconfirm>
    </div>
    <TooltipPanel />
    <PopoverPanel />
    <ConfirmPanel />
  </div>
</template>
