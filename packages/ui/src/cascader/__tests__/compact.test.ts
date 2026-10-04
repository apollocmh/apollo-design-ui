// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import Button from '../../button/Button.vue';
import { SpaceCompact } from '../../space';
import { Cascader } from '../index';

describe('Cascader · Space.Compact（2026-10-04 接线，tree-select 同款）', () => {
  it('Compact 内：根带 -compact-item 且默认尺寸跟随 compactSize', () => {
    const w = mount(SpaceCompact, {
      props: { size: 'small' },
      slots: { default: () => [h(Button, { key: 'b' }), h(Cascader, { key: 'c' })] },
    });
    const root = w.find('.apollo-cascader');
    expect(root.exists()).toBe(true);
    expect(root.classes()).toContain('apollo-cascader-compact-item');
    expect(root.classes()).toContain('apollo-cascader-compact-last-item');
    // compactSize 落到默认尺寸
    expect(root.classes()).toContain('apollo-cascader-sm');
  });

  it('Compact 外：不带紧凑类', () => {
    const w = mount(Cascader);
    expect(w.find('.apollo-cascader').classes()).not.toContain('apollo-cascader-compact-item');
  });
});
