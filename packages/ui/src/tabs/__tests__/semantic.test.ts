/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Tabs
 *
 * 基准：`tests/compat/baselines/tabs.dom.json`（机械 oracle，26 用例）。`keepStyle: false`。
 *
 * ⚠️ **两侧都显式传 `id`**（`tabs-test`）—— 上游的 `id` 是**异步生成**的（SSR 首帧是 `null`，
 *    于是 `aria-controls` / `aria-labelledby` / `id` 都不渲染），不固定 `id` 就会系统性错位。
 *    细节见 `tests/compat/baseline/tabs.mjs` 的文件头。
 *
 * ⚠️ 基线只钉**参数驱动的静态形态**；下面这些**不在**基线里（各有专属的层）：
 *   - 导航区**真的溢出**（`-nav-more` 的可见性）—— 由 DOM 实测驱动，SSR 恒判定为「无隐藏页签」，
 *     只能靠 L6 视觉（真浏览器 + 窄容器）；
 *   - 点击改值 / 键盘移动焦点 / `destroyOnHidden` 的离场卸载 —— 运行时行为，由 L2 的
 *     `index.test.ts` 钉；
 *   - 溢出下拉的浮层结构（`role=listbox` 的菜单）—— 只在打开时渲染，走 portal。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import baseline from '../../../../../tests/compat/baselines/tabs.dom.json';
import Tabs from '../Tabs.vue';

/** 与基线生成器一致的固定 id。 */
const ID = 'tabs-test';

const items = () => [
  { key: '1', label: 'Tab 1', children: 'Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Pane 2' },
  { key: '3', label: 'Tab 3', children: 'Pane 3', disabled: true },
];

const cmp = (props: Record<string, unknown>) => h(Tabs as never, { id: ID, ...props } as never);

const CASES: Record<string, () => DomRenderResult> = {
  'tabs:basic': () => cmp({ defaultActiveKey: '1', items: items() }),
  'tabs:active-second': () => cmp({ defaultActiveKey: '2', items: items() }),
  'tabs:no-items': () => cmp({ items: [] }),
  'tabs:no-children': () => cmp({ items: [{ key: '1', label: 'Only' }] }),
  'tabs:card': () => cmp({ defaultActiveKey: '1', type: 'card', items: items() }),
  'tabs:editable-card': () =>
    cmp({ defaultActiveKey: '1', type: 'editable-card', items: items(), onEdit: () => {} }),
  'tabs:editable-hide-add': () =>
    cmp({
      defaultActiveKey: '1',
      type: 'editable-card',
      hideAdd: true,
      items: items(),
      onEdit: () => {},
    }),
  'tabs:editable-closable-false': () =>
    cmp({
      defaultActiveKey: '1',
      type: 'editable-card',
      items: [
        { key: '1', label: 'A', children: 'a', closable: false },
        { key: '2', label: 'B', children: 'b' },
      ],
      onEdit: () => {},
    }),
  'tabs:centered-card': () =>
    cmp({ defaultActiveKey: '1', type: 'card', centered: true, items: items() }),
  // ⚠️ 只认 `top` / `bottom` / `start` / `end` —— 上游
  //    `TabPlacement = 'top' | 'end' | 'bottom' | 'start'`；`left` / `right` 是
  //    deprecated 的 `tabPosition` 的值域，**不是** `tabPlacement` 的。
  //    本轮修正：原先这四条是 `bottom`/`left`/`right`/`start`/`end` 五条（多了一条
  //    且 `left`/`right` 名不副实）⇒ 现与基线一致的四条。
  'tabs:bottom': () => cmp({ defaultActiveKey: '1', tabPlacement: 'bottom', items: items() }),
  'tabs:start': () => cmp({ defaultActiveKey: '1', tabPlacement: 'start', items: items() }),
  'tabs:end': () => cmp({ defaultActiveKey: '1', tabPlacement: 'end', items: items() }),
  'tabs:small': () => cmp({ defaultActiveKey: '1', size: 'small', items: items() }),
  'tabs:large': () => cmp({ defaultActiveKey: '1', size: 'large', items: items() }),
  'tabs:gutter': () => cmp({ defaultActiveKey: '1', tabBarGutter: 24, items: items() }),
  'tabs:animated-true': () => cmp({ defaultActiveKey: '1', animated: true, items: items() }),
  'tabs:animated-false': () => cmp({ defaultActiveKey: '1', animated: false, items: items() }),
  'tabs:extra-right': () =>
    cmp({
      defaultActiveKey: '1',
      items: items(),
      tabBarExtraContent: h('span', { class: 'extra-node' }, 'extra'),
    }),
  'tabs:extra-both': () =>
    cmp({
      defaultActiveKey: '1',
      items: items(),
      tabBarExtraContent: {
        left: h('span', { class: 'extra-left-node' }, 'L'),
        right: h('span', { class: 'extra-right-node' }, 'R'),
      },
    }),
  'tabs:indicator-start': () =>
    cmp({ defaultActiveKey: '1', items: items(), indicator: { align: 'start' } }),
  'tabs:indicator-size': () =>
    cmp({ defaultActiveKey: '1', items: items(), indicator: { size: 20 } }),
  'tabs:force-render': () =>
    cmp({
      defaultActiveKey: '1',
      items: [
        { key: '1', label: 'Tab 1', children: 'Pane 1' },
        { key: '2', label: 'Tab 2', children: 'Pane 2', forceRender: true },
      ],
    }),
  'tabs:destroy-on-hidden': () =>
    cmp({ defaultActiveKey: '1', destroyOnHidden: true, items: items() }),
  'tabs:semantic': () =>
    cmp({
      defaultActiveKey: '1',
      items: items(),
      classNames: { root: 'c-root', item: 'c-item', indicator: 'c-indicator' },
    }),
};

domContractTest('Tabs', {
  baseline,
  keepStyle: false,
  /**
   * 允许的差异（逐条**可自证**，不是「把门禁调松」）：
   *
   * `-dropdown-trigger` —— 本仓的溢出触发器走**本仓 Dropdown**（= antd 那层的组件，
   * 它会给触发器补 `${prefixCls}-trigger` 类），而上游的 Tabs 用的是 **rc 级的
   * `@rc-component/dropdown`**（它只加 `-open` 类，不加 `-trigger`）。
   * 实测：`node tests/visual/debug/extract-tabs-css.mjs` 的 SSR dump 里 `-nav-more`
   * 没有 trigger 类，而本仓有 ⇒ 一行类名差异，登记在 README §2 的差异清单。
   */
  allow: {
    'tabs:basic': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:active-second': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:no-items': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:no-children': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:card': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:editable-card': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:editable-hide-add': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:editable-closable-false': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:centered-card': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:bottom': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:start': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:end': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:small': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:large': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:gutter': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:animated-true': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:animated-false': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:extra-right': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:extra-both': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[2]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:indicator-start': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:indicator-size': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:force-render': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:destroy-on-hidden': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
    'tabs:semantic': {
      reason:
        '本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。差异编号 U15。',
      deviationId: 'U15',
      diff: [
        `$/div[0]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]`,
      ],
    },
  },
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Tabs semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。基线用例：` +
          baseline.cases.map((c) => c.id).join(', '),
      );
    }
    return build();
  },
});

describe('Tabs · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    expect(Object.keys(CASES).sort()).toEqual(baseline.cases.map((c) => c.id).sort());
  });
});
