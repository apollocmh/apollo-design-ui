/** Current Apollo Alert contracts: native Vue events, current sources and complete content. */

import { getDesignToken, ThemeContextKey, ThemeProvider } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  computed,
  defineComponent,
  Fragment,
  h,
  nextTick,
  onMounted,
  provide,
  ref,
  shallowRef,
} from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Alert, AlertErrorBoundary } from '../index';
import type { AlertConfig, AlertRef } from '../interface';

const mounted: Array<{ unmount: () => void }> = [];
function keep<T extends { unmount: () => void }>(wrapper: T): T {
  mounted.push(wrapper);
  return wrapper;
}
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  vi.restoreAllMocks();
});

describe('Alert complete contract: current configuration and attrs', () => {
  it.each(['prefix', 'role'] as const)(
    'semantic functions receive the merged prefix and role: %s',
    (field) => {
      const w = keep(
        mount(
          defineComponent({
            setup: () => () =>
              h(ConfigProvider, { prefixCls: 'audit' }, () =>
                h(Alert, {
                  role: 'status',
                  classNames: ({ props }) => ({
                    root: `resolved-${field === 'prefix' ? props.prefixCls : props.role}`,
                  }),
                }),
              ),
          }),
        ),
      );
      expect(w.get('.audit-alert').classes()).toContain(
        field === 'prefix' ? 'resolved-audit-alert' : 'resolved-status',
      );
    },
  );
  it.each(['variant', 'closable', 'className', 'style', 'classNames', 'styles'] as const)(
    'replaces and removes the current Provider %s field',
    async (field) => {
      const initial: AlertConfig = {
        variant: 'outlined',
        closable: false,
        className: 'first',
        style: { color: 'red' },
        classNames: { title: 'first-title' },
        styles: { title: { fontWeight: 400 } },
      };
      const replacement: AlertConfig = {
        variant: 'filled',
        closable: { closeIcon: 'Dismiss' },
        className: 'second',
        style: { color: 'blue' },
        classNames: { title: 'second-title' },
        styles: { title: { fontWeight: 900 } },
      };
      const config = shallowRef<AlertConfig>(initial);
      const wrapper = keep(
        mount(
          defineComponent({
            setup: () => () =>
              h(ConfigProvider, { components: { alert: { ...config.value } } }, () =>
                h(Alert, { title: 'Current' }),
              ),
          }),
          { global: { stubs: { teleport: false } } },
        ),
      );
      const original = wrapper.get('.apollo-alert').element;
      config.value = replacement;
      await nextTick();
      if (field === 'variant')
        expect(wrapper.get('.apollo-alert').classes()).toContain('apollo-alert-filled');
      if (field === 'closable') expect(wrapper.get('button').text()).toBe('Dismiss');
      if (field === 'className') expect(wrapper.get('.apollo-alert').classes()).toContain('second');
      if (field === 'style')
        expect(wrapper.get('.apollo-alert').attributes('style')).toContain('color: blue');
      if (field === 'classNames')
        expect(wrapper.get('.apollo-alert-title').classes()).toContain('second-title');
      if (field === 'styles')
        expect(wrapper.get('.apollo-alert-title').attributes('style')).toContain(
          'font-weight: 900',
        );
      config.value = {};
      await nextTick();
      expect(wrapper.get('.apollo-alert').element).toBe(original);
      expect(wrapper.get('.apollo-alert').classes()).toContain('apollo-alert-outlined');
      expect(wrapper.get('.apollo-alert').classes()).not.toContain('first');
      expect(wrapper.get('.apollo-alert').classes()).not.toContain('second');
      expect(wrapper.find('button').exists()).toBe(false);
      expect(wrapper.get('.apollo-alert-title').classes()).not.toContain('second-title');
      expect(wrapper.get('.apollo-alert-title').attributes('style') ?? '').not.toContain('900');
    },
  );

  it('keeps nearest Provider/local precedence and separate instances current', async () => {
    const icon = ref('first');
    const w = keep(
      mount(
        defineComponent({
          setup: () => () =>
            h(
              ConfigProvider,
              {
                components: {
                  alert: { variant: 'filled', closable: true, successIcon: h('span', icon.value) },
                },
              },
              () => [
                h(Alert, { id: 'first', type: 'success', showIcon: true, variant: 'outlined' }),
                h(
                  ConfigProvider,
                  { components: { alert: { variant: 'outlined', closable: false } } },
                  () => h(Alert, { id: 'second', title: 'Separate' }),
                ),
              ],
            ),
        }),
        { global: { stubs: { teleport: false } } },
      ),
    );
    icon.value = 'second';
    await nextTick();
    expect(w.get('#first').classes()).toContain('apollo-alert-outlined');
    expect(w.get('#first').get('.apollo-alert-icon').text()).toBe('second');
    expect(w.get('#first').get('button').element.tagName).toBe('BUTTON');
    expect(w.get('#second').find('button').exists()).toBe(false);
  });

  it.each(['success', 'info', 'warning', 'error'] as const)(
    'replaces and removes the current Provider %s icon',
    async (type) => {
      const field = `${type}Icon` as const;
      const first: AlertConfig = {};
      first[field] = h('span', 'First icon');
      const second: AlertConfig = {};
      second[field] = h('span', 'Current icon');
      const config = shallowRef(first);
      const w = keep(
        mount(
          defineComponent({
            setup: () => () =>
              h(ConfigProvider, { components: { alert: { ...config.value } } }, () =>
                h(Alert, { type, showIcon: true, title: 'Current icon' }),
              ),
          }),
          { global: { stubs: { teleport: false } } },
        ),
      );
      const original = w.get('.apollo-alert').element;
      expect(w.get('.apollo-alert-icon').text()).toBe('First icon');
      config.value = second;
      await nextTick();
      expect(w.get('.apollo-alert-icon').text()).toBe('Current icon');
      config.value = {};
      await nextTick();
      expect(w.get('.apollo-alert').element).toBe(original);
      expect(w.get('.apollo-alert-icon').text()).toBe('');
      expect(w.get('.apollo-alert-icon svg').element.tagName).toBe('svg');
      expect(w.get('.apollo-alert-icon').attributes('aria-hidden')).toBe('true');
      const fallback: AlertConfig = {};
      fallback[field] = null;
      config.value = fallback;
      await nextTick();
      expect(w.get('.apollo-alert-icon svg').element.tagName).toBe('svg');
      expect(w.get('.apollo-alert-icon').attributes('aria-hidden')).toBe('true');
    },
  );

  it('forwards current native attrs, once listeners and root styles to the actual root', async () => {
    const attrs = ref({ title: 'First hint', tabindex: 0 });
    const keydown = vi.fn();
    const clickOnce = vi.fn();
    const instance = ref<AlertRef | null>(null);
    const w = keep(
      mount(
        defineComponent({
          setup: () => () =>
            h(Alert, {
              ref: instance,
              ...attrs.value,
              onKeydown: keydown,
              onClickOnce: clickOnce,
              style: ['color: red', { backgroundColor: 'blue' }],
              title: attrs.value.title,
            }),
        }),
      ),
    );
    const root = w.get('.apollo-alert');
    expect(instance.value?.nativeElement).toBe(root.element);
    expect(root.attributes('tabindex')).toBe('0');
    await root.trigger('keydown', { key: 'Escape' });
    await root.trigger('click');
    await root.trigger('click');
    expect(keydown).toHaveBeenCalledTimes(1);
    expect(keydown.mock.calls[0]?.[0]).toBeInstanceOf(KeyboardEvent);
    expect(clickOnce).toHaveBeenCalledTimes(1);
    attrs.value = { title: 'Second hint', tabindex: 2 };
    await nextTick();
    expect(w.get('.apollo-alert').attributes('tabindex')).toBe('2');
    expect(w.get('.apollo-alert').element).toBe(root.element);
    expect(w.get('.apollo-alert').attributes('style')).toContain('color: red');
    expect(w.get('.apollo-alert').attributes('style')).toContain('background-color: blue');
  });

  it('semantic factories see each current merged type/variant and closability', async () => {
    const banner = ref(false);
    const closable = ref(false);
    const w = keep(
      mount(
        defineComponent({
          setup: () => () =>
            h(Alert, {
              banner: banner.value,
              closable: closable.value,
              classNames: ({ props }) => ({ root: `resolved-${props.type}-${props.closable}` }),
            }),
        }),
      ),
    );
    banner.value = true;
    closable.value = true;
    await nextTick();
    expect(w.get('.apollo-alert').classes()).toContain('resolved-warning-true');
  });
});

