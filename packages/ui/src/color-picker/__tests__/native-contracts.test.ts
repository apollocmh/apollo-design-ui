import { mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { type Component, defineComponent, h, nextTick, shallowRef } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import type { ConfigProviderProps } from '../../config-provider/interface';
import ColorPickerPanel from '../ColorPickerPanel';
import { AggregationColor } from '../color';
import { Color } from '../engine/color';
import EnginePicker from '../engine/components/picker';
import { ColorPicker, ColorPickerPurePanel } from '../index';

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

it('uses one native keyboard trigger and keeps cleared decoration out of the tab order', async () => {
  const w = mount(ColorPicker, { attachTo: document.body });
  const trigger = w.get('.apollo-color-picker-trigger');
  expect(trigger.element.tagName).toBe('BUTTON');
  expect(trigger.attributes('type')).toBe('button');
  expect(trigger.attributes('aria-haspopup')).toBe('dialog');
  expect(trigger.attributes('aria-expanded')).toBe('false');
  expect(trigger.get('.apollo-color-picker-clear').element.tagName).toBe('SPAN');
  expect(trigger.findAll('[tabindex="0"]')).toHaveLength(0);
  await trigger.trigger('click');
  await settle();
  expect(trigger.attributes('aria-expanded')).toBe('true');
  w.unmount();
});

it('accepts the declared numeric color input and normalizes numeric object channels', () => {
  expect(new AggregationColor(0x1677ff).toHexString()).toBe('#1677ff');
  expect(new Color({ r: '22', g: '119', b: '255' }).toHexString()).toBe('#1677ff');
  expect(new Color({ h: '120', s: '1', b: '1' }).toHexString()).toBe('#00ff00');
  expect(() => new Color(Number.NaN)).toThrow(RangeError);
  expect(() => new Color({ r: 'no color', g: 0, b: 0 })).toThrow(TypeError);
});

it('forwards native attrs, string styles and current listeners to a custom trigger', async () => {
  const first = vi.fn();
  const second = vi.fn();
  const current = shallowRef({
    class: 'outer-a',
    style: 'color:red',
    id: 'trigger-a',
    onClick: first,
  });
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(ColorPicker, current.value, {
          default: () => h('button', { class: 'own-trigger', type: 'button' }, 'Choose'),
        }),
    }),
  );
  const trigger = w.get('.own-trigger');
  expect(trigger.classes()).toContain('outer-a');
  expect(trigger.attributes('style')).toContain('color: red');
  await trigger.trigger('click');
  expect(first).toHaveBeenCalledTimes(1);
  current.value = { class: 'outer-b', style: 'color:blue', id: 'trigger-b', onClick: second };
  await settle();
  expect(trigger.attributes('id')).toBe('trigger-b');
  expect(trigger.classes()).toContain('outer-b');
  expect(trigger.classes()).not.toContain('outer-a');
  await trigger.trigger('click');
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
  w.unmount();
});

it('reads conditional text and panel slots during render and preserves all content', async () => {
  const custom = shallowRef(true);
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          ColorPicker,
          {
            open: true,
            defaultValue: '#1677ff',
          },
          custom.value
            ? {
                showText: ({ color }: { color: AggregationColor }) => [
                  'Color ',
                  h('b', color.toHexString()),
                  0,
                ],
                panelRender: ({ panel }: { panel: Component }) =>
                  h('section', { class: 'custom-panel' }, [h(panel)]),
              }
            : {},
        ),
    }),
    { attachTo: document.body },
  );
  await settle();
  expect(w.get('.apollo-color-picker-trigger-text').text()).toBe('Color #1677ff0');
  expect(document.querySelector('.custom-panel .apollo-color-picker-inner-content')).not.toBeNull();
  custom.value = false;
  await settle();
  expect(w.find('.apollo-color-picker-trigger-text').exists()).toBe(false);
  expect(document.querySelector('.custom-panel')).toBeNull();
  w.unmount();
});

it('respects intentional empty slots and preserves all custom trigger siblings', async () => {
  const empty = mount(ColorPicker, {
    props: { open: true, showText: true, defaultValue: '#1677ff' },
    slots: { showText: () => [], panelRender: () => [] },
  });
  await settle();
  expect(empty.get('.apollo-color-picker-trigger-text').text()).toBe('');
  expect(empty.find('.apollo-color-picker-inner-content').exists()).toBe(false);
  empty.unmount();
  const custom = mount(ColorPicker, {
    attrs: { id: 'custom-color-trigger', class: ['external', { current: true }] },
    slots: { default: () => [h('b', 'One'), ' / ', h('b', 'Two'), '0'] },
  });
  const host = custom.get('#custom-color-trigger');
  expect(host.text()).toBe('One / Two0');
  expect(host.classes()).toContain('external');
  expect(host.classes()).toContain('current');
  custom.unmount();
  for (const content of ['Choose', 0]) {
    const scalar = mount(ColorPicker, { slots: { default: () => content } });
    expect(scalar.text()).toBe(String(content));
    scalar.unmount();
  }
});

