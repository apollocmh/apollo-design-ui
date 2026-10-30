import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import Pagination from '../Pagination.vue';

const P = 'apollo-pagination';

describe('Pagination native model boundaries', () => {
  it('resolves default sizing for the actual Select consumer and follows size updates', async () => {
    const w = mount(Pagination, {
      props: { total: 100, size: 'default', showSizeChanger: true },
    });
    const select = w.getComponent({ name: 'ASelect' });
    expect(select.props('size')).toBe('middle');
    await w.setProps({ size: undefined });
    expect(select.props('size')).toBe('middle');
    await w.setProps({ size: 'small' });
    expect(select.props('size')).toBe('small');
    expect(w.get('.apollo-select').classes()).toContain('apollo-select-sm');
    w.unmount();
  });

  it('forwards native Select classes from the showSizeChanger configuration', () => {
    const w = mount(Pagination, {
      props: { total: 100, showSizeChanger: { class: ['size-config', { enabled: true }] } },
    });
    expect(w.get('.apollo-select').classes()).toContain('size-config');
    expect(w.get('.apollo-select').classes()).toContain('enabled');
    w.unmount();
  });

  it('applies current item semantics to both jump controls', async () => {
    const w = mount(Pagination, {
      props: {
        total: 100,
        current: 6,
        showSizeChanger: false,
        classNames: ({ props }) => ({ item: `current-${props.current}` }),
        styles: { item: { color: 'red' } },
      },
    });
    const jumps = w.findAll(`.${P}-jump-prev, .${P}-jump-next`);
    expect(jumps).toHaveLength(2);
    expect(jumps.every((jump) => jump.classes().includes('current-6'))).toBe(true);
    expect(jumps.every((jump) => jump.attributes('style')?.includes('color: red'))).toBe(true);
    await w.setProps({ current: 7 });
    expect(w.get(`.${P}-jump-prev`).classes()).toContain('current-7');
    w.unmount();
  });

  it('continues the last received current after rejected requests and release', async () => {
    const w = mount(Pagination, { props: { total: 100, current: 3, showSizeChanger: false } });
    await w.get(`.${P}-item-5`).trigger('click');
    expect(w.get(`.${P}-item-3`).classes()).toContain(`${P}-item-active`);
    await w.setProps({ current: 4 });
    await w.get(`.${P}-item-2`).trigger('click');
    await w.setProps({ current: undefined });
    expect(w.get(`.${P}-item-4`).classes()).toContain(`${P}-item-active`);
    expect(w.emitted('change')).toEqual([
      [5, 10],
      [2, 10],
    ]);
    w.unmount();
  });

  it('continues the last received pageSize after rejected requests and release', async () => {
    const w = mount(Pagination, {
      props: { total: 500, pageSize: 20, showSizeChanger: true },
      slots: {
        sizeChanger: ({ value, onSizeChange }) =>
          h('button', { 'data-size': '', onClick: () => onSizeChange(100) }, String(value)),
      },
    });
    await w.get('[data-size]').trigger('click');
    expect(w.get('[data-size]').text()).toBe('20');
    await w.setProps({ pageSize: 50 });
    await w.get('[data-size]').trigger('click');
    await w.setProps({ pageSize: undefined });
    expect(w.get('[data-size]').text()).toBe('50');
    expect(w.emitted('update:pageSize')).toEqual([[100], [100]]);
    w.unmount();
  });

  it('persists an uncontrolled clamp when total shrinks and grows', async () => {
    const w = mount(Pagination, {
      props: { total: 100, defaultCurrent: 8, showSizeChanger: false },
    });
    await w.setProps({ total: 30 });
    expect(w.get(`.${P}-item-3`).classes()).toContain(`${P}-item-active`);
    await w.setProps({ total: 100 });
    expect(w.get(`.${P}-item-3`).classes()).toContain(`${P}-item-active`);
    expect(w.emitted('change')).toBeUndefined();
    w.unmount();
  });

  it('guards disabled and unchanged size requests at the owning component', async () => {
    const w = mount(Pagination, {
      props: { total: 100, disabled: true, showSizeChanger: true },
      slots: {
        sizeChanger: ({ onSizeChange, onChange, value }) => [
          h('button', { 'data-change-size': '', onClick: () => onSizeChange(20) }),
          h('button', { 'data-same-size': '', onClick: () => onChange(value) }),
          h('button', { 'data-invalid-size': '', onClick: () => onSizeChange(0) }),
        ],
      },
    });
    await w.get('[data-change-size]').trigger('click');
    expect(w.emitted('change')).toBeUndefined();
    expect(w.emitted('update:pageSize')).toBeUndefined();
    await w.setProps({ disabled: false });
    await w.get('[data-same-size]').trigger('click');
    await w.get('[data-invalid-size]').trigger('click');
    expect(w.emitted('change')).toBeUndefined();
    expect(w.emitted('showSizeChange')).toBeUndefined();
    w.unmount();
  });
});

