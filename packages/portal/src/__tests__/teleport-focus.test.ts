import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, onUpdated, shallowRef } from 'vue';
import { Portal } from '../portal';

const wrappers: { unmount(): void }[] = [];
afterEach(() => {
  for (const w of wrappers.splice(0)) w.unmount();
  document.body.innerHTML = '';
});
for (const shadow of [false, true])
  describe(`Portal owned focus ${shadow ? 'ShadowRoot' : 'Document'}`, () => {
    it('moves the same native editor with draft, selection and focus', async () => {
      const left = document.createElement('div'),
        right = document.createElement('div');
      document.body.append(left, right);
      const from = shadow ? left.attachShadow({ mode: 'open' }) : left,
        to = shadow ? right.attachShadow({ mode: 'open' }) : right;
      const target = shallowRef<Element | ShadowRoot>(from);
      const w = mount(
        () =>
          h(Portal, { open: true, getContainer: () => target.value }, () =>
            h('input', { 'aria-label': 'Owned editor' }),
          ),
        { attachTo: document.body, global: { stubs: { teleport: false } } },
      );
      wrappers.push(w);
      await nextTick();
      const input = from.querySelector('input');
      expect(input).not.toBeNull();
      if (!input) throw Error('Missing native editor');
      input.value = 'business draft';
      input.focus();
      input.setSelectionRange(2, 5);
      for (const next of [to, from, to]) {
        target.value = next;
        await nextTick();
        await nextTick();
        expect(next.querySelector('input')).toBe(input);
        expect(input.value).toBe('business draft');
        expect(input.selectionStart).toBe(2);
        expect(input.selectionEnd).toBe(5);
        expect(
          shadow && next instanceof ShadowRoot ? next.activeElement : document.activeElement,
        ).toBe(input);
      }
    });
  });

it('keeps focus with its owning range when two Portals share a target', async () => {
  const left = document.createElement('div'),
    right = document.createElement('div');
  document.body.append(left, right);
  const target = shallowRef<Element>(left);
  const w = mount(
    () =>
      h('div', [
        h(Portal, { open: true, getContainer: () => target.value }, () =>
          h('input', { id: 'owned-one' }),
        ),
        h(Portal, { open: true, getContainer: () => target.value }, () =>
          h('input', { id: 'owned-two' }),
        ),
      ]),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  wrappers.push(w);
  await nextTick();
  const input = left.querySelector<HTMLInputElement>('#owned-one');
  if (!input) throw Error('Missing first editor');
  input.focus();
  target.value = right;
  await nextTick();
  await nextTick();
  expect(document.activeElement).toBe(input);
  expect(right.querySelectorAll('input')).toHaveLength(2);
});
it.each([false, true])(
  'does not replace an intentional outside focus during the update (crossDocument=%s)',
  async (crossDocument) => {
    const left = document.createElement('div'),
      right = document.createElement('div'),
      outside = document.createElement('input');
    document.body.append(left, right, outside);
    const target = shallowRef<Element>(left);
    let destination: Element = right;
    if (crossDocument) {
      const frame = document.createElement('iframe');
      document.body.append(frame);
      if (!frame.contentDocument) throw Error('Missing frame document');
      destination = frame.contentDocument.body;
    }

    const Child = defineComponent({
      props: { target: { type: Object, required: true } },
      setup() {
        onUpdated(() => outside.focus());
        return () => h('input', { 'data-owned': '' });
      },
    });
    const w = mount(
      () =>
        h(Portal, { open: true, getContainer: () => target.value }, () =>
          h(Child, { target: target.value }),
        ),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    wrappers.push(w);
    await nextTick();
    const input = left.querySelector('input');
    if (!input) throw Error('Missing native editor');
    input.focus();
    target.value = destination;
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(outside);
  },
);
it('moves the focused editor to another same-origin document', async () => {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const other = frame.contentDocument;
  if (!other) throw Error('Missing same-origin document');
  const left = document.createElement('div');
  document.body.append(left);
  const target = shallowRef<Element>(left);
  const w = mount(
    () =>
      h(Portal, { open: true, getContainer: () => target.value }, () =>
        h('input', { 'aria-label': 'Cross-document editor' }),
      ),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  wrappers.push(w);
  await nextTick();
  const input = left.querySelector('input');
  if (!input) throw Error('Missing native editor');
  input.focus();
  input.value = 'Cross document draft';
  target.value = other.body;
  await nextTick();
  await nextTick();
  expect(other.querySelector('input')).toBe(input);
  expect(other.activeElement).toBe(input);
  expect(input.value).toBe('Cross document draft');
});
it('does not undo a deliberate blur during an ordinary child update', async () => {
  const stage = shallowRef(0);
  const Child = defineComponent({
    props: { stage: Number },
    setup() {
      const input = shallowRef<HTMLInputElement | null>(null);
      onUpdated(() => input.value?.blur());
      return () => h('input', { ref: input });
    },
  });
  const w = mount(() => h(Portal, { open: true }, () => h(Child, { stage: stage.value })), {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  wrappers.push(w);
  await nextTick();
  const input = document.querySelector('input');
  if (!input) throw Error('Missing native editor');
  input.focus();
  stage.value++;
  await nextTick();
  expect(document.activeElement).toBe(document.body);
});
it('moving an inactive frame subtree does not take focus from its parent document', async () => {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const doc = frame.contentDocument;
  if (!doc) throw Error('Missing frame document');
  const to = document.createElement('div'),
    outside = document.createElement('input');
  document.body.append(to, outside);
  const target = shallowRef<Element>(doc.body);
  const w = mount(
    () =>
      h(Portal, { open: true, getContainer: () => target.value }, () =>
        h('input', { 'aria-label': 'Inactive frame editor' }),
      ),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  wrappers.push(w);
  await nextTick();
  const input = doc.querySelector('input');
  if (!input) throw Error('Missing popup editor');
  input.focus();
  outside.focus();
  target.value = to;
  await nextTick();
  await nextTick();
  expect(to.querySelector('input')).toBe(input);
  expect(document.activeElement).toBe(outside);
});
