import { mount } from '@vue/test-utils';
import { afterEach, expect, it } from 'vitest';
import { h, nextTick, ref } from 'vue';
import { Portal } from '../portal';

const wrappers: { unmount(): void }[] = [];
afterEach(() => {
  for (const w of wrappers.splice(0)) w.unmount();
  document.body.innerHTML = '';
});
it('current autoDestroy controls retained content and destroying an already closed subtree', async () => {
  const open = ref(true),
    destroy = ref(true);
  const w = mount(
    () =>
      h(Portal, { open: open.value, autoDestroy: destroy.value }, () =>
        h('input', { 'aria-label': 'Retained editor' }),
      ),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  wrappers.push(w);
  await nextTick();
  const input = document.querySelector('input');
  if (!input) throw Error('Missing editor');
  input.value = 'business draft';
  destroy.value = false;
  await nextTick();
  open.value = false;
  await nextTick();
  expect(document.querySelector('input')).toBe(input);
  expect(input.value).toBe('business draft');
  destroy.value = true;
  await nextTick();
  expect(document.querySelector('input')).toBeNull();
  destroy.value = false;
  await nextTick();
  expect(document.querySelector('input')).toBeNull();
  open.value = true;
  await nextTick();
  const next = document.querySelector('input');
  expect(next).not.toBe(input);
  expect(next?.value).toBe('');
});
