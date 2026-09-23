/**
 * Carousel 引擎 —— @ant-design/react-slick@2.0.0 状态机的 Vue 移植（决策 B：自建）。
 *
 * 判据来源（逐行对拍，勿凭记忆改写）：
 *   - `node_modules/.pnpm/@ant-design+react-slick@2.0.0…/es/inner-slider.js`（状态机）
 *   - `…/es/utils/innerSliderUtils.js`（纯函数：定位 / 翻页 / 拖拽 / clone 计数）
 *   - `…/es/track.js`（slide 类名与内联样式）、`…/es/dots.js`、`…/es/arrows.js`
 *   - `…/es/initial-state.js`、`…/es/default-props.js`
 * SSR 首帧的 track 定位走 `ssrTrackStyle()` 的**百分比公式**（inner-slider.js 的
 * `ssrInit`，L236-254 非变量宽分支），客户端挂载后由 `update()` 换成**像素测量值**
 * （`initializedState` + `getTrackCSS`）。两条路径都必须保留，否则 SSR DOM
 * （L4 oracle）与首帧视觉分叉。
 *
 * ── 按用户裁决（2026-09-23）裁剪掉的能力 ─────────────────────────────────────
 *
 * `lazyLoad` / `variableWidth` / `centerMode` / `centerPadding` / `rows` /
 * `slidesPerRow` / `responsive` / `asNavFor` / `focusOnSelect` / `swipeToSlide` /
 * `unslick` 分支 —— 相关代码路径（getOnDemandLazySlides / variableWidth 的
 * ssrInit 分支 / getSlideCount 的 swipeToSlide 分支 / siblingDirection 的 children
 * 消息）不移植。`edgeFriction` 保留（拖拽橡皮筋语义的一部分）。
 */

import { onBeforeUnmount, onMounted, reactive, shallowRef } from 'vue';

// ============================== 纯函数（innerSliderUtils 移植） ==============================

const clamp = (n: number, lower: number, upper: number): number =>
  Math.max(lower, Math.min(n, upper));

interface TouchObject {
  startX: number;
  startY: number;
  curX: number;
  curY: number;
  swipeLength?: number;
}

export interface SlickSpec {
  slideCount: number;
  slidesToShow: number;
  slidesToScroll: number;
  slideWidth: number | string | null;
  slideHeight: number | null;
  listWidth: number | null;
  listHeight: number | null;
  currentSlide: number;
  targetSlide: number;
  infinite: boolean;
  fade: boolean;
  vertical: boolean;
  rtl: boolean;
  speed: number;
  cssEase: string;
  useCSS: boolean;
  useTransform: boolean;
  waitForAnimate: boolean;
  animating: boolean;
  edgeFriction: number;
  touchThreshold: number;
  unslick: boolean;
  swipeLeft: number | null;
  touchObject: TouchObject;
  left?: number | string;
  slideIndex?: number;
  index?: number;
}

/** clone 数（centerMode 裁剪 ⇒ 恒 `slidesToShow`；unslick ⇒ 0）。 */
export const getPreClones = (
  spec: Pick<SlickSpec, 'infinite' | 'slidesToShow' | 'unslick'>,
): number => (spec.infinite && !spec.unslick ? spec.slidesToShow : 0);

export const getPostClones = getPreClones;

/** track 上的 slide 总数（slideCount===1 时 slick 直接返回 1）。 */
export const getTotalSlides = (
  spec: Pick<SlickSpec, 'slideCount' | 'slidesToShow' | 'infinite' | 'unslick'>,
): number =>
  spec.slideCount === 1 ? 1 : getPreClones(spec) + spec.slideCount + getPostClones(spec);

export const canGoNext = (
  spec: Pick<SlickSpec, 'infinite' | 'slideCount' | 'slidesToShow' | 'currentSlide'>,
): boolean => {
  if (spec.infinite) return true;
  return !(
    spec.slideCount <= spec.slidesToShow || spec.currentSlide >= spec.slideCount - spec.slidesToShow
  );
};

/** 数字 → CSS 字符串（React 语义：0 渲染为 "0"，其余数字加 px）。 */
const fmt = (n: number): string => (n === 0 ? '0' : `${n}`);

