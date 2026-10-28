/** UPLOAD-PROGRESS-20261029: shared line dimensions and accessible progress. */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Progress } from '../index';
import type { ProgressProps } from '../interface';

describe('Progress · shared line dimensions', () => {
  it.each<{ size: ProgressProps['size']; width: string; height: string }>([
    { size: 24, width: '24px', height: '24px' },
    { size: [180, 5], width: '180px', height: '5px' },
    { size: { width: 160, height: 3 }, width: '160px', height: '3px' },
  ])('uses actual CSS lengths for $size', async ({ size, width, height }) => {
    const wrapper = mount(Progress, { props: { percent: 55.5, size, showInfo: false } });
    expect(wrapper.get<HTMLElement>('.apollo-progress-body').element.style.width).toBe(width);
    expect(wrapper.get<HTMLElement>('.apollo-progress-rail').element.style.height).toBe(height);
    await wrapper.setProps({ size: [-1, 2] });
    expect(wrapper.get<HTMLElement>('.apollo-progress-body').element.style.width).toBe('100%');
    expect(wrapper.get<HTMLElement>('.apollo-progress-rail').element.style.height).toBe('2px');
  });
});

describe('Progress · finite accessible values preserve fractions', () => {
  it.each<NonNullable<ProgressProps['type']>>(['line', 'circle', 'dashboard'])(
    'normalizes accessible values independently from the existing status derivation in %s',
    async (type) => {
      const wrapper = mount(Progress, { props: { type, percent: 55.5, showInfo: false } });
      for (const [percent, expected] of [
        [55.5, 55.5],
        [-10, 0],
        [120, 100],
        [Number.NaN, 0],
        [Number.POSITIVE_INFINITY, 0],
        [Number.NEGATIVE_INFINITY, 0],
      ]) {
        await wrapper.setProps({ percent });
        expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe(
          String(expected),
        );
      }
      await wrapper.setProps({ percent: 100 });
      expect(wrapper.get('[role="progressbar"]').classes()).toContain(
        'apollo-progress-status-success',
      );
      await wrapper.setProps({ status: 'normal' });
      expect(wrapper.get('[role="progressbar"]').classes()).toContain(
        'apollo-progress-status-normal',
      );
    },
  );

  it('retains the success-segment source and its fraction while keeping internal ARIA authoritative', async () => {
    const wrapper = mount(Progress, {
      props: { percent: 70.5, success: { percent: 20.25 } },
      attrs: { 'aria-valuenow': '999', 'aria-label': 'Upload progress' },
    });
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('20.25');
    expect(wrapper.get('[role="progressbar"]').attributes('aria-label')).toBe('Upload progress');
    await wrapper.setProps({ success: { percent: Number.NaN } });
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('0');
    await wrapper.setProps({ success: undefined });
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('70.5');
  });
});
