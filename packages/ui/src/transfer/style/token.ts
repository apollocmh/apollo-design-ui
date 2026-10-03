/**
 * Transfer 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 `es/transfer/style/index.js` 的 `prepareComponentToken`
 * （+ `style/index.d.ts` 的 `ComponentToken` 接口）。registry 数据：6 个自有 token
 * （`transferHeaderVerticalPadding` 是第 7 个派生，antd 产物里同样声明为
 * `--ant-transfer-transfer-header-vertical-padding` —— token 名以 `transfer` 开头
 * ⇒ 变量名出现两次 `transfer`，**不是笔误**）。
 *
 * ── 默认主题判定值（2026-10-04 与 antd 6.6.4 产物逐字对拍）────────────────────
 *
 * | token | 判定值 | 派生 |
 * |---|---|---|
 * | `listWidth` | `180px` | 字面量 |
 * | `listHeight` | `200px` | 字面量 |
 * | `listWidthLG` | `250px` | 字面量 |
 * | `headerHeight` | `40px` | `controlHeightLG` |
 * | `itemHeight` | `32px` | `controlHeight` |
 * | `itemPaddingBlock` | `5px` | `(controlHeight - fontSize*lineHeight)/2` |
 * | `transferHeaderVerticalPadding` | `9px` | `ceil((controlHeightLG - lineWidth - fontSize*lineHeight)/2)` |
 *
 * 验证命令（可复现）：`node tests/visual/debug/extract-transfer-css.mjs --tokens`
 */
import { getDesignToken } from '@apollo-design/theme';
import { toCssSize } from '../../_internal/to-css-size';

/** 数值 → `px` 串（静态 CSS 不给裸数字补单位）。 */
const px = (value: number): string => toCssSize(value) ?? `${value}px`;

/** `ComponentToken` 的 7 个字段（含派生的 `transferHeaderVerticalPadding`）。 */
export interface ComponentToken {
  /** 列表面板宽度。 */
  listWidth: string;
  /** 列表面板高度。 */
  listHeight: string;
  /** 分页下列表面板宽度。 */
  listWidthLG: string;
  /** 面板头高度（`controlHeightLG`）。 */
  headerHeight: string;
  /** 列表项最小高度（`controlHeight`）。 */
  itemHeight: string;
  /** 列表项纵向内边距。 */
  itemPaddingBlock: string;
  /** 面板头纵向内边距。 */
  transferHeaderVerticalPadding: string;
}

/** `prepareComponentToken` 的入参面（AliasToken 的子集）。 */
export interface TransferSeedToken {
  fontSize: number;
  lineHeight: number;
  controlHeight: number;
  controlHeightLG: number;
  lineWidth: number;
}

/** antd `prepareComponentToken` 的逐条对齐实现。 */
export function prepareComponentToken(token: TransferSeedToken): ComponentToken {
  const fontHeight = Math.round(token.fontSize * token.lineHeight);
  return {
    listWidth: px(180),
    listHeight: px(200),
    listWidthLG: px(250),
    headerHeight: px(token.controlHeightLG),
    itemHeight: px(token.controlHeight),
    itemPaddingBlock: px((token.controlHeight - fontHeight) / 2),
    transferHeaderVerticalPadding: px(
      Math.ceil((token.controlHeightLG - token.lineWidth - fontHeight) / 2),
    ),
  };
}

let tokenCache: ComponentToken | undefined;

/** 组件 token 的构建期值（缓存）。 */
export function transferTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken() as unknown as TransferSeedToken);
  }
  return tokenCache;
}