describe('Alert complete contract: complete slots and close lifecycle', () => {
  it('tracks conditionally added/removed closeIcon slots and the latest full content', async () => {
    const show = ref(false),
      label = ref('First');
    const w = keep(
      mount(
        defineComponent({
          components: { Alert },
          setup: () => ({ show, label }),
          template:
            '<Alert closable><template v-if="show" #closeIcon><span>{{ label }}</span><strong>Close</strong></template></Alert>',
        }),
      ),
    );
    show.value = true;
    await nextTick();
    expect(w.get('button').text()).toBe('FirstClose');
    label.value = 'Second';
    await nextTick();
    expect(w.get('button').text()).toBe('SecondClose');
    show.value = false;
    await nextTick();
    expect(w.get('button').find('.apollo-icon-close').exists()).toBe(true);
  });

  it('present empty closeIcon suppresses all fallback content and retains a named explicit close button', () => {
    const w = keep(
      mount(Alert, {
        props: { closable: { closeIcon: 'Must not appear' } },
        slots: { closeIcon: () => [] },
      }),
    );
    expect(w.get('button').text()).toBe('');
    expect(w.get('button').find('.apollo-icon-close').exists()).toBe(false);
    expect(w.get('button').attributes('aria-label')).toBe('Close');
  });

  it.each([0, false, null, ''])(
    'preserves an explicit closable.closeIcon value %s',
    (closeIcon) => {
      const w = keep(mount(Alert, { props: { closable: { closeIcon } } }));
      expect(w.get('button').find('.apollo-icon-close').exists()).toBe(false);
      expect(w.get('button').text()).toBe(closeIcon === 0 ? '0' : '');
      expect(w.get('button').attributes('aria-label')).toBe('Close');
    },
  );

  it('does not keep empty icon/action hosts or turn an empty title into fallback content', () => {
    const w = keep(
      mount(Alert, {
        props: { title: 'Fallback', showIcon: true },
        slots: { title: () => [], icon: () => undefined, action: () => h(Fragment, null, []) },
      }),
    );
    expect(w.find('.apollo-alert-title').exists()).toBe(false);
    expect(w.find('.apollo-alert-icon').exists()).toBe(false);
    expect(w.find('.apollo-alert-actions').exists()).toBe(false);
    expect(w.text()).not.toContain('Fallback');
  });

  it('notifies the Vue close listener and configuration hook once using the native event', async () => {
    const event = vi.fn(),
      configured = vi.fn();
    const w = keep(mount(Alert, { props: { closable: { onClose: configured }, onClose: event } }));
    await w.get('button').trigger('click');
    expect(event).toHaveBeenCalledTimes(1);
    expect(configured).toHaveBeenCalledTimes(1);
    expect(event.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
    expect(configured.mock.calls[0]?.[0]).toBe(event.mock.calls[0]?.[0]);
  });

  it('does not repeat a close request while the existing alert is leaving', async () => {
    const onClose = vi.fn();
    const w = keep(mount(Alert, { props: { closable: true, onClose } }));
    const button = w.get('button');
    await button.trigger('click');
    await button.trigger('click');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call the same function twice when also configured as a Vue once listener', async () => {
    const notify = vi.fn();
    const w = keep(
      mount(Alert, { props: { closable: { onClose: notify } }, attrs: { onCloseOnce: notify } }),
    );
    await w.get('button').trigger('click');
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('uses current Provider close hooks and reports completed removal without CSS motion', async () => {
    const closed = vi.fn(),
      removed = vi.fn(),
      vueAfter = vi.fn();
    const w = keep(
      mount(
        defineComponent({
          setup: () => () =>
            h(
              ConfigProvider,
              {
                theme: { token: { motion: false } },
                components: { alert: { closable: { onClose: closed, afterClose: removed } } },
              },
              () => h(Alert, { title: 'Closing', onAfterClose: vueAfter }),
            ),
        }),
        { global: { stubs: { teleport: false } } },
      ),
    );
    await w.get('button').trigger('click');
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(closed).toHaveBeenCalledTimes(1);
    expect(removed).toHaveBeenCalledTimes(1);
    expect(vueAfter).toHaveBeenCalledTimes(1);
    expect(w.find('.apollo-alert').exists()).toBe(false);
  });

  it('keeps full fragments, business draft and focus across current Provider updates', async () => {
    const cfg = shallowRef<AlertConfig>({ variant: 'outlined' });
    const w = keep(
      mount(
        defineComponent({
          setup: () => () =>
            h(ConfigProvider, { components: { alert: { ...cfg.value } } }, () =>
              h(
                Alert,
                { showIcon: true },
                {
                  title: () => [
                    h('span', 'First'),
                    h('input', { 'aria-label': 'Saved draft', defaultValue: 'Original' }),
                  ],
                  description: () => h(Fragment, null, ['Description', 0]),
                  action: () => [
                    h('button', { type: 'button' }, 'Save'),
                    h('button', { type: 'button' }, 'More'),
                  ],
                },
              ),
            ),
        }),
        { attachTo: document.body, global: { stubs: { teleport: false } } },
      ),
    );
    const input = w.get<HTMLInputElement>('input').element;
    input.value = 'Business draft';
    input.focus();
    cfg.value = { variant: 'filled', className: 'updated' };
    await nextTick();
    expect(w.get('input').element).toBe(input);
    expect(input.value).toBe('Business draft');
    expect(document.activeElement).toBe(input);
    expect(w.get('.apollo-alert-description').text()).toBe('Description0');
    expect(w.findAll('.apollo-alert-actions button')).toHaveLength(2);
  });
});

describe('Alert complete contract: current theme', () => {
  it('resets an explicit empty ThemeProvider through an unconfigured ConfigProvider', async () => {
    const custom = ref(true);
    const w = keep(
      mount(
        defineComponent({
          setup: () => () =>
            h(
              ConfigProvider,
              { theme: { token: { fontSize: 20 }, components: { Alert: { borderRadius: 21 } } } },
              () =>
                h(
                  ThemeProvider,
                  {
                    theme: custom.value
                      ? { token: { fontSize: 18 }, components: { Alert: { borderRadius: 19 } } }
                      : {},
                  },
                  () => h(ConfigProvider, {}, () => h(Alert, { title: 'Nearest source' })),
                ),
            ),
        }),
        { global: { stubs: { teleport: false } } },
      ),
    );
    const root = w.get<HTMLDivElement>('.apollo-alert').element;
    expect(root.style.getPropertyValue('--apollo-font-size')).toBe('18px');
    expect(root.style.getPropertyValue('--apollo-alert-border-radius')).toBe('19px');
    custom.value = false;
    await nextTick();
    expect(w.get('.apollo-alert').element).toBe(root);
    expect(root.style.getPropertyValue('--apollo-font-size')).toBe('14px');
    expect(root.style.getPropertyValue('--apollo-alert-border-radius')).toBe(
      `${getDesignToken().borderRadiusLG}px`,
    );
  });

  it('leaves CSS-only variables authoritative through ConfigProvider without a theme', async () => {
    const configured = ref(false);
    const w = keep(
      mount(
        defineComponent({
          setup: () => () =>
            h(
              'section',
              { style: { '--apollo-font-size': '18px' }, 'data-apollo-theme': 'dark-compact' },
              h(
                ConfigProvider,
                { theme: configured.value ? { token: { fontSize: 20 } } : undefined },
                () => h(Alert, { title: 'CSS source' }),
              ),
            ),
        }),
        { global: { stubs: { teleport: false } } },
      ),
    );
    const root = w.get<HTMLDivElement>('.apollo-alert').element;
    expect(root.style.getPropertyValue('--apollo-font-size')).toBe('');
    configured.value = true;
    await nextTick();
    expect(root.style.getPropertyValue('--apollo-font-size')).toBe('20px');
    configured.value = false;
    await nextTick();
    expect(w.get('.apollo-alert').element).toBe(root);
    expect(root.style.getPropertyValue('--apollo-font-size')).toBe('');
  });

  it('treats a custom theme context without source metadata as an explicit source', () => {
    const w = keep(
      mount(
        defineComponent({
          setup() {
            provide(ThemeContextKey, {
              config: shallowRef({}),
              token: computed(() => getDesignToken()),
            });
            return () => h(Alert, { title: 'Custom context' });
          },
        }),
      ),
    );
    expect(
      w.get<HTMLDivElement>('.apollo-alert').element.style.getPropertyValue('--apollo-font-size'),
    ).toBe('14px');
  });

  it('consumes all four current component tokens, preserves native overrides and removes them', async () => {
    const custom = ref(true);
    const w = keep(
      mount(
        defineComponent({
          setup: () => () =>
            h(
              ConfigProvider,
              {
                theme: custom.value
                  ? {
                      components: {
                        Alert: {
                          borderRadius: 19,
                          withDescriptionIconSize: 37,
                          defaultPadding: '7px 13px',
                          withDescriptionPadding: '11px 17px',
                        },
                      },
                    }
                  : undefined,
              },
              () =>
                h(Alert, {
                  title: 'Tokens',
                  description: 'Current',
                  showIcon: true,
                  style: { '--apollo-alert-border-radius': '23px' },
                }),
            ),
        }),
        { global: { stubs: { teleport: false } } },
      ),
    );
    const root = w.get<HTMLDivElement>('.apollo-alert').element;
    expect(root.style.getPropertyValue('--apollo-alert-border-radius')).toBe('23px');
    expect(root.style.getPropertyValue('--apollo-alert-with-description-icon-size')).toBe('37px');
    expect(root.style.getPropertyValue('--apollo-alert-default-padding')).toBe('7px 13px');
    expect(root.style.getPropertyValue('--apollo-alert-with-description-padding')).toBe(
      '11px 17px',
    );
    custom.value = false;
    await nextTick();
    expect(w.get('.apollo-alert').element).toBe(root);
    expect(root.style.getPropertyValue('--apollo-alert-border-radius')).toBe('23px');
    expect(root.style.getPropertyValue('--apollo-alert-with-description-icon-size')).toBe('');
  });
});

describe('Alert complete contract: native error boundary', () => {
  it('captures an actual descendant lifecycle failure', async () => {
    const Child = defineComponent({
      setup() {
        onMounted(() => {
          throw new Error('Mounted task failed');
        });
        return () => h('span', 'Before failure');
      },
    });
    const w = keep(mount(AlertErrorBoundary, { slots: { default: () => h(Child) } }));
    await nextTick();
    expect(w.get('.apollo-alert-title').text()).toBe('Error: Mounted task failed');
    expect(w.get('pre').text()).toContain('mounted hook');
  });

  it('keeps complete VNode fallback data current, including intentional empty values', async () => {
    const Child = defineComponent({
      setup() {
        throw new Error('Fallback data');
      },
    });
    const w = keep(
      mount(AlertErrorBoundary, {
        props: { title: h('strong', 'First'), description: [h('em', 'Full'), 0] },
        slots: { default: () => h(Child) },
      }),
    );
    await nextTick();
    const original = w.get('.apollo-alert').element;
    expect(w.get('.apollo-alert-title strong').text()).toBe('First');
    expect(w.get('.apollo-alert-description').text()).toBe('Full0');
    await w.setProps({ title: 0, description: false });
    expect(w.get('.apollo-alert').element).toBe(original);
    expect(w.get('.apollo-alert-title').text()).toBe('0');
    expect(w.find('.apollo-alert-description').exists()).toBe(false);
    await w.setProps({ title: '', description: h('span', 'Replaced') });
    expect(w.find('.apollo-alert-title').exists()).toBe(false);
    expect(w.get('.apollo-alert-description span').text()).toBe('Replaced');
  });

  it.each([0, false, null, undefined])(
    'captures the thrown value %s independently of its truthiness',
    async (value) => {
      const Throws = defineComponent({
        setup() {
          throw value;
        },
      });
      const w = keep(mount(AlertErrorBoundary, { slots: { default: () => h(Throws) } }));
      await nextTick();
      expect(w.get('.apollo-alert-title').text()).toBe(String(value));
    },
  );

  it('forwards fallback native attrs and styles without wrapping healthy fragments', async () => {
    const healthy = keep(
      mount(AlertErrorBoundary, { slots: { default: () => [h('span', 'A'), h('span', 'B')] } }),
    );
    expect(healthy.findAll('span')).toHaveLength(2);
    expect(healthy.find('.apollo-alert').exists()).toBe(false);
    const Throws = defineComponent({
      setup() {
        throw new Error('Captured');
      },
    });
    const w = keep(
      mount(AlertErrorBoundary, {
        attrs: {
          class: 'fallback',
          style: 'color: purple',
          'aria-label': 'Failure details',
          tabindex: 0,
        },
        slots: { default: () => h(Throws) },
      }),
    );
    await nextTick();
    expect(w.get('.apollo-alert').classes()).toContain('fallback');
    expect(w.get('.apollo-alert').attributes('aria-label')).toBe('Failure details');
    expect(w.get('.apollo-alert').attributes('tabindex')).toBe('0');
    expect(w.get('.apollo-alert').attributes('style')).toContain('color: purple');
  });

  it('captures errors from an actual descendant event using Vue error propagation', async () => {
    const Child = defineComponent({
      setup: () => () =>
        h(
          'button',
          {
            onClick() {
              throw new Error('Event failed');
            },
          },
          'Fail',
        ),
    });
    const w = keep(mount(AlertErrorBoundary, { slots: { default: () => h(Child) } }));
    await w.get('button').trigger('click');
    await nextTick();
    expect(w.get('.apollo-alert-title').text()).toBe('Error: Event failed');
    expect(w.get('pre').attributes('tabindex')).toBe('0');
    expect(w.get('pre').attributes('role')).toBe('region');
    expect(w.get('pre').attributes('aria-label')).toBe('Error details');
  });
});
