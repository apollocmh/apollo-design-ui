/**
 * BorderBeam 的 Component Token。
 *
 * 契约来源：antd 6.6.4 的 `es/border-beam/style/index.js`：genStyleHooks 未传
 * prepareComponentToken —— **该组件无 Component Token**。运行时调参走
 * `--{root}-border-beam-*` CSS 变量（duration/line-width/size 等直接由 props
 * 写在 Effect 的 style 上，见 BorderBeam.tsx）。
 */

/** 与 antd 逐字一致：无 Component Token。 */
export type ComponentToken = Record<string, never>;
