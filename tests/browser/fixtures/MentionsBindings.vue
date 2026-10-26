<script setup lang="ts">
import { Form, FormItem, Mentions, type MentionsOptionProps } from '@apollo-design/ui';
import { type ClassValue, computed, reactive, ref, type StyleValue } from 'vue';

const phase = ref(0);
const silent = ref(true);
const loading = ref(false);
const selections = ref(0);
const values = reactive({ bare: '', clear: '', feedback: '' });
const options: MentionsOptionProps[] = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
];
const style = computed<StyleValue>(() =>
  phase.value === 0
    ? 'max-width:300px; padding-top:8px; --native-phase:first'
    : phase.value === 1
      ? ['max-width:340px; --native-phase:next', { paddingBottom: '10px' }]
      : undefined,
);
const classes = computed<ClassValue>(() => [
  'native-mention-root',
  { first: phase.value === 0, next: phase.value === 1 },
]);
const styles = { root: { minHeight: '62px', maxWidth: '240px' } };
const select = () => {
  selections.value++;
};
</script>

<template>
  <div>
    <p>
      <button @mousedown.prevent @click="phase = (phase + 1) % 3">Cycle mention root styles</button>
      <button @mousedown.prevent @click="silent = !silent">Toggle explicit silent</button>
      <button @mousedown.prevent @click="loading = !loading">Toggle mention loading</button>
    </p>
    <output data-native-selections>{{ selections }}</output>
    <Mentions v-model:value="values.bare" :options="options" :silent="silent" :loading="loading" :style="style" :class="classes" :styles="styles" :class-names="{ root: 'binding-bare' }" aria-label="Bare mentions binding" id="binding-bare-input" @select="select" />
    <Mentions v-model:value="values.clear" allow-clear :options="options" :silent="silent" :loading="loading" :style="style" :class="classes" :styles="styles" :class-names="{ root: 'binding-clear' }" aria-label="Clear mentions binding" id="binding-clear-input" @select="select" />
    <Form>
      <FormItem has-feedback validate-status="success">
        <Mentions v-model:value="values.feedback" :options="options" :silent="silent" :loading="loading" :style="style" :class="classes" :styles="styles" :class-names="{ root: 'binding-feedback' }" aria-label="Feedback mentions binding" id="binding-feedback-input" @select="select" />
      </FormItem>
    </Form>
  </div>
</template>
