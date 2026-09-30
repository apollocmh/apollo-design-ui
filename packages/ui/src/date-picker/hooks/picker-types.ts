/**
 * `date-picker` 内部 hooks 共用的**类型别名**（G4 · S1）。
 *
 * ── 为什么要单独一个文件 ──────────────────────────────────────────────────────
 *
 * 本组件同时依赖**两个**叫 `PickerLocale` 的类型，语义完全不同：
 *
 * | 来源 | 内容 | 用途 |
 * |---|---|---|
 * | `@apollo-design/locale` | `{ lang, timePickerLocale, … }`（antd 的完整语言包分片） | `useLocale('DatePicker')` 的产物、`getPlaceholder` 的入参 |
 * | `@apollo-design/picker` | 面板 locale **子集**（`fieldDateFormat` / `shortMonths` / 四个方向键的可访问名 …） | 传给 `PickerPanel` / `getRowFormat` |
 *
 * 上游的关系是 **`antdLocale.lang` 就是 rc 的 `Locale`** —— 见
 * `generateSinglePicker.js` 里 `locale: locale.lang` 那一行。
 * 混用这两个类型不会报错（结构上 `lang` 恰好满足子集），但会让「应该传哪个」
 * 变成靠猜 ⇒ 显式别名：**`RcPickerLocale` = 给面板/引擎用的那个**。
 */

export type {
  GenerateConfig,
  PickerLocale as RcPickerLocale,
  PickerMode,
} from '@apollo-design/picker';
