<script setup lang="ts">
import { Image } from '../../../index';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const exactMouse = <T>(event: T, ..._check: Equal<T, MouseEvent> extends true ? [] : [never]) =>
  event;
const exactError = <T>(event: T, ..._check: Equal<T, Event> extends true ? [] : [never]) => event;
const exactKey = <T>(event: T, ..._check: Equal<T, KeyboardEvent> extends true ? [] : [never]) =>
  event;
const exactBoolean = <T>(value: T, ..._check: Equal<T, boolean> extends true ? [] : [never]) =>
  value;

defineProps<{
  preview: boolean;
  click: (event: MouseEvent) => void;
  clickOnce: (event: MouseEvent) => void;
  error: (event: Event) => void;
  errorOnce: (event: Event) => void;
  keydown: (event: KeyboardEvent) => void;
  keydownOnce: (event: KeyboardEvent) => void;
  opened: (open: boolean) => void;
  bubble: (event: MouseEvent | KeyboardEvent) => void;
}>();
</script>

<template>
  <section @click="bubble" @keydown="bubble">
    <Image
      :preview="preview"
      alt="Typed native events"
      @click.stop="event => click(exactMouse(event))"
      @click.once="event => clickOnce(exactMouse(event))"
      @error="event => error(exactError(event))"
      @error.once="event => errorOnce(exactError(event))"
      @keydown.stop.prevent="event => keydown(exactKey(event))"
      @keydown.once="event => keydownOnce(exactKey(event))"
      @update:open="value => opened(exactBoolean(value))"
    />
  </section>
</template>
