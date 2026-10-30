import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, Fragment, h, nextTick, ref, shallowRef } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { MotionThumb } from '../components/MotionThumb';
import { Segmented, type SegmentedValue } from '../index';
import NativeSegmented from './fixtures/NativeSegmented.vue';

const settle = async () => {
  await nextTick();
  await nextTick();
};
vi.unmock('@apollo-design/motion');
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('Segmented native contracts', () => {
  it('emits owned value/change notifications once and restores rejected native radio state', async () => {
    const changed = vi.fn();
    const updated = vi.fn();
    const w = mount(Segmented, {
      props: { options: ['A', 'B'], value: 'A', onChange: changed, 'onUpdate:value': updated },
      attachTo: document.body,
    });
    w.get<HTMLInputElement>('input[value="B"]').element.click();
    await settle();
    expect(changed).toHaveBeenCalledExactlyOnceWith('B');
    expect(updated).toHaveBeenCalledExactlyOnceWith('B');
    expect(w.emitted('change')).toEqual([['B']]);
    expect(w.get<HTMLInputElement>('input[value="A"]').element.checked).toBe(true);
    expect(w.get<HTMLInputElement>('input[value="B"]').element.checked).toBe(false);
    await w.setProps({ value: undefined });
    expect(w.get<HTMLInputElement>('input[value="A"]').element.checked).toBe(true);
    w.get<HTMLInputElement>('input[value="B"]').element.click();
    await settle();
    expect(w.get<HTMLInputElement>('input[value="B"]').element.checked).toBe(true);
    w.unmount();
  });

  it('uses current listener arrays through Vue rather than an attrs callback channel', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const replacement = vi.fn();
    const w = mount(Segmented, {
      props: { options: ['A', 'B', 'C'] },
      attrs: { onChange: [first, second] },
    });
    await w.findAll('input')[1]?.setValue(true);
    expect(first).toHaveBeenCalledExactlyOnceWith('B');
    expect(second).toHaveBeenCalledExactlyOnceWith('B');
    await w.setProps({ onChange: replacement });
    await w.findAll('input')[2]?.setValue(true);
    expect(replacement).toHaveBeenCalledExactlyOnceWith('C');
    expect(first).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('lands native attrs/style/listeners at the real root and submits actual option values', async () => {
    const clicked = vi.fn();
    const w = mount(Segmented, {
      props: { options: [{ value: 0, label: 'Zero', id: 'zero-option' }, 'B'], name: 'period' },
      attrs: {
        id: 'native-segmented',
        title: 'Native root',
        class: ['outside', { active: true }],
        style: ['color: red', { marginTop: '7px' }],
        onClick: clicked,
      },
    });
    expect(w.element.id).toBe('native-segmented');
    expect(w.attributes('title')).toBe('Native root');
    expect(w.classes()).toEqual(expect.arrayContaining(['outside', 'active']));
    expect(w.get<HTMLDivElement>('[role="radiogroup"]').element.style.color).toBe('red');
    expect(w.get<HTMLDivElement>('[role="radiogroup"]').element.style.marginTop).toBe('7px');
    expect(w.get('label').attributes('id')).toBe('zero-option');
    expect(w.get<HTMLInputElement>('input').element.value).toBe('0');
    await w.trigger('click');
    expect(clicked).toHaveBeenCalledOnce();
    w.unmount();
  });

  it('renders full native VNodeChild label/icon data including zero and fragments', () => {
    const w = mount(Segmented, {
      props: {
        options: [
          { value: 0, icon: 0, label: [h('b', 'Full'), h(Fragment, [' content', 0])] },
          { value: 'fragment', label: h(Fragment, [h('i', 'Second'), ' label']) },
        ],
      },
    });
    expect(w.get('.apollo-segmented-item-icon').text()).toBe('0');
    expect(w.findAll('.apollo-segmented-item-label')[0]?.text()).toBe('0Full content0');
    expect(w.findAll('.apollo-segmented-item-label')[1]?.text()).toBe('Second label');
    w.unmount();
  });

  it('keeps the initial accepted selection across reordered/removed options and accepts later-loaded options', async () => {
    const w = mount(Segmented, { props: { options: ['A', 'B'] } });
    const original = w.findAll('input')[0]?.element;
    await w.setProps({ options: ['B', 'A'] });
    expect(w.get<HTMLInputElement>('input[value="A"]').element).toBe(original);
    expect(w.get<HTMLInputElement>('input[value="A"]').element.checked).toBe(true);
    await w.setProps({ options: ['B'] });
    expect(w.get<HTMLInputElement>('input').element.checked).toBe(false);
    expect(w.emitted('change')).toBeUndefined();
    w.unmount();
    const pending = mount(Segmented, { props: { options: [] } });
    await pending.setProps({ options: ['Loaded', 'Next'] });
    expect(pending.get<HTMLInputElement>('input[value="Loaded"]').element.checked).toBe(true);
    expect(pending.emitted('change')).toBeUndefined();
    pending.unmount();
  });

  it('navigates enabled radios with native cancellation/IME and accepted-only focus in current RTL', async () => {
    const rtl = ref(false);
    const deny = ref(false);
    const value = ref<SegmentedValue>('A');
    const cancel = ref(false);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { direction: rtl.value ? 'rtl' : 'ltr' }, () =>
            h(Segmented, {
              options: ['A', { label: 'Skip', value: 'skip', disabled: true }, 'B', 'C'],
              value: value.value,
              onChange: (next) => {
                if (!deny.value) value.value = next;
              },
              onKeydown: (event) => {
                if (cancel.value) event.preventDefault();
              },
            }),
          ),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    const a = w.get<HTMLInputElement>('input[value="A"]');
    a.element.focus();
    expect(w.get<HTMLDivElement>('.apollo-segmented').attributes('tabindex')).toBeUndefined();
    expect(a.attributes('tabindex')).toBe('0');
    await a.trigger('keydown', { key: 'ArrowRight' });
    await settle();
    expect(value.value).toBe('B');
    expect(document.activeElement).toBe(w.get<HTMLInputElement>('input[value="B"]').element);
    rtl.value = true;
    await settle();
    await w.get<HTMLInputElement>('input[value="B"]').trigger('keydown', { key: 'ArrowLeft' });
    await settle();
    expect(value.value).toBe('C');
    deny.value = true;
    await w.get<HTMLInputElement>('input[value="C"]').trigger('keydown', { key: 'ArrowLeft' });
    await settle();
    expect(value.value).toBe('C');
    expect(document.activeElement).toBe(w.get<HTMLInputElement>('input[value="C"]').element);
    deny.value = false;
    cancel.value = true;
    await w.get<HTMLInputElement>('input[value="C"]').trigger('keydown', { key: 'ArrowRight' });
    expect(value.value).toBe('C');
    cancel.value = false;
    await w
      .get<HTMLInputElement>('input[value="C"]')
      .trigger('keydown', { key: 'ArrowRight', isComposing: true });
    expect(value.value).toBe('C');
    w.unmount();
  });

  it('reads current disabled/size/semantic Provider config, component tokens, native style priority and removal', async () => {
    const configured = ref(true);
    const explicit = ref<boolean | undefined>();
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              componentDisabled: configured.value,
              componentSize: configured.value ? 'large' : 'small',
              components: configured.value
                ? {
                    segmented: {
                      classNames: ({ props }: { props: { disabled?: boolean } }) => ({
                        root: props.disabled ? 'from-provider' : 'enabled-provider',
                      }),
                      styles: { label: { fontWeight: 600 } },
                      style: { padding: '9px' },
                    },
                  }
                : undefined,
              theme: configured.value
                ? {
                    components: {
                      Segmented: {
                        trackPadding: '5px',
                        trackBg: 'pink',
                        itemColor: 'navy',
                        itemHoverColor: 'teal',
                        itemHoverBg: 'gold',
                        itemActiveBg: 'orange',
                        itemSelectedBg: 'purple',
                        itemSelectedColor: 'white',
                      },
                    },
                  }
                : undefined,
            },
            () =>
              h(Segmented, {
                options: ['A', 'B'],
                disabled: explicit.value,
                styles: ({ props }) => ({ item: { opacity: props.disabled ? 0.6 : 1 } }),
                style: { padding: '3px' },
              }),
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    const root = () => w.get<HTMLDivElement>('.apollo-segmented');
    expect(w.get<HTMLInputElement>('input').element.disabled).toBe(true);
    expect(root().classes()).toContain('from-provider');
    expect(root().classes()).toContain('apollo-segmented-lg');
    expect(root().element.style.padding).toBe('3px');
    expect(w.get('label').element.style.opacity).toBe('0.6');
    expect(root().element.style.getPropertyValue('--apollo-segmented-track-padding')).toBe('5px');
    expect(root().element.style.getPropertyValue('--apollo-segmented-item-selected-color')).toBe(
      'white',
    );
    for (const [name, expected] of Object.entries({
      'track-padding': '5px',
      'track-bg': 'pink',
      'item-color': 'navy',
      'item-hover-color': 'teal',
      'item-hover-bg': 'gold',
      'item-active-bg': 'orange',
      'item-selected-bg': 'purple',
      'item-selected-color': 'white',
    }))
      expect(root().element.style.getPropertyValue(`--apollo-segmented-${name}`)).toBe(expected);
    explicit.value = false;
    await settle();
    expect(w.get<HTMLInputElement>('input').element.disabled).toBe(false);
    expect(root().classes()).toContain('enabled-provider');
    configured.value = false;
    await settle();
    expect(root().classes()).not.toContain('from-provider');
    expect(root().classes()).toContain('apollo-segmented-sm');
    expect(root().element.style.getPropertyValue('--apollo-segmented-track-padding')).toBe('');
    expect(w.get<HTMLDivElement>('.apollo-segmented-item-label').element.style.fontWeight).toBe('');
    w.unmount();
  });
});