it('merges current provider and functional popup styles into their actual targets', async () => {
  const configured = shallowRef(true);
  const components = (): NonNullable<ConfigProviderProps['components']> => {
    if (!configured.value) return {};
    return { 'color-picker': { styles: { popupOverlayInner: { width: '300px', color: 'red' } } } };
  };
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            components: components(),
          },
          {
            default: () =>
              h(ColorPicker, {
                open: true,
                defaultValue: '#1677ff',
                styles: () => ({ popupOverlayInner: { width: '360px' } }),
              }),
          },
        ),
    }),
    { attachTo: document.body },
  );
  await settle();
  let container = document.querySelector<HTMLElement>('.apollo-popover-container');
  expect(container?.style.width).toBe('360px');
  expect(container?.style.color).toBe('red');
  configured.value = false;
  await settle();
  container = document.querySelector<HTMLElement>('.apollo-popover-container');
  expect(container?.style.width).toBe('360px');
  expect(container?.style.color).toBe('');
  w.unmount();
});

it('keeps the editor and its focus when provider styles change', async () => {
  const padding = shallowRef('2px');
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            components: {
              'color-picker': { styles: { popupOverlayInner: { padding: padding.value } } },
            },
          },
          { default: () => h(ColorPicker, { open: true, defaultValue: '#1677ff' }) },
        ),
    }),
    {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    },
  );
  await settle();
  const input = document.querySelector<HTMLInputElement>('.apollo-color-picker-hex-input input');
  if (!input) throw new Error('Missing real color editor');
  input.focus();
  input.value = '12a';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await settle();
  expect(input.value).toBe('12a');
  padding.value = '8px';
  await settle();
  expect(document.querySelector('.apollo-color-picker-hex-input input')).toBe(input);
  expect(document.activeElement).toBe(input);
  expect(input.value).toBe('12a');
  w.unmount();
});

it('does not retain rejected open/format requests after control is removed', async () => {
  const w = mount(ColorPicker, { props: { open: false, format: 'rgb', defaultValue: '#1677ff' } });
  const popover = w.findComponent({ name: 'APopover' });
  popover.vm.$emit('openChange', true);
  await settle();
  expect(popover.props('open')).toBe(false);
  await w.setProps({ open: undefined });
  await settle();
  expect(popover.props('open')).toBe(false);
  await w.setProps({ open: true });
  await settle();
  const panel = w.findComponent(ColorPickerPanel);
  panel.props('onFormatChange')?.('hsb');
  await settle();
  expect(panel.props('format')).toBe('rgb');
  await w.setProps({ format: undefined });
  await settle();
  expect(panel.props('format')).toBe('rgb');
  w.unmount();
});

it('normalizes newly selected alpha colors without flattening a gradient', async () => {
  const w = mount(ColorPicker, {
    props: { open: true, defaultValue: '#1677ff', disabledAlpha: true },
  });
  await settle();
  const next = new AggregationColor([
    { percent: 0, color: 'rgba(255,0,0,0.2)' },
    { percent: 100, color: 'rgba(0,0,255,0.6)' },
  ]);
  w.findComponent(ColorPickerPanel).props('onChange')(next);
  const changed = w.emitted<[AggregationColor, string]>('change')?.at(-1)?.[0];
  expect(changed?.isGradient()).toBe(true);
  expect(changed?.getColors().map((c) => c.color.toHsb().a)).toEqual([1, 1]);
  w.unmount();
});

it('preserves the clear action with disabledAlpha without a false coercion warning', async () => {
  const warning = vi.spyOn(console, 'error');
  const w = mount(ColorPicker, {
    props: { open: true, defaultValue: '#1677ff', disabledAlpha: true, allowClear: true },
  });
  await settle();
  await w.get('.apollo-color-picker-operation .apollo-color-picker-clear').trigger('click');
  await settle();
  const cleared = w.emitted<[AggregationColor, string]>('change')?.at(-1)?.[0];
  expect(cleared?.cleared).toBe(true);
  expect(cleared?.toHsb().a).toBe(0);
  expect(warning).not.toHaveBeenCalled();
  w.unmount();
  warning.mockRestore();
});

