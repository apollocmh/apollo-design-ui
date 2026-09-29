/**
 * Vue 侧（@apollo-design/ui）的 Form 视觉用例。与 react/form.jsx 逐条对应。
 *
 * 覆盖 7 个视觉面：布局（horizontal / vertical / inline）、label 三态、状态与
 * 反馈图标、尺寸、栅格列宽。
 */

import { Form, FormItem, Input } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h('div', { style: { padding: '16px', background: '#fff', width: '420px' } }, children);

const input = () => h(Input, { placeholder: 'Please input' });

/** Form.Item + 控件（每条用例都走它，保证两侧结构同构）。 */
const item = (props, children) => h(FormItem, props, { default: () => children ?? input() });

const form = (props, children) => h(Form, props, { default: () => children });

export default {
  basic: () =>
    box(
      form({ name: 'basic' }, [
        item({ label: 'Username', name: 'username' }),
        item({ label: 'Password', name: 'password', required: true }),
        item({ label: 'Remark', name: 'remark', extra: 'Extra information' }),
      ]),
    ),

  vertical: () =>
    box(
      form({ name: 'vertical', layout: 'vertical' }, [
        item({ label: 'Username', name: 'username' }),
        item({ label: 'Password', name: 'password', required: true }),
      ]),
    ),

  inline: () =>
    box(
      form({ name: 'inline', layout: 'inline' }, [
        item({ label: 'Username', name: 'username' }),
        item({ label: 'Password', name: 'password' }),
      ]),
    ),

  label: () =>
    box([
      // requiredMark 是 **Form 级** prop（antd 的 FormItemProps 里没有它）
      form({ name: 'label-optional', requiredMark: 'optional' }, [
        item({ label: 'Required', name: 'a', required: true }),
        item({ label: 'Optional', name: 'b' }),
      ]),
      form({ name: 'label-hidden', requiredMark: false }, [
        item({ label: 'Hide required mark', name: 'c', required: true }),
      ]),
      form({ name: 'label-colon', colon: false }, [
        item({ label: 'No colon', name: 'd' }),
        item({ label: 'With tooltip', name: 'e', tooltip: 'This is a hint' }),
      ]),
    ]),

  status: () =>
    box(
      form({ name: 'status' }, [
        item({ label: 'Help', name: 'help', help: 'Help text', validateStatus: 'error' }),
        item({ label: 'Success', name: 'success', hasFeedback: true, validateStatus: 'success' }),
        item({ label: 'Warning', name: 'warning', hasFeedback: true, validateStatus: 'warning' }),
        item({ label: 'Error', name: 'error', hasFeedback: true, validateStatus: 'error' }),
        item({
          label: 'Validating',
          name: 'validating',
          hasFeedback: true,
          validateStatus: 'validating',
        }),
      ]),
    ),

  sizes: () =>
    h('div', { style: { padding: '16px', background: '#fff', width: '420px' } }, [
      form({ name: 'small', size: 'small' }, [item({ label: 'Small', name: 'small' })]),
      form({ name: 'middle' }, [item({ label: 'Middle', name: 'middle' })]),
      form({ name: 'large', size: 'large' }, [item({ label: 'Large', name: 'large' })]),
    ]),

  col: () =>
    box(
      form({ name: 'col', labelCol: { span: 8 }, wrapperCol: { span: 16 } }, [
        item({ label: 'Username', name: 'username' }),
        item({ label: 'Password', name: 'password' }),
      ]),
    ),
};
