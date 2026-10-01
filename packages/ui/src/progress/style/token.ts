/**
 * Progress 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 es/progress/style/index.js 的 `prepareComponentToken`
 * （默认值构建期派生，逐条对齐）。registry 数据：token 数 = 6。
 */

export interface ComponentToken {
  /** 圆环内的文字颜色。 */
  circleTextColor: string;
  /** 进度条默认色（colorInfo）。 */
  defaultColor: string;
  /** 剩余轨道色。 */
  remainingColor: string;
  /** 线型圆角（capsule 形状的 magic number 100）。 */
  lineBorderRadius: number;
  /** 圆环文字字号。 */
  circleTextFontSize: string;
  /** 圆环图标字号（fontSize/fontSizeSM）。 */
  circleIconFontSize: string;
}

/** 别名 token 的最小面（构建期派生所需的键）。 */
export interface ProgressAliasToken {
  colorText: string;
  colorInfo: string;
  colorFillSecondary: string;
  fontSize: number;
  fontSizeSM: number;
}

/** antd `prepareComponentToken` 的逐字移植。 */
export function prepareProgressComponentToken(token: ProgressAliasToken): Partial<ComponentToken> {
  return {
    circleTextColor: token.colorText,
    defaultColor: token.colorInfo,
    remainingColor: token.colorFillSecondary,
    lineBorderRadius: 100, // magic for capsule shape
    circleTextFontSize: '1em',
    circleIconFontSize: `${token.fontSize / token.fontSizeSM}em`,
  };
}

/** 默认主题下的组件变量声明值。 */
export function progressTokenValues(): Partial<ComponentToken> {
  return prepareProgressComponentToken({
    // ⚠️ 与 `DECLS`（antd 产物逐字）**完全一致** —— 不能写成 `rgba(0, 0, 0, 0.88)`（多空格）
    colorText: 'rgba(0,0,0,0.88)',
    colorInfo: '#1677ff',
    colorFillSecondary: 'rgba(0,0,0,0.06)',
    fontSize: 14,
    fontSizeSM: 12,
  });
}
