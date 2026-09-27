/**
 * Vue 侧（@apollo-design/ui）的 Alert 视觉用例。与 react/alert.jsx 逐条对应。
 * ⚠️ 固件色值直接内联（H9 不适用于测试固件）。
 */

import { Alert } from '@apollo-design/ui';
import { h } from 'vue';

export default {
  basic: () => [
    h(Alert, { title: 'Success Text', type: 'success' }),
    h(Alert, { title: 'Info Text', type: 'info' }),
    h(Alert, { title: 'Warning Text', type: 'warning' }),
    h(Alert, { title: 'Error Text', type: 'error' }),
  ],

  icon: () => [
    h(Alert, { title: 'Success Tips', type: 'success', showIcon: true }),
    h(Alert, {
      title: 'Informational Notes',
      description: 'Additional description and information about copywriting.',
      type: 'info',
      showIcon: true,
    }),
    h(Alert, {
      title: 'Warning',
      description: 'This is a warning notice about copywriting.',
      type: 'warning',
      showIcon: true,
    }),
    h(Alert, {
      title: 'Error',
      description: 'This is an error message about copywriting.',
      type: 'error',
      showIcon: true,
    }),
  ],

  banner: () => [
    h(Alert, { title: 'Warning text', banner: true }),
    h(Alert, {
      title: 'Very long warning text warning text text text text text text text',
      banner: true,
      closable: true,
    }),
    h(Alert, { showIcon: false, title: 'Warning text without icon', banner: true }),
    h(Alert, { type: 'error', title: 'Error text', banner: true }),
  ],

  closable: () => [
    h(Alert, { title: 'Closable', type: 'info', closable: true }),
    h(Alert, { title: 'Close Text', type: 'warning', closable: { closeIcon: 'Close' } }),
  ],

  filled: () => [
    h(Alert, { title: 'Info Text', type: 'info', variant: 'filled', showIcon: true }),
    h(Alert, { title: 'Error Text', type: 'error', variant: 'filled', showIcon: true }),
  ],

  semantic: () =>
    // C8-R2：action 走 `#action` 插槽
    h(
      Alert,
      {
        title: 'Info Text',
        description: 'Info Description',
        showIcon: true,
        closable: true,
        type: 'info',
        classNames: { root: 'demo-alert-root', title: 'demo-alert-title' },
        styles: {
          icon: { fontSize: '18px' },
          section: { fontWeight: 500 },
          close: { color: 'rgb(128, 0, 128)' },
        },
      },
      { action: () => h('button', { type: 'button' }, 'A') },
    ),
};
