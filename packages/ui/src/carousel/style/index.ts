/**
 * Carousel 的样式生成（genCarouselStyle）。
 *
 * 契约来源：antd 6.6.4 的 `es/carousel/style/index.js`（五段：
 * `genCarouselStyle` / `genArrowsStyle` / `genDotsStyle` / `genCarouselVerticalStyle` /
 * `genCarouselRtlStyle` + `prepareComponentToken`）。**全部样式挂在 slick 的类名上**
 * （`.slick-*` 是 react-slick 的命名空间，不随 prefixCls 变），逐字移植。
 *
 * ── 与 antd 的有意差异 ────────────────────────────────────────────────────────
 *
 * 1. 无 hash / css-var 包裹类（D5）；8 个 Component Token 声明直接落在
 *    `.{prefix}-carousel` 上（D50：构建期解析值，见 `style/token.ts` 文件头）。
 * 2. cssinjs 的 `token.calc(...).equal()` 产物改写为等价的 `calc()` 字符串或
 *    JS 解析值：`arrowLength = 16/√2` 是无理数 ⇒ ::after 几何用 JS 常量
 *    （`CAROUSEL_ARROW_LENGTH_SCALE`），与 switch 的 `trackHeight` 同判。
 * 3. Keyframes：cssinjs 的 `Keyframes('carousel-dot-animation')` 移植为静态
 *    `@keyframes`（width 0 → dotActiveWidth；纵向变体为 height），名字加根前缀
 *    防跨前缀碰撞。antd 的 `var(--dot-duration)` 消费方式逐字保留。
 * 4. `resetComponent` 全套落在 `.{prefix}-carousel` 上（genStyleHooks 自动带）。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import {
  CAROUSEL_ARROW_COLOR_DECL,
  CAROUSEL_ARROW_TIP_RADIUS_DECL,
  type ComponentToken,
  prepareComponentToken,
} from './token';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** Component Token 的 CSS 变量名（组件内消费用）。 */
const sv = (rootPrefixCls: string, name: string): string =>
  `var(--${rootPrefixCls}-carousel-${name})`;

let tokenCache: ComponentToken | null = null;

function carouselTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken());
  }
  return tokenCache;
}

const px = (value: number | string): string => (typeof value === 'number' ? `${value}px` : value);

/** 8 个 Component Token 声明（构建期解析值）。 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  const t = carouselTokenValues();
  return [
    `  --${p}-carousel-arrow-size:${px(t.arrowSize)};`,
    `  --${p}-carousel-arrow-offset:${px(t.arrowOffset)};`,
    `  --${p}-carousel-dot-width:${px(t.dotWidth)};`,
    `  --${p}-carousel-dot-height:${px(t.dotHeight)};`,
    `  --${p}-carousel-dot-gap:${px(t.dotGap)};`,
    `  --${p}-carousel-dot-offset:${px(t.dotOffset)};`,
    `  --${p}-carousel-dot-width-active:${px(t.dotWidthActive)};`,
    `  --${p}-carousel-dot-active-width:${px(t.dotActiveWidth)};`,
  ];
}

/**
 * 根段 —— antd 的 `genCarouselStyle`（slick 骨架 + resetComponent）。
 */
