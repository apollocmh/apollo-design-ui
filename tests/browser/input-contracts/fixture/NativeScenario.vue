<script setup>
import { Input, InputPassword, InputSearch, TextArea } from '@input-source/input/index.ts';
import { computed, ref } from 'vue';

const props = defineProps({ family: String, report: Function, options: Object });
const families = { Input, TextArea, InputPassword, InputSearch };
const component = computed(() => families[props.family]);
const model = ref('');
defineExpose({ model });
</script>
<template>
  <component :is="component" v-bind="options" v-model:value="model" aria-label="Template native editor"
    @input="report('input',$event)" @change="report('change',$event)" @change.once="report('changeOnce',$event)"
    @focus="report('focus',$event)" @blur="report('blur',$event)"
    @keydown="report('keydown',$event)" @keyup="report('keyup',$event)" @mousedown="report('mousedown',$event)"
    @compositionstart="report('compositionstart',$event)" @compositionend="report('compositionend',$event)"
    @press-enter="report('pressEnter',$event)" @press-enter.once="report('pressEnterOnce',$event)"
    @clear="report('clear',$event)" @clear.once="report('clearOnce',$event)" />
</template>
