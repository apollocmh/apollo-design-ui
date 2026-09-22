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
 * ── 四条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 *   1. **初始 visible = `visibilityHeight === 0`**（不是 false）。
 *   2. **handleScroll 是 raf 节流**：一帧内多次 scroll 只跑第一次入参；
 *      卸载必须 `cancel()`。
 *   3. **fade 无 CSS**（G1 §2.8：antd 产物同样没有 `-fade` keyframes）——
 *      不「顺手补」动画样式。
 *   4. **`:empty` 兜底**：children 渲染为空时根 div 无子节点 → CSS 隐藏。
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
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    visibilityHeight: { type: Number, default: 400 },
    duration: { type: Number, default: 450 },
    target: { type: Function as PropType<BackTopTarget>, default: undefined },
    onClick: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
  },
  setup(props, { slots, attrs, expose }) {
    const { getPrefixCls, direction } = useComponentConfig('back-top');

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

    const handleScroll = throttleByAnimationFrame((e?: { target?: unknown }) => {
      const scrollTop = getScroll(e?.target as ScrollTarget);
      visible.value = (scrollTop ?? 0) >= props.visibilityHeight;
    });

    let currentContainer: ScrollTarget = null;

    const bindScroll = () => {
      const getTarget = props.target ?? getDefaultTarget;
      const container = getTarget() as ScrollTarget;
      // 立即校准一次可见性（antd 的 useEffect 里同样先 handleScroll）
      handleScroll({ target: container });
      // ScrollTarget 含测试形状（{ scrollTop }），监听需按 EventTarget 侧写
      (container as EventTarget | null)?.addEventListener(
        'scroll',
        handleScroll as unknown as EventListener,
      );
      currentContainer = container;
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
      // antd 的 omit(props, [...])：class/style 已被框架消费，其余 attrs 透传
      const restAttrs: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(attrs)) {
        if (key !== 'class' && key !== 'style') {
          restAttrs[key] = value;
        }
      }

      const rootClass = [
        prefixCls.value,
        { [`${prefixCls.value}-rtl`]: direction === 'rtl' },
        props.className,
        props.rootClassName,
      ];

      return h(
        'div',
        {
          ref: rootRef,
          ...restAttrs,
          class: rootClass,
          style: props.style,
          onClick: scrollToTop,
        },
        [
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
        ],
      );
    };
  },
});
