import { darkAlgorithm, type ThemeConfig } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, type StyleValue, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import ConfigProvider from '../../config-provider';
import type { ComponentConfigLike } from '../../config-provider/interface';
import type { ProgressProps } from '../interface';
import Progress from '../Progress';

describe('Progress current rendering contracts', () => {
  it('updates indicator position, alignment and bright colors together', async () => {
    const wrapper = mount(Progress, { props: { percent: 100, strokeColor: '#fff' } });
    expect(wrapper.find('.apollo-progress-indicator svg').exists()).toBe(true);

    await wrapper.setProps({ percentPosition: { type: 'inner', align: 'start' } });
    const indicator = wrapper.get('.apollo-progress-track .apollo-progress-indicator');
    expect(indicator.text()).toBe('100%');
    expect(indicator.classes()).toEqual(
      expect.arrayContaining([
        'apollo-progress-indicator-inner',
        'apollo-progress-indicator-start',
        'apollo-progress-indicator-bright',
      ]),
    );
    expect(indicator.classes()).not.toContain('apollo-progress-indicator-outer');

    await wrapper.setProps({ percentPosition: { type: 'outer', align: 'center' }, percent: 40 });
    expect(
      wrapper.get('.apollo-progress-body-layout-bottom > .apollo-progress-indicator').classes(),
    ).toContain('apollo-progress-indicator-center');
    await wrapper.setProps({ percentPosition: undefined });
    expect(wrapper.get('.apollo-progress-indicator').classes()).toEqual(
      expect.arrayContaining(['apollo-progress-indicator-outer', 'apollo-progress-indicator-end']),
    );
    wrapper.unmount();
  });

  it('keeps formatter content responsive when changing progress shape', async () => {
    const format: NonNullable<ProgressProps['format']> = (percent, successPercent) => [
      h('strong', String(percent)),
      ' / ',
      successPercent,
    ];
    const wrapper = mount(Progress, { props: { percent: 60, success: { percent: 20 }, format } });
    expect(wrapper.get('.apollo-progress-indicator').text()).toBe('60 / 20');
    await wrapper.setProps({ percent: 80, success: { percent: 30 }, type: 'circle' });
    expect(wrapper.get('.apollo-progress-indicator').text()).toBe('80 / 30');
    expect(wrapper.get('.apollo-progress-indicator strong').text()).toBe('80');
    await wrapper.setProps({ showInfo: false });
    expect(wrapper.find('.apollo-progress-indicator').exists()).toBe(false);
    wrapper.unmount();
  });

  it('keeps a semantic foreground above automatic solid-track contrast and resolves CSS variables natively', async () => {
    const props: ProgressProps = {
      percent: 60,
      strokeColor: 'var(--task-progress-color)',
      percentPosition: { type: 'inner' },
      styles: {
        root: { '--task-progress-color': '#fff' },
        indicator: { color: '#123456' },
      },
    };
    const wrapper = mount(Progress, { props });
    const indicator = wrapper.get<HTMLElement>('.apollo-progress-indicator');
    expect(indicator.element.style.color).toBe('rgb(18, 52, 86)');
    await wrapper.setProps({ strokeColor: '#001342', percent: 80 });
    expect(indicator.element.style.color).toBe('rgb(18, 52, 86)');
    wrapper.unmount();

    const html = await renderToString(
      h(Progress, {
        ...props,
        styles: { root: { '--task-progress-color': '#fff' } },
      }),
    );
    expect(html).toContain('color(from var(--task-progress-color) srgb-linear');
    const gradient = await renderToString(
      h(Progress, {
        ...props,
        strokeColor: { from: '#fff', to: '#000' },
        styles: undefined,
      }),
    );
    expect(gradient).not.toContain('color(from');
  });

  it('merges native string/array styles and routes attrs and listeners once to the root', async () => {
    const style = shallowRef<StyleValue>('width: 250px; color: red');
    const click = vi.fn();
    const wrapper = mount(
      defineComponent(
        () => () =>
          h(Progress, {
            percent: 40,
            style: style.value,
            class: ['native-root', { enabled: true }],
            styles: { root: { width: '100px', padding: '3px' } },
            'data-progress': 'owned',
            onClick: click,
          }),
      ),
    );
    const root = wrapper.get<HTMLElement>('[role="progressbar"]');
    expect(root.element.style.width).toBe('250px');
    expect(root.element.style.padding).toBe('3px');
    expect(root.classes()).toEqual(expect.arrayContaining(['native-root', 'enabled']));
    expect(root.attributes('data-progress')).toBe('owned');
    await root.trigger('click');
    expect(click).toHaveBeenCalledOnce();
    expect(click.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);

    style.value = [{ width: '275px', color: 'blue' }, 'width: 300px'];
    await nextTick();
    expect(root.element.style.width).toBe('300px');
    expect(root.element.style.color).toBe('blue');
    style.value = undefined;
    await nextTick();
    expect(root.element.style.width).toBe('100px');
    expect(root.element.style.color).toBe('');
    wrapper.unmount();
  });

  it('applies CSS tuple widths to line and step segments', async () => {
    const wrapper = mount(Progress, { props: { percent: 50, size: ['65%', 12] } });
    expect(wrapper.get<HTMLElement>('.apollo-progress-body').element.style.width).toBe('65%');
    await wrapper.setProps({ steps: 4, size: ['2em', 10] });
    for (const step of wrapper.findAll<HTMLElement>('.apollo-progress-steps-item')) {
      expect(step.element.style.width).toBe('2em');
      expect(step.element.style.height).toBe('10px');
    }
    wrapper.unmount();
  });

  it.each(['circle', 'dashboard'] as const)(
    'forwards %s stroke width and rail semantic styles',
    async (type) => {
      const wrapper = mount(Progress, {
        props: {
          type,
          percent: 60,
          strokeWidth: 12,
          styles: { rail: { stroke: '#123456', opacity: 0.4 } },
        },
      });
      const rail = wrapper.get<SVGElement>('.apollo-progress-circle-rail');
      expect(rail.attributes('stroke-width')).toBe('12');
      expect(rail.attributes('r')).toBe('44');
      expect(rail.element.style.stroke).toBe('rgb(18, 52, 86)');
      expect(rail.element.style.opacity).toBe('0.4');
      await wrapper.setProps({ strokeWidth: 8, styles: { rail: { stroke: '#654321' } } });
      expect(rail.attributes('stroke-width')).toBe('8');
      expect(rail.attributes('r')).toBe('46');
      expect(rail.element.style.stroke).toBe('rgb(101, 67, 33)');
      expect(rail.element.style.opacity).toBe('');
      wrapper.unmount();
    },
  );

  it('retains the deprecated circle width when size is absent', async () => {
    const warning = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const wrapper = mount(Progress, { props: { type: 'circle', width: 80 } });
    expect(wrapper.get<HTMLElement>('.apollo-progress-body').element.style.width).toBe('80px');
    await wrapper.setProps({ size: 100 });
    expect(wrapper.get<HTMLElement>('.apollo-progress-body').element.style.width).toBe('100px');
    await wrapper.setProps({ size: undefined });
    expect(wrapper.get<HTMLElement>('.apollo-progress-body').element.style.width).toBe('80px');
    expect(warning).toHaveBeenCalled();
    warning.mockRestore();
    wrapper.unmount();
  });

  it('uses valid sorted circle gradients for from/to and percentage forms', async () => {
    const wrapper = mount(Progress, {
      props: { type: 'circle', percent: 60, strokeColor: { from: '#123456', to: '#abcdef' } },
    });
    expect(wrapper.html()).not.toContain('NaN');
    expect(wrapper.get('foreignObject').html()).toContain(
      'rgb(18, 52, 86) 0%, rgb(171, 205, 239) 100%',
    );
    await wrapper.setProps({
      strokeColor: { '100%': '#abcdef', '0%': '#123456', '50%': '#654321', direction: 'to right' },
    });
    expect(wrapper.html()).not.toContain('NaN');
    expect(wrapper.get('foreignObject').html()).toContain(
      'rgb(18, 52, 86) 0%, rgb(101, 67, 33) 50%, rgb(171, 205, 239) 100%',
    );
    wrapper.unmount();
  });
});

