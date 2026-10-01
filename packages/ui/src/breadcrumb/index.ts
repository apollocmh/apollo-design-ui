/**
 * Breadcrumb 的公共导出。
 *
 * 与 antd 的 `es/breadcrumb/index.js` 对齐的对外面：它是**复合组件**
 * （`Breadcrumb.Item` / `Breadcrumb.Separator`，**两个都已废弃**）。
 * ⚠️ 复合挂载照 `anchor/index.ts` / `splitter/index.ts` 的既有写法
 * （`Object.assign` + `withInstall`）。
 *
 * ⚠️ 导入的组件用 `...Component` 后缀别名，避免与下面导出的同名符号冲突
 * （`BreadcrumbItem` 既是子组件也是具名导出）。
 */

import { withInstall } from '../_internal/with-install';
import { Breadcrumb as BreadcrumbComponent } from './Breadcrumb';
import { BreadcrumbItem as BreadcrumbItemComponent } from './BreadcrumbItem';
import { BreadcrumbSeparator as BreadcrumbSeparatorComponent } from './BreadcrumbSeparator';

/**
 * 复合组件：挂上 `Item` / `Separator`（antd 的 `CompoundedComponent`）。
 *
 * ⚠️ 两个子组件都**已废弃**（上游用 `devUseWarning().deprecated` 告警，本仓同判）。
 */
export const BreadcrumbWithSub = Object.assign(BreadcrumbComponent, {
  Item: BreadcrumbItemComponent,
  Separator: BreadcrumbSeparatorComponent,
});

/** Breadcrumb（含复合子组件）。注册名 `ABreadcrumb`。 */
export const Breadcrumb = withInstall(BreadcrumbWithSub);

/** 单项组件（`Breadcrumb.Item` 的具名导出）。注册名 `ABreadcrumbItem`。 */
export const BreadcrumbItem = withInstall(BreadcrumbItemComponent);

/** 分隔符组件（`Breadcrumb.Separator` 的具名导出）。注册名 `ABreadcrumbSeparator`。 */
export const BreadcrumbSeparator = withInstall(BreadcrumbSeparatorComponent);

export default Breadcrumb;

// ---------------------------------------------------------------- 类型（G2 产物）
export type {
  BreadcrumbExpose,
  BreadcrumbItemInput,
  BreadcrumbItemMenu,
  BreadcrumbItemProps,
  BreadcrumbItemSlots,
  BreadcrumbItemType,
  BreadcrumbKey,
  BreadcrumbMenuItem,
  BreadcrumbParams,
  BreadcrumbProps,
  BreadcrumbRef,
  BreadcrumbSemanticClassNames,
  BreadcrumbSemanticStyles,
  BreadcrumbSeparatorSlots,
  BreadcrumbSeparatorType,
  BreadcrumbSlots,
} from './interface';

// ---------------------------------------------------------------- 样式（G4 产物）
export { genBreadcrumbStyle, genTokenDecls as genBreadcrumbTokenDecls } from './style';
export type { ComponentToken as BreadcrumbComponentToken } from './style/token';
export { prepareComponentToken as prepareBreadcrumbComponentToken } from './style/token';