it('uses the actual compiled model, native attrs and exposed nullable root after remount', async () => {
  const w = mount(NativeSegmented);
  expect(w.vm.element).toBe(w.get('#compiled-segmented').element);
  await w.get<HTMLInputElement>('input[value="one"]').setValue(true);
  expect(w.vm.value).toBe('one');
  expect(w.vm.changed).toEqual(['one']);
  w.vm.present = false;
  await settle();
  expect(w.vm.element).toBeUndefined();
  w.vm.present = true;
  await settle();
  expect(w.vm.element).toBe(w.get('#compiled-segmented').element);
  expect(w.get<HTMLInputElement>('input[value="one"]').element.checked).toBe(true);
  w.unmount();
});

it('restarts the actual thumb on rapid reversal, ignores retired end events and cancels post-flush work at unmount', async () => {
  vi.useFakeTimers();
  const value = ref('a');
  const vertical = ref(false);
  const container = shallowRef<HTMLElement | null>(null);
  const started = vi.fn();
  const ended = vi.fn();
  const keys = ['a', 'b', 'c'];
  const w = mount(
    defineComponent({
      setup: () => () =>
        h('div', { ref: container }, [
          h('div', { class: 'test-segmented-group' }, [
            h(MotionThumb, {
              prefixCls: 'test-segmented',
              containerRef: container,
              value: value.value,
              vertical: vertical.value,
              supportMotion: true,
              motionName: 'test-segmented-thumb-motion',
              getValueIndex: (key) => (typeof key === 'string' ? keys.indexOf(key) : -1),
              onMotionStart: started,
              onMotionEnd: ended,
            }),
            ...keys.map((key) => h('label', { class: 'test-segmented-item', key }, key)),
          ]),
        ]),
    }),
    { attachTo: document.body },
  );
  const group = w.get('.test-segmented-group').element;
  Object.defineProperty(group, 'clientWidth', { configurable: true, get: () => 300 });
  for (const [index, label] of w.findAll('label').entries()) {
    Object.defineProperties(label.element, {
      offsetParent: { configurable: true, get: () => group },
      offsetLeft: { configurable: true, get: () => index * 100 },
      clientWidth: { configurable: true, get: () => 100 },
      offsetTop: { configurable: true, get: () => index * 30 },
      clientHeight: { configurable: true, get: () => 30 },
    });
  }
  value.value = 'b';
  await settle();
  await vi.advanceTimersByTimeAsync(100);
  const retired = w.get('.test-segmented-thumb').element;
  value.value = 'a';
  await settle();
  const active = w.get('.test-segmented-thumb').element;
  expect(active).not.toBe(retired);
  expect(started).toHaveBeenCalledTimes(2);
  retired.dispatchEvent(new Event('transitionend'));
  expect(w.get('.test-segmented-thumb').element).toBe(active);
  await vi.advanceTimersByTimeAsync(100);
  active.dispatchEvent(new Event('transitionend'));
  await settle();
  expect(w.find('.test-segmented-thumb').exists()).toBe(false);
  expect(ended).toHaveBeenCalledOnce();
  value.value = 'c';
  await settle();
  expect(w.find('.test-segmented-thumb').exists()).toBe(true);
  vertical.value = true;
  await settle();
  expect(w.find('.test-segmented-thumb').exists()).toBe(false);
  expect(ended).toHaveBeenCalledTimes(2);
  const count = started.mock.calls.length;
  value.value = 'b';
  w.unmount();
  await settle();
  await vi.advanceTimersByTimeAsync(1000);
  expect(started).toHaveBeenCalledTimes(count);
  expect(ended).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(0);
});

it('preserves scalar key identity, valid prototype names and independent native names', async () => {
  const w = mount(
    defineComponent({
      setup: () => () => [
        h(Segmented, { options: [0, '0', '__proto__', 'constructor'] }),
        h(Segmented, { options: [0, '0'] }),
      ],
    }),
    { attachTo: document.body },
  );
  const groups = w.findAllComponents(Segmented);
  const first = groups[0];
  const second = groups[1];
  expect(first).toBeDefined();
  expect(second).toBeDefined();
  if (!first || !second) throw new Error('Expected the two independent groups');
  expect(first.get<HTMLInputElement>('input').element.name).not.toBe(
    second.get<HTMLInputElement>('input').element.name,
  );
  await first.findAll('input')[1]?.setValue(true);
  expect(first.emitted('change')).toEqual([['0']]);
  expect(first.findAll('input')[0]?.element.checked).toBe(false);
  expect(second.findAll('input')[0]?.element.checked).toBe(true);
  await first.findAll('input')[2]?.setValue(true);
  await first.findAll('input')[3]?.setValue(true);
  expect(first.emitted('change')).toEqual([['0'], ['__proto__'], ['constructor']]);
  w.unmount();
});
