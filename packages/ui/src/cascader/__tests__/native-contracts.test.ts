import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import Cascader from '../Cascader';
import { useOptions } from '../hooks/values';
import Panel from '../Panel';
import { type BaseOptionType, fillFieldNames, toPathKey } from '../utils';

const LEAVES = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

it('preserves zero and currently missing paths in the visible value', async () => {
  const zero = mount(Cascader, {
    props: { options: [{ value: 0, label: 'Zero' }], defaultValue: 0 },
  });
  expect(zero.text()).toContain('Zero');
  zero.unmount();
  const missing = mount(Cascader, { props: { options: LEAVES, value: ['missing'] } });
  expect(missing.text()).toContain('missing');
  missing.unmount();
});

it('keeps the accepted Panel value after a rejected controlled request and release', async () => {
  const w = mount(Panel, { props: { options: LEAVES, value: ['b'] } });
  await w.get('.apollo-cascader-menu-item').trigger('click');
  expect(w.emitted('update:value')).toEqual([[['a']]]);
  await w.setProps({ value: undefined });
  await settle();
  expect(
    w.findAll('.apollo-cascader-menu-item').map((row) => row.attributes('aria-checked')),
  ).toEqual(['false', 'true']);
  w.unmount();
});

it('emits one consistent empty multiple payload for clear', async () => {
  const change = vi.fn();
  const w = mount(Cascader, {
    props: { options: LEAVES, multiple: true, defaultValue: [['a']], onChange: change },
  });
  await w.get('.apollo-cascader-clear').trigger('click');
  expect(w.emitted('update:value')?.at(-1)).toEqual([[]]);
  expect(change).toHaveBeenCalledExactlyOnceWith([], []);
  w.unmount();
});

it('applies the checked display strategy while retaining actual checked descendants', () => {
  const w = mount(Cascader, {
    props: {
      multiple: true,
      defaultValue: [['a']],
      options: [
        {
          value: 'a',
          label: 'Parent',
          children: [
            { value: 'a1', label: 'First' },
            { value: 'a2', label: 'Second' },
          ],
        },
      ],
    },
  });
  expect(w.findAll('.apollo-cascader-selection-item')).toHaveLength(1);
  expect(w.text()).toContain('Parent');
  w.unmount();
});

it('distinguishes typed values and separator-containing paths', () => {
  expect(toPathKey([0])).not.toBe(toPathKey(['0']));
  expect(toPathKey(['a', 'b'])).not.toBe(toPathKey(['a__RC_CASCADER_SPLIT__b']));
  const w = mount(Panel, {
    props: {
      multiple: true,
      value: [[0]],
      options: [
        { value: 0, label: 'Numeric' },
        { value: '0', label: 'String' },
      ],
    },
  });
  expect(
    w.findAll('.apollo-cascader-menu-item').map((row) => row.attributes('aria-checked')),
  ).toEqual(['true', 'false']);
  w.unmount();
});

it('rebuilds entities for current field names and in-place option changes', () => {
  const options = ref<BaseOptionType[]>([{ value: 'a', code: 'x' }]);
  const fields = ref(fillFieldNames());
  const { getPathKeyEntities } = useOptions(fields, options);
  expect(getPathKeyEntities()[toPathKey(['a'])]).toBeDefined();
  fields.value = fillFieldNames({ value: 'code' });
  expect(getPathKeyEntities()[toPathKey(['x'])]).toBeDefined();
  options.value.push({ value: 'b', code: 'y' });
  expect(getPathKeyEntities()[toPathKey(['y'])]).toBeDefined();
});

