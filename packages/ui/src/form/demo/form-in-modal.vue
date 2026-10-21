<script setup lang="ts">
// 对齐 antd 的 demo/form-in-modal.tsx：Modal 中点「确定」时先校验表单。
import { Alert, Button, Form, FormItem, Input, Modal, useForm } from '@apollo-design/ui';
import { ref } from 'vue';

const [form] = useForm();
const open = ref(false);
const submitted = ref('');

const openModal = () => {
  form.resetFields();
  submitted.value = '';
  open.value = true;
};

const handleOk = async () => {
  try {
    const values = await form.validateFields();
    submitted.value = JSON.stringify(values);
    open.value = false;
  } catch {
    // 校验失败时保持弹窗打开，由 Form.Item 展示错误信息。
  }
};

const handleCancel = () => {
  open.value = false;
};
</script>

<template>
  <div class="demo-modal-trigger">
    <Button type="primary" @click="openModal">打开表单弹窗</Button>
    <Alert
      v-if="submitted"
      type="success"
      show-icon
      title="表单已提交"
      :description="submitted"
    />
  </div>

  <Modal
    title="新建项目"
    :open="open"
    :closable="{ 'aria-label': '关闭弹窗' }"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <Form :form="form" layout="vertical">
      <FormItem
        label="项目名称"
        name="projectName"
        :rules="[{ required: true, message: '请输入项目名称' }]"
      >
        <Input aria-label="项目名称" placeholder="请输入项目名称" />
      </FormItem>
      <FormItem
        label="负责人邮箱"
        name="ownerEmail"
        :rules="[
          { required: true, message: '请输入负责人邮箱' },
          { type: 'email', message: '邮箱格式不正确' },
        ]"
      >
        <Input aria-label="负责人邮箱" placeholder="name@example.com" />
      </FormItem>
    </Form>
  </Modal>
</template>

<style scoped>
.demo-modal-trigger {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}
</style>
