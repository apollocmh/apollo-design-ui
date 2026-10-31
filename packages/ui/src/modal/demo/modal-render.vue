<script setup lang="ts">
// The scoped slot supplies a stable component for the current panel.
import { Button, Modal } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
</script>

<template>
  <Button @click="open = true">Open Customized Modal</Button>
  <Modal
    title="Customized Modal"
    :open="open"
    :class-names="{ title: 'modal-draggable-title' }"
    :styles="{ title: { cursor: 'move' } }"
    @ok="open = false"
    @cancel="open = false"
  >
    <template #modalRender="{ ModalPanel }"><div class="draggable-shell"><component :is="ModalPanel" /></div></template>
    <p>Just don't learn physics at school and your life will be full of magic and miracles.</p>
    <p>Day before yesterday I saw a rabbit, and yesterday a deer, and today, you.</p>
  </Modal>
</template>
