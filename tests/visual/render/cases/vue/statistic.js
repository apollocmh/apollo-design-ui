/**
 * Vue 侧（@apollo-design/ui）的 Statistic 视觉用例。与 react/statistic.jsx 逐条对应。
 * ⚠️ 固件色值直接内联（H9 不适用于测试固件）。
 */

import { Statistic, StatisticTimer } from '@apollo-design/ui';
import { h } from 'vue';

const deadline = Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 30;

export default {
  basic: () => [
    h(Statistic, { title: 'Active Users', value: 112893 }),
    h(Statistic, { title: 'Account Balance (CNY)', value: 112893, precision: 2 }),
    h(Statistic, { title: 'Feedback', value: 1128, prefix: '↑' }),
    h(Statistic, { title: 'Unmerged', value: 93, suffix: '/ 100' }),
  ],

  status: () => [
    h(Statistic, {
      title: 'Active',
      value: 11.28,
      precision: 2,
      styles: { content: { color: '#3f8600' } },
      prefix: '↑',
      suffix: '%',
    }),
    h(Statistic, {
      title: 'Idle',
      value: 9.3,
      precision: 2,
      styles: { content: { color: '#cf1322' } },
      prefix: '↓',
      suffix: '%',
    }),
  ],

  loading: () => h(Statistic, { title: 'Active Users', value: 112112, loading: true }),

  semantic: () =>
    h(Statistic, {
      title: 'Monthly Active Users',
      value: 93241,
      suffix: 'users',
      classNames: { root: 'demo-statistic-root' },
      styles: {
        title: { color: '#1890ff', fontWeight: 600 },
        content: { fontSize: '24px' },
        value: {
          backgroundColor: '#e6f4ff',
          borderRadius: '4px',
          color: '#0958d9',
          paddingInline: '6px',
          userSelect: 'none',
        },
      },
    }),

  // ⚠️ format 只到「天」：秒/分级别的截图两侧必然漂移（Date.now 不同），
  //    用稳定粒度钉住视觉契约（数值行为由 L1 fake timers 钉）。
  timer: () =>
    h(StatisticTimer, { type: 'countdown', title: 'Deadline', value: deadline, format: 'D 天' }),
};
