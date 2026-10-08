/**
 * Upload 的样式生成（G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 es/upload/style（index/dragger/list/motion/picture/rtl
 * + genCollapseMotion），**逐条对拍 extractStyle 真实产物**（87 条规则，
 * upload 家族；Button 的规则由 button 组件自己的样式段负责），不是照源码推演
 * （CHECKLIST #2）。
 *
 * ── 与 antd 产物的结构性差异 ──────────────────────────────────────────────
 *
 * 1. 无 hash / css-var 包裹类（D5）；全部 `--ant-*` 换成 `--apollo-*`
 *    （alias）与 `--apollo-upload-*`（组件 token：actions-color /
 *    picture-card-size，见 token.ts）。
 * 2. MiniProgress 的轨道色内联（P1，见 UploadList/MiniProgress.ts）。
 * 3. rootPrefixCls 仅支持默认 'apollo'（静态移植，参数为 API 对齐保留）。
 *
 * ── 提取期的两处修正（L6 视觉层抓出，见 COMPONENT-CHECKLIST §六） ──────────
 *
 * A. **`.anticon` → `.apollo-icon`（61 处）**：antd 的 `iconCls` 是字面量
 *    `anticon`，且运行时把 `iconStyles` 注入时**全局 replace** 成 `prefixCls`
 *    （D15）；本库零运行时、不在运行时改类名，图标渲染的类名就是
 *    `apollo-icon`。提取时照抄 `.anticon` ⇒ 全部图标规则**静默失配**
 *    （选择器匹配不到任何元素，不报错）——症状是列表图标色/尺寸回落到继承值。
 *    （button/result/tag 早就用 `ICON_CLS = '.apollo-icon'` 的写法，upload 漏了。）
 *
 * B. **补回 cssinjs 的 common/reset 规则**：antd 每个组件的第一段里都有一条
 *    `.{componentCls}{box-sizing;margin:0;padding:0;color:var(--ant-color-text);
 *    font-size;line-height;list-style:none;font-family}`（`genCommonStyle`）。
 *    提取时只留下了 `font-family/font-size/box-sizing` 三个属性 ⇒ 文本颜色
 *    从 `colorText`(rgba(0,0,0,.88)) 掉回继承的纯黑。已在首位补回整条，
 *    位置对齐 antd 实际注入序（同选择器的 common 规则在组件自身规则之后）。
 */

import { uploadTokenValues } from './token';