/** getTrackCSS —— 客户端 track 定位（px + transform），`innerSliderUtils.js` L547-592。 */
export const getTrackCSS = (spec: SlickSpec): Record<string, string> => {
  let trackWidth: number | undefined;
  let trackHeight: number | undefined;
  if (!spec.vertical) {
    trackWidth = getTotalSlides(spec) * (spec.slideWidth as number);
  } else {
    const trackChildren = spec.slideCount + 2 * spec.slidesToShow;
    trackHeight = trackChildren * (spec.slideHeight ?? 0);
  }
  const style: Record<string, string> = { opacity: '1', transition: '' };
  if (spec.useTransform) {
    const t = !spec.vertical
      ? `translate3d(${fmt(spec.left as number)}px, 0px, 0px)`
      : `translate3d(0px, ${fmt(spec.left as number)}px, 0px)`;
    style.transform = t;
    style.webkitTransform = t;
    style.msTransform = !spec.vertical
      ? `translateX(${fmt(spec.left as number)}px)`
      : `translateY(${fmt(spec.left as number)}px)`;
  } else if (spec.vertical) {
    style.top = fmt(spec.left as number);
  } else {
    style.left = fmt(spec.left as number);
  }
  // ⚠️ fade 覆盖：slick 在 fade 下 track 只有 opacity（L577-579）
  if (spec.fade) {
    style.opacity = '1';
    delete style.transform;
    delete style.webkitTransform;
    delete style.msTransform;
    delete style.left;
    delete style.top;
    delete style.transition;
  }
  if (trackWidth) style.width = `${trackWidth}px`;
  if (trackHeight) style.height = `${trackHeight}px`;
  return style;
};

/** getTrackAnimateCSS —— 动画中的 track（带 transition），L593-608。 */
export const getTrackAnimateCSS = (spec: SlickSpec): Record<string, string> => {
  const style = getTrackCSS(spec);
  if (spec.useTransform) {
    style.webkitTransition = `-webkit-transform ${spec.speed}ms ${spec.cssEase}`;
    style.transition = `transform ${spec.speed}ms ${spec.cssEase}`;
  } else if (spec.vertical) {
    style.transition = `top ${spec.speed}ms ${spec.cssEase}`;
  } else {
    style.transition = `left ${spec.speed}ms ${spec.cssEase}`;
  }
  return style;
};

/** getTrackLeft —— 当前 slideIndex 对应的 track 偏移（px），L609-678（centerMode/变量宽分支裁剪）。 */
export const getTrackLeft = (spec: SlickSpec): number => {
  const slideIndex = spec.slideIndex ?? spec.currentSlide;
  if (spec.unslick || spec.fade || spec.slideCount === 1) return 0;
  let slidesToOffset = 0;
  if (spec.infinite) {
    slidesToOffset = -getPreClones(spec);
    if (
      spec.slideCount % spec.slidesToScroll !== 0 &&
      slideIndex + spec.slidesToScroll > spec.slideCount
    ) {
      slidesToOffset = -(slideIndex > spec.slideCount
        ? spec.slidesToShow - (slideIndex - spec.slideCount)
        : spec.slideCount % spec.slidesToScroll);
    }
  } else if (
    spec.slideCount % spec.slidesToScroll !== 0 &&
    slideIndex + spec.slidesToScroll > spec.slideCount
  ) {
    slidesToOffset = spec.slidesToShow - (spec.slideCount % spec.slidesToScroll);
  }
  const slideOffset = slidesToOffset * (spec.slideWidth as number);
  const verticalOffset = slidesToOffset * (spec.slideHeight ?? 0);
  return !spec.vertical
    ? slideIndex * (spec.slideWidth as number) * -1 + slideOffset
    : slideIndex * (spec.slideHeight ?? 0) * -1 + verticalOffset;
};

interface SlideHandlerResult {
  state: {
    animating?: boolean;
    currentSlide?: number;
    trackStyle?: Record<string, string>;
    targetSlide?: number;
  } | null;
  nextState: {
    animating?: boolean;
    currentSlide?: number;
    trackStyle?: Record<string, string>;
    swipeLeft?: null;
    targetSlide?: number;
  } | null;
}

