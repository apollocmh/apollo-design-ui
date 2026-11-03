import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CustomAdd from '../demo/custom-add-trigger.vue';
import CustomTabBar from '../demo/custom-tab-bar.vue';
import EditableCard from '../demo/editable-card.vue';

describe('Issue #86 Tabs demo interactions', () => {
  it('adds and removes tabs with the custom add trigger', async () => {
    const wrapper = mount(CustomAdd);
    await wrapper.get('.apollo-tabs-nav-add').trigger('click');
    expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text())).toEqual([
      'Tab 1',
      'Tab 2',
      'Tab 3',
    ]);
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Tab 3');
    await wrapper.get('[data-node-key="3"] .apollo-tabs-tab-remove').trigger('click');
    expect(wrapper.get('[role="tab"][aria-selected="true"]').attributes('id')).toMatch(/-tab-2$/);
    wrapper.unmount();
  });

  it('does not reuse an existing key after removing and adding a tab', async () => {
    const wrapper = mount(EditableCard);
    const first = wrapper.findAll('.apollo-tabs')[0];
    expect(first).toBeDefined();
    await wrapper.get('[data-node-key="1"] .apollo-tabs-tab-remove').trigger('click');
    await wrapper.get('.apollo-tabs-nav-add').trigger('click');
    const keys = wrapper
      .findAll('.apollo-tabs')
      .at(0)
      ?.findAll('[data-node-key]')
      .map((tab) => tab.attributes('data-node-key'));
    expect(keys).toEqual(['2', '3']);
    expect(
      wrapper.findAll('.apollo-tabs').at(0)?.get('[role="tab"][aria-selected="true"]').text(),
    ).toBe('Tab 3');
    wrapper.unmount();
  });

  it('switches custom Apollo button tabs by keyboard and associates the selected panel', async () => {
    const wrapper = mount(CustomTabBar, { attachTo: document.body });
    await wrapper.get('[role="tab"]').trigger('keydown', { key: 'ArrowRight' });
    const selected = wrapper.get('[role="tab"][aria-selected="true"]');
    expect(selected.text()).toBe('Tab 2');
    expect(document.activeElement).toBe(selected.element);
    expect(
      wrapper
        .get(`[role="tabpanel"][aria-labelledby="${selected.attributes('id')}"]`)
        .attributes('id'),
    ).toBe(selected.attributes('aria-controls'));
    wrapper.unmount();
  });
});
