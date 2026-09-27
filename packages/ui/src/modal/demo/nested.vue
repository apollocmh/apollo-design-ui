<script setup lang="ts">
// 对齐 antd demo/nested.tsx（去掉 message/notification/Select，只留三层嵌套 Modal）
import { Button, Modal, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);

const onShowStatic = () => {
  Modal.confirm({ title: 'Are you OK?', content: 'I am OK' });
};
</script>

<template>
  <Space>
    <Button @click="open = !open">{{ open ? 'Close' : 'Open' }}</Button>
    <Button @click="onShowStatic">Static</Button>
  </Space>
  <Modal
    title="Basic Modal"
    :open="open"
    destroy-on-hidden
    :mask="{ closable: false }"
    :closable="false"
    :styles="{ container: { marginBlockStart: '100px' } }"
    @cancel="open = false"
  >
    <p>Some contents...</p>
    <template #footer></template>
    <Modal
      title="Nested Modal"
      :open="open"
      destroy-on-hidden
      :mask="false"
      :closable="false"
      :styles="{
        container: { marginBlockStart: '250px' },
        body: { display: 'flex', justifyContent: 'center' },
      }"
      @cancel="open = false"
    >
      <p>Nested contents...</p>
      <template #footer></template>
      <Modal
        title="Nested Modal"
        :open="open"
        destroy-on-hidden
        :mask="false"
        :closable="false"
        :styles="{
          container: { marginBlockStart: '400px' },
          body: { display: 'flex', justifyContent: 'flex-end' },
        }"
        @cancel="open = false"
      >
        <Button @click="onShowStatic">Static Confirm</Button>
        <template #footer></template>
      </Modal>
    </Modal>
  </Modal>
</template>
