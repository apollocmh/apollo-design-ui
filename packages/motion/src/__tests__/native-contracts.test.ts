import { mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { createCommentVNode, defineComponent, Fragment, h, nextTick, ref } from 'vue';
import { CSSMotion } from '../css-motion';
import { diffKeys } from '../diff';
import { MotionList, type MotionListSlotProps } from '../motion-list';

vi.unmock('@apollo-design/motion');
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

it('delivers the current owned visibleChanged listeners through Vue once', async () => {
  const first = vi.fn(),
    second = vi.fn();
  const w = mount(CSSMotion, {
    props: { visible: true, supportMotion: false },
    attrs: { onVisibleChanged: [first, second] },
    slots: { default: () => h('div', 'Content') },
  });
  await settle();
  expect(w.emitted('visibleChanged')).toEqual([[true]]);
  expect(first).toHaveBeenCalledExactlyOnceWith(true);
  expect(second).toHaveBeenCalledExactlyOnceWith(true);
  const replacement = vi.fn();
  await w.setProps({ onVisibleChanged: replacement, visible: false });
  await settle();
  expect(replacement).toHaveBeenCalledExactlyOnceWith(false);
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
  w.unmount();
});

it('merges real root attrs with slot class/style/listeners and preserves the slot ref', async () => {
  const ownClick = vi.fn(),
    externalClick = vi.fn();
  const target = ref<Element | null>(null);
  const w = mount(CSSMotion, {
    props: { visible: true, supportMotion: false },
    attrs: {
      id: 'motion-root',
      class: ['outside', { current: true }],
      style: [{ color: 'red' }],
      onClick: externalClick,
    },
    slots: {
      default: () =>
        h(
          'button',
          { ref: target, class: 'inside', style: { marginTop: '8px' }, onClick: ownClick },
          'Content',
        ),
    },
  });
  const button = w.get('button');
  expect(button.attributes('id')).toBe('motion-root');
  expect(button.classes()).toEqual(expect.arrayContaining(['inside', 'outside', 'current']));
  expect(button.attributes('style')).toContain('margin-top: 8px');
  expect(button.attributes('style')).toContain('color: red');
  expect(target.value).toBe(button.element);
  await button.trigger('click');
  expect(ownClick).toHaveBeenCalledOnce();
  expect(externalClick).toHaveBeenCalledOnce();
  w.unmount();
  expect(target.value).toBeNull();
});

it('recognizes the single element inside native Fragment/comment slots without a layout host', () => {
  const w = mount(CSSMotion, {
    props: { visible: true, supportMotion: false },
    slots: {
      default: () => [
        createCommentVNode('conditional'),
        h(Fragment, [h('section', { id: 'actual-motion' }, [h('b', 'Full'), ' content', 0])]),
      ],
    },
  });
  expect(w.get('#actual-motion').text()).toBe('Full content0');
  expect(w.findAll('section')).toHaveLength(1);
  expect(w.find('section').element.parentElement).toBe(w.element.parentElement);
  w.unmount();
});

it('updates forceRender, removeOnLeave and leavedClassName from current props', async () => {
  const w = mount(CSSMotion, {
    props: { visible: false, supportMotion: false },
    slots: { default: ({ className, style }) => h('div', { class: className, style }, 'Kept') },
  });
  expect(w.find('div').exists()).toBe(false);
  await w.setProps({ forceRender: true });
  expect(w.get('div').attributes('style')).toContain('display: none');
  await w.setProps({ visible: true, forceRender: false });
  await w.setProps({ visible: false, removeOnLeave: false, leavedClassName: 'current-left' });
  expect(w.get('div').classes()).toContain('current-left');
  await w.setProps({ leavedClassName: 'next-left' });
  expect(w.get('div').classes()).toContain('next-left');
  w.unmount();
});

it('uses current phase flags and hook functions for subsequent transitions', async () => {
  vi.useFakeTimers();
  const oldStart = vi.fn(() => ({ height: 10 })),
    newStart = vi.fn(() => ({ height: 30 }));
  const w = mount(CSSMotion, {
    props: {
      visible: false,
      motionName: 'native-motion',
      supportMotion: true,
      motionAppear: false,
      motionEnter: false,
      hooks: { onEnterStart: oldStart },
    },
    slots: { default: ({ className, style }) => h('div', { class: className, style }) },
  });
  await w.setProps({ motionEnter: true, hooks: { onEnterStart: newStart }, visible: true });
  await settle();
  await vi.advanceTimersByTimeAsync(100);
  expect(newStart).toHaveBeenCalledOnce();
  expect(oldStart).not.toHaveBeenCalled();
  expect(w.get('div').classes()).toContain('native-motion-enter-active');
  const veto = vi.fn(() => false);
  await w.setProps({ hooks: { onEnterEnd: veto } });
  await w.get('div').trigger('transitionend');
  expect(veto).toHaveBeenCalledOnce();
  expect(w.get('div').classes()).toContain('native-motion-enter-active');
  const accept = vi.fn(() => true);
  await w.setProps({ hooks: { onEnterEnd: accept } });
  await w.get('div').trigger('transitionend');
  expect(accept).toHaveBeenCalledOnce();
  expect(w.get('div').classes()).not.toContain('native-motion-enter-active');
  await w.setProps({ visible: false, motionLeave: false });
  expect(w.find('div').exists()).toBe(false);
  w.unmount();
});

it('uses a current deadline instead of a setup snapshot', async () => {
  vi.useFakeTimers();
  const w = mount(CSSMotion, {
    props: {
      visible: true,
      motionName: 'native-motion',
      supportMotion: true,
      motionAppear: false,
      motionDeadline: 0,
    },
    slots: { default: ({ className, style }) => h('div', { class: className, style }) },
  });
  await w.setProps({ motionDeadline: 20, visible: false });
  await settle();
  await vi.advanceTimersByTimeAsync(160);
  expect(w.find('div').exists()).toBe(false);
  expect(w.emitted('visibleChanged')).toEqual([[true], [false]]);
  w.unmount();
});

it('settles a key once without motion and updates live key payloads', async () => {
  const allRemoved = vi.fn(),
    visibleChanged = vi.fn();
  const keys = ref([{ key: 'a', title: 'First' }]);
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          MotionList,
          {
            keys: keys.value,
            supportMotion: false,
            component: false,
            onAllRemoved: allRemoved,
            onVisibleChanged: visibleChanged,
          },
          {
            default: ({ itemKey, title }: MotionListSlotProps<{ key: string; title: string }>) =>
              h('div', { 'data-key': itemKey }, title),
          },
        ),
    }),
  );
  keys.value[0] = { key: 'a', title: 'Current' };
  await settle();
  expect(w.text()).toBe('Current');
  keys.value = [];
  await settle();
  expect(w.find('[data-key]').exists()).toBe(false);
  expect(allRemoved).toHaveBeenCalledOnce();
  keys.value = [{ key: 'a', title: 'Readded' }];
  await settle();
  expect(w.text()).toBe('Readded');
  keys.value = [];
  await settle();
  expect(allRemoved).toHaveBeenCalledTimes(2);
  expect(visibleChanged.mock.calls).toEqual([[true], [false], [true], [false]]);
  w.unmount();
});

