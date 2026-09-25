/**
 * Notification 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 `components/notification/style/index.ts` 的 `ComponentToken` +
 * `prepareComponentToken` + `prepareNotificationToken`。registry 数据：组 token 数 = **7**
 * （其中 3 个有默认值，4 个容器背景色默认 `undefined` —— 见下）。
 *
 * 关键判定值由 L7 与 `style/index.ts` 的 DECLS 字面量逐字对拍。
 */

/**
 * ⚠️ `zIndexPopup` 用的是 **`+ CONTAINER_MAX_OFFSET + 50`**，不是 message 的 `+ 10`。
 * `CONTAINER_MAX_OFFSET` 来自 `@apollo-design/portal`（= 100 × 10 = 1000，该包有用例钉住）
 * ⇒ 默认主题下 = **2050**。
 */
import { CONTAINER_MAX_OFFSET } from '@apollo-design/portal';

export interface ComponentToken {
  /** 提醒框 z-index。 */
  zIndexPopup: number;
  /** 提醒框宽度。 */
  width: number | string;
  /** 进度条背景色。 */
  progressBg: string;
  /**
   * 成功态容器背景色。**默认 `undefined`** —— 上游为修 issue 55649/56055 加的，
   * 未配置时由 CSS 的 `var(--apollo-notification-color-success-bg, var(--apollo-color-bg-elevated))`
   * 回退。所以它们**不会**出现在组件变量声明块里（B7 也因「带 fallback 的 var()」而不计入）。
   */
  colorSuccessBg?: string;
  colorErrorBg?: string;
  colorInfoBg?: string;
  colorWarningBg?: string;
}

/** notification 的 Component Token 依赖的 seed / alias 子集。 */
export interface NotificationSeedToken {
  zIndexPopupBase: number;
  colorPrimaryBorderHover: string;
  colorPrimary: string;
}

/** antd `prepareComponentToken` 的关键判定（逐字对齐）。 */
export function prepareComponentToken(token: NotificationSeedToken): ComponentToken {
  const { zIndexPopupBase, colorPrimaryBorderHover, colorPrimary } = token;

  return {
    zIndexPopup: zIndexPopupBase + CONTAINER_MAX_OFFSET + 50,
    width: 384,
    progressBg: `linear-gradient(90deg, ${colorPrimaryBorderHover}, ${colorPrimary})`,
    colorSuccessBg: undefined,
    colorErrorBg: undefined,
    colorInfoBg: undefined,
    colorWarningBg: undefined,
  };
}

/** 默认主题的判定值（L7 对拍 DECLS 字面量）。 */
export function notificationTokenValues(): ComponentToken {
  return prepareComponentToken({
    zIndexPopupBase: 1000,
    colorPrimaryBorderHover: '#69b1ff',
    colorPrimary: '#1677ff',
  });
}

// ==============================================================================
// ==                     共享派生（message 也用这一份）                       ==
// ==============================================================================

/** `prepareNotificationToken` 的输入（只用得到这么多 alias）。 */
export interface NotificationDerivedSeedToken {
  colorBgElevated: string;
  paddingMD: number;
  paddingLG: number;
  paddingContentHorizontalLG: number;
  fontSizeLG: number;
  lineHeightLG: number;
  controlHeightLG: number;
  margin: number;
  marginLG: number;
}

/**
 * antd `prepareNotificationToken` 的派生（**共享层**：message 把自己的 3 个 token 映射成
 * 这份形状后再生成样式）。
 *
 * ⚠️ 这些值不直接产出 CSS 变量 —— 它们在产物里要么是**内联声明**（icon / title 的
 * 字号与行高写在 notice 规则里），要么被上游在构建期算成字面量。列在这里是为了
 * L7 能逐条对拍「派生算法」，以及让 message 的映射有唯一真源。
 */
export interface NotificationDerivedToken extends NotificationDerivedSeedToken {
  notificationBg: string;
  notificationPadding: string;
  notificationPaddingVertical: number;
  notificationPaddingHorizontal: number;
  notificationIconSize: number;
  notificationCloseButtonSize: number;
  notificationMarginBottom: number;
  notificationMarginEdge: number;
  notificationProgressHeight: number;
  notificationMotionOffset: number;
}

export function prepareNotificationToken(
  token: NotificationDerivedSeedToken,
): NotificationDerivedToken {
  return {
    ...token,
    notificationBg: token.colorBgElevated,
    notificationPadding: `${token.paddingMD}px ${token.paddingContentHorizontalLG}px`,
    notificationPaddingVertical: token.paddingMD,
    notificationPaddingHorizontal: token.paddingLG,
    notificationIconSize: token.fontSizeLG * token.lineHeightLG,
    notificationCloseButtonSize: token.controlHeightLG * 0.55,
    notificationMarginBottom: token.margin,
    notificationMarginEdge: token.marginLG,
    notificationProgressHeight: 2,
    notificationMotionOffset: 64,
  };
}

/** 默认主题下的共享派生值（L7 对拍）。 */
export function notificationDerivedValues(): NotificationDerivedToken {
  return prepareNotificationToken({
    colorBgElevated: '#ffffff',
    paddingMD: 20,
    paddingLG: 24,
    paddingContentHorizontalLG: 24,
    fontSizeLG: 16,
    lineHeightLG: 1.5,
    controlHeightLG: 40,
    margin: 16,
    marginLG: 24,
  });
}
