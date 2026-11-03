import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SelectAllLabels from '../demo/custom-select-all-labels.vue';

describe('Issue #86 Transfer demo interactions', () => {
  it('accepts a transfer while displaying custom select-all labels', async () => {
    const wrapper = mount(SelectAllLabels);
    await wrapper.get('.apollo-transfer-list-content-item').trigger('click');
    const before = wrapper
      .findAll('.apollo-transfer-section')
      .at(1)
      ?.findAll('.apollo-transfer-list-content-item').length;
    await wrapper.get('button[aria-label="Move selected items to target"]').trigger('click');
    expect(
      wrapper
        .findAll('.apollo-transfer-section')
        .at(1)
        ?.findAll('.apollo-transfer-list-content-item').length,
    ).toBe((before ?? 0) + 1);
    wrapper.unmount();
  });
});
