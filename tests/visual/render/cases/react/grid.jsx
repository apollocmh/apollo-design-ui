/**
 * React 侧（antd 6.6.4）的 Grid 视觉用例。与 vue/grid.js 逐条对应。
 */

import { Col, Row } from 'antd';

const box = (text = '') => (
  <div
    style={{
      height: '30px',
      background: '#0092ff',
      borderRadius: '4px',
      lineHeight: '30px',
      textAlign: 'center',
      color: '#fff',
    }}
  >
    {text}
  </div>
);

const boxes = (n) => Array.from({ length: n }, (_, i) => box(`col-${Math.floor(24 / n)}`));

export default {
  basic: () => (
    <>
      <Row>
        <Col span={24}>{box()}</Col>
      </Row>
      <Row>
        <Col span={12}>{box()}</Col>
        <Col span={12}>{box()}</Col>
      </Row>
      <Row>
        {boxes(3).map((b, i) => (
          <Col key={i} span={8}>
            {b}
          </Col>
        ))}
      </Row>
      <Row>
        {boxes(4).map((b, i) => (
          <Col key={i} span={6}>
            {b}
          </Col>
        ))}
      </Row>
    </>
  ),

  gutter: () => (
    <>
      <Row gutter={16}>
        {boxes(4).map((b, i) => (
          <Col key={i} span={6}>
            {b}
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 24]}>
        {boxes(3).map((b, i) => (
          <Col key={i} span={8}>
            {b}
          </Col>
        ))}
      </Row>
    </>
  ),

  'offset-sort': () => (
    <>
      <Row>
        <Col span={8}>{box()}</Col>
        <Col span={8} offset={8}>
          {box()}
        </Col>
      </Row>
      <Row>
        <Col span={18} push={6}>
          {box('push-6')}
        </Col>
        <Col span={6} pull={18}>
          {box('pull-18')}
        </Col>
      </Row>
    </>
  ),

  'justify-align': () => (
    <>
      <Row justify="space-between">
        {boxes(3).map((b, i) => (
          <Col key={i} span={6}>
            {b}
          </Col>
        ))}
      </Row>
      <Row justify="space-around">
        {boxes(3).map((b, i) => (
          <Col key={i} span={6}>
            {b}
          </Col>
        ))}
      </Row>
      <Row align="middle" style={{ height: '80px', background: 'rgba(128,128,128,0.08)' }}>
        <Col span={6}>{box()}</Col>
        <Col span={6}>
          <div style={{ height: '60px', background: '#0092ff', borderRadius: '4px' }} />
        </Col>
      </Row>
    </>
  ),

  responsive: () => (
    <>
      <Row>
        <Col xs={2} md={4} xl={6}>
          {box()}
        </Col>
        <Col xs={20} md={8} xl={12}>
          {box()}
        </Col>
      </Row>
      <Row>
        <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }}>
          {box()}
        </Col>
        <Col xs={{ span: 11, offset: 1 }} lg={{ span: 6, offset: 2 }}>
          {box()}
        </Col>
      </Row>
    </>
  ),

  flex: () => (
    <>
      <Row gutter={{ xs: 8, sm: 16, md: 24 }}>
        {[0, 1, 2, 3].map((i) => (
          <Col
            key={i}
            xs={{ flex: '100%' }}
            sm={{ flex: '50%' }}
            md={{ flex: '33.33%' }}
            lg={{ flex: '25%' }}
          >
            {box()}
          </Col>
        ))}
      </Row>
      <Row>
        <Col flex="auto">{box()}</Col>
        <Col flex="100px">{box('100px')}</Col>
      </Row>
    </>
  ),
};
