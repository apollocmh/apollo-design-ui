import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { Splitter } from '../index';

describe('sz debug', () => {
  it('size-px', () => {
    const w = mount(
      h(Splitter, { style: { height: '200px' }, onResize: () => {} }, () => [
        h(Splitter.Panel, { size: 100 }, () => 'Left'),
        h(Splitter.Panel, null, () => 'Right'),
      ]),
    );
    console.log('FULL:', w.html().replace(/\n/g, ''));
    expect(1).toBe(1);
  });
});
