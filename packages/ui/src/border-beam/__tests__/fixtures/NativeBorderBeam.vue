<script setup lang="ts">
import { ref, shallowRef, useTemplateRef } from 'vue';
import BorderBeam from '../../BorderBeam';
import type { BorderBeamProps } from '../../interface';

const host = useTemplateRef<HTMLButtonElement>('host');
const shown = ref(true);
const count = ref(0);
const settings = shallowRef<BorderBeamProps>({ count: 2, size: 40 });
defineExpose({
  shown,
  count,
  settings,
  get hostElement() {
    return host.value;
  },
});
</script>
<template>
  <BorderBeam v-bind="settings" class="outside-host" :style="['margin-top: 3px', { color: 'blue' }]" :styles="{ effect: { opacity: 0.5 } }">
    <button v-if="shown" ref="host" id="compiled-host" type="button" style="position: relative; border: 2px solid black; color: red" @click="count += 1">{{ count }}</button>
  </BorderBeam>
  <template v-if="false">
    <!-- @vue-expect-error Beam counts are numeric on the actual component. -->
    <BorderBeam :count="'two'"><button type="button">Invalid count</button></BorderBeam>
    <!-- @vue-expect-error A semantic effect style keeps the Vue CSSProperties boundary. -->
    <BorderBeam :styles="{ effect: { position: 42 } }"><button type="button">Invalid style</button></BorderBeam>
  </template>
</template>