it('restores the actual gradient after an uncontrolled round trip through single mode', async () => {
  const original = [
    { percent: 0, color: '#ff0000' },
    { percent: 75, color: '#0000ff' },
  ];
  const w = mount(ColorPicker, {
    props: { open: true, mode: ['single', 'gradient'], defaultValue: original },
  });
  await settle();
  const panel = w.findComponent(ColorPickerPanel);
  panel.props('onModeChange')('single');
  await settle();
  panel.props('onModeChange')('gradient');
  await settle();
  expect(
    panel
      .props('value')
      .getColors()
      .map((c) => [c.percent, c.color.toHexString()]),
  ).toEqual([
    [0, '#ff0000'],
    [75, '#0000ff'],
  ]);
  w.unmount();
});

it('emits one completion for keyboard gradient deletion and preserves its two-stop minimum', async () => {
  const w = mount(ColorPicker, {
    props: {
      open: true,
      mode: ['single', 'gradient'],
      defaultValue: [
        { percent: 0, color: '#ff0000' },
        { percent: 50, color: '#00ff00' },
        { percent: 100, color: '#0000ff' },
      ],
    },
  });
  await settle();
  expect(w.find('.apollo-color-picker-operation .apollo-color-picker-clear').exists()).toBe(false);
  await w
    .get('.apollo-color-picker-gradient-slider .apollo-slider-handle')
    .trigger('keydown', { key: 'Delete' });
  await settle();
  expect(w.emitted('change')).toHaveLength(1);
  expect(w.emitted('changeComplete')).toHaveLength(1);
  expect(w.findComponent(ColorPickerPanel).props('value').getColors()).toHaveLength(2);
  await w
    .get('.apollo-color-picker-gradient-slider .apollo-slider-handle')
    .trigger('keydown', { key: 'Delete' });
  expect(w.emitted('change')).toHaveLength(1);
  w.unmount();
});

it('cancels a retained real popup drag when its owner closes', async () => {
  const w = mount(ColorPicker, {
    props: { defaultValue: '#1677ff' },
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  await w.get('.apollo-color-picker-trigger').trigger('click');
  await settle();
  const surface = document.querySelector<HTMLElement>('.apollo-color-picker-select');
  const handle = document.querySelector('.apollo-color-picker-handler')?.parentElement;
  if (!surface || !handle) throw new Error('Missing real color panel');
  surface.getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);
  handle.getBoundingClientRect = () => new DOMRect(0, 0, 10, 10);
  surface.dispatchEvent(new MouseEvent('mousedown', { clientX: 40, clientY: 40 }));
  expect(w.emitted('change')).toHaveLength(1);
  w.findComponent({ name: 'APopover' }).vm.$emit('openChange', false);
  await settle();
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }));
  document.dispatchEvent(new MouseEvent('mouseup'));
  expect(w.emitted('change')).toHaveLength(1);
  expect(w.emitted('changeComplete')).toBeUndefined();
  w.unmount();
});

it('reacts to disabling an active engine drag and releases the document listeners', async () => {
  const change = vi.fn();
  const done = vi.fn();
  const w = mount(EnginePicker, {
    props: {
      prefixCls: 'apollo-color-picker',
      color: new Color('#1677ff'),
      onChange: change,
      onChangeComplete: done,
    },
  });
  const surface = w.get('.apollo-color-picker-select').element;
  const handle = w.get('.apollo-color-picker-handler').element.parentElement;
  surface.getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);
  if (!handle) throw new Error('Missing real color handle');
  handle.getBoundingClientRect = () => new DOMRect(0, 0, 10, 10);
  surface.dispatchEvent(new MouseEvent('mousedown', { clientX: 40, clientY: 40 }));
  expect(change).toHaveBeenCalledTimes(1);
  await w.setProps({ disabled: true });
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }));
  document.dispatchEvent(new MouseEvent('mouseup'));
  expect(change).toHaveBeenCalledTimes(1);
  expect(done).not.toHaveBeenCalled();
  await w.setProps({ disabled: false });
  surface.dispatchEvent(new MouseEvent('mousedown', { clientX: 60, clientY: 60 }));
  expect(change).toHaveBeenCalledTimes(2);
  w.unmount();
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 120 }));
  expect(change).toHaveBeenCalledTimes(2);
});

it('routes PurePanel attrs and scoped panel content to the mounted panel', async () => {
  const w = mount(ColorPickerPurePanel, {
    props: { colorPickerProps: { defaultValue: '#1677ff' } },
    attrs: { class: 'static-panel', style: 'color: red', 'data-static': 'yes' },
    slots: { panelRender: ({ panel }) => h('section', { class: 'static-content' }, [h(panel)]) },
    attachTo: document.body,
  });
  await settle();
  expect(w.classes()).toContain('static-panel');
  expect(w.attributes('style')).toContain('color: red');
  expect(w.attributes('data-static')).toBe('yes');
  expect(w.find('.static-content .apollo-color-picker-inner-content').exists()).toBe(true);
  w.unmount();
});
