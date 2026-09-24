/**
 * L5 · 无障碍 —— 列表操作按钮带 aria-label（Remove file / Download file /
 * Preview file）；文件名可聚焦（无 url 的 span[role=button]，有 url 的 `<a>`）；
 * 上传中项的进度条 role=progressbar + aria-valuenow。antd 6.6.4 accessibility
 * 测试同判（对齐上游 U13）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Upload', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 3,
});
