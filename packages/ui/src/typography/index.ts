/**
 * Typography 的公共导出。
 *
 * 与 antd 的 `es/typography/index.js` 对齐的对外面：
 *   - 默认导出 `Typography`（含 `Text` / `Title` / `Paragraph` / `Link` 四个静态子组件）
 *   - 四个子组件同时提供**具名导出**（Vue 生态惯例，也便于按需引入与 tree-shaking）
 *   - 全部类型
 *
 * ── 与 antd 的一处形态差异（PLATFORM）──────────────────────────────────────────
 *
 * antd 用 `Typography.Text = Text` 这种「函数组件挂属性」的方式做复合组件；
 * Vue 里对应的是 `Object.assign(组件, { Text, ... })`。两者的可观测行为一致：
 * `<ATypography.Text>` 与 `<AText>` 渲染同一棵 DOM。
 *
 * 为什么两套都要给：`ATypography.Text` 是迁移 antd 代码时最省事的写法，
 * 而具名 `AText` 在 Vue 里更自然（也更容易被 tree-shaking 识别）。
 * **两者必须是同一个组件对象** —— 否则 `withInstall` 会注册两份、`app.component`
 * 里出现两个名字。
 */

import { withInstall } from '../_internal/with-install';
import TypographyComponent from './Typography.vue';

/**
 * Typography 复合组件。
 *
 * ⚠️ 静态子组件与具名导出指向**同一批对象**（见文件头）。
 */
export const Typography = withInstall(TypographyComponent);

export default Typography;

export type {
  ActionsConfig,
  AutoSizeType,
  BaseType,
  BaseTypographyProps,
  BlockProps,
  CopyConfig,
  EditConfig,
  EllipsisConfig,
  LinkProps,
  ParagraphProps,
  TextProps,
  TitleProps,
  TypographyConfig,
  TypographyProps,
  TypographyRef,
  TypographySemanticAllType,
  TypographySemanticClassNames,
  TypographySemanticStyles,
  TypographySemanticType,
  TypographySemanticValue,
  TypographySlot,
  TypographyTooltipProps,
} from './interface';