describe('Pagination native inputs', () => {
  it('keeps the available simple next control in the tab order on the first page', async () => {
    const w = mount(Pagination, {
      props: { total: 100, simple: true, showSizeChanger: false },
    });
    expect(w.get(`.${P}-next`).attributes('tabindex')).toBe('0');
    await w.setProps({ current: 10 });
    expect(w.get(`.${P}-next`).attributes('tabindex')).toBeUndefined();
    expect(w.get(`.${P}-prev`).attributes('tabindex')).toBe('0');
    w.unmount();
  });

  it('removes disabled navigation controls from the tab order and reports their state', () => {
    const w = mount(Pagination, {
      props: { total: 100, current: 5, disabled: true, showSizeChanger: false },
    });
    const controls = w.findAll(
      `.${P}-item, .${P}-prev, .${P}-next, .${P}-jump-prev, .${P}-jump-next`,
    );
    expect(controls.every((control) => control.attributes('tabindex') === undefined)).toBe(true);
    expect(controls.every((control) => control.attributes('aria-disabled') === 'true')).toBe(true);
    expect(w.get<HTMLButtonElement>(`.${P}-prev button`).element.disabled).toBe(true);
    w.unmount();
  });

  it('owns Enter activation without a second native click from custom page buttons', async () => {
    const w = mount(Pagination, {
      props: { total: 100, current: 1, showSizeChanger: false },
      slots: {
        itemRender: ({ page, type, element }) =>
          type === 'page' ? h('button', String(page)) : element,
      },
    });
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    w.get(`.${P}-item-3 button`).element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(w.emitted('change')).toEqual([[3, 10]]);
    const owned = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    owned.preventDefault();
    w.get(`.${P}-item-4 button`).element.dispatchEvent(owned);
    expect(w.emitted('change')).toEqual([[3, 10]]);
    w.unmount();
  });

  it.each([false, true])('accepts KeyboardEvent.key Enter in simple=%s', async (simple) => {
    const w = mount(Pagination, {
      props: { total: 100, simple, showQuickJumper: true, showSizeChanger: false },
    });
    const input = w.get<HTMLInputElement>(
      simple ? `.${P}-simple-pager input` : `.${P}-options-quick-jumper input`,
    );
    await input.setValue('4');
    await input.trigger('keyup', { key: 'Enter' });
    expect(w.emitted('change')).toEqual([[4, 10]]);
    w.unmount();
  });

  it.each([false, true])(
    'renders zero-valued confirmation content in simple=%s',
    async (simple) => {
      const w = mount(Pagination, {
        props: {
          total: 100,
          simple,
          showQuickJumper: { goButton: 0 },
          showSizeChanger: false,
        },
      });
      const input = w.get<HTMLInputElement>(
        simple ? `.${P}-simple-pager input` : `.${P}-options-quick-jumper input`,
      );
      const confirmation = w.get(
        simple
          ? `.${P}-simple-pager + .${P}-simple-pager span`
          : `.${P}-options-quick-jumper > span`,
      );
      expect(confirmation.text()).toBe('0');
      await input.setValue('4');
      if (!simple) {
        await input.trigger('blur');
        expect(w.emitted('change')).toBeUndefined();
      }
      await confirmation.trigger('click');
      expect(w.emitted('change')).toEqual([[4, 10]]);
      w.unmount();
    },
  );

  it('uses current controlled state after simple input submission or empty blur', async () => {
    const w = mount(Pagination, {
      props: { total: 100, current: 3, simple: true, showSizeChanger: false },
    });
    const input = w.get<HTMLInputElement>(`.${P}-simple-pager input`);
    await input.setValue('not-a-page');
    expect(input.element.value).toBe('3');
    await input.setValue('7');
    await input.trigger('keyup', { key: 'Enter', keyCode: 13 });
    expect(w.emitted('change')).toEqual([[7, 10]]);
    expect(input.element.value).toBe('3');
    await input.setValue('');
    await input.trigger('blur');
    expect(input.element.value).toBe('3');
    expect(w.emitted('change')).toEqual([[7, 10]]);
    w.unmount();
  });

  it('supports modern arrow keys and does not emit a clamped no-op', async () => {
    const w = mount(Pagination, {
      props: { total: 100, simple: true, showSizeChanger: false },
    });
    const input = w.get<HTMLInputElement>(`.${P}-simple-pager input`);
    await input.setValue('0');
    await input.trigger('keyup', { key: 'Enter', keyCode: 13 });
    expect(w.emitted('change')).toBeUndefined();
    expect(input.element.value).toBe('1');
    await input.setValue('3');
    await input.trigger('keyup', { key: 'ArrowUp' });
    expect(w.emitted('change')).toEqual([[2, 10]]);
    w.unmount();
  });

  it('does not submit the jumper before activating a custom page control', async () => {
    const w = mount(Pagination, {
      props: { total: 100, showQuickJumper: true, showSizeChanger: false },
      slots: {
        itemRender: ({ page, type, element }) =>
          type === 'page' ? h('button', String(page)) : element,
      },
      attachTo: document.body,
    });
    const input = w.get<HTMLInputElement>(`.${P}-options-quick-jumper input`);
    await input.setValue('7');
    await input.trigger('blur', { relatedTarget: w.get(`.${P}-item-3 button`).element });
    expect(w.emitted('change')).toBeUndefined();
    await w.get(`.${P}-item-3 button`).trigger('click');
    expect(w.emitted('change')).toEqual([[3, 10]]);
    w.unmount();
  });

  it('commits a jumper when focus moves to a different pagination instance', async () => {
    const w = mount(Pagination, {
      props: { total: 100, showQuickJumper: true, showSizeChanger: false },
      attachTo: document.body,
    });
    const other = mount(Pagination, {
      props: { total: 100, showSizeChanger: false },
      attachTo: document.body,
    });
    const input = w.get<HTMLInputElement>(`.${P}-options-quick-jumper input`);
    await input.setValue('7');
    await input.trigger('blur', { relatedTarget: other.get(`.${P}-item-3`).element });
    expect(w.emitted('change')).toEqual([[7, 10]]);
    w.unmount();
    other.unmount();
  });
});
