/**
 * Step 的图标外壳 —— rc-steps `StepIcon.js`（33 行）的 Vue 自建。
 *
 * 本体是「类名/样式三层合并」的哑 div：rc StepsContext（prefixCls + 组件级
 * classNames/styles）+ StepIconSemanticContext（item 级 classNames.icon/styles.icon）
 * + 使用者 className。
 */

import type { CSSProperties } from 'vue';
import { computed, defineComponent, h, inject, type PropType, provide, type Ref, unref } from 'vue';

/** StepIcon 的三层合并上下文（rc 的 StepsContext 相关切片）。 */
export interface StepsIconContextValue {
  prefixCls: string;
  classNames?: Record<string, string | undefined>;
  styles?: Record<string, CSSProperties | undefined>;
}

export const stepsIconContextKey = Symbol('stepsIconContext');

export const stepIconSemanticContextKey = Symbol('stepIconSemanticContext');

/**
 * 波纹目标类（**固定常量**，不随 `prefixCls` 变）。
 *
 * 契约：antd 的 `<Wave component="div">` 会给图标加 `ant-wave-target`（**恒定**，
 * 三个 item 全有 —— 与 status / type / disabled 无关，已由 L4 基线逐条确认）。
 * 本仓 **不实现波纹**（Wave 基建未落地，与 radio / checkbox / button / skeleton 同判，
 * 见 `COMPATIBILITY.md` 的 **D43**），但**类名逐字保留** —— 它是 L4 产物对齐的一部分。
 *
 * ⚠️ 与 `radio/Radio.ts` / `checkbox/Checkbox.ts` 一样**本地定义**（那两处也是各自定义的，
 * 不跨组件 import）。
 */
export const WAVE_TARGET_CLS = 'ant-wave-target';

/** item 级 icon 语义（Step provide，StepIcon inject）。 */
export type StepIconSemantic = { className?: string; style?: CSSProperties };

export const StepIcon = defineComponent({
  name: 'AStepIcon',
  inheritAttrs: false,
  props: {
    className: { type: String, default: undefined },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const ctx = inject<StepsIconContextValue>(stepsIconContextKey, {
      prefixCls: 'apollo-steps',
    });
    const itemSemanticRef = inject<Ref<StepIconSemantic> | StepIconSemantic>(
      stepIconSemanticContextKey,
      {},
    );
    const itemSemantic = computed<StepIconSemantic>(() => unref(itemSemanticRef));

    return () => {
      const itemCls = `${ctx.prefixCls}-item`;
      const itemClassName = itemSemantic.value.className;
      const itemStyle = itemSemantic.value.style;
      // rc：div 的 children = 使用者传入的内容（status 图标 / 序号 / 进度环）
      const children = slots.default?.();
      return h(
        'div',
        {
          ...attrs,
          class: [
            `${itemCls}-icon`,
            // ⚠️ 恒定加上（D43：不实现波纹，但类名逐字保留 —— L4 产物对齐）
            WAVE_TARGET_CLS,
            ctx.classNames?.itemIcon,
            itemClassName,
            props.className,
          ]
            .filter(Boolean)
            .join(' '),
          style: { ...ctx.styles?.itemIcon, ...itemStyle, ...props.style },
        },
        children ?? [],
      );
    };
  },
});

/** Step 在 setup 期向 StepIcon 下发 item 级语义（rc 的 StepIconSemanticContext.Provider）。 */
export function provideStepIconSemantic(value: Ref<StepIconSemantic>): void {
  provide(stepIconSemanticContextKey, value);
}

export default StepIcon;
