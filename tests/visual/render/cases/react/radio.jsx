/**
 * React 侧（antd 6.6.4）的 Radio 视觉用例。与 vue/radio.js 逐条对应。
 */

import { Radio } from 'antd';

const { Group, Button } = Radio;

const box = (children) => <div style={{ minHeight: 120, padding: 16 }}>{children}</div>;

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

export default {
  basic: () =>
    box([
      <Radio key="a" value="a">
        Radio
      </Radio>,
      <Radio key="b" value="b" checked>
        Checked
      </Radio>,
      <Radio key="c" value="c" disabled>
        Disabled
      </Radio>,
      <Radio key="d" value="d" checked disabled>
        Checked + Disabled
      </Radio>,
    ]),

  group: () =>
    box([
      <Group key="g1" options={['Apple', 'Pear', 'Orange']} defaultValue="Apple" />,
      <br key="b1" />,
      <br key="b2" />,
      <Group key="g2" options={optionsWithDisabled} defaultValue="Apple" />,
      <br key="b3" />,
      <br key="b4" />,
      <Group key="g3" options={options} defaultValue="Pear" vertical />,
      <br key="b5" />,
      <br key="b6" />,
      <Group key="g4" options={options} defaultValue="Orange" block />,
    ]),

  button: () =>
    box([
      <Group key="g1" defaultValue="a">
        <Button value="a">Hangzhou</Button>
        <Button value="b">Shanghai</Button>
        <Button value="c">Beijing</Button>
      </Group>,
      <br key="b1" />,
      <br key="b2" />,
      <Group key="g2" defaultValue="a">
        <Button value="a">Hangzhou</Button>
        <Button value="b" disabled>
          Shanghai
        </Button>
        <Button value="c">Beijing</Button>
      </Group>,
      <br key="b3" />,
      <br key="b4" />,
      <Group key="g3" defaultValue="a" disabled>
        <Button value="a">Hangzhou</Button>
        <Button value="b">Shanghai</Button>
        <Button value="c">Beijing</Button>
      </Group>,
      <br key="b5" />,
      <br key="b6" />,
      <Group key="g4" defaultValue="b" buttonStyle="solid">
        <Button value="a">Hangzhou</Button>
        <Button value="b">Shanghai</Button>
        <Button value="c">Beijing</Button>
      </Group>,
    ]),

  size: () =>
    box([
      <Group key="g1" defaultValue="a" size="large">
        <Button value="a">Hangzhou</Button>
        <Button value="b">Shanghai</Button>
      </Group>,
      <br key="b1" />,
      <br key="b2" />,
      <Group key="g2" defaultValue="a">
        <Button value="a">Hangzhou</Button>
        <Button value="b">Shanghai</Button>
      </Group>,
      <br key="b3" />,
      <br key="b4" />,
      <Group key="g3" defaultValue="a" size="small">
        <Button value="a">Hangzhou</Button>
        <Button value="b">Shanghai</Button>
      </Group>,
    ]),

  semantic: () =>
    box([
      <Radio
        key="a"
        value="a"
        checked
        classNames={{ root: 'demo-radio-root', icon: 'demo-radio-icon', label: 'demo-radio-label' }}
        styles={{ icon: { borderRadius: 6 }, label: { color: 'blue' } }}
      >
        Semantic
      </Radio>,
    ]),
};
