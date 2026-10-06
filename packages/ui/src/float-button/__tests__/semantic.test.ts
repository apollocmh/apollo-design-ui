/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— FloatButton
 *
 * 基准：`tests/compat/baselines/float-button.dom.json`（机械 oracle）。
 * ⚠️ prefixCls 传完整前缀 `'apollo-float-btn'`（坑 79 同族）。SSR 安全形态。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/float-button.dom.json';
import { FloatButton } from '../index';

/** 两侧共用的完整前缀。与 `tests/compat/baseline/float-button.mjs` 的 PREFIX 一致。 */
const PREFIX = 'apollo-float-btn';

const CASES: Record<string, () => DomRenderResult> = {
  plain: () => h(FloatButton, { prefixCls: PREFIX }),
  'type:primary': () => h(FloatButton, { prefixCls: PREFIX, type: 'primary' }),
  'shape:square': () => h(FloatButton, { prefixCls: PREFIX, shape: 'square' }),
  content: () => h(FloatButton, { prefixCls: PREFIX, shape: 'square' }, { content: () => 'HELP' }),
  description: () => h(FloatButton, { prefixCls: PREFIX, shape: 'square', description: 'HELP' }),
  href: () => h(FloatButton, { prefixCls: PREFIX, href: 'https://example.com' }),
  disabled: () => h(FloatButton, { prefixCls: PREFIX, disabled: true }),
  // ⚠️ badge 集成不在 L4：Badge 作为 Button children 的嵌入形态存在结构差异
  //    （wrapper 层/sup 标签），由 L1 结构断言 + Badge 自身 L4 覆盖
  'class-name': () => h(FloatButton, { prefixCls: PREFIX, class: 'extra' }),
  'prefix-cls:custom': () => h(FloatButton, { prefixCls: 'custom' }),
  'prefix-cls:no-props': () => h(FloatButton),
};

