const e=`<script setup lang="ts">
// 对齐 antd 的 basic demo（本 demo 不依赖 Menu）
import { Flex, Layout } from '@apollo-design/ui';
import type { CSSProperties } from 'vue';

const { Header, Footer, Sider, Content } = Layout;

const headerStyle: CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  height: 64,
  paddingInline: 48,
  lineHeight: '64px',
  backgroundColor: '#4096ff',
};
const contentStyle: CSSProperties = {
  textAlign: 'center',
  minHeight: 120,
  lineHeight: '120px',
  color: '#fff',
  backgroundColor: '#0958d9',
};
const siderStyle: CSSProperties = {
  textAlign: 'center',
  lineHeight: '120px',
  color: '#fff',
  backgroundColor: '#1677ff',
};
const footerStyle: CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  backgroundColor: '#4096ff',
};
const layoutStyle: CSSProperties = {
  borderRadius: 8,
  overflow: 'hidden',
  width: 'calc(50% - 8px)',
  maxWidth: 'calc(50% - 8px)',
};
<\/script>

<template>
  <Flex gap="middle" wrap>
    <Layout :style="layoutStyle">
      <Header :style="headerStyle">Header</Header>
      <Content :style="contentStyle">Content</Content>
      <Footer :style="footerStyle">Footer</Footer>
    </Layout>

    <Layout :style="layoutStyle">
      <Header :style="headerStyle">Header</Header>
      <Layout>
        <Sider width="25%" :style="siderStyle">Sider</Sider>
        <Content :style="contentStyle">Content</Content>
      </Layout>
      <Footer :style="footerStyle">Footer</Footer>
    </Layout>
  </Flex>
</template>
`;export{e as default};
