/**
 * React 侧（antd 6.6.4）的 Upload 视觉用例。与 vue/upload.js 逐条对应。
 *
 * ⚠️ 全部用**受控 fileList + 静态状态**（done/uploading/error），不走真实请求：
 *    L6 只截静态帧，任何异步上传都会引入时序噪声。
 * ⚠️ 缩略图用内联 SVG data URI —— 远端图片会引入网络抖动，且离线跑不了。
 * ⚠️ 两处刻意选择（都是为了让比对只反映 Upload 自己的差异）：
 *    1. 触发区用**两侧各自的 Button 组件**，不用原生 `<button>` —— 原生控件在
 *       antd 侧被 `antd/dist/reset.css` 的 `font: inherit` 改写（lineHeight 22px /
 *       height 28px），本库不注入任何全局 reset，比出来的是「reset 的有无」而非 Upload。
 *    2. 文件项**不带 `url`** —— 带 url 时名字渲染成 `<a>`，其颜色来自 antd 的全局
 *       链接基础样式（`genLinkStyle`，React 侧由 cssinjs 注入）；本库零运行时、
 *       不注入全局基础样式（D7/D15），裸 `<a>` 会落回 UA 蓝。`<a>` 分支的
 *       **DOM/行为**由 L4 契约（`upload:list-text-mixed`）与 L1 钉住。
 */

import { Button, Upload } from 'antd';

const box = (children) => <div style={{ minHeight: 280, padding: 16, width: 420 }}>{children}</div>;

const THUMB =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='88' height='88'><rect width='88' height='88' fill='%23e6f4ff'/></svg>";

const textList = [
  { uid: '1', name: 'finished.txt', status: 'done', size: 1024 },
  { uid: '2', name: 'uploading.txt', status: 'uploading', percent: 60, size: 2048 },
  { uid: '3', name: 'failed.txt', status: 'error', size: 512 },
];

export default {
  basic: () =>
    box(
      <Upload action="" fileList={textList}>
        <Button>Select File</Button>
      </Upload>,
    ),

  pictureCard: () =>
    box(
      <Upload
        action=""
        listType="picture-card"
        fileList={[{ uid: 'p1', name: 'image.png', status: 'done', thumbUrl: THUMB }]}
      >
        <Button>Upload</Button>
      </Upload>,
    ),

  drag: () =>
    box(
      <Upload.Dragger action="" fileList={textList.slice(0, 1)}>
        <p style={{ margin: 0 }}>Click or drag file to this area to upload</p>
      </Upload.Dragger>,
    ),
};