it('uses Vue-owned notifications, including listener arrays, exactly once', async () => {
  const scroll = vi.fn();
  const first = vi.fn();
  const second = vi.fn();
  const w = mount(Cascader, {
    props: { options: LEAVES, open: true },
    attrs: { onChange: [first, second], onPopupScroll: scroll },
  });
  await settle();
  await w.get('.apollo-cascader-menu-item').trigger('click');
  expect(w.emitted('change')).toEqual([[['a'], [LEAVES[0]]]]);
  expect(first).toHaveBeenCalledExactlyOnceWith(['a'], [LEAVES[0]]);
  expect(second).toHaveBeenCalledExactlyOnceWith(['a'], [LEAVES[0]]);
  await w.get('.apollo-cascader-menu').trigger('scroll');
  expect(w.emitted('popupScroll')).toHaveLength(1);
  expect(scroll).toHaveBeenCalledOnce();
  w.unmount();
});

it('navigates nested options using modern keyboard events on the actual input', async () => {
  const w = mount(Cascader, {
    props: {
      options: [{ value: 'a', label: 'Parent', children: [{ value: 'a1', label: 'Leaf' }] }],
      open: true,
    },
  });
  await settle();
  const input = w.get('input');
  await input.trigger('keydown', { key: 'ArrowDown' });
  await input.trigger('keydown', { key: 'ArrowRight' });
  await input.trigger('keydown', { key: 'Enter' });
  expect(w.emitted('update:value')?.at(-1)).toEqual([['a', 'a1']]);
  w.unmount();
});

it('connects standalone Panel native attrs, keyboard and disabled state', async () => {
  const keydown = vi.fn();
  const w = mount(Panel, {
    props: { options: LEAVES },
    attrs: { id: 'static-cascader', 'aria-label': 'Choose one', onKeydown: keydown },
  });
  expect(w.attributes('id')).toBe('static-cascader');
  expect(w.attributes('tabindex')).toBe('0');
  await w.trigger('keydown', { key: 'ArrowDown' });
  await w.trigger('keydown', { key: 'Enter' });
  expect(w.emitted('update:value')?.at(-1)).toEqual([['a']]);
  expect(keydown).toHaveBeenCalledTimes(2);
  w.unmount();
});

it('preserves all custom trigger content', () => {
  const w = mount(Cascader, {
    props: { options: LEAVES },
    slots: { default: () => [h('button', 'Choose'), h('i', 'Extra'), '0'] },
  });
  expect(w.text()).toBe('ChooseExtra0');
  w.unmount();
});

it('reads current eight component tokens and Provider styles at their actual targets', async () => {
  const width = shallowRef(277);
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            theme: { components: { Cascader: { controlWidth: width.value } } },
            components: { cascader: { className: 'configured' } },
          },
          { default: () => h(Cascader, { options: LEAVES }) },
        ),
    }),
  );
  const root = w.get('.apollo-cascader');
  expect(root.classes()).toContain('configured');
  expect(root.attributes('style')).toContain('--apollo-cascader-control-width: 277px');
  width.value = 311;
  await settle();
  expect(root.attributes('style')).toContain('--apollo-cascader-control-width: 311px');
  w.unmount();
});

it('does not duplicate an unfinished load request for the same path', async () => {
  const load = vi.fn(() => new Promise<void>(() => {}));
  const w = mount(Panel, {
    props: { options: [{ value: 'a', label: 'Async', isLeaf: false }], loadData: load },
  });
  await w.get('.apollo-cascader-menu-item').trigger('click');
  await w.get('.apollo-cascader-menu-item').trigger('click');
  expect(load).toHaveBeenCalledTimes(1);
  w.unmount();
});

