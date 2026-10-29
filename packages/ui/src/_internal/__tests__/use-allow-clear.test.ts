import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, isVNode, shallowRef } from 'vue';
import { type AllowClearConfig, useAllowClear } from '../use-allow-clear';

describe('useAllowClear explicit content and fallback', () => {
  it.each([null, false, 0, ''])('retains explicit object clearIcon %s', (clearIcon) => {
    let actual: false | AllowClearConfig = false;
    const wrapper = mount(
      defineComponent({
        setup() {
          const clear = useAllowClear({
            allowClear: { clearIcon },
            contextClearIcon: 'context',
            componentName: 'Input',
          });
          return () => {
            actual = clear.value;
            return h('div');
          };
        },
      }),
    );
    expect(actual).toEqual({ clearIcon, disabled: undefined });
    wrapper.unmount();
  });

  it('checks independent icons after an object with an absent icon', () => {
    let actual: false | AllowClearConfig = false;
    const wrapper = mount(
      defineComponent({
        setup() {
          const clear = useAllowClear({
            allowClear: {},
            clearIcon: () => 'local',
            contextAllowClear: {},
            contextClearIcon: 'context',
            componentName: 'Input',
          });
          return () => {
            actual = clear.value;
            return h('div');
          };
        },
      }),
    );
    expect(actual).toEqual({ clearIcon: 'local', disabled: undefined });
    wrapper.unmount();
  });

  it('reads reactive local/provider fallbacks without losing disabled=false', async () => {
    const local = shallowRef<boolean | AllowClearConfig>();
    const provider = shallowRef<boolean | AllowClearConfig>({ disabled: true });
    let read: () => false | AllowClearConfig = () => false;
    const wrapper = mount(
      defineComponent({
        setup() {
          const clear = useAllowClear({
            allowClear: local,
            contextAllowClear: provider,
            contextClearIcon: 'context',
            componentName: 'Input',
          });
          read = () => clear.value;
          return () => h('div');
        },
      }),
    );
    expect(read()).toEqual({ clearIcon: 'context', disabled: true });
    local.value = { disabled: false, clearIcon: 0 };
    expect(read()).toEqual({ clearIcon: 0, disabled: false });
    local.value = false;
    expect(read()).toBe(false);
    local.value = true;
    provider.value = true;
    expect(read()).toEqual({ clearIcon: 'context', disabled: undefined });
    wrapper.unmount();
  });

  it('returns a native Vue default icon node', () => {
    let node: unknown;
    const wrapper = mount(
      defineComponent({
        setup() {
          const clear = useAllowClear({ allowClear: true, componentName: 'Input' });
          node = clear.value && clear.value.clearIcon;
          return () => h('div');
        },
      }),
    );
    expect(isVNode(node)).toBe(true);
    wrapper.unmount();
  });
});
