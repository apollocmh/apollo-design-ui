/**
 * React 侧（antd 6.6.4）的 Switch 视觉用例。与 vue/switch.js 逐条对应。
 *
 * ⚠️ `text` 用例**不用真图标**（antd 侧本可以用 `@ant-design/icons`）：视觉侧的 vue 渲染入口
 * 只链接了 `@apollo-design/theme` 与 `@apollo-design/ui` 两个 workspace 包，拿不到
 * `@apollo-design/icons` ⇒ 两侧只能用**同一份内联结构**当替身（与 space 的
 * native button / input 替身同思路）。图标形态的 children 由 demo 与 L1 覆盖，
 * 见 `tests/visual/matrix.mjs` 的 LIMITATIONS `switch·icon-children`。
 */

import { Flex, Switch } from 'antd';

const box = (children) => <div style={{ minHeight: 160, padding: 16 }}>{children}</div>;

/** 复杂节点替身（两侧逐字相同）：Flex 里放一个 `<b>` 与一个文本节点。 */
const complexNode = (text) => (
  <Flex gap={4} justify="flex-start" align="center">
    <b>#</b>
    {text}
  </Flex>
);

export default {
  basic: () =>
    box([
      <Switch key="a" aria-label="a" />,
      <br key="b1" />,
      <Switch key="b" defaultChecked aria-label="b" />,
      <br key="b2" />,
      <Switch key="c" disabled aria-label="c" />,
      <br key="b3" />,
      <Switch key="d" defaultChecked disabled aria-label="d" />,
    ]),

  loading: () =>
    box([
      <Switch key="a" loading defaultChecked aria-label="a" />,
      <br key="b1" />,
      <Switch key="b" size="small" loading aria-label="b" />,
    ]),

  size: () =>
    box([
      <Switch key="a" defaultChecked aria-label="a" />,
      <br key="b1" />,
      <Switch key="b" size="small" defaultChecked aria-label="b" />,
    ]),

  text: () =>
    box([
      <Switch key="a" checkedChildren="On" unCheckedChildren="Off" defaultChecked />,
      <br key="b1" />,
      <Switch key="b" checkedChildren={1} unCheckedChildren={0} defaultChecked />,
      <br key="b2" />,
      <Switch
        key="c"
        defaultChecked
        checkedChildren={complexNode('Happy')}
        unCheckedChildren={complexNode('Sad')}
      />,
    ]),

  semantic: () =>
    box([
      <Switch
        key="a"
        defaultChecked
        checkedChildren="On"
        unCheckedChildren="Off"
        classNames={{ root: 'demo-switch-root', content: 'demo-switch-content' }}
        styles={{ root: { backgroundColor: 'rgb(245, 210, 210)' }, indicator: { top: '1px' } }}
      />,
    ]),
};
