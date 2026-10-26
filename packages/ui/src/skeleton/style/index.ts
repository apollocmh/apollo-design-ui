/** Static Skeleton CSS: current component variables and Alias fallbacks preserve the original geometry. */

import { token2CSSVar } from '@apollo-design/theme';
import {
  BUTTON_WIDTH_MULTIPLIER,
  CAPSULE_RADIUS_DECL,
  CIRCLE_RADIUS_DECL,
  IMAGE_PATH_FILL_DECL,
  IMAGE_SIZE_BASE_MULTIPLIER,
  INPUT_WIDTH_MULTIPLIER,
  LOADING_BACKGROUND_SIZE,
  LOADING_GRADIENT_STOPS,
  LOADING_KEYFRAME_FROM,
  LOADING_KEYFRAME_TO,
  LOADING_MOTION_DURATION,
} from './token';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * 生成 Skeleton 的静态 CSS。
 *
 * @param prefixCls 类名前缀（`apollo` 或 `ant`）
 */
export function genSkeletonStyle(prefixCls: string): string {
  // ⚠️ 带 `-skeleton` 后缀：`getPrefixCls('skeleton')` 在**不传** customizePrefixCls 时
  // 返回 `${defaultPrefixCls}-skeleton`（即 `apollo-skeleton`）。传了 customizePrefixCls
  // 时它**直接返回**该值（不加后缀）—— 那种情况的 CSS 请用 `genComponentCss('skeleton', 自定义值)`。
  const cls = `.${prefixCls}-skeleton`;
  const element = `${cls}-element`;
  const header = `${cls}-header`;
  const section = `${cls}-section`;
  const avatar = `${cls}-avatar`;
  const title = `${cls}-title`;
  const paragraph = `${cls}-paragraph`;
  const button = `${cls}-button`;
  const input = `${cls}-input`;
  const node = `${cls}-node`;
  const image = `${cls}-image`;
  const imageSvg = `${image}-svg`;
  const imagePath = `${image}-path`;
  const loadingName = `${prefixCls}-skeleton-loading`;

  // 组件级 token 的取值来源（见 style/token.ts）：
  //   - 别名派生的走 var(--apollo-*)，随主题自适应
  //   - 字面量走常量（唯一真源在 token.ts，与 antd 的 mergeToken 逐字相同）
  const CONTROL = v('controlHeight');
  const CONTROL_LG = v('controlHeightLG');
  const CONTROL_SM = v('controlHeightSM');
  const CONTROL_XS = v('controlHeightXS');
  const tv = (name: string) => `var(--${prefixCls}-skeleton-${name})`;
  const GRADIENT_FROM = tv('gradient-from-color');
  const GRADIENT_TO = tv('gradient-to-color');
  const PADDING = v('padding');
  const MARGIN_SM = v('marginSM');

  /** `titleHeight` = `controlHeight / 2`（antd 的 `prepareComponentToken`）。 */
  const TITLE_HEIGHT = tv('title-height');
  /** `paragraphLiHeight` 与 `titleHeight` 同式。 */
  const PARAGRAPH_LI_HEIGHT = tv('paragraph-li-height');
  /** `paragraphMarginTop` = `marginLG + marginXXS`。 */
  const PARAGRAPH_MARGIN_TOP = tv('paragraph-margin-top');
  /** `imageSizeBase` = `controlHeight * 1.5`。 */
  const IMAGE_BASE = `calc(${CONTROL} * ${IMAGE_SIZE_BASE_MULTIPLIER})`;

  /** `width` + `height` + `line-height` 三件套（antd 的 `genSkeletonElementCommonSize`）。 */
  const box = (size: string): string =>
    `  width:${size};\n  height:${size};\n  line-height:${size};`;
  /** `width` + `min-width` + 三件套（antd 的 `genSkeletonElementButtonSize` / `InputSize`）。 */
  const blockBox = (size: string, times: number): string =>
    [
      `  width:calc(${size} * ${times});`,
      `  min-width:calc(${size} * ${times});`,
      `  height:${size};`,
      `  line-height:${size};`,
    ].join('\n');

  /** `genSkeletonElementShape`：node 与 image 共用的方形内联盒。 */
  const shapeBox = [
    `  display:inline-flex;`,
    `  align-items:center;`,
    `  justify-content:center;`,
    `  vertical-align:middle;`,
    `  background:${GRADIENT_FROM};`,
    `  border-radius:var(--${prefixCls}-skeleton-block-radius);`,
    `  width:calc(${IMAGE_BASE} * 2);`,
    `  height:calc(${IMAGE_BASE} * 2);`,
    `  line-height:${v('lineHeight')};`,
  ];

  const animated = `${cls}${cls}-active ${title},${cls}${cls}-active ${paragraph}>li,${cls}${cls}-active ${avatar},${cls}${cls}-active ${button},${cls}${cls}-active ${input},${cls}${cls}-active ${node},${cls}${cls}-active ${image}`;

  return [
    // ---- 关键帧（antd 的 `skeletonClsLoading` Keyframes）------------------------
    `@keyframes ${loadingName}{`,
    `  0%{background-position:${LOADING_KEYFRAME_FROM};}`,
    `  100%{background-position:${LOADING_KEYFRAME_TO};}`,
    `}`,
    '',

    // ---- genCommonStyle 的根元素部分 ------------------------------------------
    // antd 的 `genStyleHooks('Skeleton', …)` 用默认 `resetStyle`，产出的是
    // `genCommonStyle` 而非 `resetComponent` —— 所以只有这三行（没有 margin / padding /
    // color / line-height / list-style）。逐字保留。
    `${cls}{`,
    `  --${prefixCls}-skeleton-color:${v('colorFillContent')};`,
    `  --${prefixCls}-skeleton-color-gradient-end:${v('colorFill')};`,
    `  --${prefixCls}-skeleton-gradient-from-color:${tv('color')};`,
    `  --${prefixCls}-skeleton-gradient-to-color:${tv('color-gradient-end')};`,
    `  --${prefixCls}-skeleton-title-height:calc(${CONTROL} / 2);`,
    `  --${prefixCls}-skeleton-block-radius:${v('borderRadiusSM')};`,
    `  --${prefixCls}-skeleton-paragraph-margin-top:calc(${v('marginLG')} + ${v('marginXXS')});`,
    `  --${prefixCls}-skeleton-paragraph-li-height:calc(${CONTROL} / 2);`,
    `  font-family:${v('fontFamily')};`,
    `  font-size:${v('fontSize')};`,
    `  box-sizing:border-box;`,
    `}`,
    '',

    `${cls}-rtl{direction:rtl;}`,
    '',

    // ---- genBaseStyle · 根 -----------------------------------------------------
    `${cls}{`,
    `  display:table;`,
    `  width:100%;`,
    `}`,
    '',

    // ---- Header（头像列）------------------------------------------------------
    `${cls} ${header}{`,
    `  display:table-cell;`,
    `  padding-inline-end:${PADDING};`,
    `  vertical-align:top;`,
    `}`,
    // ⚠️ 这一组是 `.ant-skeleton .ant-skeleton-header .ant-skeleton-avatar`（后代），
    //    与下面 `-element` 里的 `.ant-skeleton.ant-skeleton-element .ant-skeleton-avatar`
    //    是**两套**独立规则 —— antd 两处都产出，不能合并。
    `${cls} ${header} ${avatar}{`,
    `  display:inline-block;`,
    `  vertical-align:top;`,
    `  background:${GRADIENT_FROM};`,
    box(CONTROL),
    `}`,
    `${cls} ${header} ${avatar}-circle{`,
    `  ${CIRCLE_RADIUS_DECL};`,
    `}`,
    `${cls} ${header} ${avatar}-lg{`,
    box(CONTROL_LG),
    `}`,
    `${cls} ${header} ${avatar}-sm{`,
    box(CONTROL_SM),
    `}`,
    '',

    // ---- Section（标题 + 段落列）----------------------------------------------
    `${cls} ${section}{`,
    `  display:table-cell;`,
    `  width:100%;`,
    `  vertical-align:top;`,
    `}`,
    `${cls} ${section} ${title}{`,
    `  width:100%;`,
    `  height:${TITLE_HEIGHT};`,
    `  background:${GRADIENT_FROM};`,
    `  border-radius:var(--${prefixCls}-skeleton-block-radius);`,
    `}`,
    `${cls} ${section} ${title} +${paragraph}{`,
    `  margin-block-start:${CONTROL_SM};`,
    `}`,
    `${cls} ${section} ${paragraph}{`,
    `  padding:0;`,
    `}`,
    `${cls} ${section} ${paragraph}>li{`,
    `  width:100%;`,
    `  height:${PARAGRAPH_LI_HEIGHT};`,
    `  list-style:none;`,
    `  background:${GRADIENT_FROM};`,
    `  border-radius:var(--${prefixCls}-skeleton-block-radius);`,
    `}`,
    `${cls} ${section} ${paragraph}>li +li{`,
    `  margin-block-start:${CONTROL_XS};`,
    `}`,
    // 「最后一行且不是前两行」才收窄到 61% —— 判据逐字来自 antd。
    `${cls} ${section} ${paragraph}>li:last-child:not(:first-child):not(:nth-child(2)){`,
    `  width:61%;`,
    `}`,
    '',

    // ---- round：胶囊圆角 ------------------------------------------------------
    // `&${componentCls}-section` 是**后代**（`.apollo-skeleton-round .apollo-skeleton-section`）。
    `${cls}-round ${section} ${title},${cls}-round ${section} ${paragraph}>li{`,
    `  ${CAPSULE_RADIUS_DECL};`,
    `}`,
    '',

    // ---- with-avatar：标题的上间距 --------------------------------------------
    `${cls}-with-avatar ${section} ${title}{`,
    `  margin-block-start:${MARGIN_SM};`,
    `}`,
    `${cls}-with-avatar ${section} ${title} +${paragraph}{`,
    `  margin-block-start:${PARAGRAPH_MARGIN_TOP};`,
    `}`,
    '',

    // ---- Element 容器 ---------------------------------------------------------
    `${cls}${element}{`,
    `  display:inline-block;`,
    `  width:auto;`,
    `}`,
    '',

    // ---- genSkeletonElementButton --------------------------------------------
    `${cls}${element} ${button}{`,
    `  display:inline-block;`,
    `  vertical-align:top;`,
    `  background:${GRADIENT_FROM};`,
    `  border-radius:var(--${prefixCls}-skeleton-block-radius);`,
    blockBox(CONTROL, BUTTON_WIDTH_MULTIPLIER),
    `}`,
    `${cls}${element} ${button}${button}-circle{`,
    `  width:${CONTROL};`,
    `  min-width:${CONTROL};`,
    `  ${CIRCLE_RADIUS_DECL};`,
    `}`,
    `${cls}${element} ${button}${button}-round{`,
    `  border-radius:${v('controlHeight')};`,
    `}`,
    `${cls}${element} ${button}-lg{`,
    blockBox(CONTROL_LG, BUTTON_WIDTH_MULTIPLIER),
    `}`,
    `${cls}${element} ${button}-lg${button}-circle{`,
    `  width:${CONTROL_LG};`,
    `  min-width:${CONTROL_LG};`,
    `  ${CIRCLE_RADIUS_DECL};`,
    `}`,
    `${cls}${element} ${button}-lg${button}-round{`,
    `  border-radius:${v('controlHeightLG')};`,
    `}`,
    `${cls}${element} ${button}-sm{`,
    blockBox(CONTROL_SM, BUTTON_WIDTH_MULTIPLIER),
    `}`,
    `${cls}${element} ${button}-sm${button}-circle{`,
    `  width:${CONTROL_SM};`,
    `  min-width:${CONTROL_SM};`,
    `  ${CIRCLE_RADIUS_DECL};`,
    `}`,
    `${cls}${element} ${button}-sm${button}-round{`,
    `  border-radius:${v('controlHeightSM')};`,
    `}`,
    '',

    // ---- genSkeletonElementAvatar --------------------------------------------
    `${cls}${element} ${avatar}{`,
    `  display:inline-block;`,
    `  vertical-align:top;`,
    `  background:${GRADIENT_FROM};`,
    box(CONTROL),
    `}`,
    `${cls}${element} ${avatar}${avatar}-circle{`,
    `  ${CIRCLE_RADIUS_DECL};`,
    `}`,
    `${cls}${element} ${avatar}${avatar}-lg{`,
    box(CONTROL_LG),
    `}`,
    `${cls}${element} ${avatar}${avatar}-sm{`,
    box(CONTROL_SM),
    `}`,
    '',

    // ---- genSkeletonElementInput ---------------------------------------------
    `${cls}${element} ${input}{`,
    `  display:inline-block;`,
    `  vertical-align:top;`,
    `  background:${GRADIENT_FROM};`,
    `  border-radius:var(--${prefixCls}-skeleton-block-radius);`,
    blockBox(CONTROL, INPUT_WIDTH_MULTIPLIER),
    `}`,
    `${cls}${element} ${input}-lg{`,
    blockBox(CONTROL_LG, INPUT_WIDTH_MULTIPLIER),
    `}`,
    `${cls}${element} ${input}-sm{`,
    blockBox(CONTROL_SM, INPUT_WIDTH_MULTIPLIER),
    `}`,
    '',

    // ---- genSkeletonElementNode ----------------------------------------------
    `${cls}${element} ${node}{`,
    ...shapeBox,
    `}`,
    '',

    // ---- genSkeletonElementImage ---------------------------------------------
    `${cls}${element} ${image}{`,
    ...shapeBox,
    `}`,
    `${cls}${element} ${image} ${imagePath}{`,
    `  ${IMAGE_PATH_FILL_DECL};`,
    `}`,
    `${cls}${element} ${image} ${imageSvg}{`,
    `  width:${IMAGE_BASE};`,
    `  height:${IMAGE_BASE};`,
    `  line-height:${IMAGE_BASE};`,
    `  max-width:calc(${IMAGE_BASE} * 4);`,
    `  max-height:calc(${IMAGE_BASE} * 4);`,
    `}`,
    `${cls}${element} ${image} ${imageSvg}${imageSvg}-circle{`,
    `  ${CIRCLE_RADIUS_DECL};`,
    `}`,
    `${cls}${element} ${image}${image}-circle{`,
    `  ${CIRCLE_RADIUS_DECL};`,
    `}`,
    '',

    // ---- Block（撑满一行）-----------------------------------------------------
    `${cls}${cls}-block{`,
    `  width:100%;`,
    `}`,
    `${cls}${cls}-block ${button}{`,
    `  width:100%;`,
    `}`,
    `${cls}${cls}-block ${input}{`,
    `  width:100%;`,
    `}`,
    '',

    // ---- Active（微光动画）----------------------------------------------------
    `${animated}{`,
    `  background:linear-gradient(90deg, ${GRADIENT_FROM} ${LOADING_GRADIENT_STOPS.from}, ${GRADIENT_TO} ${LOADING_GRADIENT_STOPS.to}, ${GRADIENT_FROM} ${LOADING_GRADIENT_STOPS.back});`,
    `  background-size:${LOADING_BACKGROUND_SIZE};`,
    `  animation-name:${loadingName};`,
    `  animation-duration:${LOADING_MOTION_DURATION};`,
    `  animation-timing-function:ease;`,
    `  animation-iteration-count:infinite;`,
    `  animation-play-state:var(--${prefixCls}-skeleton-animation-play-state,running);`,
    `}`,
    '',
    `@media (prefers-reduced-motion:reduce){`,
    `  ${animated}{animation:none;}`,
    `}`,
  ].join('\n');
}
