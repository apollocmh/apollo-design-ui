/**
 * Anchor —— 锚点导航。对应 antd 6.6.4 的 `es/anchor/Anchor.tsx`（453 行）。
 *
 * 契约全文见 `docs/analysis/anchor.md`（G1 产物）；下面只留**实现期最容易写错的判据**。
 *
 * ── 为什么是 `.ts` 而不是 `.vue`（`COMPONENT-RULES.md` §2 **条件 2**）────────────
 *
 * 「渲染树深度动态、由数据驱动的分支远超模板表达能力」：
 * ① `items` 是**递归**的（`createNestedLink` 逐层展开成 `AnchorLink` 的 children）；
 * ② 同一份 `anchorContent` 要在 **affix / 非 affix 两个分支**里复用
 *    （模板里只能靠 `<component :is="vnode">` 或复制一份，前者不可靠、后者会漂移）；
 * ③ 类名与样式是**多来源定序合并**（`clsx` 的实参顺序即契约）。
 * 理由同步登记在 `README.md` §3；`splitter/Splitter.ts` 是同类先例。
 *
 * ── 六条必须复刻的上游行为 ───────────────────────────────────────────────────
 *
 * 1. 🚨 **滚动监听的依赖是 `JSON.stringify(links)`**（不是 `links` 身份），
 *    且**不含 `getContainer`** ⇒ 容器 prop 变了**不会重挂**（UPSTREAM，不擅自改）。
 * 2. 🚨 **`onChange` 收到的是原始 `link`**（不是 `getCurrentAnchor` 改写后的 `newLink`）；
 *    且 `forceTriggerChange` 为真时**即使与当前值相同也会发**。
 * 3. **`animating` 期间 `handleScroll` 直接 return**（动画中不抢高亮）。
 * 4. **点击滚动**：动画中且目标与上次相同 ⇒ return；否则**取消上一次**（`scrollRequestId`）。
 * 5. **`getCurrentAnchor` 变化** ⇒ 用 `rawActiveLinkRef` 重跑一次 `setCurrentActiveLink`。
 * 6. **`-fixed` 的判据是 `!affix && !showInkInFixed`**；`-rtl` 落在 **wrapper** 上。
 */

import {
  getScroll,
  isFunction,
  isNumber,
  isPlainObject,
  useDevWarning,
} from '@apollo-design/utils';
import scrollIntoView from 'scroll-into-view-if-needed';
import {
  computed,
  defineComponent,
  h,
  onMounted,
  onScopeDispose,
  onUpdated,
  type PropType,
  provide,
  reactive,
  ref,
  shallowRef,
  type VNodeChild,
  watch,
  watchEffect,
} from 'vue';
import { scrollTo } from '../_internal/scroll-to';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { Affix } from '../affix';
import { useComponentConfig, useConfigContext } from '../config-provider/context';
import { AnchorLink } from './AnchorLink';
import { type AnchorContextValue, anchorContextKey } from './context';
import type {
  AnchorAffixConfig,
  AnchorContainer,
  AnchorLinkItemProps,
  AnchorProps,
  AnchorSemanticClassNames,
  AnchorSemanticStyles,
} from './interface';

/** 上游 `getDefaultContainer`。 */
const getDefaultContainer = (): AnchorContainer => window;

/**
 * 上游 `getOffsetTop(element, container)` —— 三条分支逐字。
 *
 * ⚠️ `getClientRects().length === 0` ⇒ **0**（元素不可见/未渲染）；
 * ⚠️ 宽高都为 0 时**不走容器分支**，直接返回 `rect.top`。
 */
function getOffsetTop(element: HTMLElement, container: AnchorContainer): number {
  if (!element.getClientRects().length) {
    return 0;
  }

  const rect = element.getBoundingClientRect();

  if (rect.width || rect.height) {
    if (container === window) {
      return rect.top - (element.ownerDocument.documentElement?.clientTop ?? 0);
    }
    return rect.top - (container as HTMLElement).getBoundingClientRect().top;
  }

  return rect.top;
}

/** 从 `#id` 里抓 id（上游逐字）。 */
const sharpMatcherRegex = /#([^\t\r\n\f\v]+)$/;

interface Section {
  link: string;
  top: number;
}