function genCarouselRootStyle(p: string): string[] {
  const cls = `.${p}-carousel`;

  return [
    `${cls}{`,
    ...genTokenDecls(p),
    // 圆点进度动画的时长变量：默认 0ms（等价于 antd 的「未设置 → invalid → 0s」），
    // autoplay.dotDuration 时由组件在根节点内联覆盖（inline style 优先）。
    // ⚠️ 必须在 CSS 里声明：B7 要求所有 var() 引用都有声明来源（grid 先例）。
    `  --dot-duration:0ms;`,
    // resetComponent 全套
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    // genCarouselStyle
    `}`,
    `${cls} .slick-slider{`,
    `  position:relative;`,
    `  display:block;`,
    `  box-sizing:border-box;`,
    `  touch-action:pan-y;`,
    `  -webkit-touch-callout:none;`,
    `  -webkit-tap-highlight-color:transparent;`,
    `}`,
    `${cls} .slick-slider .slick-track,${cls} .slick-slider .slick-list{`,
    `  transform:translate3d(0, 0, 0);`,
    `  touch-action:pan-y;`,
    `}`,
    `${cls} .slick-list{`,
    `  position:relative;`,
    `  display:block;`,
    `  margin:0;`,
    `  padding:0;`,
    `  overflow:hidden;`,
    `}`,
    `${cls} .slick-list:focus{`,
    `  outline:none;`,
    `}`,
    `${cls} .slick-list.dragging{`,
    `  cursor:pointer;`,
    `}`,
    `${cls} .slick-list .slick-slide{`,
    `  pointer-events:none;`,
    `}`,
    `${cls} .slick-list .slick-slide input.${p}-radio-input,${cls} .slick-list .slick-slide input.${p}-checkbox-input{`,
    `  visibility:hidden;`,
    `}`,
    `${cls} .slick-list .slick-slide.slick-active{`,
    `  pointer-events:auto;`,
    `}`,
    `${cls} .slick-list .slick-slide.slick-active input.${p}-radio-input,${cls} .slick-list .slick-slide.slick-active input.${p}-checkbox-input{`,
    `  visibility:visible;`,
    `}`,
    // fix Carousel content height not match parent node when children is empty node
    // https://github.com/ant-design/ant-design/issues/25878
    `${cls} .slick-list .slick-slide>div>div{`,
    `  vertical-align:bottom;`,
    `}`,
    `${cls} .slick-track{`,
    `  position:relative;`,
    `  top:0;`,
    `  inset-inline-start:0;`,
    `  display:block;`,
    `}`,
    `${cls} .slick-track::before,${cls} .slick-track::after{`,
    `  display:table;`,
    `  content:"";`,
    `}`,
    `${cls} .slick-track::after{`,
    `  clear:both;`,
    `}`,
    `${cls} .slick-slide{`,
    `  display:none;`,
    `  float:left;`,
    `  height:100%;`,
    `  min-height:1px;`,
    `}`,
    `${cls} .slick-slide img{`,
    `  display:block;`,
    `}`,
    `${cls} .slick-slide.dragging img{`,
    `  pointer-events:none;`,
    `}`,
    `${cls} .slick-initialized .slick-slide{`,
    `  display:block;`,
    `}`,
    `${cls} .slick-vertical .slick-slide{`,
    `  display:block;`,
    `  height:auto;`,
    `}`,
  ];
}

/** 箭头段 —— antd 的 `genArrowsStyle`（::after 旋转边框箭头；√2 几何用 JS 解析值）。 */
function genArrowsStyle(p: string): string[] {
  const cls = `.${p}-carousel`;
  const t = carouselTokenValues();
  const motionDurationSlow = v('motionDurationSlow');
  const arrowSize = t.arrowSize as number;
  // ⚠️ 用**除法**对齐 antd 的 `.div(Math.SQRT2)`（乘倒数可能差 1 ulp，L6 会见）
  const arrowLength = arrowSize / Math.SQRT2;
  // antd 原式：top = calc(arrowSize).sub(arrowLength).div(2) → (16px - 11.3137px) / 2
  const arrowCenter = px((arrowSize - arrowLength) / 2);
  const arrowOffset = sv(p, 'arrow-offset');

  return [
    // Arrows
    `${cls} .slick-prev,${cls} .slick-next{`,
    `  position:absolute;`,
    `  top:50%;`,
    `  width:${sv(p, 'arrow-size')};`,
    `  height:${sv(p, 'arrow-size')};`,
    `  transform:translateY(-50%);`,
    `  ${CAROUSEL_ARROW_COLOR_DECL};`,
    `  opacity:0.4;`,
    `  background:transparent;`,
    `  padding:0;`,
    `  line-height:0;`,
    `  border:0;`,
    `  outline:none;`,
    `  cursor:pointer;`,
    `  z-index:1;`,
    `  transition:opacity ${motionDurationSlow};`,
    `}`,
    `${cls} .slick-prev:hover,${cls} .slick-prev:focus,${cls} .slick-next:hover,${cls} .slick-next:focus{`,
    `  opacity:1;`,
    `}`,
    `${cls} .slick-prev.slick-disabled,${cls} .slick-next.slick-disabled{`,
    `  pointer-events:none;`,
    `  opacity:0;`,
    `}`,
    `${cls} .slick-prev::after,${cls} .slick-next::after{`,
    `  box-sizing:border-box;`,
    `  position:absolute;`,
    `  top:${arrowCenter};`,
    `  inset-inline-start:${arrowCenter};`,
    `  display:inline-block;`,
    `  width:${px(arrowLength)};`,
    `  height:${px(arrowLength)};`,
    `  border:0 solid currentcolor;`,
    `  border-inline-start-width:2px;`,
    `  border-block-start-width:2px;`,
    `  ${CAROUSEL_ARROW_TIP_RADIUS_DECL};`,
    `  content:"";`,
    `}`,
    `${cls} .slick-prev{`,
    `  inset-inline-start:${arrowOffset};`,
    `}`,
    `${cls} .slick-prev::after{`,
    `  transform:rotate(-45deg);`,
    `}`,
    `${cls} .slick-next{`,
    `  inset-inline-end:${arrowOffset};`,
    `}`,
    `${cls} .slick-next::after{`,
    `  transform:rotate(135deg);`,
    `}`,
  ];
}

