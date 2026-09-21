/**
 * ScrollNumber —— 数字滚动容器（Badge 内部组件，不公开导出）。
 *
 * 契约来源：antd 6.6.4 的 `es/badge/ScrollNumber.js`（逐条对齐）。
 *
 * ── 为什么用 render 函数而不是 SFC ────────────────────────────────────────────
 *
 * antd 的 children 分支是 `cloneElement(children, ...)`（count 为 VNode 时
 * 注入 `-custom-component` 类 + motionClassName）—— Vue 对应 `cloneVNode`，
 * 需要拿到 vnode 对象本身，SFC 模板表达不了。写法上沿用 spin/Indicator 的
 * `.ts` + `h()` 范式（仓库不引 JSX 运行时）。
 *
 * ── 判据 ─────────────────────────────────────────────────────────────────────
 *
 *   1. **仅整数才拆位**：`count && Number(count) % 1 === 0` → `<bdi>` +
 *      SingleNumber 列表（key = 倒序 index）；其余（'99+' 字符串、VNode）原样渲染。
 *   2. **旧用法兼容**：`style.borderColor` → `boxShadow: 0 0 0 1px {borderColor} inset`
 *      （antd 原注释：mock border-color by box-shadow）。
 *   3. `data-show` 落在根元素（antd 的 `newProps['data-show'] = show`）。
 */

import { isNumber } from '@apollo-design/utils';
import {
  Comment,
  type CSSProperties,
  cloneVNode,
  computed,
  defineComponent,
  h,
  type PropType,
  type VNode,
  type VNodeChild,
} from 'vue';
import SingleNumber from './SingleNumber.vue';

type ScrollNumberCount = VNodeChild;

export default defineComponent({
  name: 'AScrollNumber',
  props: {
    prefixCls: { type: String, default: undefined },
    count: { type: [Number, String, Object] as PropType<ScrollNumberCount>, default: null },
    className: {
      type: [String, Array, Object] as PropType<string | Record<string, boolean> | unknown[]>,
      default: undefined,
    },
    motionClassName: { type: String, default: undefined },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
    title: { type: String, default: undefined },
    show: { type: Boolean, default: false },
    component: { type: String, default: 'sup' },
  },
  setup(props, { slots }) {
    const prefixCls = computed(() => props.prefixCls ?? 'apollo-scroll-number');

    const mergedStyle = computed<CSSProperties>(() => {
      const style = props.style;
      // allow specify the border（antd 原注释）
      const borderColor = (style as Record<string, unknown> | undefined)?.borderColor;
      if (style && borderColor) {
        return { ...style, boxShadow: `0 0 0 1px ${String(borderColor)} inset` };
      }
      return style ?? {};
    });

    /** 仅整数拆位（antd：`count && Number(count) % 1 === 0`）。 */
    const isInteger = computed(() => {
      const c = props.count;
      return !!c && isNumber(c) && Number(c) % 1 === 0;
    });

    return () => {
      const cls = [prefixCls.value, props.className, props.motionClassName];

      // children 分支：count 为 VNode（antd 的 displayNode）—— clone 注入类。
      // antd 的 cloneElement 只改 className 与保留 style；Vue 侧 class 以数组合并。
      // ⚠️ 必须过滤 Comment：Vue 的 `v-if=false` 插槽内容是**注释 vnode**（truthy），
      // 不过滤的话 comment 会被当成 count VNode 走 clone 分支，真 count 反而丢了
      //（2026-09-22 badge L1 实测：整数拆位整个消失）。
      const children =
        (slots.default?.() as VNode[] | undefined)?.filter((v) => v.type !== Comment) ?? [];
      const first = children[0];
      if (first) {
        return cloneVNode(first, {
          class: [
            `${prefixCls.value}-custom-component`,
            (first.props as { class?: unknown } | null)?.class,
            props.motionClassName,
          ],
          style: props.style,
        });
      }

      let numberNodes: VNode | string | number | undefined = props.count as
        | VNode
        | string
        | number
        | undefined;
      if (isInteger.value) {
        const list = String(props.count).split('');
        numberNodes = h(
          'bdi',
          list.map((num, i) =>
            h(SingleNumber, {
              key: list.length - i,
              prefixCls: prefixCls.value,
              count: Number(props.count),
              value: num,
            }),
          ),
        );
      }

      return h(
        props.component ?? 'sup',
        {
          'data-show': props.show,
          class: cls,
          style: mergedStyle.value,
          title: props.title,
        },
        numberNodes,
      );
    };
  },
});
