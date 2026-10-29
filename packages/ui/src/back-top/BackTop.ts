/**
 * BackTop —— 回到顶部。
 *
 * 契约来源：antd 6.6.4 的 `es/back-top/index.js`。判据逐条对齐（G1 分析 §2），
 * 有意差异登记在 `packages/ui/src/back-top/README.md` 与 `COMPATIBILITY.md` §9。
 *
 * ── 为什么是 render 函数 ──────────────────────────────────────────────────────
 *
 * children 要被 `cloneVNode` 注入 motionClassName（antd 的 cloneElement 分支，
 * badge/ScrollNumber、border-beam 同范式）—— SFC 模板表达不了。
 *
 * ── 五条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 *   1. **初始 visible = `visibilityHeight === 0`**（不是 false）。
 *   2. **handleScroll 是 raf 节流**：一帧内多次 scroll 只跑第一次入参；
 *      卸载必须 `cancel()`。
 *   3. **fade 无 CSS**（G1 §2.8：antd 产物同样没有 `-fade` keyframes）——
 *      不「顺手补」动画样式。
 *   4. **`:empty` 兜底**：children 渲染为空时根 div 无子节点 → CSS 隐藏。
 *   5. 🚨 **校准有两条路径**：滚动事件走**节流**的 `handleScroll`；初始挂载 /
 *      换 target / 改 `visibilityHeight` 走**同步**的 `syncVisible`。
 *      因为 `throttleByAnimationFrame` 的语义是「第一次调用**排到下一帧**」，
 *      拿它做初始校准会让已滚过阈值的页面先渲染「不可见」再翻转（**闪烁**）。
 *      （Issue #55）
 */

import { VerticalAlignTopOutlined } from '@apollo-design/icons';
import { CSSMotion } from '@apollo-design/motion';
import {
  getScroll,
  isVNode,
  type ScrollTarget,
  throttleByAnimationFrame,
  useDevWarning,
} from '@apollo-design/utils';
import {
  cloneVNode,
  computed,
  defineComponent,
  h,
  mergeProps,
  onMounted,
  onScopeDispose,
  type PropType,
  ref,
  shallowRef,
  type VNode,
  watch,
} from 'vue';
import { scrollTo } from '../_internal/scroll-to';
import { useComponentConfig } from '../config-provider/context';
import type { BackTopTarget } from './interface';

