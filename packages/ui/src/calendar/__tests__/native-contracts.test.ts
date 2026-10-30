import { en_US, zh_CN } from '@apollo-design/locale';
import { PickerPanel } from '@apollo-design/picker';
import type { ThemeConfig } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, mergeProps, nextTick, ref, shallowRef } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import type { ConfigProviderProps } from '../../config-provider/interface';
import { Calendar } from '../index';
import type {
  CalendarExpose,
  CalendarEmits,
  CalendarHeaderRenderConfig,
  CalendarMode,
  CalendarProps,
} from '../interface';

const value = dayjs('2026-09-15');
const prefix = 'apollo-picker-calendar';

function headerCommands() {
  let current: CalendarHeaderRenderConfig | undefined;
  return {
    render: (scope: CalendarHeaderRenderConfig) => {
      current = scope;
      return h('div', 'Custom header');
    },
    read() {
      if (!current) throw new Error('Expected the rendered header scope');
      return current;
    },
  };
}

describe('Calendar native contracts', () => {
  it('forwards current direction to actual panel keyboard navigation', async () => {
    const direction = ref<'ltr' | 'rtl'>('rtl');
    const Host = defineComponent({
      setup: () => () =>
        h(ConfigProvider, { direction: direction.value }, () => h(Calendar, { value })),
    });
    const wrapper = mount(Host, { attachTo: document.body });
    const cell = wrapper.get<HTMLElement>('td[title="2026-09-15"]');
    cell.element.focus();
    await cell.trigger('keydown', { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('title')).toBe('2026-09-14');
    direction.value = 'ltr';
    await nextTick();
    const current = wrapper.get<HTMLElement>('td[title="2026-09-14"]');
    await current.trigger('keydown', { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('title')).toBe('2026-09-15');
    wrapper.unmount();
  });
  it('forwards current native attrs/listeners and clears the actual public root ref', async () => {
    const control = ref<CalendarExpose | null>(null);
    const click = vi.fn();
    const attrs = ref({
      id: 'calendar-a',
      'aria-label': 'Calendar',
      'data-current': 'a',
      tabindex: 2,
    });
    const Host = defineComponent({
      setup: () => () =>
        h(Calendar, {
          ...attrs.value,
          value,
          ref: control,
          onClick: click,
          style: ['color:red', { marginTop: '2px' }],
        }),
    });
    const host = mount(Host, { attachTo: document.body });
    const root = host.get(`.${prefix}`);
    expect(root.attributes('id')).toBe('calendar-a');
    expect(root.attributes('aria-label')).toBe('Calendar');
    expect(root.attributes('tabindex')).toBe('2');
    expect(root.attributes('style')).toContain('margin-top: 2px');
    expect(control.value?.nativeElement).toBe(root.element);
    await root.trigger('click');
    expect(click).toHaveBeenCalledTimes(1);
    attrs.value = {
      id: 'calendar-b',
      'aria-label': 'New calendar',
      'data-current': 'b',
      tabindex: 0,
    };
    await nextTick();
    expect(root.attributes('id')).toBe('calendar-b');
    expect(root.attributes('data-current')).toBe('b');
    const exposed = control.value;
    host.unmount();
    expect(exposed?.nativeElement).toBeNull();
  });

  it('reads conditional named slots during render and preserves zero/empty replacements', async () => {
    const kind = ref<'default' | 'header' | 'content' | 'full' | 'empty'>('default');
    const Host = defineComponent({
      setup: () => () =>
        h(
          Calendar,
          { value },
          {
            ...(kind.value === 'header'
              ? { headerRender: () => [h('b', { class: 'custom-header' }, 'Header'), 0] }
              : {}),
            ...(kind.value === 'content' ? { cellRender: () => 0 } : {}),
            ...(kind.value === 'full' ? { fullCellRender: () => 0 } : {}),
            ...(kind.value === 'empty' ? { fullCellRender: () => null } : {}),
          },
        ),
    });
    const host = mount(Host);
    expect(host.find(`.${prefix}-header`).exists()).toBe(true);
    kind.value = 'header';
    await nextTick();
    expect(host.find('.custom-header').exists()).toBe(true);
    expect(host.find(`.${prefix}-header`).exists()).toBe(false);
    kind.value = 'content';
    await nextTick();
    expect(host.find(`.${prefix}-header`).exists()).toBe(true);
    expect(host.get(`.${prefix}-date-content`).text()).toBe('0');
    kind.value = 'full';
    await nextTick();
    expect(host.find(`.${prefix}-date-value`).exists()).toBe(false);
    expect(host.find('.apollo-picker-cell-in-view').text()).toBe('0');
    kind.value = 'empty';
    await nextTick();
    expect(host.find('.apollo-picker-cell-in-view').text()).toBe('');
    kind.value = 'default';
    await nextTick();
    expect(host.find(`.${prefix}-date-value`).exists()).toBe(true);
    host.unmount();
  });

  it('retains initially accepted value/mode after rejected proposals and control removal', async () => {
    const commands = headerCommands();
    const wrapper = mount(Calendar, {
      props: { value, defaultValue: value.year(2020), mode: 'year' },
      slots: { headerRender: commands.render },
    });
    commands.read().onChange(value.year(2028));
    commands.read().onTypeChange('month');
    await nextTick();
    expect(commands.read().value.isSame(value)).toBe(true);
    expect(commands.read().type).toBe('year');
    await wrapper.setProps({ value: undefined, mode: undefined });
    expect(commands.read().value.isSame(value)).toBe(true);
    expect(commands.read().type).toBe('year');
    expect(wrapper.emitted('update:value')).toHaveLength(1);
    expect(wrapper.emitted('update:mode')).toEqual([['month']]);
    wrapper.unmount();
  });

  it('uses header commands as services and preserves proposal/notification order and acceptance', async () => {
    const commands = headerCommands();
    const selected = ref(value);
    const mode = ref<CalendarMode>('month');
    const log: string[] = [];
    const once = vi.fn<CalendarEmits['select']>();
    const secondChange = vi.fn<CalendarEmits['change']>();
    const Host = defineComponent({
      setup: () => () => {
        const props = {
          value: selected.value,
          mode: mode.value,
          'onUpdate:value': (next) => {
            log.push('value');
            selected.value = next;
          },
          'onUpdate:mode': (next) => {
            log.push('mode');
            mode.value = next;
          },
          onPanelChange: () => log.push('panel'),
          onChange: () => log.push('change'),
          onSelect: (_date, info) => log.push(`select:${info.source}`),
        } satisfies InstanceType<typeof Calendar>['$props'];
        return h(Calendar, mergeProps(props, { onChange: secondChange, onSelectOnce: once }), {
          headerRender: commands.render,
        });
      },
    });
    const wrapper = mount(Host);
    commands.read().onChange(value.add(1, 'month'));
    await nextTick();
    expect(log).toEqual(['value', 'panel', 'change', 'select:customize']);
    expect(commands.read().value.month()).toBe(9);
    expect(secondChange).toHaveBeenCalledTimes(1);
    expect(secondChange.mock.calls[0]?.[0].format('YYYY-MM-DD')).toBe('2026-10-15');
    log.length = 0;
    commands.read().onChange(selected.value);
    expect(log).toEqual(['select:customize']);
    expect(once).toHaveBeenCalledTimes(1);
    log.length = 0;
    commands.read().onTypeChange('year');
    await nextTick();
    expect(log).toEqual(['mode', 'panel']);
    expect(commands.read().type).toBe('year');
    wrapper.unmount();
  });

  it('applies current Provider/local semantic functions to actual current props', async () => {
    const state = ref({ mode: 'month' as CalendarMode, showWeek: false, fullscreen: false });
    const seen: boolean[] = [];
    const components = shallowRef<ConfigProviderProps['components']>({
      calendar: {
        className: 'provided',
        classNames: ({ props }: { props: CalendarProps }) => ({
          root: `provider-${props.showWeek}`,
        }),
      },
    });
    const Host = defineComponent({
      setup: () => () =>
        h(ConfigProvider, { components: components.value }, () =>
          h(Calendar, {
            ...state.value,
            value,
            classNames: ({ props }) => {
              seen.push(props.showWeek === true);
              return { root: `local-${props.mode}`, item: props.showWeek ? 'weeks' : 'days' };
            },
          }),
        ),
    });
    const wrapper = mount(Host);
    const root = wrapper.get(`.${prefix}`);
    state.value = { mode: 'year', showWeek: true, fullscreen: false };
    await nextTick();
    expect(root.classes()).toContain('provider-true');
    expect(root.classes()).toContain('local-year');
    expect(seen.at(-1)).toBe(true);
    components.value = {
      calendar: { className: 'replacement', classNames: { root: 'new-provider' } },
    };
    await nextTick();
    expect(root.classes()).toContain('replacement');
    expect(root.classes()).not.toContain('provided');
    components.value = {};
    await nextTick();
    expect(root.classes()).not.toContain('replacement');
    expect(root.classes()).toContain('local-year');
    wrapper.unmount();
  });

  it('projects all six current Calendar component tokens and removes overrides', async () => {
    const theme = shallowRef<ThemeConfig | undefined>({
      components: {
        Calendar: {
          fullBg: '#112233',
          fullPanelBg: '#223344',
          itemActiveBg: '#334455',
          yearControlWidth: 101,
          monthControlWidth: '7rem',
          miniContentHeight: 312,
        },
      },
    });
    const Host = defineComponent({
      setup: () => () =>
        h(ConfigProvider, { theme: theme.value }, () => h(Calendar, { value, fullscreen: false })),
    });
    const wrapper = mount(Host);
    const root = wrapper.get<HTMLDivElement>(`.${prefix}`).element;
    const read = (name: string) => root.style.getPropertyValue(`--apollo-calendar-${name}`);
    expect(read('full-bg')).toBe('#112233');
    expect(read('full-panel-bg')).toBe('#223344');
    expect(read('item-active-bg')).toBe('#334455');
    expect(read('year-control-width')).toBe('101px');
    expect(read('month-control-width')).toBe('7rem');
    expect(read('mini-content-height')).toBe('312px');
    theme.value = {
      components: {
        Calendar: { yearControlWidth: 0, monthControlWidth: '9rem', miniContentHeight: 0 },
      },
    };
    await nextTick();
    expect(read('year-control-width')).toBe('0px');
    expect(read('month-control-width')).toBe('9rem');
    expect(read('mini-content-height')).toBe('0px');
    expect(read('full-bg')).not.toBe('#112233');
    theme.value = undefined;
    await nextTick();
    expect(read('year-control-width')).toBe('');
    wrapper.unmount();
  });

  it('keeps current locale, range and disabled rules connected to the actual panel', async () => {
    const locale = shallowRef(en_US);
    const range = shallowRef<[dayjs.Dayjs, dayjs.Dayjs] | undefined>([
      value.date(10),
      value.date(20),
    ]);
    const blocked = ref(12);
    const Host = defineComponent({
      setup: () => () =>
        h(ConfigProvider, { locale: locale.value }, () =>
          h(Calendar, {
            value,
            validRange: range.value,
            disabledDate: (date) => date.date() === blocked.value,
          }),
        ),
    });
    const wrapper = mount(Host);
    const panel = wrapper.getComponent(PickerPanel);
    expect(panel.props('disabledDate')?.(value.date(9), { type: 'date' })).toBe(true);
    expect(panel.props('disabledDate')?.(value.date(10), { type: 'date' })).toBe(false);
    locale.value = zh_CN;
    blocked.value = 15;
    range.value = [value.date(14), value.date(21)];
    await nextTick();
    expect(wrapper.get(`.${prefix}-year-select`).text()).toContain('年');
    expect(panel.props('disabledDate')?.(value.date(15), { type: 'date' })).toBe(true);
    expect(panel.props('disabledDate')?.(value.date(21), { type: 'date' })).toBe(false);
    expect(panel.props('locale').locale).toBe('zh_CN');
    wrapper.unmount();
  });
});
