import { mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { useApp } from '../app-context';

afterEach(() => vi.restoreAllMocks());

it('rejects useApp in a component without an App provider', () => {
  const Reader = defineComponent({
    setup() {
      useApp();
      return () => h('span');
    },
  });
  expect(() => mount(Reader)).toThrow('[Apollo App] useApp() requires an App provider.');
});

it('reports the same boundary outside Vue without a misleading injection warning', () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  expect(useApp).toThrow('[Apollo App] useApp() requires an App provider.');
  expect(warning).not.toHaveBeenCalled();
});
