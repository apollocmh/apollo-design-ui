/**
 * React 侧（antd 6.6.4）的 Alert 视觉用例。与 vue/alert.js 逐条对应。
 */

import { Alert } from 'antd';

export default {
  basic: () => (
    <>
      <Alert title="Success Text" type="success" />
      <Alert title="Info Text" type="info" />
      <Alert title="Warning Text" type="warning" />
      <Alert title="Error Text" type="error" />
    </>
  ),

  icon: () => (
    <>
      <Alert title="Success Tips" type="success" showIcon />
      <Alert
        title="Informational Notes"
        description="Additional description and information about copywriting."
        type="info"
        showIcon
      />
      <Alert
        title="Warning"
        description="This is a warning notice about copywriting."
        type="warning"
        showIcon
      />
      <Alert
        title="Error"
        description="This is an error message about copywriting."
        type="error"
        showIcon
      />
    </>
  ),

  banner: () => (
    <>
      <Alert title="Warning text" banner />
      <Alert
        title="Very long warning text warning text text text text text text text"
        banner
        closable
      />
      <Alert showIcon={false} title="Warning text without icon" banner />
      <Alert type="error" title="Error text" banner />
    </>
  ),

  closable: () => (
    <>
      <Alert title="Closable" type="info" closable />
      <Alert title="Close Text" type="warning" closable={{ closeIcon: 'Close' }} />
    </>
  ),

  filled: () => (
    <>
      <Alert title="Info Text" type="info" variant="filled" showIcon />
      <Alert title="Error Text" type="error" variant="filled" showIcon />
    </>
  ),

  semantic: () => (
    <Alert
      title="Info Text"
      description="Info Description"
      showIcon
      closable
      type="info"
      action={<button type="button">A</button>}
      classNames={{ root: 'demo-alert-root', title: 'demo-alert-title' }}
      styles={{
        icon: { fontSize: '18px' },
        section: { fontWeight: 500 },
        close: { color: 'rgb(128, 0, 128)' },
      }}
    />
  ),
};
