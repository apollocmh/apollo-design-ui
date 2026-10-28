import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { ConfigProvider } from '../../config-provider';
import type { SizeType } from '../../config-provider/size-context';
import { NoCompactStyle, SpaceCompact } from '../../space';
import { Select } from '../index';

describe('Select · Space compact size (SPACE-05)', () => {
  it('uses local > current compact > Provider size through addition and removal, preserving the input', async () => {
    const local = ref<SizeType>();
    const compact = ref<SizeType | undefined>('small');
    const provider = ref<SizeType | undefined>('large');
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { componentSize: provider.value }, () =>
            h(SpaceCompact, { size: compact.value }, () =>
              h(Select, { size: local.value, showSearch: true }),
            ),
          ),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    const input = host.get<HTMLInputElement>('input');
    input.element.focus();
    const root = () => host.get('.apollo-select');
    expect(root().classes()).toContain('apollo-select-sm');
    compact.value = 'large';
    await nextTick();
    expect(root().classes()).toContain('apollo-select-lg');
    local.value = 'small';
    await nextTick();
    expect(root().classes()).toContain('apollo-select-sm');
    local.value = undefined;
    compact.value = undefined;
    await nextTick();
    expect(root().classes()).toContain('apollo-select-lg');
    provider.value = undefined;
    await nextTick();
    expect(root().classes()).not.toContain('apollo-select-lg');
    expect(root().classes()).not.toContain('apollo-select-sm');
    compact.value = 'small';
    await nextTick();
    expect(root().classes()).toContain('apollo-select-sm');
    expect(host.get('input').element).toBe(input.element);
    expect(document.activeElement).toBe(input.element);
    host.unmount();
  });

  it('resets size and compact classes for actual NoCompactStyle descendants only', async () => {
    const compact = ref<SizeType>('small');
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { componentSize: 'large' }, () =>
            h(SpaceCompact, { size: compact.value }, () => [
              h(Select, { id: 'grouped' }),
              h(NoCompactStyle, null, () => h(Select, { id: 'isolated' })),
            ]),
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    const roots = host.findAll('.apollo-select');
    expect(roots[0]?.classes()).toContain('apollo-select-sm');
    expect(roots[1]?.classes()).toContain('apollo-select-lg');
    expect(roots[1]?.classes()).not.toContain('apollo-select-compact-item');
    compact.value = 'large';
    await nextTick();
    expect(host.findAll('.apollo-select')[0]?.classes()).toContain('apollo-select-lg');
    expect(host.findAll('.apollo-select')[1]?.classes()).not.toContain(
      'apollo-select-compact-item',
    );
    host.unmount();
  });
});
