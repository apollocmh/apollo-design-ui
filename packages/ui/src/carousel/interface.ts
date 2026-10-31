/** Native Carousel props, scoped content, owned notifications and real reference. */

import type { CSSProperties, VNodeChild } from 'vue';
import type { CarouselEngineState } from './engine';

/** 轮播切换动画：横向滚动 / 淡入淡出。 */
export type CarouselEffect = 'scrollx' | 'fade';

/**
 * 圆点位置。antd 6 新增 `dotPlacement`（top/bottom/start/end）；
 * deprecated 的 `dotPosition` 还允许 left/right（映射 start/end）。
 */
export type DotPlacement = 'top' | 'bottom' | 'start' | 'end';

/** autoplay 的对象形态（启用圆点进度动画）。 */
export interface CarouselAutoplay {
  /** 当前圆点上播放进度动画（宽度 0 → dotActiveWidth）。 */
  dotDuration?: boolean;
}

/** dots 的对象形态（antd：只支持 className 定制）。 */
export interface CarouselDots {
  /** 追加到 `slick-dots slick-dots-{placement}` 后的自定义类。 */
  className?: string;
}

/** `beforeChange(currentSlide, nextSlide)`。 */
export type CarouselBeforeChangeEventHandler = (currentSlide: number, nextSlide: number) => void;

/** `afterChange(currentSlide)`。 */
export type CarouselAfterChangeEventHandler = (currentSlide: number) => void;

/** 滑动方向（slick 的 SwipeDirection 子集）。 */
export type CarouselSwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface CarouselProps {
  /** 动画效果，默认 `'scrollx'`。fade 时 slick 侧 `fade: true`（slidesToShow/ToScroll 强制 1）。 */
  effect?: CarouselEffect;
  /** 圆点，默认 `true`；对象形态只定制 className。 */
  dots?: boolean | CarouselDots;
  /** 圆点位置，默认 `'bottom'`。 */
  dotPlacement?: DotPlacement;
  /** @deprecated 请用 `dotPlacement`。 */
  dotPosition?: DotPlacement | 'left' | 'right';
  /** 自动播放；对象形态可开圆点进度动画。默认 `false`。 */
  autoplay?: boolean | CarouselAutoplay;
  /** 自动播放间隔（ms），默认 `3000`。 */
  autoplaySpeed?: number;
  /** 切换动画时长（ms），默认 `500`。 */
  speed?: number;
  /** 切换动画的 CSS 缓动（transition 用），默认 `'ease'`。 */
  cssEase?: string;
  /** 是否无限循环（渲染 clone），默认 `true`。 */
  infinite?: boolean;
  /** 初始定位到第几张（0 起），默认 `0`。 */
  initialSlide?: number;
  /** 一屏显示几张，默认 `1`。⚠️ fade 下强制 1（slick 行为）。 */
  slidesToShow?: number;
  /** 一次滚动几张，默认 `1`。⚠️ fade 下强制 1（slick 行为）。 */
  slidesToScroll?: number;
  /** 是否可拖拽（鼠标），默认 `true`。 */
  draggable?: boolean;
  /** 是否可滑动（触摸），默认 `true`。 */
  swipe?: boolean;
  /** 是否响应触摸/鼠标移动，默认 `true`。 */
  touchMove?: boolean;
  /** 触发翻页的最小滑动距离系数（listWidth / touchThreshold），默认 `5`。 */
  touchThreshold?: number;
  /** 纵向布局（`dotPlacement` 为 start/end 时自动为 true）。 */
  vertical?: boolean;
  /** 动画中是否拦截新的切换，antd 默认 `false`（⚠️ 不是 slick 的 true）。 */
  waitForAnimate?: boolean;
  /** 悬停时暂停自动播放，默认 `true`。 */
  pauseOnHover?: boolean;
  /** 圆点悬停时暂停自动播放，默认 `false`。 */
  pauseOnDotsHover?: boolean;
  /** 聚焦时暂停自动播放，默认 `false`。 */
  pauseOnFocus?: boolean;
  /** 是否显示左右箭头，antd 默认 `false`（⚠️ 不是 slick 的 true）。 */
  arrows?: boolean;
  /** 键盘可切换（Left/Right，vertical 时同映射），默认 `true`。 */
  accessibility?: boolean;
  /** 自适应高度（list 高度跟随当前 slide），默认 `false`。 */
  adaptiveHeight?: boolean;
  /** RTL。默认跟随 ConfigProvider 的 `direction === 'rtl'`（且不与 vertical 同用）。 */
  rtl?: boolean;
  /** 前缀类（默认经 ConfigProvider，`apollo-carousel`）。 */
  prefixCls?: string;
  /**
   * 语义化类名。**本仓自有 API**（上游 antd 的 Carousel 没有 `classNames`）——
   * 因为它的 `className` 落在内层 `slick-slider` 上，而 Vue 里根节点已经用原生 `class`，
   * 内层需要一个**与根不冲突**的入口。
   */
  classNames?: CarouselSemanticClassNames;
  /** 语义化内联样式，与 `classNames` 同槽位。 */
  styles?: CarouselSemanticStyles;
  /**
   * ⚠️ 落在**内层 `slick-slider`**（不是根 div）—— 上游 Carousel 的两层结构如此。
   *    根节点的类名请用 Vue 原生 `class`。
   *
   * @deprecated 用 `classNames.slider`（**同一个落点**）。保留是为了让从 antd 迁过来的
   *   代码能直接跑；新代码请用槽位。
   */
  className?: string;
  id?: string;
  useCSS?: boolean;
  useTransform?: boolean;
  edgeFriction?: number;
  onBeforeChange?: CarouselEmits['beforeChange'];
  onAfterChange?: CarouselEmits['afterChange'];
  onSwipe?: CarouselEmits['swipe'];
  onEdge?: CarouselEmits['edge'];
  onKeydown?: CarouselEmits['keydown'];
}

