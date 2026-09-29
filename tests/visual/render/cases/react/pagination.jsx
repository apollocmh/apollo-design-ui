/**
 * React 侧（antd 6.6.4）的 Pagination 视觉用例。与 vue/pagination.js 逐条对应。
 *
 * ⚠️ 覆盖的是**静态形态**：交互过程帧（下拉展开、输入中）不进像素比对。
 *    `simple` 的输入框在两侧都是受控文本，静态帧确定。
 */

import { Pagination } from 'antd';

const box = (children) => (
  <div style={{ padding: 16, background: '#fff', width: 640 }}>{children}</div>
);

export default {
  basic: () => box(<Pagination defaultCurrent={3} total={500} />),

  totalText: () =>
    box(<Pagination defaultCurrent={3} total={500} showTotal={(t) => `共 ${t} 条`} />),

  simple: () => box(<Pagination defaultCurrent={3} total={500} simple />),

  quickJumper: () => box(<Pagination defaultCurrent={3} total={500} showQuickJumper />),

  quickJumperButton: () =>
    box(<Pagination defaultCurrent={3} total={500} showQuickJumper={{ goButton: true }} />),

  sizeChanger: () => box(<Pagination defaultCurrent={3} total={500} showSizeChanger />),

  disabled: () => box(<Pagination defaultCurrent={3} total={500} disabled />),

  large: () => box(<Pagination defaultCurrent={3} total={500} size="large" showQuickJumper />),

  alignCenter: () =>
    box(
      <Pagination defaultCurrent={3} total={500} align="center" showTotal={(t) => `${t} items`} />,
    ),

  lessItems: () => box(<Pagination defaultCurrent={10} total={500} showLessItems />),
};
