const n=`<script setup lang="ts">
// 对齐 antd 的 fixed-sider demo（PLATFORM 替换：Menu → 等价原生 ul/li）
import { Layout } from '@apollo-design/ui';

const { Header, Content, Footer, Sider } = Layout;

const navItems = ['nav 1', 'nav 2', 'nav 3'];
<\/script>

<template>
  <Layout>
    <Sider class="demo-layout-fixed-sider">
      <div class="demo-layout-logo-vertical" />
      <ul class="demo-menu demo-menu-dark demo-menu-inline">
        <li v-for="item in navItems" :key="item" class="demo-menu-item">{{ item }}</li>
      </ul>
    </Sider>
    <Layout>
      <Header class="demo-layout-header" />
      <Content class="demo-layout-content">
        <div class="demo-layout-card">Content</div>
      </Content>
      <Footer class="demo-layout-footer">Ant Design ©2026 Created by Ant UED</Footer>
    </Layout>
  </Layout>
</template>

<style scoped>
.demo-layout-fixed-sider {
  overflow: auto;
  height: 100vh;
  position: sticky;
  top: 0;
  inset-inline-start: 0;
}
.demo-layout-logo-vertical {
  height: 32px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
}
.demo-layout-header {
  padding: 0;
  background: #fff;
}
.demo-layout-content {
  margin: 24px 16px 0;
  padding-inline: 24px;
}
.demo-layout-card {
  min-height: 360px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}
.demo-layout-footer {
  text-align: center;
}
.demo-menu {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}
.demo-menu-inline {
  flex-direction: column;
  gap: 4px;
  padding: 8px;
}
.demo-menu-item {
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.demo-menu-dark .demo-menu-item {
  color: rgba(255, 255, 255, 0.65);
}
</style>
`;export{n as default};
