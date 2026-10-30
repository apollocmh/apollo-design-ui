<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { Tooltip, type TooltipRef } from '../../index';

const open = ref(false);
const tooltip = useTemplateRef<TooltipRef>('tooltip');
const changed = (_open: boolean) => {};
const finished = (_open: boolean) => {};
const clicked = (_event: MouseEvent) => {};
const invalidPopup = (_open: boolean) => {};

function align() {
  tooltip.value?.forceAlign();
  const trigger: HTMLElement | null | undefined = tooltip.value?.nativeElement;
  const popup: HTMLDivElement | null | undefined = tooltip.value?.popupElement;
  return [trigger, popup];
}
</script>

<template>
  <Tooltip
    ref="tooltip"
    v-model:open="open"
    title="Hint"
    class="popup"
    style="padding: 8px"
    @open-change.once="changed"
    @after-open-change="finished"
    @popup-click="clicked"
  >
    <button type="button" @click="align">Target</button>
  </Tooltip>
  <!-- @vue-expect-error Popup clicks carry the native MouseEvent. -->
  <Tooltip title="Hint" @popup-click="invalidPopup"><button>Invalid</button></Tooltip>
</template>
