/**
 * React 侧（antd 6.6.4）的 Progress 视觉用例。与 vue/progress.js 逐条对应。
 * line-states（四态 + 隐藏）/ circle-dashboard（三态 + 仪表盘）/ gradient-success。
 */

import { Flex, Progress } from 'antd';

const box = (children) => <div style={{ minHeight: 120, padding: 16, width: 480 }}>{children}</div>;

export default {
  'line-states': () =>
    box(
      <Flex gap="small" vertical>
        <Progress percent={30} />
        <Progress percent={50} status="active" />
        <Progress percent={70} status="exception" />
        <Progress percent={100} />
        <Progress percent={50} showInfo={false} />
      </Flex>,
    ),

  'circle-dashboard': () =>
    box(
      <Flex gap="small" wrap>
        <Progress type="circle" percent={75} />
        <Progress type="circle" percent={70} status="exception" />
        <Progress type="circle" percent={100} />
        <Progress type="dashboard" percent={75} />
      </Flex>,
    ),

  'gradient-success': () =>
    box(
      <Flex gap="small" vertical>
        <Progress
          percent={60}
          success={{ percent: 20 }}
          strokeColor={{ from: '#108ee9', to: '#87d068' }}
        />
        <Progress percent={99.9} strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} />
        <Progress percent={60} steps={5} />
      </Flex>,
    ),
};
