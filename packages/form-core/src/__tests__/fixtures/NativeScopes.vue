<script setup lang="ts">
import { Field, Form, List, useForm } from '../../index';

const [form] = useForm<{ title: string; users: string[] }>();
defineExpose({ form });
</script>

<template>
  <Form :form="form" render-props :initial-values="{ title: 'Apollo', users: ['Ada'] }">
    <template #default="{ values, form: owner }">
      <output data-values>{{ values.title }}</output>
      <button type="button" data-fill @click="owner.setFieldValue('title', 'filled')">Fill</button>
      <Field name="title" trigger="onInput">
        <template #default="{ control, meta, form: fieldForm }">
          <input v-bind="control" aria-label="Native title" />
          <output data-touched>{{ meta.touched }}</output>
          <button type="button" data-reset @click="fieldForm.resetFields()">Reset</button>
        </template>
      </Field>
      <List name="users">
        <template #default="{ fields, operations, meta }">
          <output data-users>{{ fields.length }}:{{ meta.name.join('.') }}</output>
          <button type="button" data-add @click="operations.add('Grace')">Add</button>
        </template>
      </List>
    </template>
  </Form>
</template>
