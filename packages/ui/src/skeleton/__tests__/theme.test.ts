import { themeTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, shallowRef } from 'vue';
import { ConfigProvider, type ConfigProviderProps } from '../../config-provider';
import { Skeleton } from '../index';
import { genSkeletonStyle } from '../style';

themeTest('Skeleton', { demos: import.meta.glob('../demo/*.vue', { eager: true }) });

describe('Skeleton token and motion contracts', () => {
  it('consumes both existing color aliases, with current names taking precedence', async () => {
    const theme = shallowRef<ConfigProviderProps['theme']>({
      components: {
        Skeleton: {
          color: '#123456',
          colorGradientEnd: '#abcdef',
        },
      },
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { theme: theme.value },
            {
              default: () => h(Skeleton),
            },
          ),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    const root = () => wrapper.get<HTMLElement>('.apollo-skeleton').element;
    expect(root().style.getPropertyValue('--apollo-skeleton-gradient-from-color')).toBe('#123456');
    expect(root().style.getPropertyValue('--apollo-skeleton-gradient-to-color')).toBe('#abcdef');
    theme.value = {
      components: {
        Skeleton: {
          color: '#123456',
          colorGradientEnd: '#abcdef',
          gradientFromColor: '#445566',
          gradientToColor: '#778899',
        },
      },
    };
    await nextTick();
    expect(root().style.getPropertyValue('--apollo-skeleton-gradient-from-color')).toBe('#445566');
    expect(root().style.getPropertyValue('--apollo-skeleton-gradient-to-color')).toBe('#778899');
    wrapper.unmount();
  });

  it('keeps all defaults in component variables and pauses every active shape for reduced motion', () => {
    const css = genSkeletonStyle('apollo');
    for (const key of [
      'color',
      'color-gradient-end',
      'gradient-from-color',
      'gradient-to-color',
      'title-height',
      'block-radius',
      'paragraph-margin-top',
      'paragraph-li-height',
    ]) {
      expect(css).toContain(`--apollo-skeleton-${key}:`);
    }
    expect(css).toContain('height:var(--apollo-skeleton-title-height)');
    expect(css).toContain('height:var(--apollo-skeleton-paragraph-li-height)');
    expect(css).toContain('border-radius:var(--apollo-skeleton-block-radius)');
    expect(css).toContain('margin-block-start:var(--apollo-skeleton-paragraph-margin-top)');
    expect(css).toContain('@media (prefers-reduced-motion:reduce)');
    expect(css).toContain('animation:none');
    expect(css).toContain(
      'animation-play-state:var(--apollo-skeleton-animation-play-state,running)',
    );
    expect(genSkeletonStyle('ant')).toContain(
      '--ant-skeleton-title-height:calc(var(--apollo-control-height) / 2)',
    );
  });
});
