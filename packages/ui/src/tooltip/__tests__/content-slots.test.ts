import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref, type VNode, type VNodeChild } from 'vue';
import { renderToString } from 'vue/server-renderer';
import Popconfirm from '../../popconfirm/Popconfirm';
import PopconfirmPurePanel from '../../popconfirm/PurePanel';
import Popover from '../../popover/Popover';
import PopoverPurePanel from '../../popover/PurePanel';
import TooltipPurePanel from '../PurePanel';
import Tooltip from '../Tooltip';
import ConfirmCallbacks from './fixtures/ConfirmCallbacks.vue';

type ContentSlots = Record<string, () => VNodeChild>;
const trigger = () => h('button', { 'data-trigger': '' }, 'target');
const cases: { name: string; fields: string[]; render: (slots: ContentSlots) => VNode }[] = [
  {
    name: 'Tooltip',
    fields: ['title'],
    render: (slots) =>
      h(Tooltip, { open: true, title: 'prop-title' }, { default: trigger, ...slots }),
  },
  {
    name: 'TooltipPurePanel',
    fields: ['title'],
    render: (slots) => h(TooltipPurePanel, { title: 'prop-title' }, slots),
  },
  {
    name: 'Popover',
    fields: ['title', 'content'],
    render: (slots) =>
      h(
        Popover,
        { open: true, title: 'prop-title', content: 'prop-content' },
        { default: trigger, ...slots },
      ),
  },
  {
    name: 'PopoverPurePanel',
    fields: ['title', 'content'],
    render: (slots) => h(PopoverPurePanel, { title: 'prop-title', content: 'prop-content' }, slots),
  },
  {
    name: 'Popconfirm',
    fields: ['title', 'description', 'okText', 'cancelText'],
    render: (slots) =>
      h(
        Popconfirm,
        {
          open: true,
          title: 'prop-title',
          description: 'prop-description',
          okText: 'prop-okText',
          cancelText: 'prop-cancelText',
        },
        { default: trigger, ...slots },
      ),
  },
  {
    name: 'PopconfirmPurePanel',
    fields: ['title', 'description', 'okText', 'cancelText'],
    render: (slots) =>
      h(
        PopconfirmPurePanel,
        {
          title: 'prop-title',
          description: 'prop-description',
          okText: 'prop-okText',
          cancelText: 'prop-cancelText',
        },
        slots,
      ),
  },
];

