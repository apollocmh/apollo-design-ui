/** demo 冒烟 —— 18 个示例（与 antd 用户可见 demo 一一对应，`expectCount` 钉死）。 */
import { demoTest } from '@apollo-design/test-utils';
import { DOMWrapper, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import FormInDrawer from '../demo/form-in-drawer.vue';
import UserProfile from '../demo/user-profile.vue';

demoTest('Drawer', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 18,
  global: { stubs: { teleport: false } },
});

describe('Drawer named Demo scenes', () => {
  const wrappers: { unmount(): void }[] = [];
  afterEach(() => {
    for (const wrapper of wrappers.splice(0)) wrapper.unmount();
    document.body.replaceChildren();
    vi.useRealTimers();
  });
  async function settle() {
    await nextTick();
    await vi.advanceTimersByTimeAsync(600);
    await nextTick();
  }
  function panel() {
    const element = document.querySelector<HTMLElement>('.apollo-drawer');
    if (!element) throw new Error('Expected an actual Drawer');
    return new DOMWrapper(element);
  }

  it('validates the actual drawer form, submits once and starts a clean session after closing', async () => {
    vi.useFakeTimers();
    const wrapper = mount(FormInDrawer, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await wrapper.get('button').trigger('click');
    await settle();
    const form = panel().get<HTMLFormElement>('form');
    const submit = panel().get<HTMLButtonElement>('button[type="submit"]');
    expect(submit.element.form).toBe(form.element);
    submit.element.click();
    await settle();
    expect(panel().text()).toContain('请输入姓名');
    expect(panel().text()).toContain('请输入邮箱');
    await panel().get('input[aria-label="姓名"]').setValue('林晓');
    await panel().get('input[aria-label="邮箱"]').setValue('invalid');
    submit.element.click();
    await settle();
    expect(panel().text()).toContain('请输入有效的邮箱地址');
    expect(panel().classes()).toContain('apollo-drawer-open');
    await panel().get('.contact-form-cancel').trigger('click');
    await settle();
    expect(panel().classes()).not.toContain('apollo-drawer-open');
    await wrapper.get('button').trigger('click');
    await settle();
    expect(panel().get<HTMLInputElement>('input[aria-label="姓名"]').element.value).toBe('');
    expect(panel().get<HTMLInputElement>('input[aria-label="邮箱"]').element.value).toBe('');
    expect(panel().find('.apollo-form-item-explain-error').exists()).toBe(false);
    await panel().get('input[aria-label="姓名"]').setValue('林晓');
    await panel().get('input[aria-label="邮箱"]').setValue('lin@example.com');
    panel().get<HTMLButtonElement>('button[type="submit"]').element.click();
    await settle();
    expect(panel().classes()).not.toContain('apollo-drawer-open');
    expect(wrapper.findAll('.apollo-alert')).toHaveLength(1);
    expect(wrapper.get('.apollo-alert').text()).toContain('林晓');
    expect(wrapper.get('.apollo-alert').text()).toContain('lin@example.com');
    await wrapper.get('button').trigger('click');
    await settle();
    expect(panel().get<HTMLInputElement>('input[aria-label="姓名"]').element.value).toBe('');
    expect(wrapper.find('.apollo-alert').exists()).toBe(false);
    await panel().get('input[aria-label="姓名"]').setValue('未提交草稿');
    await panel().get('.apollo-drawer-close').trigger('click');
    await settle();
    await wrapper.get('button').trigger('click');
    await settle();
    expect(panel().get<HTMLInputElement>('input[aria-label="姓名"]').element.value).toBe('');
  });

  it('renders real profile details and retains them across close/reopen', async () => {
    vi.useFakeTimers();
    const wrapper = mount(UserProfile, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await wrapper.get('button').trigger('click');
    await settle();
    expect(panel().text()).toContain('林晓');
    expect(panel().text()).toContain('lin@example.com');
    expect(panel().text()).toContain('产品设计师');
    expect(panel().findAll('.apollo-descriptions')).toHaveLength(2);
    expect(panel().text()).not.toContain('Some contents');
    await panel().get('.profile-close').trigger('click');
    await settle();
    expect(panel().classes()).not.toContain('apollo-drawer-open');
    await wrapper.get('button').trigger('click');
    await settle();
    expect(panel().text()).toContain('lin@example.com');
    expect(panel().classes()).toContain('apollo-drawer-open');
  });
});
