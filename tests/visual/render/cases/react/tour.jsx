/**
 * React 侧（antd 6.6.4）的 Tour 视觉用例。与 vue/tour.js 逐条对应。
 * basic / non-modal / render-panel。
 *
 * ⚠️ hooks 必须在真实组件里调 —— case 函数在 React 渲染树之外执行。
 */

import { Button, Tour } from 'antd';
import { useRef } from 'react';

const PurePanel = Tour._InternalPanelDoNotUseOrYouWillBeFired;

const box = (children) => (
  <div style={{ minHeight: 220, padding: 24, display: 'flex', alignItems: 'flex-end' }}>
    {children}
  </div>
);

function BasicCase() {
  const ref = useRef(null);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Button ref={ref} type="primary" style={{ marginLeft: 40 }}>
        Target
      </Button>
      <Tour
        open
        current={0}
        steps={[
          {
            title: 'Upload File',
            description: 'Put your files here.',
            target: () => ref.current,
          },
        ]}
      />
    </div>
  );
}

function NonModalCase() {
  const ref = useRef(null);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Button ref={ref} style={{ marginLeft: 40 }}>
        Target
      </Button>
      <Tour
        open
        type="primary"
        mask={false}
        current={0}
        steps={[
          {
            title: 'Save',
            description: 'Save your changes.',
            target: () => ref.current,
          },
        ]}
      />
    </div>
  );
}

export default {
  basic: () => box(<BasicCase />),

  'non-modal': () => box(<NonModalCase />),

  'render-panel': () =>
    box(
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: 16 }}>
        <PurePanel title="Hello World!" description="Hello World?!" />
        <PurePanel
          title="Hello World!"
          description="Hello World?!"
          type="primary"
          current={4}
          total={5}
        />
      </div>,
    ),
};
