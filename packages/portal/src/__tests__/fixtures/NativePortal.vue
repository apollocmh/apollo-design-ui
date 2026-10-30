<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Portal } from '../../portal';

const open = ref(false);
const mounted = ref(true);
const shadowHost = ref<HTMLElement | null>(null);
let shadow: ShadowRoot | undefined;
let ownedContainer: HTMLElement | undefined;
let escapes = 0;

onMounted(() => {
  if (!shadowHost.value) throw new Error('Expected mounted ShadowRoot host');
  shadow = shadowHost.value.attachShadow({ mode: 'closed' });
  open.value = true;
});

function moveIntoShadow() {
  const container = document.querySelector('[data-debug="native-owned-portal"]');
  if (!(container instanceof HTMLElement) || !shadow)
    throw new Error('Expected Portal default container and closed ShadowRoot');
  ownedContainer = container;
  shadow.append(container);
}

defineExpose({
  snapshot: () => ({
    connected: ownedContainer?.isConnected,
    shadowChildren: shadow?.childElementCount,
    escapes,
  }),
});
</script>

<template>
  <button @click="moveIntoShadow">Move container into closed shadow</button>
  <button @click="open = !open">Toggle Portal</button>
  <button @click="mounted = false">Unmount Portal</button>
  <div ref="shadowHost" />
  <Portal
    v-if="mounted"
    :open="open"
    auto-lock
    debug="native-owned-portal"
    :on-esc="() => escapes++"
  >
    <input aria-label="Portal editor" />
  </Portal>
</template>
