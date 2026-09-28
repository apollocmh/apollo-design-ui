/**
 * React 侧（antd 6.6.4）的 Segmented 视觉用例。与 vue/segmented.js 逐条对应。
 * basic（原始值 + 选中第 2 项）/ shape-round / vertical / sizes。
 */

import { Segmented } from 'antd';

const box = (children) => <div style={{ minHeight: 120, padding: 16, width: 640 }}>{children}</div>;

const OPTIONS = ['Daily', 'Weekly', 'Monthly', 'Quarterly'];

export default {
  basic: () => box(<Segmented options={OPTIONS} value="Weekly" />),

  'shape-round': () => box(<Segmented options={OPTIONS} value="Monthly" shape="round" />),

  vertical: () =>
    box(
      <div style={{ height: 220 }}>
        <Segmented options={['Daily', 'Weekly', 'Monthly']} value="Weekly" vertical />
      </div>,
    ),

  sizes: () =>
    box(
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
        <Segmented size="small" options={OPTIONS} value="Weekly" />
        <Segmented options={OPTIONS} value="Weekly" />
        <Segmented size="large" options={OPTIONS} value="Weekly" />
      </div>,
    ),
};
