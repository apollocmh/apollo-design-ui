/**
 * Carousel —— 走马灯（渲染函数组件）。
 *
 * 契约来源：antd 6.6.4 的 `es/carousel/index.js`（外层包装）+
 * `@ant-design/react-slick@2.0.0`（DOM 与行为的真正生产者：track.js / dots.js /
 * arrows.js / inner-slider.js / slider.js）。判据逐条对齐 G1 分析
 * （`docs/analysis/carousel.md`），引擎状态机见 `engine.ts`（决策 B：自建）。
 *
 * ── 八条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 * 1. **用户 style 落在 `.slick-slider` 上，不在根节点**：antd 把
 *    `{...contextStyle, ...style}` 传给 SlickCarousel（→ InnerSlider 的 style），
 *    根 div 只有 `--dot-duration`。SSR 探针确认。
 * 2. **arrows 的 antd 默认是 false**（slick 默认 true 被 antd 覆盖）；默认箭头按钮
 *    **没有文案**（antd 用空内容的 ArrowButton 包裹），aria-label 来自 locale，
 *    rtl 时 prev/next 文案互换。
 * 3. **infinite 默认 true ⇒ SSR 就渲染 clone**（data-index=-1 与 data-index=n，
 *    class `slick-cloned`，无 outline:none）；fade 分支**不渲染 clone**。
 * 4. **slide 外层的 tab/aria 由 slick 注入**（tabindex=-1、aria-hidden=!active）；
 *    内层还有一个 `tabindex=-1, style="width:100%;display:inline-block"` 的
 *    包裹 div（slider.js 的 rows/slidesPerRow=1 路径）—— 三层结构缺一不可。
 * 5. **dots 非激活项的 class 是空字符串**（不是省略属性）：li 的 className 走
 *    clsx({slick-active: bool}) ⇒ bool=false 时 class=""。L4 逐字节对齐。
 * 6. **waitForAnimate 的 antd 默认是 false**（slick 默认 true 被 antd 覆盖）——
 *    动画中新的切换会打断旧动画并**立即补发旧 slide 的 afterChange**。
 * 7. **`targetSlide` 初始值是 `initialSlide ? initialSlide : 0`**（不是恒 0）——
 *    它决定第一帧 `slick-current` 落在哪张（initialSlide>0 时 track 位置与
 *    current 类分开计算）。
 * 8. **键盘判据是 `keyCode`**（37/39，rtl 互换），挂在 `.slick-list` 上。
 */

import { useLocale } from '@apollo-design/locale';
import { useDevWarning } from '@apollo-design/utils';
import {
  Comment,
  cloneVNode,
  computed,
  defineComponent,
  Fragment,
  h,
  type PropType,
  shallowRef,
  type VNode,
  type VNodeChild,
  watch,
  watchEffect,
} from 'vue';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { type CarouselConfig, canGoNext, useCarouselEngine } from './engine';
import type { CarouselProps, DotPlacement } from './interface';

/** 用户裁决（2026-09-23）显式不支持的 Settings —— 出现在 attrs 里就发 dev 告警。 */
const UNSUPPORTED_SETTINGS = [
  'responsive',
  'rows',
  'slidesPerRow',
  'centerMode',
  'centerPadding',
  'variableWidth',
  'lazyLoad',
  'asNavFor',
  'focusOnSelect',
  'swipeToSlide',
  'slide',
  'unslick',
  'appendDots',
  'customPaging',
  'onInit',
  'onReInit',
  'onLazyLoad',
  'swipeEvent',
] as const;

