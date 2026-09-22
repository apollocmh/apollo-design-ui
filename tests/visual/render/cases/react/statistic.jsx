/**
 * React 侧（antd 6.6.4）的 Statistic 视觉用例。与 vue/statistic.js 逐条对应。
 */

import { Statistic } from 'antd';

const deadline = Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 30;

export default {
  basic: () => (
    <>
      <Statistic title="Active Users" value={112893} />
      <Statistic title="Account Balance (CNY)" value={112893} precision={2} />
      <Statistic title="Feedback" value={1128} prefix="↑" />
      <Statistic title="Unmerged" value={93} suffix="/ 100" />
    </>
  ),

  status: () => (
    <>
      <Statistic
        title="Active"
        value={11.28}
        precision={2}
        styles={{ content: { color: '#3f8600' } }}
        prefix="↑"
        suffix="%"
      />
      <Statistic
        title="Idle"
        value={9.3}
        precision={2}
        styles={{ content: { color: '#cf1322' } }}
        prefix="↓"
        suffix="%"
      />
    </>
  ),

  loading: () => <Statistic title="Active Users" value={112112} loading />,

  semantic: () => (
    <Statistic
      title="Monthly Active Users"
      value={93241}
      suffix="users"
      classNames={{ root: 'demo-statistic-root' }}
      styles={{
        title: { color: '#1890ff', fontWeight: 600 },
        content: { fontSize: '24px' },
        value: {
          backgroundColor: '#e6f4ff',
          borderRadius: '4px',
          color: '#0958d9',
          paddingInline: '6px',
          userSelect: 'none',
        },
      }}
    />
  ),

  // ⚠️ format 只到「天」：秒/分级别的截图两侧必然漂移（Date.now 不同），
  //    用稳定粒度钉住视觉契约（数值行为由 L1 fake timers 钉）。
  timer: () => <Statistic.Timer type="countdown" title="Deadline" value={deadline} format="D 天" />,
};
