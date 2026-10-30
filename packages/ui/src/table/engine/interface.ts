import type { ExpandableConfig, ExpandedRowRender, RenderExpandIcon } from '../interface';

/** Render services exist only behind Table's current native slot boundary. */
export interface EngineExpandableConfig<RecordType = Record<string, unknown>>
  extends ExpandableConfig<RecordType> {
  expandedRowRender?: ExpandedRowRender<RecordType>;
  expandIcon?: RenderExpandIcon<RecordType>;
}