describe('Progress current configuration and theme', () => {
  it('merges current Provider semantics and removes replaced configuration without remounting', async () => {
    const configuration = ref<ComponentConfigLike>({
      className: 'provider-root',
      style: { padding: '5px' },
      classNames: { root: 'provider-semantic-root', rail: 'provider-rail' },
      styles: { root: { margin: '4px' }, track: { opacity: 0.3 } },
    });
    const prefix = ref('apollo');
    const direction = ref<'ltr' | 'rtl'>('ltr');
    const wrapper = mount(
      defineComponent(
        () => () =>
          h(
            ConfigProvider,
            {
              components: { progress: configuration.value },
              prefixCls: prefix.value,
              direction: direction.value,
            },
            {
              default: () =>
                h(Progress, {
                  percent: 40,
                  classNames: ({ props }) => ({ track: props.percent === 40 ? 'local-track' : '' }),
                  styles: { root: { padding: '7px' }, track: { height: '9px' } },
                  style: 'margin: 8px',
                }),
            },
          ),
      ),
    );
    const root = wrapper.get<HTMLElement>('[role="progressbar"]');
    const track = wrapper.get<HTMLElement>('.apollo-progress-track');
    expect(root.classes()).toEqual(
      expect.arrayContaining(['provider-root', 'provider-semantic-root']),
    );
    expect(root.element.style.padding).toBe('7px');
    expect(root.element.style.margin).toBe('8px');
    expect(wrapper.get('.apollo-progress-rail').classes()).toContain('provider-rail');
    expect(track.classes()).toContain('local-track');
    expect(track.element.style.opacity).toBe('0.3');
    expect(track.element.style.height).toBe('9px');

    configuration.value = { className: 'replacement', styles: { track: { opacity: 0.7 } } };
    prefix.value = 'custom';
    direction.value = 'rtl';
    await nextTick();
    expect(wrapper.get('[role="progressbar"]').element).toBe(root.element);
    expect(root.classes()).toEqual(
      expect.arrayContaining(['custom-progress', 'custom-progress-rtl', 'replacement']),
    );
    expect(root.classes()).not.toContain('provider-root');
    expect(root.classes()).not.toContain('provider-semantic-root');
    expect(wrapper.get<HTMLElement>('.custom-progress-track').element).toBe(track.element);
    expect(track.element.style.opacity).toBe('0.7');
    expect(root.element.style.padding).toBe('7px');
    configuration.value = {};
    await nextTick();
    expect(root.classes()).not.toContain('replacement');
    expect(track.element.style.opacity).toBe('');
    wrapper.unmount();
  });

  it('consumes all six component tokens and tracks replacement, removal and dark aliases', async () => {
    const theme = ref<ThemeConfig>({
      components: {
        Progress: {
          circleTextColor: '#123456',
          defaultColor: '#234567',
          remainingColor: '#345678',
          lineBorderRadius: 7,
          circleTextFontSize: '1.5em',
          circleIconFontSize: '2em',
        },
      },
    });
    const wrapper = mount(
      defineComponent(
        () => () =>
          h(
            ConfigProvider,
            { theme: theme.value },
            {
              default: () => h(Progress, { percent: 40 }),
            },
          ),
      ),
    );
    const root = wrapper.get<HTMLElement>('[role="progressbar"]');
    const variables = root.element.style;
    for (const [key, value] of Object.entries({
      'circle-text-color': '#123456',
      'default-color': '#234567',
      'remaining-color': '#345678',
      'line-border-radius': '7px',
      'circle-text-font-size': '1.5em',
      'circle-icon-font-size': '2em',
    }))
      expect(variables.getPropertyValue(`--apollo-progress-${key}`)).toBe(value);

    theme.value = {
      algorithm: darkAlgorithm,
      components: { Progress: { defaultColor: '#456789' } },
    };
    await nextTick();
    expect(variables.getPropertyValue('--apollo-progress-default-color')).toBe('#456789');
    expect(variables.getPropertyValue('--apollo-progress-line-border-radius')).toBe('100px');
    expect(variables.getPropertyValue('--apollo-progress-circle-text-font-size')).toBe('1em');
    expect(variables.getPropertyValue('--apollo-progress-circle-text-color')).toBe(
      'rgba(255,255,255,0.85)',
    );
    theme.value = {};
    await nextTick();
    expect(variables.getPropertyValue('--apollo-progress-default-color')).toBe('#1677ff');
    expect(root.element).toBe(wrapper.get('[role="progressbar"]').element);
    wrapper.unmount();
  });

  it('isolates nested component themes and keeps semantic/native root styles authoritative', () => {
    const wrapper = mount(ConfigProvider, {
      props: {
        theme: { components: { Progress: { defaultColor: '#123456', lineBorderRadius: 8 } } },
      },
      slots: {
        default: () => [
          h(Progress, { 'data-level': 'outer', style: '--apollo-progress-default-color: #234567' }),
          h(
            ConfigProvider,
            { theme: { components: { Progress: { defaultColor: '#345678' } } } },
            {
              default: () =>
                h(Progress, {
                  'data-level': 'inner',
                  styles: { root: { '--apollo-progress-default-color': '#456789' } },
                }),
            },
          ),
        ],
      },
    });
    expect(
      wrapper
        .get<HTMLElement>('[data-level="outer"]')
        .element.style.getPropertyValue('--apollo-progress-default-color'),
    ).toBe('#234567');
    expect(
      wrapper
        .get<HTMLElement>('[data-level="inner"]')
        .element.style.getPropertyValue('--apollo-progress-default-color'),
    ).toBe('#456789');
    expect(
      wrapper
        .get<HTMLElement>('[data-level="inner"]')
        .element.style.getPropertyValue('--apollo-progress-line-border-radius'),
    ).toBe('8px');
    wrapper.unmount();
  });

  it('writes the current theme in SSR and leaves the success segment color to the theme', async () => {
    const html = await renderToString(
      h(
        ConfigProvider,
        {
          theme: {
            token: { colorSuccess: '#123456' },
            components: { Progress: { lineBorderRadius: 9 } },
          },
        },
        { default: () => h(Progress, { type: 'circle', percent: 60, success: { percent: 20 } }) },
      ),
    );
    expect(html).toContain('--apollo-progress-line-border-radius:9px');
    expect(html).toContain('--apollo-color-success:#123456');
    expect(html).toContain('stroke:var(--apollo-color-success)');
  });
});
