/**
 * demo 冒烟测试：11 个 demo 与 antd 非 debug demo 一一对应
 * （animation / basic / checkable / colorful / control / customize / disabled /
 * draggable / icon / status / style-class；component-token 是 debug，不进冒烟）。
 */

import { demoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import ColorfulDemo from '../demo/colorful.vue';

demoTest('Tag', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 12,
});

it('spaces every colorful group while retaining all variants and colors', () => {
  const wrapper = mount(ColorfulDemo);
  try {
    expect(wrapper.findAll('.apollo-tag')).toHaveLength(60);
    const groups = wrapper.findAll('.apollo-space');
    expect(groups).toHaveLength(9);
    expect(groups.map((group) => group.findAll('.apollo-tag').length)).toEqual([
      11, 5, 4, 11, 5, 4, 11, 5, 4,
    ]);
  } finally {
    wrapper.unmount();
  }
});
