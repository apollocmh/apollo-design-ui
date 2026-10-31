/** Vue owns Carousel content, keys, native attrs and notifications; the private
 * engine retains the established positioning/slide algorithm and lifecycle. */

import { useLocale } from '@apollo-design/locale';
import { useDevWarning, useId } from '@apollo-design/utils';
import {
  Comment,
  type CSSProperties,
  cloneVNode,
  computed,
  createTextVNode,
  defineComponent,
  Fragment,
  h,
  isVNode,
  mergeProps,
  onUpdated,
  type PropType,
  type SlotsType,
  shallowRef,
  Text,
  type VNode,
  type VNodeArrayChildren,
  type VNodeChild,
  watch,
  watchEffect,
} from 'vue';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { type CarouselConfig, canGoNext, useCarouselEngine } from './engine';
import type {
  CarouselProps,
  CarouselSlots,
  CarouselSwipeDirection,
  DotPlacement,
} from './interface';
import { useCarouselTheme } from './use-carousel-theme';

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
    // 语义化槽位（本仓自有 API，替代下面两个 deprecated 的 React 名）
    classNames: {
      type: Object as PropType<CarouselProps['classNames']>,
      default: undefined,
    },
    styles: { type: Object as PropType<CarouselProps['styles']>, default: undefined },
    /** @deprecated 用 `classNames.slider`。 */
    className: { type: String, default: undefined },
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
  emits: {
    beforeChange: (_current: number, _next: number) => true,
    afterChange: (_current: number) => true,
    swipe: (_direction: CarouselSwipeDirection) => true,
    edge: (_direction: CarouselSwipeDirection) => true,
    keydown: (_event: KeyboardEvent) => true,
  },
  slots: Object as SlotsType<CarouselSlots>,
  setup(props, { attrs, slots, emit, expose }) {
    const context = useComponentConfig<{
      className?: string;
      style?: CSSProperties;
      classNames?: CarouselProps['classNames'];
      styles?: CarouselProps['styles'];
    }>('carousel');
    const themeStyles = useCarouselTheme(() => context.getPrefixCls('carousel', props.prefixCls));
    const direction = useDirection();
    const devWarning = useDevWarning('Carousel');
    const instanceId = useId();
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
      onBeforeChange: (current, next) => emit('beforeChange', current, next),
      onAfterChange: (current) => emit('afterChange', current),
      onSwipe: (dir) => emit('swipe', dir),
      onEdge: (dir) => emit('edge', dir),
    });
    const state = engine.state;

    // ============================== children ============================
    const collectChildren = (nodes: VNodeChild): VNode[] => {
      const result: VNode[] = [];
      const visit = (node: VNodeChild): void => {
        if (Array.isArray(node)) {
          node.forEach(visit);
          return;
        }
        if (isVNode(node)) {
          if (
            node.type === Comment ||
            (node.type === Text && typeof node.children === 'string' && !node.children.trim())
          )
            return;
          if (node.type === Fragment) {
            if (Array.isArray(node.children) || typeof node.children === 'string')
              visit(node.children);
            return;
          }
          result.push(node);
        } else if (typeof node === 'number' || (typeof node === 'string' && node.trim())) {
          result.push(createTextVNode(String(node)));
        }
      };
      visit(nodes);
      return result;
    };
    const childrenCount = shallowRef(0);
    const slidesVersion = shallowRef(0);
    let currentChildren: VNode[] = [];
    watch(
      () => [config.value, slidesVersion.value],
      () => engine.reconfigure(),
      { flush: 'post' },
    );
    onUpdated(() => engine.syncObservers());

    // ---- adaptiveHeight：slick 在每次更新后调用（componentDidUpdate） ----
    watch(
      () => [state.currentSlide, state.trackStyle] as const,
      () => engine.adaptHeight(),
      { flush: 'post' },
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
        return state;
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
      const slickActive =
        state.unslick || (state.currentSlide <= idx && idx < state.currentSlide + show);
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
        style.width = px(state.slideWidth);
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
      const active = getSlideClasses(index)['slick-active'];
      style.opacity = active ? '1' : '0';
      style.zIndex = active ? '999' : '998';
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
        .map(
          ([k, v]) =>
            `${k}:${(k === 'left' || k === 'top') && v !== '' && Number.isFinite(Number(v)) ? `${v}px` : v}`,
        )
        .join(';');
    });

    /** 单个 slide 的完整 DOM（外层 slick-slide + 内层包裹 + child），track.js + slider.js。 */
    // Visual duplicates must not claim the parent refs of the original content.
    const cloneIds = new Map<NonNullable<VNode['key']>, number>();
    let nextCloneId = 0;
    const visualClone = (node: VNode, suffix: string): VNode => {
      const ids = new Map<string, string>();
      const collectIds = (child: VNodeChild): void => {
        if (Array.isArray(child)) {
          child.forEach(collectIds);
          return;
        }
        if (!isVNode(child)) return;
        if (typeof child.type === 'string' && typeof child.props?.id === 'string')
          ids.set(child.props.id, `${child.props.id}--${suffix}`);
        if (Array.isArray(child.children)) child.children.forEach(collectIds);
      };
      collectIds(node);
      const duplicateNode = (child: VNode): VNode => {
        const copy = Object.assign(cloneVNode(child), { dynamicChildren: null });
        copy.ref = null;
        // Only concrete native DOM attrs are relationships. Component id props
        // and uninvoked component slots retain their actual business contracts.
        if (typeof copy.type === 'string' && copy.props) {
          const props = { ...copy.props };
          if (typeof props.id === 'string') props.id = ids.get(props.id) ?? props.id;
          for (const name of [
            'for',
            'htmlFor',
            'aria-labelledby',
            'aria-describedby',
            'aria-controls',
            'aria-owns',
            'aria-activedescendant',
            'aria-details',
            'aria-errormessage',
          ]) {
            const value = props[name];
            if (typeof value === 'string')
              props[name] = value.replace(/\S+/g, (id) => ids.get(id) ?? id);
          }
          copy.props = props;
        }
        if (Array.isArray(copy.children)) copy.children = copy.children.map(duplicateChild);
        else if (
          (copy.shapeFlag & (2 | 4)) !== 0 &&
          copy.children &&
          typeof copy.children === 'object'
        ) {
          const source = copy.children;
          // A fresh raw slot object lets Vue normalize with the original owner.
          // Compiler stable/cache flags cannot describe these transformed slots.
          const forwarded: typeof source = { _ctx: source._ctx };
          const duplicateSlotContent = (value: unknown): VNodeChild => {
            if (Array.isArray(value)) return value.map(duplicateSlotContent);
            if (isVNode(value)) return duplicateNode(value);
            if (
              value == null ||
              typeof value === 'string' ||
              typeof value === 'number' ||
              typeof value === 'boolean'
            )
              return value;
            throw new TypeError('[Carousel] Slot content must be a Vue VNodeChild');
          };
          for (const [name, value] of Object.entries(source)) {
            if (name.startsWith('_') || name === '$stable') continue;
            forwarded[name] =
              typeof value === 'function'
                ? (...args: unknown[]) => duplicateSlotContent(value(...args))
                : value;
          }
          copy.children = forwarded;
          // Vue FULL_PROPS | DYNAMIC_SLOTS: the private clone changed both trees.
          copy.patchFlag = Math.max(copy.patchFlag, 0) | (1 << 4) | (1 << 10);
        }
        return copy;
      };
      const duplicateChild = (child: VNodeArrayChildren[number]): VNodeArrayChildren[number] => {
        if (Array.isArray(child)) return child.map(duplicateChild);
        return isVNode(child) ? duplicateNode(child) : child;
      };
      return duplicateNode(node);
    };

    const renderSlide = (child: VNode, index: number, sourceIndex: number): VNode => {
      const classes = getSlideClasses(index);
      const isClone = index < 0 || index >= childrenCount.value;
      const active = !!classes['slick-active'];
      const key = child.key ?? sourceIndex;
      let cloneId = cloneIds.get(key);
      if (cloneId === undefined) {
        cloneId = ++nextCloneId;
        cloneIds.set(key, cloneId);
      }
      const content = isClone
        ? visualClone(child, `${instanceId}-${index < 0 ? 'pre' : 'post'}-${cloneId}`)
        : child;
      const outerStyle = isClone
        ? getSlideStyle(index)
        : { outline: 'none', ...getSlideStyle(index) };
      return h(
        'div',
        {
          key,
          'data-index': index,
          tabindex: -1,
          class: classes,
          'aria-hidden': String(!active),
          inert: active ? undefined : true,
          style: styleToString(outerStyle),
        },
        [
          h('div', [
            cloneVNode(content, {
              style: { width: '100%', display: 'inline-block' },
            }),
          ]),
        ],
      );
    };
    const renderTrackSlides = (): VNode[] => {
      const kids = currentChildren,
        n = kids.length,
        c = config.value;
      const currentKeys = new Set(kids.map((child, i) => child.key ?? i));
      for (const key of cloneIds.keys()) if (!currentKeys.has(key)) cloneIds.delete(key);
      const originals = kids.map((child, i) => renderSlide(child, i, i));
      const pre: VNode[] = [],
        post: VNode[] = [];
      if (c.infinite && n > 1 && !c.fade && !state.unslick) {
        kids.forEach((child, i) => {
          const preCount = n - i;
          if (preCount <= c.slidesToShow) pre.push(renderSlide(child, -preCount, i));
          if (i < c.slidesToShow) post.push(renderSlide(child, n + i, i));
        });
      }
      // Native keyed Fragment groups isolate clone key domains without a DOM host.
      const groups = [
        { key: 'pre', slides: pre },
        { key: 'original', slides: originals },
        { key: 'post', slides: post },
      ];
      if (c.rtl) groups.reverse();
      return groups.map((group) =>
        h(Fragment, { key: group.key }, c.rtl ? group.slides.reverse() : group.slides),
      );
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
      return h(
        'ul',
        {
          style: 'display:block',
          class: dsClass,
          onMouseenter: engine.onDotsOver,
          onMouseleave: engine.onDotsLeave,
        },
        dots,
      );
    };

    const renderArrow = (kind: 'prev' | 'next'): VNode => {
      const c = config.value,
        isPrev = kind === 'prev';
      const disabled = isPrev
        ? !c.infinite && (state.currentSlide === 0 || state.slideCount <= c.slidesToShow)
        : !canGoNext({
            infinite: c.infinite,
            slideCount: state.slideCount,
            slidesToShow: c.slidesToShow,
            currentSlide: state.currentSlide,
          });
      const content = slots[isPrev ? 'prev-arrow' : 'next-arrow']?.({
        currentSlide: state.currentSlide,
        slideCount: state.slideCount,
      });
      const custom = collectChildren(content).length > 0;
      return h(
        'button',
        {
          type: 'button',
          disabled,
          'aria-label': isPrev
            ? isRTL.value
              ? locale.value.nextSlide
              : locale.value.prevSlide
            : isRTL.value
              ? locale.value.prevSlide
              : locale.value.nextSlide,
          'data-role': 'none',
          class: [
            'slick-arrow',
            isPrev ? 'slick-prev' : 'slick-next',
            { 'slick-disabled': disabled, 'slick-arrow-custom': custom },
          ],
          style: 'display:block',
          onClick: (event: MouseEvent) => {
            if (!event.defaultPrevented && !disabled)
              engine.changeSlide({ message: isPrev ? 'previous' : 'next' });
          },
        },
        [content],
      );
    };

    // ============================== Render ==============================
    return () => {
      // ⚠️ slot 只能在 render 里调用（见 childrenCount 注释）；数量变化在这里同步
      const nextChildren = collectChildren(slots.default?.());
      const changed =
        nextChildren.length !== currentChildren.length ||
        nextChildren.some(
          (child, index) =>
            child.key !== currentChildren[index]?.key ||
            child.type !== currentChildren[index]?.type,
        );
      currentChildren = nextChildren;
      if (currentChildren.length !== childrenCount.value) {
        childrenCount.value = currentChildren.length;
        engine.setSlideCount(currentChildren.length);
      }
      if (changed) slidesVersion.value += 1;
      const { class: nativeClass, style: nativeStyle, ...rootAttrs } = attrs;
      const cls = context.getPrefixCls('carousel', props.prefixCls);
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
            onClickCapture: engine.onListClickCapture,
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

      // Native attrs belong to the actual root; semantic slider inputs stay inside.
      return h(
        'div',
        mergeProps(
          {
            ref: rootRef,
            class: [
              cls,
              {
                [`${cls}-rtl`]: isRTL.value,
                [`${cls}-vertical`]: c.vertical,
              },
            ],
            id: props.id,
          },
          rootAttrs,
          {
            class: nativeClass,
            style: [themeStyles.value, dotDurationStyle, nativeStyle],
            onFocusin: engine.onSlideFocus,
            onFocusout: engine.onSlideBlur,
            onKeydown: (event: KeyboardEvent) => {
              emit('keydown', event);
              if (event.target instanceof Node && engine.listRef.value?.contains(event.target))
                engine.onListKeyDown(event);
            },
          },
        ),
        [
          h(
            'div',
            {
              class: [
                'slick-slider',
                // 语义槽在前、deprecated 的 React 名在后（后者覆盖前者，保证旧代码行为不变）
                context.classNames?.slider,
                props.classNames?.slider,
                props.className,
                context.className,
                { 'slick-vertical': c.vertical, 'slick-initialized': true },
              ],
              dir: 'ltr',
              style: [context.styles?.slider, context.style, props.styles?.slider],
            },
            [
              prevArrow,
              h(
                'div',
                {
                  ref: engine.listRef,
                  class: 'slick-list',
                  tabindex: c.accessibility && !st.unslick ? 0 : undefined,
                  ...listHandlers,
                },
                [
                  h(
                    'div',
                    {
                      ref: engine.trackRef,
                      class: 'slick-track',
                      style: trackStyleString.value,
                      onMouseenter: engine.onTrackOver,

                      onMouseleave: engine.onTrackLeave,
                    },
                    renderTrackSlides(),
                  ),
                ],
              ),
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
