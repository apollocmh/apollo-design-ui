/**
 * Vue 侧（@apollo-design/ui）的 Upload 视觉用例。与 react/upload.jsx 逐条对应。
 *
 * 两侧刻意选择（原因见 react/upload.jsx 文件头）：触发区用各自的 Button 组件、
 * 文件项不带 `url`（避开全局链接基础样式的差异）。
 */

import { Button, Upload, UploadDragger } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h('div', { style: { minHeight: '280px', padding: '16px', width: '420px' } }, children);

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
      h(
        Upload,
        { action: '', fileList: textList },
        { default: () => h(Button, null, () => 'Select File') },
      ),
    ),

  pictureCard: () =>
    box(
      h(
        Upload,
        {
          action: '',
          listType: 'picture-card',
          fileList: [{ uid: 'p1', name: 'image.png', status: 'done', thumbUrl: THUMB }],
        },
        { default: () => h(Button, null, () => 'Upload') },
      ),
    ),

  drag: () =>
    box(
      h(
        UploadDragger,
        { action: '', fileList: textList.slice(0, 1) },
        {
          default: () =>
            h('p', { style: { margin: 0 } }, 'Click or drag file to this area to upload'),
        },
      ),
    ),
};
