/**
 * L5 无障碍 —— Transfer 的 role/ARIA 契约与 axe 扫描。
 *
 * 判据（antd 6.6.4 = 内化 transfer）：
 *  - 列表本体 `<ul>`（list 语义）；条目 `<li>`，默认可点击行承担 checkbox 的交互；
 *  - 头部全选 checkbox 是**原生 input**（label 包裹）；
 *  - oneWay 右列删除按钮 `aria-label={locale.remove}`；
 *  - 操作按钮是 `<button type=button>`（原生禁用语义）。
 *
 * axe：demo 维度 + 真实配置维度。Transfer 的交互面是「label 包 input + button」，
 * 结构上无已知违规；`aria-label` 由上游契约提供。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import type { TransferItem } from '../interface';
import Transfer from '../Transfer';

a11yDemoTest('Transfer', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  allow: [],
});

const TAGS = ['wcag2a', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const DATA_SOURCE: TransferItem[] = Array.from({ length: 6 }, (_, i) => ({
  key: String(i),
  title: `content${i + 1}`,
  disabled: i === 3,
}));

const mountA11y = (props: Record<string, unknown> = {}) =>
  mount(h(Transfer as never, { dataSource: DATA_SOURCE, ...props } as never), {
    attachTo: document.body,
  });

describe('Transfer · axe 扫描', () => {
  const cases: Record<string, Record<string, unknown>> = {
    basic: {},
    'target-keys+selected': { targetKeys: ['1', '4'], selectedKeys: ['0'] },
    'show-search': { showSearch: true },
    'one-way': { oneWay: true, targetKeys: ['1', '4'] },
    pagination: { pagination: { pageSize: 2 } },
    disabled: { disabled: true },
    'actions-text': { actions: ['去右边', '去左边'] },
    titles: { titles: ['Source', 'Target'] },
  };

  for (const [name, props] of Object.entries(cases)) {
    it(`axe: ${name}`, async () => {
      const wrapper = mountA11y(props);
      await new Promise((r) => setTimeout(r, 30));
      // 与 pagination 同判：只扫组件子树（避免 body 级 `region` 噪音）
      const results = await axe.run(wrapper.element as Element, {
        runOnly: { type: 'tag', values: TAGS },
      });
      const violations = results.violations.filter((v) => v.nodes.length > 0);
      expect(violations.map((v) => v.id)).toEqual([]);
      wrapper.unmount();
    });
  }
});

describe('Transfer · ARIA 契约', () => {
  it('oneWay 右列删除按钮有 aria-label（locale.remove）', () => {
    const wrapper = mountA11y({ oneWay: true, targetKeys: ['1', '4'] });
    const remove = wrapper.find('.apollo-transfer-list-content-item-remove');
    expect(remove.attributes('aria-label')).toBe('Remove');
    wrapper.unmount();
  });

  it('操作按钮是原生 button（禁用语义由 disabled attr 承担）', () => {
    const wrapper = mountA11y();
    const buttons = wrapper.findAll('.apollo-transfer-actions button');
    expect(buttons.length).toBe(2);
    expect(buttons[0]!.attributes('type')).toBe('button');
    wrapper.unmount();
  });

  it('头部全选是原生 checkbox input', () => {
    const wrapper = mountA11y();
    const cb = wrapper.find('.apollo-transfer-list-checkbox input');
    expect(cb.exists()).toBe(true);
    expect(cb.attributes('type')).toBe('checkbox');
    wrapper.unmount();
  });
});
