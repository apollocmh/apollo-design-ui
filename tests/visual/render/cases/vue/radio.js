/**
 * Vue 侧（@apollo-design/ui）的 Radio 视觉用例。与 react/radio.jsx 逐条对应。
 */

import { Radio } from '@apollo-design/ui';
import { h } from 'vue';

const { Group, Button } = Radio;

const box = (children) => h('div', { style: { minHeight: '120px', padding: '16px' } }, children);

const options = [
  { label: 'Apple', value: 'Apple' },
  { label: 'Pear', value: 'Pear' },
  { label: 'Orange', value: 'Orange' },
];

const optionsWithDisabled = [
  { label: 'Apple', value: 'Apple' },
  { label: 'Pear', value: 'Pear' },
  { label: 'Orange', value: 'Orange', disabled: true },
];

const br = () => h('br');

export default {
  basic: () =>
    box([
      h(Radio, { key: 'a', value: 'a' }, { default: () => 'Radio' }),
      h(Radio, { key: 'b', value: 'b', checked: true }, { default: () => 'Checked' }),
      h(Radio, { key: 'c', value: 'c', disabled: true }, { default: () => 'Disabled' }),
      h(
        Radio,
        { key: 'd', value: 'd', checked: true, disabled: true },
        { default: () => 'Checked + Disabled' },
      ),
    ]),

  group: () =>
    box([
      h(Group, { key: 'g1', options: ['Apple', 'Pear', 'Orange'], defaultValue: 'Apple' }),
      br(),
      br(),
      h(Group, { key: 'g2', options: optionsWithDisabled, defaultValue: 'Apple' }),
      br(),
      br(),
      h(Group, { key: 'g3', options, defaultValue: 'Pear', vertical: true }),
      br(),
      br(),
      h(Group, { key: 'g4', options, defaultValue: 'Orange', block: true }),
    ]),

  button: () =>
    box([
      h(
        Group,
        { key: 'g1', defaultValue: 'a' },
        {
          default: () => [
            h(Button, { value: 'a' }, { default: () => 'Hangzhou' }),
            h(Button, { value: 'b' }, { default: () => 'Shanghai' }),
            h(Button, { value: 'c' }, { default: () => 'Beijing' }),
          ],
        },
      ),
      br(),
      br(),
      h(
        Group,
        { key: 'g2', defaultValue: 'a' },
        {
          default: () => [
            h(Button, { value: 'a' }, { default: () => 'Hangzhou' }),
            h(Button, { value: 'b', disabled: true }, { default: () => 'Shanghai' }),
            h(Button, { value: 'c' }, { default: () => 'Beijing' }),
          ],
        },
      ),
      br(),
      br(),
      h(
        Group,
        { key: 'g3', defaultValue: 'a', disabled: true },
        {
          default: () => [
            h(Button, { value: 'a' }, { default: () => 'Hangzhou' }),
            h(Button, { value: 'b' }, { default: () => 'Shanghai' }),
            h(Button, { value: 'c' }, { default: () => 'Beijing' }),
          ],
        },
      ),
      br(),
      br(),
      h(
        Group,
        { key: 'g4', defaultValue: 'b', buttonStyle: 'solid' },
        {
          default: () => [
            h(Button, { value: 'a' }, { default: () => 'Hangzhou' }),
            h(Button, { value: 'b' }, { default: () => 'Shanghai' }),
            h(Button, { value: 'c' }, { default: () => 'Beijing' }),
          ],
        },
      ),
    ]),

  size: () =>
    box([
      h(
        Group,
        { key: 'g1', defaultValue: 'a', size: 'large' },
        {
          default: () => [
            h(Button, { value: 'a' }, { default: () => 'Hangzhou' }),
            h(Button, { value: 'b' }, { default: () => 'Shanghai' }),
          ],
        },
      ),
      br(),
      br(),
      h(
        Group,
        { key: 'g2', defaultValue: 'a' },
        {
          default: () => [
            h(Button, { value: 'a' }, { default: () => 'Hangzhou' }),
            h(Button, { value: 'b' }, { default: () => 'Shanghai' }),
          ],
        },
      ),
      br(),
      br(),
      h(
        Group,
        { key: 'g3', defaultValue: 'a', size: 'small' },
        {
          default: () => [
            h(Button, { value: 'a' }, { default: () => 'Hangzhou' }),
            h(Button, { value: 'b' }, { default: () => 'Shanghai' }),
          ],
        },
      ),
    ]),

  semantic: () =>
    box([
      h(
        Radio,
        {
          key: 'a',
          value: 'a',
          checked: true,
          classNames: {
            root: 'demo-radio-root',
            icon: 'demo-radio-icon',
            label: 'demo-radio-label',
          },
          styles: { icon: { borderRadius: '6px' }, label: { color: 'blue' } },
        },
        { default: () => 'Semantic' },
      ),
    ]),
};
