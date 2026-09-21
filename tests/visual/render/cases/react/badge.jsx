/**
 * React 侧（antd 6.6.4）的 Badge 视觉用例。与 vue/badge.js 逐条对应。
 */

import { Badge } from 'antd';

const box = () => (
  <div style={{ width: '40px', height: '40px', background: '#f0f0f0', borderRadius: '4px' }} />
);

const statuses = ['success', 'processing', 'error', 'default', 'warning'];
const colors = [
  'pink',
  'red',
  'yellow',
  'orange',
  'cyan',
  'green',
  'blue',
  'purple',
  'geekblue',
  'magenta',
  'volcano',
  'gold',
  'lime',
];

export default {
  basic: () => (
    <>
      <Badge count={5}>{box()}</Badge>
      <Badge count={100} overflowCount={99}>
        {box()}
      </Badge>
      <Badge count={0} showZero>
        {box()}
      </Badge>
    </>
  ),

  status: () => statuses.map((s) => <Badge key={s} status={s} text={s} />),

  colorful: () => colors.map((c) => <Badge key={c} status="default" color={c} text={c} />),

  dot: () => (
    <>
      <Badge dot>{box()}</Badge>
      <Badge dot count={5}>
        {box()}
      </Badge>
    </>
  ),

  ribbon: () => (
    <>
      <Badge.Ribbon text="Hippopotamus">{box()}</Badge.Ribbon>
      <Badge.Ribbon text="pink" color="pink">
        {box()}
      </Badge.Ribbon>
      <Badge.Ribbon text="start" placement="start" color="blue">
        {box()}
      </Badge.Ribbon>
      <Badge.Ribbon text="#2db7f5" color="#2db7f5">
        {box()}
      </Badge.Ribbon>
    </>
  ),

  'offset-size': () => (
    <>
      <Badge count={5} size="small">
        {box()}
      </Badge>
      <Badge count={5} offset={[10, 10]}>
        {box()}
      </Badge>
      <Badge count={25}>{box()}</Badge>
    </>
  ),
};
