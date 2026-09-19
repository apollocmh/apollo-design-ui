/**
 * `defaultRenderEmpty` —— 下游组件（Table / List / Select …）的空状态兜底。
 *
 * 契约来源：antd 6.6.4 的 `components/config-provider/defaultRenderEmpty.tsx`（51 行）。
 *
 * ── 为什么这个文件能 import `empty`，而 context.ts 不能 ────────────────────────
 *
 * `empty` 组件反过来会 import `config-provider/context`（读 `useComponentConfig`）。
 * 若 `context.ts` 也 import `empty`，就形成 `empty → context → empty` 的环。
 * 所以 `RenderEmptyHandler` 类型住在 `context.ts`（叶子），渲染器住在**本文件** ——
 * 依赖方向是单向的 `defaultRenderEmpty → {context, empty}`。
 * 这也是 antd 自己的切法（它的注释：`🚨 Do not pass defaultRenderEmpty here
 * since it will cause circular dependency`）。
 */

import { defineComponent, h, type PropType } from 'vue';
import { Empty, PRESENTED_IMAGE_SIMPLE } from '../empty';
import type { RenderEmptyComponentName } from './context';
import { useConfigContext } from './context';

/**
 * 默认的空状态渲染组件。
 *
 * 与 antd 的 `DefaultRenderEmpty` 逐分支对应：
 *
 * | `componentName` | 产物 |
 * |---|---|
 * | `Table` / `List` | `<Empty image={PRESENTED_IMAGE_SIMPLE} />` |
 * | `Select` / `TreeSelect` / `Cascader` / `Transfer` / `Mentions` | 同上 + `className="${prefix}-small"` |
 * | `Table.filter` | `null`（交给 Table 自己决定，上游的注释已说明） |
 * | 其余 / `undefined` | `<Empty />` |
 *
 * ⚠️ `getPrefixCls` 在 **render 函数里**调用，不是 setup 期 ——
 *    它读的是响应式源，`prefixCls` 变化能被追踪（见 `context.ts` 的响应式说明）。
 */
export const DefaultRenderEmpty = defineComponent({
  name: 'ADefaultRenderEmpty',
  props: {
    componentName: {
      type: String as PropType<RenderEmptyComponentName>,
      default: undefined,
    },
  },
  setup(props) {
    const { getPrefixCls } = useConfigContext();

    return () => {
      const prefix = getPrefixCls('empty');

      switch (props.componentName) {
        case 'Table':
        case 'List':
          return h(Empty, { image: PRESENTED_IMAGE_SIMPLE });

        case 'Select':
        case 'TreeSelect':
        case 'Cascader':
        case 'Transfer':
        case 'Mentions':
          return h(Empty, {
            image: PRESENTED_IMAGE_SIMPLE,
            className: `${prefix}-small`,
          });

        /**
         * `null` 是上游的显式选择（注释：`legacy react16 node type undefined is not
         * allowed`）⇒ Vue 侧同样返回 `null`，渲染成注释节点，语义一致。
         */
        case 'Table.filter':
          return null;

        default:
          return h(Empty);
      }
    };
  },
});

/**
 * 函数形态的默认渲染器（`RenderEmptyHandler`）。
 *
 * 下游组件的写法：
 *
 * ```ts
 * const { renderEmpty } = useComponentConfig('table');
 * const node = (renderEmpty ?? defaultRenderEmpty)('Table');
 * ```
 */
export function defaultRenderEmpty(componentName?: RenderEmptyComponentName): unknown {
  return h(DefaultRenderEmpty, { componentName });
}
