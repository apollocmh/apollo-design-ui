const n=`<script setup lang="ts">
// 对齐 antd demo/confirm.tsx（四种 confirm 形态）
import { ExclamationCircleFilled } from '@apollo-design/icons';
import { Button, Modal, Space } from '@apollo-design/ui';
import { h } from 'vue';

const showConfirm = () => {
  Modal.confirm({
    title: 'Do you want to delete these items?',
    icon: h(ExclamationCircleFilled),
    content: 'Some descriptions',
    onOk() {
      console.log('OK');
    },
    onCancel() {
      console.log('Cancel');
    },
  });
};

const showPromiseConfirm = () => {
  Modal.confirm({
    title: 'Do you want to delete these items?',
    icon: h(ExclamationCircleFilled),
    content: 'When clicked the OK button, this dialog will be closed after 1 second',
    onOk() {
      return new Promise((resolve, reject) => {
        setTimeout(Math.random() > 0.5 ? resolve : reject, 1000);
      }).catch(() => console.log('Oops errors!'));
    },
    onCancel() {},
  });
};

const showDeleteConfirm = () => {
  Modal.confirm({
    title: 'Are you sure delete this task?',
    icon: h(ExclamationCircleFilled),
    content: 'Some descriptions',
    okText: 'Yes',
    okType: 'danger',
    cancelText: 'No',
    onOk() {
      console.log('OK');
    },
    onCancel() {
      console.log('Cancel');
    },
  });
};

const showPropsConfirm = () => {
  Modal.confirm({
    title: 'Are you sure delete this task?',
    icon: h(ExclamationCircleFilled),
    content: 'Some descriptions',
    okText: 'Yes',
    okType: 'danger',
    okButtonProps: { disabled: true },
    cancelText: 'No',
    onOk() {
      console.log('OK');
    },
    onCancel() {
      console.log('Cancel');
    },
  });
};
<\/script>

<template>
  <Space wrap>
    <Button @click="showConfirm">Confirm</Button>
    <Button @click="showPromiseConfirm">With promise</Button>
    <Button type="dashed" @click="showDeleteConfirm">Delete</Button>
    <Button type="dashed" @click="showPropsConfirm">With extra props</Button>
  </Space>
</template>
`;export{n as default};
