<script setup lang="ts">
// 对齐 antd 的 demo/layout-can-wrap.tsx：labelWrap 与 labelCol / wrapperCol 的配合。
import { Button, Form, FormItem, Input, Switch } from '@apollo-design/ui';
import { ref } from 'vue';

const labelWrap = ref(false);
</script>

<template>
  <div>
    <div class="demo-wrap-switch">
      <Switch v-model:checked="labelWrap" aria-label="标签换行" />
      <span>labelWrap：{{ labelWrap ? '开启' : '关闭' }}</span>
    </div>
    <Form
      layout="horizontal"
      :label-wrap="labelWrap"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
    >
      <FormItem
        label="这是一个很长很长、需要根据 labelWrap 决定是否换行的字段标签"
        name="longLabel"
        :rules="[{ required: true, message: '请输入内容' }]"
      >
        <Input aria-label="长标签字段" placeholder="切换 labelWrap 观察标签布局" />
      </FormItem>
      <FormItem label="普通标签" name="normalLabel">
        <Input aria-label="普通标签字段" placeholder="普通标签" />
      </FormItem>
      <FormItem :wrapper-col="{ span: 18, offset: 6 }">
        <Button type="primary" html-type="submit">提交</Button>
      </FormItem>
    </Form>
  </div>
</template>

<style scoped>
.demo-wrap-switch {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
}
</style>
