<script setup lang="ts">
import { Mentions } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('initial');
const phase = ref(false);
const state = ref({
  focus: 0,
  blur: 0,
  currentFocus: 0,
  currentBlur: 0,
  focusOnce: 0,
  blurOnce: 0,
  input: 0,
  inputOnce: 0,
  down: 0,
  up: 0,
  enter: 0,
  enterOnce: 0,
  scroll: 0,
  scrollOnce: 0,
  resize: 0,
  resizeOnce: 0,
  clear: 0,
  clearOnce: 0,
  bubbles: 0,
  validFocus: true,
  validBlur: true,
  validKeys: true,
  validInput: true,
  validScroll: true,
  validResize: true,
  prevented: false,
});
const focus = (event: FocusEvent) => {
  state.value.validFocus &&=
    event instanceof FocusEvent && event.target instanceof HTMLTextAreaElement;
  if (phase.value) state.value.currentFocus++;
  else state.value.focus++;
};
const blur = (event: FocusEvent) => {
  state.value.validBlur &&=
    event instanceof FocusEvent && event.target instanceof HTMLTextAreaElement;
  if (phase.value) state.value.currentBlur++;
  else state.value.blur++;
};
const down = (event: KeyboardEvent) => {
  state.value.down++;
  state.value.validKeys &&=
    event instanceof KeyboardEvent && event.target instanceof HTMLTextAreaElement;
  if (event.key === 'F2') {
    event.preventDefault();
    state.value.prevented = event.defaultPrevented;
  }
};
const input = (event: Event) => {
  state.value.input++;
  state.value.validInput &&= event instanceof Event && event.target instanceof HTMLTextAreaElement;
};
const resize = (size: { width: number; height: number }) => {
  state.value.resize++;
  state.value.validResize &&= size.width > 0 && size.height > 0;
};
const scroll = (event: Event) => {
  state.value.scroll++;
  state.value.validScroll &&= event.type === 'scroll' && event.target instanceof HTMLUListElement;
};
</script>
<template>
  <button @mousedown.prevent @click="phase = !phase">Replace native listeners</button>
  <button>Leave mentions</button>
  <section @keydown="state.bubbles++" @keyup="state.bubbles++">
    <Mentions v-model:value="value" allow-clear auto-size aria-label="Native mention events" :options="[{ value: 'alpha', label: 'Alpha' }]"
      v-on="{ focus: [focus], blur: [blur], pressEnter: [() => state.enter++], popupScroll: [scroll], resize: [resize], clear: [() => state.clear++] }"
      @focus.once="state.focusOnce++" @blur.once="state.blurOnce++"
      @input="input" @input.once="state.inputOnce++" @keydown.stop="down" @keyup.stop="state.up++"
      @press-enter.once="state.enterOnce++" @popup-scroll.once="state.scrollOnce++"
      @resize.once="state.resizeOnce++" @clear.once="state.clearOnce++" />
  </section>
  <output id="native-mention-events">{{ JSON.stringify(state) }}</output>
</template>