it('supports the documented null/functional wrapper and native wrapper attrs', () => {
  const Functional = (
    attrs: Record<string, unknown>,
    { slots }: { slots: { default?: () => import('vue').VNodeChild } },
  ) => h('section', attrs, [slots.default?.()]);
  const wrapped = mount(MotionList, {
    props: { keys: ['a'], supportMotion: false, component: Functional },
    attrs: { id: 'motion-list' },
    slots: { default: () => h('span', 'Item') },
  });
  expect(wrapped.get('section').attributes('id')).toBe('motion-list');
  expect(wrapped.get('section span').text()).toBe('Item');
  wrapped.unmount();
  const fragment = mount(MotionList, {
    props: { keys: ['a'], supportMotion: false, component: null },
    slots: { default: () => h('span', 'Item') },
  });
  expect(fragment.find('div').exists()).toBe(false);
  expect(fragment.get('span').text()).toBe('Item');
  fragment.unmount();
});

it('retains the diff order and treats prototype property names as ordinary keys', () => {
  expect(diffKeys(['other', 'constructor'], ['constructor', 'other'])).toEqual([
    { key: 'constructor', status: 'keep' },
    { key: 'other', status: 'keep' },
  ]);
  expect(diffKeys(['other', '__proto__'], ['__proto__', 'other'])).toEqual([
    { key: '__proto__', status: 'keep' },
    { key: 'other', status: 'keep' },
  ]);
});

