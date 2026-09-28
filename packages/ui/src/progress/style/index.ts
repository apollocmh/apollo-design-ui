/**
 * Progress 的静态样式（G3/G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 `components/progress/style`（React SSR + `extractStyle`
 * 真实产物逐条机械转换，提取脚本 `tests/visual/debug/extract-progress.mjs`，
 * 20 个场景 SSR dump；tooltip 等无关组件块已过滤）。
 *
 * 转换规则（与 steps/rate 同管线）：
 *   1. 去掉 `:where(.css-dev-only-…)` hash 前缀与 `.css-var-_R_x_.` 复合（静态移植无 hashId）。
 *   2. `.ant-*` → `.apollo-*`；`--ant-*` → `--apollo-*`；`.anticon` → `.apollo-icon`（D15）。
 *   3. `--progress-line-stroke-color` **无组件前缀**（antd 产物逐字，不改动）。
 *   4. `antProgressActive` keyframes 是组件专属动效，随产物保留（改名 apolloProgress）。
 *   5. Token 6 个（circleTextColor/defaultColor/remainingColor/lineBorderRadius/
 *      circleTextFontSize/circleIconFontSize）以 DECLS 段落根形态声明（D69）。
 */

/** 组件变量声明（对拍 antd 的 css-var 块，原序字面量）。 */
export function genProgressTokenDecls(): string {
  return DECLS;
}

const DECLS = `--apollo-progress-circle-text-color:rgba(0,0,0,0.88);--apollo-progress-default-color:#1677ff;--apollo-progress-remaining-color:rgba(0,0,0,0.06);--apollo-progress-line-border-radius:100px;--apollo-progress-circle-text-font-size:1em;--apollo-progress-circle-icon-font-size:1.1666666666666667em;`;

