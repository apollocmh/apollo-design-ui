/**
 * React 侧（antd 6.6.4）的 Tag 视觉用例。与 vue/tag.js 逐条对应。
 */

import { Tag } from 'antd';

const presets = [
  'magenta',
  'red',
  'volcano',
  'orange',
  'gold',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
];
const statuses = ['success', 'processing', 'error', 'warning', 'default'];
void presets;
void statuses;

export default {
  basic: () => (
    <>
      <Tag>Tag 1</Tag>
      <Tag closable>Closable</Tag>
      <Tag color="blue">blue</Tag>
      <Tag color="blue" variant="solid">
        blue solid
      </Tag>
      <Tag color="success" variant="outlined">
        success
      </Tag>
      <Tag color="#2db7f5">#2db7f5</Tag>
    </>
  ),

  checkable: () => (
    <>
      <Tag.CheckableTag checked>Checked</Tag.CheckableTag>
      <Tag.CheckableTag checked={false}>Unchecked</Tag.CheckableTag>
      <Tag.CheckableTagGroup options={['Movies', 'Books', 'Music']} value="Books" />
    </>
  ),

  semantic: () => (
    <Tag
      closable
      color="green"
      classNames={{ root: 'demo-tag-root', close: 'demo-tag-close' }}
      styles={{ root: { borderRadius: '8px' } }}
    >
      Semantic slots
    </Tag>
  ),
};
