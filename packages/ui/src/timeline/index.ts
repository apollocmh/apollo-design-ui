/**
 * Timeline 的公共导出。
 *
 * 与 antd 的 `es/timeline/index.js` 对齐的对外面：
 *   - 默认导出 `Timeline`（含 `Item` 静态子组件）
 *   - 全部类型 + 样式生成函数 + Component Token
 *
 * ── 与 antd 的**形态**差异（PLATFORM，不是行为差异）────────────────────────────
 *
 * antd 用 `Timeline.Item = Item` 这种「函数组件挂属性」做复合组件；Vue 里对应
 * `Object.assign(组件, { Item })`。⚠️ 本仓的 `Timeline.Item` 是**空壳**（上游也是
 * `(() => {})`）—— 它**不渲染任何东西**，只为「用了就发废弃告警」而存在。
 * 两个组件的可观测行为一致（都渲染不出内容）。
 *
 * ⚠️ `Object.assign` 而不是「先声明再赋值」—— `Object.assign` 的返回值是交叉类型，
 * `Timeline.Item` 在**类型层**才可见（与 `Avatar.Group` / `List.Item` 同一条）。
 *
 * ── 组件实现是 `.ts`（不是 `.vue`）────────────────────────────────────────────
 *
 * `Timeline` **没有自己的 DOM**（是 `Steps` 的薄壳）⇒ `.vue` 模板的价值为零，
 * 且「给组件传一个 classNames 映射对象」在模板里表达不了。
 * 命中 `COMPONENT-RULES.md` §2 的条件 1（纯渲染函数型内部件），理由见 `README.md` §3。
 */

import { withInstall } from '../_internal/with-install';
import TimelineComponent, { TimelineItem } from './Timeline';

/** `Timeline.Item`。⚠️ 空壳（上游同判）。 */
export const TimelineItemComponent = withInstall(TimelineItem);

/** Timeline 复合组件。注册名 `ATimeline`。⚠️ 静态子组件 `Item` 与具名导出指向**同一个对象**。 */
export const Timeline = withInstall(
  Object.assign(TimelineComponent, {
    Item: TimelineItemComponent,
  }),
);

export default Timeline;

export type {
  ItemPlacement,
  ItemPosition,
  TimelineColor,
  TimelineConfig,
  TimelineItemType,
  TimelineMode,
  TimelineProps,
  TimelineRef,
  TimelineSemanticClassNames,
  TimelineSemanticStyles,
  TimelineSlot,
} from './interface';
export { genTimelineStyle, genTokenDecls as genTimelineTokenDecls } from './style';
export type { ComponentToken as TimelineComponentToken } from './style/token';
export { prepareComponentToken as prepareTimelineComponentToken } from './style/token';
export type { UseItemsContext } from './use-items';
export { useItems } from './use-items';
