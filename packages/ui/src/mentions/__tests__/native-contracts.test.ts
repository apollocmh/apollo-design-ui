import type { ThemeConfig } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import ConfigProvider from '../../config-provider';
import { MentionsUnstableProvider } from '../engine/context';
import Mentions from '../index';
import type { MentionsRef } from '../interface';
import LegacyOptions from './fixtures/LegacyOptions.vue';

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

const options = [{ value: 'alpha', label: 'Alpha' }];
const settle = async () => {
  await nextTick();
  await nextTick();
};

describe('Mentions current native contracts', () => {
  it('reads current legacy Option template fragments and native classes', async () => {
    const deprecated = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const wrapper = mount(LegacyOptions, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    const editor = wrapper.get<HTMLTextAreaElement>('textarea').element;
    editor.setSelectionRange(1, 1);
    editor.dispatchEvent(new KeyboardEvent('keyup', { key: '@', bubbles: true }));
    await settle();
    const candidate = document.querySelector<HTMLElement>('.apollo-mentions-dropdown-menu-item');
    expect(candidate?.textContent?.trim()).toBe('alpha');
    expect(candidate?.classList.contains('candidate-native')).toBe(true);
    expect(candidate?.style.color).toBe('red');
    wrapper.vm.rename();
    await settle();
    expect(candidate?.textContent?.trim()).toBe('Current alpha');
    expect(candidate?.classList.contains('renamed')).toBe(true);
    expect(
      deprecated.mock.calls.flat().every((message) => String(message).includes('Mentions.Option')),
    ).toBe(true);
    wrapper.unmount();
  });
  for (const allowClear of [false, true]) {
    it(`hidden targets the actual outer root (clear=${allowClear})`, () => {
      const wrapper = mount(Mentions, { props: { hidden: true, allowClear } });
      expect(wrapper.get<HTMLElement>('.apollo-mentions').element.style.display).toBe('none');
      wrapper.unmount();
    });

    it(`uses current Provider styles and native editor attrs (clear=${allowClear})`, async () => {
      const phase = ref(0);
      const components = () =>
        phase.value === 2
          ? undefined
          : {
              mentions: {
                style: { minHeight: phase.value === 0 ? '50px' : '60px', width: '90px' },
                styles: { root: { width: '80px' }, suffix: { color: 'red' } },
                classNames: { root: phase.value === 0 ? 'provider-old' : 'provider-next' },
              },
            };
      const instance = ref<MentionsRef | null>(null);
      const Host = defineComponent(
        () => () =>
          h(ConfigProvider, { components: components() }, () =>
            h(Mentions, {
              ref: instance,
              allowClear,
              defaultValue: 'draft',
              'aria-label': `Editor ${phase.value}`,
              tabindex: phase.value === 0 ? 1 : undefined,
              'data-phase': phase.value,
              styles: { root: { width: '100px' }, suffix: { paddingTop: '3px' } },
            }),
          ),
      );
      const wrapper = mount(Host, { attachTo: document.body });
      const root = wrapper.get<HTMLElement>('.apollo-mentions').element;
      const editor = wrapper.get<HTMLTextAreaElement>('textarea').element;
      expect(root.style.minHeight).toBe('50px');
      expect(root.style.width).toBe('100px');
      expect(instance.value?.textarea).toBe(editor);
      expect(instance.value?.nativeElement).toBe(root);
      instance.value?.focus();
      expect(document.activeElement).toBe(editor);
      if (allowClear) {
        const suffix = wrapper.get<HTMLElement>('.apollo-mentions-suffix').element;
        expect(suffix.style.color).toBe('red');
        expect(suffix.style.paddingTop).toBe('3px');
      }
      phase.value = 1;
      await settle();
      expect(root.style.minHeight).toBe('60px');
      expect(root.classList.contains('provider-old')).toBe(false);
      expect(root.classList.contains('provider-next')).toBe(true);
      expect(editor.getAttribute('aria-label')).toBe('Editor 1');
      expect(editor.hasAttribute('tabindex')).toBe(false);
      expect(editor.dataset.phase).toBe('1');
      phase.value = 2;
      await settle();
      expect(root.style.minHeight).toBe('');
      expect(root.style.width).toBe('100px');
      expect(root.classList.contains('provider-next')).toBe(false);
      expect(wrapper.get('textarea').element).toBe(editor);
      expect(document.activeElement).toBe(editor);
      wrapper.unmount();
    });

    it(`keeps last accepted controlled value after rejected input and clear (clear=${allowClear})`, async () => {
      const value = ref<string | undefined>('accepted');
      const onUpdate = vi.fn();
      const Host = defineComponent(
        () => () =>
          h(Mentions, {
            value: value.value,
            allowClear,
            defaultValue: 'default',
            'onUpdate:value': onUpdate,
          }),
      );
      const wrapper = mount(Host, { attachTo: document.body });
      const editor = wrapper.get<HTMLTextAreaElement>('textarea');
      await editor.setValue('rejected');
      expect(onUpdate).toHaveBeenCalledExactlyOnceWith('rejected');
      expect(editor.element.value).toBe('accepted');
      if (allowClear) {
        await wrapper.get('.apollo-mentions-clear-icon').trigger('click');
        expect(editor.element.value).toBe('accepted');
      }
      value.value = 'later accepted';
      await settle();
      value.value = undefined;
      await settle();
      expect(editor.element.value).toBe('later accepted');
      await editor.setValue('local');
      expect(editor.element.value).toBe('local');
      expect(wrapper.get('textarea').element).toBe(editor.element);
      wrapper.unmount();
    });
  }

  it('carries current theme variables to root and teleported popup, including nested and removed sources', async () => {
    const theme = shallowRef<ThemeConfig | undefined>({
      token: { colorText: '#123456', controlHeight: 40, fontSize: 16 },
      components: {
        Mentions: {
          dropdownHeight: 170,
          controlItemWidth: 190,
          zIndexPopup: 1500,
          paddingInline: 17,
        },
      },
    });
    const nested = ref(false);
    const Host = defineComponent(
      () => () =>
        h(ConfigProvider, { theme: theme.value }, () => [
          h(MentionsUnstableProvider, { value: { open: true } }, () =>
            h(Mentions, {
              value: '@',
              options,
              class: 'theme-main',
              'aria-label': 'Themed mentions',
            }),
          ),
          nested.value
            ? h(
                ConfigProvider,
                { theme: { components: { Mentions: { dropdownHeight: 90 } } } },
                () => h(Mentions, { class: 'theme-nested' }),
              )
            : null,
        ]),
    );
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await settle();
    const root = wrapper.get<HTMLElement>('.theme-main').element;
    const popup = document.querySelector<HTMLElement>('.apollo-mentions-dropdown');
    expect(popup).not.toBeNull();
    expect(root.style.getPropertyValue('--apollo-mentions-dropdown-height')).toBe('170px');
    expect(root.style.getPropertyValue('--apollo-mentions-padding-inline')).toBe('17px');
    expect(popup?.style.getPropertyValue('--apollo-mentions-control-item-width')).toBe('190px');
    expect(popup?.style.getPropertyValue('--apollo-color-text')).toBe('#123456');
    nested.value = true;
    theme.value = {
      token: { colorText: '#654321', controlHeight: 24 },
      components: { Mentions: { dropdownHeight: 210 } },
    };
    await settle();
    expect(root.style.getPropertyValue('--apollo-mentions-dropdown-height')).toBe('210px');
    expect(root.style.getPropertyValue('--apollo-mentions-padding-inline')).toBe('11px');
    expect(popup?.style.getPropertyValue('--apollo-color-text')).toBe('#654321');
    const child = wrapper.get<HTMLElement>('.theme-nested').element;
    expect(child.style.getPropertyValue('--apollo-mentions-dropdown-height')).toBe('90px');
    expect(child.style.getPropertyValue('--apollo-color-text')).toBe('#654321');
    nested.value = false;
    theme.value = undefined;
    await settle();
    expect(root.style.getPropertyValue('--apollo-mentions-dropdown-height')).toBe('');
    expect(popup?.style.getPropertyValue('--apollo-color-text')).toBe('');
    expect(document.querySelector('.apollo-mentions-dropdown')).toBe(popup);
    wrapper.unmount();
    expect(document.querySelector('.apollo-mentions-dropdown')).toBeNull();
  });

  it('responds to replacement of the internal preview provider value', async () => {
    const opened = ref(false);
    const Host = defineComponent(
      () => () =>
        h(MentionsUnstableProvider, { value: { open: opened.value } }, () =>
          h(Mentions, { value: '@', options }),
        ),
    );
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    expect(document.querySelector('.apollo-mentions-dropdown')).toBeNull();
    opened.value = true;
    await settle();
    expect(document.querySelector('.apollo-mentions-dropdown-menu-item')?.textContent).toBe(
      'Alpha',
    );
    opened.value = false;
    await settle();
    expect(document.querySelector('.apollo-mentions-dropdown')).toBeNull();
    wrapper.unmount();
  });

  it('readOnly blocks clear and closes an existing candidate interaction', async () => {
    const readOnly = ref(false);
    const onChange = vi.fn();
    const wrapper = mount(
      defineComponent(
        () => () =>
          h(Mentions, {
            readOnly: readOnly.value,
            allowClear: true,
            options,
            defaultValue: '@',
            onChange,
          }),
      ),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    const editor = wrapper.get<HTMLTextAreaElement>('textarea').element;
    editor.setSelectionRange(1, 1);
    editor.dispatchEvent(new KeyboardEvent('keyup', { key: '@', bubbles: true }));
    await settle();
    expect(document.querySelector('.apollo-mentions-dropdown')).not.toBeNull();
    readOnly.value = true;
    await settle();
    expect(wrapper.get<HTMLButtonElement>('.apollo-mentions-clear-icon').element.disabled).toBe(
      true,
    );
    expect(document.querySelector('.apollo-mentions-dropdown')).toBeNull();
    await wrapper.get('.apollo-mentions-clear-icon').trigger('click');
    expect(editor.value).toBe('@');
    expect(onChange).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('semantic zIndex strings reach the popup unchanged', async () => {
    const wrapper = mount(MentionsUnstableProvider, {
      props: { value: { open: true } },
      slots: {
        default: () =>
          h(Mentions, {
            value: '@',
            options,
            styles: { popup: { zIndex: 'var(--custom-layer)' } },
          }),
      },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await settle();
    expect(document.querySelector<HTMLElement>('.apollo-mentions-dropdown')?.style.zIndex).toBe(
      'var(--custom-layer)',
    );
    wrapper.unmount();
  });

  it('uses current Provider popup container and the explicit container override', async () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    document.body.append(first, second);
    const moved = ref(false);
    const providerContainer = vi.fn((trigger?: HTMLElement) => {
      expect(trigger).toBeInstanceOf(HTMLElement);
      return moved.value ? second : first;
    });
    const explicit = ref(false);
    const Host = defineComponent(
      () => () =>
        h(ConfigProvider, { getPopupContainer: providerContainer }, () =>
          h(MentionsUnstableProvider, { value: { open: true } }, () =>
            h(Mentions, {
              value: '@',
              options,
              getPopupContainer: explicit.value ? () => first : undefined,
            }),
          ),
        ),
    );
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await settle();
    expect(first.querySelector('.apollo-mentions-dropdown')).not.toBeNull();
    moved.value = true;
    await settle();
    expect(first.querySelector('.apollo-mentions-dropdown')).toBeNull();
    expect(second.querySelector('.apollo-mentions-dropdown')).not.toBeNull();
    explicit.value = true;
    await settle();
    expect(first.querySelector('.apollo-mentions-dropdown')).not.toBeNull();
    expect(second.querySelector('.apollo-mentions-dropdown')).toBeNull();
    expect(providerContainer).toHaveBeenCalled();
    wrapper.unmount();
  });
});
