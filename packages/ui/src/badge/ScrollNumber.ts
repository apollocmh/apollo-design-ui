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
  type CSSProperties,
  computed,
  defineComponent,
  h,
  type PropType,
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
  setup(props) {
    const prefixCls = computed(() => props.prefixCls ?? 'apollo-scroll-number');

    /** 仅整数拆位（antd：`count && Number(count) % 1 === 0`）。 */
    const isInteger = computed(() => {
      const c = props.count;
      return !!c && isNumber(c) && Number(c) % 1 === 0;
    });

    return () => {
      const cls = [prefixCls.value, props.className, props.motionClassName];

      let numberNodes: VNodeChild = props.count;
      if (isInteger.value) {
        const list = String(props.count).split('');
        numberNodes = h(
          'bdi',
          list.map((num, i) =>
            /\d/.test(num)
              ? h(SingleNumber, {
                  key: list.length - i,
                  prefixCls: prefixCls.value,
                  count: Number(props.count),
                  value: num,
                })
              : h('span', { class: `${prefixCls.value}-symbol` }, num),
          ),
        );
      }

      return h(
        props.component ?? 'sup',
        {
          'data-show': props.show,
          class: cls,
          style: props.style,
          title: props.title,
        },
        [numberNodes],
      );
    };
  },
});