/** 圆点段 —— antd 的 `genDotsStyle`（含 dotDuration 进度动画）。 */
function genDotsStyle(p: string): string[] {
  const cls = `.${p}-carousel`;
  const motionDurationSlow = v('motionDurationSlow');
  const dotActiveWidth = sv(p, 'dot-active-width');
  const colorBgContainer = v('colorBgContainer');
  const dotHeight = sv(p, 'dot-height');

  // antd：inset: calc(dotGap * -1)
  const dotGapNegative = `calc(${sv(p, 'dot-gap')} * -1)`;

  return [
    `@keyframes ${p}-carousel-dot-animation{`,
    `  from{`,
    `    width:0;`,
    `  }`,
    `  to{`,
    `    width:${dotActiveWidth};`,
    `  }`,
    `}`,
    `${cls} .slick-dots{`,
    `  position:absolute;`,
    `  inset-inline-end:0;`,
    `  bottom:0;`,
    `  inset-inline-start:0;`,
    `  z-index:15;`,
    `  display:flex !important;`,
    `  justify-content:center;`,
    `  padding-inline-start:0;`,
    `  margin:0;`,
    `  list-style:none;`,
    `}`,
    `${cls} .slick-dots-bottom{`,
    `  bottom:${sv(p, 'dot-offset')};`,
    `}`,
    `${cls} .slick-dots-top{`,
    `  top:${sv(p, 'dot-offset')};`,
    `  bottom:auto;`,
    `}`,
    `${cls} .slick-dots li{`,
    `  position:relative;`,
    `  display:inline-block;`,
    `  flex:0 1 auto;`,
    `  box-sizing:content-box;`,
    `  width:${sv(p, 'dot-width')};`,
    `  height:${dotHeight};`,
    `  margin-inline:${sv(p, 'dot-gap')};`,
    `  padding:0;`,
    `  text-align:center;`,
    `  text-indent:-999px;`,
    `  vertical-align:top;`,
    `  transition:all ${motionDurationSlow};`,
    `  border-radius:var(--${p}-carousel-dot-height);`,
    `  overflow:hidden;`,
    `}`,
    `${cls} .slick-dots li::after{`,
    `  display:block;`,
    `  position:absolute;`,
    `  top:0;`,
    `  inset-inline-start:0;`,
    `  width:0;`,
    `  height:${dotHeight};`,
    `  content:"";`,
    `  background:transparent;`,
    `  border-radius:var(--${p}-carousel-dot-height);`,
    `  opacity:1;`,
    `  outline:none;`,
    `  cursor:pointer;`,
    `  overflow:hidden;`,
    `}`,
    `${cls} .slick-dots li button{`,
    `  position:relative;`,
    `  display:block;`,
    `  width:100%;`,
    `  height:${dotHeight};`,
    `  padding:0;`,
    `  color:transparent;`,
    `  font-size:0;`,
    `  background:${colorBgContainer};`,
    `  border:0;`,
    `  border-radius:var(--${p}-carousel-dot-height);`,
    `  outline:none;`,
    `  cursor:pointer;`,
    `  opacity:0.2;`,
    `  transition:all ${motionDurationSlow};`,
    `  overflow:hidden;`,
    `}`,
    `${cls} .slick-dots li button:hover{`,
    `  opacity:0.75;`,
    `}`,
    `${cls} .slick-dots li button::after{`,
    `  position:absolute;`,
    `  inset:${dotGapNegative};`,
    `  content:"";`,
    `}`,
    `${cls} .slick-dots li.slick-active{`,
    `  width:${dotActiveWidth};`,
    `  position:relative;`,
    `}`,
    `${cls} .slick-dots li.slick-active:hover{`,
    `  opacity:1;`,
    `}`,
    `${cls} .slick-dots li.slick-active::after{`,
    `  background:${colorBgContainer};`,
    `  animation-name:${p}-carousel-dot-animation;`,
    `  animation-duration:var(--dot-duration);`,
    `  animation-timing-function:ease-out;`,
    `  animation-fill-mode:forwards;`,
    `}`,
  ];
}

