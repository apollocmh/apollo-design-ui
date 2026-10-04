/**
 * @apollo-design/locale
 *
 * 国际化数据包：**73 个语言包** + `Locale` 类型 + `useLocale` 的合并语义。
 * 语言包由 `registry/tools/gen-locale.mjs` 从 antd 6.6.4 的 `es/locale/*` 生成
 * （与 icons 同一套路），**不手工维护**。
 *
 * ⚠️ 数量是 **73**，不是早期 registry 里写的 75 —— 实测 antd 的源码与产物都是 73
 *    （`components/locale/*.ts` 去掉 `index` / `context` / `useLocale` 之后）。
 *
 * ⚠️ 上游把它叫 `antd/locale`，语言包从**子路径**导入（`antd/locale/zh_CN`）。
 *    本仓库的 `build-output-contract` 裁决 A 是**单文件产物**，所以没有子路径入口，
 *    只能具名导入：`import { zh_CN } from '@apollo-design/locale'`。
 *    导出名保留 `zh_CN` 这种下划线原名，把迁移成本压到「只改包名」。
 */

// ---------------------------------------------------------------------------
// Modal confirm 的模块级 locale
// ---------------------------------------------------------------------------
export { changeConfirmLocale, getConfirmLocale, resetConfirmLocale } from './confirm-locale';
export type { LocaleContextSource, LocaleContextValue } from './context';

// ---------------------------------------------------------------------------
// 取 locale 与 context
// ---------------------------------------------------------------------------
export { localeContextKey } from './context';
// ---------------------------------------------------------------------------
// LocaleProvider（已废弃）
// ---------------------------------------------------------------------------
export { ANT_MARK, LocaleProvider, resetLocaleWarned } from './locale-provider';
// ---------------------------------------------------------------------------
// 73 个语言包
// ---------------------------------------------------------------------------
export * from './locales';
// ---------------------------------------------------------------------------
// 兜底语言包（上游 `useLocale` 的 `defaultLocaleData`）
// ---------------------------------------------------------------------------
export { default as defaultLocale } from './locales/en_US';
// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------
export type {
  CarouselLocale,
  ColorPickerLocale,
  EmptyLocale,
  FormLocale,
  GlobalLocale,
  Locale,
  LocaleComponentName,
  ModalLocale,
  PaginationLocale,
  PickerLangLocale,
  PickerLocale,
  PopconfirmLocale,
  QRCodeLocale,
  TableLocale,
  TextLocale,
  TimePickerLocale,
  TourLocale,
  TransferLocale,
  UploadLocale,
  ValidateMessages,
} from './types';
export { defaultLocaleData, useLocale, useLocaleReactive } from './use-locale';
