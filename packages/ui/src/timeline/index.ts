/** Native Timeline with typed item slots. */
import { withInstall } from '../_internal/with-install';
import TimelineComponent from './Timeline';

export const Timeline = withInstall(TimelineComponent);

export default Timeline;

export type {
  ItemPlacement,
  ItemPosition,
  TimelineColor,
  TimelineConfig,
  TimelineItemSlotProps,
  TimelineItemType,
  TimelineMode,
  TimelineProps,
  TimelineRef,
  TimelineSemanticClassNames,
  TimelineSemanticStyles,
  TimelineSlots,
} from './interface';
export { genTimelineStyle, genTokenDecls as genTimelineTokenDecls } from './style';
export type { ComponentToken as TimelineComponentToken } from './style/token';
export { prepareComponentToken as prepareTimelineComponentToken } from './style/token';
export type { UseItemsContext } from './use-items';
export { useItems } from './use-items';