/** slideHandler —— `innerSliderUtils.js` L150-258（lazyLoad 分支裁剪）。 */
export const slideHandler = (spec: SlickSpec): SlideHandlerResult => {
  if (spec.waitForAnimate && spec.animating) return { state: null, nextState: null };
  const index = spec.index ?? 0;
  let animationSlide = index;
  let finalSlide: number;
  let animationLeft: number;
  let finalLeft: number;
  let state: NonNullable<SlideHandlerResult['state']> = {};
  let nextState: SlideHandlerResult['nextState'] = {};
  const targetSlide = spec.infinite ? index : clamp(index, 0, spec.slideCount - 1);
  if (spec.fade) {
    if (!spec.infinite && (index < 0 || index >= spec.slideCount))
      return { state: null, nextState: null };
    if (index < 0) animationSlide = index + spec.slideCount;
    else if (index >= spec.slideCount) animationSlide = index - spec.slideCount;
    state = { animating: true, currentSlide: animationSlide, targetSlide: animationSlide };
    nextState = { animating: false, targetSlide: animationSlide };
  } else {
    finalSlide = animationSlide;
    if (animationSlide < 0) {
      finalSlide = animationSlide + spec.slideCount;
      if (!spec.infinite) finalSlide = 0;
      else if (spec.slideCount % spec.slidesToScroll !== 0)
        finalSlide = spec.slideCount - (spec.slideCount % spec.slidesToScroll);
    } else if (!canGoNext(spec) && animationSlide > spec.currentSlide) {
      animationSlide = finalSlide = spec.currentSlide;
    } else if (animationSlide >= spec.slideCount) {
      finalSlide = animationSlide - spec.slideCount;
      if (!spec.infinite) finalSlide = spec.slideCount - spec.slidesToShow;
      else if (spec.slideCount % spec.slidesToScroll !== 0) finalSlide = 0;
    }
    if (!spec.infinite && animationSlide + spec.slidesToShow >= spec.slideCount) {
      finalSlide = spec.slideCount - spec.slidesToShow;
    }
    animationLeft = getTrackLeft({ ...spec, slideIndex: animationSlide });
    finalLeft = getTrackLeft({ ...spec, slideIndex: finalSlide });
    if (!spec.infinite) {
      if (animationLeft === finalLeft) animationSlide = finalSlide;
      animationLeft = finalLeft;
    }
    if (!spec.useCSS) {
      state = {
        currentSlide: finalSlide,
        trackStyle: getTrackCSS({ ...spec, left: finalLeft }),
        targetSlide,
      };
    } else {
      state = {
        animating: true,
        currentSlide: finalSlide,
        trackStyle: getTrackAnimateCSS({ ...spec, left: animationLeft }),
        targetSlide,
      };
      nextState = {
        animating: false,
        currentSlide: finalSlide,
        trackStyle: getTrackCSS({ ...spec, left: finalLeft }),
        swipeLeft: null,
        targetSlide,
      };
    }
  }
  return { state, nextState };
};

/** changeSlide —— `innerSliderUtils.js` L259-309（children/lazyLoad 分支裁剪）。 */
export const changeSlideSpec = (
  spec: Pick<
    SlickSpec,
    'slidesToScroll' | 'slidesToShow' | 'slideCount' | 'currentSlide' | 'targetSlide' | 'infinite'
  >,
  options: { message: 'previous' | 'next' | 'dots' | 'index'; index?: number },
): number | undefined => {
  const {
    slidesToScroll,
    slidesToShow,
    slideCount,
    currentSlide,
    targetSlide: previousTargetSlide,
    infinite,
  } = spec;
  const unevenOffset = slideCount % slidesToScroll !== 0;
  const indexOffset = unevenOffset ? 0 : (slideCount - currentSlide) % slidesToScroll;
  let targetSlide: number | undefined;
  if (options.message === 'previous') {
    const slideOffset = indexOffset === 0 ? slidesToScroll : slidesToShow - indexOffset;
    targetSlide = currentSlide - slideOffset;
    if (!infinite) targetSlide = previousTargetSlide - slidesToScroll;
  } else if (options.message === 'next') {
    const slideOffset = indexOffset === 0 ? slidesToScroll : indexOffset;
    targetSlide = currentSlide + slideOffset;
    if (!infinite) targetSlide = previousTargetSlide + slidesToScroll;
  } else if (options.message === 'dots') {
    targetSlide = (options.index ?? 0) * slidesToScroll;
  } else if (options.message === 'index') {
    targetSlide = Number(options.index);
  }
  return targetSlide;
};

