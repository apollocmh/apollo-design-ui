/**
 * Steps 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 es/steps/style/index.js 的 `prepareComponentToken`
 * （默认值构建期派生，逐条对齐）。registry 数据：token 数 = 13。
 */

import type { CSSProperties } from 'vue';

export interface ComponentToken {
  /** @deprecated v6 默认已移除该值。 */
  descriptionMaxWidth?: number;
  /** 自定义图标容器尺寸。 */
  customIconSize: number;
  /** 自定义图标 top。 */
  customIconTop: number;
  /** 自定义图标字号。 */
  customIconFontSize: number;
  /** 图标容器尺寸。 */
  iconSize: number;
  /** 图标 top。 */
  iconTop: number;
  /** 图标字号。 */
  iconFontSize: number;
  /** 点状步骤点大小。 */
  dotSize: number;
  /** 点状步骤点当前大小。 */
  dotCurrentSize: number;
  /** 可跳转步骤条箭头颜色。 */
  navArrowColor: string;
  /** 可跳转步骤条内容最大宽度。 */
  navContentMaxWidth: CSSProperties['maxWidth'];
  /** 小号步骤条图标大小。 */
  iconSizeSM: number | string;
  /** @deprecated 不再使用。标题行高。 */
  titleLineHeight: number | string;
}

/** 别名 token 的最小面（构建期派生所需的键）。 */
export interface StepsAliasToken {
  controlHeight: number;
  controlHeightSM: number;
  controlHeightLG: number;
  fontSize: number;
  fontSizeHeading3: number;
  colorTextDisabled: string;
  colorTextLabel: string;
  colorBgContainer: string;
  colorFillContent: string;
  colorPrimary: string;
  controlItemBgActive: string;
  wireframe?: boolean;
}

/** antd `prepareComponentToken` 的逐字移植（构建期解析为 px 字面量）。 */
export function prepareStepsComponentToken(token: StepsAliasToken): Partial<ComponentToken> {
  return {
    titleLineHeight: token.controlHeight,
    customIconSize: token.controlHeight,
    customIconTop: 0,
    customIconFontSize: token.controlHeightSM,
    iconSize: token.controlHeight,
    iconTop: -0.5,
    // magic for ui experience
    iconFontSize: token.fontSize,
    iconSizeSM: token.fontSizeHeading3,
    dotSize: token.controlHeight / 4,
    dotCurrentSize: token.controlHeightLG / 4,
    navArrowColor: token.colorTextDisabled,
    navContentMaxWidth: 'unset',
    descriptionMaxWidth: undefined,
  };
}

/** 默认主题下的组件变量声明（供 genStepsStyle 的 DECLS 段消费）。 */
export function stepsTokenValues(): Partial<ComponentToken> {
  return prepareStepsComponentToken({
    controlHeight: 32,
    controlHeightSM: 24,
    controlHeightLG: 40,
    fontSize: 14,
    fontSizeHeading3: 20,
    colorTextDisabled: 'rgba(0, 0, 0, 0.25)',
    colorTextLabel: 'rgba(0, 0, 0, 0.45)',
    colorBgContainer: '#ffffff',
    colorFillContent: 'rgba(0, 0, 0, 0.06)',
    colorPrimary: '#1677ff',
    controlItemBgActive: '#e6f4ff',
    wireframe: false,
  });
}
