import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import {
  type ClassValue,
  defineComponent,
  h,
  nextTick,
  ref,
  type StyleValue,
  type VNode,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import Popconfirm from '../../popconfirm/Popconfirm';
import PopconfirmPurePanel from '../../popconfirm/PurePanel';
import TooltipPurePanel from '../../tooltip/PurePanel';
import Popover from '../Popover';
import PopoverPurePanel from '../PurePanel';

interface NativeAttrs {
  class: ClassValue;
  style: StyleValue;
}
const semantic = {
  classNames: { root: 'semantic-root' },
  styles: { root: { minHeight: '70px', maxWidth: '220px' } },
};
const trigger = () => h('button', { 'data-attrs-trigger': '' }, 'target');
afterEach(() => {
  document.body.replaceChildren();
});
const cases: {
  name: string;
  selector: string;
  panel: boolean;
  render: (attrs: NativeAttrs) => VNode;
}[] = [
  {
    name: 'TooltipPurePanel',
    selector: '.apollo-tooltip-pure',
    panel: true,
    render: (attrs) => h(TooltipPurePanel, { title: 'Title', ...semantic, ...attrs }),
  },
  {
    name: 'PopoverPurePanel',
    selector: '.apollo-popover-pure',
    panel: true,
    render: (attrs) =>
      h(PopoverPurePanel, { title: 'Title', content: 'Content', ...semantic, ...attrs }),
  },
  {
    name: 'PopconfirmPurePanel',
    selector: '.apollo-popover-pure',
    panel: true,
    render: (attrs) => h(PopconfirmPurePanel, { title: 'Title', ...semantic, ...attrs }),
  },
  {
    name: 'Popover',
    selector: '.apollo-popover',
    panel: false,
    render: (attrs) =>
      h(
        Popover,
        { open: true, title: 'Title', content: 'Content', ...semantic, ...attrs },
        { default: trigger },
      ),
  },
  {
    name: 'Popconfirm',
    selector: '.apollo-popconfirm',
    panel: false,
    render: (attrs) =>
      h(Popconfirm, { open: true, title: 'Title', ...semantic, ...attrs }, { default: trigger }),
  },
];

describe('F10 overlay native class/style', () => {
  for (const name of ['PopoverPurePanel', 'PopconfirmPurePanel']) {
    it(`${name}: native padding is root-only and does not override styles.container`, async () => {
      const props = {
        title: 'Title',
        style: 'padding:20px',
        styles: { container: { padding: '6px' } },
      };
      const render = () =>
        name === 'PopoverPurePanel' ? h(PopoverPurePanel, props) : h(PopconfirmPurePanel, props);
      const wrapper = mount(
        defineComponent(() => render),
        { attachTo: document.body },
      );
      expect(document.querySelector<HTMLElement>('.apollo-popover-pure')?.style.padding).toBe(
        '20px',
      );
      expect(document.querySelector<HTMLElement>('.apollo-popover-container')?.style.padding).toBe(
        '6px',
      );
      const server = document.createElement('div');
      server.innerHTML = await renderToString(render());
      expect(server.querySelector<HTMLElement>('.apollo-popover-pure')?.style.padding).toBe('20px');
      expect(server.querySelector<HTMLElement>('.apollo-popover-container')?.style.padding).toBe(
        '6px',
      );
      wrapper.unmount();
    });
  }
  it('PopconfirmPurePanel forwards root/container/arrow semantics alongside its message semantics', () => {
    const wrapper = mount(PopconfirmPurePanel, {
      props: {
        title: 'Title',
        description: 'Details',
        classNames: {
          root: 'own-root',
          container: 'own-container',
          arrow: 'own-arrow',
          title: 'own-title',
        },
        styles: {
          root: { minHeight: '80px' },
          container: { borderRadius: '14px' },
          arrow: { opacity: 0.4 },
          title: { color: 'red' },
        },
      },
      attachTo: document.body,
    });
    expect(document.querySelector('.apollo-popconfirm')?.classList.contains('own-root')).toBe(true);
    expect(document.querySelector<HTMLElement>('.apollo-popconfirm')?.style.minHeight).toBe('80px');
    expect(
      document.querySelector('.apollo-popover-container')?.classList.contains('own-container'),
    ).toBe(true);
    expect(
      document.querySelector<HTMLElement>('.apollo-popover-container')?.style.borderRadius,
    ).toBe('14px');
    expect(document.querySelector('.apollo-popover-arrow')?.classList.contains('own-arrow')).toBe(
      true,
    );
    expect(document.querySelector<HTMLElement>('.apollo-popover-arrow')?.style.opacity).toBe('0.4');
    expect(document.querySelector<HTMLElement>('.own-title')?.style.color).toBe('red');
    wrapper.unmount();
  });
  for (const entry of cases) {
    it(`${entry.name}: string styles merge with semantic root styles`, async () => {
      const wrapper = mount(
        defineComponent(
          () => () =>
            entry.render({
              class: ['native-class', { enabled: true }],
              style: 'max-width: 310px; padding-top: 9px; --native-phase: first',
            }),
        ),
        { attachTo: document.body, global: { stubs: { teleport: false } } },
      );
      await nextTick();
      const root = document.querySelector<HTMLElement>(entry.selector);
      expect(root).not.toBeNull();
      expect(root?.classList.contains('semantic-root')).toBe(true);
      expect(root?.classList.contains('native-class')).toBe(true);
      expect(root?.classList.contains('enabled')).toBe(true);
      expect(root?.style.maxWidth).toBe('310px');
      expect(root?.style.minHeight).toBe('70px');
      expect(root?.style.paddingTop).toBe('9px');
      expect(root?.style.getPropertyValue('--native-phase')).toBe('first');
      expect(
        document.querySelector<HTMLElement>('[data-attrs-trigger]')?.style.maxWidth ?? '',
      ).toBe('');
      wrapper.unmount();
    });

    it(`${entry.name}: attrs-only replacement updates and clears root styles without remounting`, async () => {
      const phase = ref(0);
      const Host = defineComponent(
        () => () =>
          entry.render({
            class: ['native', { first: phase.value === 0, next: phase.value === 1 }],
            style:
              phase.value === 0
                ? { maxWidth: '300px', paddingTop: '8px' }
                : phase.value === 1
                  ? ['max-width: 340px', { paddingBottom: '10px' }]
                  : undefined,
          }),
      );
      const wrapper = mount(Host, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      await nextTick();
      const root = document.querySelector<HTMLElement>(entry.selector);
      expect(root?.style.maxWidth).toBe('300px');
      phase.value = 1;
      await nextTick();
      expect(document.querySelector(entry.selector)).toBe(root);
      expect(root?.classList.contains('first')).toBe(false);
      expect(root?.classList.contains('next')).toBe(true);
      expect(root?.style.maxWidth).toBe('340px');
      expect(root?.style.paddingTop).toBe('');
      expect(root?.style.paddingBottom).toBe('10px');
      phase.value = 2;
      await nextTick();
      expect(root?.style.maxWidth).toBe('220px');
      expect(root?.style.paddingBottom).toBe('');
      expect(root?.style.minHeight).toBe('70px');
      wrapper.unmount();
    });

    if (entry.panel)
      it(`${entry.name}: SSR serializes native string CSS rather than character indices`, async () => {
        const html = await renderToString(
          entry.render({ class: 'native', style: 'max-width:310px;--native-phase:server' }),
        );
        expect(html).toContain('max-width:310px');
        expect(html).toContain('--native-phase:server');
        expect(html).not.toMatch(/(?:style="|;)[0-9]+:/);
      });
  }
});