/** keyHandler —— `innerSliderUtils.js` L310-315。⚠️ 判据是 `keyCode`，不是 `key`。 */
export const keyHandler = (
  e: KeyboardEvent,
  accessibility?: boolean,
  rtl?: boolean,
): '' | 'previous' | 'next' => {
  const target = e.target as HTMLElement | null;
  if (target && /^(TEXTAREA|INPUT|SELECT)$/.test(target.tagName)) return '';
  if (!accessibility) return '';
  if (e.keyCode === 37) return rtl ? 'next' : 'previous';
  if (e.keyCode === 39) return rtl ? 'previous' : 'next';
  return '';
};

const getSwipeDirection = (
  touchObject: TouchObject,
  verticalSwiping = false,
): 'left' | 'right' | 'up' | 'down' | 'vertical' => {
  const xDist = touchObject.startX - touchObject.curX;
  const yDist = touchObject.startY - touchObject.curY;
  const r = Math.atan2(yDist, xDist);
  let swipeAngle = Math.round((r * 180) / Math.PI);
  if (swipeAngle < 0) swipeAngle = 360 - Math.abs(swipeAngle);
  if ((swipeAngle <= 45 && swipeAngle >= 0) || (swipeAngle <= 360 && swipeAngle >= 315))
    return 'left';
  if (swipeAngle >= 135 && swipeAngle <= 225) return 'right';
  if (verticalSwiping) return swipeAngle >= 35 && swipeAngle <= 135 ? 'up' : 'down';
  return 'vertical';
};

// ============================== 引擎 ==============================

/** 组件侧提供的静态配置（不含运行时 state）。 */
export interface CarouselConfig {
  slidesToShow: number;
  slidesToScroll: number;
  infinite: boolean;
  fade: boolean;
  vertical: boolean;
  rtl: boolean;
  speed: number;
  cssEase: string;
  useCSS: boolean;
  useTransform: boolean;
  waitForAnimate: boolean;
  edgeFriction: number;
  touchThreshold: number;
  swipe: boolean;
  draggable: boolean;
  touchMove: boolean;
  accessibility: boolean;
  autoplay: boolean;
  autoplaySpeed: number;
  pauseOnHover: boolean;
  pauseOnDotsHover: boolean;
  pauseOnFocus: boolean;
  adaptiveHeight: boolean;
  initialSlide: number;
}

export interface EngineCallbacks {
  onBeforeChange: (current: number, next: number) => void;
  onAfterChange: (current: number) => void;
  onSwipe: (dir: 'left' | 'right' | 'up' | 'down') => void;
  onEdge: (dir: 'left' | 'right' | 'up' | 'down') => void;
}

const INITIAL_TOUCH: TouchObject = { startX: 0, startY: 0, curX: 0, curY: 0 };

/**
 * ssrInit 的百分比公式（inner-slider.js `ssrInit`，非变量宽分支）。⚠️ 必须与 slick
 * 逐字一致 —— L4 DOM oracle 以此为判据（basic：width 500% / left -100% / 20%）。
 */
export function ssrTrackStyle(
  slideCount: number,
  slidesToShow: number,
  currentSlide: number,
  clones: number,
): { trackStyle: Record<string, string>; slideWidth: string } {
  const total = clones + slideCount + clones;
  const trackWidth = (100 / slidesToShow) * total;
  const slideWidth = 100 / total;
  const trackLeft = -slideWidth * (clones + currentSlide) * (trackWidth / 100);
  return {
    trackStyle: { width: `${trackWidth}%`, left: `${trackLeft}%` },
    slideWidth: `${slideWidth}%`,
  };
}