/**
 * Component Token 声明块（对拍 antd 6.6.4 的 `.css-var-root.ant-upload-wrapper` 块）。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const t = uploadTokenValues();
  return [
    `  --${rootPrefixCls}-upload-actions-color:${t.actionsColor};`,
    `  --${rootPrefixCls}-upload-picture-card-size:${t.pictureCardSize};`,
  ];
}

/** antd 产物机械转换段（87 条，原序、sel+body 去重）。 */
const RULES = `
.apollo-upload-wrapper{font-family:var(--apollo-font-family);font-size:var(--apollo-font-size);box-sizing:border-box;}

.apollo-upload-wrapper::before,.apollo-upload-wrapper::after{box-sizing:border-box;}

.apollo-upload-wrapper [class^="ant-upload"],.apollo-upload-wrapper [class*=" ant-upload"]{box-sizing:border-box;}

.apollo-upload-wrapper [class^="ant-upload"]::before,.apollo-upload-wrapper [class*=" ant-upload"]::before,.apollo-upload-wrapper [class^="ant-upload"]::after,.apollo-upload-wrapper [class*=" ant-upload"]::after{box-sizing:border-box;}

.apollo-upload-wrapper{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);}

.apollo-upload-wrapper .apollo-upload{outline:0;}

.apollo-upload-wrapper .apollo-upload input[type='file']{cursor:pointer;}

.apollo-upload-wrapper .apollo-upload-select{display:inline-block;}

.apollo-upload-wrapper .apollo-upload-hidden{display:none;}

.apollo-upload-wrapper .apollo-upload-disabled{color:var(--apollo-color-text-disabled);cursor:not-allowed;}

.apollo-upload-wrapper .apollo-upload-drag{position:relative;width:100%;height:100%;text-align:center;background:var(--apollo-color-fill-alter);border:var(--apollo-line-width) dashed var(--apollo-color-border);border-radius:var(--apollo-border-radius-lg);cursor:pointer;transition:border-color var(--apollo-motion-duration-slow);}

.apollo-upload-wrapper .apollo-upload-drag .apollo-upload{padding:var(--apollo-padding);}

.apollo-upload-wrapper .apollo-upload-drag .apollo-upload-btn{display:table;width:100%;height:100%;outline:none;border-radius:var(--apollo-border-radius-lg);}

.apollo-upload-wrapper .apollo-upload-drag .apollo-upload-btn:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);}

.apollo-upload-wrapper .apollo-upload-drag .apollo-upload-drag-container{display:table-cell;vertical-align:middle;}

.apollo-upload-wrapper .apollo-upload-drag:not(.apollo-upload-disabled):hover,.apollo-upload-wrapper .apollo-upload-drag-hover:not(.apollo-upload-disabled){border-color:var(--apollo-color-primary-hover);}

.apollo-upload-wrapper .apollo-upload-drag p.apollo-upload-drag-icon{margin-bottom:var(--apollo-margin);}

.apollo-upload-wrapper .apollo-upload-drag p.apollo-upload-drag-icon .apollo-icon{color:var(--apollo-color-primary);font-size:calc(var(--apollo-font-size-heading-3) * 2);}

.apollo-upload-wrapper .apollo-upload-drag p.apollo-upload-text{margin:0 0 var(--apollo-margin-xxs);color:var(--apollo-color-text-heading);font-size:var(--apollo-font-size-lg);}

.apollo-upload-wrapper .apollo-upload-drag p.apollo-upload-hint{color:var(--apollo-color-text-description);font-size:var(--apollo-font-size);}

.apollo-upload-wrapper .apollo-upload-drag.apollo-upload-disabled p.apollo-upload-drag-icon .apollo-icon,.apollo-upload-wrapper .apollo-upload-drag.apollo-upload-disabled p.apollo-upload-text,.apollo-upload-wrapper .apollo-upload-drag.apollo-upload-disabled p.apollo-upload-hint{color:var(--apollo-color-text-disabled);}

.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture .apollo-upload-list-item,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item{position:relative;height:calc(calc(var(--apollo-font-size-heading-3) * 2) + var(--apollo-line-width) * 2 + var(--apollo-padding-xs) * 2);padding:var(--apollo-padding-xs);border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);border-radius:var(--apollo-border-radius-lg);}

.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture .apollo-upload-list-item:hover,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item:hover,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item:hover{background:transparent;}

.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture .apollo-upload-list-item .apollo-upload-list-item-thumbnail,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item .apollo-upload-list-item-thumbnail,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item .apollo-upload-list-item-thumbnail{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;width:calc(var(--apollo-font-size-heading-3) * 2);height:calc(var(--apollo-font-size-heading-3) * 2);line-height:calc(calc(var(--apollo-font-size-heading-3) * 2) + var(--apollo-padding-sm));text-align:center;flex:none;}

.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture .apollo-upload-list-item .apollo-upload-list-item-thumbnail .apollo-icon,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item .apollo-upload-list-item-thumbnail .apollo-icon,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item .apollo-upload-list-item-thumbnail .apollo-icon{font-size:var(--apollo-font-size-heading-2);color:var(--apollo-color-primary);}

.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture .apollo-upload-list-item .apollo-upload-list-item-thumbnail img,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item .apollo-upload-list-item-thumbnail img,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item .apollo-upload-list-item-thumbnail img{display:block;width:100%;height:100%;overflow:hidden;}

.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture .apollo-upload-list-item .apollo-upload-list-item-progress,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item .apollo-upload-list-item-progress,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item .apollo-upload-list-item-progress{bottom:calc(var(--apollo-font-size) * var(--apollo-line-height) / 2 + calc((var(--apollo-margin-xs) / 2) + var(--apollo-line-width)));width:calc(100% - calc(var(--apollo-padding-sm) * 2));margin-top:0;padding-inline-start:calc(calc(var(--apollo-font-size-heading-3) * 2) + var(--apollo-padding-xs));}

.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture .apollo-upload-list-item-error,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-error,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-error{border-color:var(--apollo-color-error);}

.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture .apollo-upload-list-item-error .apollo-upload-list-item-thumbnail.apollo-upload-list-item-file .apollo-icon,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-error .apollo-upload-list-item-thumbnail.apollo-upload-list-item-file .apollo-icon,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-error .apollo-upload-list-item-thumbnail.apollo-upload-list-item-file .apollo-icon{color:var(--apollo-color-error);}

.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture .apollo-upload-list-item-uploading,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-uploading,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-uploading{border-style:dashed;}

.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture .apollo-upload-list-item-uploading .apollo-upload-list-item-name,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-uploading .apollo-upload-list-item-name,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-uploading .apollo-upload-list-item-name{margin-bottom:calc((var(--apollo-margin-xs) / 2) + var(--apollo-line-width));}

.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item::before,.apollo-upload-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item .apollo-upload-list-item-thumbnail{border-radius:50%;}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper{display:block;}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper::before,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper::before{display:table;content:"";}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper::after,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper::after{display:table;clear:both;content:"";}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload.apollo-upload-select,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload.apollo-upload-select{width:var(--apollo-upload-picture-card-size);height:var(--apollo-upload-picture-card-size);text-align:center;vertical-align:top;background-color:var(--apollo-color-fill-alter);border:var(--apollo-line-width) dashed var(--apollo-color-border);border-radius:var(--apollo-border-radius-lg);cursor:pointer;transition:border-color var(--apollo-motion-duration-slow);}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload.apollo-upload-select >.apollo-upload,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload.apollo-upload-select >.apollo-upload{display:flex;align-items:center;justify-content:center;height:100%;text-align:center;}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload.apollo-upload-select:not(.apollo-upload-disabled):hover,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload.apollo-upload-select:not(.apollo-upload-disabled):hover{border-color:var(--apollo-color-primary);}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle{display:flex;flex-wrap:wrap;}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card:not(:empty),.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card:not(:empty),.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle:not(:empty),.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle:not(:empty){min-height:var(--apollo-upload-picture-card-size);}

@supports not (gap: 1px){.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card>*,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card>*,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle>*,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle>*{margin-block-end:var(--apollo-margin-xs);margin-inline-end:var(--apollo-margin-xs);}}

@supports (gap: 1px){.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle{gap:var(--apollo-margin-xs);}}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-container,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-container,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-container,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-container{display:inline-block;width:var(--apollo-upload-picture-card-size);height:var(--apollo-upload-picture-card-size);vertical-align:top;}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card::after,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card::after,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle::after,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle::after{display:none;}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card::before,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card::before,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle::before,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle::before{display:none;}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item{height:100%;margin:0;}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item::before,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item::before,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item::before,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item::before{position:absolute;z-index:1;width:calc(100% - calc(var(--apollo-padding-xs) * 2));height:calc(100% - calc(var(--apollo-padding-xs) * 2));background-color:var(--apollo-color-bg-mask);opacity:0;transition:all var(--apollo-motion-duration-slow);content:" ";}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item:hover::before,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item:hover::before,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item:hover::before,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item:hover::before,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item:hover .apollo-upload-list-item-actions,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item:hover .apollo-upload-list-item-actions,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item:hover .apollo-upload-list-item-actions,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item:hover .apollo-upload-list-item-actions{opacity:1;}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions{position:absolute;inset-inline-start:0;z-index:10;width:100%;white-space:nowrap;text-align:center;opacity:0;transition:all var(--apollo-motion-duration-slow);}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-eye,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-eye,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-eye,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-eye,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-download,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-download,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-download,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-download,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-delete,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-delete,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-delete,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-delete{z-index:10;width:var(--apollo-font-size-lg);margin:0 var(--apollo-margin-xxs);font-size:var(--apollo-font-size-lg);cursor:pointer;transition:all var(--apollo-motion-duration-slow);color:var(--apollo-color-text-light-solid);}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-eye:hover,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-eye:hover,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-eye:hover,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-eye:hover,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-download:hover,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-download:hover,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-download:hover,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-download:hover,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-delete:hover,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-delete:hover,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-delete:hover,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-delete:hover{color:var(--apollo-color-text-light-solid);}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-eye svg,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-eye svg,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-eye svg,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-eye svg,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-download svg,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-download svg,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-download svg,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-download svg,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-delete svg,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-actions .apollo-icon-delete svg,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-delete svg,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-actions .apollo-icon-delete svg{vertical-align:baseline;}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-thumbnail,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-thumbnail,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-thumbnail,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-thumbnail,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-thumbnail img,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-thumbnail img,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-thumbnail img,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-thumbnail img{position:static;display:block;width:100%;height:100%;object-fit:contain;}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-name,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-name,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-name,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-name{display:none;text-align:center;}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-file+.apollo-upload-list-item-name,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-file+.apollo-upload-list-item-name,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-file+.apollo-upload-list-item-name,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-file+.apollo-upload-list-item-name{position:absolute;bottom:var(--apollo-margin);display:block;width:calc(100% - calc(var(--apollo-padding-xs) * 2));}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-uploading.apollo-upload-list-item,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-uploading.apollo-upload-list-item,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-uploading.apollo-upload-list-item,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-uploading.apollo-upload-list-item{background-color:var(--apollo-color-fill-alter);}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-uploading::before,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-uploading::before,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-uploading::before,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-uploading::before,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-uploading .apollo-icon-eye,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-uploading .apollo-icon-eye,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-uploading .apollo-icon-eye,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-uploading .apollo-icon-eye,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-uploading .apollo-icon-download,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-uploading .apollo-icon-download,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-uploading .apollo-icon-download,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-uploading .apollo-icon-download,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-uploading .apollo-icon-delete,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-uploading .apollo-icon-delete,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-uploading .apollo-icon-delete,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-uploading .apollo-icon-delete{display:none;}

.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-progress,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-card .apollo-upload-list-item-progress,.apollo-upload-wrapper.apollo-upload-picture-card-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-progress,.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload-list.apollo-upload-list-picture-circle .apollo-upload-list-item-progress{bottom:var(--apollo-margin-xl);width:calc(100% - calc(var(--apollo-padding-xs) * 2));padding-inline-start:0;}

.apollo-upload-wrapper.apollo-upload-picture-circle-wrapper .apollo-upload.apollo-upload-select{border-radius:50%;}

.apollo-upload-wrapper .apollo-upload-list{line-height:var(--apollo-line-height);}

.apollo-upload-wrapper .apollo-upload-list::before{display:table;content:"";}

.apollo-upload-wrapper .apollo-upload-list::after{display:table;clear:both;content:"";}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item{position:relative;height:calc(var(--apollo-line-height) * var(--apollo-font-size));margin-top:var(--apollo-margin-xs);font-size:var(--apollo-font-size);display:flex;align-items:center;transition:background-color var(--apollo-motion-duration-slow);border-radius:var(--apollo-border-radius-sm);}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item:hover{background-color:var(--apollo-control-item-bg-hover);}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item .apollo-upload-list-item-name{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;padding:0 var(--apollo-padding-xs);line-height:var(--apollo-line-height);flex:auto;transition:all var(--apollo-motion-duration-slow);}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item .apollo-upload-list-item-actions{white-space:nowrap;}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item .apollo-upload-list-item-actions .apollo-upload-list-item-action{opacity:0;}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item .apollo-upload-list-item-actions .apollo-icon{color:var(--apollo-upload-actions-color);transition:all var(--apollo-motion-duration-slow);}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item .apollo-upload-list-item-actions .apollo-upload-list-item-action:focus-visible,.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item .apollo-upload-list-item-actions.picture .apollo-upload-list-item-action{opacity:1;}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item .apollo-upload-icon .apollo-icon{color:var(--apollo-color-icon);font-size:var(--apollo-font-size);}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item .apollo-upload-list-item-progress{position:absolute;bottom:calc(calc((var(--apollo-margin-xs) / 2) + var(--apollo-line-width)) * -1);width:100%;padding-inline-start:calc(var(--apollo-font-size) + var(--apollo-padding-xs));font-size:var(--apollo-font-size);line-height:0;pointer-events:none;}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item .apollo-upload-list-item-progress >div{margin:0;}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item:hover .apollo-upload-list-item-action{opacity:1;}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item-error{color:var(--apollo-color-error);}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item-error .apollo-upload-list-item-name,.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item-error .apollo-upload-icon .apollo-icon{color:var(--apollo-color-error);}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item-error .apollo-upload-list-item-actions .apollo-icon,.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item-error .apollo-upload-list-item-actions .apollo-icon:hover{color:var(--apollo-color-error);}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item-error .apollo-upload-list-item-actions .apollo-upload-list-item-action{opacity:1;}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item-container{transition:opacity var(--apollo-motion-duration-slow),height var(--apollo-motion-duration-slow);}

.apollo-upload-wrapper .apollo-upload-list .apollo-upload-list-item-container::before{display:table;width:0;height:0;content:"";}

.apollo-upload-wrapper .apollo-upload-animate-inline-appear,.apollo-upload-wrapper .apollo-upload-animate-inline-enter,.apollo-upload-wrapper .apollo-upload-animate-inline-leave{animation-duration:var(--apollo-motion-duration-slow);animation-timing-function:var(--apollo-motion-ease-in-out-circ);animation-fill-mode:forwards;}

.apollo-upload-wrapper .apollo-upload-animate-inline-appear,.apollo-upload-wrapper .apollo-upload-animate-inline-enter{animation-name:apollo-upload-animate-inline-in;}

.apollo-upload-wrapper .apollo-upload-animate-inline-leave{animation-name:apollo-upload-animate-inline-out;}

.apollo-upload-wrapper .apollo-fade-enter,.apollo-upload-wrapper .apollo-fade-appear{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}

.apollo-upload-wrapper .apollo-fade-leave{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}

.apollo-upload-wrapper .apollo-fade-enter.apollo-fade-enter-active,.apollo-upload-wrapper .apollo-fade-appear.apollo-fade-appear-active{animation-name:apollo-fade-in;animation-play-state:running;}

.apollo-upload-wrapper .apollo-fade-leave.apollo-fade-leave-active{animation-name:apollo-fade-out;animation-play-state:running;pointer-events:none;}

.apollo-upload-rtl{direction:rtl;}

.apollo-upload .apollo-motion-collapse-legacy{overflow:hidden;}

.apollo-upload .apollo-motion-collapse-legacy-active{transition:height var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),opacity var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out)!important;}

.apollo-upload .apollo-motion-collapse{overflow:hidden;transition:height var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),opacity var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out)!important;}
`;

