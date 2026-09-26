/**
 * Drawer 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 `components/drawer/style/index.ts:9-30` 的 `ComponentToken`
 * 与 `:342-347` 的 `prepareComponentToken`。registry 数据：组 token 数 = **4**。
 *
 * ⚠️ `zIndexPopup` 直接用 `zIndexPopupBase`（= 1000）—— **不加任何偏移**。
 *    对比：message 是 `+ CONTAINER_MAX_OFFSET + 10`（2010）、notification 是 `+ 50`（2050）。
 *    drawer 是「容器级」浮层，靠 `useZIndex` 的容器偏移体系而不是自己的 popup 偏移。
 *
 * 关键判定值由 L7 与 `style/index.ts` 的 DECLS 字面量逐字对拍。
 */

export interface ComponentToken {
  /** 抽屉 z-index。 */
  zIndexPopup: number;
  /** 底部区域纵向内间距。 */
  footerPaddingBlock: number;
  /** 底部区域横向内间距。 */
  footerPaddingInline: number;
  /** 拖拽手柄尺寸（`resizable` 用）。 */
  draggerSize: number;
}

/** 本组件 token 依赖的 seed / alias 子集。 */
export interface DrawerSeedToken {
  zIndexPopupBase: number;
  paddingXS: number;
  padding: number;
}

/** antd `prepareComponentToken` 的关键判定（逐字对齐）。 */
export function prepareComponentToken(token: DrawerSeedToken): ComponentToken {
  const { zIndexPopupBase, paddingXS, padding } = token;

  return {
    zIndexPopup: zIndexPopupBase,
    footerPaddingBlock: paddingXS,
    footerPaddingInline: padding,
    draggerSize: 4,
  };
}

/** 默认主题的判定值（L7 对拍 DECLS 字面量）。 */
export function drawerTokenValues(): ComponentToken {
  return prepareComponentToken({
    zIndexPopupBase: 1000,
    paddingXS: 8,
    padding: 16,
  });
}
