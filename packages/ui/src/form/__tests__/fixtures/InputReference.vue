<script setup lang="ts">
import { type ObjectDirective, reactive, ref } from 'vue';
import { Input, type InputRef } from '../../../input';
import { Form, FormItem, useForm } from '../../index';

defineOptions({ name: 'FormInputReferenceFixture' });
defineProps<{ getValueFromEvent?: (event: Event) => string }>();
const emit = defineEmits<{
  change: [event: Event];
  once: [event: Event];
  values: [value: unknown];
}>();
const model = reactive({ name: 'Apollo' });
const control = ref<InputRef | null>(null);
const visible = ref(true);
const formName = ref('initial-reference');
const status = ref<'error' | 'warning'>('warning');
const marker = ref('initial');
const handlers = reactive<Record<string, unknown>>({});
const validationCalls = ref(0);
const rules = [
  {
    validator: async () => {
      validationCalls.value += 1;
    },
  },
];
const vAudit: ObjectDirective<HTMLElement, string> = {
  mounted(element, binding) {
    element.dataset.fieldMarker = binding.value;
    element.dataset.directiveOwner = binding.instance?.$options.name;
  },
  updated(element, binding) {
    element.dataset.fieldMarker = binding.value;
  },
};
const [form] = useForm();
defineExpose({ control, visible, formName, status, marker, model, handlers, validationCalls });
</script>
<template>
  <Form :name="formName" :initial-values="model" :form="form" @values-change="emit('values', $event)">
    <FormItem name="name" label="Reference field" :rules="rules" :get-value-from-event="getValueFromEvent">
      <Input v-if="visible" ref="control" v-audit="marker" v-model:value="model.name" :status="status" @change="emit('change', $event)" @change.once="emit('once', $event)" v-on="handlers" />
    </FormItem>
  </Form>
</template>
