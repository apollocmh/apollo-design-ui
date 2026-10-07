/**
 * Vue 侧（@apollo-design/ui）的 Transfer 视觉用例。与 react/transfer.jsx **逐条对应**。
 *
 * 2026-10-07 新增：transfer 是全仓最后一个没有 L6 覆盖的组件（详见 react 侧注释）。
 *
 * ⚠️ 两条纪律同 react 侧：**数据静态**（不绑 change）、**上下文字体钉具体值**
 * （`CONTEXT_FONT = 'sans-serif'`）—— 理由见 react/transfer.jsx 的文件头。
 */

import { Transfer } from '@apollo-design/ui';
import { h } from 'vue';

const MOCK = Array.from({ length: 20 }, (_, i) => ({
  key: i.toString(),
  title: `content${i + 1}`,
  description: `description of content${i + 1}`,
  disabled: i % 4 === 0,
}));

/** 与 React 侧同一份派生（key % 3 > 1）。 */
const TARGET = MOCK.filter((item) => Number(item.key) % 3 > 1).map((item) => item.key);
const SELECTED = ['1', '4'];

const CONTEXT_FONT = 'sans-serif';

const box = (children) =>
  h('div', { style: { padding: '24px', fontFamily: CONTEXT_FONT, minHeight: '340px' } }, children);

export default {
  basic: () =>
    box(
      h(Transfer, {
        dataSource: MOCK,
        targetKeys: TARGET,
        selectedKeys: SELECTED,
        render: (item) => item.title,
      }),
    ),

  search: () =>
    box(
      h(Transfer, {
        dataSource: MOCK,
        targetKeys: TARGET,
        showSearch: true,
        render: (item) => item.title,
      }),
    ),

  oneway: () =>
    box(
      h(Transfer, {
        dataSource: MOCK,
        targetKeys: TARGET,
        oneWay: true,
        render: (item) => item.title,
      }),
    ),
};
