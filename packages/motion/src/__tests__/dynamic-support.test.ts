import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { CSSMotion } from '../css-motion';

vi.unmock('@apollo-design/motion');
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};
describe('current CSSMotion support', () => {
  it('does not recreate a closed layer when support is enabled while it is hidden', async () => {
    const changed = vi.fn();
    const wrapper = mount(CSSMotion, {
      props: {
        visible: true,
        motionName: 'dynamic-motion',
        supportMotion: false,
        onVisibleChanged: changed,
      },
      slots: {
        default: ({ className }: { className: string }) =>
          h('div', { class: className }, 'Motion content'),
      },
    });
    await wrapper.setProps({ visible: false });
    expect(wrapper.find('div').exists()).toBe(false);
    await wrapper.setProps({ supportMotion: true });
    await settle();
    expect(wrapper.find('div').exists()).toBe(false);
    expect(changed.mock.calls).toEqual([[true], [false]]);
  });
  it('finishes an active leave when motion is disabled, without a deadline or duplicate notification', async () => {
    const changed = vi.fn();
    const wrapper = mount(CSSMotion, {
      props: {
        visible: true,
        motionName: 'dynamic-motion',
        supportMotion: true,
        motionAppear: false,
        motionDeadline: 500,
        onVisibleChanged: changed,
      },
      slots: {
        default: ({ className }: { className: string }) =>
          h('div', { class: className }, 'Motion content'),
      },
    });
    await wrapper.setProps({ visible: false });
    expect(wrapper.find('div').exists()).toBe(true);
    await wrapper.setProps({ supportMotion: false });
    await settle();
    expect(wrapper.find('div').exists()).toBe(false);
    expect(changed.mock.calls).toEqual([[true], [false]]);
  });
  it('uses current support when enabled later and ends motion when its name is removed', async () => {
    const wrapper = mount(CSSMotion, {
      props: { visible: true, motionName: 'dynamic-motion', supportMotion: false },
      slots: {
        default: ({ className }: { className: string }) =>
          h('div', { class: className }, 'Motion content'),
      },
    });
    await wrapper.setProps({ supportMotion: true, visible: false });
    expect(wrapper.find('div').classes()).toContain('dynamic-motion-leave');
    await wrapper.setProps({ motionName: undefined });
    await settle();
    expect(wrapper.find('div').exists()).toBe(false);
  });
});
