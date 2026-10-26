import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createCommentVNode,
  defineComponent,
  h,
  nextTick,
  ref,
  type StyleValue,
  shallowRef,
} from 'vue';
import { ConfigProvider } from '../../config-provider';
import type { ComponentStyleConfig } from '../../config-provider/context';
import { QrCode } from '../index';
import type { QRCodeProps, QRCodeRef, QrcodeStatusType } from '../interface';

const disposers: Array<() => void> = [];
function track<T extends { unmount(): void }>(wrapper: T): T {
  disposers.push(() => wrapper.unmount());
  return wrapper;
}
afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  vi.restoreAllMocks();
});

describe('QRCode complete contract', () => {
  it('keeps refresh as an unconditional Vue action when the same listener key changes', async () => {
    const listening = ref(false);
    const action = vi.fn();
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(QrCode, {
              value: 'x',
              type: 'svg',
              status: 'expired',
              onRefresh: listening.value ? action : undefined,
            }),
        ),
      ),
    );
    expect(wrapper.find('button').exists()).toBe(true);
    await wrapper.get('button').trigger('click');
    expect(wrapper.findComponent(QrCode).emitted('refresh')).toEqual([[]]);
    listening.value = true;
    await nextTick();
    await wrapper.get('button').trigger('click');
    expect(action).toHaveBeenCalledTimes(1);
    listening.value = false;
    await nextTick();
    await wrapper.get('button').trigger('click');
    expect(action).toHaveBeenCalledTimes(1);
  });
  it('reads complete current status content and preserves native editor through state and mode changes', async () => {
    const status = ref<QrcodeStatusType>('expired');
    const svg = ref(true);
    const refresh = vi.fn();
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(
              QrCode,
              {
                value: 'Current workspace',
                type: svg.value ? 'svg' : 'canvas',
                status: status.value,
                onRefresh: refresh,
              },
              {
                status: (scope?: { status?: string; refresh?: () => void }) => [
                  createCommentVNode('conditional first node'),
                  h('input', { key: 'draft', 'aria-label': 'Status draft' }),
                  h('output', { key: 'value' }, scope?.status),
                  h(
                    'button',
                    { key: 'refresh', type: 'button', onClick: scope?.refresh },
                    'Refresh custom',
                  ),
                ],
              },
            ),
        ),
        { attachTo: document.body },
      ),
    );
    expect(wrapper.findAll('input')).toHaveLength(1);
    const root = wrapper.get('.apollo-qrcode').element;
    const editor = wrapper.get('input').element;
    editor.value = 'Kept native draft';
    editor.focus();
    for (const next of ['loading', 'scanned', 'expired'] satisfies QrcodeStatusType[]) {
      status.value = next;
      svg.value = !svg.value;
      await nextTick();
      expect(wrapper.get('output').text()).toBe(next);
      expect(wrapper.get('.apollo-qrcode').element).toBe(root);
      expect(wrapper.get('input').element).toBe(editor);
      expect(editor.value).toBe('Kept native draft');
      expect(document.activeElement).toBe(editor);
    }
    await wrapper.get('button').trigger('click');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('reads conditional empty status slots and never consumes status content while active', async () => {
    const present = ref(false);
    const empty = vi.fn(() => [createCommentVNode('intentional empty slot')]);
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(
              QrCode,
              { value: 'x', type: 'svg', status: 'expired' },
              present.value ? { status: empty } : {},
            ),
        ),
      ),
    );
    expect(wrapper.find('.apollo-qrcode-expired').exists()).toBe(true);
    present.value = true;
    await nextTick();
    expect(wrapper.find('.apollo-qrcode-expired').exists()).toBe(false);
    expect(empty).toHaveBeenCalled();
    expect(wrapper.get('.apollo-qrcode-cover').text()).toBe('');
    present.value = false;
    await nextTick();
    expect(wrapper.find('.apollo-qrcode-expired').exists()).toBe(true);
    const unused = vi.fn(() => h('span', 'Inactive extension'));
    track(
      mount(QrCode, {
        props: { value: 'x', type: 'svg', status: 'active' },
        slots: { status: unused },
      }),
    );
    expect(unused).not.toHaveBeenCalled();
  });

  it('subscribes and removes refresh listeners while preserving the action and Vue once semantics', async () => {
    const listening = ref(false);
    const listener = vi.fn();
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(QrCode, {
              value: 'x',
              type: 'svg',
              status: 'expired',
              ...(listening.value ? { onRefresh: listener } : {}),
            }),
        ),
      ),
    );
    expect(wrapper.find('button').exists()).toBe(true);
    listening.value = true;
    await nextTick();
    expect(wrapper.find('button').exists()).toBe(true);
    await wrapper.get('button').trigger('click');
    expect(listener).toHaveBeenCalledTimes(1);
    listening.value = false;
    await nextTick();
    expect(wrapper.find('button').exists()).toBe(true);
    const once = vi.fn();
    const onceWrapper = track(
      mount(QrCode, {
        props: { value: 'x', type: 'svg', status: 'expired' },
        attrs: { onRefreshOnce: once },
      }),
    );
    expect(onceWrapper.find('button').exists()).toBe(true);
    await onceWrapper.get('button').trigger('click');
    await onceWrapper.get('button').trigger('click');
    expect(once).toHaveBeenCalledTimes(1);
  });

  it('uses current locale in default status and scoped content when Provider changes or is removed', async () => {
    const translated = ref(false);
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(
              ConfigProvider,
              {
                locale: translated.value
                  ? {
                      locale: 'custom',
                      QRCode: {
                        expired: 'Current expired',
                        refresh: 'Current refresh',
                        scanned: 'Current scanned',
                      },
                    }
                  : { locale: 'en', QRCode: {} },
              },
              () => h(QrCode, { value: 'x', type: 'svg', status: 'expired', onRefresh: () => {} }),
            ),
        ),
        { global: { stubs: { teleport: false } } },
      ),
    );
    const root = wrapper.get('.apollo-qrcode').element;
    expect(wrapper.get('.apollo-qrcode-expired').text()).toBe('QR code expired');
    translated.value = true;
    await nextTick();
    expect(wrapper.get('.apollo-qrcode-expired').text()).toBe('Current expired');
    expect(wrapper.get('.apollo-qrcode').element).toBe(root);
    expect(wrapper.get('button').text()).toBe('Current refresh');
    translated.value = false;
    await nextTick();
    expect(wrapper.get('.apollo-qrcode-expired').text()).toBe('QR code expired');
  });

  it('consumes the current cover token and removes it without remounting native content', async () => {
    const themed = ref(true);
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(
              ConfigProvider,
              {
                theme: themed.value
                  ? { components: { QRCode: { QRCodeCoverBackgroundColor: '#e8f4ec' } } }
                  : undefined,
              },
              () => h(QrCode, { value: 'x', type: 'svg', status: 'scanned' }),
            ),
        ),
        { global: { stubs: { teleport: false } } },
      ),
    );
    const root = wrapper.get('.apollo-qrcode').element;
    const graphic = wrapper.get('svg').element;
    expect(wrapper.get('.apollo-qrcode').attributes('style')).toContain(
      '--apollo-qrcode-cover-background-color: #e8f4ec',
    );
    themed.value = false;
    await nextTick();
    expect(wrapper.get('.apollo-qrcode').element).toBe(root);
    expect(wrapper.get('svg').element).toBe(graphic);
    expect(wrapper.get('.apollo-qrcode').attributes('style')).not.toContain('#e8f4ec');
  });

  it('keeps native dimensions on the root and lets semantic dimensions override the logical buffer size', async () => {
    const nativeStyle = shallowRef<StyleValue>([
      { width: '220px' },
      { height: '210px', marginTop: '7px' },
    ]);
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(QrCode, {
              value: 'x',
              size: 160,
              styles: { root: { width: '240px' } },
              style: nativeStyle.value,
            }),
        ),
        { attachTo: document.body },
      ),
    );
    expect(getComputedStyle(wrapper.element).width).toBe('220px');
    expect(getComputedStyle(wrapper.element).height).toBe('210px');
    expect(wrapper.get('canvas').attributes('style')).toBeUndefined();
    expect(wrapper.get('canvas').attributes('width')).toBe('160');
    nativeStyle.value = undefined;
    await nextTick();
    expect(getComputedStyle(wrapper.element).width).toBe('240px');
    expect(getComputedStyle(wrapper.element).height).toBe('160px');
  });

  it.each(['canvas', 'svg'] as const)(
    'gives %s a current accessible title and a default name',
    async (type) => {
      const wrapper = track(mount(QrCode, { props: { value: 'x', type } }));
      expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('QR code');
      await wrapper.setProps({ title: 'Current access link' });
      expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('Current access link');
    },
  );

  it('keeps nonfinite geometry out of SVG coordinates and native dimensions', () => {
    const wrapper = track(
      mount(QrCode, {
        props: {
          value: 'x',
          type: 'svg',
          size: Number.NaN,
          marginSize: Number.POSITIVE_INFINITY,
          icon: 'data:image/svg+xml,%3Csvg/%3E',
          iconSize: { width: Number.NaN, height: Number.POSITIVE_INFINITY },
        },
      }),
    );
    expect(wrapper.html()).not.toMatch(/NaN|Infinity/);
    expect(wrapper.get('svg').attributes('width')).toBe('160');
  });

  it('keeps Provider fields, native attrs, prefix, exposed root and separate instances current', async () => {
    const config = shallowRef<ComponentStyleConfig & Pick<QRCodeProps, 'classNames' | 'styles'>>({
      className: 'provider-first',
      style: { padding: '5px' },
      classNames: { cover: 'cover-first' },
      styles: { cover: { color: 'red' } },
    });
    const prefix = ref<string | undefined>(undefined),
      phase = ref(0),
      visible = ref(true);
    const value = ref<string | undefined>('Current access');
    const api = ref<QRCodeRef | null>(null);
    const once = vi.fn(),
      click = vi.fn();
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(ConfigProvider, { components: { qrcode: { ...config.value } } }, () => [
              visible.value
                ? h(QrCode, {
                    ref: api,
                    id: 'owned-qr',
                    value: value.value,
                    type: 'svg',
                    status: 'scanned',
                    prefixCls: prefix.value,
                    styles: { root: { margin: '7px' } },
                    style: phase.value ? 'width:230px' : [{ width: 220 }],
                    class: ['native-root', { current: phase.value > 0 }],
                    'data-phase': String(phase.value),
                    onClick: click,
                    onClickOnce: once,
                  })
                : null,
              h(QrCode, { id: 'other-qr', value: 'Independent access', type: 'svg' }),
            ]),
        ),
        { attachTo: document.body, global: { stubs: { teleport: false } } },
      ),
    );
    const root = wrapper.get('#owned-qr').element,
      graphic = wrapper.get('#owned-qr').get('svg').element;
    expect(api.value?.nativeElement).toBe(root);
    expect(wrapper.get('#owned-qr').classes()).toContain('provider-first');
    expect(wrapper.get('.cover-first').attributes('style')).toContain('color: red');
    await wrapper.get('#owned-qr').trigger('click');
    config.value = {
      className: 'provider-current',
      style: { padding: '9px' },
      classNames: { cover: 'cover-current' },
      styles: { cover: { color: 'blue' } },
    };
    prefix.value = 'owned-qrcode';
    phase.value = 1;
    await nextTick();
    expect(api.value?.nativeElement).toBe(root);
    expect(wrapper.get('#owned-qr').get('svg').element).toBe(graphic);
    expect(wrapper.get('#owned-qr').classes()).toEqual(
      expect.arrayContaining(['owned-qrcode', 'provider-current', 'native-root', 'current']),
    );
    expect(wrapper.get('#owned-qr').attributes('style')).toContain('padding: 9px');
    expect(wrapper.get('#owned-qr').attributes('style')).toContain('width: 230px');
    expect(wrapper.get('#owned-qr').attributes('data-phase')).toBe('1');
    expect(wrapper.get('.cover-current').attributes('style')).toContain('color: blue');
    await wrapper.get('#owned-qr').trigger('click');
    prefix.value = undefined;
    config.value = {};
    phase.value = 2;
    await nextTick();
    expect(wrapper.get('#owned-qr').classes()).toContain('apollo-qrcode');
    expect(wrapper.get('#owned-qr').classes()).not.toContain('provider-current');
    expect(wrapper.find('.cover-current').exists()).toBe(false);
    expect(
      wrapper.get('#owned-qr').get('.apollo-qrcode-cover').attributes('style'),
    ).toBeUndefined();
    expect(wrapper.get('#owned-qr').attributes('style')).toContain('margin: 7px');
    expect(getComputedStyle(wrapper.get('#other-qr').element).width).toBe('160px');
    await wrapper.get('#owned-qr').trigger('click');
    expect(click).toHaveBeenCalledTimes(3);
    expect(once).toHaveBeenCalledTimes(1);
    value.value = undefined;
    await nextTick();
    expect(api.value?.nativeElement).toBeNull();
    value.value = 'Restored access';
    await nextTick();
    expect(api.value?.nativeElement).not.toBe(root);
    visible.value = false;
    await nextTick();
    expect(api.value).toBeNull();
    visible.value = true;
    await nextTick();
    expect(api.value?.nativeElement).toBe(wrapper.get('#owned-qr').element);
  });

  it('forwards current segmentation, correction, boost, margins and per-axis icon settings', async () => {
    const wrapper = track(
      mount(QrCode, {
        props: { value: ['A', 'B'], type: 'svg', errorLevel: 'L', boostLevel: false },
      }),
    );
    const path = () => wrapper.findAll('svg>path')[1]?.attributes('d');
    const cells = () => Number(wrapper.get('svg').attributes('viewBox')?.split(' ')[2]);
    const low = path(),
      count = cells();
    expect(wrapper.get('path').attributes('shape-rendering')).toBe('crispEdges');
    await wrapper.setProps({ marginSize: 4.9 });
    expect(cells()).toBe(count + 8);
    expect(path()).toMatch(/^M4[ ,]4/);
    await wrapper.setProps({ marginSize: -4 });
    expect(cells()).toBe(count);
    expect(path()).toBe(low);
    await wrapper.setProps({ errorLevel: 'H' });
    const high = path();
    expect(high).not.toBe(low);
    await wrapper.setProps({ errorLevel: 'L', boostLevel: true });
    expect(path()).toBe(high);
    await wrapper.setProps({ value: 'Current different value' });
    expect(path()).not.toBe(high);
    await wrapper.setProps({
      value: ['A', 'B'],
      errorLevel: 'H',
      icon: 'data:image/svg+xml,%3Csvg/%3E',
      iconSize: { width: 24 },
    });
    expect(Number(wrapper.get('image').attributes('width'))).toBeCloseTo((24 * cells()) / 160);
    expect(wrapper.get('image').attributes('crossorigin')).toBe('anonymous');
    expect(Number(wrapper.get('image').attributes('height'))).toBeCloseTo((40 * cells()) / 160);
    await wrapper.setProps({ size: 80, iconSize: 20 });
    expect(wrapper.get('svg').attributes('width')).toBe('80');
    expect(Number(wrapper.get('image').attributes('width'))).toBeCloseTo((20 * cells()) / 80);
    await wrapper.setProps({ icon: undefined });
    expect(wrapper.find('image').exists()).toBe(false);
    expect(path()).toBe(high);
  });
});
