/**
 * 分隔符（上游 `es/breadcrumb/BreadcrumbSeparator.tsx`，31 行）。
 *
 * ── 为什么是 `.ts` 而不是 `.vue`（`COMPONENT-RULES.md` §2 条件 1）──────────────
 *
 * 它要渲染一个 **`VNodeChild` 插槽内容**，并且内容规则里有一条**值判定**
 * （`children === '' ? children : children ?? '/'`）—— 模板里写不出「空串要原样保留」
 * 这个分支（`v-if="children"` 会把 `''` 当 falsy）。渲染函数更直接。
 * 理由同步登记在 `README.md` §3。
 *
 * ── 三条上游判据（容易写错）──────────────────────────────────────────────────
 *
 * 1. **没有 `prefixCls` prop** —— 前缀取自 `ConfigContext` 的 `getPrefixCls('breadcrumb')`，
 *    与 `AnchorLink` 同族（PITFALLS 272：L4 基线生成器**每个用例都要包 ConfigProvider**）。
 * 2. 内容是 `children === '' ? children : children ?? '/'` —— **空串原样保留**
 *    （不是回退成 `'/'`）。⚠️ 该分支只在「直接用 `<Breadcrumb.Separator>''</…>`」或
 *    `items` 里 `type:'separator'` + `separator:''` 时可达（最后一项的 `separator=''`
 *    会被 `isRenderable` 拦在**不渲染**那一侧，见分析 §6.1）。
 * 3. `aria-hidden="true"` 是**字符串** `'true'`（不是布尔）—— 与上游一致。
 */

import { computed, defineComponent, h, inject, Text, type VNode, type VNodeChild } from 'vue';
import { useConfigContext } from '../config-provider/context';
import { breadcrumbContextKey } from './context';

/**
 * 把插槽内容归一成上游 `children` 的语义。
 *
 * 🚨 **平台差异**：React 的 `children` 是**值**（`''` 就是空串），而 Vue 的插槽会把它
 * 包成 `[Text('')]` ⇒ 不归一的话 `children === ''` 那条分支**永远不可达**。
 */
function normalizeChildren(nodes: VNodeChild[] | undefined): VNodeChild {
  if (!nodes || nodes.length === 0) {
    return undefined;
  }
  if (nodes.length === 1) {
    const only = nodes[0] as VNode | null | undefined;
    if (only && typeof only === 'object' && only.type === Text && only.children === '') {
      return '';
    }
  }
  return nodes;
}

export const BreadcrumbSeparator = defineComponent({
  name: 'ABreadcrumbSeparator',
  setup(_, { slots }) {
    const config = useConfigContext();
    const context = inject(breadcrumbContextKey, undefined);
    const prefixCls = computed(() => config.getPrefixCls('breadcrumb'));

    return () => {
      const children = normalizeChildren(slots.default?.());

      return h(
        'li',
        {
          class: [`${prefixCls.value}-separator`, context?.classNames?.separator],
          style: context?.styles?.separator,
          'aria-hidden': 'true',
        },
        // 上游：`children === '' ? children : children ?? '/'`
        children === '' ? '' : (children ?? '/'),
      );
    };
  },
});

export default BreadcrumbSeparator;
