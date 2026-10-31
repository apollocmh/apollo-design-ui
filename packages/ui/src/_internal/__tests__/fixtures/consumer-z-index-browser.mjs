import { ZINDEX_KEY } from '@apollo-design/portal';
import { getDesignToken, transformToken } from '@apollo-design/theme';
import { createApp, defineComponent, h, inject, nextTick, ref } from 'vue';
import ConfigProvider from '../../../config-provider/ConfigProvider.ts';
import DatePicker from '../../../date-picker/DatePicker.vue';
import RangePicker from '../../../date-picker/RangePicker.vue';
import { genDatePickerStyle } from '../../../date-picker/style/index.ts';
import Dropdown from '../../../dropdown/Dropdown.ts';
import { genDropdownStyle } from '../../../dropdown/style/index.ts';
import Preview from '../../../image/Preview.ts';
import { genImageStyle } from '../../../image/style/index.ts';
import Mentions from '../../../mentions/Mentions.ts';
import { genMentionsStyle } from '../../../mentions/style/index.ts';
import { genTooltipStyle } from '../../../tooltip/style/index.ts';
import Tooltip from '../../../tooltip/Tooltip.ts';
import { genTreeSelectStyle } from '../../../tree-select/style/index.ts';
import TreeSelect from '../../../tree-select/TreeSelect.ts';

const TooltipContext = defineComponent({
  setup() {
    const context = inject(ZINDEX_KEY, null);
    return () => h('span', { 'data-tooltip-context': context?.value }, 'Actual nested Tooltip');
  },
});
const NestedLayer = defineComponent({
  setup() {
    const context = inject(ZINDEX_KEY, null);
    return () =>
      h(
        Tooltip,
        {
          open: true,
          arrow: false,
          placement: 'right',
          classNames: { root: 'consumer-nested-tooltip' },
        },
        {
          default: () => h('button', { 'data-consumer-context': context?.value }, 'Nested layer'),
          title: () => h(TooltipContext),
        },
      );
  },
});

const metadata = {
  Dropdown: { popup: '.apollo-dropdown', token: '--apollo-dropdown-z-index-popup' },
  DatePicker: { popup: '.apollo-picker-dropdown', token: '--apollo-date-picker-z-index-popup' },
  RangePicker: { popup: '.apollo-picker-dropdown', token: '--apollo-date-picker-z-index-popup' },
  TreeSelect: {
    popup: '.apollo-tree-select-dropdown',
    token: '--apollo-select-z-index-popup',
    tokenOwner: '.apollo-tree-select',
  },
  Mentions: { popup: '.apollo-mentions-dropdown', token: '--apollo-mentions-z-index-popup' },
  ImagePreview: { popup: '.apollo-image-preview', token: '--apollo-image-z-index-popup' },
};

const settle = async () => {
  await nextTick();
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
};

export function mountConsumerStack(target) {
  for (const [name, value] of Object.entries(transformToken(getDesignToken()).vars))
    document.documentElement.style.setProperty(name, value);
  document.documentElement.style.setProperty('--consumer-expression-layer', '2460');
  const css = document.createElement('style');
  css.textContent = [
    genTooltipStyle(),
    genDropdownStyle(),
    genDatePickerStyle('apollo'),
    genTreeSelectStyle('apollo'),
    genMentionsStyle(),
    genImageStyle(),
  ].join('\n');
  document.head.append(css);

  const active = ref('Dropdown');
  const custom = ref();
  const theme = ref({});
  const renderConsumer = () => {
    const zIndex = custom.value;
    switch (active.value) {
      case 'Dropdown':
        return h(
          Dropdown,
          { open: true, zIndex },
          {
            default: () => h('button', 'Dropdown'),
            popupRender: () => h(NestedLayer),
          },
        );
      case 'DatePicker':
      case 'RangePicker':
        return h(
          active.value === 'DatePicker' ? DatePicker : RangePicker,
          {
            open: true,
            styles: { popup: { root: { zIndex } } },
          },
          { extraFooter: () => h(NestedLayer) },
        );
      case 'TreeSelect':
        return h(TreeSelect, {
          open: true,
          treeData: [],
          popupStyle: { zIndex },
          notFoundContent: h(NestedLayer),
        });
      case 'Mentions':
        return h(Mentions, {
          options: [],
          styles: { popup: { zIndex } },
          notFoundContent: h(NestedLayer),
        });
      case 'ImagePreview':
        return h(
          Preview,
          {
            open: true,
            prefixCls: 'apollo-image-preview',
            styles: { root: { zIndex } },
          },
          { previewImage: () => h(NestedLayer) },
        );
    }
  };
  const app = createApp(
    defineComponent({
      setup: () => () =>
        h(ConfigProvider, { theme: theme.value }, () =>
          h('section', { key: active.value }, [renderConsumer()]),
        ),
    }),
  );
  app.mount(target);
  return {
    async show(name) {
      custom.value = undefined;
      theme.value = {};
      active.value = name;
      await settle();
      if (name === 'Mentions') {
        const textarea = document.querySelector('textarea');
        textarea.focus();
        textarea.value = '@';
        textarea.setSelectionRange(1, 1);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        await nextTick();
        textarea.dispatchEvent(new KeyboardEvent('keyup', { key: '@', bubbles: true }));
        await settle();
      }
    },
    async patch(kind) {
      if (kind === 'zero') custom.value = 0;
      if (kind === 'clearCustom') custom.value = undefined;
      if (kind === 'tokens')
        theme.value = {
          components: { Mentions: { zIndexPopup: '3060' }, Image: { zIndexPopup: 3080 } },
        };
      if (kind === 'replaceTokens')
        theme.value = {
          components: { Mentions: { zIndexPopup: '4060' }, Image: { zIndexPopup: 4080 } },
        };
      if (kind === 'clearTokens') theme.value = {};
      if (kind === 'expressionToken')
        theme.value = {
          components: { Mentions: { zIndexPopup: 'var(--consumer-expression-layer)' } },
        };
      if (kind === 'expressionStyle') custom.value = 'var(--consumer-expression-layer)';
      await settle();
    },
    read() {
      const { popup: selector, token, tokenOwner } = metadata[active.value];
      const popup = document.querySelector(selector);
      const tooltip = document.querySelector('.consumer-nested-tooltip');
      if (!popup || !tooltip) return null;
      const style = getComputedStyle(popup);
      const defaultStyle = tokenOwner
        ? getComputedStyle(document.querySelector(tokenOwner))
        : style;
      const tooltipStyle = getComputedStyle(tooltip);
      const box = tooltip.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return {
        visual: style.zIndex,
        context: popup
          .querySelector('[data-consumer-context]')
          ?.getAttribute('data-consumer-context'),
        cssToken: defaultStyle.getPropertyValue(token).trim(),
        inlineCssToken: popup.style.getPropertyValue(token),
        cssTokenOwner: tokenOwner ?? selector,
        popupCssToken: style.getPropertyValue(token).trim(),
        inlineZIndex: popup.style.zIndex,
        position: style.position,
        tooltipVisual: tooltipStyle.zIndex,
        tooltipContext: tooltip
          .querySelector('[data-tooltip-context]')
          ?.getAttribute('data-tooltip-context'),
        tooltipVisible: box.width > 0 && box.height > 0 && tooltipStyle.visibility === 'visible',
        tooltipHit: !!hit?.closest('.consumer-nested-tooltip'),
      };
    },
    async unmount() {
      app.unmount();
      await settle();
      return document.querySelector('.consumer-nested-tooltip') === null;
    },
  };
}
