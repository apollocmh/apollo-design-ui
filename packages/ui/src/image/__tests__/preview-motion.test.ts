import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { Image } from '../../index';
import Preview from '../Preview';

afterEach(() => {
  document.body.replaceChildren();
});

async function flushRender() {
  await nextTick();
  await nextTick();
}

describe('Image preview motion namespace', () => {
  for (const scenario of [
    { name: 'default', prefixCls: undefined, expected: 'apollo-image-preview-fade' },
    { name: 'custom', prefixCls: 'custom-image', expected: 'custom-image-preview-fade' },
  ]) {
    it(`${scenario.name} Image prefix chooses its own preview fade namespace`, async () => {
      const wrapper = mount(Image, {
        props: { prefixCls: scenario.prefixCls, alt: 'Motion preview', open: true },
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      await flushRender();
      // Exercise the real CSSMotion integration; shared jsdom setup disables animation playback.
      const motion = wrapper.findComponent({ name: 'CSSMotion' });
      expect(motion.exists()).toBe(true);
      expect(motion.props('motionName')).toBe(scenario.expected);
      wrapper.unmount();
    });
  }

  it('an explicit Preview motionName overrides the prefix-derived default', async () => {
    const wrapper = mount(Preview, {
      props: {
        prefixCls: 'custom-image-preview',
        open: true,
        motionName: 'custom-preview-transition',
      },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await flushRender();
    const motion = wrapper.findComponent({ name: 'CSSMotion' });
    expect(motion.exists()).toBe(true);
    expect(motion.props('motionName')).toBe('custom-preview-transition');
    wrapper.unmount();
  });
});
