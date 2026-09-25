/**
 * Message 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 `components/message/style/index.ts` 的
 * `ComponentToken` + `prepareComponentToken`。registry 数据：组 token 数 = 3。
 *
 * 关键判定值由 L7 与 `style/index.ts` 的 DECLS 字面量逐字对拍。
 */

/**
 * ⚠️ `zIndexPopup` 用的是 **`+ CONTAINER_MAX_OFFSET + 10`**，不是 notification 的 `+ 50`。
 * `CONTAINER_MAX_OFFSET` 来自 `@apollo-design/portal`
 * （= `CONTAINER_OFFSET(100) × CONTAINER_OFFSET_MAX_COUNT(10)` = 1000，该包有用例钉住）。
 * 默认主题下 = **2010**。
 */
import { CONTAINER_MAX_OFFSET } from '@apollo-design/portal';

export interface ComponentToken {
  /** 提示框 z-index。 */
  zIndexPopup: number;
  /** 提示框背景色。 */
  contentBg: string;
  /** 提示框内边距。 */
  contentPadding: string;
}

/** 本组件 token 依赖的 seed / alias 子集（只列真的用到的）。 */
export interface MessageSeedToken {
  zIndexPopupBase: number;
  colorBgElevated: string;
  controlHeightLG: number;
  fontSize: number;
  lineHeight: number;
  paddingSM: number;
}

/** antd `prepareComponentToken` 的关键判定（逐字对齐）。 */
export function prepareComponentToken(token: MessageSeedToken): ComponentToken {
  const { zIndexPopupBase, colorBgElevated, controlHeightLG, fontSize, lineHeight, paddingSM } =
    token;

  return {
    zIndexPopup: zIndexPopupBase + CONTAINER_MAX_OFFSET + 10,
    contentBg: colorBgElevated,
    contentPadding: `${(controlHeightLG - fontSize * lineHeight) / 2}px ${paddingSM}px`,
  };
}

/** 默认主题的判定值（L7 对拍 DECLS 字面量）。 */
export function messageTokenValues(): ComponentToken {
  return prepareComponentToken({
    zIndexPopupBase: 1000,
    colorBgElevated: '#ffffff',
    controlHeightLG: 40,
    fontSize: 14,
    lineHeight: 1.5714285714285714,
    paddingSM: 12,
  });
}