it('removes finished list entries even when a CSSMotion would retain its element', async () => {
  const w = mount(MotionList, {
    props: {
      keys: ['a'],
      supportMotion: false,
      removeOnLeave: false,
      leavedClassName: 'kept',
      forceRender: true,
    },
    slots: {
      default: ({ itemKey, className, style }) =>
        h('div', { 'data-key': itemKey, class: className, style }),
    },
  });
  await w.setProps({ keys: [] });
  await settle();
  expect(w.find('[data-key]').exists()).toBe(false);
  expect(w.emitted('allRemoved')).toEqual([[]]);
  w.unmount();
});

it('cancels a pending leave when its key is reintroduced without losing content or identity', async () => {
  vi.useFakeTimers();
  const w = mount(MotionList, {
    props: {
      keys: [{ key: 'a', title: 'First' }],
      motionName: 'native-motion',
      supportMotion: true,
      motionAppear: false,
      motionDeadline: 30,
    },
    slots: {
      default: ({ itemKey, title, className, style }) =>
        h('div', { 'data-key': itemKey, class: className, style }, String(title)),
    },
  });
  const element = w.get('[data-key]').element;
  await w.setProps({ keys: [] });
  await settle();
  await w.setProps({ keys: [{ key: 'a', title: 'Returned' }] });
  await vi.advanceTimersByTimeAsync(200);
  expect(w.get('[data-key]').element).toBe(element);
  expect(w.text()).toBe('Returned');
  expect(w.emitted('allRemoved')).toBeUndefined();
  await w.setProps({ keys: [] });
  await vi.advanceTimersByTimeAsync(200);
  expect(w.find('[data-key]').exists()).toBe(false);
  expect(w.emitted('allRemoved')).toEqual([[]]);
  w.unmount();
});

it('binds the current animated element and detaches the replaced element and unmount listeners', async () => {
  vi.useFakeTimers();
  const replacement = ref(false);
  const w = mount(CSSMotion, {
    props: { visible: true, motionName: 'native-motion', supportMotion: true },
    slots: {
      default: ({ className, style }) =>
        h(replacement.value ? 'section' : 'div', { class: className, style }, 'Moving'),
    },
  });
  await settle();
  await vi.advanceTimersByTimeAsync(100);
  const original = w.get('div').element;
  const remove = vi.spyOn(original, 'removeEventListener');
  replacement.value = true;
  await settle();
  const current = w.get('section').element;
  const currentRemove = vi.spyOn(current, 'removeEventListener');
  original.dispatchEvent(new Event('transitionend', { bubbles: true }));
  await settle();
  expect(w.emitted('visibleChanged')).toBeUndefined();
  current.dispatchEvent(new Event('transitionend', { bubbles: true }));
  await settle();
  expect(w.emitted('visibleChanged')).toEqual([[true]]);
  expect(remove).toHaveBeenCalledWith('transitionend', expect.any(Function));
  w.unmount();
  expect(currentRemove).toHaveBeenCalledWith('transitionend', expect.any(Function));
});

