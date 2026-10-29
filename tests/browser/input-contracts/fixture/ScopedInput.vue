<script setup>
import { formItemInputContextKey } from '@input-source/form/context.ts';
import { Input, InputPassword, InputSearch, TextArea } from '@input-source/input/index.ts';
import { Mentions } from '@input-source/mentions/index.ts';
import { computed, h, provide, ref } from 'vue';

const props = defineProps({ family: String, affix: Boolean, nested: Boolean, feedback: Boolean });
provide(
  formItemInputContextKey,
  computed(() => ({
    hasFeedback: props.feedback,
    feedbackIcon: props.feedback ? h('span', { 'data-scoped-feedback': '' }, 'feedback') : null,
  })),
);
const component = computed(
  () => ({ Input, TextArea, InputPassword, InputSearch, Mentions })[props.family],
);
const fields = computed(() =>
  props.family === 'TextArea'
    ? {}
    : props.family === 'Mentions'
      ? { allowClear: props.affix }
      : { prefix: props.affix ? '@' : undefined },
);
const owner = ref(null);
defineExpose({ owner });
</script>
<template>
  <section v-if="nested" data-nested-container>
    <component :is="component" ref="owner" class="owned-scoped-input" v-bind="fields" aria-label="Scoped field" />
  </section>
  <component v-else :is="component" ref="owner" class="owned-scoped-input" v-bind="fields" aria-label="Scoped field" />
</template>
<style scoped>
.owned-scoped-input { --scope-sentinel: logical-root; letter-spacing: 3px; }
</style>
