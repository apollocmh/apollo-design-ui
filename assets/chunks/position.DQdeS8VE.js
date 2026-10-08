const n=`<script setup lang="ts">
// 对齐 antd demo/position.tsx
import { Button, Modal } from '@apollo-design/ui';
import { ref } from 'vue';

const modal1Open = ref(false);
const modal2Open = ref(false);
<\/script>

<template>
  <Button type="primary" @click="modal1Open = true">Display a modal dialog at 20px to Top</Button>
  <Modal
    title="20px to Top"
    :style="{ top: '20px' }"
    :open="modal1Open"
    @ok="modal1Open = false"
    @cancel="modal1Open = false"
  >
    <p>some contents...</p>
    <p>some contents...</p>
    <p>some contents...</p>
  </Modal>
  <br />
  <br />
  <Button type="primary" @click="modal2Open = true">Vertically centered modal dialog</Button>
  <Modal
    title="Vertically centered modal dialog"
    centered
    :open="modal2Open"
    @ok="modal2Open = false"
    @cancel="modal2Open = false"
  >
    <p>some contents...</p>
    <p>some contents...</p>
    <p>some contents...</p>
  </Modal>
</template>
`;export{n as default};