it('reports a rejected preparation to Vue and releases the motion instead of keeping resources pending', async () => {
  vi.useFakeTimers();
  const failure = new Error('Preparation failed');
  const errors = vi.fn();
  let rejectPrepare: (error: Error) => void = () => {
    throw new Error('Preparation did not start');
  };
  const w = mount(CSSMotion, {
    props: {
      visible: true,
      motionName: 'native-motion',
      supportMotion: true,
      motionDeadline: 500,
      hooks: {
        onAppearPrepare: () =>
          new Promise<void>((_resolve, reject) => {
            rejectPrepare = reject;
          }),
      },
    },
    global: { config: { errorHandler: errors } },
    slots: { default: ({ className, style }) => h('div', { class: className, style }, 'Content') },
  });
  await settle();
  rejectPrepare(failure);
  await vi.advanceTimersByTimeAsync(100);
  expect(errors).toHaveBeenCalledOnce();
  expect(errors.mock.calls[0]?.[0]).toBe(failure);
  expect(w.get('div').classes()).not.toContain('native-motion-appear-prepare');
  expect(vi.getTimerCount()).toBe(0);
  w.unmount();
});

it('supports compiled native slots, conditional emptiness, refs and list notifications', async () => {
  const { default: NativeMotion } = await import('./fixtures/NativeMotion.vue');
  const w = mount(NativeMotion);
  expect(w.vm.node).toBe(w.get('button').element);
  expect(w.get('button').classes()).toEqual(expect.arrayContaining(['slot-root', 'external-root']));
  expect(w.get('button').text()).toBe('Full content 0');
  expect(w.vm.changed).toEqual([true]);
  w.vm.renderContent = false;
  await settle();
  expect(w.find('button').exists()).toBe(false);
  w.vm.renderContent = true;
  await settle();
  expect(w.vm.node).toBe(w.get('button').element);
  w.vm.visible = false;
  await settle();
  expect(w.find('button').exists()).toBe(false);
  expect(w.vm.changed).toEqual([true, false]);
  w.vm.keys = [];
  await settle();
  expect(w.find('article').exists()).toBe(false);
  expect(w.vm.removals).toBe(1);
  w.unmount();
});

it('does not discard multiple animated roots or add a synthetic host', () => {
  expect(() =>
    mount(CSSMotion, {
      props: { visible: true, supportMotion: false },
      slots: { default: () => [h('section', 'First'), h('aside', 'Second')] },
    }),
  ).toThrow('multiple roots');
});

it('retains the last received shallow metadata snapshot throughout leave', async () => {
  vi.useFakeTimers();
  const row = { key: 'a', title: 'Last received' };
  const w = mount(MotionList<typeof row>, {
    props: {
      keys: [row],
      motionName: 'native-motion',
      motionAppear: false,
      supportMotion: true,
      motionDeadline: 30,
    },
    slots: {
      default: ({ itemKey, title, className, style }: MotionListSlotProps<typeof row>) =>
        h('div', { 'data-key': itemKey, class: className, style }, title),
    },
  });
  await w.setProps({ keys: [] });
  row.title = 'Mutated after removal';
  await vi.advanceTimersByTimeAsync(40);
  expect(w.text()).toBe('Last received');
  await vi.advanceTimersByTimeAsync(120);
  expect(w.find('[data-key]').exists()).toBe(false);
  w.unmount();
});

it('applies the actual default schema before mounting the generic component', async () => {
  const w = mount(MotionList, {
    props: { keys: ['a'] },
    attrs: { id: 'default-motion-list' },
    slots: {
      default: ({ itemKey }: MotionListSlotProps) =>
        h('span', { 'data-key': itemKey }, 'Default item'),
    },
  });
  expect(w.get('#default-motion-list').element.tagName).toBe('DIV');
  expect(w.get('[data-key]').text()).toBe('Default item');
  expect(w.emitted('visibleChanged')).toEqual([[true]]);
  await w.setProps({ keys: [] });
  await settle();
  expect(w.find('[data-key]').exists()).toBe(false);
  expect(w.emitted('visibleChanged')).toEqual([[true], [false]]);
  expect(w.emitted('allRemoved')).toEqual([[]]);
  w.unmount();
});
