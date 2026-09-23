/**
 * React 侧（antd 6.6.4）的 QRCode 视觉用例。与 vue/qr-code.js 逐条对应。
 *
 * ⚠️ canvas 在浏览器端绘制，两侧矩阵同源 ⇒ 像素一致；svg 亦然。
 */

import { QRCode } from 'antd';

const box = (children) => <div style={{ minHeight: 240, padding: 16 }}>{children}</div>;

export default {
  basic: () =>
    box(
      <div style={{ width: 240 }}>
        <QRCode value="https://apollo.design" />
      </div>,
    ),

  custom: () =>
    box(
      <div style={{ width: 240 }}>
        <QRCode value="https://apollo.design" color="#1677ff" bgColor="#f0f5ff" size={120} />
      </div>,
    ),

  svg: () =>
    box(
      <div style={{ width: 240 }}>
        <QRCode value="https://apollo.design" type="svg" size={120} />
      </div>,
    ),
};
