/**
 * 基础 `Icon`（`component` / `children` / `viewBox` 形态）。
 *
 * 契约来源：`@ant-design/icons` 的 `components/Icon.ts`。它是包的**默认导出**，
 * `createFromIconfontCN` 建立在它之上，也是「自定义 SVG 组件」的入口。
 *
 * 与 `createIcon` 产出的图标组件的区别（与 antd 一致）：
 *   - 根 span 上**没有** `aria-label`（图标名未知）
 *   - 内容由 slot 或 `component` 提供，而不是图标定义
 *   - `spin` 对 span 的影响要求**同时**存在 `component`；svg 上则一律加
 */

import type { Component } from 'vue';
import { defineComponent, h, type PropType, type VNode } from 'vue';
import { classNames } from './class-names';
import { DEFAULT_ICON_PREFIX_CLS, useIconContext } from './context';
import { svgBaseProps, warning } from './render';

/**
 * 自定义图标组件的 svg props。
 *
 * 与 antd 的 `CustomIconComponentProps` 对应；Vue 侧不强制 `width`/`height` 的类型，
 * 因为 `component` 收到的是我们构造的 props 对象，类型由调用方自己保证。
 */
export interface CustomIconComponentProps {
  width: string | number;
  height: string | number;
  fill?: string;
  viewBox?: string;
  class?: string;
  color?: string;
  style?: Record<string, string>;
}

export const Icon = defineComponent({
  name: 'AIcon',
  inheritAttrs: false,
  props: {
    /** 自定义 svg 组件。与 `children` 互斥，`component` 优先（与 antd 一致）。 */
    component: { type: [Object, Function] as PropType<Component>, default: undefined },
    /** svg 的 `color` 属性。 */
    color: { type: String, default: undefined },
    /** svg 的 `viewBox`。省略时由调用方保证 `children` 自带正确的坐标系。 */
    viewBox: { type: String, default: undefined },
    spin: { type: Boolean, default: false },
    rotate: { type: Number, default: undefined },
    tabIndex: { type: Number, default: undefined },
    /**
     * 可访问名。
     *
     * ⚠️ antd 的 `IconComponentProps` 声明了这个 prop，但 `components/Icon.ts` **没有消费它** ——
     * 结果是它以 `arialabel="…"` 的形式泄漏到 DOM（React 对未识别的驼峰属性就是这个行为）。
     * 我们不复刻这个缺陷，改为映射到 `aria-label`。见 `COMPATIBILITY.md` D17（DEFECT）。
     */
    ariaLabel: { type: String, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const context = useIconContext();

    return (): VNode => {
      const { prefixCls = DEFAULT_ICON_PREFIX_CLS, rootClassName } = context.value;
      const component = props.component;
      const hasComponent = component !== undefined && component !== null;

      const mergedClassName = classNames(
        rootClassName,
        prefixCls,
        // `spin` 只在有 `component` 时才给 span 加类；svg 上则一律加。这条不对称是 antd 的实测行为
        // （见基线用例 `icon:children-spin`：span 无 `-spin`，svg 有）。
        { [`${prefixCls}-spin`]: !!props.spin && hasComponent },
        attrs.class,
      );
      const svgClassName = classNames({ [`${prefixCls}-spin`]: !!props.spin });
      // 真值判断（antd 原文）：`rotate: 0` 不产生 style 属性。
      const svgStyle = props.rotate ? { transform: `rotate(${props.rotate}deg)` } : undefined;

      const innerSvgProps: Record<string, unknown> = {
        ...svgBaseProps,
        color: props.color,
        class: svgClassName,
        style: svgStyle,
      };
      // antd 是先无条件放入 `viewBox` 再 delete，语义等价于「缺省即不输出」。
      if (props.viewBox) {
        innerSvgProps.viewBox = props.viewBox;
      }

      const children = slots.default?.() ?? [];
      const hasChildren = children.length > 0;

      warning(hasComponent || hasChildren, 'Should have `component` prop or `children`.');

      let innerNode: VNode | null = null;
      if (hasComponent) {
        // antd 是 `createElement(Component, innerSvgProps, children)` —— 有 children 才传第三个参数。
        // Vue 侧对应「传不传默认插槽」，写成恒传会让空内容的自定义组件收到一个空插槽。
        innerNode = hasChildren
          ? h(component, innerSvgProps, () => children)
          : h(component, innerSvgProps);
      } else if (hasChildren) {
        warning(
          Boolean(props.viewBox) || (children.length === 1 && children[0]?.type === 'use'),
          'Make sure that you provide correct `viewBox` prop (default `0 0 1024 1024`) to the icon.',
        );
        innerNode = h('svg', innerSvgProps, children);
      }

      let tabIndex = props.tabIndex;
      if (tabIndex === undefined && attrs.onClick) {
        tabIndex = -1;
      }

      const restAttrs: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(attrs)) {
        if (key !== 'class') restAttrs[key] = value;
      }

      return h(
        'span',
        {
          role: 'img',
          ...(props.ariaLabel === undefined ? {} : { 'aria-label': props.ariaLabel }),
          ...restAttrs,
          tabindex: tabIndex,
          class: mergedClassName,
        },
        innerNode ? [innerNode] : undefined,
      );
    };
  },
});
