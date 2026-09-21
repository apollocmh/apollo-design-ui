/**
 * React 侧（antd 6.6.4）的 Result 视觉用例。与 vue/result.js 逐条对应。
 */

import { Button, Result } from 'antd';

const extra = (
  <div>
    <Button type="primary">Go Console</Button>
    <Button>Buy Again</Button>
  </div>
);

export default {
  basic: () => (
    <>
      <Result
        status="success"
        title="Success"
        subTitle="Order number: 2017182818828182881"
        extra={extra}
      />
      <Result title="Your operation has been executed" extra={extra} />
    </>
  ),

  exception: () => (
    <>
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={extra}
      />
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={extra}
      />
      <Result
        status="500"
        title="500"
        subTitle="Sorry, something went wrong on server."
        extra={extra}
      />
    </>
  ),

  semantic: () => (
    <Result
      status="error"
      title="Submission Failed"
      subTitle="Please check and modify the following information before resubmitting."
      classNames={{ root: 'demo-result-root', title: 'demo-result-title' }}
      styles={{ root: { borderWidth: '2px', borderStyle: 'dashed', padding: '16px' } }}
      extra={extra}
    >
      <div>details body</div>
    </Result>
  ),
};