/** 语义化类名槽位。 */
export interface CarouselSemanticClassNames {
  /** 内层 `slick-slider`（= 上游 `className` 的落点）。 */
  slider?: string;
}

/** 语义化内联样式槽位。 */
export interface CarouselSemanticStyles {
  /** 内层 `slick-slider`（= 上游 `style` 的落点）。 */
  slider?: CSSProperties;
}

/** ref 形状（`innerSlider` 是 PLATFORM 差异 —— 引擎状态对象，非 slick 实例）。 */
export interface CarouselRef {
  nativeElement: HTMLDivElement | null;
  goTo: (slide: number, dontAnimate?: boolean) => void;
  next: () => void;
  prev: () => void;
  /** playType 语义与 slick 一致：'update' | 'leave' | 'blur'（后者是「恢复播放」）。 */
  autoPlay: (playType?: 'update' | 'leave' | 'blur') => void;
  /** 引擎状态（slick state 的同名字段子集；调试/联动用，非 slick 实例）。 */
  innerSlider: Readonly<CarouselEngineState>;
}

/** children 内容（默认插槽）。 */
export type CarouselChildren = VNodeChild;

export type CarouselEmits = {
  beforeChange: CarouselBeforeChangeEventHandler;
  afterChange: CarouselAfterChangeEventHandler;
  swipe: (direction: CarouselSwipeDirection) => void;
  edge: (direction: CarouselSwipeDirection) => void;
  keydown: (event: KeyboardEvent) => void;
};
export interface CarouselArrowScope {
  currentSlide: number;
  slideCount: number;
}
export type CarouselSlots = {
  default?: () => VNodeChild;
  'prev-arrow'?: (scope: CarouselArrowScope) => VNodeChild;
  'next-arrow'?: (scope: CarouselArrowScope) => VNodeChild;
};
