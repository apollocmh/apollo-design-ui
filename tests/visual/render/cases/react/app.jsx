/** React 侧（antd 6.6.4）的 App 视觉用例。与 vue/app.js 逐条对应。 */

import { App } from 'antd';

export default {
  basic: () => (
    <div style={{ minHeight: 120, padding: 16, width: 420 }}>
      <App>
        <p style={{ margin: 0 }}>App inherits color/fontSize/lineHeight/fontFamily.</p>
      </App>
    </div>
  ),
};
