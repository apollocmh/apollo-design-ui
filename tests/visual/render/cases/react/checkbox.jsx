/**
 * React 侧（antd 6.6.4）的 Checkbox 视觉用例。与 vue/checkbox.js 逐条对应。
 */

import { Checkbox, Divider } from 'antd';

const { Group } = Checkbox;

const box = (children) => <div style={{ minHeight: 120, padding: 16 }}>{children}</div>;

export default {
  basic: () =>
    box([
      <Checkbox key="a">Checkbox</Checkbox>,
      <Checkbox key="b" defaultChecked>
        Checked
      </Checkbox>,
      <Checkbox key="c" disabled>
        Disabled
      </Checkbox>,
      <Checkbox key="d" defaultChecked disabled>
        Checked + Disabled
      </Checkbox>,
    ]),

  indeterminate: () =>
    box([
      <Checkbox key="a" indeterminate>
        Indeterminate
      </Checkbox>,
      <Checkbox key="b" indeterminate checked>
        Indeterminate + Checked
      </Checkbox>,
      <Checkbox key="c" indeterminate disabled>
        Indeterminate + Disabled
      </Checkbox>,
    ]),

  group: () =>
    box([
      <Group key="g1" options={['Apple', 'Pear', 'Orange']} defaultValue={['Apple']} />,
      <br key="b1" />,
      <br key="b2" />,
      <Group
        key="g2"
        options={[
          { label: 'Apple', value: 'Apple' },
          { label: 'Pear', value: 'Pear', disabled: true },
        ]}
        defaultValue={['Pear']}
      />,
      <br key="b3" />,
      <br key="b4" />,
      <Group key="g3" options={['A', 'B']} disabled defaultValue={['A']} />,
    ]),

  'check-all': () => {
    const plainOptions = ['Apple', 'Pear', 'Orange'];
    return box([
      <Checkbox key="all" indeterminate checked={false}>
        Check all
      </Checkbox>,
      <Divider key="divider" />,
      <Group key="group" options={plainOptions} defaultValue={['Apple', 'Orange']} />,
    ]);
  },

  semantic: () =>
    box(
      <Checkbox
        classNames={{ root: 'demo-cb-root', label: 'demo-cb-label' }}
        styles={{ icon: { borderRadius: '50%' } }}
      >
        Semantic
      </Checkbox>,
    ),
};
