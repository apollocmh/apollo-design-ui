<script setup lang="ts">
import { Input } from '../../../input';
import { Form, FormItem, FormList, useForm } from '../../index';

const [form] = useForm<{ title: string; users: string[] }>();
</script>

<template>
  <Form :form="form" render-props :initial-values="{ title: 'Apollo', users: ['Ada'] }">
    <template #default="{ values, form: owner }">
      <output data-values>{{ values.title }}</output>
      <button type="button" data-fill @click="owner.setFieldValue('title', 'filled')">Fill</button>
      <FormItem name="title" label="Title">
        <template #default="{ meta, form: fieldForm }">
          <Input aria-label="UI title" :data-touched="meta.touched" :data-has-form="Boolean(fieldForm)" />
        </template>
      </FormItem>
      <FormItem no-style>
        <template #default="{ control, meta, form: layoutForm }">
          <output data-layout>{{ Object.keys(control).length }}:{{ meta.name.length }}:{{ Boolean(layoutForm) }}</output>
        </template>
      </FormItem>
      <FormList name="users">
        <template #default="{ fields, operations, meta }">
          <output data-users>{{ fields.length }}:{{ meta.errors?.length }}</output>
          <button type="button" data-add @click="operations.add('Grace')">Add</button>
        </template>
      </FormList>
    </template>
  </Form>
</template>