export default defineComponent({
  name: 'ABackTop',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    visibilityHeight: { type: Number, default: 400 },
    duration: { type: Number, default: 450 },
    target: { type: Function as PropType<BackTopTarget>, default: undefined },
    onClick: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
  },
  setup(props, { slots, attrs, expose }) {
    const config = useComponentConfig('back-top');
    const { getPrefixCls } = config;

    const prefixCls = computed(() => getPrefixCls('back-top', props.prefixCls));
    const rootPrefixCls = computed(() => getPrefixCls());

    // -------------------------------------------------------------------------
    // 废弃告警（antd 逐字；antd 每次 render 检查，我们 setup 期发一次 —— PLATFORM）
    // -------------------------------------------------------------------------
    const warning = useDevWarning('BackTop');
    warning.deprecated(true, 'BackTop', 'FloatButton.BackTop');

    // -------------------------------------------------------------------------
    // visible 状态与滚动监听
    // -------------------------------------------------------------------------

    /** antd 逐字：`useState(visibilityHeight === 0)`。 */
    const visible = ref(props.visibilityHeight === 0);

    const rootRef = shallowRef<HTMLElement | null>(null);
    expose({
      get nativeElement() {
        return rootRef.value;
      },
    });

    /** antd 逐字：`ref.current?.ownerDocument || window`。 */
    const getDefaultTarget = (): HTMLElement | Window | Document =>
      rootRef.value?.ownerDocument ?? window;

    let currentContainer: ScrollTarget = null;

    /** 唯一的可见性判据：容器滚动量 vs **现读**的 `visibilityHeight`。 */
    const applyVisible = (container: ScrollTarget): void => {
      visible.value = (getScroll(container) ?? 0) >= props.visibilityHeight;
    };

    /** 滚动事件回调（按帧节流，antd 逐字）。 */
    const handleScroll = throttleByAnimationFrame((e?: { target?: unknown }) => {
      applyVisible((e?.target ?? currentContainer) as ScrollTarget);
    });

    /**
     * **同步**校准（不经 rAF）。
     *
     * 为什么不能直接用 `handleScroll`：它是 `throttleByAnimationFrame` 包装的，
     * 而该节流器的语义是「**第一次调用不立即执行**，排到下一帧」—— 用它做初始校准，
     * 已经滚过阈值的页面会先渲染「不可见」再在下一帧翻成「可见」，也就是**闪烁**。
     * 所以初始挂载 / 换 target / 改阈值都走这条同步路径，只有滚动事件走节流路径。
     */
    const syncVisible = (): void => {
      applyVisible(currentContainer);
    };

    const bindScroll = () => {
      const getTarget = props.target ?? getDefaultTarget;
      const container = getTarget() as ScrollTarget;
      currentContainer = container;
      // 同步校准一次（先于注册监听 ⇒ 首帧就是对的，不闪烁）
      syncVisible();
      // ScrollTarget 含测试形状（{ scrollTop }），监听需按 EventTarget 侧写
      (container as EventTarget | null)?.addEventListener(
        'scroll',
        handleScroll as unknown as EventListener,
      );
    };

    const unbindScroll = () => {
      handleScroll.cancel();
      (currentContainer as EventTarget | null)?.removeEventListener(
        'scroll',
        handleScroll as unknown as EventListener,
      );
      currentContainer = null;
    };

    onMounted(bindScroll);
    onScopeDispose(unbindScroll);
    // antd 的 useEffect 依赖 [target] —— target 变化时重绑
    watch(
      () => props.target,
      () => {
        if (rootRef.value) {
          unbindScroll();
          bindScroll();
        }
      },
    );
    // 🚨 `visibilityHeight` 变化 ⇒ **无需滚动事件**立即重算（Issue #55）。
    //    上游 useEffect 的依赖只有 `[target]`，改阈值后要等下一次 scroll 才生效；
    //    本仓补这条 watch ⇒ 动态阈值的语义符合开发者预期（改了就该立刻反映）。
    watch(() => props.visibilityHeight, syncVisible);

    // -------------------------------------------------------------------------
    // 点击回顶（antd 顺序：先滚动后回调）
    // -------------------------------------------------------------------------

    const scrollToTop = (e: MouseEvent) => {
      scrollTo(0, {
        getContainer: () => (props.target ? props.target() : getDefaultTarget()) as ScrollTarget,
        duration: props.duration,
      });
      props.onClick?.(e);
    };

    /** 默认元素：-content > -icon（antd 逐字）。 */
    const defaultElement = (motionClassName: string): VNode =>
      h('div', { class: [motionClassName, `${prefixCls.value}-content`] }, [
        h('div', { class: `${prefixCls.value}-icon` }, [h(VerticalAlignTopOutlined)]),
      ]);

    return () => {
      // 根 `class` / `style` 是 Vue 原生 attrs：`attrs` 整体交给 mergeProps 合并。
      // ⚠️ `onClick` 放在 `attrs` **之后** —— antd 的 `{...restProps, onClick: scrollToTop}`
      //    让内置滚动处理器胜出（用户传的 onClick 被覆盖）。
      const rootProps = mergeProps(
        {
          ref: rootRef,
          class: [prefixCls.value, { [`${prefixCls.value}-rtl`]: config.direction === 'rtl' }],
        },
        attrs,
        { onClick: scrollToTop },
      );

      return h('div', rootProps, [
        h(
          CSSMotion,
          { visible: visible.value, motionName: `${rootPrefixCls.value}-fade` },
          {
            default: ({ className: motionClassName }: { className: string }) => {
              // antd：cloneElement(children || defaultElement, 注入 motionClassName)
              const raw = slots.default?.() as VNode[] | VNode | undefined;
              const childNodes = Array.isArray(raw) ? raw : raw !== undefined ? [raw] : [];
              const first = childNodes[0];
              if (isVNode(first)) {
                return cloneVNode(first, { class: motionClassName });
              }
              return defaultElement(motionClassName);
            },
          },
        ),
      ]);
    };
  },
});
