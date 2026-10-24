/** F01: input identity, keyboard order and accessible names belong to the native inputs. */
import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it, vi } from 'vitest';
import { createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import TimePicker from '../../time-picker/TimePicker.vue';
import TimeRangePicker from '../../time-picker/TimeRangePicker.vue';
import DatePicker from '../DatePicker.vue';
import RangePicker from '../RangePicker.vue';

const nativeAttrs = {
  tabindex: 5,
  'aria-label': 'Choose date',
  'aria-labelledby': 'date-label',
  'aria-describedby': 'date-hint',
  'data-testid': 'picker-root',
  class: 'custom-picker',
  style: 'width: 240px',
};

describe('F01 · picker native input attributes', () => {
  for (const Picker of [DatePicker, TimePicker]) {
    it(`${Picker.__name}: routes input attrs and keeps root attrs and events`, async () => {
      const click = vi.fn();
      const focus = vi.fn();
      const w = mount(Picker, {
        props: { id: 'sample-id', name: 'date', required: true, autoComplete: 'on', open: false },
        attrs: { ...nativeAttrs, onClick: click, onFocus: focus },
        attachTo: document.body,
      });
      const input = w.get('input');
      const root = w.get<HTMLDivElement>('.apollo-picker');
      expect(input.attributes('id')).toBe('sample-id');
      expect(input.element.tabIndex).toBe(5);
      expect(input.attributes('aria-labelledby')).toBe('date-label');
      expect(input.attributes('aria-describedby')).toBe('date-hint');
      expect(input.attributes('aria-label')).toBe('Choose date');
      expect(input.attributes('name')).toBe('date');
      expect(input.element.required).toBe(true);
      expect(input.attributes('aria-required')).toBe('true');
      expect(input.attributes('autocomplete')).toBe('on');
      for (const attr of ['id', 'tabindex', 'aria-label', 'aria-labelledby', 'aria-describedby']) {
        expect(root.attributes(attr)).toBeUndefined();
      }
      expect(root.attributes('data-testid')).toBe('picker-root');
      expect(root.classes()).toContain('custom-picker');
      expect(root.element.style.width).toBe('240px');
      expect(input.attributes('data-testid')).toBeUndefined();
      input.element.focus();
      await nextTick();
      expect(document.activeElement).toBe(input.element);
      expect(focus).toHaveBeenCalledTimes(1);
      await input.trigger('click');
      expect(click).toHaveBeenCalledTimes(1);
      await w.setProps({
        id: 'updated-id',
        required: false,
        tabIndex: -1,
      });
      expect(w.get('input').element).toBe(input.element);
      expect(input.attributes('id')).toBe('updated-id');
      expect(input.element.tabIndex).toBe(-1);
      expect(input.attributes('aria-label')).toBe('Choose date');
      expect(input.element.required).toBe(false);
      expect(input.attributes('aria-required')).toBe('false');
      w.unmount();
    });
  }

  for (const Picker of [RangePicker, TimeRangePicker]) {
    it(`${Picker.__name}: supports distinct endpoint ids and a string id on start only`, async () => {
      const w = mount(Picker, {
        props: {
          id: { start: 'range-start', end: 'range-end' },
          disabled: [false, true],
          inputReadOnly: true,
        },
        attrs: nativeAttrs,
      });
      const [start, end] = w.findAll('input');
      expect(start?.attributes('id')).toBe('range-start');
      expect(end?.attributes('id')).toBe('range-end');
      expect(start?.element.disabled).toBe(false);
      expect(end?.element.disabled).toBe(true);
      for (const input of [start, end]) {
        expect(input?.element.readOnly).toBe(true);
        expect(input?.element.tabIndex).toBe(5);
        expect(input?.attributes('aria-labelledby')).toBe('date-label');
      }
      expect(w.get<HTMLDivElement>('.apollo-picker').attributes('tabindex')).toBeUndefined();
      await w.setProps({ id: 'range-id' });
      expect(start?.attributes('id')).toBe('range-id');
      expect(end?.attributes('id')).toBeUndefined();
      await w.setProps({ id: { end: 'end-only' } });
      expect(start?.attributes('id')).toBeUndefined();
      expect(end?.attributes('id')).toBe('end-only');
      w.unmount();
    });
  }

  it('autofocus chooses the first enabled endpoint and does not focus a disabled picker', async () => {
    const w = mount(RangePicker, {
      props: { autoFocus: true, disabled: [true, false], open: false },
      attachTo: document.body,
    });
    await nextTick();
    const [start, end] = w.findAll('input');
    expect(start?.element.autofocus).toBe(false);
    expect(end?.element.autofocus).toBe(true);
    expect(document.activeElement).toBe(end?.element);
    expect(w.emitted('focus')).toHaveLength(1);
    w.unmount();
    const disabled = mount(DatePicker, {
      props: { autoFocus: true, disabled: true },
      attachTo: document.body,
    });
    await nextTick();
    expect(disabled.get('input').element.autofocus).toBe(false);
    expect(disabled.emitted('focus')).toBeUndefined();
    disabled.unmount();
  });

  it('keeps controlled value, mask events and validation state authoritative', async () => {
    const w = mount(DatePicker, {
      props: {
        id: 'masked',
        value: dayjs('2026-10-23'),
        format: { format: 'YYYY-MM-DD', type: 'mask' },
      },
      attrs: { tabindex: 3, 'aria-invalid': 'true', 'aria-required': 'false' },
    });
    const input = w.get('input');
    expect(input.attributes('id')).toBe('masked');
    expect(input.element.value).toBe('2026-10-23');
    expect(input.element.tabIndex).toBe(3);
    expect(input.attributes('aria-invalid')).toBe('false');
    expect(input.attributes('aria-required')).toBe('false');
    await input.trigger('focus');
    await input.trigger('keydown', { key: 'ArrowUp' });
    expect(w.emitted('focus')).toHaveLength(1);
    w.unmount();
  });

  it('routes attrs to the disabled multiple input', () => {
    const w = mount(DatePicker, {
      props: { multiple: true, id: 'multiple', disabled: true, name: 'dates' },
      attrs: { tabindex: -1, 'aria-label': 'Dates' },
    });
    const input = w.get('input');
    expect(input.attributes('id')).toBe('multiple');
    expect(input.attributes('name')).toBe('dates');
    expect(input.attributes('aria-label')).toBe('Dates');
    expect(input.element.disabled).toBe(true);
    expect(input.element.readOnly).toBe(true);
    expect(input.element.tabIndex).toBe(-1);
    w.unmount();
  });

  it('hydrates input ids, tab order and ARIA without mismatch', async () => {
    const render = () =>
      h(RangePicker, { id: { start: 'ssr-start', end: 'ssr-end' }, ...nativeAttrs });
    const container = document.createElement('div');
    container.innerHTML = await renderToString(createSSRApp({ render }));
    document.body.append(container);
    const start = container.querySelector('input');
    expect(start?.id).toBe('ssr-start');
    expect(start?.tabIndex).toBe(5);
    const warn = vi.spyOn(console, 'warn');
    const error = vi.spyOn(console, 'error');
    const app = createSSRApp({ render });
    try {
      app.mount(container);
      await nextTick();
      expect(container.querySelector('input')).toBe(start);
      expect(warn.mock.calls.flat().join(' ')).not.toMatch(/hydration/i);
      expect(error.mock.calls.flat().join(' ')).not.toMatch(/hydration/i);
    } finally {
      app.unmount();
      container.remove();
      warn.mockRestore();
      error.mockRestore();
    }
  });
});
