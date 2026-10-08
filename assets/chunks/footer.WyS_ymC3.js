const n=`<script setup lang="ts">
// 对齐 antd demo/footer.tsx：自定义 footer + 异步关闭
import { Button, Modal } from '@apollo-design/ui';
import { ref } from 'vue';

const loading = ref(false);
const open = ref(false);

const handleOk = () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    open.value = false;
  }, 3000);
};

const handleCancel = () => {
  open.value = false;
};
<\/script>

<template>
  <Button type="primary" @click="open = true">Open Modal with customized footer</Button>
  <Modal
    :open="open"
    :confirm-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <template #footer>
      <Button key="back" @click="handleCancel">Return</Button>
      <Button key="submit" type="primary" :loading="loading" @click="handleOk">
        Submit
      </Button>
      <Button key="link" href="https://google.com" type="primary" target="_blank">
        Search on Google
      </Button>
    </template>
  </Modal>
</template>
`;export{n as default};