/**
 * 动画 keyframes（antd 的 `Keyframes('antFadeIn')` / `uploadAnimateInlineIn`，
 * 体逐字取自 antd 产物）。
 *
 * 🚨 2026-10-08：此前 `animation-name` 直接照抄了 cssinjs **开发态占位名**
 * `css-dev-only-do-not-override-…-antFadeIn`，而对应的 `@keyframes` 从未定义
 * ⇒ 动画永远不跑、`animationend` 不触发，upload 列表进度条的 appear 态
 * 类名**卡死**到 motionDeadline（dom-probe upload/basic 抓出）。
 * 与 select/style「动画名稳定化」同判（U-KEYFRAMES 家族）。
 */
const KEYFRAMES = `
@keyframes apollo-fade-in{0%{opacity:0;}100%{opacity:1;}}
@keyframes apollo-fade-out{0%{opacity:1;}100%{opacity:0;}}
@keyframes apollo-upload-animate-inline-in{from{width:0;height:0;padding:0;opacity:0;margin:calc(var(--apollo-margin-xs) / -2);}}
@keyframes apollo-upload-animate-inline-out{to{width:0;height:0;padding:0;opacity:0;margin:calc(var(--apollo-margin-xs) / -2);}}`;

/** Upload 家族样式。 */
export function genUploadStyle(rootPrefixCls: string = 'apollo'): string {
  const decls = `.${rootPrefixCls}-upload-wrapper{${genTokenDecls(rootPrefixCls).join('')}}`;
  return `${KEYFRAMES}
${decls}

${RULES}`;
}
