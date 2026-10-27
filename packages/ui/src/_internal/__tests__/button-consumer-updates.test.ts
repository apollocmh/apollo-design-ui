import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import Button from '../../button/Button.vue';
import { InputSearch } from '../../input';
import PopconfirmDemo from '../../popconfirm/demo/async.vue';
import Popconfirm from '../../popconfirm/Popconfirm';
import { SpaceCompact } from '../../space';
import UploadDemo from '../../upload/demo/default-file-list.vue';

afterEach(() => {
  vi.useRealTimers();
});

it('Compact forwards replaced child props and native attrs without replacing focused children', async () => {
  const busy = ref(false);
  const caption = ref('First');
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(
          SpaceCompact,
          { 'data-caption': caption.value },
          {
            default: () => h(Button, { loading: busy.value }, () => caption.value),
          },
        ),
    }),
    { attachTo: document.body },
  );
  try {
    const button = wrapper.get('button').element;
    button.focus();
    busy.value = true;
    caption.value = 'Second';
    await nextTick();
    expect(wrapper.get('button').attributes('aria-busy')).toBe('true');
    expect(wrapper.get('button').text()).toBe('Second');
    expect(wrapper.get('button').element).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(wrapper.attributes('data-caption')).toBe('Second');
    busy.value = false;
    await nextTick();
    expect(wrapper.get('button').attributes('aria-busy')).toBeUndefined();
  } finally {
    wrapper.unmount();
  }
});

it('Compact reads conditional compiled slot children on every parent render', async () => {
  const show = ref(true);
  const wrapper = mount(
    defineComponent({
      setup: () => () => {
        const children = show.value ? [h(Button, { key: 'a' }, () => 'A')] : [];
        return h(SpaceCompact, null, { default: () => children });
      },
    }),
  );
  try {
    expect(wrapper.find('button').exists()).toBe(true);
    show.value = false;
    await nextTick();
    expect(wrapper.find('.apollo-space-compact').exists()).toBe(false);
    show.value = true;
    await nextTick();
    expect(wrapper.get('button').classes()).toContain('apollo-btn-compact-last-item');
  } finally {
    wrapper.unmount();
  }
});

it('Input.Search forwards dynamic loading through Compact and preserves its input', async () => {
  const wrapper = mount(InputSearch, { props: { enterButton: 'Search', loading: false } });
  try {
    const input = wrapper.get('input').element;
    await wrapper.get('input').setValue('Apollo');
    await wrapper.setProps({ loading: true });
    expect(wrapper.get('button').attributes('aria-busy')).toBe('true');
    expect(wrapper.get('input').element).toBe(input);
    expect(wrapper.get('input').element.value).toBe('Apollo');
    await wrapper.setProps({ loading: false });
    expect(wrapper.get('button').attributes('aria-busy')).toBeUndefined();
  } finally {
    wrapper.unmount();
  }
});

it('the original async Popconfirm demo stays open and busy until its operation finishes', async () => {
  vi.useFakeTimers();
  const wrapper = mount(PopconfirmDemo, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  try {
    await wrapper.get('button').trigger('click');
    await nextTick();
    const ok = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.apollo-popconfirm-buttons button'),
    ).at(-1);
    expect(ok).toBeDefined();
    ok?.click();
    await nextTick();
    expect(ok?.getAttribute('aria-busy')).toBe('true');
    expect(
      document.querySelector('.apollo-popconfirm')?.classList.contains('apollo-popconfirm-hidden'),
    ).toBe(false);
    await vi.advanceTimersByTimeAsync(2100);
    await flushPromises();
    expect(wrapper.findComponent(Popconfirm).props('open')).toBe(false);
    // Closed overlays may retain frozen content. Reopening must use current loading.
    await wrapper.get('button').trigger('click');
    await nextTick();
    expect(
      document
        .querySelector('.apollo-popconfirm-buttons button:last-child')
        ?.getAttribute('aria-busy'),
    ).not.toBe('true');
  } finally {
    wrapper.unmount();
  }
});

it('Popconfirm forwards externally controlled loading independently of its action promise', async () => {
  const wrapper = mount(Popconfirm, {
    props: { open: true, title: 'Confirm', okButtonProps: { loading: false } },
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    slots: { default: () => h('button', 'Target') },
  });
  try {
    const button = () => document.querySelector('.apollo-popconfirm-buttons button:last-child');
    await wrapper.setProps({ okButtonProps: { loading: true } });
    expect(button()?.getAttribute('aria-busy')).toBe('true');
    await wrapper.setProps({ okButtonProps: { loading: false } });
    expect(button()?.getAttribute('aria-busy')).toBeNull();
  } finally {
    wrapper.unmount();
  }
});

it('the original Upload demo announces the removed file through Vue change', async () => {
  const wrapper = mount(UploadDemo);
  try {
    expect(wrapper.findAll('.apollo-upload-list-item')).toHaveLength(3);
    await wrapper.get('.apollo-upload-list-item button').trigger('click');
    await flushPromises();
    expect(wrapper.findAll('.apollo-upload-list-item')).toHaveLength(2);
    expect(wrapper.get('[aria-live]').text()).toContain('annual-report-2025.pdf：removed');
  } finally {
    wrapper.unmount();
  }
});
