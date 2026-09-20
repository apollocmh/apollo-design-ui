/**
 * React 侧（antd 6.6.4）的 Skeleton 视觉用例。
 *
 * 与 `render/cases/vue/skeleton.js` **逐条对应**：同名、同 props 语义、同文案。
 * 比出来的差异只能是实现差异，不能是用例差异。
 *
 * ⚠️ 所有 `style` 值都写成**字符串**（`'200px'` 而不是 `200`）。React 的
 *    `dangerousStyleValue` 会给裸数字补 px、Vue 不会 —— 用字符串把这条平台差异
 *    从用例里排除掉，否则比出来的是「单位补全不同」而不是「组件不同」。
 *
 *    （组件**内部**的数值样式是另一回事：`Skeleton title={{ width: 200 }}` 这类
 *    **props 里的数字**必须原样传，因为那正是 `toCssLength` 要覆盖的路径。）
 *
 * ⚠️ Skeleton 没有文字，所以两侧的 reset 字体差异不会进像素 —— 这也是本组件
 *    的 24 组用例可以全部走 `exact` 档的原因（对比 typography 的 `copyable`）。
 *
 * 这里允许 import antd —— `TESTING.md` A9 的唯一例外是测试目录（`tests/`）。
 */

import { Skeleton } from 'antd';

import {
  SKELETON_COLUMN_STYLE,
  SKELETON_NODE_CHILD_STYLE,
  SKELETON_NODE_TEXT,
  SKELETON_PARAGRAPH_WIDTHS,
  SKELETON_ROW_STYLE,
  SKELETON_SEMANTIC_CLASSNAMES,
  SKELETON_SEMANTIC_STYLES,
} from '../shared.mjs';

/** `Skeleton.Node` 插槽里的替身内容 —— 两侧同形（原生元素，不引入未落地组件）。 */
const NodeChild = () => <span style={SKELETON_NODE_CHILD_STYLE}>{SKELETON_NODE_TEXT}</span>;

export default {
  // ---- 1. 基本形态：三个块的真值组合 -------------------------------------
  basic: () => (
    <div style={SKELETON_COLUMN_STYLE}>
      <Skeleton />
      <Skeleton title={false} />
      <Skeleton paragraph={false} />
      <Skeleton title={false} paragraph={false} />
    </div>
  ),

  // ---- 2. 头像：三张默认几何表 + 数字尺寸 --------------------------------
  avatar: () => (
    <div style={SKELETON_COLUMN_STYLE}>
      <Skeleton avatar />
      <Skeleton avatar paragraph={false} />
      <Skeleton avatar title={false} />
      <Skeleton avatar={{ size: 40 }} />
    </div>
  ),

  // ---- 3. round：胶囊圆角（标题与段落行的圆角换成 100px）-----------------
  round: () => (
    <div style={SKELETON_COLUMN_STYLE}>
      <Skeleton round />
      <Skeleton round avatar />
      <Skeleton round title={{ width: '70%' }} paragraph={{ rows: 2 }} />
    </div>
  ),

  // ---- 4. 段落：rows / width 数组 / width 数字 / active 渐变 -------------
  paragraph: () => (
    <div style={SKELETON_COLUMN_STYLE}>
      <Skeleton paragraph={{ rows: 4 }} />
      <Skeleton paragraph={{ rows: 4, width: SKELETON_PARAGRAPH_WIDTHS }} />
      <Skeleton paragraph={{ rows: 2, width: 120 }} />
      <Skeleton active />
    </div>
  ),

  // ---- 5. 标题：三张默认宽度表 + 数字 / 0 / styles 覆盖 -------------------
  title: () => (
    <div style={SKELETON_COLUMN_STYLE}>
      <Skeleton title={{ width: 100 }} />
      <Skeleton title={{ width: '70%' }} />
      <Skeleton title={{ width: 0 }} />
      <Skeleton styles={{ title: { width: '90%' } }} />
    </div>
  ),

  // ---- 6. 子组件：Button / Input / Avatar（含 block / size / shape）------
  element: () => (
    <div style={SKELETON_COLUMN_STYLE}>
      <div style={SKELETON_ROW_STYLE}>
        <Skeleton.Button />
        <Skeleton.Button size="small" />
        <Skeleton.Button size="large" />
        <Skeleton.Button shape="circle" />
        <Skeleton.Button shape="round" />
        <Skeleton.Button active />
      </div>
      <div style={SKELETON_ROW_STYLE}>
        <Skeleton.Input />
        <Skeleton.Input size="small" />
        <Skeleton.Input size="large" />
      </div>
      <div style={SKELETON_ROW_STYLE}>
        <Skeleton.Avatar />
        <Skeleton.Avatar shape="square" />
        <Skeleton.Avatar size="large" />
        <Skeleton.Avatar size="small" />
      </div>
      <div style={SKELETON_COLUMN_STYLE}>
        <Skeleton.Button block />
        <Skeleton.Input block />
      </div>
    </div>
  ),

  // ---- 7. Node / Image：自定义插槽与内置占位图 ---------------------------
  'node-image': () => (
    <div style={SKELETON_COLUMN_STYLE}>
      <div style={SKELETON_ROW_STYLE}>
        <Skeleton.Node>
          <NodeChild />
        </Skeleton.Node>
        <Skeleton.Node active>
          <NodeChild />
        </Skeleton.Node>
        <Skeleton.Image />
      </div>
      <Skeleton.Image style={{ width: '200px', height: '200px' }} />
    </div>
  ),

  // ---- 8. 语义化 classNames / styles -------------------------------------
  semantic: () => (
    <div style={SKELETON_COLUMN_STYLE}>
      <Skeleton
        avatar
        classNames={SKELETON_SEMANTIC_CLASSNAMES}
        styles={SKELETON_SEMANTIC_STYLES}
      />
    </div>
  ),
};