/** 纵向段 —— antd 的 `genCarouselVerticalStyle`（宽高对调 + 动画变体）。 */
function genCarouselVerticalStyle(p: string): string[] {
  const verticalCls = `.${p}-carousel-vertical`;
  const arrowOffset = sv(p, 'arrow-offset');
  const dotOffset = sv(p, 'dot-offset');
  const dotHeight = sv(p, 'dot-height');
  const dotWidth = sv(p, 'dot-width');
  const dotActiveWidth = sv(p, 'dot-active-width');
  const marginXXS = v('marginXXS');

  // antd 的 reverseSizeOfDot：width=dotHeight / height=dotWidth
  const reverse = `width:${dotHeight};height:${dotWidth};`;

  return [
    `@keyframes ${p}-carousel-dot-vertical-animation{`,
    `  from{`,
    `    height:0;`,
    `  }`,
    `  to{`,
    `    height:${dotActiveWidth};`,
    `  }`,
    `}`,
    `${verticalCls} .slick-prev,${verticalCls} .slick-next{`,
    `  inset-inline-start:50%;`,
    `  margin-block-start:unset;`,
    `  transform:translateX(-50%);`,
    `}`,
    `${verticalCls} .slick-prev{`,
    `  inset-block-start:${arrowOffset};`,
    `  inset-inline-start:50%;`,
    `}`,
    `${verticalCls} .slick-prev::after{`,
    `  transform:rotate(45deg);`,
    `}`,
    `${verticalCls} .slick-next{`,
    `  inset-block-start:auto;`,
    `  inset-block-end:${arrowOffset};`,
    `}`,
    `${verticalCls} .slick-next::after{`,
    `  transform:rotate(-135deg);`,
    `}`,
    `${verticalCls} .slick-dots{`,
    `  top:50%;`,
    `  bottom:auto;`,
    `  flex-direction:column;`,
    `  width:${dotHeight};`,
    `  height:auto;`,
    `  margin:0;`,
    `  transform:translateY(-50%);`,
    `}`,
    `${verticalCls} .slick-dots-start{`,
    `  inset-inline-end:auto;`,
    `  inset-inline-start:${dotOffset};`,
    `}`,
    `${verticalCls} .slick-dots-end{`,
    `  inset-inline-end:${dotOffset};`,
    `  inset-inline-start:auto;`,
    `}`,
    `${verticalCls} .slick-dots li{`,
    `  ${reverse}`,
    `  margin:${marginXXS} 0;`,
    `  vertical-align:baseline;`,
    `}`,
    `${verticalCls} .slick-dots li button{`,
    `  ${reverse}`,
    `}`,
    `${verticalCls} .slick-dots li::after{`,
    `  ${reverse}`,
    `  height:0;`,
    `}`,
    `${verticalCls} .slick-dots li.slick-active{`,
    `  ${reverse}`,
    `  height:${dotActiveWidth};`,
    `}`,
    `${verticalCls} .slick-dots li.slick-active button{`,
    `  ${reverse}`,
    `  height:${dotActiveWidth};`,
    `}`,
    `${verticalCls} .slick-dots li.slick-active::after{`,
    `  ${reverse}`,
    `  animation-name:${p}-carousel-dot-vertical-animation;`,
    `}`,
  ];
}

/** RTL 段 —— antd 的 `genCarouselRtlStyle`。 */
function genCarouselRtlStyle(p: string): string[] {
  const cls = `.${p}-carousel`;
  const verticalCls = `.${p}-carousel-vertical`;
  return [
    `${cls}-rtl{`,
    `  direction:rtl;`,
    `}`,
    // ⚠️ antd 原式：`.ant-carousel-vertical .slick-dots` 内嵌 `&.ant-carousel-rtl`，
    // 展开为 `.ant-carousel-vertical .slick-dots.ant-carousel-rtl`（交集，不是后代）
    `${verticalCls} .slick-dots${cls}-rtl{`,
    `  flex-direction:column;`,
    `}`,
  ];
}

/**
 * 生成 Carousel 的静态 CSS。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）
 */
export function genCarouselStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  return [
    ...genCarouselRootStyle(p),
    ...genArrowsStyle(p),
    ...genDotsStyle(p),
    ...genCarouselVerticalStyle(p),
    ...genCarouselRtlStyle(p),
  ].join('\n');
}
