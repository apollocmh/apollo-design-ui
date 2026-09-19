/**
 * 指示器分发器：自定义指示器 or 默认 Looper。
 *
 * 契约来源：antd 6.6.4 的 `components/spin/Indicator/index.tsx`。
 *
 * ── 唯一的判据：`indicator` 是不是「可克隆的元素」───────────────────────────────
 *
 * antd：`indicator && React.isValidElement(indicator)` → `cloneElement(...)`，
 * 否则 → `<Looper />`。
 * 我们：`isVNode(indicator)` → `cloneVNode(...)`，否则 → `h(Looper, ...)`。
 *
 * 克隆时注入的三件事与 antd 逐字对应：
 *
 *   1. `class` —— `clsx(currentProps.className, dotClassName, className)`，
 *      即**用户自己的类名在前**，`${prefixCls}-dot` 与语义化的
 *      `classNames.indicator` 追加在后。Vue 的 `cloneVNode` 走 `mergeProps`，
 *      对 `class` 做的是拼接而不是覆盖 —— 语义一致。
 *   2. `style` —— `{...currentProps.style, ...style}`（语义化的 `styles.indicator` 胜）。
 *      Vue 的 `mergeProps` 对 `style` 同样是浅合并、后者胜。
 *   3. `percent` —— 直接作为 prop 传下去，用户组件可以声明它来渲染进度
 *      （antd 的测试 `custom indicator has percent` 就断言这一条）。
 *
 * ── `percent` 必须**显式**传，不能靠 fallthrough ──────────────────────────────
 *
 * `Looper` 的根节点是 Fragment，`Indicator` 的根节点可能是用户的任意组件 ——
 * Vue 的 attrs 自动继承对「渲染 Fragment 的组件」不生效（会告警并丢弃）。
 * 所以这里把 `class` / `style` / `percent` 全都当成**声明过的 prop** 往下传，
 * 而不是让它们落进 `$attrs`。
 */

import { isVNode } from '@apollo-design/utils';
import {
  type CSSProperties,
  type PropType,
  type VNodeChild,
  cloneVNode,
  defineComponent,
  h,
} from 'vue';
import { Looper } from './Looper';

export const Indicator = defineComponent({
  name: 'ASpinIndicator',
  props: {
    prefixCls: { type: String, required: true },
    indicator: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    percent: { type: Number as PropType<number | undefined>, default: undefined },
    className: { type: String, default: undefined },
    style: { type: null as unknown as PropType<CSSProperties | undefined>, default: undefined },
  },
  setup(props) {
    return () => {
      const dotClassName = `${props.prefixCls}-dot`;

      if (isVNode(props.indicator)) {
        return cloneVNode(props.indicator, {
          class: [dotClassName, props.className],
          style: props.style,
          percent: props.percent,
        });
      }

      return h(Looper, {
        prefixCls: props.prefixCls,
        percent: props.percent,
        className: props.className,
        style: props.style,
      });
    };
  },
});
