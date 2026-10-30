import { EXPAND_COLUMN } from './engine/constant';
import Footer, { Summary } from './engine/Footer';
import {
  SELECTION_ALL,
  SELECTION_COLUMN,
  SELECTION_INVERT,
  SELECTION_NONE,
} from './hooks/use-selection';
import TableComponent from './Table.vue';

const Table = Object.assign(TableComponent, {
  SELECTION_COLUMN,
  SELECTION_ALL,
  SELECTION_INVERT,
  SELECTION_NONE,
  EXPAND_COLUMN,
  Summary,
});
export default Table;
export { DEFAULT_TABLE_LOCALE } from './locale';
export { EXPAND_COLUMN, Footer, SELECTION_COLUMN, Summary };
