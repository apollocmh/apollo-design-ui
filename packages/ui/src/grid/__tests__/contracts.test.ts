import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSSRApp,
  defineComponent,
  Fragment,
  h,
  nextTick,
  ref,
  type StyleValue,
  shallowRef,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import { resetResponsiveObserverForTests } from '../../_internal/responsive-observer';
import { ConfigProvider } from '../../config-provider';
import { Col, type ColProps, type GridRef, Row, type RowProps } from '../index';
import { genGridStyle } from '../style';

afterEach(() => {
  resetResponsiveObserverForTests();
  vi.unstubAllGlobals();
});

describe('Grid current native contracts', () => {
  for (const Component of [Row, Col]) {
    it(`${Component.name}: native string/array/object style and attrs-only replacement/removal`, async () => {
      const style = shallowRef<StyleValue>('width: 301px; --grid-native: first');
      const id = ref<string | undefined>('first'),
        className = ref<string | undefined>('first-class');
      const click = ref<(() => void) | undefined>(vi.fn());
      const w = mount(
        defineComponent(
          () => () =>
            h(Component, {
              id: id.value,
              class: className.value,
              style: style.value,
              onClick: click.value,
            }),
        ),
      );
      const root = w.get<HTMLElement>('div').element;
      expect(root.style.width).toBe('301px');
      expect(root.style.getPropertyValue('--grid-native')).toBe('first');
      style.value = ['width: 302px', { padding: '7px' }];
      id.value = 'second';
      className.value = 'second-class';
      const secondClick = vi.fn();
      click.value = secondClick;
      await nextTick();
      expect(root.id).toBe('second');
      expect(root.classList.contains('first-class')).toBe(false);
      expect(root.classList.contains('second-class')).toBe(true);
      expect(root.style.width).toBe('302px');
      expect(root.style.padding).toBe('7px');
      await w.get('div').trigger('click');
      expect(secondClick).toHaveBeenCalledTimes(1);
      style.value = { height: '31px' };
      id.value = undefined;
      className.value = undefined;
      click.value = undefined;
      await nextTick();
      expect(root.hasAttribute('id')).toBe(false);
      expect(root.classList.contains('second-class')).toBe(false);
      expect(root.style.width).toBe('');
      expect(root.style.padding).toBe('');
      expect(root.style.height).toBe('31px');
      await w.get('div').trigger('click');
      expect(secondClick).toHaveBeenCalledTimes(1);
      w.unmount();
    });
  }

  it('current Row/Col Provider configuration, direction and prefix propagate and clear', async () => {
    const stage = ref(0);
    const w = mount(
      defineComponent(
        () => () =>
          h(
            ConfigProvider,
            {
              direction: stage.value === 1 ? 'rtl' : 'ltr',
              prefixCls: stage.value === 1 ? 'custom' : 'apollo',
              components:
                stage.value === 1
                  ? {
                      row: {
                        className: 'provider-row',
                        style: { marginInline: '13px', padding: '3px' },
                      },
                      col: {
                        className: 'provider-col',
                        style: { paddingInline: '14px', height: '30px' },
                      },
                    }
                  : undefined,
            },
            () =>
              h(Row, { gutter: 16, dir: undefined, style: { padding: '5px' } }, () =>
                h(Col, { span: 12, dir: undefined }, () => 'content'),
              ),
          ),
      ),
      {
        global: { stubs: { teleport: false } },
      },
    );
    const row = w.get<HTMLElement>('.apollo-row').element,
      col = w.get<HTMLElement>('.apollo-col').element;
    stage.value = 1;
    await nextTick();
    expect(row.classList.contains('custom-row'), w.html()).toBe(true);
    expect(row.classList.contains('custom-row-rtl')).toBe(true);
    expect(col.classList.contains('custom-col-rtl')).toBe(true);
    expect(row.getAttribute('dir')).toBe('rtl');
    expect(col.getAttribute('dir')).toBe('rtl');
    expect(row.classList.contains('provider-row')).toBe(true);
    expect(col.classList.contains('provider-col')).toBe(true);
    expect(row.style.marginInline).toBe('13px');
    expect(row.style.padding).toBe('5px');
    expect(col.style.paddingInline).toBe('14px');
    expect(col.style.height).toBe('30px');
    stage.value = 2;
    await nextTick();
    expect(row.classList.contains('apollo-row')).toBe(true);
    expect(row.classList.contains('provider-row')).toBe(false);
    expect(col.classList.contains('provider-col')).toBe(false);
    expect(row.getAttribute('dir')).toBe('ltr');
    expect(row.style.marginInline).toBe('-8px');
    expect(col.style.paddingInline).toBe('8px');
    expect(col.style.height).toBe('');
    w.unmount();
  });

  it('native dir takes precedence over the Provider direction on each root', () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: {
        default: () => h(Row, { dir: 'ltr' }, () => h(Col, { dir: 'auto' }, () => 'עברית')),
      },
    });
    expect(w.get('.apollo-row').attributes('dir')).toBe('ltr');
    expect(w.get('.apollo-col').attributes('dir')).toBe('auto');
    w.unmount();
  });

  it('nested gutter and nowrap updates preserve complete slot content, native refs and drafts', async () => {
    const gutter = ref<RowProps['gutter']>([10.5, 7.5]),
      wrap = ref<boolean | undefined>(false),
      show = ref(true),
      suffix = ref(true);
    const row = ref<GridRef | null>(null),
      col = ref<GridRef | null>(null);
    const MultiRoot = defineComponent(() => () => [h('b', 'first'), h('i', 'second')]);
    const w = mount(
      defineComponent(
        () => () =>
          show.value
            ? h(
                Row,
                {
                  gutter: gutter.value,
                  wrap: wrap.value,
                  ref: row,
                },
                () => [
                  h(Col, { span: 12, flex: 0, ref: col }, () => [
                    h('input', { 'aria-label': 'Draft', defaultValue: 'initial' }),
                    0,
                    h(Fragment, [h('em', 'fragment')]),
                    suffix.value ? h(MultiRoot) : null,
                    h(Row, { gutter: 4, 'data-inner': '' }, () =>
                      h(Col, { 'data-inner-col': '' }, () => 'inner'),
                    ),
                  ]),
                  h(Col, { span: 12, 'data-sibling': '' }, () => 'sibling'),
                ],
              )
            : null,
      ),
    );
    const input = w.get('input'),
      root = row.value?.nativeElement,
      column = col.value?.nativeElement;
    await input.setValue('preserved');
    expect(root).toBe(w.get('.apollo-row').element);
    expect(column?.style.paddingInline).toBe('5.25px');
    expect(column?.style.minWidth).toBe('0px');
    expect(w.get('[data-inner-col]').attributes('style')).toContain('padding-inline: 2px');
    expect(w.text()).toContain('0fragmentfirstsecond');
    const gutters: RowProps['gutter'][] = [0, [0, 0], '2rem', undefined];
    for (const value of gutters) {
      gutter.value = value;
      wrap.value = true;
      suffix.value = false;
      await nextTick();
      expect(row.value?.nativeElement).toBe(root);
      expect(col.value?.nativeElement).toBe(column);
      expect(w.get('input').element).toBe(input.element);
      expect(w.get<HTMLInputElement>('input').element.value).toBe('preserved');
      expect(column?.style.minWidth).toBe('');
      expect(w.get('[data-inner-col]').attributes('style')).toContain('padding-inline: 2px');
    }
    expect(column?.style.paddingInline).toBe('');
    show.value = false;
    await nextTick();
    expect(row.value).toBe(null);
    expect(col.value).toBe(null);
    show.value = true;
    await nextTick();
    expect(row.value?.nativeElement).not.toBe(root);
    expect(w.get<HTMLInputElement>('input').element.value).toBe('initial');
    w.unmount();
  });

  it('nowrap also shrinks responsive flex content and removes its variables when replaced', async () => {
    const size = ref<ColProps['xs']>({ flex: '100%' });
    const w = mount(
      defineComponent(
        () => () => h(Row, { wrap: false }, () => h(Col, { xs: size.value }, () => 'long content')),
      ),
    );
    const col = w.get<HTMLElement>('.apollo-col').element;
    expect(col.style.minWidth).toBe('0px');
    expect(col.style.getPropertyValue('--apollo-col-xs-flex')).toBe('0 0 100%');
    size.value = { flex: '' };
    await nextTick();
    expect(col.style.minWidth).toBe('');
    size.value = 12;
    await nextTick();
    expect(col.classList.contains('apollo-col-xs-flex')).toBe(false);
    expect(col.style.getPropertyValue('--apollo-col-xs-flex')).toBe('');
    expect(col.style.minWidth).toBe('');
    w.unmount();
  });

  it('align stretch is an explicit effective style', () => {
    expect(genGridStyle('apollo')).toContain('.apollo-row-stretch{\n  align-items:stretch;\n}');
  });

  it('SSR renders complete slots and native styles without browser media or empty style attrs', async () => {
    const media = vi.fn(() => {
      throw new Error('SSR must not observe browser media');
    });
    vi.stubGlobal('matchMedia', media);
    const ServerLayout = defineComponent(
      () => () =>
        h(
          Row,
          {
            gutter: [10.5, 7.5],
            style: 'width:300px',
            'aria-label': 'Server layout',
          },
          () =>
            h(Col, { span: 12, style: ['padding: 2px', { height: '30px' }] }, () => [
              h('b', 'server'),
              0,
            ]),
        ),
    );
    const html = await renderToString(createSSRApp(ServerLayout));
    expect(html).toContain('width:300px');
    expect(html).toContain('margin-inline:-5.25px');
    expect(html).toContain('row-gap:7.5px');
    expect(html).toContain('height:30px');
    expect(html).toContain('<b>server</b>0');
    expect(media).not.toHaveBeenCalled();
    expect(await renderToString(createSSRApp(Row))).not.toContain('style=""');
  });
});
