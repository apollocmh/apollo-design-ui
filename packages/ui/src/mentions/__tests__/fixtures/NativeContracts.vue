<script setup lang="ts">
import { ref } from 'vue';
import type { Mentions, MentionsRef } from '../../../index';

const mention = ref<InstanceType<typeof Mentions> | null>(null);
const container = ref<HTMLElement | null>(null);
const value = ref('');
function focus() {
  const instance: MentionsRef | null = mention.value;
  instance?.focus();
  const textarea: HTMLTextAreaElement | null = instance?.textarea ?? null;
  textarea?.setSelectionRange(0, 0);
  // @ts-expect-error The public textarea reference is a DOM element, not a component.
  textarea?.$el;
}
</script>
<template>
  <div ref="container">
    <Mentions ref="mention" v-model:value="value" :get-popup-container="() => container" aria-label="Current mentions" />
  </div>
  <button type="button" @click="focus">Focus mention editor</button>
</template>
