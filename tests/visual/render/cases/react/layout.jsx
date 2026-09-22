/**
 * React 侧（antd 6.6.4）的 Layout 视觉用例。与 vue/layout.js 逐条对应。
 * ⚠️ 高度写死（不用 100vh）—— 视口高度差异会让两侧截图必然不同。
 */

import { Layout } from 'antd';

const { Header, Footer, Sider, Content } = Layout;

const box = (style) => <div style={{ minHeight: 220, ...style }} />;

export default {
  basic: () => (
    <Layout>
      <Header>Header</Header>
      <Content>{box({ background: 'rgb(240, 242, 245)' })}</Content>
      <Footer>Footer</Footer>
    </Layout>
  ),

  side: () => (
    <Layout>
      <Sider width={160}>
        <div style={{ padding: 16, color: 'rgba(255,255,255,0.65)' }}>nav 1</div>
      </Sider>
      <Content>{box({ background: 'rgb(240, 242, 245)' })}</Content>
    </Layout>
  ),

  'side-light': () => (
    <Layout>
      <Sider theme="light" width={160}>
        <div style={{ padding: 16 }}>nav 1</div>
      </Sider>
      <Content>{box({ background: 'rgb(240, 242, 245)' })}</Content>
    </Layout>
  ),

  collapsible: () => (
    <Layout>
      <Sider collapsible width={160}>
        <div style={{ padding: 16, color: 'rgba(255,255,255,0.65)' }}>nav 1</div>
      </Sider>
      <Content>{box({ background: 'rgb(240, 242, 245)' })}</Content>
    </Layout>
  ),

  collapsed: () => (
    <Layout>
      <Sider collapsible collapsed width={160}>
        <div style={{ padding: 16, color: 'rgba(255,255,255,0.65)' }}>nav 1</div>
      </Sider>
      <Content>{box({ background: 'rgb(240, 242, 245)' })}</Content>
    </Layout>
  ),

  'zero-width': () => (
    <Layout>
      <Sider collapsible collapsed collapsedWidth={0} width={160}>
        <div style={{ padding: 16, color: 'rgba(255,255,255,0.65)' }}>nav 1</div>
      </Sider>
      <Content>{box({ background: 'rgb(240, 242, 245)' })}</Content>
    </Layout>
  ),
};