/** antd 产物机械转换段（原序）。 */
const RULES = `
.apollo-progress{font-family:var(--apollo-font-family);font-size:var(--apollo-font-size);box-sizing:border-box;}
.apollo-progress::before,.apollo-progress::after{box-sizing:border-box;}
.apollo-progress [class^="apollo-progress"],.apollo-progress [class*=" apollo-progress"]{box-sizing:border-box;}
.apollo-progress [class^="apollo-progress"]::before,.apollo-progress [class*=" apollo-progress"]::before,.apollo-progress [class^="apollo-progress"]::after,.apollo-progress [class*=" apollo-progress"]::after{box-sizing:border-box;}
.apollo-progress{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);display:inline-flex;}
.apollo-progress-rtl{direction:rtl;}
.apollo-progress .apollo-progress-indicator{color:var(--apollo-color-text);line-height:1;white-space:nowrap;vertical-align:middle;word-break:normal;}
.apollo-progress .apollo-progress-indicator .apollo-icon{font-size:var(--apollo-font-size);}
.apollo-progress.apollo-progress-status-exception .apollo-progress-indicator{color:var(--apollo-color-error);}
.apollo-progress.apollo-progress-status-success .apollo-progress-indicator{color:var(--apollo-color-success);}
.apollo-progress-line{position:relative;width:100%;font-size:var(--apollo-font-size);}
.apollo-progress-line .apollo-progress-body{display:inline-flex;align-items:center;width:100%;gap:var(--apollo-margin-xs);}
.apollo-progress-line .apollo-progress-rail{flex:auto;background:var(--apollo-progress-remaining-color);border-radius:var(--apollo-progress-line-border-radius);position:relative;width:100%;overflow:hidden;}
.apollo-progress-line.apollo-progress-status-active .apollo-progress-track:after{content:"";position:absolute;inset:0;background-color:var(--apollo-color-bg-container);border-radius:inherit;opacity:0;animation-name:apolloProgressLTRActive;animation-duration:2.4s;animation-timing-function:var(--apollo-motion-ease-out-quint);animation-iteration-count:infinite;}
.apollo-progress-line .apollo-progress-track{position:absolute;inset-inline-start:0;inset-block:0;border-radius:inherit;background:var(--apollo-progress-default-color);transition:all var(--apollo-motion-duration-slow) var(--apollo-motion-ease-in-out-circ);min-width:max-content;display:flex;align-items:center;}
.apollo-progress-line .apollo-progress-track-success{background:var(--apollo-color-success);}
.apollo-progress-line.apollo-progress-status-exception .apollo-progress-track{background:var(--apollo-color-error);}
.apollo-progress-line.apollo-progress-status-success .apollo-progress-track{background:var(--apollo-color-success);}
.apollo-progress-line .apollo-progress-indicator-outer.apollo-progress-indicator-start{order:-1;}
.apollo-progress-line .apollo-progress-body-layout-bottom{flex-direction:column;align-items:center;gap:var(--apollo-margin-xxs);}
.apollo-progress-line .apollo-progress-indicator.apollo-progress-indicator-inner{color:var(--apollo-color-white);padding-inline:var(--apollo-padding-xxs);width:100%;display:flex;justify-content:center;}
.apollo-progress-line .apollo-progress-indicator.apollo-progress-indicator-inner.apollo-progress-indicator-end{justify-content:end;}
.apollo-progress-line .apollo-progress-indicator.apollo-progress-indicator-inner.apollo-progress-indicator-start{justify-content:start;}
.apollo-progress-line .apollo-progress-indicator.apollo-progress-indicator-inner.apollo-progress-indicator-bright{color:var(--apollo-color-text-description);}
.apollo-progress-circle .apollo-progress-circle-rail{stroke:var(--apollo-progress-remaining-color);}
.apollo-progress-circle .apollo-progress-body:not(.apollo-progress-circle-gradient) .apollo-progress-circle-path{stroke:var(--apollo-progress-default-color);}
.apollo-progress-circle .apollo-progress-body{position:relative;line-height:1;background-color:transparent;}
.apollo-progress-circle .apollo-progress-indicator{position:absolute;inset-block-start:50%;inset-inline-start:0;width:100%;margin:0;padding:0;color:var(--apollo-progress-circle-text-color);font-size:var(--apollo-progress-circle-text-font-size);line-height:1;white-space:normal;text-align:center;transform:translateY(-50%);}
.apollo-progress-circle .apollo-progress-indicator .apollo-icon{font-size:var(--apollo-progress-circle-icon-font-size);}
.apollo-progress-circle.apollo-progress-status-exception .apollo-progress-body:not(.apollo-progress-circle-gradient) .apollo-progress-circle-path{stroke:var(--apollo-color-error);}
.apollo-progress-circle.apollo-progress-status-success .apollo-progress-body:not(.apollo-progress-circle-gradient) .apollo-progress-circle-path{stroke:var(--apollo-color-success);}
.apollo-progress-inline-circle{line-height:1;}
.apollo-progress-inline-circle .apollo-progress-inner{vertical-align:bottom;}
.apollo-progress .apollo-progress-steps{display:inline-block;}
.apollo-progress .apollo-progress-steps-body{display:flex;flex-direction:row;align-items:center;gap:calc(var(--apollo-margin-xxs) / 2);}
.apollo-progress .apollo-progress-steps-body .apollo-progress-indicator{margin-inline-start:var(--apollo-margin-xs);}
.apollo-progress .apollo-progress-steps-item{flex-shrink:0;min-width:calc(var(--apollo-margin-xxs) / 2);background-color:var(--apollo-progress-remaining-color);transition:all var(--apollo-motion-duration-slow);}
.apollo-progress .apollo-progress-steps-item-active{background-color:var(--apollo-progress-default-color);}
.apollo-progress-small.apollo-progress-line,.apollo-progress-small.apollo-progress-line .apollo-progress-indicator .apollo-icon{font-size:var(--apollo-font-size-sm);}
@keyframes apolloProgressLTRActive{0%{transform:translateX(-100%) scaleX(0);opacity:0.1;}20%{transform:translateX(-100%) scaleX(0);opacity:0.5;}to{transform:translateX(0) scaleX(1);opacity:0;}}
`;

/** 生成完整样式（DECLS 落根形态，D69；steps 同判）。 */
export function genProgressStyle(prefixCls: string = 'apollo'): string {
  const rename = (cssText: string): string =>
    prefixCls === 'apollo'
      ? cssText
      : cssText.split('.apollo-progress').join(`.${prefixCls}-progress`);
  const decls =
    prefixCls === 'apollo' ? `.apollo-progress{${DECLS}}` : `.${prefixCls}-progress{${DECLS}}`;
  return `${decls}
${rename(RULES)}`;
}
