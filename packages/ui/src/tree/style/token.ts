/**
 * Tree 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 `es/tree/style/index.js` 的 `initComponentToken`（:369-385）
 * 与 `prepareComponentToken`（:386-396）。**9 个字段**（7 shared + 2 directory）——
 * registry 的 `tokenCount: 2` 与产物不符，以本文件与 `extract-tree-css.mjs`
 * 的 css-var 产物对拍为准（2026-09-29 已对拍通过）。
 *
 * ── 产物判定值（默认主题，`--ant-tree-*` → `--apollo-tree-*`）────────────────
 *   title-height            24px                 (= controlHeightSM)
 *   switcher-size           24px                 (= titleHeight)
 *   indent-size             24px                 (= titleHeight)
 *   node-hover-bg           rgba(0,0,0,0.04)     (= controlItemBgHover)
 *   node-hover-color        rgba(0,0,0,0.88)     (= colorText)
 *   node-selected-bg        #e6f4ff              (= controlItemBgActive)
 *   node-selected-color     rgba(0,0,0,0.88)     (= colorText)
 *   directory-node-selected-color  #fff          (= colorTextLightSolid)
 *   directory-node-selected-bg     #1677ff       (= colorPrimary)
 *
 * 与 popconfirm 的「结构性量」同判：9 个全部是 **alias token 的直引/直派**
 * （无计算式派生），因此 prepareComponentToken 里直接引用 alias —— 随主题自适应，
 * 落 var(--apollo-tree-*) 由 style/index.ts 的 DECLS 块承担（B7 可校验）。
 */

import type { AliasToken } from '@apollo-design/theme';

export interface ComponentToken {
  /** 节点标题高度（= controlHeightSM，默认 24）。 */
  titleHeight: number;
  /** 展开按钮宽度（= titleHeight）。 */
  switcherSize: number;
  /** 缩进宽度（= titleHeight）。 */
  indentSize: number;
  /** 节点悬浮态背景色（= controlItemBgHover）。 */
  nodeHoverBg: string;
  /** 节点悬浮态文字颜色（= colorText）。 */
  nodeHoverColor: string;
  /** 节点选中态背景色（= controlItemBgActive）。 */
  nodeSelectedBg: string;
  /** 节点选中态文字颜色（= colorText）。 */
  nodeSelectedColor: string;
  /** 目录树节点选中文字颜色（= colorTextLightSolid）。 */
  directoryNodeSelectedColor: string;
  /** 目录树节点选中背景色（= colorPrimary）。 */
  directoryNodeSelectedBg: string;
}

export const prepareComponentToken = (token: AliasToken): ComponentToken => ({
  titleHeight: token.controlHeightSM,
  switcherSize: token.controlHeightSM,
  indentSize: token.controlHeightSM,
  nodeHoverBg: token.controlItemBgHover,
  nodeHoverColor: token.colorText,
  nodeSelectedBg: token.controlItemBgActive,
  nodeSelectedColor: token.colorText,
  directoryNodeSelectedColor: token.colorTextLightSolid,
  directoryNodeSelectedBg: token.colorPrimary,
});

export default prepareComponentToken;