export const Anchor = defineComponent({
  name: 'AAnchor',
  props: {
    prefixCls: { type: String as PropType<string | undefined>, default: undefined },
    className: { type: String as PropType<string | undefined>, default: undefined },
    rootClassName: { type: String as PropType<string | undefined>, default: undefined },
    style: {
      type: Object as PropType<Record<string, string | number> | undefined>,
      default: undefined,
    },
    classNames: {
      type: [Object, Function] as PropType<AnchorProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<AnchorProps['styles']>, default: undefined },

    items: { type: Array as PropType<AnchorLinkItemProps[] | undefined>, default: undefined },
    direction: { type: String as PropType<AnchorProps['direction']>, default: undefined },

    offsetTop: { type: Number as PropType<number | undefined>, default: undefined },
    bounds: { type: Number as PropType<number | undefined>, default: undefined },
    targetOffset: { type: Number as PropType<number | undefined>, default: undefined },
    // 🚨 默认 **true**（与 antd 一致）；`undefined` 视为未传 ⇒ 取默认
    affix: { type: [Boolean, Object] as PropType<AnchorProps['affix']>, default: undefined },
    showInkInFixed: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    getContainer: { type: Function as PropType<AnchorProps['getContainer']>, default: undefined },
    getCurrentAnchor: {
      type: Function as PropType<AnchorProps['getCurrentAnchor']>,
      default: undefined,
    },
    replace: { type: Boolean as PropType<boolean | undefined>, default: undefined },

    onChange: { type: Function as PropType<AnchorProps['onChange']>, default: undefined },
    onClick: { type: Function as PropType<AnchorProps['onClick']>, default: undefined },
  },
  emits: {
    /** 当前锚点变化（与 `onChange` prop 是同一条通路 —— emit 自己会调它）。 */
    change: (_currentActiveLink: string) => true,
  },
  setup(props, { slots, emit }) {
    // ======================= Warning =======================
    const devWarning = useDevWarning('Anchor');
    watchEffect(() => {
      devWarning.deprecated(slots.default === undefined, 'Anchor children', 'items');
      devWarning(
        !(
          (props.direction ?? 'vertical') === 'horizontal' &&
          // ⚠️ 上游是 `'children' in n`；Vue 的对象上「键存在」≈「值非 undefined」
          props.items?.some((n) => n.children !== undefined)
        ),
        '`Anchor items#children` is not supported when `Anchor` direction is horizontal.',
      );
    });

    // ======================= MISC =======================
    const context = useComponentConfig<{
      className?: string;
      style?: Record<string, string | number>;
      classNames?: AnchorSemanticClassNames;
      styles?: AnchorSemanticStyles;
    }>('anchor');
    const configContext = useConfigContext();

    const prefixCls = computed(() => context.getPrefixCls('anchor', props.prefixCls));
    const anchorDirection = computed(() => props.direction ?? 'vertical');
    /** 上游 `affix = true` 的默认值（Vue 侧用 `undefined` 表达「未传」）。 */
    const mergedAffix = computed(() => props.affix ?? true);
    const showInkInFixed = computed(() => props.showInkInFixed ?? false);

    /**
     * 解析顺序：`props.getContainer` ?? `ConfigProvider.getTargetContainer` ?? `window`（上游 `:194`）。
     *
     * ⚠️ `GetTargetContainer` 的返回类型比 `AnchorContainer` **宽**（还允许 `ShadowRoot`），
     * 而 antd 的 `AnchorContainer` 就是 `HTMLElement | Window` ⇒ 在边界收窄。
     * `affix/Affix.vue:110-114` 是**同一处理**（那里的注释写明了理由：上游自己的类型就是窄的，
     * `ShadowRoot` 走进 `getOffsetTop` 会因没有 `getBoundingClientRect` 而失败 —— 上游既有缺口）。
     */
    const getCurrentContainer = (): AnchorContainer => {
      const resolve = props.getContainer ?? configContext.getTargetContainer ?? getDefaultContainer;
      // ⚠️ 收窄见上面的说明（`GetTargetContainer` 的返回类型含 `ShadowRoot`）
      return resolve() as AnchorContainer;
    };

    // ======================= State =======================
    const links = shallowRef<string[]>([]);
    const activeLink = ref<string | null>(null);
    /** 与 `activeLink` 同步的镜像（`getCurrentAnchor` 改写**后**的值）。 */
    let activeLinkRef: string | null = null;
    /** 用户点击/滚动产生的**原始** link（`getCurrentAnchor` 改写**前**）。 */
    let rawActiveLinkRef: string | null = null;

    const wrapperRef = ref<HTMLElement | null>(null);
    const spanLinkNodeRef = ref<HTMLElement | null>(null);
    /** ⚠️ 不参与渲染 ⇒ 普通 `let`（不是 `ref`）。 */
    let animating = false;
    let scrollRequestId: (() => void) | null = null;
    const linkTargetOffset: Record<string, number> = {};

    // ======================= Link 注册 =======================
    const registerLink = (link: string, newTargetOffset?: number): void => {
      if (!links.value.includes(link)) {
        links.value = [...links.value, link];
      }
      // Store link-level targetOffset for scroll detection
      if (newTargetOffset !== undefined) {
        linkTargetOffset[link] = newTargetOffset;
      }
    };

    const unregisterLink = (link: string): void => {
      links.value = links.value.filter((i) => i !== link);
      delete linkTargetOffset[link];
    };

    // ======================= 当前锚点 =======================
    const getInternalCurrentAnchor = (
      currentLinks: string[],
      offsetTop: number,
      bounds = 5,
      targetOffsets?: Record<string, number>,
    ): string => {
      const linkSections: Section[] = [];
      const container = getCurrentContainer();

      for (const link of currentLinks) {
        const sharpLinkMatch = sharpMatcherRegex.exec(link?.toString() ?? '');
        if (!sharpLinkMatch) {
          continue;
        }
        const target = document.getElementById(sharpLinkMatch[1] as string);
        if (target) {
          // Use link-level targetOffset if provided, otherwise use global offsetTop
          const linkOffsetTop = targetOffsets?.[link] ?? offsetTop;
          const top = getOffsetTop(target, container);
          if (top <= linkOffsetTop + bounds) {
            linkSections.push({ link, top });
          }
        }
      }

      if (linkSections.length) {
        const maxSection = linkSections.reduce((prev, curr) => (curr.top > prev.top ? curr : prev));
        return maxSection.link;
      }
      return '';
    };

    const setCurrentActiveLink = (link: string, forceTriggerChange = false): void => {
      rawActiveLinkRef = link;

      // https://github.com/ant-design/ant-design/issues/30584
      const newLink = isFunction(props.getCurrentAnchor) ? props.getCurrentAnchor(link) : link;
      const isSameLink = activeLinkRef === newLink;

      if (isSameLink && !forceTriggerChange) {
        return;
      }

      if (!isSameLink) {
        activeLink.value = newLink;
        activeLinkRef = newLink;
      }

      // onChange should respect the original link (which may caused by
      // window scroll or user click), not the new link
      //
      // ⚠️ **只 `emit`**：Vue 的 `emit('change')` 自己会去调 `props.onChange`
      // （`toHandlerKey` 映射）—— 再手写一遍就是两次（PITFALLS 267）。
      emit('change', link);
    };

    const handleScroll = (): void => {
      if (animating) {
        return;
      }

      const currentActiveLink = getInternalCurrentAnchor(
        links.value,
        isNumber(props.targetOffset) ? props.targetOffset : props.offsetTop || 0,
        props.bounds,
        linkTargetOffset,
      );

      setCurrentActiveLink(currentActiveLink);
    };

    const handleScrollTo = (link: string, targetOffsetParams?: number): void => {
      const previousRawActiveLink = rawActiveLinkRef;
      setCurrentActiveLink(link, previousRawActiveLink !== link);

      const sharpLinkMatch = sharpMatcherRegex.exec(link);
      if (!sharpLinkMatch) {
        return;
      }
      const targetElement = document.getElementById(sharpLinkMatch[1] as string);
      if (!targetElement) {
        return;
      }

      if (animating) {
        if (previousRawActiveLink === link) {
          return;
        }
        scrollRequestId?.();
      }

      const container = getCurrentContainer();
      const scrollTop = getScroll(container) ?? 0;
      const eleOffsetTop = getOffsetTop(targetElement, container);
      let y = scrollTop + eleOffsetTop;
      const finalTargetOffset = targetOffsetParams ?? props.targetOffset ?? props.offsetTop ?? 0;
      y -= finalTargetOffset;

      animating = true;
      scrollRequestId = scrollTo(y, {
        getContainer: getCurrentContainer,
        callback() {
          animating = false;
        },
      });
    };

    // ======================= ink =======================
    /**
     * 把当前锚点的几何写进 ink 的内联样式。
     *
     * @returns 是否**处理完毕**。`false` 只有一种情形：`activeLink` 已经有值，
     *   但 DOM 里还查不到 `-link-title-active`（渲染还没 commit）⇒ 调用方必须
     *   **重试**（见 `syncInk` 的说明）。
     */
    const updateInk = (): boolean => {
      const linkNode = wrapperRef.value?.querySelector<HTMLElement>(
        `.${prefixCls.value}-link-title-active`,
      );
      if (!linkNode) {
        // 没有 active 链接是**合法**状态（`activeLink` 为空）⇒ 算处理完；
        // 有 active 却查不到节点 ⇒ 渲染没 commit ⇒ 交给调用方重试。
        return !activeLink.value;
      }
      const inkNode = spanLinkNodeRef.value;
      if (!inkNode) {
        return false;
      }
      const inkStyle = inkNode.style;
      const horizontalAnchor = anchorDirection.value === 'horizontal';
      inkStyle.top = horizontalAnchor ? '' : `${linkNode.offsetTop + linkNode.clientHeight / 2}px`;
      inkStyle.height = horizontalAnchor ? '' : `${linkNode.clientHeight}px`;
      inkStyle.left = horizontalAnchor ? `${linkNode.offsetLeft}px` : '';
      inkStyle.width = horizontalAnchor ? `${linkNode.clientWidth}px` : '';
      if (horizontalAnchor) {
        scrollIntoView(linkNode, { scrollMode: 'if-needed', block: 'nearest' });
      }
      return true;
    };

    // ======================= 语义化 =======================
    /**
     * ⚠️ 与 Spin / Result / masonry 同法：`useMergeSemantic` 在 `setup` 期捕获 props 对象
     * ⇒ 传一个**身份稳定、内容会变**的普通对象（函数式变体读到的 `props.direction`
     * 必须是**解析后的方向** —— 上游传的是 `mergedProps = {...props, direction: anchorDirection}`）。
     */
    const semanticProps: AnchorProps = { ...props };
    watchEffect(() => {
      Object.assign(semanticProps, props, { direction: anchorDirection.value });
    });

    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      AnchorProps,
      AnchorSemanticClassNames,
      AnchorSemanticStyles
    >(
      [() => context.classNames, () => props.classNames],
      [
        () => context.styles,
        () => semanticRootStyle(context.style),
        () => props.styles,
        () => semanticRootStyle(props.style),
      ],
      semanticProps,
    );

    // ======================= 类名 / 样式 =======================
    const wrapperClass = computed(() => [
      // 本仓无 hashId（D2）；`-css-var` 与上游 `useCSSVarCls` 同名（D3）
      `${prefixCls.value}-css-var`,
      props.rootClassName,
      `${prefixCls.value}-wrapper`,
      anchorDirection.value === 'horizontal' ? `${prefixCls.value}-wrapper-horizontal` : undefined,
      context.direction === 'rtl' ? `${prefixCls.value}-rtl` : undefined,
      props.className,
      context.className,
      mergedClassNames.value.root,
    ]);

    const anchorClass = computed(() => [
      prefixCls.value,
      // 🚨 判据是 `!affix && !showInkInFixed`（两个都假才加）
      !mergedAffix.value && !showInkInFixed.value ? `${prefixCls.value}-fixed` : undefined,
    ]);

    const inkClass = computed(() => [
      `${prefixCls.value}-ink`,
      mergedClassNames.value.indicator,
      activeLink.value ? `${prefixCls.value}-ink-visible` : undefined,
    ]);

    const wrapperStyle = computed(() => ({
      maxHeight: props.offsetTop ? `calc(100vh - ${props.offsetTop}px)` : '100vh',
      ...mergedStyles.value.root,
    }));

    // ======================= Context =======================
    /**
     * ⚠️ 必须是 `reactive`：`inject` 只在子组件的 `setup` 期解析一次，
     * 子组件要在 `activeLink` 变化时重渲染就必须**读到被追踪的值**。
     * 用一个 `watchEffect` 把最新的值 `Object.assign` 进来（见 `context.ts` 的说明）。
     */
    const contextValue = reactive<AnchorContextValue>({
      registerLink,
      unregisterLink,
      activeLink: null,
      scrollTo: handleScrollTo,
      onClick: props.onClick,
      direction: anchorDirection.value,
      classNames: undefined,
      styles: undefined,
    });

    watchEffect(() => {
      Object.assign(contextValue, {
        activeLink: activeLink.value,
        onClick: props.onClick,
        direction: anchorDirection.value,
        classNames: mergedClassNames.value,
        styles: mergedStyles.value,
      });
    });

    provide(anchorContextKey, contextValue);

    // ======================= Effects =======================
    /**
     * 见文件头第 1 条：依赖是 `JSON.stringify(links)`，且**不含 `getContainer`**。
     *
     * 🚨 两处 Vue 侧的必要处理：
     * 1. **不能用 `immediate: true`** —— 它在 **`setup` 期同步**跑（不受 `flush` 影响），
     *    那时 `links` 还是空数组 ⇒ 会先挂一次、注册完再挂一次（实测挂 **2** 次）。
     *    上游的 `useEffect` 在**子组件注册完之后**才跑（React 的子 effect 先于父 effect）⇒ 只挂一次。
     *    本仓用 `onMounted` 复刻这个时机（子组件的 `setup` 在父组件渲染期就跑完了 ⇒ 那时 links 已就绪）。
     * 2. `lastLinks` 快照：跳过「挂载前那次注册导致的依赖变化」，否则 `onMounted` 与 watcher 会各挂一次。
     */
    const linksDependency = computed(() => JSON.stringify(links.value));

    let disposeScrollListener: (() => void) | null = null;
    let attachedContainer: AnchorContainer | null = null;
    const syncScrollListener = (): void => {
      const scrollContainer = getCurrentContainer();
      // ⚠️ 同一个容器**不重复挂**（`onMounted` 与 watcher 都会调到这里）；
      //    上游每次都 remove+add，但监听器是同一个函数 ⇒ 净效果一致（D7 家族）。
      if (scrollContainer !== attachedContainer) {
        disposeScrollListener?.();
        scrollContainer?.addEventListener('scroll', handleScroll);
        attachedContainer = scrollContainer;
        disposeScrollListener = () => {
          scrollContainer?.removeEventListener('scroll', handleScroll);
          attachedContainer = null;
        };
      }
      handleScroll();
    };

    let lastLinksDependency = '';
    onMounted(() => {
      lastLinksDependency = linksDependency.value;
      syncScrollListener();
    });
    watch(
      linksDependency,
      (next) => {
        if (next === lastLinksDependency) {
          return;
        }
        lastLinksDependency = next;
        syncScrollListener();
      },
      { flush: 'post' },
    );
    onScopeDispose(() => {
      disposeScrollListener?.();
    });

    // 见文件头第 5 条
    watch(
      () => props.getCurrentAnchor,
      () => {
        if (isFunction(props.getCurrentAnchor)) {
          setCurrentActiveLink(rawActiveLinkRef ?? '');
        }
      },
      { flush: 'post' },
    );

    /**
     * ink 的触发（上游 `useEffect([anchorDirection, getCurrentAnchor, JSON.stringify(links), activeLink])`）。
     *
     * 🚨 **必须挂在 `onUpdated` 上，不能只用 post watcher。**
     * 原因：`handleScroll` 会在 **post flush 期间**改 `activeLink`（挂载时的首次调用就在
     * `onMounted` 里），而 Vue 会把这个 watcher 的 post 任务排进**同一批** post 队列 ⇒
     * 它跑在**下一次渲染之前**，那时子组件还没加上 `-link-title-active` ⇒
     * `querySelector` 找不到目标、ink 的内联样式**永远写不进去**（2026-10-01 探针实测：
     * `hasActiveTitle: false` 而 `activeLink` 已是 `#a`）。
     *
     * `onUpdated` 在**每次 commit 之后**跑 —— 与 React 的 `useEffect` 同一时机 ✓。
     * 用「依赖键」去重，避免比上游多跑（`updateInk` 里还有 `scrollIntoView` 这个副作用）。
     *
     * 🚨 **依赖键只在 `updateInk()` 真的写成功时才提交**（2026-10-01 探针实测的坑）：
     * `onMounted(syncInk)` 与「设置 `activeLink` 的那个 `onMounted`」（`syncScrollListener`）
     * 在**同一批 mounted 钩子**里，而前者注册得更晚 ⇒ 它跑的时候 `activeLink` 已经是
     * `#section-a`，但**渲染还没 commit**、DOM 里没有 `-link-title-active`。
     * 若这时就把依赖记下，紧随其后的 `onUpdated` 会因为「依赖没变」直接 return
     * ⇒ ink 的内联样式**永远写不进去**（症状：ink 的 rect 是 `[16,16,2,0]`，
     * 而 React 侧是 `[16,20,2,22]`）。
     */
    let lastInkDeps = {
      dir: '',
      links: '',
      active: null as string | null,
      getCurrent: undefined as unknown,
    };
    const syncInk = (): void => {
      const next = {
        dir: anchorDirection.value,
        links: linksDependency.value,
        active: activeLink.value,
        getCurrent: props.getCurrentAnchor as unknown,
      };
      if (
        next.dir === lastInkDeps.dir &&
        next.links === lastInkDeps.links &&
        next.active === lastInkDeps.active &&
        next.getCurrent === lastInkDeps.getCurrent
      ) {
        return;
      }
      // ⚠️ 失败（DOM 还没 commit）时**不提交**依赖键 ⇒ 下一次 `onUpdated` 会重试。
      if (updateInk()) {
        lastInkDeps = next;
      }
    };
    onMounted(syncInk);
    onUpdated(syncInk);

    // ======================= Render =======================
    /**
     * 递归展开 `items`（上游 `createNestedLink`）。
     *
     * 🚨 **必须把 `children` 从 item 里摘出来**再 spread：`AnchorLink` 的 `children`
     * 在 Vue 侧是**插槽**而不是 prop（规则 C19）⇒ 不摘的话它会落进 **`attrs`**，
     * 被绑到 `AnchorLink` 的根 `div` 上 —— 实测报
     * 「Failed setting prop "children" on <div> … has only a getter」并**破坏渲染**。
     * （`PITFALLS 3` 同族：未声明的 prop ⇒ 归进 attrs ⇒ 静默失效。）
     */
    const createNestedLink = (options?: AnchorLinkItemProps[]): VNodeChild =>
      Array.isArray(options)
        ? options.map(({ children: nestedItems, ...item }) =>
            h(
              AnchorLink,
              { ...item, replace: props.replace, key: item.key },
              {
                // 上游：`anchorDirection === 'vertical' && createNestedLink(item.children)`
                default:
                  anchorDirection.value === 'vertical'
                    ? () => createNestedLink(nestedItems)
                    : undefined,
              },
            ),
          )
        : null;

    const affixProps = isPlainObject(mergedAffix.value)
      ? (mergedAffix.value as AnchorAffixConfig)
      : undefined;

    return () => {
      const anchorContent = h(
        'div',
        { ref: wrapperRef, class: wrapperClass.value, style: wrapperStyle.value },
        [
          h('div', { class: anchorClass.value }, [
            h('span', {
              class: inkClass.value,
              ref: spanLinkNodeRef,
              style: mergedStyles.value.indicator,
            }),
            // 上游：`'items' in props ? createNestedLink(items) : children`
            // ⚠️ Vue 的 props 恒含全部声明键 ⇒ 判据只能是**值**（D4）
            props.items !== undefined ? createNestedLink(props.items) : slots.default?.(),
          ]),
        ],
      );

      if (!mergedAffix.value) {
        return anchorContent;
      }

      return h(
        Affix,
        {
          offsetTop: props.offsetTop,
          target: getCurrentContainer,
          ...affixProps,
        },
        { default: () => anchorContent },
      );
    };
  },
});

export default Anchor;