const ALLOW = {
  plain: {
    reason:
      'UPSTREAM\uff1aantd \u7684 React \u7a7a\u5b50\u8282\u70b9\u8ba1\u6570\u602a\u7656 \u2014\u2014 FloatButton \u7ed9 Button \u4f20\u7684 children \u662f [content(null), badge(null)]\uff0cReact.Children.count \u628a null \u4e5f\u8ba1\u4e3a 2 \u21d2 Button \u7684 icon-only \u5224\u636e\uff08hasChildren=true\uff09\u4e0d\u843d `-icon-only` \u7c7b\uff1bVue \u4fa7\u7a7a\u8282\u70b9\u88ab\u8fc7\u6ee4 \u21d2 \u6b63\u5e38\u843d\u7c7b\u3002FloatButton \u5c42\u7684 `-icon-only` \u7c7b\u4e24\u4fa7\u4e00\u81f4\uff08COMPATIBILITY.md D113\uff0c\u767b\u8bb0\u4e3a\u4e0a\u6e38\u602a\u7656\u4e0d\u8ddf\u968f\uff09\u3002',
    deviationId: 'D113',
    diff: [
      '$/button[0]: 类名不同 [apollo-btn apollo-btn-circle apollo-btn-color-default apollo-btn-default apollo-btn-lg apollo-btn-variant-outlined apollo-float-btn apollo-float-btn-circle apollo-float-btn-default apollo-float-btn-icon-only apollo-float-btn-individual] vs [apollo-btn apollo-btn-circle apollo-btn-color-default apollo-btn-default apollo-btn-icon-only apollo-btn-lg apollo-btn-variant-outlined apollo-float-btn apollo-float-btn-circle apollo-float-btn-default apollo-float-btn-icon-only apollo-float-btn-individual]',
    ],
  },
  'type:primary': {
    reason:
      'UPSTREAM\uff1aantd \u7684 React \u7a7a\u5b50\u8282\u70b9\u8ba1\u6570\u602a\u7656 \u2014\u2014 FloatButton \u7ed9 Button \u4f20\u7684 children \u662f [content(null), badge(null)]\uff0cReact.Children.count \u628a null \u4e5f\u8ba1\u4e3a 2 \u21d2 Button \u7684 icon-only \u5224\u636e\uff08hasChildren=true\uff09\u4e0d\u843d `-icon-only` \u7c7b\uff1bVue \u4fa7\u7a7a\u8282\u70b9\u88ab\u8fc7\u6ee4 \u21d2 \u6b63\u5e38\u843d\u7c7b\u3002FloatButton \u5c42\u7684 `-icon-only` \u7c7b\u4e24\u4fa7\u4e00\u81f4\uff08COMPATIBILITY.md D113\uff0c\u767b\u8bb0\u4e3a\u4e0a\u6e38\u602a\u7656\u4e0d\u8ddf\u968f\uff09\u3002',
    deviationId: 'D113',
    diff: [
      '$/button[0]: 类名不同 [apollo-btn apollo-btn-circle apollo-btn-color-primary apollo-btn-lg apollo-btn-primary apollo-btn-variant-solid apollo-float-btn apollo-float-btn-circle apollo-float-btn-icon-only apollo-float-btn-individual apollo-float-btn-primary] vs [apollo-btn apollo-btn-circle apollo-btn-color-primary apollo-btn-icon-only apollo-btn-lg apollo-btn-primary apollo-btn-variant-solid apollo-float-btn apollo-float-btn-circle apollo-float-btn-icon-only apollo-float-btn-individual apollo-float-btn-primary]',
    ],
  },
  'shape:square': {
    reason:
      'UPSTREAM\uff1aantd \u7684 React \u7a7a\u5b50\u8282\u70b9\u8ba1\u6570\u602a\u7656 \u2014\u2014 FloatButton \u7ed9 Button \u4f20\u7684 children \u662f [content(null), badge(null)]\uff0cReact.Children.count \u628a null \u4e5f\u8ba1\u4e3a 2 \u21d2 Button \u7684 icon-only \u5224\u636e\uff08hasChildren=true\uff09\u4e0d\u843d `-icon-only` \u7c7b\uff1bVue \u4fa7\u7a7a\u8282\u70b9\u88ab\u8fc7\u6ee4 \u21d2 \u6b63\u5e38\u843d\u7c7b\u3002FloatButton \u5c42\u7684 `-icon-only` \u7c7b\u4e24\u4fa7\u4e00\u81f4\uff08COMPATIBILITY.md D113\uff0c\u767b\u8bb0\u4e3a\u4e0a\u6e38\u602a\u7656\u4e0d\u8ddf\u968f\uff09\u3002',
    deviationId: 'D113',
    diff: [
      '$/button[0]: 类名不同 [apollo-btn apollo-btn-color-default apollo-btn-default apollo-btn-lg apollo-btn-variant-outlined apollo-float-btn apollo-float-btn-default apollo-float-btn-icon-only apollo-float-btn-individual apollo-float-btn-square] vs [apollo-btn apollo-btn-color-default apollo-btn-default apollo-btn-icon-only apollo-btn-lg apollo-btn-variant-outlined apollo-float-btn apollo-float-btn-default apollo-float-btn-icon-only apollo-float-btn-individual apollo-float-btn-square]',
    ],
  },
  href: {
    reason:
      'UPSTREAM\uff1aantd \u7684 React \u7a7a\u5b50\u8282\u70b9\u8ba1\u6570\u602a\u7656 \u2014\u2014 FloatButton \u7ed9 Button \u4f20\u7684 children \u662f [content(null), badge(null)]\uff0cReact.Children.count \u628a null \u4e5f\u8ba1\u4e3a 2 \u21d2 Button \u7684 icon-only \u5224\u636e\uff08hasChildren=true\uff09\u4e0d\u843d `-icon-only` \u7c7b\uff1bVue \u4fa7\u7a7a\u8282\u70b9\u88ab\u8fc7\u6ee4 \u21d2 \u6b63\u5e38\u843d\u7c7b\u3002FloatButton \u5c42\u7684 `-icon-only` \u7c7b\u4e24\u4fa7\u4e00\u81f4\uff08COMPATIBILITY.md D113\uff0c\u767b\u8bb0\u4e3a\u4e0a\u6e38\u602a\u7656\u4e0d\u8ddf\u968f\uff09\u3002',
    deviationId: 'D113',
    diff: [
      '$/a[0]: 类名不同 [apollo-btn apollo-btn-circle apollo-btn-color-default apollo-btn-default apollo-btn-lg apollo-btn-variant-outlined apollo-float-btn apollo-float-btn-circle apollo-float-btn-default apollo-float-btn-icon-only apollo-float-btn-individual] vs [apollo-btn apollo-btn-circle apollo-btn-color-default apollo-btn-default apollo-btn-icon-only apollo-btn-lg apollo-btn-variant-outlined apollo-float-btn apollo-float-btn-circle apollo-float-btn-default apollo-float-btn-icon-only apollo-float-btn-individual]',
    ],
  },
  disabled: {
    reason:
      'UPSTREAM\uff1aantd \u7684 React \u7a7a\u5b50\u8282\u70b9\u8ba1\u6570\u602a\u7656 \u2014\u2014 FloatButton \u7ed9 Button \u4f20\u7684 children \u662f [content(null), badge(null)]\uff0cReact.Children.count \u628a null \u4e5f\u8ba1\u4e3a 2 \u21d2 Button \u7684 icon-only \u5224\u636e\uff08hasChildren=true\uff09\u4e0d\u843d `-icon-only` \u7c7b\uff1bVue \u4fa7\u7a7a\u8282\u70b9\u88ab\u8fc7\u6ee4 \u21d2 \u6b63\u5e38\u843d\u7c7b\u3002FloatButton \u5c42\u7684 `-icon-only` \u7c7b\u4e24\u4fa7\u4e00\u81f4\uff08COMPATIBILITY.md D113\uff0c\u767b\u8bb0\u4e3a\u4e0a\u6e38\u602a\u7656\u4e0d\u8ddf\u968f\uff09\u3002',
    deviationId: 'D113',
    diff: [
      '$/button[0]: 类名不同 [apollo-btn apollo-btn-circle apollo-btn-color-default apollo-btn-default apollo-btn-lg apollo-btn-variant-outlined apollo-float-btn apollo-float-btn-circle apollo-float-btn-default apollo-float-btn-icon-only apollo-float-btn-individual] vs [apollo-btn apollo-btn-circle apollo-btn-color-default apollo-btn-default apollo-btn-icon-only apollo-btn-lg apollo-btn-variant-outlined apollo-float-btn apollo-float-btn-circle apollo-float-btn-default apollo-float-btn-icon-only apollo-float-btn-individual]',
    ],
  },
  'class-name': {
    reason:
      'UPSTREAM\uff1aantd \u7684 React \u7a7a\u5b50\u8282\u70b9\u8ba1\u6570\u602a\u7656 \u2014\u2014 FloatButton \u7ed9 Button \u4f20\u7684 children \u662f [content(null), badge(null)]\uff0cReact.Children.count \u628a null \u4e5f\u8ba1\u4e3a 2 \u21d2 Button \u7684 icon-only \u5224\u636e\uff08hasChildren=true\uff09\u4e0d\u843d `-icon-only` \u7c7b\uff1bVue \u4fa7\u7a7a\u8282\u70b9\u88ab\u8fc7\u6ee4 \u21d2 \u6b63\u5e38\u843d\u7c7b\u3002FloatButton \u5c42\u7684 `-icon-only` \u7c7b\u4e24\u4fa7\u4e00\u81f4\uff08COMPATIBILITY.md D113\uff0c\u767b\u8bb0\u4e3a\u4e0a\u6e38\u602a\u7656\u4e0d\u8ddf\u968f\uff09\u3002',
    deviationId: 'D113',
    diff: [
      '$/button[0]: 类名不同 [apollo-btn apollo-btn-circle apollo-btn-color-default apollo-btn-default apollo-btn-lg apollo-btn-variant-outlined apollo-float-btn apollo-float-btn-circle apollo-float-btn-default apollo-float-btn-icon-only apollo-float-btn-individual extra] vs [apollo-btn apollo-btn-circle apollo-btn-color-default apollo-btn-default apollo-btn-icon-only apollo-btn-lg apollo-btn-variant-outlined apollo-float-btn apollo-float-btn-circle apollo-float-btn-default apollo-float-btn-icon-only apollo-float-btn-individual extra]',
    ],
  },
  'prefix-cls:custom': {
    reason:
      'UPSTREAM\uff1aantd \u7684 React \u7a7a\u5b50\u8282\u70b9\u8ba1\u6570\u602a\u7656 \u2014\u2014 FloatButton \u7ed9 Button \u4f20\u7684 children \u662f [content(null), badge(null)]\uff0cReact.Children.count \u628a null \u4e5f\u8ba1\u4e3a 2 \u21d2 Button \u7684 icon-only \u5224\u636e\uff08hasChildren=true\uff09\u4e0d\u843d `-icon-only` \u7c7b\uff1bVue \u4fa7\u7a7a\u8282\u70b9\u88ab\u8fc7\u6ee4 \u21d2 \u6b63\u5e38\u843d\u7c7b\u3002FloatButton \u5c42\u7684 `-icon-only` \u7c7b\u4e24\u4fa7\u4e00\u81f4\uff08COMPATIBILITY.md D113\uff0c\u767b\u8bb0\u4e3a\u4e0a\u6e38\u602a\u7656\u4e0d\u8ddf\u968f\uff09\u3002',
    deviationId: 'D113',
    diff: [
      '$/button[0]: 类名不同 [apollo-btn apollo-btn-circle apollo-btn-color-default apollo-btn-default apollo-btn-lg apollo-btn-variant-outlined custom custom-circle custom-default custom-icon-only custom-individual] vs [apollo-btn apollo-btn-circle apollo-btn-color-default apollo-btn-default apollo-btn-icon-only apollo-btn-lg apollo-btn-variant-outlined custom custom-circle custom-default custom-icon-only custom-individual]',
    ],
  },
  'prefix-cls:no-props': {
    reason:
      'antd \u9ed8\u8ba4\u524d\u7f00 `ant` vs \u672c\u4ed3 `apollo`\uff08D6\uff09+ D113\uff08icon-only \u7c7b\uff09\u3002rate \u671f\u5751 79 \u540c\u65cf\uff1a\u7c7b\u94fe\u542b `-float-btn` \u540e\u7f00\u3002',
    deviationId: 'D6',
    diff: [
      '$/button[0]: 类名不同 [apollo-btn apollo-btn-circle apollo-btn-color-default apollo-btn-default apollo-btn-lg apollo-btn-variant-outlined apollo-float-btn apollo-float-btn-circle apollo-float-btn-default apollo-float-btn-icon-only apollo-float-btn-individual] vs [apollo-btn apollo-btn-circle apollo-btn-color-default apollo-btn-default apollo-btn-icon-only apollo-btn-lg apollo-btn-variant-outlined apollo-float-btn apollo-float-btn-circle apollo-float-btn-default apollo-float-btn-icon-only apollo-float-btn-individual]',
    ],
  },
};

domContractTest('FloatButton', {
  baseline,
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        '[FloatButton semantic.test] 基线里有用例 "' +
          id +
          '"，但 CASES 里没有对应构造。基线里的用例：' +
          baseline.cases.map((c) => c.id).join(', '),
      );
    }
    return build();
  },
  keepStyle: false,
  allow: ALLOW,
});

describe('FloatButton · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
