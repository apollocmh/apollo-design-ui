/**
 * Vue 侧（@apollo-design/ui）的 Grid 视觉用例。与 react/grid.jsx 逐条对应。
 * ⚠️ style 全字符串（单位补全平台差异）；色块是测试固件（H9 不适用）。
 */

import { Col, Row } from '@apollo-design/ui';
import { h } from 'vue';

const box = (text = '') =>
  h(
    'div',
    {
      style: {
        height: '30px',
        background: '#0092ff',
        borderRadius: '4px',
        lineHeight: '30px',
        textAlign: 'center',
        color: '#fff',
      },
    },
    text,
  );

const boxes = (n) => Array.from({ length: n }, (_, i) => box(`col-${Math.floor(24 / n)}`));

export default {
  basic: () => [
    h(Row, null, { default: () => h(Col, { span: 24 }, { default: box }) }),
    h(Row, null, {
      default: () => [
        h(Col, { span: 12 }, { default: box }),
        h(Col, { span: 12 }, { default: box }),
      ],
    }),
    h(Row, null, { default: () => boxes(3).map((b) => h(Col, { span: 8 }, { default: () => b })) }),
    h(Row, null, { default: () => boxes(4).map((b) => h(Col, { span: 6 }, { default: () => b })) }),
  ],

  gutter: () => [
    h(
      Row,
      { gutter: 16 },
      { default: () => boxes(4).map((b) => h(Col, { span: 6 }, { default: () => b })) },
    ),
    h(
      Row,
      { gutter: [16, 24] },
      { default: () => boxes(3).map((b) => h(Col, { span: 8 }, { default: () => b })) },
    ),
  ],

  'offset-sort': () => [
    h(Row, null, {
      default: () => [
        h(Col, { span: 8 }, { default: box }),
        h(Col, { span: 8, offset: 8 }, { default: box }),
      ],
    }),
    h(Row, null, {
      default: () => [
        h(Col, { span: 18, push: 6 }, { default: () => box('push-6') }),
        h(Col, { span: 6, pull: 18 }, { default: () => box('pull-18') }),
      ],
    }),
  ],

  'justify-align': () => [
    h(
      Row,
      { justify: 'space-between' },
      { default: () => boxes(3).map((b) => h(Col, { span: 6 }, { default: () => b })) },
    ),
    h(
      Row,
      { justify: 'space-around' },
      { default: () => boxes(3).map((b) => h(Col, { span: 6 }, { default: () => b })) },
    ),
    h(
      Row,
      { align: 'middle', style: { height: '80px', background: 'rgba(128,128,128,0.08)' } },
      {
        default: () => [
          h(Col, { span: 6 }, { default: box }),
          h(
            Col,
            { span: 6 },
            {
              default: () =>
                h('div', { style: { height: '60px', background: '#0092ff', borderRadius: '4px' } }),
            },
          ),
        ],
      },
    ),
  ],

  responsive: () => [
    h(Row, null, {
      default: () => [
        h(Col, { xs: 2, md: 4, xl: 6 }, { default: box }),
        h(Col, { xs: 20, md: 8, xl: 12 }, { default: box }),
      ],
    }),
    h(Row, null, {
      default: () => [
        h(Col, { xs: { span: 5, offset: 1 }, lg: { span: 6, offset: 2 } }, { default: box }),
        h(Col, { xs: { span: 11, offset: 1 }, lg: { span: 6, offset: 2 } }, { default: box }),
      ],
    }),
  ],

  flex: () => [
    h(
      Row,
      { gutter: { xs: 8, sm: 16, md: 24 } },
      {
        default: () =>
          Array.from({ length: 4 }, () =>
            h(
              Col,
              {
                xs: { flex: '100%' },
                sm: { flex: '50%' },
                md: { flex: '33.33%' },
                lg: { flex: '25%' },
              },
              { default: box },
            ),
          ),
      },
    ),
    h(Row, null, {
      default: () => [
        h(Col, { flex: 'auto' }, { default: box }),
        h(Col, { flex: '100px' }, { default: () => box('100px') }),
      ],
    }),
  ],
};
