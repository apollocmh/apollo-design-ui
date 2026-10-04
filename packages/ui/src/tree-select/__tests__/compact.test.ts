// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import Button from '../../button/Button.vue';
import { SpaceCompact } from '../../space';
import { TreeSelect } from '../index';

describe('TreeSelect · Space.Compact（2026-10-04 接线）', () => {
  it('Compact 内：根带 -compact-item 且默认尺寸跟随 compactSize', () => {
    const w = mount(SpaceCompact, {
      props: { size: 'small' },
      slots: { default: () => [h(Button, { key: 'b' }), h(TreeSelect, { key: 't' })] },
    });
    const root = w.find('.apollo-tree-select');
    expect(root.exists()).toBe(true);
    expect(root.classes()).toContain('apollo-tree-select-compact-item');
    expect(root.classes()).toContain('apollo-tree-select-compact-last-item');
    // compactSize 落到默认尺寸
    expect(root.classes()).toContain('apollo-tree-select-sm');
  });

  it('Compact 外：不带紧凑类', () => {
    const w = mount(TreeSelect);
    expect(w.find('.apollo-tree-select').classes()).not.toContain(
      'apollo-tree-select-compact-item',
    );
  });
});
