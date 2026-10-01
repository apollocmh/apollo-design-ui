/**
 * Masonry 的单项渲染（上游 `MasonryItem.tsx`，53 行）。
 *
 * ⚠️ 为什么是 `.ts` 而不是 `.vue`（`COMPONENT-RULES.md` §2 的**条件 1**：
 *    「组件是**纯渲染函数型**内部件」）：
 * 它的全部工作是把**三个来源**的 class / style 按固定顺序合成，再渲染一个由外部
 * 传入的 `content` vnode（内容由父组件按 `item.children ?? itemRender(...)` 生成 ——
 * 那里才有泛型）。模板表达不了「按 key 查表 + 三源定序合并」，而 `v-bind` 一个
 * 无类型对象会丢掉绑定检查。理由同步登记在 `README.md` §3。
 *
 * ── 三源定序（逐字照抄上游 `Masonry.tsx:288-294`）────────────────────────────
 *
 * ```
 * style = { ...motionStyle, ...mergedStyles.item, ...itemStyle }
 * class = [ `${prefixCls}-item`, mergedClassNames.item, motionClassName ]
 * ```
 *
 * ⚠️ **顺序有意义**：`itemStyle` 里的 `position/width/top` 必须能盖掉用户传的
 * `styles.item`；`motionStyle` 在最底层（动效的 `display:none` 之类要让位给布局）。
 */

import { observeResize } from '@apollo-design/utils';
import { defineComponent, h, onScopeDispose, type PropType, type VNodeChild } from 'vue';
import { toCssSize } from '../../_internal/to-css-size';
import type { GutterValue } from '../../grid/interface';

/**
 * 单项的**布局**数据。
 *
 * ⚠️ 只有布局 —— 业务数据（`item.data` 等）由 `content` 承载，
 * 这样本组件就**没有泛型**，可以被模板按类型绑定。
 */
export interface MasonryItemLayout {
  /** 落在第几列（0 基）。 */
  columnIndex: number;
  /** 纵向偏移（px）。SSR / 未量测时是 `undefined`（⇒ 不写 `top`）。 */
  top: number | undefined;
}

/** 上游 `const { column: columnIndex = 0 } = position` 的等价默认值。 */
export const DEFAULT_ITEM_LAYOUT: MasonryItemLayout = { columnIndex: 0, top: undefined };

export const MasonryItem = defineComponent({
  name: 'AMasonryItem',
  props: {
    prefixCls: { type: String, required: true },
    /**
     * `MotionList` 槽回传的 `itemKey`。
     * ⚠️ 它是 **`String()` 化**过的（`parseKeys` 的行为，上游同款）。
     */
    itemKey: { type: String, required: true },
    /** 落在第几列（0 基）。父组件按 key 查表给出，缺省 `0`。 */
    columnIndex: { type: Number, default: 0 },
    /** 纵向偏移（px）。未量测时 `undefined` ⇒ 不写 `top`。 */
    top: { type: Number as PropType<number | undefined>, default: undefined },
    /** `MotionList` 槽回传的动效类名。 */
    motionClassName: { type: String as PropType<string | undefined>, default: undefined },
    /** `MotionList` 槽回传的动效样式（可能是 `null`）。 */
    motionStyle: {
      type: Object as PropType<Record<string, string | number> | null>,
      default: undefined,
    },
    /** 语义化 `classNames.item`。 */
    itemClassName: { type: String as PropType<string | undefined>, default: undefined },
    /** 语义化 `styles.item`。 */
    itemStyle: {
      type: Object as PropType<Record<string, string | number> | undefined>,
      default: undefined,
    },
    /**
     * 已渲染好的内容（`item.children ?? itemRender({...item, index, column})`）。
     *
     * ⚠️ 用 `type: null` 关掉运行期校验 —— `VNodeChild` 里既有 vnode 又有
     * 字符串 / 数组，没有合适的构造器（picker-panel 同判）。
     */
    content: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    columnCount: { type: Number, required: true },
    /**
     * 水平间距。上游把它直接插进 `calc` 字符串（`${horizontalGutter}px`）——
     * `Gutter` 类型允许 `string`（antd 的 grid 也这么定），所以这里不收窄成 `Number`。
     */
    horizontalGutter: {
      type: [Number, String] as PropType<GutterValue>,
      required: true,
    },
    /** 组件作用域变量名：`--apollo-masonry-item-width`（见 `style/index.ts` 的说明）。 */
    itemWidthVar: { type: String, required: true },
    /** 把元素登记回父组件的 key → element 表。 */
    setItemRef: {
      type: Function as PropType<(key: string, el: HTMLDivElement | null) => void>,
      required: true,
    },
    /**
     * `fresh` 时为非 `undefined` ⇒ 给本 item 单独挂一个 `ResizeObserver`。
     *
     * ⚠️ 上游传的是 `null`；本仓用 `undefined`（`PropType<(() => void) | null>` 与
     * `type: Function` 在 TS 下不兼容，而 `undefined` 对内部 prop 语义完全等价）。
     */
    onResize: { type: Function as PropType<(() => void) | undefined>, default: undefined },
  },
  setup(props) {
    let disposeResize: (() => void) | null = null;

    /**
     * 🚨 用**函数 ref**（而不是 `onVnodeMounted`）：这个 vnode 是**本组件自己的
     * 渲染函数**创建的，owner 有效 ⇒ `ref:` 是安全的。
     * （「渲染期之外创建的 vnode 不许带 `ref:`」—— PITFALLS 264 —— 不适用于这里。）
     *
     * ⚠️ 参数类型照抄 `Selector.ts` 的既有写法（Vue 实际传的是
     * `Element | { $el } | null`），否则 `h()` 的 `ref` 重载选不中。
     *
     * ⚠️ 上游把 `composeRef(motionRef, itemRef)` 合起来用；本仓不需要 motionRef
     * （`MotionList` 的槽不回传 ref），所以这里就是纯登记 + 挂观察者。
     */
    const attach = (el: Element | { $el?: Element } | null | undefined): void => {
      const next = ((el as HTMLDivElement | null) ?? null) as HTMLDivElement | null;
      props.setItemRef(props.itemKey, next);
      disposeResize?.();
      disposeResize = null;
      if (next && props.onResize) {
        disposeResize = observeResize(next, props.onResize);
      }
    };

    onScopeDispose(() => {
      disposeResize?.();
    });

    return () => {
      // 上游：`const { column: columnIndex = 0 } = position`（position 可能不存在）
      const { columnIndex, top } = props;

      const style: Record<string, string | number | undefined> = {
        ...props.motionStyle,
        ...props.itemStyle,
        // ① 组件作用域变量：先在本元素上声明，②③ 的 `var()` 才取得到
        //    （自定义属性对内联样式**同元素**可见 —— 与上游 genCssVar 的用法一致）
        [props.itemWidthVar]: `calc((100% + ${props.horizontalGutter}px) / ${props.columnCount})`,
        // ② 横向：列偏移 + 宽度（宽度要减掉一个水平间距）
        insetInlineStart: `calc(var(${props.itemWidthVar}) * ${columnIndex})`,
        width: `calc(var(${props.itemWidthVar}) - ${props.horizontalGutter}px)`,
        // ③ 纵向：🚨 数字必须过 `toCssSize()`（Vue 的 patchStyle 不补 px，PITFALLS 170）
        top: toCssSize(top),
        position: 'absolute',
      };

      return h(
        'div',
        {
          ref: attach,
          class: [`${props.prefixCls}-item`, props.itemClassName, props.motionClassName],
          style,
        },
        [props.content],
      );
    };
  },
});
