/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Tag / CheckableTag / Group
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/tag.dom.json`，由 `tests/compat/baseline/tag.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 Tag 产出。
 * 机械 oracle。`keepStyle: true`：动态内联色（hsl.l=0.95 浅底）与语义合并顺序
 * 是本组件最容易写错的地方。
 *
 * ── 刻意不在基线里 ───────────────────────────────────────────────────────────
 *
 * Wave（运行时波纹，无静态 DOM 差异，G1 §2.6）。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/tag.dom.json';
import { CheckableTag, CheckableTagGroup, Tag } from '../index';

const specs: Record<string, { render: () => DomRenderResult }> = {
  'tag:prefix-cls:no-props': { render: () => h(Tag, {}, () => 'x') },
  'tag:basic': { render: () => h(Tag, {}, () => 'Tag 1') },
  'tag:href': { render: () => h(Tag, { href: 'https://x', target: '_blank' }, () => 'Link') },
  'tag:disabled-href': { render: () => h(Tag, { href: 'https://x', disabled: true }, () => 'x') },
  'tag:aria-attrs': {
    render: () => h(Tag, { 'aria-label': 't', 'data-x': '1' } as never, () => 'x'),
  },
  'tag:preset-blue-filled': { render: () => h(Tag, { color: 'blue' }, () => 'x') },
  'tag:preset-blue-solid': { render: () => h(Tag, { color: 'blue', variant: 'solid' }, () => 'x') },
  'tag:preset-blue-outlined': {
    render: () => h(Tag, { color: 'blue', variant: 'outlined' }, () => 'x'),
  },
  'tag:status-success-filled': { render: () => h(Tag, { color: 'success' }, () => 'x') },
  'tag:status-success-solid': {
    render: () => h(Tag, { color: 'success', variant: 'solid' }, () => 'x'),
  },
  'tag:status-error-outlined': {
    render: () => h(Tag, { color: 'error', variant: 'outlined' }, () => 'x'),
  },
  'tag:custom-color-filled': { render: () => h(Tag, { color: '#2db7f5' }, () => 'x') },
  'tag:custom-color-solid': {
    render: () => h(Tag, { color: '#2db7f5', variant: 'solid' }, () => 'x'),
  },
  'tag:inverse-color': { render: () => h(Tag, { color: 'blue-inverse' }, () => 'x') },
  'tag:closable': { render: () => h(Tag, { closable: true }, () => 'x') },
  'tag:custom-close-icon': {
    // C8-R2：closeIcon 走 `#closeIcon` 插槽
    render: () =>
      h(Tag, { closable: true }, { default: () => 'x', closeIcon: () => h('em', null, 'x') }),
  },
  'tag:closable-disabled': { render: () => h(Tag, { closable: true, disabled: true }, () => 'x') },
  'tag:icon': {
    // C8-R2：icon 走 `#icon` 插槽
    render: () => h(Tag, {}, { default: () => 'x', icon: () => h('i', { class: 'my-icon' }) }),
  },
  'checkable:checked': { render: () => h(CheckableTag, { checked: true }, () => 'Yes') },
  'checkable:unchecked': { render: () => h(CheckableTag, { checked: false }, () => 'No') },
  'checkable:disabled': {
    render: () => h(CheckableTag, { checked: true, disabled: true }, () => 'No'),
  },
  'checkable-group:single': {
    render: () => h(CheckableTagGroup, { options: ['a', 'b'], value: 'a' }),
  },
  'checkable-group:multiple': {
    render: () => h(CheckableTagGroup, { options: ['a', 'b'], value: ['a'], multiple: true }),
  },
  'checkable-group:option-objects': {
    render: () => h(CheckableTagGroup, { options: [{ value: 'a', label: 'A' }], value: 'a' }),
  },
};

domContractTest('Tag', {
  baseline,
  keepStyle: true,
  allow: {
    // PLATFORM：客户端 CSSOM 把 hex 序列化为 rgb()（React SSR 是字符串拼接）。
    'tag:custom-color-filled': {
      reason: 'PLATFORM · CSSOM 颜色序列化',
      diff: [
        '$/span[0]: style 不同 [background-color:#e7f6fe;color:#2db7f5] vs [background-color:rgb(231,246,254);color:rgb(45,183,245)]',
      ],
    },
    'tag:custom-color-solid': {
      reason: 'PLATFORM · CSSOM 颜色序列化',
      diff: [
        '$/span[0]: style 不同 [background-color:#2db7f5] vs [background-color:rgb(45,183,245)]',
      ],
    },
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`[Tag L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