it('keeps the real popup and editor identity across Provider, models and conditional compiled slots', async () => {
  const { default: NativeCascader } = await import('./fixtures/NativeCascader.vue');
  const w = mount(NativeCascader, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  await settle();
  expect(document.querySelector('.native-option')?.textContent).toBe('Parent:1');
  const draft = document.querySelector<HTMLInputElement>('[data-panel-draft]');
  expect(draft).not.toBeNull();
  if (!draft) throw new Error('Panel draft not mounted');
  draft.value = 'keep draft';
  draft.focus();
  draft.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await w.setProps({ decorate: false, width: 299 });
  await settle();
  expect(document.querySelector('[data-panel-draft]')).toBe(draft);
  expect(document.activeElement).toBe(draft);
  expect(draft.value).toBe('keep draft');
  expect(document.querySelector('.native-option')).toBeNull();
  expect(document.querySelector('.apollo-cascader-menu-item-content')?.textContent).toBe('Parent');
  const parent = document.querySelector<HTMLElement>('.apollo-cascader-menu-item');
  parent?.click();
  await settle();
  const leaf = Array.from(
    document.querySelectorAll<HTMLElement>('.apollo-cascader-menu-item'),
  ).find((row) => row.textContent === 'Zero');
  leaf?.click();
  await settle();
  expect(w.vm.value).toEqual(['parent', 0]);
  expect(w.vm.open).toBe(false);
  expect(w.get('.native-display').text()).toBe('Parent > Zero');
  w.unmount();
  expect(document.querySelector('[data-panel-draft]')).toBeNull();
});

it('retains current controlled value, open and search after rejected requests and release', async () => {
  const w = mount(Cascader, {
    props: { options: LEAVES, value: ['b'], open: true, showSearch: true, searchValue: 'A' },
  });
  await settle();
  await w.get('input').setValue('Alpha');
  expect(w.emitted('update:searchValue')?.at(-1)).toEqual(['Alpha']);
  await w.get('.apollo-cascader-menu-item').trigger('click');
  expect(w.emitted('update:value')?.at(-1)).toEqual([['a']]);
  expect(w.emitted('update:open')?.at(-1)).toEqual([false]);
  await w.setProps({ value: undefined, open: undefined, searchValue: undefined });
  expect(w.get('input').element.value).toBe('A');
  expect(w.text()).toContain('Beta');
  expect(w.find('.apollo-cascader-menu').exists()).toBe(true);
  w.unmount();
});

it('keeps inherited state and full native attrs on a custom trigger and public ref', async () => {
  const keydown = vi.fn(),
    keyup = vi.fn();
  const w = mount(Cascader, {
    props: { options: LEAVES, id: 'raw-cascader' },
    attrs: {
      class: ['raw-native', { active: true }],
      style: [{ marginTop: '9px' }],
      onKeydown: keydown,
      onKeyup: keyup,
    },
    slots: { default: () => h('button', { type: 'button' }, 'Choose') },
  });
  const trigger = w.get('#raw-cascader');
  expect(trigger.classes()).toContain('raw-native');
  expect(trigger.attributes('id')).toBe('raw-cascader');
  expect(trigger.attributes('style')).toContain('margin-top: 9px');
  w.vm.focus({ preventScroll: true });
  expect(w.vm.nativeElement).toBe(trigger.element);
  await trigger.trigger('keydown', { key: 'Enter' });
  await settle();
  await trigger.trigger('keyup', { key: 'Enter' });
  expect(w.emitted('update:open')).toEqual([[true]]);
  expect(keydown).toHaveBeenCalledTimes(1);
  expect(keyup).toHaveBeenCalledTimes(1);
  w.unmount();
});

it('updates in-place children, field maps and column style at the actual menu', async () => {
  const options = ref<BaseOptionType[]>([{ value: 'a', code: 0, label: 'Parent', isLeaf: false }]);
  const mapping = ref({ value: 'value' });
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(Panel, {
          options: options.value,
          fieldNames: mapping.value,
          multiple: true,
          value: [[0]],
          popupMenuColumnStyle: { width: '241px' },
          styles: { popup: { listItem: { color: 'red' } } },
        }),
    }),
  );
  mapping.value = { value: 'code' };
  const parent = options.value[0];
  if (!parent) throw new Error('Missing parent fixture');
  parent.children = [{ value: 'child', code: 'typed', label: 'Child' }];
  await settle();
  await w.get('.apollo-cascader-menu-item').trigger('click');
  expect(w.findAll('.apollo-cascader-menu')).toHaveLength(2);
  expect(w.get('.apollo-cascader-menu').attributes('style')).toContain('width: 241px');
  expect(w.get('.apollo-cascader-menu-item').attributes('style')).not.toContain('width');
  expect(
    w.findAll('.apollo-cascader-menu-item').map((row) => row.attributes('aria-checked')),
  ).toEqual(['true', 'true']);
  w.unmount();
});

