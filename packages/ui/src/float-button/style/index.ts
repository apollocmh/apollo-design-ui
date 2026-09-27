/**
 * FloatButton 的静态样式（G3/G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 `components/float-button/style`（React SSR +
 * `extractStyle` 真实产物逐条机械转换，提取脚本
 * `tests/visual/debug/extract-float-button.mjs`，9 个场景 SSR dump）。
 *
 * 转换规则（与 rate/steps 同管线）：
 *   1. 去掉 `:where(.css-dev-only-…)` hash 前缀与 `css-var-root` 标记（D5）。
 *   2. `.ant-*` → `.apollo-*`；`--ant-*` → `--apollo-*`；`.anticon` → `.apollo-icon`（D15）。
 *   3. `.ant-float-btn-css-var`（死选择器，resetComponent 字体声明）不复制 ——
 *      Button 基线的 reset 已覆盖。
 *   4. 共享动效 @keyframes（zoom-big）不在此重复 —— motion 基线职责。
 *   5. Token = 0（ComponentToken 为空对象）—— 全部 alias var() 派生。
 *   6. BackTop 进度环变量 `--apollo-float-btn-progress`（`${x}turn`）由
 *      BackTop.ts rootStyle 注入，conic-gradient 在此消费。
 */

/** antd 产物机械转换段（原序）。 */
const RULES = `
.apollo-float-btn{--apollo-float-btn-size:var(--apollo-control-height-lg);flex-direction:column;margin:0;padding:var(--apollo-padding-xxs) 0;width:var(--apollo-float-btn-size);min-height:var(--apollo-float-btn-size);height:auto;word-break:break-word;white-space:normal;gap:calc(var(--apollo-padding-xxs) / 2);}
.apollo-float-btn-rtl{direction:rtl;}
.apollo-float-btn.apollo-float-btn-individual{position:fixed;z-index:var(--apollo-z-index-popup-base);inset-inline-end:var(--apollo-margin-lg);bottom:var(--apollo-margin-xxl);box-shadow:var(--apollo-box-shadow-secondary);}
.apollo-float-btn.apollo-float-btn-pure{position:relative;inset:auto;}
.apollo-float-btn:empty{display:none;}
.apollo-float-btn .apollo-float-btn-icon{line-height:1;}
.apollo-float-btn.apollo-btn.apollo-float-btn-progress{border-width:var(--apollo-line-width-bold);border-color:transparent;background-image:linear-gradient(var(--apollo-btn-bg-color), var(--apollo-btn-bg-color)),conic-gradient(var(--apollo-color-primary) var(--apollo-float-btn-progress, 0turn), var(--apollo-color-border-secondary) 0);background-origin:border-box;background-clip:padding-box,border-box;}
.apollo-float-btn.apollo-btn.apollo-float-btn-progress:not(:disabled):not(.apollo-btn-disabled):hover{border-color:transparent;background-image:linear-gradient(var(--apollo-btn-bg-color-hover), var(--apollo-btn-bg-color-hover)),conic-gradient(var(--apollo-color-primary) var(--apollo-float-btn-progress, 0turn), var(--apollo-color-border-secondary) 0);}
.apollo-float-btn.apollo-btn.apollo-float-btn-progress:not(:disabled):not(.apollo-btn-disabled):active{border-color:transparent;background-image:linear-gradient(var(--apollo-btn-bg-color-active), var(--apollo-btn-bg-color-active)),conic-gradient(var(--apollo-color-primary) var(--apollo-float-btn-progress, 0turn), var(--apollo-color-border-secondary) 0);}
.apollo-float-btn.apollo-btn.apollo-float-btn-progress:disabled,.apollo-float-btn.apollo-btn.apollo-float-btn-progress.apollo-btn-disabled{border-color:transparent;background-image:linear-gradient(var(--apollo-btn-bg-color-disabled), var(--apollo-btn-bg-color-disabled)),conic-gradient(var(--apollo-color-primary) var(--apollo-float-btn-progress, 0turn), var(--apollo-color-border-secondary) 0);}
.apollo-float-btn.apollo-float-btn-icon-only .apollo-icon{font-size:calc(var(--apollo-font-size-icon) * 1.5);}
.apollo-float-btn .apollo-float-btn-content{font-size:var(--apollo-font-size-sm);}
.apollo-float-btn .apollo-float-btn-badge{position:absolute;top:0;inset-inline-end:0;}
.apollo-float-btn .apollo-float-btn-badge:not(.apollo-float-btn-badge-dot){transform:translate(50%, -50%);}
.apollo-float-btn-rtl .apollo-float-btn-badge:not(.apollo-float-btn-badge-dot){transform:translate(-50%, -50%);}
.apollo-float-btn-square .apollo-float-btn-badge-dot{margin-top:calc(var(--apollo-border-radius) * 0.29289321881345254);margin-inline-end:calc(var(--apollo-border-radius) * 0.29289321881345254);}
.apollo-float-btn-circle .apollo-float-btn-badge{margin-top:calc(var(--apollo-control-height) / 2 * 0.29289321881345254);margin-inline-end:calc(var(--apollo-control-height) / 2 * 0.29289321881345254);}
.apollo-float-btn-group{--apollo-float-btn-list-transform-start:translate(0,var(--apollo-control-height-lg));--apollo-float-btn-list-trigger-offset:calc(var(--apollo-control-height-lg) + var(--apollo-padding));box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);position:fixed;z-index:var(--apollo-z-index-popup-base);inset-inline-end:var(--apollo-margin-lg);bottom:var(--apollo-margin-xxl);gap:var(--apollo-padding);}
.apollo-float-btn-group-rtl{direction:rtl;}
.apollo-float-btn-group.apollo-float-btn-pure{position:relative;inset:auto;}
.apollo-float-btn-group .apollo-float-btn{position:relative;inset:auto;}
.apollo-float-btn-group:not(.apollo-float-btn-group-individual) .apollo-float-btn-group-list{box-shadow:var(--apollo-box-shadow-secondary);}
.apollo-float-btn-group.apollo-float-btn-group-individual .apollo-float-btn-group-list{gap:var(--apollo-padding);}
.apollo-float-btn-group-menu-mode .apollo-float-btn-group-list{position:absolute;}
.apollo-float-btn-group-menu-mode .apollo-float-btn-group-list::after{content:"";position:absolute;inset:0;}
.apollo-float-btn-group .apollo-float-btn-group-list{border-radius:var(--apollo-border-radius-lg);}
.apollo-float-btn-group .apollo-float-btn-group-list-motion{transition:all var(--apollo-motion-duration-slow);}
.apollo-float-btn-group .apollo-float-btn-group-list-motion-enter,.apollo-float-btn-group .apollo-float-btn-group-list-motion-appear{opacity:0;transform:var(--apollo-float-btn-list-transform-start);}
.apollo-float-btn-group .apollo-float-btn-group-list-motion-enter-active,.apollo-float-btn-group .apollo-float-btn-group-list-motion-appear-active{opacity:1;transform:translate(0, 0);}
.apollo-float-btn-group .apollo-float-btn-group-list-motion-leave-active{opacity:0;transform:var(--apollo-float-btn-list-transform-start);}
.apollo-float-btn-group-top .apollo-float-btn-group-list{bottom:var(--apollo-float-btn-list-trigger-offset);}
.apollo-float-btn-group-top .apollo-float-btn-group-list::after{top:100%;bottom:calc(var(--apollo-padding) * -1);}
.apollo-float-btn-group-bottom .apollo-float-btn-group-list{--apollo-float-btn-list-transform-start:translate(0, calc(var(--apollo-control-height-lg) * -1));top:var(--apollo-float-btn-list-trigger-offset);}
.apollo-float-btn-group-bottom .apollo-float-btn-group-list::after{top:calc(var(--apollo-padding) * -1);bottom:100%;}
.apollo-float-btn-group-left .apollo-float-btn-group-list{--apollo-float-btn-list-transform-start:translate(var(--apollo-control-height-lg), 0);right:var(--apollo-float-btn-list-trigger-offset);}
.apollo-float-btn-group-left .apollo-float-btn-group-list::after{left:100%;right:calc(var(--apollo-padding) * -1);}
.apollo-float-btn-group-right .apollo-float-btn-group-list{--apollo-float-btn-list-transform-start:translate(calc(var(--apollo-control-height-lg) * -1), 0);left:var(--apollo-float-btn-list-trigger-offset);}
.apollo-float-btn-group-right .apollo-float-btn-group-list::after{left:calc(var(--apollo-padding) * -1);right:100%;}
.data-ant-cssinjs-cache-path{content:"|apollo-design-icons|apollo-icon:mtsb22;css-dev-only-do-not-override-19u5a7b|Shared|ant:2mp7q1;css-dev-only-do-not-override-19u5a7b|FloatButton-FloatButton|apollo-float-btn|apollo-icon:1823t8q;css-dev-only-do-not-override-19u5a7b|Button-Button|apollo-btn|apollo-icon:1uiealc;css-dev-only-do-not-override-19u5a7b|Wave-Wave|apollo-wave|apollo-icon:fl2o3w;css-dev-only-do-not-override-19u5a7b|Tooltip-Tooltip|apollo-tooltip|apollo-icon:1w521wl;css-dev-only-do-not-override-19u5a7b|Flex-Flex|apollo-flex|apollo-icon:1u9gvz6;css-dev-only-do-not-override-19u5a7b|Space-Compact|apollo-space-compact|apollo-icon:1rj444g;css-dev-only-do-not-override-19u5a7b|Button-compact|apollo-btn|apollo-icon:1npan6y";}
`;

/** 生成单个前缀下的完整样式。 */
export function genFloatButtonStyle(prefixCls: string = 'apollo'): string {
  const rename = (cssText: string): string =>
    prefixCls === 'apollo'
      ? cssText
      : cssText.split('.apollo-float-btn').join(`.${prefixCls}-float-btn`);
  return rename(RULES);
}
