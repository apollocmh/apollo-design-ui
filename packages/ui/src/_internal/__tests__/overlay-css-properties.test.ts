import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type CSSProperties, defineComponent, h, nextTick, ref, type VNode } from 'vue';
import Popconfirm from '../../popconfirm/Popconfirm';
import PopconfirmPurePanel from '../../popconfirm/PurePanel';
import Popover from '../../popover/Popover';
import PopoverPurePanel from '../../popover/PurePanel';
import TooltipPurePanel from '../../tooltip/PurePanel';
import Tooltip from '../../tooltip/Tooltip';

interface Case {
  name: string;
  render: (css: CSSProperties, pure: boolean) => VNode;
  regions: string[];
}
const cases: Case[] = [
  {
    name: 'Tooltip',
    render: (css, pure) => {
      const props = { title: 'Title', styles: { root: css, container: css, arrow: css } };
      return pure
        ? h(TooltipPurePanel, props)
        : h(
            Tooltip,
            { ...props, open: true },
            {
              default: () => h('button', 'Tooltip trigger'),
            },
          );
    },
    regions: ['.apollo-tooltip', '.apollo-tooltip-container', '.apollo-tooltip-arrow'],
  },
  {
    name: 'Popover',
    render: (css, pure) => {
      const props = {
        title: 'Title',
        content: 'Content',
        styles: { root: css, container: css, arrow: css, title: css, content: css },
      };
      return pure
        ? h(PopoverPurePanel, props)
        : h(
            Popover,
            { ...props, open: true },
            {
              default: () => h('button', 'Popover trigger'),
            },
          );
    },
    regions: [
      '.apollo-popover',
      '.apollo-popover-container',
      '.apollo-popover-arrow',
      '.apollo-popover-title',
      '.apollo-popover-content',
    ],
  },
  {
    name: 'Popconfirm',
    render: (css, pure) => {
      const props = {
        title: 'Title',
        description: 'Description',
        styles: { root: css, container: css, arrow: css, icon: css, title: css, content: css },
      };
      return pure
        ? h(PopconfirmPurePanel, props)
        : h(
            Popconfirm,
            { ...props, open: true },
            {
              default: () => h('button', 'Popconfirm trigger'),
            },
          );
    },
    regions: [
      '.apollo-popconfirm',
      '.apollo-popover-container',
      '.apollo-popover-arrow',
      '.apollo-popconfirm-message-icon',
      '.apollo-popconfirm-title',
      '.apollo-popconfirm-description',
    ],
  },
];

describe.each(cases)('$name Vue CSSProperties DOM', ({ render, regions }) => {
  it.each([false, true])(
    'updates semantic CSS values and clears undefined values (PurePanel=%s)',
    async (pure) => {
      const enabled = ref(true);
      const Host = defineComponent({
        setup: () => () => {
          const css: CSSProperties = {
            marginLeft: enabled.value ? '7px' : undefined,
            borderTopWidth: undefined,
            '--overlay-css-value': enabled.value ? 'current' : undefined,
          };
          return render(css, pure);
        },
      });
      const wrapper = mount(Host, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      try {
        await nextTick();
        await nextTick();
        const nodes = regions.map((selector) => {
          const node = document.querySelector<HTMLElement>(selector);
          if (!node) throw new Error(`Expected actual overlay region ${selector}`);
          expect(node.style.marginLeft).toBe('7px');
          expect(node.style.getPropertyValue('--overlay-css-value')).toBe('current');
          return node;
        });
        enabled.value = false;
        await nextTick();
        for (const [index, node] of nodes.entries()) {
          const selector = regions[index];
          if (!selector) throw new Error('Expected region selector');
          expect(document.querySelector(selector)).toBe(node);
          expect(node.style.marginLeft).toBe('');
          expect(node.style.getPropertyValue('--overlay-css-value')).toBe('');
        }
      } finally {
        wrapper.unmount();
      }
    },
  );
});
