/**
 * 测试探针：把 ConfigProvider 注入的东西暴露出来给断言用。
 *
 * 为什么需要它：ConfigProvider 自己**不产 DOM**，能观测的只有「它对下游产生了什么影响」。
 * 所以每个用例都在它里面挂一个只做读取的探针组件 —— 与 antd 的测试用
 * `<ConfigConsumer>` / `useContext` 读值是同一个手法。
 *
 * ⚠️ 探针必须在 **ConfigProvider 的子树里**：`inject` 只沿父链解析，
 *    同一个 setup 里 provide 的东西自己拿不到（PITFALLS 37）。
 */

import { localeContextKey, useLocale } from '@apollo-design/locale';
import { computed, defineComponent, h, inject, toValue } from 'vue';
import { useComponentConfig, useConfigContext, useDirection, useThemeConfig } from '../context';
import type { ConfigContextValue } from '../context';
import { useDisabled } from '../disabled-context';
import type { ConfigProviderThemeConfig } from '../hooks/use-theme';
import { type SizeType, useSize } from '../size-context';

/** 探针读到的全部值。每次渲染都会刷新，所以断言到的是**最新**值。 */
export interface ProbeCapture {
  config: ConfigContextValue;
  /** `useSize()` 的结果（已合并 context 与组件自己的 prop） */
  size: SizeType | undefined;
  /** `useDisabled()` 的结果 */
  disabled: boolean;
  /** `useDirection()` 的结果（响应式路径） */
  direction: 'ltr' | 'rtl' | undefined;
  theme: ConfigProviderThemeConfig | undefined;
  /** `useComponentConfig(name)` 的结果 */
  componentConfig: Record<string, unknown>;
  /** `useLocale('Empty').description` —— 验证 locale 真的传导下来了 */
  emptyDescription: string | undefined;
  localeCode: string | undefined;
  /**
   * 直接读 `localeContextKey` 的当前值（绕过 `useLocale` 的 setup 期快照）。
   *
   * 为什么要两条：`useLocale` 目前**不是响应式**的（memory 的 D24，属于 locale 包
   * 的未决项），用它断言「切换 locale 后文案变了」永远拿不到新值。
   * 这条读的是 context 本身 ⇒ 验的是**本组件**的 locale 接线是否正确。
   */
  localeContextDescription: string | undefined;
  /** 探针自身的渲染次数 */
  renderCount: number;
}

export interface ProbeOptions {
  /** 要额外读取哪个组件的配置（默认 `'empty'`） */
  componentName?: string;
  /** 传给 `useSize()` 的「组件自己的 size prop」（模拟 `useSize(props.size)`） */
  ownSize?: SizeType;
  /** 传给 `useDisabled()` 的「组件自己的 disabled prop」 */
  ownDisabled?: boolean;
}

/**
 * 创建一个探针组件 + 捕获对象。
 *
 * ⚠️ `captured` 在 `mount` 之后才有值。
 */
export function createProbe(options: ProbeOptions = {}) {
  const componentName = options.componentName ?? 'empty';

  const captured = {} as ProbeCapture;
  let renderCount = 0;

  const Probe = defineComponent({
    name: 'AConfigProbe',
    setup() {
      const config = useConfigContext();

      // ⚠️ 探针刻意走 `useDirection()` 的 ComputedRef，而不是解构
      //    `useComponentConfig()` 的 `direction` —— 后者是快照（D27）。
      const direction = useDirection();
      const theme = useThemeConfig();
      const size = useSize<SizeType | undefined>(options.ownSize);
      const disabled = useDisabled(options.ownDisabled);
      const componentConfig = useComponentConfig<Record<string, unknown>>(componentName);

      const [emptyLocale, localeCode] = useLocale('Empty');

      // 直接读 context 本体（见 `localeContextDescription` 的说明）
      const injectedLocale = inject(localeContextKey, undefined);
      const localeSnapshot = computed(() =>
        injectedLocale === undefined ? undefined : toValue(injectedLocale),
      );

      return () => {
        renderCount += 1;
        captured.config = config;
        captured.size = size.value;
        captured.disabled = disabled.value;
        captured.direction = direction.value;
        captured.theme = theme.value;
        captured.componentConfig = componentConfig;
        captured.emptyDescription = emptyLocale.description;
        captured.localeCode = localeCode;
        captured.localeContextDescription = localeSnapshot.value?.Empty?.description;
        captured.renderCount = renderCount;
        return h('div', { class: 'probe' });
      };
    },
  });

  return { Probe, captured };
}

/** 只渲染一个 `<span>` 的探针 —— 用来断言 ConfigProvider 的 DOM 包裹结构。 */
export const TextProbe = defineComponent({
  name: 'ATextProbe',
  setup() {
    return () => h('span', { class: 'text-probe' }, 'probe');
  },
});
