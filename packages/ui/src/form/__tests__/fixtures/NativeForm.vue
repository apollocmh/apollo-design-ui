<script setup lang="ts">
import type { ThemeConfig } from '@apollo-design/theme';
import { ref, shallowRef } from 'vue';
import { ConfigProvider } from '../../../config-provider';
import { Input, type InputRef } from '../../../input';
import Form from '../../Form.vue';
import FormItem from '../../FormItem.vue';
import FormList from '../../FormList.vue';
import { useForm } from '../../hooks/use-form';

const prefix = ref('apollo');
const theme = shallowRef<ThemeConfig | undefined>({
  components: {
    Form: {
      labelRequiredMarkColor: 'rgb(240, 10, 80)',
      labelColor: 'rgb(90, 30, 120)',
      labelFontSize: 17,
      labelHeight: 38,
      verticalLabelHeight: 41,
      labelColonMarginInlineStart: 5,
      labelColonMarginInlineEnd: 9,
      itemMarginBottom: 31,
      verticalLabelPadding: '1px 2px',
      verticalLabelMargin: 3,
      inlineItemMarginBottom: 6,
    },
  },
});
const customMark = ref(true);
const customFeedback = ref(true);
const localFeedback = ref(true);
const narrow = ref(false);
const scrollErrors = ref(true);
const title = shallowRef<InputRef | null>(null);
const [form] = useForm<{
  title: string;
  other?: string;
  last: string;
  users: { name: string }[];
}>();

function patch(kind: string): void {
  if (kind === 'theme')
    theme.value = { token: { fontSize: 18, colorTextHeading: 'rgb(20, 60, 100)' } };
  else if (kind === 'clear') theme.value = undefined;
  else if (kind === 'prefix') prefix.value = prefix.value === 'apollo' ? 'brand' : 'apollo';
  else if (kind === 'mark') customMark.value = !customMark.value;
  else if (kind === 'feedback') customFeedback.value = !customFeedback.value;
  else if (kind === 'localFeedback') localFeedback.value = !localFeedback.value;
  else if (kind === 'width') narrow.value = !narrow.value;
  else if (kind === 'scrollErrors') scrollErrors.value = !scrollErrors.value;
  else if (kind === 'clearErrors') form.setFields([{ name: 'last', errors: [] }]);
}

defineExpose({
  patch,
  refValid: () => form.getFieldInstance?.('title') === title.value,
  focus: () => form.focusField?.('title'),
  scroll: () => form.scrollToField?.('last', { focus: true, block: 'center', behavior: 'auto' }),
  submit: () => form.submit(),
  rowInput: () => {
    const instance = form.getFieldInstance?.(['users', 0, 'name']);
    return instance && 'input' in instance ? instance.input : undefined;
  },
});
</script>

<template>
  <ConfigProvider :prefix-cls="prefix" :theme="theme">
    <section class="native-form-scope">
      <Form :form="form" name="profile" :initial-values="{ title: 'Apollo', users: [{ name: 'Ada' }, { name: 'Grace' }] }" :scroll-to-first-error="scrollErrors ? { focus: true, block: 'center', behavior: 'auto' } : false">
        <template v-if="customMark" #requiredMark="{ label, required }">
          <component :is="label" /><span data-custom-mark>{{ required ? 'Required' : 'Optional' }}</span>
        </template>
        <template v-if="customFeedback" #feedbackIcon="{ status }"><i data-form-feedback>{{ status }}</i></template>
        <FormItem name="title" label="Title" :required="true" has-feedback validate-status="error" :rules="[{ required: true }]">
          <template #tooltip><b>Current field information</b></template>
          <template v-if="localFeedback" #feedbackIcon><i data-item-feedback>local</i></template>
          <Input ref="title" aria-label="Native title" />
        </FormItem>
        <FormItem name="other" label="Other" has-feedback validate-status="error">
          <Input aria-label="Other field" />
        </FormItem>
        <div data-scroll style="height: 160px; overflow: auto">
          <div style="height: 300px" />
          <FormItem name="last" label="Last" :rules="[{ required: true, message: 'Missing last' }]">
            <Input aria-label="Last field" />
          </FormItem>
          <div style="height: 300px" />
        </div>
        <FormList name="users">
          <template #default="{ fields, operations }">
            <FormItem v-for="field in fields" :key="field.key" :name="[field.name, 'name']" :label="`Person ${field.key}`">
              <Input :aria-label="`Person ${field.key}`" />
            </FormItem>
            <button type="button" data-move @click="operations.move(0, 1)">Move first</button>
            <button type="button" data-remove @click="operations.remove(0)">Remove first</button>
          </template>
        </FormList>
      </Form>
      <Form class="vertical-form" layout="vertical" :style="{ width: narrow ? '150px' : '500px' }">
        <FormItem label="Vertical" help="Visible help" extra="Additional information that wraps when the available width changes.">
          <Input aria-label="Vertical field" />
        </FormItem>
      </Form>
      <Form class="inline-form" layout="inline">
        <FormItem label="Inline"><Input aria-label="Inline field" /></FormItem>
      </Form>
      <Form class="responsive-form" :label-col="{ xs: 6 }" :wrapper-col="{ xs: 12 }">
        <FormItem name="responsive" label="Responsive"><Input aria-label="Responsive field" /></FormItem>
      </Form>
      <FormItem class="standalone-item" label="Standalone"><Input aria-label="Standalone field" /></FormItem>
    </section>
  </ConfigProvider>
</template>
