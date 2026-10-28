import { darkAlgorithm, type ThemeConfig } from '@apollo-design/theme';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, shallowRef } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Table } from '../index';
import { genTableTokenDecls } from '../style';
import defaults from './fixtures/theme-defaults.json';

const wrappers: { unmount(): void }[] = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  document.body.replaceChildren();
});
function setup() {
  const theme = shallowRef<ThemeConfig | undefined>({ algorithm: darkAlgorithm });
  const style = shallowRef<Record<string, string>>({});
  const wrapper = mount(
    defineComponent(
      () => () =>
        h(ConfigProvider, { theme: theme.value }, () =>
          h(Table, {
            columns: [
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                filters: [{ text: 'Alice', value: 'Alice' }],
              },
            ],
            dataSource: [{ key: '1', name: 'Alice' }],
            pagination: false,
            style: style.value,
          }),
        ),
    ),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  wrappers.push(wrapper);
  const root = () => wrapper.get<HTMLElement>('.apollo-table').element;
  return { theme, style, wrapper, root };
}
describe('Table current theme variables', () => {
  it('preserves all forty default light declarations from dd3dff76', () => {
    expect(genTableTokenDecls('apollo')).toEqual(defaults);
    expect(defaults).toHaveLength(40);
  });
  it('replaces, removes and restores derived colours and existing zero-valued component tokens', async () => {
    const { theme, root } = setup();
    const dark = root().style.getPropertyValue('--apollo-table-header-bg');
    expect(dark).not.toBe('#fafafa');
    expect(dark).not.toBe('');
    theme.value = {
      components: { Table: { headerBg: '#123456', cellPaddingBlock: 0, cellFontSizeSM: 11 } },
    };
    await nextTick();
    expect(root().style.getPropertyValue('--apollo-table-header-bg')).toBe('#123456');
    expect(root().style.getPropertyValue('--apollo-table-cell-padding-block')).toBe('0px');
    expect(root().style.getPropertyValue('--apollo-table-cell-font-size-sm')).toBe('11px');
    theme.value = undefined;
    await nextTick();
    expect(root().style.getPropertyValue('--apollo-table-header-bg')).toBe('');
    expect(root().style.getPropertyValue('--apollo-table-cell-padding-block')).toBe('');
    theme.value = { algorithm: darkAlgorithm };
    await nextTick();
    expect(root().style.getPropertyValue('--apollo-table-header-bg')).toBe(dark);
  });
  it('honours native root CSS variable overrides at the engine consumer', async () => {
    const { style, root } = setup();
    style.value = { '--apollo-table-header-bg': '#234567' };
    await nextTick();
    expect(root().style.getPropertyValue('--apollo-table-header-bg')).toBe('#234567');
    style.value = {};
    await nextTick();
    expect(root().style.getPropertyValue('--apollo-table-header-bg')).not.toBe('#234567');
  });
  it('supplies current values to the filter portal as its theme changes', async () => {
    const { theme, wrapper, root } = setup();
    await wrapper.get('.apollo-table-filter-trigger').trigger('click');
    await flushPromises();
    const portal = document.querySelector('.apollo-table-filter-dropdown');
    if (!(portal instanceof HTMLElement)) throw Error('Missing actual filter portal');
    expect(portal.style.getPropertyValue('--apollo-table-header-bg')).toBe(
      root().style.getPropertyValue('--apollo-table-header-bg'),
    );
    theme.value = { components: { Table: { filterDropdownBg: '#123456' } } };
    await nextTick();
    expect(portal.style.getPropertyValue('--apollo-table-filter-dropdown-bg')).toBe('#123456');
    theme.value = undefined;
    await nextTick();
    expect(portal.style.getPropertyValue('--apollo-table-filter-dropdown-bg')).toBe('');
  });
});
