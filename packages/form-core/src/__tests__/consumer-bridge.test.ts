import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, provide, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';

import { FormItem, Form as UiForm } from '../../../ui/src/form';
import UiNativeScopes from '../../../ui/src/form/__tests__/fixtures/NativeScopes.vue';
import { noStyleItemContextKey } from '../../../ui/src/form/context';
import type { FormItemSlots } from '../../../ui/src/form/interface';
import { Form as CoreForm } from '../form';
import type { FormRef } from '../form-types';
import { List } from '../list';
import NativeScopes from './fixtures/NativeScopes.vue';

const mounted: VueWrapper[] = [];
afterEach(() => {
  mounted.forEach((wrapper) => {
    wrapper.unmount();
  });
  mounted.length = 0;
  vi.restoreAllMocks();
});

describe('template and UI consumers', () => {
  it('core named scopes retain input identity and update actual controls', async () => {
    const wrapper = mount(NativeScopes, { global: { stubs: { teleport: false } } });
    mounted.push(wrapper);
    const input = wrapper.get('input');
    expect(input.element.value).toBe('Apollo');
    await input.setValue('typed');
    expect(wrapper.get('[data-values]').text()).toBe('typed');
    expect(wrapper.get('[data-touched]').text()).toBe('true');
    await wrapper.get('[data-fill]').trigger('click');
    expect(wrapper.get('input').element).toBe(input.element);
    expect(input.element.value).toBe('filled');
    await wrapper.get('[data-add]').trigger('click');
    expect(wrapper.get('[data-users]').text()).toBe('2:users');
    await wrapper.get('[data-reset]').trigger('click');
    expect(wrapper.get('input').element.value).toBe('Apollo');
  });

  it('UI Form, bound/layout Item and List consume the same named scopes', async () => {
    const wrapper = mount(UiNativeScopes, { global: { stubs: { teleport: false } } });
    mounted.push(wrapper);
    const input = wrapper.get('input');
    const item = wrapper.getComponent(FormItem);
    expect(input.element.value).toBe('Apollo');
    expect(wrapper.get('[data-layout]').text()).toBe('0:0:true');
    await input.setValue('typed');
    expect(wrapper.get('[data-values]').text()).toBe('typed');
    expect(input.attributes('data-touched')).toBe('true');
    expect(item.emitted('metaChange')).toHaveLength(1);
    await wrapper.get('[data-fill]').trigger('click');
    expect(wrapper.get('input').element).toBe(input.element);
    expect(input.element.value).toBe('filled');
    await wrapper.get('[data-add]').trigger('click');
    expect(wrapper.get('[data-users]').text()).toBe('2:0');
    await wrapper.get('form').trigger('reset');
    expect(item.emitted('reset')).toEqual([[]]);
    expect(wrapper.get('input').element.value).toBe('Apollo');
  });

  it('a standalone layout Item identifies the absent form without fake state', () => {
    let captured: Parameters<NonNullable<FormItemSlots['default']>>[0] | undefined;
    const wrapper = mount(FormItem, {
      props: { noStyle: true },
      slots: {
        default: (scope: Parameters<NonNullable<FormItemSlots['default']>>[0]) => {
          captured = scope;
          return h('output');
        },
      },
    });
    mounted.push(wrapper);
    expect(captured).toEqual({
      control: {},
      meta: {
        touched: false,
        validating: false,
        errors: [],
        warnings: [],
        name: [],
        validated: false,
      },
      form: undefined,
    });
  });

  it('SSR renders named scopes and initial values without mounting a watcher', async () => {
    const html = await renderToString(createSSRApp(NativeScopes));
    expect(html).toContain('value="Apollo"');
    expect(html).toContain('1:users');
    expect(html).toContain('data-values');
    expect(html).not.toContain('[object Object]');
  });

  it('UI custom component hosts expose the actual HTML element without prop warnings', () => {
    const warn = vi.spyOn(console, 'warn');
    const formRef = ref<FormRef | null>(null);
    const Host = defineComponent({
      setup:
        (_props, { slots }) =>
        () =>
          h('section', slots.default?.()),
    });
    const wrapper = mount(
      defineComponent({ setup: () => () => h(UiForm, { component: Host, ref: formRef }) }),
    );
    mounted.push(wrapper);
    expect(formRef.value?.nativeElement).toBe(wrapper.get('section').element);
    expect(warn).not.toHaveBeenCalled();
  });

  it('a List noStyle Item sends a flat stable key path with its metadata', async () => {
    const metaChange = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup() {
          provide(noStyleItemContextKey, metaChange);
          return () =>
            h(
              CoreForm,
              { initialValues: { users: [{ profile: { name: 'Apollo' } }] } },
              {
                default: () =>
                  h(
                    List,
                    { name: 'users' },
                    {
                      default: () =>
                        h(
                          FormItem,
                          { name: [0, 'profile', 'name'], noStyle: true },
                          {
                            default: () => h('input'),
                          },
                        ),
                    },
                  ),
              },
            );
        },
      }),
    );
    mounted.push(wrapper);
    await wrapper.get('input').setValue('typed');
    expect(metaChange.mock.calls.at(-1)?.[1]).toEqual([0, 'profile', 'name']);
  });
});
