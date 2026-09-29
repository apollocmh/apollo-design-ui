<script setup lang="ts">
import { Form, FormItem, Input } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('');
</script>

<template>
  <Form>
    <FormItem label="required mark" name="a" required>
      <Input v-model:value="value" />
    </FormItem>
    <FormItem label="optional mark" name="b" required-mark="optional">
      <Input v-model:value="value" />
    </FormItem>
    <FormItem :label="null" name="c" :label-col="{ span: 4 }">
      <!-- ⚠️ 无 label 的字段：控件必须自带可访问名（axe 的 label 规则会把
           「既无 label 关联又无 aria-label」判成 violation，本 demo 因此显式补上） -->
      <Input v-model:value="value" aria-label="no label" />
    </FormItem>
    <FormItem label="no colon" name="d" :colon="false">
      <Input v-model:value="value" />
    </FormItem>
    <FormItem label="tooltip" name="e" :tooltip="'这是一段说明'">
      <Input v-model:value="value" />
    </FormItem>
  </Form>
</template>
