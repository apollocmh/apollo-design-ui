/**
 * React 侧（antd 6.6.4）的 Splitter 视觉用例。与 vue/splitter.js 逐条对应。
 *
 * ⚠️ 内容只用纯文本（L6 是像素比对）。
 */

import { Splitter } from 'antd';

const box = (children) => <div style={{ minHeight: 260, padding: 16 }}>{children}</div>;

const BOX = { height: 220, boxShadow: '0 0 0 1px #d9d9d9' };

export default {
  basic: () =>
    box(
      <div style={{ width: 480 }}>
        <Splitter style={BOX}>
          <Splitter.Panel>Left</Splitter.Panel>
          <Splitter.Panel>Right</Splitter.Panel>
        </Splitter>
      </div>,
    ),

  vertical: () =>
    box(
      <div style={{ width: 480 }}>
        <Splitter orientation="vertical" style={BOX}>
          <Splitter.Panel>Top</Splitter.Panel>
          <Splitter.Panel>Bottom</Splitter.Panel>
        </Splitter>
      </div>,
    ),

  multiple: () =>
    box(
      <div style={{ width: 480 }}>
        <Splitter style={BOX}>
          <Splitter.Panel collapsible defaultSize="20%" min="10%">
            Left
          </Splitter.Panel>
          <Splitter.Panel defaultSize="40%">Center</Splitter.Panel>
          <Splitter.Panel max="60%" collapsible>
            Right
          </Splitter.Panel>
        </Splitter>
      </div>,
    ),
};
