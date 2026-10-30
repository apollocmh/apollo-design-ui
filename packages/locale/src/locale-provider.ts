/**
 * `LocaleProvider` —— **已废弃**，请改用 `ConfigProvider` 的 `locale` prop。
 *
 * 契约来源：antd 6.6.4 的 `es/locale/index.js:9-33`。
 *
 * ⚠️ 上游的判据是 `_ANT_MARK__ === ANT_MARK`（`'internalMark'`）——
 *    即「调用方只能从 `antd/locale` 拿默认导出的那个组件来用」。
 *    自己重新包一层同名组件会触发废弃告警，这是**有意的**。
 */

import {
  computed,
  defineComponent,
  type PropType,
  provide,
  type SlotsType,
  type VNodeChild,
} from 'vue';
import { useConfirmLocale } from './confirm-locale';
import { localeContextKey } from './context';
import type { Locale } from './types';

export const ANT_MARK = 'internalMark';

// ---------------------------------------------------------------------------
// 极简 dev 告警
//
// ⚠️ 本包**零依赖**（`dependsOn: []`），所以没有引 `@apollo-design/utils` 的
//    `devUseWarning`。格式与它对齐（`Warning: [apollo: X] ...`），行为也一致：
//    - 生产环境不打
//    - **同一句话只打一次**（模块级 Set 去重）
//    代价是没有 `ConfigProvider` 的 `WarningContext` 支持（那是 utils 的能力）。
//    这是刻意的取舍：见契约文档 §8 P3。
// ---------------------------------------------------------------------------
const warned = new Set<string>();

function devWarning(message: string): void {
  if (process.env.NODE_ENV === 'production' || typeof console === 'undefined') return;
  if (warned.has(message)) return;
  warned.add(message);
  console.error(`Warning: [apollo: LocaleProvider] ${message}`);
}

/** 测试辅助：清空告警去重表。生产代码不应调用。 */
export function resetLocaleWarned(): void {
  warned.clear();
}

export const LocaleProvider = defineComponent({
  name: 'ALocaleProvider',
  inheritAttrs: false,
  props: {
    locale: { type: Object as PropType<Partial<Locale>>, default: () => ({}) },
    /** 上游用它判断「是不是官方导出的那个组件」 */
    _ANT_MARK__: { type: String, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    // ⚠️ 条件**不能写反**：上游是 `warning(_ANT_MARK__ === ANT_MARK, ...)`，
    //    而 `warning(valid, ...)` 在 `!valid` 时才打印 ——
    //    也就是「**标记不对**时才告警」。传对了 `ANT_MARK` 反而是静默的。
    if (props._ANT_MARK__ !== ANT_MARK) {
      devWarning(
        '`LocaleProvider` is deprecated. Please use `locale` with `ConfigProvider` instead: http://u.ant.design/locale',
      );
    }

    // ⚠️ `exist: true` 是契约的一部分（见 use-locale.ts 判据 3）
    const value = computed(() => ({ ...props.locale, exist: true }));
    provide(localeContextKey, value);

    useConfirmLocale(() => props.locale?.Modal);

    return () => slots.default?.();
  },
});
