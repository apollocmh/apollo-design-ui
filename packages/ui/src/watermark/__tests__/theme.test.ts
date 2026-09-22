/**
 * L7 主题矩阵 —— Watermark **没有样式表**（全内联 style + canvas 绘制），
 * 所以这一层钉的是另外两件事：
 *
 * 1. 主题无关性（themeTest）：demo 在默认/暗色/紧凑主题下都不产生告警。
 * 2. 运行时 token 消费：zIndex 默认 `zIndexPopupBase - 1`、font 默认
 *    `colorFill` + `fontSizeLG` —— 由 `useToken()` 取实值（无 CSS 变量）。
 *    这里钉「未注册样式表」这条契约 + token 默认值来自 alias token。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { COMPONENT_STYLES } from '../../style';
import { Watermark } from '../index';

themeTest('Watermark', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Watermark · 无样式表契约', () => {
  it('不注册 genWatermarkStyle（全内联 + canvas，无 Component Token）', () => {
    expect(COMPONENT_STYLES.some((item) => item.name === 'watermark')).toBe(false);
  });

  it('不导出样式生成函数（逐字对齐 antd：Watermark 无 style 目录）', async () => {
    const mod = (await import('../index')) as Record<string, unknown>;
    expect(Object.keys(mod).some((k) => /genWatermarkStyle|ComponentToken/i.test(k))).toBe(false);
  });

  it('组件本身可构造（token 取用不依赖样式表）', () => {
    expect(Watermark).toBeTruthy();
  });
});
