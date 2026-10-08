const e=`<script setup lang="ts">
import { Form, FormItem, Input } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('');
<\/script>

<template>
  <Form layout="vertical">
    <FormItem label="Error" name="err" validate-status="error" help="出错信息" has-feedback>
      <Input v-model:value="value" placeholder="error" />
    </FormItem>
    <FormItem label="Warning" name="warn" validate-status="warning" help="警告信息" has-feedback>
      <Input v-model:value="value" placeholder="warning" />
    </FormItem>
    <FormItem label="Validating" name="val" validate-status="validating" help="校验中" has-feedback>
      <Input v-model:value="value" placeholder="validating" />
    </FormItem>
  </Form>
</template>
`;export{e as default};
