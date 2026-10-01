/**
 * Splitter 导出（antd `es/splitter/index.js`：复合组件 `Splitter.Panel`）。
 *
 * ── 为什么要在这里套 `withInstall`（2026-10-01 修正）────────────────────────────
 *
 * `Splitter.ts` / `Panel.ts` 都只 `defineComponent({ name: 'ASplitter…' })`，
 * **没有** `withInstall` ⇒ 早先的导出让 `app.use(Splitter)` / 全局注册**静默失效**
 * （其它 59 个组件都套了）。
 *
 * ⚠️ 为什么一直没被发现：本仓的「可安装」断言是**逐组件写在各自的 L3 类型测试**里的
 * （`expectTypeOf(X).toHaveProperty('install')`），而 splitter 的类型测试**漏了这条**
 * ⇒ 没有哨兵。已在 `__tests__/type.test-d.ts` 补上。
 *
 * ⚠️ 顺序：`SplitterWithPanel` 已经挂好 `Panel`，`withInstall` 直接套在它上面 ——
 * 这样复合组件与具名导出**都**带 `install`。
 */

import { withInstall } from '../_internal/with-install';
import { SplitterPanel as SplitterPanelComponent } from './Panel';
import { SplitterWithPanel } from './Splitter';

export type {
  PanelCollapsible,
  ShowCollapsibleIconMode,
  SplitterCollapsibleIcon,
  SplitterDraggerClassNames,
  SplitterDraggerStyles,
  SplitterLegacyCollapsibleIcon,
  SplitterPanelProps,
  SplitterProps,
  SplitterRef,
  SplitterSemanticClassNames,
  SplitterSemanticStyles,
} from './interface';

/** 复合组件原样导出（含 `Panel`，**不带** `install` —— 供内部/测试直接用）。 */
export { SplitterWithPanel } from './Splitter';

/** Splitter 组件（含复合子组件 `Splitter.Panel`）。注册名 `ASplitter`。 */
export const Splitter = withInstall(SplitterWithPanel);

/** 面板组件（独立使用时的具名导出）。注册名 `ASplitterPanel`。 */
export const SplitterPanel = withInstall(SplitterPanelComponent);