it('does not check disabled checkboxes from the real keyboard and leaves IME to native listeners', async () => {
  const keydown = vi.fn();
  const w = mount(Cascader, {
    props: {
      options: [
        { value: 'a', label: 'Blocked', disableCheckbox: true },
        { value: 'b', label: 'Allowed' },
      ],
      multiple: true,
      open: true,
    },
    attrs: { onKeydown: keydown },
  });
  await settle();
  const input = w.get('input');
  await input.trigger('keydown', { key: 'ArrowDown', isComposing: true });
  await input.trigger('keydown', { key: 'Enter', isComposing: true });
  expect(w.emitted('update:value')).toBeUndefined();
  await input.trigger('keydown', { key: 'ArrowDown' });
  await input.trigger('keydown', { key: ' ' });
  expect(w.emitted('update:value')).toBeUndefined();
  await input.trigger('keydown', { key: 'ArrowDown' });
  await input.trigger('keydown', { key: ' ' });
  expect(w.emitted('update:value')?.at(-1)).toEqual([[['b']]]);
  expect(keydown).toHaveBeenCalledTimes(6);
  w.unmount();
});

it('settles rejected lazy loads visibly, permits a retry and avoids updates after unmount', async () => {
  let rejectLoad: (error: Error) => void = () => {
    throw new Error('Load not started');
  };
  const failure = new Error('Known load failure');
  const errors = vi.fn();
  const load = vi.fn(
    () =>
      new Promise<void>((_resolve, reject) => {
        rejectLoad = reject;
      }),
  );
  const w = mount(Panel, {
    props: { options: [{ value: '__proto__', label: 'Lazy', isLeaf: false }], loadData: load },
    global: { config: { errorHandler: errors } },
  });
  await w.get('.apollo-cascader-menu-item').trigger('click');
  await w.get('.apollo-cascader-menu-item').trigger('click');
  expect(load).toHaveBeenCalledTimes(1);
  rejectLoad(failure);
  await settle();
  expect(errors).toHaveBeenCalledOnce();
  expect(errors.mock.calls[0]?.[0]).toBe(failure);
  expect(w.find('.apollo-cascader-menu-item-loading').exists()).toBe(false);
  await w.get('.apollo-cascader-menu-item').trigger('click');
  expect(load).toHaveBeenCalledTimes(2);
  w.unmount();
  rejectLoad(failure);
  await settle();
  expect(errors).toHaveBeenCalledTimes(2);
});

it('keeps popup presentation on the real shared transport when using a custom trigger', async () => {
  const w = mount(Cascader, {
    props: {
      options: LEAVES,
      open: true,
      popupClassName: 'native-raw-popup',
      popupStyle: { zIndex: 1630, backgroundColor: 'pink' },
      popupMatchSelectWidth: 320,
    },
    slots: { default: () => h('button', { type: 'button' }, 'Custom') },
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  await settle();
  const popup = document.querySelector<HTMLElement>('.native-raw-popup');
  expect(popup).not.toBeNull();
  expect(popup?.style.zIndex).toBe('1630');
  expect(popup?.style.backgroundColor).toBe('pink');
  expect(popup?.style.width).toBe('320px');
  w.unmount();
});

it('retains native search editing and inherited multiple-tag keyboard removal', async () => {
  const w = mount(Cascader, {
    props: { options: LEAVES, multiple: true, open: true, defaultValue: [['a'], ['b']] },
  });
  await settle();
  await w.get('input').trigger('keydown', { key: 'Backspace' });
  expect(w.emitted('update:value')?.at(-1)).toEqual([[['a']]]);
  await w.get('input').setValue('Alpha');
  const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
  w.get('input').element.dispatchEvent(space);
  expect(space.defaultPrevented).toBe(false);
  w.unmount();
});
