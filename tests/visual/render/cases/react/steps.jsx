/**
 * React 侧（antd 6.6.4）的 Steps 视觉用例。与 vue/steps.js 逐条对应。
 * basic（状态推导 + rail）/ vertical（纵向 + 标题横排）/ dot（点状）。
 */

import { Steps } from 'antd';

const box = (children) => <div style={{ minHeight: 220, padding: 16, width: 640 }}>{children}</div>;

const items = [
  { title: 'Login', content: 'Enter your credentials' },
  { title: 'Pay', content: 'Pay the bill' },
  { title: 'Done', content: 'All finished' },
];

export default {
  basic: () => box(<Steps items={items} current={1} />),

  vertical: () =>
    box(
      <div style={{ height: 260 }}>
        <Steps items={items} current={1} orientation="vertical" />
      </div>,
    ),

  dot: () => box(<Steps items={items} current={1} type="dot" />),
};
