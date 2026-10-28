import { type ThemeContext, useTheme } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type Component, defineComponent, h, nextTick } from 'vue';
import { Flex } from '../../flex';
import { Layout, LayoutContent, LayoutFooter, LayoutHeader, LayoutSider } from '../../layout';

const family: Array<{ name: string; component: Component }> = [
  { name: 'Flex', component: Flex },
  { name: 'Layout', component: Layout },
  { name: 'Header', component: LayoutHeader },
  { name: 'Footer', component: LayoutFooter },
  { name: 'Content', component: LayoutContent },
  { name: 'Sider', component: LayoutSider },
];

describe('Default Vue theme source activation without a Provider', () => {
  it.each(family)(
    '$name follows fallback activation, updates and removal',
    async ({ component }) => {
      const captured: { source?: ThemeContext } = {};
      const host = mount(
        defineComponent({
          setup() {
            captured.source = useTheme();
            return () => h(component, null, () => 'Theme source content');
          },
        }),
      );
      const source = captured.source;
      if (!source) throw new Error('The host must read the shared default theme context');
      const original = source.config.value;
      try {
        source.config.value = {};
        await nextTick();
        const node = host.element;
        if (!(node instanceof HTMLElement)) throw new Error('Expected a native family root');
        expect(source.sourceActive?.value).toBe(false);
        expect(node.style.getPropertyValue('--apollo-padding-xs')).toBe('');
        source.config.value = { token: { paddingXS: 17 } };
        await nextTick();
        expect(source.sourceActive?.value).toBe(true);
        expect(node.style.getPropertyValue('--apollo-padding-xs')).toBe('17px');
        source.config.value = { token: { paddingXS: 23 } };
        await nextTick();
        expect(node.style.getPropertyValue('--apollo-padding-xs')).toBe('23px');
        source.config.value = {};
        await nextTick();
        expect(source.sourceActive?.value).toBe(false);
        expect(node.style.getPropertyValue('--apollo-padding-xs')).toBe('');
        expect(host.element).toBe(node);
      } finally {
        source.config.value = original;
        host.unmount();
      }
    },
  );
});