describe('F11 overlay content slots', () => {
  it('native kebab-case business callback bindings preserve Promise results and current handlers', async () => {
    let resolve: (() => void) | undefined;
    const pending = new Promise<void>((done) => {
      resolve = done;
    });
    const onConfirm = vi.fn(() => pending);
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    const onPopupClick = vi.fn();
    const wrapper = mount(ConfirmCallbacks, {
      props: { onConfirm, onCancel, onOpenChange, onPopupClick },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await nextTick();
    const buttons = document.querySelectorAll<HTMLButtonElement>(
      '.apollo-popconfirm-buttons button',
    );
    buttons[1]?.click();
    await nextTick();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(expect.any(MouseEvent));
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onPopupClick).toHaveBeenCalledTimes(1);
    buttons[1]?.click();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    resolve?.();
    await pending;
    await nextTick();
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    const second = vi.fn();
    await wrapper.setProps({ onConfirm: second });
    buttons[1]?.click();
    await nextTick();
    expect(second).toHaveBeenCalledTimes(1);
    buttons[0]?.click();
    await nextTick();
    expect(onCancel).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent));
    wrapper.unmount();
  });

  for (const entry of cases) {
    it(`${entry.name}: current slot presence wins, including empty content`, async () => {
      const show = ref(false);
      const empty = ref(false);
      const label = ref('first');
      const Host = defineComponent(
        () => () =>
          entry.render(
            show.value
              ? Object.fromEntries(
                  entry.fields.map((field) => [
                    field,
                    () =>
                      empty.value
                        ? []
                        : h('span', { 'data-slot': field }, `${field}-${label.value}`),
                  ]),
                )
              : {},
          ),
      );
      const wrapper = mount(Host, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      const content = () => document.querySelector('[role="tooltip"]');
      await nextTick();
      expect(content()).not.toBeNull();
      for (const field of entry.fields) expect(content()?.textContent).toContain(`prop-${field}`);
      show.value = true;
      await nextTick();
      for (const field of entry.fields) {
        expect(content()?.textContent).toContain(`${field}-first`);
        expect(content()?.textContent).not.toContain(`prop-${field}`);
      }
      label.value = 'second';
      await nextTick();
      for (const field of entry.fields) expect(content()?.textContent).toContain(`${field}-second`);
      empty.value = true;
      await nextTick();
      for (const field of entry.fields)
        expect(content()?.textContent).not.toContain(`prop-${field}`);
      expect(content()?.querySelector('[data-slot]')).toBeNull();
      show.value = false;
      await nextTick();
      for (const field of entry.fields) expect(content()?.textContent).toContain(`prop-${field}`);
      wrapper.unmount();
    });
  }

  it('Tooltip empty title suppresses uncontrolled opening and notifications without evaluating slots in event handlers', async () => {
    const show = ref(false);
    const onOpenChange = vi.fn();
    const title = vi.fn(() => []);
    const Host = defineComponent(
      () => () =>
        h(
          Tooltip,
          { title: 'prop-title', trigger: 'click', onOpenChange },
          {
            default: trigger,
            ...(show.value ? { title } : {}),
          },
        ),
    );
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    show.value = true;
    await nextTick();
    const calls = title.mock.calls.length;
    document
      .querySelector('[data-trigger]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(title.mock.calls.length).toBe(calls);
    expect(document.querySelector('[data-trigger]')?.getAttribute('aria-describedby')).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('Tooltip runtime accepts the public zero and VNode data contract without warnings', async () => {
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(
      defineComponent(() => () => [
        h(TooltipPurePanel, { title: 0 }),
        h(Tooltip, { title: h('strong', 'data-node'), open: true }, { default: trigger }),
      ]),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    await nextTick();
    expect(document.body.textContent).toContain('0');
    expect(document.body.textContent).toContain('data-node');
    expect(warnings).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('SSR uses slots over title/content data props', async () => {
    const html = await renderToString(
      h(
        PopconfirmPurePanel,
        { title: 'prop-title', description: 'prop-description' },
        {
          title: () => h('strong', 'server-title'),
          description: () => [],
        },
      ),
    );
    expect(html).toContain('server-title');
    expect(html).not.toContain('prop-title');
    expect(html).not.toContain('prop-description');
  });

  for (const panel of [false, true]) {
    it(`Popover ${panel ? 'panel' : 'popup'} preserves body input when title slots appear or disappear`, async () => {
      const show = ref(false);
      const Host = defineComponent(() => () => {
        const slots = {
          content: () => h('input', { 'aria-label': 'Overlay note' }),
          ...(show.value ? { title: () => h('b', 'Current title') } : {}),
        };
        return panel
          ? h(PopoverPurePanel, {}, slots)
          : h(Popover, { open: true }, { default: trigger, ...slots });
      });
      const wrapper = mount(Host, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      await nextTick();
      const input = document.querySelector('input');
      if (!(input instanceof HTMLInputElement)) throw new Error('Expected overlay input');
      input.value = 'kept';
      input.focus();
      for (const value of [true, false, true]) {
        show.value = value;
        await nextTick();
        expect(document.querySelector('input')).toBe(input);
        expect(input.value).toBe('kept');
        expect(document.activeElement).toBe(input);
      }
      wrapper.unmount();
    });
  }

  it('native panel slots hydrate the server input and preserve its pretyped value', async () => {
    const label = ref('server');
    const Host = defineComponent(
      () => () =>
        h(
          PopconfirmPurePanel,
          { title: 'fallback' },
          {
            title: () => h('b', label.value),
            description: () => h('input', { 'aria-label': 'Server note' }),
          },
        ),
    );
    const container = document.createElement('div');
    container.innerHTML = await renderToString(h(Host));
    document.body.append(container);
    const input = container.querySelector('input');
    if (!(input instanceof HTMLInputElement)) throw new Error('Expected SSR input');
    input.value = 'typed before hydration';
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const app = createSSRApp(Host);
    try {
      app.mount(container);
      label.value = 'client';
      await nextTick();
      expect(container.querySelector('input')).toBe(input);
      expect(input.value).toBe('typed before hydration');
      expect(container.textContent).toContain('client');
      expect(container.textContent).not.toContain('fallback');
      expect(warnings).not.toHaveBeenCalled();
    } finally {
      app.unmount();
      container.remove();
    }
  });
});
