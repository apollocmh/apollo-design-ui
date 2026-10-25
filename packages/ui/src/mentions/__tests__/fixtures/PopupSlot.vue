<script setup lang="ts">
import { Mentions, type MentionsPopupRenderSlotProps } from '../../../index';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const checkPopup = <T>(info: T, ..._check: Equal<T, MentionsPopupRenderSlotProps> extends true ? [] : [never]) => info;
const options = [{ value: 'alpha', label: 'Alpha' }];
</script>

<template>
  <Mentions :options="options" aria-label="Typed mentions">
    <template #popupRender="info"><section><b>Native menu</b><component :is="checkPopup(info).originNode" /></section></template>
  </Mentions>
  <Mentions>
    <!-- @vue-expect-error Unknown content slots are rejected. -->
    <template #unknownPopup>Unsupported</template>
  </Mentions>
</template>
