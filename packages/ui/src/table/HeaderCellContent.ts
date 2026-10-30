import { defineComponent } from 'vue';
import type { ColumnTitleProps, ColumnType, TableSlots } from './interface';
import { renderColumnTitle } from './util';

/** A current native header slot lives inside the existing sorter/filter chrome. */
export default defineComponent(
  <RecordType extends object>(props: {
    column: ColumnType<RecordType>;
    titleProps: ColumnTitleProps<RecordType>;
    renderContent: NonNullable<TableSlots<RecordType>['headerCell']>;
  }) =>
    () =>
      props.renderContent({
        column: props.column,
        title: renderColumnTitle(props.column.title, props.titleProps),
      }),
  {
    name: 'TableHeaderCellContent',
    props: ['column', 'titleProps', 'renderContent'],
  },
);
