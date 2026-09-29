/**
 * React 侧（antd 6.6.4）的 Form 视觉用例。与 vue/form.js 逐条对应。
 *
 * ⚠️ 两侧都**不传 prefixCls**：各自加载自己的 CSS（antd 的 CSS-in-JS / 本仓的
 *    `style.css`），像素比对的是渲染结果，不是类名。
 *
 * 覆盖 7 个视觉面：布局（horizontal / vertical / inline）、label 三态、状态与
 * 反馈图标、尺寸、栅格列宽。
 */

import { Form, Input } from 'antd';

const Item = Form.Item;

const box = (children) => (
  <div style={{ padding: 16, background: '#fff', width: 420 }}>{children}</div>
);

const input = () => <Input placeholder="Please input" />;

export default {
  basic: () =>
    box(
      <Form name="basic">
        <Item label="Username" name="username">
          {input()}
        </Item>
        <Item label="Password" name="password" required>
          {input()}
        </Item>
        <Item label="Remark" name="remark" extra="Extra information">
          {input()}
        </Item>
      </Form>,
    ),

  vertical: () =>
    box(
      <Form name="vertical" layout="vertical">
        <Item label="Username" name="username">
          {input()}
        </Item>
        <Item label="Password" name="password" required>
          {input()}
        </Item>
      </Form>,
    ),

  inline: () =>
    box(
      <Form name="inline" layout="inline">
        <Item label="Username" name="username">
          {input()}
        </Item>
        <Item label="Password" name="password">
          {input()}
        </Item>
      </Form>,
    ),

  label: () => (
    <div style={{ padding: 16, background: '#fff', width: 420 }}>
      {/* requiredMark 是 **Form 级** prop（antd 的 FormItemProps 里没有它） */}
      <Form name="label-optional" requiredMark="optional">
        <Item label="Required" name="a" required>
          {input()}
        </Item>
        <Item label="Optional" name="b">
          {input()}
        </Item>
      </Form>
      <Form name="label-hidden" requiredMark={false}>
        <Item label="Hide required mark" name="c" required>
          {input()}
        </Item>
      </Form>
      <Form name="label-colon" colon={false}>
        <Item label="No colon" name="d">
          {input()}
        </Item>
        <Item label="With tooltip" name="e" tooltip="This is a hint">
          {input()}
        </Item>
      </Form>
    </div>
  ),

  status: () =>
    box(
      <Form name="status">
        <Item label="Help" name="help" help="Help text" validateStatus="error">
          {input()}
        </Item>
        <Item label="Success" name="success" hasFeedback validateStatus="success">
          {input()}
        </Item>
        <Item label="Warning" name="warning" hasFeedback validateStatus="warning">
          {input()}
        </Item>
        <Item label="Error" name="error" hasFeedback validateStatus="error">
          {input()}
        </Item>
        <Item label="Validating" name="validating" hasFeedback validateStatus="validating">
          {input()}
        </Item>
      </Form>,
    ),

  sizes: () => (
    <div style={{ padding: 16, background: '#fff', width: 420 }}>
      <Form name="small" size="small">
        <Item label="Small" name="small">
          {input()}
        </Item>
      </Form>
      <Form name="middle">
        <Item label="Middle" name="middle">
          {input()}
        </Item>
      </Form>
      <Form name="large" size="large">
        <Item label="Large" name="large">
          {input()}
        </Item>
      </Form>
    </div>
  ),

  col: () =>
    box(
      <Form name="col" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
        <Item label="Username" name="username">
          {input()}
        </Item>
        <Item label="Password" name="password">
          {input()}
        </Item>
      </Form>,
    ),
};
