/**
 * Vue 侧（@apollo-design/ui）的 Result 视觉用例。与 react/result.jsx 逐条对应。
 * ⚠️ 固件色值直接内联（H9 不适用于测试固件）。
 */

import { Button, Result } from '@apollo-design/ui';
import { h } from 'vue';

const extra = () =>
  h('div', null, [
    h(Button, { type: 'primary' }, () => 'Go Console'),
    h(Button, null, () => 'Buy Again'),
  ]);

export default {
  basic: () => [
    h(Result, {
      status: 'success',
      title: 'Success',
      subTitle: 'Order number: 2017182818828182881',
      extra: extra(),
    }),
    h(Result, { title: 'Your operation has been executed', extra: extra() }),
  ],

  exception: () => [
    h(Result, {
      status: '404',
      title: '404',
      subTitle: 'Sorry, the page you visited does not exist.',
      extra: extra(),
    }),
    h(Result, {
      status: '403',
      title: '403',
      subTitle: 'Sorry, you are not authorized to access this page.',
      extra: extra(),
    }),
    h(Result, {
      status: '500',
      title: '500',
      subTitle: 'Sorry, something went wrong on server.',
      extra: extra(),
    }),
  ],

  semantic: () =>
    h(
      Result,
      {
        status: 'error',
        title: 'Submission Failed',
        subTitle: 'Please check and modify the following information before resubmitting.',
        classNames: { root: 'demo-result-root', title: 'demo-result-title' },
        styles: { root: { borderWidth: '2px', borderStyle: 'dashed', padding: '16px' } },
        extra: extra(),
      },
      {
        default: () => h('div', null, 'details body'),
      },
    ),
};
