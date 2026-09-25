/**
 * React 侧（antd 6.6.4）的 Image 视觉用例。与 vue/image.js 逐条对应。
 * ⚠️ 图片用 data URI（1×1 PNG）—— 外网图片会污染基线。
 * ⚠️ 预览浮层走 open 受控静态帧 + placement 固定（无 placement 概念，
 *    preview 是全屏 fixed —— 稳定化由 harness 的 motion 相位剥离保证）。
 */

import { Image } from 'antd';

const PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export default {
  basic: () => (
    <div style={{ minHeight: 240, padding: 16, width: 420 }}>
      <Image alt="basic" width={200} height={100} src={PX} />
    </div>
  ),

  cover: () => (
    <div style={{ minHeight: 240, padding: 16, width: 420 }}>
      <Image
        alt="cover"
        width={96}
        height={96}
        src={PX}
        preview={{ cover: { coverNode: 'PREVIEW', placement: 'center' } }}
      />
    </div>
  ),

  preview: () => (
    <div style={{ minHeight: 240, padding: 16, width: 420 }}>
      <Image alt="preview" width={96} height={96} src={PX} preview={{ open: true, src: PX }} />
    </div>
  ),
};
