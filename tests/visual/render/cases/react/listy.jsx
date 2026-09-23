/**
 * React 侧（antd 6.6.4）的 Listy 视觉用例。与 vue/listy.js 逐条对应。
 *
 * ⚠️ 内容只用纯文本（L6 是像素比对，两侧必须逐字一致）。
 * Raw 路径（antd 默认 virtual=false）。
 */

import { Listy } from 'antd';

const box = (children) => <div style={{ minHeight: 200, padding: 16 }}>{children}</div>;

const items = Array.from({ length: 6 }, (_, i) => ({ key: i, content: `Item ${i}` }));
const groupItems = Array.from({ length: 8 }, (_, i) => ({
  key: i,
  group: `Group ${i % 2}`,
  content: `Item ${i}`,
}));
const group = {
  key: (item) => item.group,
  title: (key, groupItemsOfKey) => `${key} (${groupItemsOfKey.length})`,
};

export default {
  basic: () =>
    box(
      <div style={{ width: 420 }}>
        <Listy items={items} rowKey="key" itemRender={(item) => item.content} />
      </div>,
    ),

  groupSticky: () =>
    box(
      <div style={{ width: 420 }}>
        <Listy
          items={groupItems}
          rowKey="key"
          group={group}
          sticky
          height={240}
          itemRender={(item) => item.content}
        />
      </div>,
    ),

  height: () =>
    box(
      <div style={{ width: 420 }}>
        <Listy items={items} rowKey="key" height={160} itemRender={(item) => item.content} />
      </div>,
    ),
};
