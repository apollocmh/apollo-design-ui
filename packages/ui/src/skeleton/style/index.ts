/**
 * Skeleton 的样式生成。
 *
 * 契约来源：antd 6.6.4 的 `es/skeleton/style/index.js`。选择器结构、属性、取值来源
 * **逐条对齐**。
 *
 * ── 选择器结构是从 antd 的**真实产物**提取的，不是推演的 ─────────────────────────
 *
 * 用 `@ant-design/cssinjs` 的 `extractStyle` 渲染 antd 6.6.4 的 Skeleton（含
 * `Skeleton.Button` / `Avatar` / `Input` / `Node` / `Image` 五个子组件）并提取 CSS，
 * 得到的就是下面这份（去掉 cssinjs 的 hash 包裹层后）。几个**只有看产物才能确定**
 * 的点：
 *
 * ```css
 * .ant-skeleton.ant-skeleton-element .ant-skeleton-button.ant-skeleton-button-circle{...}
 * .ant-skeleton.ant-skeleton-element .ant-skeleton-image .ant-skeleton-image-svg.ant-skeleton-image-svg-circle{...}
 * .ant-skeleton.ant-skeleton-element .ant-skeleton-node{width:calc(calc(var(--ant-control-height) * 1.5) * 2);...}
 * .ant-skeleton-round .ant-skeleton-section .ant-skeleton-title,...{border-radius:100px;}
 * ```
 *
 * ⚠️ 前两条**看着像上游的字符串拼接 bug**（源码里写作
 *    `` `${buttonCls}${skeletonButtonCls}-circle` ``），实测**不是**：
 *    `componentCls` 在 cssinjs 里带前导点（`.ant-skeleton`），所以
 *    `skeletonButtonCls = '.ant-skeleton-button'`，拼出来正好是
 *    `.ant-skeleton-button.ant-skeleton-button-circle` —— 一个**复合选择器**。
 *    照着「修掉这个 bug」会得到一个永远不生效的规则，且视觉上表现为
 *    「圆形的按钮骨架屏是方的」。这条是本次分析里最容易误判的一处。
 *
 * ⚠️ 第三条的**嵌套 `calc`** 也是上游原样：`imageSizeBase` 本身是
 *    `calc(controlHeight * 1.5)`，再被 `* 2` / `* 4` 包一层。视觉上与
 *    `calc(controlHeight * 3)` 等价，但逐字保留才能让「两边 CSS 是否同构」可比。
 *
 * ── 与 antd 产物的三处**有意**差异 ─────────────────────────────────────────────
 *
 * 1. 没有 CSS-in-JS 的 hash 包裹（差异 D5）。antd 的每条规则都带一个
 *    `.css-dev-only-do-not-override-xxxx` 前置类；我们只有裸选择器。
 * 2. 关键帧名不同：antd 是 `css-<hash>-ant-skeleton-loading`（`Keyframes` 名固定为
 *    `ant-skeleton-loading`，再由 cssinjs 加 hash）。我们零运行时没有 hash 可加，
 *    直接用 `${prefixCls}-skeleton-loading`。**有意**让它带前缀：静态 CSS 同时为
 *    `apollo` 与 `ant` 两个前缀生成一份，固定名会让两份产物声明同名关键帧。
 * 3. `genCommonStyle` 的 `::before` / `::after` 与两条 `[class^="…"]` 的
 *    `box-sizing` 规则**不产出** —— `packages/ui/src/style/index.ts` 的 `BASE_CSS`
 *    已经用 `*{box-sizing:border-box}` 覆盖，重复产出只是体积
 *    （与 spin 同一条理由，见 `spin/style/index.ts` 的文件头注释）。
 *    保留的是 `genCommonStyle` 在根元素上的三行（font-family / font-size / box-sizing）。
 *
 * ── 取值来源 ──────────────────────────────────────────────────────────────────
 *
 * 别名 token 一律走 `var(--apollo-*)`（随主题自适应、且被 B7 校验变量存在）；
 * 组件级的**字面量**（圆角 `50%` / `100px`、占位图填充色、动画时长）由
 * `style/token.ts` 给出唯一真源 —— 见那个文件的说明。
 *
 * ── 这个函数没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**视觉**正确（L6 的逐像素比对负责）。
 *   - 没证明变量名存在。`var(--apollo-*)` 写错不会报错、只会静默失效 ——
 *     由 `tests/build/run.mjs` 的 B7 校验。
 *   - 没证明**层叠结果**与 antd 一致：这里只保证「选择器 + 声明」同构。
 *     `-block` 与 `-active` 这类靠特异性取胜的规则，其最终效果由 L6 裁决。
 */

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
  const GRADIENT_FROM = v('colorFillContent');
  const GRADIENT_TO = v('colorFill');
  const PADDING = v('padding');
  const MARGIN_SM = v('marginSM');

  /** `titleHeight` = `controlHeight / 2`（antd 的 `prepareComponentToken`）。 */
  const TITLE_HEIGHT = `calc(${CONTROL} / 2)`;
  /** `paragraphLiHeight` 与 `titleHeight` 同式。 */
  const PARAGRAPH_LI_HEIGHT = TITLE_HEIGHT;
  /** `paragraphMarginTop` = `marginLG + marginXXS`。 */
  const PARAGRAPH_MARGIN_TOP = `calc(${v('marginLG')} + ${v('marginXXS')})`;
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
    `  border-radius:${v('borderRadiusSM')};`,
    `  width:calc(${IMAGE_BASE} * 2);`,
    `  height:calc(${IMAGE_BASE} * 2);`,
    `  line-height:calc(${IMAGE_BASE} * 2);`,
  ];

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
    `  font-family:${v('fontFamily')};`,
    `  font-size:${v('fontSize')};`,
    `  box-sizing:border-box;`,
    `}`,
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
    `  border-radius:${v('borderRadiusSM')};`,
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
    `  border-radius:${v('borderRadiusSM')};`,
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
    `  border-radius:${v('borderRadiusSM')};`,
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
    `  border-radius:${v('borderRadiusSM')};`,
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
    `${cls}${cls}-active ${title},${cls}${cls}-active ${paragraph}>li,${cls}${cls}-active ${avatar},${cls}${cls}-active ${button},${cls}${cls}-active ${input},${cls}${cls}-active ${node},${cls}${cls}-active ${image}{`,
    `  background:linear-gradient(90deg, ${GRADIENT_FROM} ${LOADING_GRADIENT_STOPS.from}, ${GRADIENT_TO} ${LOADING_GRADIENT_STOPS.to}, ${GRADIENT_FROM} ${LOADING_GRADIENT_STOPS.back});`,
    `  background-size:${LOADING_BACKGROUND_SIZE};`,
    `  animation-name:${loadingName};`,
    `  animation-duration:${LOADING_MOTION_DURATION};`,
    `  animation-timing-function:ease;`,
    `  animation-iteration-count:infinite;`,
    `}`,
    '',
  ].join('\n');
}
