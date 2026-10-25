<script setup lang="ts">
import { Mentions } from '../../../index';
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const exactKey = <T>(value: T, ..._check: Equal<T, KeyboardEvent> extends true ? [] : [never]) => value;
const exactFocus = <T>(value: T, ..._check: Equal<T, FocusEvent> extends true ? [] : [never]) => value;
defineProps<{
  down: (event: KeyboardEvent) => void;
  up: (event: KeyboardEvent) => void;
  focus: (event: FocusEvent) => void;
  blur: (event: FocusEvent) => void;
  bubble: (event: KeyboardEvent) => void;
}>();
</script>
<template>
  <section @keydown="bubble" @keyup="bubble">
    <Mentions aria-label="Native mentions" @keydown.stop.prevent="event => down(exactKey(event))" @keyup.stop="event => up(exactKey(event))" @focus.once="event => focus(exactFocus(event))" @blur.once="event => blur(exactFocus(event))" />
  </section>
</template>
