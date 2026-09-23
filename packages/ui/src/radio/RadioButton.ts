/**
 * RadioButton —— `Radio.Button`（按钮形态的单选）。
 *
 * 契约来源：antd 6.6.4 的 `es/radio/radioButton.js`（源码 `components/radio/
 * radioButton.tsx`，31 行）。
 *
 * antd 的实现只有三件事：
 *   1. `getPrefixCls('radio', customizePrefixCls)` —— 与 Radio 同一前缀；
 *   2. 用 `RadioOptionTypeContextProvider value="button"` 包住 Radio；
 *   3. 强制 `type="radio"`。
 *
 * ⚠️ 它**不产任何自己的 DOM** —— 形态完全由 `Radio` 读 `RadioOptionTypeContext`
 *    后把 `prefixCls` 换成 `${radioPrefixCls}-button` 决定（见 `Radio.ts` 判据 6）。
 *    所以本组件是「上下文 + 转发」型，`ref` 需要手动转发到内部 Radio 的 expose。
 */

import { computed, defineComponent, h, shallowRef, type VNodeProps } from 'vue';
import { useComponentConfig } from '../config-provider/context';
import { provideRadioOptionTypeContext } from './context';
import type { RadioProps, RadioRef } from './interface';
import { RadioComponent, radioPropDefs } from './Radio';

export const ButtonComponent = defineComponent({
  name: 'ARadioButton',
  inheritAttrs: false,
  props: radioPropDefs,
  setup(props, { attrs, expose, slots }) {
    // 形态切换通道：让内部 Radio 读到 optionType='button'
    provideRadioOptionTypeContext('button');

    const { getPrefixCls } = useComponentConfig('radio');
    const prefixCls = computed(() => getPrefixCls('radio', props.prefixCls));

    const innerRef = shallowRef<RadioRef | null>(null);

    expose({
      focus: (options?: FocusOptions) => innerRef.value?.focus(options),
      blur: () => innerRef.value?.blur(),
      get input() {
        return innerRef.value?.input ?? null;
      },
      get nativeElement() {
        return innerRef.value?.nativeElement ?? null;
      },
    } satisfies RadioRef);

    return () =>
      h(
        RadioComponent as unknown as (
          props: Record<string, unknown> & VNodeProps,
        ) => ReturnType<typeof h>,
        {
          ...props,
          // ⚠️ attrs（onChange / onClick / onFocus / … 这些 props 形态回调）必须一起
          //    转发 —— 否则 RadioButton 上的事件会静默丢失。
          ...(attrs as Record<string, unknown>),
          prefixCls: prefixCls.value,
          ref: innerRef,
        },
        slots,
      );
  },
});

/** 兼容类型引用（避免 props 类型仅被类型层消费时的告警）。 */
export type { RadioProps };

export const Button = ButtonComponent;
export default Button;
