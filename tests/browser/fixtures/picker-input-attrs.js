import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
import { DatePicker, RangePicker, TimePicker, TimeRangePicker } from '@apollo-design/ui';
import { createApp, h, reactive } from 'vue';

const params = new URLSearchParams(location.search);
const kind = params.get('kind') ?? 'date';
const range = kind.includes('range');
const Picker = {
  date: DatePicker,
  range: RangePicker,
  time: TimePicker,
  'time-range': TimeRangePicker,
}[kind];
const state = reactive({
  id: range ? { start: 'start-input', end: 'end-input' } : 'start-input',
  disabled: false,
  inputReadOnly: false,
  autoFocus: params.has('autofocus'),
  'aria-describedby': 'input-hint',
});
window.updatePicker = (patch) => Object.assign(state, patch);
createApp({
  render: () =>
    h('main', { style: 'padding: 32px' }, [
      h('button', { id: 'before' }, 'Before'),
      h('label', { id: 'start-label', for: 'start-input' }, 'Start date'),
      range ? h('label', { for: 'end-input' }, 'End date') : null,
      h(Picker, { ...state, 'data-testid': 'picker-root' }),
      h('span', { id: 'input-hint' }, 'Pick or type a date'),
      h('button', { id: 'after' }, 'After'),
    ]),
}).mount('#app');
