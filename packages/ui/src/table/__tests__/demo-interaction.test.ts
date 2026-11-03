import { DOMWrapper, flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CustomFilter from '../demo/custom-filter-panel.vue';

describe('Issue #86 Table demo interactions', () => {
  it('applies the typed custom filter with Enter and clears the displayed rows with Reset', async () => {
    const wrapper = mount(CustomFilter, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await wrapper.get('.apollo-table-filter-trigger').trigger('click');
    await flushPromises();
    const popup = document.body.querySelector('.apollo-table-filter-dropdown');
    if (!popup) throw new Error('The custom filter popup did not open');
    const input = new DOMWrapper(popup).get('input[placeholder="Search name"]');
    await input.setValue('John');
    await input.trigger('keydown', { key: 'Enter' });
    await flushPromises();
    expect(
      wrapper.findAll('.apollo-table-tbody > tr[data-row-key]').map((row) => row.text()),
    ).toEqual(['John Brown32New York No. 1 Lake Park']);
    await wrapper.get('.apollo-table-filter-trigger').trigger('click');
    await flushPromises();
    const reset = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.apollo-table-filter-dropdown button'),
    ).find((button) => button.textContent?.trim() === 'Reset');
    if (!reset) throw new Error('The custom filter Reset button did not appear');
    reset.click();
    await flushPromises();
    expect(wrapper.findAll('.apollo-table-tbody > tr[data-row-key]').length).toBe(3);
    wrapper.unmount();
  });
});
