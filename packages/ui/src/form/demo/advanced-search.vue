<script setup lang="ts">
// 对齐 antd 的 demo/advanced-search.tsx：栅格 + 展开/收起的筛选表单。
import { Button, Col, Form, FormItem, Input, Row, Select, useForm } from '@apollo-design/ui';
import { ref } from 'vue';

const [form] = useForm();
const expanded = ref(false);
const submitted = ref('');

const statusOptions = [
  { value: 'running', label: '运行中' },
  { value: 'paused', label: '已暂停' },
  { value: 'finished', label: '已结束' },
];

const ownerOptions = [
  { value: 'apollo', label: 'Apollo' },
  { value: 'workbuddy', label: 'WorkBuddy' },
];

const onFinish = (values: unknown) => {
  submitted.value = JSON.stringify(values);
};

const onReset = () => {
  form.resetFields();
  submitted.value = '';
};
</script>

<template>
  <Form :form="form" layout="vertical" @finish="onFinish">
    <Row :gutter="16">
      <Col :span="8">
        <FormItem label="项目名称" name="keyword">
          <Input aria-label="项目名称" placeholder="请输入项目名称" allow-clear />
        </FormItem>
      </Col>
      <Col :span="8">
        <FormItem label="负责人" name="owner">
          <Select
            aria-label="负责人"
            placeholder="请选择负责人"
            :options="ownerOptions"
            allow-clear
          />
        </FormItem>
      </Col>
      <Col :span="8">
        <FormItem label="状态" name="status">
          <Select
            aria-label="项目状态"
            placeholder="请选择状态"
            :options="statusOptions"
            allow-clear
          />
        </FormItem>
      </Col>
      <Col v-show="expanded" :span="8">
        <FormItem label="创建人" name="creator">
          <Input aria-label="创建人" placeholder="请输入创建人" allow-clear />
        </FormItem>
      </Col>
      <Col v-show="expanded" :span="8">
        <FormItem label="备注" name="remark">
          <Input aria-label="备注" placeholder="请输入备注" allow-clear />
        </FormItem>
      </Col>
    </Row>
    <div class="demo-search-actions">
      <Button type="primary" html-type="submit">搜索</Button>
      <Button @click="onReset">重置</Button>
      <Button type="link" @click="expanded = !expanded">
        {{ expanded ? '收起筛选' : '展开更多筛选' }}
      </Button>
    </div>
    <div class="demo-search-result">
      {{ submitted ? `查询条件：${submitted}` : '点击「搜索」查看表单收集到的查询条件。' }}
    </div>
  </Form>
</template>

<style scoped>
.demo-search-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.demo-search-result {
  margin-top: 12px;
  padding: 8px 12px;
  color: rgb(0 0 0 / 65%);
  background: rgb(0 0 0 / 3%);
  border-radius: 6px;
  word-break: break-all;
}
</style>
