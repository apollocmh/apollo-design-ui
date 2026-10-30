import { RightOutlined } from '@apollo-design/icons';
import type { ThemeConfig } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, useTemplateRef } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import type { ConfigProviderProps } from '../../config-provider/interface';
import Actions from '../Actions';
import Transfer from '../index';
import type { TransferItem, TransferKey } from '../interface';
import Search from '../Search';
import Fixture from './fixtures/NativeTransfer.vue';

const data: TransferItem[] = [
  { key: 'a', title: 'Alpha' },
  { key: 'b', title: 'Beta' },
  { key: 'c', title: 'Gamma' },
];

describe('Transfer native contracts', () => {
  it('binds the actual SFC constructor, both models and Vue listener arrays', async () => {
    const wrapper = mount(Fixture);
    await wrapper.get('.apollo-transfer-list-content-item').trigger('click');
    expect(wrapper.vm.inspect().selectionSignals).toBe(2);
    await wrapper.get('.apollo-transfer-actions button').trigger('click');
    expect(wrapper.vm.inspect().targets).toEqual(['0']);
    expect(wrapper.vm.inspect().selected).toEqual([]);
    expect(wrapper.vm.inspect().moves).toBe(1);
    expect(wrapper.vm.inspect().validRef).toBe(true);
    expect(wrapper.get('output').text()).toBe('0|');
  });
  it('owns notification listeners, with one selection and model notification', async () => {
    const selection = vi.fn();
    const wrapper = mount(Transfer, { props: { dataSource: data, onSelectChange: selection } });
    await wrapper.get('.apollo-transfer-list-content-item').trigger('click');
    expect(selection).toHaveBeenCalledExactlyOnceWith(['a'], []);
    expect(wrapper.emitted('selectChange')).toEqual([[['a'], []]]);
    expect(wrapper.emitted('update:selectedKeys')).toEqual([[['a']]]);
  });

  it('updates targetKeys without a controlled prop and emits actual move keys', async () => {
    const wrapper = mount(Transfer, { props: { dataSource: data } });
    await wrapper.get('.apollo-transfer-list-content-item').trigger('click');
    await wrapper.get('.apollo-transfer-actions button').trigger('click');
    const right = wrapper.findAll('.apollo-transfer-section')[1];
    expect(right?.findAll('.apollo-transfer-list-content-item').map((item) => item.text())).toEqual(
      ['Alpha'],
    );
    expect(wrapper.emitted('update:targetKeys')).toEqual([[['a']]]);
    expect(wrapper.emitted('change')).toEqual([[['a'], 'right', ['a']]]);
  });

  it('preserves controlled rejection and the last accepted target keys on release', async () => {
    const targets = ref<TransferKey[] | undefined>([]);
    const accepted = ref(false);
    const update = vi.fn((keys: TransferKey[]) => {
      if (accepted.value) targets.value = keys;
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Transfer, {
            dataSource: data,
            targetKeys: targets.value,
            'onUpdate:targetKeys': update,
          }),
      }),
    );
    const rightItems = () =>
      wrapper.findAll('.apollo-transfer-section')[1]?.findAll('.apollo-transfer-list-content-item');
    await wrapper.get('.apollo-transfer-list-content-item').trigger('click');
    await wrapper.get('.apollo-transfer-actions button').trigger('click');
    expect(update).toHaveBeenLastCalledWith(['a']);
    expect(rightItems()).toHaveLength(0);
    accepted.value = true;
    await wrapper.get('.apollo-transfer-list-content-item').trigger('click');
    await wrapper.get('.apollo-transfer-actions button').trigger('click');
    expect(rightItems()).toHaveLength(1);
    targets.value = undefined;
    await nextTick();
    expect(rightItems()?.[0]?.text()).toBe('Alpha');
  });

  it('exposes the real root and focuses or blurs only this instance', async () => {
    const first = mount(Transfer, {
      props: { dataSource: data, showSearch: true },
      attachTo: document.body,
    });
    const second = mount(Transfer, { props: { dataSource: data }, attachTo: document.body });
    expect(first.vm.nativeElement).toBe(first.element);
    first.vm.focus({ preventScroll: true });
    expect(first.element.contains(document.activeElement)).toBe(true);
    second.vm.blur();
    expect(first.element.contains(document.activeElement)).toBe(true);
    first.vm.blur();
    expect(first.element.contains(document.activeElement)).toBe(false);
  });

  it('keeps numeric and string row identities distinct when a sibling is removed', async () => {
    const items = ref<TransferItem[]>([
      { key: 1, title: 'number' },
      { key: '1', title: 'string' },
    ]);
    const Editor = defineComponent({
      setup: () => () => h('textarea'),
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () => h(Transfer, { dataSource: items.value }, { item: () => h(Editor) }),
      }),
    );
    const remaining = wrapper.findAll('textarea')[1];
    await remaining?.setValue('draft');
    items.value = items.value.slice(1);
    await nextTick();
    expect(wrapper.get('textarea').element).toBe(remaining?.element);
    expect(wrapper.get<HTMLTextAreaElement>('textarea').element.value).toBe('draft');
  });

  it('limits Shift ranges to the enabled rows in the current filtered view', async () => {
    const wrapper = mount(Transfer, {
      props: {
        showSearch: true,
        dataSource: [
          { key: 'a', title: 'cat one' },
          { key: 'hidden', title: 'dog' },
          { key: 'c', title: 'cat two' },
        ],
      },
    });
    await wrapper.get('input[type="text"]').setValue('cat');
    const rows = wrapper.findAll('.apollo-transfer-list-content-item');
    expect(rows).toHaveLength(2);
    await rows[0]?.trigger('click');
    await rows[1]?.trigger('click', { shiftKey: true });
    expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([['a', 'c']]);
  });

  it('keeps icon action content inside an accessible owned button', () => {
    const wrapper = mount(Actions, { props: { actions: [h(RightOutlined)], rightActive: true } });
    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.attributes('type')).toBe('button');
    expect(buttons[0]?.find('svg').exists()).toBe(true);
    expect(buttons[0]?.attributes('aria-label')).toBeTruthy();
  });

  it('retains Vue ownership of a custom action template ref and listener arrays', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const move = vi.fn();
    const observed: { element?: () => HTMLElement | null } = {};
    const wrapper = mount(
      defineComponent({
        setup() {
          const button = useTemplateRef<HTMLElement>('action');
          observed.element = () => button.value;
          return () =>
            h(Actions, {
              rightActive: true,
              onMoveToRight: move,
              actions: [h('button', { ref: 'action', onClick: [first, second] }, 'Move')],
            });
        },
      }),
    );
    expect(observed.element?.()).toBe(wrapper.get('button').element);
    await wrapper.get('button').trigger('click');
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(move).toHaveBeenCalledTimes(1);
  });

  it('forwards native Search attrs and owns its change notification', async () => {
    const wrapper = mount(Search, {
      props: { prefixCls: 'transfer-search' },
      attrs: {
        class: 'own-search',
        style: 'color: red',
        'aria-label': 'Find rows',
        'data-search': 'native',
      },
    });
    expect(wrapper.get('input').attributes('aria-label')).toBe('Find rows');
    expect(wrapper.get('input').attributes('data-search')).toBe('native');
    expect(wrapper.find('.own-search').exists()).toBe(true);
    await wrapper.get('input').setValue('next');
    expect(wrapper.emitted('change')).toHaveLength(1);
  });

  it('uses the current seven component tokens and restores derived defaults', async () => {
    const theme = ref<ThemeConfig>({
      token: { colorText: '#123456' },
      components: {
        Transfer: {
          listWidth: 211,
          listHeight: '18rem',
          listWidthLG: 271,
          headerHeight: 47,
          itemHeight: 38,
          itemPaddingBlock: 7,
          transferHeaderVerticalPadding: 10,
        },
      },
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { theme: theme.value },
            { default: () => h(Transfer, { dataSource: data }) },
          ),
      }),
    );
    const style = wrapper.get<HTMLElement>('.apollo-transfer').element.style;
    for (const [name, value] of Object.entries({
      'list-width': '211px',
      'list-height': '18rem',
      'list-width-lg': '271px',
      'header-height': '47px',
      'item-height': '38px',
      'item-padding-block': '7px',
      'transfer-header-vertical-padding': '10px',
    }))
      expect(style.getPropertyValue(`--apollo-transfer-${name}`)).toBe(value);
    expect(style.getPropertyValue('--apollo-color-text')).toBe('#123456');
    theme.value = {
      token: { controlHeight: 44, controlHeightLG: 52, fontSize: 20, lineHeight: 1.4 },
    };
    await nextTick();
    expect(style.getPropertyValue('--apollo-transfer-list-width')).toBe('180px');
    expect(style.getPropertyValue('--apollo-transfer-item-height')).toBe('44px');
    expect(style.getPropertyValue('--apollo-transfer-item-padding-block')).toBe('8px');
  });

  it('keeps native styles last and removes replaced Provider styles', async () => {
    const components = ref<NonNullable<ConfigProviderProps['components']>>({
      transfer: {
        className: 'provided-transfer',
        style: { padding: '4px' },
        styles: { section: { height: '210px' } },
      },
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { components: components.value },
            {
              default: () =>
                h(Transfer, {
                  dataSource: data,
                  listStyle: () => ({ width: '200px', height: '190px' }),
                  styles: { section: { width: '250px' }, root: { color: 'blue' } },
                  style: [{ margin: '3px', opacity: 0.8 }, 'color: red'],
                }),
            },
          ),
      }),
    );
    const root = wrapper.get<HTMLElement>('.apollo-transfer');
    const section = wrapper.get<HTMLElement>('.apollo-transfer-section');
    expect(root.classes()).toContain('provided-transfer');
    expect(root.element.style.padding).toBe('4px');
    expect(root.element.style.color).toBe('red');
    expect(root.element.style.margin).toBe('3px');
    expect(root.element.style.opacity).toBe('0.8');
    expect(section.element.style.width).toBe('250px');
    expect(section.element.style.height).toBe('210px');
    components.value = {};
    await nextTick();
    expect(root.classes()).not.toContain('provided-transfer');
    expect(root.element.style.padding).toBe('');
    expect(section.element.style.height).toBe('190px');
  });
});
