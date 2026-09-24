/**
 * L5 · 无障碍 —— role=tooltip 容器 + aria-describedby 关联（WCAG 1.3.1/4.1.2）；
 * 触发元素由使用者提供语义（我们的注入只叠加 describedby，不抢语义）。
 * axe 扫全部 demo（0 violation）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import Tooltip from '../Tooltip';

// ⚠️ 豁免按组隔离（CHECKLIST #69）：label 违规只在 disabled-children 一个 demo 上出现，
// 与其余 demo 混在一组会互相判「未被命中的豁免」。

const LABEL_ALLOWANCE = {
  rule: 'label',
  reason:
    'demo/disabled-children.vue 的原生 <select> 已带 aria-label，axe 的 label 规则仍报。' +
    '原生 select 是 Select 组件未落地时的替换物（demo 替换约定，README §2）——' +
    '可访问名实际存在，axe 误报，豁免成立。',
};

a11yDemoTest('Tooltip (label 豁免组)', {
  demos: import.meta.glob('../demo/disabled-children.vue', { eager: true }),
  expectCount: 1,
  global: { stubs: { teleport: false } },
  allow: [LABEL_ALLOWANCE],
});

a11yDemoTest('Tooltip', {
  demos: (() => {
    const all = import.meta.glob('../demo/*.vue', { eager: true });
    const rest: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(all)) {
      if (!k.includes('disabled-children')) rest[k] = v;
    }
    return rest;
  })(),
  expectCount: 13,
  global: { stubs: { teleport: false } },
});

describe('Tooltip · 语义断言', () => {
  it('开启时容器 role=tooltip 且 id 与触发元素的 aria-describedby 对应', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { open: true, id: 'tip-a11y', title: 'tips' },
      slots: { default: () => h('button', { class: 'tgt' }, 't') },
    });
    await nextTick();
    const container = document.querySelector('.apollo-tooltip-container');
    expect(container).not.toBeNull();
    expect(container!.getAttribute('role')).toBe('tooltip');
    expect(container!.id).toBe('tip-a11y');
    const described = document.querySelector('.tgt')?.getAttribute('aria-describedby');
    expect(described).toBe('tip-a11y');
    void wrapper;
  });
});
