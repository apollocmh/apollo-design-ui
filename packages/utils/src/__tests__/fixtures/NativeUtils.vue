<script setup lang="ts">
import {
  getElement,
  useComposeRef,
  useControlledValue,
  useDelayState,
  useSafeState,
} from '@apollo-design/utils';
import { type ComponentPublicInstance, ref, shallowRef } from 'vue';

type Target = Element | ComponentPublicInstance;
const first = shallowRef<Target | null>(null);
const swapped = ref(false);
const calls = ref<string[]>([]);
const original = (element: Target | null) => {
  calls.value.push(element ? 'original:set' : 'original:clear');
};
const replacement = (element: Target | null) => {
  calls.value.push(element ? 'replacement:set' : 'replacement:clear');
};
const composed = useComposeRef<Target>(() => [first, swapped.value ? replacement : original]);
const count = ref(1);
const payload = { count };
const [controlled, setControlled] = useControlledValue({
  defaultValue: payload,
  getValue: () => undefined,
});
const [safe, setSafe] = useSafeState(payload);
const [delayed, setDelayed] = useDelayState(payload);
const replace = () => {
  swapped.value = !swapped.value;
  setControlled((current) => ({ count: current.count }));
  setSafe((current) => ({ count: current.count }));
  setDelayed((current) => ({ count: current.count }), true);
};
defineExpose({
  replace,
  element: () => getElement(first.value),
  calls: () => [...calls.value],
  identityValid: () =>
    controlled.value.count === count && safe.value.count === count && delayed.value.count === count,
});
</script>

<template>
  <input :ref="composed" aria-label="Native utils draft" />
  <button type="button" @click="replace">Replace ref recipient</button>
</template>