export const CarouselComponent = defineComponent({
  name: 'ACarousel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<CarouselProps['style']>, default: undefined },
    id: { type: String, default: undefined },
    effect: { type: String as PropType<CarouselProps['effect']>, default: undefined },
    dots: { type: [Boolean, Object] as PropType<CarouselProps['dots']>, default: undefined },
    dotPlacement: { type: String as PropType<DotPlacement>, default: undefined },
    dotPosition: {
      type: String as PropType<NonNullable<CarouselProps['dotPosition']>>,
      default: undefined,
    },
    autoplay: {
      type: [Boolean, Object] as PropType<CarouselProps['autoplay']>,
      default: undefined,
    },
    autoplaySpeed: { type: Number, default: undefined },
    speed: { type: Number, default: undefined },
    cssEase: { type: String, default: undefined },
    easing: { type: String, default: undefined },
    infinite: { type: Boolean, default: undefined },
    initialSlide: { type: Number, default: undefined },
    slidesToShow: { type: Number, default: undefined },
    slidesToScroll: { type: Number, default: undefined },
    draggable: { type: Boolean, default: undefined },
    swipe: { type: Boolean, default: undefined },
    touchMove: { type: Boolean, default: undefined },
    touchThreshold: { type: Number, default: undefined },
    vertical: { type: Boolean, default: undefined },
    waitForAnimate: { type: Boolean, default: undefined },
    pauseOnHover: { type: Boolean, default: undefined },
    pauseOnDotsHover: { type: Boolean, default: undefined },
    pauseOnFocus: { type: Boolean, default: undefined },
    arrows: { type: Boolean, default: undefined },
    accessibility: { type: Boolean, default: undefined },
    adaptiveHeight: { type: Boolean, default: undefined },
    rtl: { type: Boolean, default: undefined },
    useCSS: { type: Boolean, default: undefined },
    useTransform: { type: Boolean, default: undefined },
    edgeFriction: { type: Number, default: undefined },
  },
  /**
   * 事件（规则 C19）：antd 的 `beforeChange` / `afterChange` / `onSwipe` / `onEdge`
   * props 回调映射为 Vue 事件。没有 value 语义 ⇒ 无 `update:*` 通道。
   */
  emits: ['before-change', 'after-change', 'swipe', 'edge'],
  setup(props, { attrs, slots, emit, expose }) {
    const context = useComponentConfig('carousel');
    const { getPrefixCls } = context;
    const direction = useDirection();
    const devWarning = useDevWarning('Carousel');
    const [locale] = useLocale('Carousel');

    // ============================= Warning ==============================
    watchEffect(() => {
      // ⚠️ deprecated 的第一参是 valid（true = 不告警）—— 与 antd 的
      //    `warning.deprecated(!dotPosition, …)` 逐字同构
      devWarning.deprecated(props.dotPosition === undefined, 'dotPosition', 'dotPlacement');
      for (const key of UNSUPPORTED_SETTINGS) {
        if (attrs[key] !== undefined) {
          devWarning(false, `\`${key}\` 按首版裁决不支持（INTENDED，见 COMPATIBILITY.md）`);
        }
      }
    });

    // ============================ Placement =============================
    const mergedDotPlacement = computed<DotPlacement>(() => {
      const placement = props.dotPlacement ?? props.dotPosition ?? 'bottom';
      if (placement === 'left') return 'start';
      if (placement === 'right') return 'end';
      return placement;
    });
    const mergedVertical = computed(
      () =>
        props.vertical ??
        (mergedDotPlacement.value === 'start' || mergedDotPlacement.value === 'end'),
    );
    const isRTL = computed(() => (props.rtl ?? direction.value === 'rtl') && !mergedVertical.value);

    // ========================== 引擎配置快照 ============================
    // ⚠️ fade 下 slidesToShow / slidesToScroll 强制 1（slider.js L150-159）
    const config = computed<CarouselConfig>(() => {
      const fade = props.effect === 'fade';
      return {
        slidesToShow: fade ? 1 : (props.slidesToShow ?? 1),
        slidesToScroll: fade ? 1 : (props.slidesToScroll ?? 1),
        infinite: props.infinite ?? true,
        fade,
        vertical: mergedVertical.value,
        rtl: isRTL.value,
        speed: props.speed ?? 500,
        cssEase: props.cssEase ?? 'ease',
        useCSS: props.useCSS ?? true,
        useTransform: props.useTransform ?? true,
        waitForAnimate: props.waitForAnimate ?? false,
        edgeFriction: props.edgeFriction ?? 0.35,
        touchThreshold: props.touchThreshold ?? 5,
        swipe: props.swipe ?? true,
        draggable: props.draggable ?? true,
        touchMove: props.touchMove ?? true,
        accessibility: props.accessibility ?? true,
        autoplay: !!props.autoplay,
        autoplaySpeed: props.autoplaySpeed ?? 3000,
        pauseOnHover: props.pauseOnHover ?? true,
        pauseOnDotsHover: props.pauseOnDotsHover ?? false,
        pauseOnFocus: props.pauseOnFocus ?? false,
        adaptiveHeight: props.adaptiveHeight ?? false,
        initialSlide: props.initialSlide ?? 0,
      };
    });

    const engine = useCarouselEngine(() => config.value, {
      onBeforeChange: (current, next) => emit('before-change', current, next),
      onAfterChange: (current) => emit('after-change', current),
      onSwipe: (dir) => emit('swipe', dir),
      onEdge: (dir) => emit('edge', dir),
    });
    const state = engine.state;

    // ============================== children ============================
    const collectChildren = (nodes: VNodeChild[]): VNode[] => {
      const out: VNode[] = [];
      const walk = (list: VNodeChild[]) => {
        for (const node of list) {
          if (!node || typeof node !== 'object') continue;
          const v = node as VNode;
          if (v.type === Comment) continue;
          if (v.type === Fragment) {
            walk((v.children as VNodeChild[]) ?? []);
            continue;
          }
          out.push(v);
        }
      };
      walk(nodes);
      return out;
    };

    // ⚠️ children 只在 render 内消费（slot 在渲染函数外调用会丢依赖追踪并触发
    //    Vue 的 "Slot invoked outside of render" 警告）。数量变化走 childrenCount
    //    ref 触发下面的 watch。
    const childrenCount = shallowRef(0);
    let currentChildren: VNode[] = [];

    // ---- children 数量变化：重算 track + 越界回调（componentDidUpdate 语义） ----
    watch(childrenCount, (count) => {
      engine.setSlideCount(count);
      engine.update(true, () => {
        if (state.currentSlide >= count) {
          engine.changeSlide({ message: 'index', index: count - config.value.slidesToShow });
        }
      });
    });

    // ---- autoplay / autoplaySpeed 变化（componentDidUpdate 语义） ----
    let prevAutoplay = false;
    watch(
      () => [config.value.autoplay, config.value.autoplaySpeed] as const,
      ([autoplay]) => {
        if (autoplay === prevAutoplay) {
          if (autoplay) engine.autoPlay('update');
          prevAutoplay = autoplay;
          return;
        }
        if (!prevAutoplay && autoplay) engine.autoPlay('playing');
        else if (autoplay) engine.autoPlay('update');
        else engine.pause('paused');
        prevAutoplay = autoplay;
      },
    );

    // ---- initialSlide / rtl 变化（antd 的 useEffect [initialSlide, isRTL]） ----
    watch(
      () => [props.initialSlide ?? 0, isRTL.value] as const,
      ([initialSlide, rtlFlag]) => {
        if (childrenCount.value > 0) {
          const newIndex = rtlFlag ? childrenCount.value - initialSlide - 1 : initialSlide;
          engine.goTo(newIndex, false);
        }
      },
    );

    // ---- adaptiveHeight：slick 在每次更新后调用（componentDidUpdate） ----
    watch(
      () => [state.currentSlide, state.trackStyle] as const,
      () => engine.adaptHeight(),
    );

    // ============================ Refs / Expose =========================
    const rootRef = shallowRef<HTMLDivElement | null>(null);

    expose({
      get nativeElement() {
        return rootRef.value;
      },
      goTo: engine.goTo,
      next: engine.next,
      prev: engine.prev,
      autoPlay: engine.autoPlay,
      get innerSlider() {
        return state as unknown as Record<string, unknown>;
      },
    });

    // ============================ 渲染辅助 ==============================
    /** React 语义：数字 0 → "0"，其余数字加 px；字符串原样。 */
    const px = (val: number | string): string =>
      typeof val === 'number' ? (val === 0 ? '0' : `${val}px`) : val;

    /** track.js 的 `getSlideClasses`（centerMode 分支裁剪）。⚠️ rtl 下按镜像索引判定。 */
    const getSlideClasses = (index: number): Record<string, boolean> => {
      const n = state.slideCount;
      const show = config.value.slidesToShow;
      // track.js L21-25：rtl 时 index 先镜像成 `slideCount - 1 - index` 再判定
      const idx = config.value.rtl ? n - 1 - index : index;
      const slickCloned = idx < 0 || idx >= n;
      const slickActive = state.currentSlide <= idx && idx < state.currentSlide + show;
      let focusedSlide = state.targetSlide;
      if (focusedSlide < 0) focusedSlide += n;
      else if (focusedSlide >= n) focusedSlide -= n;
      return {
        'slick-slide': true,
        'slick-active': slickActive,
        'slick-cloned': slickCloned,
        'slick-current': idx === focusedSlide,
      };
    };

    /** track.js 的 `getSlideStyle`（变量宽裁剪）。⚠️ width 对所有模式生效（L55-57），fade 追加定位/透明度。 */
    const getSlideStyle = (index: number): Record<string, string> => {
      const c = config.value;
      const style: Record<string, string> = {};
      if (state.slideWidth !== null && state.slideWidth !== undefined) {
        style.width = px(state.slideWidth as number | string);
      }
      if (!c.fade) return style;
      style.position = 'relative';
      // slick：left = -index * parseInt(slideWidth)（'20%' → 20 → px 值）
      const slideWidthInt = Math.trunc(Number.parseInt(String(state.slideWidth), 10) || 0);
      if (c.vertical && state.slideHeight) {
        style.top = px(-index * Math.trunc(state.slideHeight));
      } else {
        style.left = px(-index * slideWidthInt);
      }
      style.opacity = state.currentSlide === index ? '1' : '0';
      style.zIndex = state.currentSlide === index ? '999' : '998';
      if (c.useCSS) {
        style.transition = `opacity ${c.speed}ms ${c.cssEase}, visibility ${c.speed}ms ${c.cssEase}`;
      }
      return style;
    };

    // ⚠️ 输出的是 CSS 字符串：键必须 kebab-case（zIndex → z-index），否则 CSSOM
    //    解析时会静默丢弃该声明（实测：jsdom cssstyle 丢弃 zIndex）
    const styleToString = (style: Record<string, string>): string =>
      Object.entries(style)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v}`)
        .join(';');

    /** trackStyle → style 字符串（还原 -webkit-/-ms- 前缀；React 的驼峰 CSS 属性）。 */
    const trackStyleString = computed(() => {
      const entries = Object.entries(state.trackStyle).map(([k, v]) => {
        const key =
          k === 'webkitTransform'
            ? '-webkit-transform'
            : k === 'webkitTransition'
              ? '-webkit-transition'
              : k === 'msTransform'
                ? '-ms-transform'
                : k;
        return [key, v] as const;
      });
      return entries
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${k}:${v}`)
        .join(';');
    });

    /** 单个 slide 的完整 DOM（外层 slick-slide + 内层包裹 + child），track.js + slider.js。 */
    const renderSlide = (child: VNode, index: number, key: string): VNode => {
      const classes = getSlideClasses(index);
      const fadeStyle = getSlideStyle(index);
      const isClone = index < 0 || index >= childrenCount.value;
      // 外层 style：正片多一个 outline:none（React {outline:'none', ...childStyle}）
      const outerStyle: Record<string, string> = isClone
        ? { ...fadeStyle }
        : { outline: 'none', ...fadeStyle };
      const userStyle = child.props?.style as Record<string, string> | undefined;
      const mergedOuter = userStyle
        ? styleToString({ ...userStyle, ...outerStyle })
        : styleToString(outerStyle);
      return h(
        'div',
        {
          key,
          'data-index': index,
          tabindex: -1,
          class: classes,
          'aria-hidden': String(!classes['slick-active']),
          style: mergedOuter,
        },
        [
          h('div', [
            // slider.js 的 rows/slidesPerRow=1 包裹：tabIndex + width:100%
            cloneVNode(child, {
              key: `inner-${key}`,
              tabindex: -1,
              style: { width: '100%', display: 'inline-block' },
            }),
          ]),
        ],
      );
    };

    /** track.js 的 `renderSlides`（含 clone 的取材与排序规则）。 */
    const renderTrackSlides = (): VNode[] => {
      const kids = currentChildren;
      const n = kids.length;
      const c = config.value;
      const originals: VNode[] = kids.map((child, i) => renderSlide(child, i, `original${i}`));
      // ⚠️ clone 条件：`infinite && childrenCount>1 && !fade && !unslick`（track.js L125）
      if (!c.infinite || n <= 1 || c.fade || state.unslick) return originals;
      const k = c.slidesToShow;
      const pre: VNode[] = [];
      const post: VNode[] = [];
      kids.forEach((child, i) => {
        const preCloneNo = n - i;
        if (preCloneNo <= k) {
          pre.push(renderSlide(child, -preCloneNo, `precloned${-preCloneNo}`));
        }
        if (i < k) {
          post.push(renderSlide(child, n + i, `postcloned${n + i}`));
        }
      });
      const list = [...pre, ...originals, ...post];
      return c.rtl ? list.reverse() : list;
    };

    /** dots.js（appendDots/customPaging 用默认实现）。⚠️ dots 的 antd 默认是 true。 */
    const renderDots = (): VNode | null => {
      const c = config.value;
      const n = state.slideCount;
      const dotsEnabled = props.dots ?? true;
      // ⚠️ slick 的 unslick：dots 渲染为空串（`!unslick ? dots : ''`）⇒ 无节点
      if (!dotsEnabled || n < c.slidesToShow || state.unslick) return null;
      const dotCount = c.infinite
        ? Math.ceil(n / c.slidesToScroll)
        : Math.ceil((n - c.slidesToShow) / c.slidesToScroll) + 1;
      const dots: VNode[] = [];
      for (let i = 0; i < dotCount; i++) {
        const rightBoundRaw = (i + 1) * c.slidesToScroll - 1;
        const rightBound = c.infinite ? rightBoundRaw : Math.max(0, Math.min(rightBoundRaw, n - 1));
        const leftBoundRaw = rightBound - (c.slidesToScroll - 1);
        const leftBound = c.infinite ? leftBoundRaw : Math.max(0, Math.min(leftBoundRaw, n - 1));
        const active = c.infinite
          ? state.currentSlide >= leftBound && state.currentSlide <= rightBound
          : state.currentSlide === leftBound;
        dots.push(
          h('li', { key: i, class: active ? 'slick-active' : '' }, [
            h(
              'button',
              {
                onClick: (e: MouseEvent) => {
                  e.preventDefault();
                  engine.changeSlide({ message: 'dots', index: i });
                },
              },
              String(i + 1),
            ),
          ]),
        );
      }
      const dsClass = [
        'slick-dots',
        `slick-dots-${mergedDotPlacement.value}`,
        typeof props.dots === 'boolean' ? '' : (props.dots?.className ?? ''),
      ]
        .filter(Boolean)
        .join(' ');
      const mouseHandlers: Record<string, unknown> = {};
      if (c.pauseOnDotsHover) {
        // ⚠️ slick 的原样映射：mouseenter→onDotsLeave、mouseover→onDotsOver（非笔误）
        mouseHandlers.onMouseenter = engine.onDotsLeave;
        mouseHandlers.onMouseover = engine.onDotsOver;
        mouseHandlers.onMouseleave = engine.onDotsLeave;
      }
      return h('ul', { style: 'display:block', class: dsClass, ...mouseHandlers }, dots);
    };

    /** arrows.js + antd 的 ArrowButton（默认无文案；aria-label 来自 locale）。 */
    const renderArrow = (kind: 'prev' | 'next'): VNode => {
      const c = config.value;
      const isPrev = kind === 'prev';
      const disabled = isPrev
        ? !c.infinite && (state.currentSlide === 0 || state.slideCount <= c.slidesToShow)
        : !canGoNext({
            infinite: c.infinite,
            slideCount: state.slideCount,
            slidesToShow: c.slidesToShow,
            currentSlide: state.currentSlide,
          });
      const classes = ['slick-arrow', isPrev ? 'slick-prev' : 'slick-next'];
      if (disabled) classes.push('slick-disabled');
      const common = {
        'data-role': 'none',
        class: classes.join(' '),
        style: 'display:block',
        onClick: disabled
          ? undefined
          : () => engine.changeSlide({ message: isPrev ? 'previous' : 'next' }),
      };
      const slot = slots[isPrev ? 'prev-arrow' : 'next-arrow'];
      if (slot) {
        const vnode = slot({
          currentSlide: state.currentSlide,
          slideCount: state.slideCount,
        }) as VNode[];
        const first = Array.isArray(vnode) ? vnode[0] : vnode;
        if (first && typeof first === 'object') {
          return cloneVNode(first, {
            ...common,
            class: [first.props?.class as string | undefined, common.class]
              .filter(Boolean)
              .join(' '),
            style: [first.props?.style as string | undefined, common.style]
              .filter(Boolean)
              .join(';'),
          });
        }
      }
      return h('button', {
        type: 'button',
        'aria-label': isPrev
          ? isRTL.value
            ? locale.nextSlide
            : locale.prevSlide
          : isRTL.value
            ? locale.prevSlide
            : locale.nextSlide,
        ...common,
      });
    };

    // ============================== Render ==============================
    return () => {
      // ⚠️ slot 只能在 render 里调用（见 childrenCount 注释）；数量变化在这里同步
      currentChildren = collectChildren((slots.default?.() ?? []) as VNodeChild[]);
      if (currentChildren.length !== childrenCount.value) {
        childrenCount.value = currentChildren.length;
        engine.setSlideCount(currentChildren.length);
      }
      const cls = getPrefixCls('carousel', props.prefixCls);
      const c = config.value;
      const st = state;
      const touchMove = c.touchMove;

      const listHandlers: Record<string, unknown> = st.unslick
        ? {}
        : {
            onMousedown: touchMove ? engine.swipeStart : undefined,
            onMousemove: st.dragging && touchMove ? engine.swipeMove : undefined,
            onMouseup: touchMove ? engine.swipeEnd : undefined,
            onMouseleave: st.dragging && touchMove ? engine.swipeEnd : undefined,
            onTouchstart: touchMove ? engine.swipeStart : undefined,
            onTouchmove: st.dragging && touchMove ? engine.swipeMove : undefined,
            onTouchend: touchMove ? engine.swipeEnd : undefined,
            onTouchcancel: st.dragging && touchMove ? engine.swipeEnd : undefined,
            onKeydown: c.accessibility ? engine.onListKeyDown : undefined,
          };
      // vertical 时 list 有 height（initializedState 的 listHeight）。
      // ⚠️ Vue 的字符串 style 是整段 cssText —— 必须是完整声明，不能只是值。
      if (c.vertical && st.listHeight) listHandlers.style = `height:${px(st.listHeight)}`;

      // ⚠️ slick 的 unslick：arrows 同样渲染为空串 ⇒ 无节点
      const prevArrow = props.arrows && !st.unslick ? renderArrow('prev') : null;
      const nextArrow = props.arrows && !st.unslick ? renderArrow('next') : null;
      const dotsNode = renderDots();

      // 判据 1：用户 style 在 slick-slider 上；根 div 只有 --dot-duration
      const dotDurationStyle =
        c.autoplay && typeof props.autoplay === 'object' && props.autoplay?.dotDuration
          ? { '--dot-duration': `${c.autoplaySpeed}ms` }
          : undefined;

      return h(
        'div',
        {
          ref: rootRef,
          class: [
            cls,
            {
              [`${cls}-rtl`]: isRTL.value,
              [`${cls}-vertical`]: c.vertical,
            },
            props.rootClassName,
          ],
          id: props.id,
          style: dotDurationStyle,
        },
        [
          h(
            'div',
            {
              class: [
                'slick-slider',
                props.className,
                context.className as string | undefined,
                { 'slick-vertical': c.vertical, 'slick-initialized': true },
              ],
              dir: 'ltr',
              style: {
                ...(context.style as Record<string, string | number> | undefined),
                ...props.style,
              },
            },
            [
              prevArrow,
              h('div', { ref: engine.listRef, class: 'slick-list', ...listHandlers }, [
                h(
                  'div',
                  {
                    ref: engine.trackRef,
                    class: 'slick-track',
                    style: trackStyleString.value,
                    onMouseenter: c.pauseOnHover ? engine.onTrackOver : undefined,
                    onMouseover: c.pauseOnHover ? engine.onTrackOver : undefined,
                    onMouseleave: c.pauseOnHover ? engine.onTrackLeave : undefined,
                  },
                  renderTrackSlides(),
                ),
              ]),
              nextArrow,
              dotsNode,
            ],
          ),
        ],
      );
    };
  },
});

export const Carousel = CarouselComponent;
export default Carousel;
