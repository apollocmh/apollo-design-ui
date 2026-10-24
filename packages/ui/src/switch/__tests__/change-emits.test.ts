/** F09: semantic change uses Vue emits once; legacy click payload remains separate (D02). */
import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { InputNumber } from '../../input-number';
import { Switch } from '../index';

const press = async (element: Element, key: string, which: number) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  Object.defineProperty(event, 'which', { value: which });
  element.dispatchEvent(event);
  await nextTick();
};

it('F09: Switch click emits one change and does not leak native change events to it', async () => {
  const change = vi.fn();
  const click = vi.fn();
  const w = mount(Switch, { attrs: { onChange: change, onClick: click } });
  await w.get('button').trigger('click');
  expect(w.emitted('change')).toHaveLength(1);
  expect(w.emitted('change')?.[0]?.[0]).toBe(true);
  expect(w.emitted('change')?.[0]?.[1]).toBeInstanceOf(MouseEvent);
  expect(w.emitted('update:checked')).toEqual([[true]]);
  expect(w.emitted('update:value')).toEqual([[true]]);
  expect(change).toHaveBeenCalledTimes(1);
  expect(click).toHaveBeenCalledTimes(1);
  expect(click.mock.calls[0]?.[0]).toBe(true);
  await w.get('button').trigger('change');
  expect(change).toHaveBeenCalledTimes(1);
  w.unmount();
});

it('F09: Switch keyboard changes use current listeners and disabled state suppresses emits', async () => {
  const first = vi.fn();
  const second = vi.fn();
  const w = mount(Switch, { attrs: { onChange: first } });
  await press(w.get('button').element, 'ArrowRight', 39);
  expect(w.emitted('change')?.[0]?.[0]).toBe(true);
  expect(w.emitted('change')?.[0]?.[1]).toBeInstanceOf(KeyboardEvent);
  await w.setProps({ onChange: second });
  await press(w.get('button').element, 'ArrowLeft', 37);
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
  expect(second.mock.calls[0]?.[0]).toBe(false);
  await w.setProps({ disabled: true });
  await press(w.get('button').element, 'ArrowRight', 39);
  expect(w.emitted('change')).toHaveLength(2);
  w.unmount();
});

it('F09: InputNumber relays one typed change and v-model update through its wrapper', async () => {
  const change = vi.fn();
  const w = mount(InputNumber, {
    props: { defaultValue: 1 },
    attrs: { onChange: change },
    slots: { prefix: () => '$', suffix: () => 'USD' },
  });
  await w.get('input').setValue('12');
  expect(w.emitted('change')).toEqual([[12]]);
  expect(w.emitted('update:value')).toEqual([[12]]);
  expect(change).toHaveBeenCalledTimes(1);
  expect(change).toHaveBeenLastCalledWith(12);
  await w.get('input').trigger('change');
  expect(change).toHaveBeenCalledTimes(1);
  w.unmount();
});

it('F09: InputNumber change preserves stringMode/null payloads and disabled guard', async () => {
  const change = vi.fn();
  const w = mount(InputNumber, {
    props: { stringMode: true, defaultValue: '0.1' },
    attrs: { onChange: change },
  });
  await w.get('input').setValue('0.2');
  expect(w.emitted('change')).toEqual([['0.2']]);
  await w.get('input').setValue('');
  expect(w.emitted('change')?.at(-1)).toEqual([null]);
  await w.setProps({ disabled: true });
  await w.get('input').setValue('5');
  expect(w.emitted('change')).toHaveLength(2);
  expect(change).toHaveBeenCalledTimes(2);
  w.unmount();
});
