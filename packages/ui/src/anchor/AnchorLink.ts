/**
 * Anchor 的单条链接（上游 `es/anchor/AnchorLink.tsx`，122 行）。
 *
 * ── 为什么是 `.ts` 而不是 `.vue`（`COMPONENT-RULES.md` §2 条件 1 的变体）────────
 *
 * 它要渲染一个 **`VNodeChild` prop**（`title`）—— 模板里渲染 vnode 只能靠
 * `<component :is="() => vnode" />`（`tour/demo/actions-render.vue` 就是这么写的），
 * 但那会**每次渲染换一个组件类型** ⇒ Vue 走「卸载 + 重挂」⇒ 焦点/DOM 状态丢失。
 * 加上「children 只在垂直方向渲染」这个条件分支，渲染函数比模板更直接。
 * 理由同步登记在 `README.md` §3。
 *
 * ── 三条上游判据（容易写错）──────────────────────────────────────────────────
 *
 * 1. **注册/注销的时机**：上游 `useEffect([href, targetOffset])` —— 依赖变化时
 *    **先 cleanup（注销旧 href）再 effect（注册新 href）**。
 *    ⚠️ 这意味着改 `href` 会把该链接**挪到 `links` 数组末尾**（顺序 = 注册顺序），
 *    而 `getInternalCurrentAnchor` 依赖这个顺序 ⇒ 照抄（不要「优化」成原地替换）。
 * 2. **点击的三段**：① 先 `onClick`（自定义签名）；② 再 `scrollTo`；
 *    ③ `e.defaultPrevented` ⇒ **直接 return**（用户 `preventDefault` 后不接管历史）。
 * 3. **外链**（`http://` / `https://` 开头）：`replace` 时 `preventDefault` +
 *    `location.replace`，否则**什么都不做**（交给浏览器默认行为）；
 *    **内链**：`preventDefault` + `history[pushState|replaceState](null, '', href)`。
 */

import { useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  inject,
  onScopeDispose,
  type PropType,
  watch,
  watchEffect,
} from 'vue';
import { useConfigContext } from '../config-provider/context';
import { anchorContextKey } from './context';
import type { AnchorLinkProps } from './interface';

export const AnchorLink = defineComponent({
  name: 'AAnchorLink',
  props: {
    prefixCls: { type: String as PropType<string | undefined>, default: undefined },
    href: { type: String, required: true },
    target: { type: String as PropType<string | undefined>, default: undefined },
    /**
     * ⚠️ `VNodeChild`（字符串 / vnode / 数组都可能）⇒ `type: null` 关掉运行期校验
     * （`picker-panel.ts` 同判）。
     */
    title: { type: null as unknown as PropType<AnchorLinkProps['title']>, default: undefined },
    className: { type: String as PropType<string | undefined>, default: undefined },
    replace: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    targetOffset: { type: Number as PropType<number | undefined>, default: undefined },
  },
  setup(props, { slots }) {
    const context = inject(anchorContextKey, undefined);
    const config = useConfigContext();

    const prefixCls = computed(() => config.getPrefixCls('anchor', props.prefixCls));
    /** 高亮判据：**原始 `href`** 与 context 里的 `activeLink` 相等。 */
    const active = computed(() => context?.activeLink === props.href);

    // ---------------------------------------------------------------- 告警
    // 上游在渲染期每次检查；本仓用 `watchEffect`（setup 期 + 依赖变化时）——
    // 与 radio 的既有写法一致（`'usage'` 这一档在本仓被折进 message，见 radio 的注释）。
    const devWarning = useDevWarning('Anchor.Link');
    watchEffect(() => {
      devWarning(
        !slots.default || context?.direction !== 'horizontal',
        '`Anchor.Link children` is not supported when `Anchor` direction is horizontal',
      );
    });

    // ---------------------------------------------------------------- 注册
    // 见文件头第 1 条：依赖变化时**先注销旧的、再注册新的**（顺序即契约）。
    watch(
      () => [props.href, props.targetOffset] as const,
      (next, prev) => {
        if (prev) {
          context?.unregisterLink(prev[0]);
        }
        context?.registerLink(next[0], next[1]);
      },
      { immediate: true },
    );

    onScopeDispose(() => {
      context?.unregisterLink(props.href);
    });

    // ---------------------------------------------------------------- 点击
    const handleClick = (e: MouseEvent): void => {
      context?.onClick?.(e, { title: props.title, href: props.href });
      context?.scrollTo?.(props.href, props.targetOffset);

      // Support clicking on an anchor does not record history.
      if (e.defaultPrevented) {
        return;
      }

      const isExternalLink = props.href.startsWith('http://') || props.href.startsWith('https://');
      if (isExternalLink) {
        if (props.replace) {
          e.preventDefault();
          window.location.replace(props.href);
        }
        return;
      }

      e.preventDefault();
      const historyMethod = props.replace ? 'replaceState' : 'pushState';
      window.history[historyMethod](null, '', props.href);
    };

    return () => {
      const base = prefixCls.value;
      return h(
        'div',
        {
          class: [
            `${base}-link`,
            props.className,
            context?.classNames?.item,
            active.value ? `${base}-link-active` : undefined,
          ],
          style: context?.styles?.item,
        },
        [
          h(
            'a',
            {
              class: [
                `${base}-link-title`,
                context?.classNames?.itemTitle,
                active.value ? `${base}-link-title-active` : undefined,
              ],
              style: context?.styles?.itemTitle,
              href: props.href,
              // 上游：只有字符串 title 才写 `title` 属性（vnode 没法当 tooltip）
              title: typeof props.title === 'string' ? props.title : undefined,
              target: props.target,
              onClick: handleClick,
            },
            [props.title],
          ),
          // 上游：`direction !== 'horizontal' ? children : null`
          context?.direction !== 'horizontal' ? slots.default?.() : null,
        ],
      );
    };
  },
});

export default AnchorLink;