export function useCarouselEngine(config: () => CarouselConfig, callbacks: EngineCallbacks) {
  const listRef = shallowRef<HTMLDivElement | null>(null);
  const trackRef = shallowRef<HTMLDivElement | null>(null);

  // ---- 初始状态（initial-state + 构造函数里的 ssrInit 合并，inner-slider.js L654-664） ----
  const cfg0 = config();
  const slideCount0 = 0; // 由组件层在渲染前通过 setSlideCount 提供
  // slick 的 unslick 判据（slider.js L220）：children 数 <= slidesToShow 时引擎停摆
  const clonesOf = (n: number): number => {
    const unslick = n <= cfg0.slidesToShow;
    return cfg0.infinite && !unslick ? cfg0.slidesToShow : 0;
  };
  const ssr0 = ssrTrackStyle(0, cfg0.slidesToShow, cfg0.initialSlide, clonesOf(0));
  const state = reactive({
    animating: false,
    autoplaying: null as null | 'playing' | 'hovered' | 'focused' | 'paused',
    currentDirection: 0,
    currentLeft: null as number | null,
    currentSlide: cfg0.initialSlide,
    direction: 1,
    dragging: false,
    edgeDragged: false,
    initialized: false,
    scrolling: false,
    slideCount: slideCount0,
    slideHeight: null as number | null,
    slideWidth: ssr0.slideWidth as number | string | null,
    listHeight: null as number | null,
    listWidth: null as number | null,
    swipeLeft: null as number | null,
    swiped: false,
    swiping: false,
    touchObject: { ...INITIAL_TOUCH } as TouchObject,
    // ⚠️ slick：`targetSlide: props.initialSlide ? props.initialSlide : 0`
    targetSlide: cfg0.initialSlide ? cfg0.initialSlide : 0,
    trackStyle: ssr0.trackStyle as Record<string, string>,
    trackWidth: 0,
    unslick: false,
  });

  const setSlideCount = (n: number) => {
    state.slideCount = n;
    state.unslick = n <= cfg0.slidesToShow;
    const ssr = ssrTrackStyle(n, cfg0.slidesToShow, cfg0.initialSlide, clonesOf(n));
    if (!state.initialized) {
      state.trackStyle = ssr.trackStyle;
      state.slideWidth = ssr.slideWidth;
    }
  };

  let autoplayTimer: ReturnType<typeof setInterval> | null = null;
  let animationEndCallback: ReturnType<typeof setTimeout> | undefined;
  const callbackTimers: ReturnType<typeof setTimeout>[] = [];

  const specWith = (extra?: Partial<SlickSpec>): SlickSpec => {
    const c = config();
    return {
      slideCount: state.slideCount,
      slidesToShow: c.slidesToShow,
      slidesToScroll: c.slidesToScroll,
      slideWidth: state.slideWidth as number | string | null,
      slideHeight: state.slideHeight,
      listWidth: state.listWidth,
      listHeight: state.listHeight,
      currentSlide: state.currentSlide,
      targetSlide: state.targetSlide,
      infinite: c.infinite,
      fade: c.fade,
      vertical: c.vertical,
      rtl: c.rtl,
      speed: c.speed,
      cssEase: c.cssEase,
      useCSS: c.useCSS,
      useTransform: c.useTransform,
      waitForAnimate: c.waitForAnimate,
      animating: state.animating,
      edgeFriction: c.edgeFriction,
      touchThreshold: c.touchThreshold,
      unslick: state.unslick,
      swipeLeft: state.swipeLeft,
      touchObject: state.touchObject,
      ...extra,
    };
  };

  // ---- 挂载后的测量与 trackStyle 换算（initializedState + getTrackCSS） ----
  const update = (setTrackStyle: boolean, cb?: () => void) => {
    const list = listRef.value;
    const listWidth = Math.ceil(list?.offsetWidth ?? 0);
    const trackWidth = Math.ceil(trackRef.value?.offsetWidth ?? 0);
    const c = config();
    const slideWidth = !c.vertical ? Math.ceil(listWidth / c.slidesToShow) : listWidth;
    const slideHeight = list
      ? ((list.querySelector('[data-index="0"]') as HTMLElement | null)?.offsetHeight ?? 0)
      : 0;
    state.slideWidth = slideWidth;
    state.listWidth = listWidth;
    state.trackWidth = trackWidth;
    state.slideHeight = slideHeight;
    state.listHeight = slideHeight * c.slidesToShow;
    state.initialized = true;
    if (setTrackStyle) {
      const targetLeft = getTrackLeft(specWith({ slideIndex: state.currentSlide }));
      state.currentLeft = targetLeft;
      state.trackStyle = getTrackCSS(specWith({ left: targetLeft }));
    }
    cb?.();
  };

  const adaptHeight = () => {
    const list = listRef.value;
    if (config().adaptiveHeight && list) {
      const el = list.querySelector(`[data-index="${state.currentSlide}"]`) as HTMLElement | null;
      list.style.height = `${el ? el.offsetHeight : 0}px`;
    }
  };

  // ---- handleSlide（inner-slider.js `slideHandler` 方法，含回调与 waitForAnimate） ----
  const handleSlide = (index: number, dontAnimate = false) => {
    const c = config();
    const currentSlide = state.currentSlide;
    const { state: next, nextState: after } = slideHandler({
      ...specWith(),
      index,
      useCSS: c.useCSS && !dontAnimate,
    });
    if (!next) return;
    callbacks.onBeforeChange(currentSlide, next.currentSlide ?? currentSlide);
    // ⚠️ antd 侧 `waitForAnimate=false`：动画中被新目标打断时立即补发旧 slide 的 afterChange
    if (!c.waitForAnimate && animationEndCallback) {
      clearTimeout(animationEndCallback);
      callbacks.onAfterChange(currentSlide);
      animationEndCallback = undefined;
    }
    if (next.animating !== undefined) state.animating = next.animating;
    if (next.currentSlide !== undefined) state.currentSlide = next.currentSlide;
    if (next.targetSlide !== undefined) state.targetSlide = next.targetSlide;
    if (next.trackStyle) state.trackStyle = next.trackStyle;
    if (!after) return;
    animationEndCallback = setTimeout(() => {
      if (after.currentSlide !== undefined) state.currentSlide = after.currentSlide;
      if (after.targetSlide !== undefined) state.targetSlide = after.targetSlide;
      if (after.trackStyle) state.trackStyle = after.trackStyle;
      state.animating = after.animating ?? false;
      state.swipeLeft = null;
      animationEndCallback = undefined;
      callbacks.onAfterChange(next.currentSlide ?? currentSlide);
    }, c.speed);
  };

  // ---- changeSlide（inner-slider.js `changeSlide` 方法） ----
  const changeSlide = (
    opts: { message: 'previous' | 'next' | 'dots' | 'index'; index?: number },
    dontAnimate = false,
  ) => {
    const target = changeSlideSpec(specWith(), opts);
    // slick 的判据：`if (targetSlide !== 0 && !targetSlide) return`
    if (target !== 0 && !target) return;
    if (dontAnimate) handleSlide(target, true);
    else handleSlide(target);
    if (config().autoplay) autoPlay('update');
  };

  // ---- 自动播放（inner-slider.js 的 play / autoPlay / pause） ----
  const play = () => {
    const c = config();
    let nextIndex: number;
    if (c.rtl) {
      nextIndex = state.currentSlide - c.slidesToScroll;
    } else if (canGoNext(specWith())) {
      nextIndex = state.currentSlide + c.slidesToScroll;
    } else {
      return;
    }
    handleSlide(nextIndex);
  };

  const autoPlay = (playType?: 'update' | 'leave' | 'blur' | 'playing') => {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
    const autoplaying = state.autoplaying;
    if (playType === 'update') {
      if (autoplaying === 'hovered' || autoplaying === 'focused' || autoplaying === 'paused')
        return;
    } else if (playType === 'leave') {
      if (autoplaying === 'paused' || autoplaying === 'focused') return;
    } else if (playType === 'blur') {
      if (autoplaying === 'paused' || autoplaying === 'hovered') return;
    }
    // ⚠️ `autoplaySpeed + 50` 是 slick 的原样行为（不是笔误）
    autoplayTimer = setInterval(play, config().autoplaySpeed + 50);
    state.autoplaying = 'playing';
  };

  const pause = (pauseType: 'paused' | 'focused' | 'hovered') => {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
    if (pauseType === 'paused') {
      state.autoplaying = 'paused';
    } else if (pauseType === 'focused') {
      if (state.autoplaying === 'hovered' || state.autoplaying === 'playing')
        state.autoplaying = 'focused';
    } else if (state.autoplaying === 'playing') {
      state.autoplaying = 'hovered';
    }
  };

  const onTrackOver = () => config().autoplay && pause('hovered');
  const onTrackLeave = () =>
    config().autoplay && state.autoplaying === 'hovered' && autoPlay('leave');
  const onDotsOver = () => config().autoplay && pause('hovered');
  const onDotsLeave = () =>
    config().autoplay && state.autoplaying === 'hovered' && autoPlay('leave');
  const onSlideFocus = () => config().autoplay && pause('focused');
  const onSlideBlur = () =>
    config().autoplay && state.autoplaying === 'focused' && autoPlay('blur');

  // ---- 键盘（挂在 .slick-list 上；判据是 keyCode，37/39） ----
  const onListKeyDown = (e: KeyboardEvent) => {
    const c = config();
    const dir = keyHandler(e, c.accessibility, c.rtl);
    if (dir !== '') changeSlide({ message: dir });
  };

  // ---- 拖拽 / 滑动（swipeStart/Move/End；verticalSwiping = vertical） ----
  const pointOf = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
    if ('touches' in e && e.touches[0]) return { x: e.touches[0].pageX, y: e.touches[0].pageY };
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  const swipeStart = (e: MouseEvent | TouchEvent) => {
    const c = config();
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') e.preventDefault();
    if (!c.swipe || (!c.draggable && e.type.indexOf('mouse') !== -1)) return;
    const pt = pointOf(e);
    state.dragging = true;
    state.touchObject = { startX: pt.x, startY: pt.y, curX: pt.x, curY: pt.y };
  };

  const swipeMove = (e: MouseEvent | TouchEvent) => {
    const c = config();
    if (state.scrolling) return;
    if (state.animating) {
      e.preventDefault();
      return;
    }
    const touchObject = state.touchObject;
    const curLeft = getTrackLeft(specWith({ slideIndex: state.currentSlide }));
    const pt = pointOf(e);
    touchObject.curX = pt.x;
    touchObject.curY = pt.y;
    touchObject.swipeLength = Math.round(Math.sqrt((touchObject.curX - touchObject.startX) ** 2));
    const verticalSwipeLength = Math.round(Math.sqrt((touchObject.curY - touchObject.startY) ** 2));
    if (!c.vertical && !state.swiping && verticalSwipeLength > 10) {
      state.scrolling = true;
      return;
    }
    if (c.vertical) touchObject.swipeLength = verticalSwipeLength;
    const positionOffset = (!c.rtl ? 1 : -1) * (touchObject.curX > touchObject.startX ? 1 : -1);
    const swipeDirection = getSwipeDirection(touchObject, c.vertical);
    let touchSwipeLength = touchObject.swipeLength ?? 0;
    if (!c.infinite) {
      if (
        (state.currentSlide === 0 && (swipeDirection === 'right' || swipeDirection === 'down')) ||
        (state.currentSlide + 1 >= Math.ceil(state.slideCount / c.slidesToScroll) &&
          (swipeDirection === 'left' || swipeDirection === 'up')) ||
        (!canGoNext(specWith()) && (swipeDirection === 'left' || swipeDirection === 'up'))
      ) {
        touchSwipeLength = (touchObject.swipeLength ?? 0) * c.edgeFriction;
        if (!state.edgeDragged) {
          callbacks.onEdge(swipeDirection as 'left' | 'right' | 'up' | 'down');
          state.edgeDragged = true;
        }
      }
    }
    if (!state.swiped) {
      callbacks.onSwipe(swipeDirection as 'left' | 'right' | 'up' | 'down');
      state.swiped = true;
    }
    let swipeLeft: number;
    if (!c.vertical) {
      swipeLeft = !c.rtl
        ? curLeft + touchSwipeLength * positionOffset
        : curLeft - touchSwipeLength * positionOffset;
    } else {
      swipeLeft =
        curLeft +
        touchSwipeLength * ((state.listHeight ?? 0) / (state.listWidth || 1)) * positionOffset;
    }
    // slick L403：纵向位移占比大时仅更新状态，不判定为横滑
    if (
      Math.abs(touchObject.curX - touchObject.startX) <
      Math.abs(touchObject.curY - touchObject.startY) * 0.8
    ) {
      return;
    }
    if ((touchObject.swipeLength ?? 0) > 10) {
      state.swiping = true;
      e.preventDefault();
    }
    state.swipeLeft = swipeLeft;
    state.trackStyle = getTrackCSS(specWith({ left: swipeLeft }));
  };

  const swipeEnd = (e: MouseEvent | TouchEvent) => {
    const c = config();
    if (!state.dragging) {
      if (c.swipe) e.preventDefault();
      return;
    }
    const touchObject = state.touchObject;
    const minSwipe = c.vertical
      ? (state.listHeight ?? 0) / c.touchThreshold
      : (state.listWidth ?? 0) / c.touchThreshold;
    const swipeDirection = getSwipeDirection(touchObject, c.vertical);
    state.dragging = false;
    state.edgeDragged = false;
    state.scrolling = false;
    state.swiping = false;
    state.swiped = false;
    state.swipeLeft = null;
    state.touchObject = { ...INITIAL_TOUCH };
    if (!touchObject.swipeLength) return;
    if ((touchObject.swipeLength ?? 0) > minSwipe) {
      e.preventDefault();
      callbacks.onSwipe(swipeDirection as 'left' | 'right' | 'up' | 'down');
      const activeSlide = c.infinite ? state.currentSlide : state.targetSlide;
      let newSlide: number;
      switch (swipeDirection) {
        case 'left':
        case 'up':
          newSlide = activeSlide + c.slidesToScroll;
          state.currentDirection = 0;
          break;
        case 'right':
        case 'down':
          newSlide = activeSlide - c.slidesToScroll;
          state.currentDirection = 1;
          break;
        default:
          newSlide = activeSlide;
      }
      handleSlide(newSlide);
    } else {
      // 拉动距离不足：track 弹回原位（带动画）
      const currentLeft = getTrackLeft(specWith({ slideIndex: state.currentSlide }));
      state.trackStyle = getTrackAnimateCSS(specWith({ left: currentLeft }));
    }
  };

  // ---- resize（slick：debounce 50ms 后 update + autoplay 恢复） ----
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  const onWindowResized = () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      update(true, () => {
        if (config().autoplay) autoPlay('update');
        else pause('paused');
      });
      state.animating = false;
      if (animationEndCallback) {
        clearTimeout(animationEndCallback);
        animationEndCallback = undefined;
      }
    }, 50);
  };

  let ro: ResizeObserver | undefined;

  onMounted(() => {
    update(true, () => {
      adaptHeight();
      if (config().autoplay) autoPlay('playing');
    });
    if (typeof ResizeObserver !== 'undefined' && listRef.value) {
      ro = new ResizeObserver(() => {
        if (state.animating) {
          callbackTimers.push(setTimeout(() => onWindowResized(), config().speed));
        } else {
          onWindowResized();
        }
      });
      ro.observe(listRef.value);
    }
    // pauseOnFocus：slick 把 focus/blur 挂到 slide 元素上（antd 是 document 全局查询 ——
    // 我们收敛到本实例的 list 内，PLATFORM 差异，登记 COMPATIBILITY）
    if (listRef.value) {
      Array.prototype.forEach.call(
        listRef.value.querySelectorAll('.slick-slide'),
        (slide: HTMLElement) => {
          slide.onfocus = config().pauseOnFocus ? onSlideFocus : null;
          slide.onblur = config().pauseOnFocus ? onSlideBlur : null;
        },
      );
    }
  });

  onBeforeUnmount(() => {
    if (animationEndCallback) clearTimeout(animationEndCallback);
    if (autoplayTimer) clearInterval(autoplayTimer);
    if (resizeTimer) clearTimeout(resizeTimer);
    callbackTimers.forEach(clearTimeout);
    ro?.disconnect();
  });

  // ---- 暴露给组件层 ----
  const goTo = (slide: number, dontAnimate = false) => {
    const n = Number(slide);
    if (Number.isNaN(n)) return;
    // slick 的 slickGoTo 包了 setTimeout(0)（等首帧 state 就绪）；Vue 首帧同步，直接调用
    changeSlide({ message: 'index', index: n }, dontAnimate);
  };
  const next = () => changeSlide({ message: 'next' });
  const prev = () => changeSlide({ message: 'previous' });

  return {
    state,
    listRef,
    trackRef,
    setSlideCount,
    goTo,
    next,
    prev,
    /** message 语义的切换入口（dots / index / previous / next）—— 组件层直接用。 */
    changeSlide,
    handleSlide,
    autoPlay,
    pause,
    play,
    adaptHeight,
    update,
    onTrackOver,
    onTrackLeave,
    onDotsOver,
    onDotsLeave,
    onListKeyDown,
    swipeStart,
    swipeMove,
    swipeEnd,
  };
}
