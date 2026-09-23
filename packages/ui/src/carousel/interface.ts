/**
 * Carousel 的类型定义（Vue API）。
 *
 * 契约来源：antd 6.6.4 的 `es/carousel/index.d.ts`（CarouselProps extends
 * `Omit<Settings, 'dots' | 'dotsClass' | 'autoplay'>`）+ `@ant-design/react-slick@2.0.0`
 * 的 `Settings` / `defaultProps`（机械判据）。
 *
 * ── 与 antd 的有意差异（详见 docs/analysis/carousel.md §2 / §8）────────────────
 *
 * 1. **Settings 不再整包透传**：antd 的 Props 是 `Omit<Settings, …>`（40+ 个键），
 *    其中 `responsive` / `rows` / `slidesPerRow` / `centerMode` / `variableWidth` /
 *    `lazyLoad` / `asNavFor` / `focusOnSelect` / `swipeToSlide` / `appendDots` /
 *    `customPaging` / `slide` / `unslick` / `onEdge` / `onSwipe` / `onInit` /
 *    `onReInit` / `onLazyLoad` / `swipeEvent` 首版**显式不支持**（用户裁决，
 *    2026-09-23）。antd 侧传了会有 deprecation 告警（`useDevWarning`）。
 * 2. **`beforeChange` / `afterChange` / `onSwipe` / `onEdge` 是 Vue 事件**
 *    （规则 C19）：`emit('before-change', current, next)` 等；Props 里没有它们。
 * 3. **`prevArrow` / `nextArrow` 用插槽**（规则 C19 的 Vue-native 映射）：
 *    `#prev-arrow` / `#next-arrow`；不传时渲染 antd 同款的默认箭头按钮
 *    （`aria-label` 来自 locale，与 antd 逐字一致）。
 * 4. `dotPosition`（deprecated）保留并映射到 `dotPlacement`（与 antd 同：
 *    left→start、right→end），运行时发 deprecated 告警。
 * 5. Ref 形状：`{ nativeElement, goTo, next, prev, autoPlay, innerSlider }`
 *    —— `innerSlider` 是 PLATFORM 差异（React 是 slick 实例；Vue 侧是引擎的
 *    响应式状态对象，字段名与 slick 的 state 对齐，供调试/联动用）。
 */

import type { VNodeChild } from 'vue';

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
  /** 切换动画的缓动（antd 文档暴露、react-slick 2.0 内部未消费 —— 接受但无效果）。 */
  easing?: string;
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
  /** 挂在根元素上的附加类。 */
  rootClassName?: string;
  className?: string;
  style?: Record<string, string | number>;
  id?: string;
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
  innerSlider: Record<string, unknown>;
}

/** children 内容（默认插槽）。 */
export type CarouselChildren = VNodeChild;
