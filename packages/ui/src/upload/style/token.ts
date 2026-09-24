/**
 * Upload 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/upload/style/index.js`（`prepareComponentToken`）。
 * registry 数据：upload 组 token 数 = 2。
 *
 * - **别名派生**（actionsColor）：声明落 `var(--apollo-*)`（B7 可校验）。
 * - **构建期解析值**（pictureCardSize 算式、uploadThumbnailSize /
 *   uploadProgressOffset / uploadPicCardSize 派生算式）：collapse D46/D50 同判。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

const px = (value: number | string): string => (typeof value === 'number' ? `${value}px` : value);

/** prepareComponentToken 的产物面。 */
export interface ComponentToken {
  /** `colorIcon`（别名 → var()）。 */
  actionsColor: string;
  /** `controlHeightLG * 2.55`（antd 6.6.4：40 * 2.55 = 102px）。 */
  pictureCardSize: string;
}

/** prepareComponentToken 的入参面（AliasToken 的子集）。 */
export interface UploadSeedToken {
  colorIcon: string;
  controlHeightLG: number;
  fontSizeHeading3: number;
  marginXS: number;
  lineWidth: number;
}

/** 构建期算好全部值（对拍 antd `prepareComponentToken`）。 */
export function prepareComponentToken(token: UploadSeedToken): ComponentToken {
  return {
    actionsColor: v('colorIcon'),
    pictureCardSize: px(token.controlHeightLG * 2.55),
  };
}

/** genStyleHooks mergeToken 的派生段（uploadToken 合并层的 3 个派生值）。 */
export interface UploadDerivedToken extends ComponentToken {
  /** `fontSizeHeading3 * 2`。 */
  uploadThumbnailSize: string;
  /** `marginXS / 2 + lineWidth`。 */
  uploadProgressOffset: string;
  /** `pictureCardSize`。 */
  uploadPicCardSize: string;
}

let tokenCache: UploadDerivedToken | null = null;

/** 构建期 token 值（缓存；首次调用时读主题默认 seed）。 */
export function uploadTokenValues(): UploadDerivedToken {
  if (!tokenCache) {
    const seed = getDesignToken() as unknown as UploadSeedToken;
    const base = prepareComponentToken(seed);
    tokenCache = {
      ...base,
      uploadThumbnailSize: px(seed.fontSizeHeading3 * 2),
      uploadProgressOffset: px(seed.marginXS / 2 + seed.lineWidth),
      uploadPicCardSize: base.pictureCardSize,
    };
  }
  return tokenCache;
}
