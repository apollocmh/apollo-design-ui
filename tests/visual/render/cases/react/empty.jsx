/**
 * React 侧（antd 6.6.4）的 Empty 视觉用例。
 *
 * 与 `render/cases/vue/empty.js` **逐条对应**：同名、同 props 语义、同文案、同图片。
 * 比出来的差异只能是实现差异，不能是用例差异。
 *
 * 这里允许 import antd —— `TESTING.md` A9 的唯一例外是测试目录（`tests/`）。
 * 发布包仍然零 React 依赖（门禁 E19）。
 */

import { Empty } from 'antd';

import {
  CUSTOM_IMAGE,
  FOOTER_BUTTON_STYLE,
  LABEL,
  LINK_STYLE,
  SEMANTIC_CLASSNAMES,
  SEMANTIC_STYLES,
} from '../shared.mjs';

export default {
  default: () => <Empty />,

  simple: () => <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />,

  'no-description': () => <Empty description={false} />,

  'custom-description': () => (
    <Empty
      description={
        <span>
          Customize{' '}
          <a href="#demo" style={LINK_STYLE}>
            this link
          </a>
        </span>
      }
    />
  ),

  'custom-image': () => <Empty image={CUSTOM_IMAGE} description={LABEL.customDescription} />,

  'with-footer': () => (
    <Empty description={LABEL.customDescription}>
      <button type="button" style={FOOTER_BUTTON_STYLE}>
        {LABEL.withFooter}
      </button>
    </Empty>
  ),

  semantic: () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      classNames={SEMANTIC_CLASSNAMES}
      styles={SEMANTIC_STYLES}
      description={LABEL.semantic}
    />
  ),
};
