import { useZIndex } from '@apollo-design/portal';
import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import Tooltip, { provideTooltipInjection } from '../Tooltip';

it('包装层拥有当前层级基准，后代跟随更新且显式 zIndex 保持优先', async () => {
  const base = ref(2030);
  const custom = ref<number | undefined>();
  const Child = defineComponent({
    setup() {
      const zIndex = useZIndex('SelectLike');
      return () => h('span', { 'data-injected-layer': zIndex.value }, 'Nested consumer');
    },
  });
  const Owner = defineComponent({
    setup() {
      provideTooltipInjection(() => base.value);
      return () =>
        h(
          Tooltip,
          { open: true, zIndex: custom.value },
          {
            default: () => h('button', 'Owner'),
            title: () => h(Child),
          },
        );
    },
  });
  const wrapper = mount(Owner, { attachTo: document.body, global: { stubs: { teleport: false } } });
  const current = () =>
    document.querySelector('[data-injected-layer]')?.getAttribute('data-injected-layer');
  try {
    await nextTick();
    await nextTick();
    expect(current()).toBe('2180');
    base.value = 3030;
    await nextTick();
    expect(current()).toBe('3180');
    custom.value = 4000;
    await nextTick();
    expect(current()).toBe('4050');
    custom.value = undefined;
    await nextTick();
    expect(current()).toBe('3180');
  } finally {
    wrapper.unmount();
  }
});
