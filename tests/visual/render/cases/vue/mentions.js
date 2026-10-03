/**
 * Vue 侧（@apollo-design/ui）的 Mentions 视觉用例。与 react/mentions.jsx 逐条对应。
 *
 * ⚠️ `panel` 变体：与 React 侧同款做法 —— `onMounted` 后派发 `input` + `keyup`
 *    展开候选，并把浮层挂到自己的 wrapper（否则 portal 到 body 的面板不在 `#stage` 里）。
 */

import { Mentions } from '@apollo-design/ui';
import { h, nextTick, onMounted, ref } from 'vue';

const OPTIONS = [
  { value: 'afc163', label: 'afc163' },
  { value: 'zombieJ', label: 'zombieJ' },
  { value: 'yesmeck', label: 'yesmeck' },
];

const box = (children, minHeight = 200) =>
  h('div', { style: { minHeight: `${minHeight}px`, padding: '16px', width: '420px' } }, children);

const column = (...children) =>
  h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, children);

/** 挂载后敲 `@`，把候选面板钉在静态帧里。 */
const OpenPanel = {
  setup() {
    const holder = ref(null);

    onMounted(async () => {
      await nextTick();
      const ta = holder.value?.querySelector('textarea');
      if (!ta) return;
      ta.value = '@';
      ta.setSelectionRange(1, 1);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: '@' }));
    });

    return () =>
      h(
        'div',
        {
          ref: holder,
          style: { position: 'relative', minHeight: '220px', padding: '16px', width: '420px' },
        },
        [
          h(Mentions, {
            options: OPTIONS,
            value: '@',
            style: { width: '320px' },
            getPopupContainer: () => holder.value,
          }),
        ],
      );
  },
};

export default {
  basic: () =>
    box([
      column(
        h(Mentions, { options: OPTIONS, defaultValue: '@afc163', style: { width: '320px' } }),
        h(Mentions, {
          options: OPTIONS,
          defaultValue: '@zombieJ',
          disabled: true,
          style: { width: '320px' },
        }),
      ),
    ]),

  sizes: () =>
    box([
      column(
        h(Mentions, { size: 'large', placeholder: 'large size', style: { width: '320px' } }),
        h(Mentions, { placeholder: 'default size', style: { width: '320px' } }),
        h(Mentions, { size: 'small', placeholder: 'small size', style: { width: '320px' } }),
      ),
    ]),

  variants: () =>
    box(
      [
        column(
          h(Mentions, { placeholder: 'Outlined', style: { width: '320px' } }),
          h(Mentions, { placeholder: 'Filled', variant: 'filled', style: { width: '320px' } }),
          h(Mentions, {
            placeholder: 'Borderless',
            variant: 'borderless',
            style: { width: '320px' },
          }),
          h(Mentions, {
            placeholder: 'Underlined',
            variant: 'underlined',
            style: { width: '320px' },
          }),
        ),
      ],
      320,
    ),

  status: () =>
    box([
      column(
        h(Mentions, { defaultValue: '@afc163', status: 'error', style: { width: '320px' } }),
        h(Mentions, { defaultValue: '@afc163', status: 'warning', style: { width: '320px' } }),
      ),
    ]),

  allowClear: () =>
    box([
      column(
        h(Mentions, { defaultValue: 'hello world', allowClear: true, style: { width: '320px' } }),
        h(Mentions, {
          defaultValue: 'hello world',
          allowClear: true,
          rows: 3,
          style: { width: '320px' },
        }),
      ),
    ]),

  readOnly: () =>
    box([
      column(
        h(Mentions, {
          placeholder: 'this is disabled Mentions',
          disabled: true,
          style: { width: '320px' },
        }),
        h(Mentions, {
          placeholder: 'this is readOnly Mentions',
          readOnly: true,
          style: { width: '320px' },
        }),
      ),
    ]),

  semantic: () =>
    box([
      column(
        h(Mentions, {
          defaultValue: '@afc163',
          allowClear: true,
          classNames: { root: 'mentions-visual-root', textarea: 'mentions-visual-textarea' },
          styles: {
            root: { border: '1px solid #722ed1' },
            textarea: { color: '#1677ff' },
            suffix: { color: '#eb2f96' },
          },
          style: { width: '320px' },
        }),
      ),
    ]),

  panel: () => h(OpenPanel),
};
